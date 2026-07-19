'use strict';

/* App entry point and bootstrapping */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize AI Engine
  const aiEngine = new ArenaFlowAIEngine();

  // 2. Initialize SVG Map Renderer
  const mapRenderer = new StadiumMapRenderer('stadium-svg');
  mapRenderer.init();

  // 3. Initialize UI Orchestrator
  const uiManager = new ArenaFlowUIManager(aiEngine, mapRenderer);
  uiManager.init();

  // 4. Attach to global scope for HTML event listeners (e.g. onclick handlers)
  window.ui = uiManager;

  // Render initial gates density display
  uiManager.updateOperationsTicker();
  
  // Set initial welcome chat message in Fan Portal
  uiManager.appendAIMessage(aiEngine.processFanQuery('hello').response);
});
