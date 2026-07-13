/* Unit test suite for ArenaFlow GenAI Reasoning Engine */

const assert = require('assert');
const data = require('../js/data.js');

// Bind data variables to global scope so ai-engine can read them in the Node environment
global.MULTILINGUAL_DATABASE = data.MULTILINGUAL_DATABASE;
global.RESTROOMS_DATA = data.RESTROOMS_DATA;
global.GATES_DATA = data.GATES_DATA;
global.SUSTAINABILITY_TELEMETRY = data.SUSTAINABILITY_TELEMETRY;

const ArenaFlowAIEngine = require('../js/ai-engine.js');

let testCount = 0;
let successCount = 0;

function runTest(name, fn) {
  testCount++;
  try {
    fn();
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
    successCount++;
  } catch (err) {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${name}`);
    console.error(err);
  }
}

console.log("\x1b[35m=== RUNNING ARENAFLOW AI ENGINE TESTS ===\x1b[0m\n");

const engine = new ArenaFlowAIEngine();

// 1. Test Intent Classification
runTest("Intent - Seating Navigation", () => {
  const result = engine.processFanQuery("where is section 118?");
  assert.strictEqual(result.intent, "navigation");
  assert.ok(result.response.includes("Section 118"));
});

runTest("Intent - Vegan Food Selection", () => {
  const result = engine.processFanQuery("find some vegan food or concession stands");
  assert.strictEqual(result.intent, "food");
  assert.ok(result.response.includes("Verde Taqueria"));
});

runTest("Intent - Restroom Locations", () => {
  const result = engine.processFanQuery("I need a restroom bathroom");
  assert.strictEqual(result.intent, "restroom");
});

runTest("Intent - Transit & Parking", () => {
  const result = engine.processFanQuery("shuttle bus rideshare");
  assert.strictEqual(result.intent, "transit");
  assert.ok(result.response.includes("Zone B"));
});

runTest("Intent - Sustainability Instructions", () => {
  const result = engine.processFanQuery("what is your sustainability policy or recycling?");
  assert.strictEqual(result.intent, "sustainability");
  assert.ok(result.response.includes("renewable energy"));
});

// 2. Test Accessibility Modifications
runTest("Contextual Accessibility Override", () => {
  const normalResult = engine.processFanQuery("where is my seat?", "en", { ticketSection: 118, accessibilityNeeded: false });
  const accessResult = engine.processFanQuery("where is my seat?", "en", { ticketSection: 118, accessibilityNeeded: true });
  
  assert.ok(!normalResult.response.includes("Elevators are located"));
  assert.ok(accessResult.response.includes("Elevators are located"));
  assert.strictEqual(accessResult.highlightMap.accessible, true);
});

// 3. Test Multilingual Translations
runTest("Multilingual - Spanish Language", () => {
  const result = engine.processFanQuery("find seat", "es", { ticketSection: 118 });
  assert.strictEqual(result.language, "es");
  assert.ok(result.response.includes("Sección 118"));
  assert.ok(result.response.includes("escalera mecánica"));
});

runTest("Multilingual - French Language", () => {
  const result = engine.processFanQuery("find seat", "fr", { ticketSection: 105 });
  assert.strictEqual(result.language, "fr");
  assert.ok(result.response.includes("Gate B"));
});

// 4. Test Incident Decision Support
runTest("Incident Command - Gate Bottleneck", () => {
  const gateIncident = {
    id: "INC-101",
    title: "Crowd Bottleneck at Gate A",
    type: "Crowd Management",
    severity: "High",
    location: "Gate A",
    details: "Wait times exceeded 35 minutes"
  };

  const solution = engine.solveIncident(gateIncident);
  
  assert.strictEqual(solution.incidentId, "INC-101");
  assert.strictEqual(solution.severity, "High");
  assert.ok(solution.chainOfThought.includes("[ANALYSIS]"));
  assert.ok(solution.actionPlan.length > 0);
  assert.ok(solution.broadcasts.es.includes("Puerta A"));
  assert.strictEqual(solution.dispatches[0].team, "Crowd Safety");
});

runTest("Incident Command - Elevator Malfunction", () => {
  const liftIncident = {
    id: "INC-102",
    title: "Elevator Outage",
    type: "Accessibility",
    severity: "Medium",
    location: "Section 202 Lift Hub"
  };

  const solution = engine.solveIncident(liftIncident);
  assert.strictEqual(solution.incidentId, "INC-102");
  assert.ok(solution.chainOfThought.includes("service elevator"));
  assert.ok(solution.dispatches.find(d => d.team === "Accessibility Escort"));
});

// Summary Report
console.log(`\n\x1b[35m=== TEST SUMMARY ===\x1b[0m`);
console.log(`Total: ${testCount} | Passed: ${successCount} | Failed: ${testCount - successCount}`);

if (successCount === testCount) {
  console.log("\n\x1b[32m✔ ALL TESTS PASSED SUCCESSFULLY!\x1b[0m\n");
  process.exit(0);
} else {
  console.error("\n\x1b[31m✘ SOME TESTS FAILED!\x1b[0m\n");
  process.exit(1);
}
