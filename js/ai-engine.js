/* ArenaFlow GenAI Simulation & Reasoning Engine */

class ArenaFlowAIEngine {
  constructor() {
    this.currentLanguage = 'en';
  }

  /**
   * Translates or returns contextual response for a Fan Query.
   * @param {string} query - The user's input string.
   * @param {string} lang - Selected language code ('en', 'es', 'fr', 'pt', 'ar').
   * @param {object} context - User attributes like { accessibilityNeeded: boolean, currentGate: string, ticketSection: number }
   * @returns {object} Response package containing text reply, parsed intent, and UI action metadata.
   */
  processFanQuery(query, lang = 'en', context = {}) {
    const cleanQuery = query.toLowerCase().trim();
    this.currentLanguage = MULTILINGUAL_DATABASE[lang] ? lang : 'en';
    const db = MULTILINGUAL_DATABASE[this.currentLanguage];
    
    let intent = 'unknown';
    let textResponse = '';
    let highlightMap = {};
    let suggestions = [];

    // 1. INTENT REGEX CLASSIFICATION
    if (cleanQuery.includes('seat') || cleanQuery.includes('section') || cleanQuery.includes('find my') || cleanQuery.includes('ticket')) {
      intent = 'navigation';
    } else if (cleanQuery.includes('vegan') || cleanQuery.includes('food') || cleanQuery.includes('eat') || cleanQuery.includes('hungry') || cleanQuery.includes('concession')) {
      intent = 'food';
    } else if (cleanQuery.includes('restroom') || cleanQuery.includes('toilet') || cleanQuery.includes('bathroom') || cleanQuery.includes('wc')) {
      intent = 'restroom';
    } else if (cleanQuery.includes('shuttle') || cleanQuery.includes('rideshare') || cleanQuery.includes('uber') || cleanQuery.includes('parking') || cleanQuery.includes('transit') || cleanQuery.includes('bus') || cleanQuery.includes('train')) {
      intent = 'transit';
    } else if (cleanQuery.includes('recycle') || cleanQuery.includes('sustainability') || cleanQuery.includes('green') || cleanQuery.includes('carbon') || cleanQuery.includes('solar')) {
      intent = 'sustainability';
    } else if (cleanQuery.includes('wheelchair') || cleanQuery.includes('sensory') || cleanQuery.includes('elevator') || cleanQuery.includes('accessible') || cleanQuery.includes('disability') || cleanQuery.includes('lift')) {
      intent = 'accessibility';
    }

    // 2. CONTEXTUAL REASONING LOGIC & RESPONSE COMPILATION
    const ticketSec = context.ticketSection || 118;
    const currentGate = context.currentGate || 'Gate A';
    const isAccessible = context.accessibilityNeeded || false;

    switch (intent) {
      case 'navigation':
        // Determine entry gate and level based on section
        const gate = ticketSec > 130 ? 'Gate D' : (ticketSec > 115 ? 'Gate C' : 'Gate B');
        const level = ticketSec > 200 ? 2 : 1;
        
        textResponse = db.nav_to_seat
          .replace('{section}', ticketSec)
          .replace('{gate}', gate)
          .replace('{level}', level);

        if (isAccessible) {
          textResponse += ` ` + (this.currentLanguage === 'en' 
            ? "Note: Elevators are located immediately to the left of the entry gate for step-free access." 
            : this.currentLanguage === 'es'
            ? "Nota: Los ascensores se encuentran inmediatamente a la izquierda de la puerta de entrada para acceso sin escalones."
            : "Note: Des ascenseurs sont situés immédiatement à gauche de la porte d'entrée pour un accès sans marche.");
        }

        highlightMap = { type: 'route', from: currentGate, to: `Section ${ticketSec}`, accessible: isAccessible };
        suggestions = ["Where is food near Section " + ticketSec, "Closest restroom", "Show route on map"];
        break;

      case 'food':
        textResponse = db.food_vegan.replace('{section}', ticketSec);
        highlightMap = { type: 'concessions', filter: 'vegan' };
        suggestions = ["Show all food options", "What are the line lengths?", "Go to sustainability"];
        break;

      case 'restroom':
        // Find closest restroom
        const targetRestroom = RESTROOMS_DATA.find(r => isAccessible ? r.accessible : true) || RESTROOMS_DATA[0];
        textResponse = db.restroom_closest.replace('{section}', targetRestroom.section);
        highlightMap = { type: 'restrooms', id: targetRestroom.id };
        suggestions = ["Find food near Section " + targetRestroom.section, "View queue times"];
        break;

      case 'transit':
        textResponse = db.transit_info;
        highlightMap = { type: 'transport', hub: 'Zone B' };
        suggestions = ["Shuttle schedule", "Parking spaces left", "Rideshare pricing"];
        break;

      case 'sustainability':
        textResponse = db.sustainability;
        highlightMap = { type: 'sustainability-bins' };
        suggestions = ["Show solar generation", "How much water is saved today?"];
        break;

      case 'accessibility':
        textResponse = db.accessibility_guide;
        highlightMap = { type: 'accessibility', zones: ['Gate D', 'Sensory Room'] };
        suggestions = ["Request wheelchair assistance", "Accessible food stands"];
        break;

      default:
        textResponse = db.welcome;
        suggestions = ["Where is Section 118?", "Find vegan food", "How do I get to Rideshare Zone?"];
    }

    return {
      query,
      intent,
      response: textResponse,
      highlightMap,
      suggestions,
      language: this.currentLanguage
    };
  }

  /**
   * Simulates a Multi-Step chain-of-thought AI planner responding to stadium incidents.
   * @param {object} incident - The incident object from PRESET_INCIDENTS or custom user-input
   * @returns {object} Action plan package containing reasoning, task items, translations, and dispatches.
   */
  solveIncident(incident) {
    let chainOfThought = "";
    let actionPlan = [];
    let broadcasts = {};
    let dispatches = [];

    // Analyze incident severity and type to formulate a solution
    if (incident.type === "Crowd Management") {
      chainOfThought = `[ANALYSIS]: Crowds at Gate A are bottlenecked due to scanner network outage. Scanning rates dropped to 5 items/min (Normal: 35/min). Crowd accumulation in the Plaza is at 95% capacity, posing a crushing risk.\n` +
                       `[STRATEGY]: 1. Route inbound traffic from East Parking Lot to Gate B (running at 30% load) and Gate D (running at 25% load).\n` +
                       `[STRATEGY]: 2. Direct Network Engineering team to reboot and patch the Gate A local router.\n` +
                       `[STRATEGY]: 3. Update public stadium boards to warn fans of delays at Gate A and offer navigation to Gate B.`;

      actionPlan = [
        "Deploy 6 mobile ticketing officers to Gate A outer plaza with handheld offline scanning devices.",
        "Change variable signage in East Lot to point new arrivals towards Gate B.",
        "Dispatch Network Engineering to Router Hub Gate A (ETA: 4 mins).",
        "Broadcast crowd flow update via stadium display system."
      ];

      broadcasts = {
        en: "ATTENTION FANS: Gate A is currently experiencing high wait times. Please divert to Gate B or Gate D for faster entry. Follow staff directions.",
        es: "ATENCIÓN AFICIONADOS: La Puerta A experimenta tiempos de espera altos. Diríjase a la Puerta B o Puerta D para un ingreso rápido.",
        fr: "ATTENTION SUPPORTERS : La Porte A connaît actuellement de longues attentes. Veuillez vous diriger vers la Porte B ou D."
      };

      dispatches = [
        { team: "Crowd Safety", unit: "Alpha-4", location: "Gate A Plaza", task: "Direct fans to Gate B", priority: "High" },
        { team: "Network Tech", unit: "Net-2", location: "Gate A Server Room", task: "Diagnose offline router switches", priority: "Critical" },
        { team: "Volunteers", unit: "Host-1", location: "East Parking Lot", task: "Reposition directional banners", priority: "Medium" }
      ];

    } else if (incident.type === "Accessibility") {
      chainOfThought = `[ANALYSIS]: Elevator #3 outage in North Stand Section 202 limits vertical transit. Section 202 serves a high density of accessible tickets. Stranded wheelchair users on Level 2 require priority assistance.\n` +
                       `[STRATEGY]: 1. Establish an alternative routing protocol using the service elevator in South Corridor.\n` +
                       `[STRATEGY]: 2. Deploy Accessibility Champions to physically escort spectators from Section 202 to the service elevator.\n` +
                       `[STRATEGY]: 3. Notify elevator maintenance vendor of immediate breakdown.`;

      actionPlan = [
        "Transition Section 202 Service Elevator 2A from vendor-only to passenger service.",
        "Deploy 3 volunteer escorts to the Level 2 elevator foyer to guide stranded users.",
        "Contact OTIS dispatch team with diagnostic code E-301 (Elevator 3).",
        "Instruct Security team to keep the access corridors to Service Elevator 2A clear of cargo."
      ];

      broadcasts = {
        en: "STADIUM ADVISORY: Lift #3 (North Stand) is undergoing quick maintenance. Wheelchair users near Sec 202, please contact nearby stewards for service lift access.",
        es: "AVISO DEL ESTADIO: El ascensor #3 está en mantenimiento. Usuarios de sillas de ruedas en Sec 202, soliciten ayuda para el ascensor de servicio.",
        fr: "INFO STADE : L'ascenseur #3 est en maintenance. Supporters en fauteuil (Sec 202), contactez les stewards pour l'accès monte-charge."
      };

      dispatches = [
        { team: "Accessibility Escort", unit: "Access-1", location: "Section 202 L2 Foyer", task: "Escort fans to Service Lift 2A", priority: "High" },
        { team: "Maintenance", unit: "Elevator-Tech", location: "North Lift Machine Room", task: "Repair Otis Elevator #3", priority: "Critical" }
      ];

    } else if (incident.type === "Safety") {
      chainOfThought = `[ANALYSIS]: High lightning strike potential detected within a 5-mile radius. In accordance with FIFA Safety Protocol Sec 9.4, open plazas and stands must be evacuated. Stadium roof canopy is structurally closed.\n` +
                       `[STRATEGY]: 1. Instruct spectators in open plaza areas to seek shelter in the lower concourses.\n` +
                       `[STRATEGY]: 2. Delay outer plaza gates and hold fans in covered staging areas.\n` +
                       `[STRATEGY]: 3. Broadcast emergency safety warnings in all official languages.`;

      actionPlan = [
        "Activate stadium roof canopy closure sequence (12-minute closing cycle).",
        "Pause all ticket scanning at open external gates (Gate A/C Plazas).",
        "Deploy public safety alerts on all concourse television systems.",
        "Open inner concourse gates to speed shelter-seeking."
      ];

      broadcasts = {
        en: "SAFETY ALERT: Inclement weather approaching. All fans in open plazas should move to the nearest covered concourse areas immediately.",
        es: "ALERTA DE SEGURIDAD: Se acerca tormenta eléctrica. Todos los aficionados en las plazas abiertas deben ingresar a los pasillos cubiertos ya.",
        fr: "ALERTE SÉCURITÉ : Risque de foudre. Tous les supporters situés dans les espaces ouverts doivent se mettre à l'abri dans les coursives couvertes."
      };

      dispatches = [
        { team: "Stadium Security", unit: "Evac-Lead", location: "Outer Plazas", task: "Direct fans inside cover", priority: "Critical" },
        { team: "Operations Facility", unit: "Roof-Ops", location: "Control Tower", task: "Confirm full roof seal lock", priority: "Critical" }
      ];

    } else {
      // Default / Generic Incident or Transportation Delay
      chainOfThought = `[ANALYSIS]: Delay in shuttle transport from Rideshare Hub B due to traffic congestion on outer highway Route 120.\n` +
                       `[STRATEGY]: 1. Re-route Shuttles via the South Emergency Access lane to bypass Route 120 bottlenecks.\n` +
                       `[STRATEGY]: 2. Update shuttle boarding queues with real-time ETA estimates to prevent stampedes.\n` +
                       `[STRATEGY]: 3. Coordinate with local traffic police to deploy priority signals at external intersections.`;

      actionPlan = [
        "Redirect Shuttle Fleet (Red & Blue lines) to the South Access Road.",
        "Update the transit info ticker in the Fan Portal app with delay warning.",
        "Contact City Traffic Control for priority signal sequencing at Crossroads 4 & 5."
      ];

      broadcasts = {
        en: "TRANSIT INFO: Shuttle services to Parking Lot C are delayed by 20 minutes. Please consider using the Express Train line or remain inside the concourse.",
        es: "INFORMACIÓN DE TRÁNSITO: Los traslados al Lote C se demoran 20 min. Considere usar el tren exprés o permanezca en los pasillos.",
        fr: "INFOS TRANSPORT : Navettes vers parking C retardées de 20 min. Privilégiez la ligne de train express ou patientez sous les coursives."
      };

      dispatches = [
        { team: "Transit Control", unit: "Shuttle-1", location: "Transit Loop North", task: "Reroute bus drivers to South Lane", priority: "High" },
        { team: "Traffic Police Liaison", unit: "Liaison-Ops", location: "Off-site Crossroads 4", task: "Request manual signal override", priority: "Medium" }
      ];
    }

    return {
      incidentId: incident.id,
      title: incident.title,
      type: incident.type,
      severity: incident.severity,
      chainOfThought,
      actionPlan,
      broadcasts,
      dispatches,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  /**
   * Generates AI suggestions for sustainability optimization.
   * @param {object} telemetry - Current telemetry metrics
   * @returns {array} List of AI-recommended actions
   */
  generateSustainabilityRecommendations(telemetry) {
    const recs = [];
    
    if (telemetry.solarGeneration > 300) {
      recs.push({
        title: "Renewable Power Optimization",
        description: `Solar production is highly efficient at ${telemetry.solarGeneration}kW. Recommend drawing 100% of HVAC ventilation load in the North and East stands from solar arrays rather than the municipal grid.`,
        savings: "Saves ~85 kWh/hr"
      });
    }
    
    if (telemetry.waterSaved < 20000) {
      recs.push({
        title: "Smart Washroom Sequencing",
        description: "Sensor data indicates peak crowd flow. Implement low-flow flush valve sequences in the primary restrooms (Sections 102 & 128) during match halftime.",
        savings: "Estimated 2,500 gallons saved per hour"
      });
    }

    if (telemetry.wasteDiverted < 85) {
      recs.push({
        title: "Targeted Waste Management",
        description: `Current waste diversion rate is ${telemetry.wasteDiverted}% (Target: 85%). Direct recycling ambassadors to Concessions 1 and 4 where composting bins are underutilized.`,
        savings: "Diverts an additional 300 lbs of plastic/food"
      });
    }

    return recs;
  }
}

// Export definitions for browser loading or module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArenaFlowAIEngine;
}
