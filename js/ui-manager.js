/* ArenaFlow UI Manager & Orchestrator */

class ArenaFlowUIManager {
  constructor(aiEngine, mapRenderer) {
    this.ai = aiEngine;
    this.map = mapRenderer;
    this.currentView = 'ops'; // 'ops' or 'fan'
    this.selectedLanguage = 'en';
    
    // Fan Context
    this.fanContext = {
      accessibilityNeeded: false,
      ticketSection: 118,
      currentGate: 'Gate A'
    };

    // Telemetry State
    this.telemetry = { ...SUSTAINABILITY_TELEMETRY };
    this.fanCO2Total = 0.0;
  }

  init() {
    this.setupViewSwitching();
    this.setupFanPortal();
    this.setupOperationsCenter();
    this.setupAccessibilitySettings();
    this.startTelemetrySimulation();
    
    // Initial renders
    this.renderSustainability();
    this.appendSystemLog("System initialized. Monitoring MetLife Arena telemetry.", "success");
  }

  setupViewSwitching() {
    const navItems = document.querySelectorAll('.menu-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (!view) return;

        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Toggle Views
        document.getElementById('view-ops').style.display = view === 'ops' ? 'grid' : 'none';
        document.getElementById('view-fan').style.display = view === 'fan' ? 'grid' : 'none';
        this.currentView = view;

        // Re-init map on container resize/show
        setTimeout(() => {
          this.map.init();
        }, 100);
      });
    });
  }

  setupFanPortal() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const voiceBtn = document.getElementById('btn-voice');
    const btnSend = document.getElementById('btn-send');
    const suggestionsBox = document.getElementById('chat-suggestions');
    const accessToggle = document.getElementById('fan-access-toggle');
    const secSelect = document.getElementById('fan-section-select');
    const gateSelect = document.getElementById('fan-gate-select');
    const langSelect = document.getElementById('fan-lang-select');

    // Section/Gate changes update context
    if (secSelect) {
      secSelect.addEventListener('change', (e) => {
        this.fanContext.ticketSection = parseInt(e.target.value);
        this.appendSystemLog(`Fan seating updated to Section ${this.fanContext.ticketSection}`, "info");
      });
    }

    if (gateSelect) {
      gateSelect.addEventListener('change', (e) => {
        this.fanContext.currentGate = e.target.value;
      });
    }

    if (accessToggle) {
      accessToggle.addEventListener('change', (e) => {
        this.fanContext.accessibilityNeeded = e.target.checked;
        this.appendSystemLog(`Accessibility support mode: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, "info");
      });
    }

    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.selectedLanguage = e.target.value;
        const responsePkg = this.ai.processFanQuery('hello', this.selectedLanguage, this.fanContext);
        this.appendAIMessage(responsePkg.response);
      });
    }

    // Submit chat
    const handleChatSubmit = (e) => {
      if (e) e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      this.appendUserMessage(text);
      chatInput.value = '';
      this.showTypingIndicator();

      setTimeout(() => {
        this.removeTypingIndicator();
        const responsePkg = this.ai.processFanQuery(text, this.selectedLanguage, this.fanContext);
        this.appendAIMessage(responsePkg.response);
        this.map.applyHighlight(responsePkg.highlightMap);
        this.renderSuggestions(responsePkg.suggestions);
      }, 800);
    };

    if (chatForm) chatForm.addEventListener('submit', handleChatSubmit);
    if (btnSend) btnSend.addEventListener('click', handleChatSubmit);

    // Mock Voice Assistance
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        this.appendSystemLog("Microphone activated. Listening...", "info");
        voiceBtn.style.background = 'var(--color-danger)';
        voiceBtn.innerHTML = '🎤 Listening...';
        
        setTimeout(() => {
          voiceBtn.style.background = '';
          voiceBtn.innerHTML = '🎤 Mic';
          
          let mockSpeech = "Where is wheelchair access?";
          if (this.selectedLanguage === 'es') mockSpeech = "¿Dónde hay acceso para silla de ruedas?";
          if (this.selectedLanguage === 'fr') mockSpeech = "Où est l'accès handicapé ?";

          chatInput.value = mockSpeech;
          this.appendSystemLog("Voice recognized: " + mockSpeech, "success");
        }, 2000);
      });
    }

    // Initialize suggestions
    this.renderSuggestions(["Where is Section 118?", "Find vegan food", "Elevator locations"]);
  }

  setupOperationsCenter() {
    const incidentSelect = document.getElementById('ops-incident-select');
    const btnTrigger = document.getElementById('ops-trigger-incident');
    const customReportInput = document.getElementById('ops-custom-report');
    const btnCustomTrigger = document.getElementById('ops-trigger-custom');
    const btnBroadcast = document.getElementById('ops-send-broadcast');
    
    // Trigger presets
    if (btnTrigger && incidentSelect) {
      btnTrigger.addEventListener('click', () => {
        const val = incidentSelect.value;
        const inc = PRESET_INCIDENTS[val];
        if (!inc) return;

        this.processIncidentResolution(inc);
      });
    }

    // Trigger custom incident reports
    if (btnCustomTrigger && customReportInput) {
      btnCustomTrigger.addEventListener('click', () => {
        const val = customReportInput.value.trim();
        if (!val) return;

        const customIncident = {
          id: "INC-" + Math.floor(Math.random() * 900 + 100),
          title: "Report: " + val.substring(0, 30) + "...",
          type: val.toLowerCase().includes('traffic') || val.toLowerCase().includes('bus') ? 'Transportation' : 'Crowd Management',
          severity: val.toLowerCase().includes('fire') || val.toLowerCase().includes('injury') || val.toLowerCase().includes('storm') ? 'High' : 'Medium',
          location: 'Reported Spot',
          details: val
        };

        this.processIncidentResolution(customIncident);
        customReportInput.value = '';
      });
    }

    // Broadcast announcement
    if (btnBroadcast) {
      btnBroadcast.addEventListener('click', () => {
        const activeTextEl = document.querySelector('.incident-broadcast-box p:not([style*="display: none"])');
        const text = activeTextEl ? activeTextEl.textContent : "ALERT: General Operations Announcement.";
        this.appendSystemLog(`[STADIUM BROADCAST]: "${text}"`, "critical");
        
        // Render globally in a visual alert box
        const announceBanner = document.getElementById('global-announcement-banner');
        if (announceBanner) {
          announceBanner.style.display = 'block';
          announceBanner.innerHTML = `<strong>⚠️ BROADCASTED:</strong> ${text}`;
          
          setTimeout(() => {
            announceBanner.style.display = 'none';
          }, 8000);
        }
      });
    }
  }

  processIncidentResolution(incident) {
    this.appendSystemLog(`AI Incident Command engaged for ${incident.id}: ${incident.title}`, "warning");
    
    // Call AI to solve incident
    const resolution = this.ai.solveIncident(incident);

    // Apply simulation side-effects to Map & Stats
    if (incident.id === 'INC-101') { // Gate A bottleneck
      this.map.updateSectorCrowd('sec-east', 95);
      GATES_DATA['Gate A'].crowdLevel = 98;
      GATES_DATA['Gate A'].status = 'Critical';
      GATES_DATA['Gate B'].crowdLevel = 75; // Traffic shifts
      this.map.init();
      
      // Highlight redirected path
      this.map.applyHighlight({ type: 'route', from: 'Gate A', to: 'Section 118', accessible: false });
    } else if (incident.id === 'INC-102') { // Elevator outage
      this.map.applyHighlight({ type: 'route', from: 'Gate D', to: 'Section 202', accessible: true });
    } else if (incident.id === 'INC-103') { // Severe Weather
      document.querySelectorAll('.map-sector').forEach(s => s.setAttribute('fill', 'rgba(255, 82, 82, 0.2)'));
      this.appendSystemLog("Directing canopy closure (Est: 12 minutes).", "info");
    }

    // Render Chain of Thought
    const cotBox = document.getElementById('cot-reasoning');
    if (cotBox) {
      cotBox.innerHTML = `<h5>🧠 AI Reasoning (Chain-of-Thought)</h5>
                          <pre style="white-space: pre-wrap; font-family: var(--font-body); font-size: 0.85rem; color: var(--color-brand-primary); margin-top: 8px;">${resolution.chainOfThought}</pre>`;
    }

    // Render SOP Checklist
    const sopBox = document.getElementById('sop-tasks');
    if (sopBox) {
      sopBox.innerHTML = resolution.actionPlan.map(task => `
        <li class="incident-sop-item">
          <span class="incident-sop-check">⚡</span>
          <span>${task}</span>
        </li>
      `).join('');
    }

    // Render Dispatches
    const dispatchBox = document.getElementById('dispatch-list');
    if (dispatchBox) {
      dispatchBox.innerHTML = resolution.dispatches.map((d, index) => `
        <div class="log-item log-${d.priority === 'Critical' ? 'critical' : d.priority === 'High' ? 'warning' : 'info'}" id="dispatch-item-${index}">
          <div>
            <strong>${d.team} (${d.unit})</strong> @ ${d.location}<br/>
            <span style="font-size: 0.8rem; color: var(--color-text-secondary);">${d.task}</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end;">
            <span class="status-badge" style="background: rgba(255, 82, 82, 0.1); border-color: rgba(255, 82, 82, 0.3); color: var(--color-danger);">${d.priority}</span>
            <button class="btn btn-secondary" style="font-size: 0.65rem; padding: 2px 6px; margin-top: 4px;" onclick="window.ui.resolveDispatch('${incident.id}', ${index})">Resolve</button>
          </div>
        </div>
      `).join('');
    }

    // Render Translations Tabs
    const translationBox = document.getElementById('broadcast-translations');
    if (translationBox) {
      translationBox.innerHTML = `
        <div class="localization-tabs">
          <button class="loc-tab active" onclick="window.ui.switchBroadcastLang('en')">EN</button>
          <button class="loc-tab" onclick="window.ui.switchBroadcastLang('es')">ES</button>
          <button class="loc-tab" onclick="window.ui.switchBroadcastLang('fr')">FR</button>
        </div>
        <div class="incident-broadcast-box" style="background: rgba(255, 255, 255, 0.05); padding: var(--spacing-sm); border-radius: var(--radius-sm);">
          <p id="broadcast-txt-en" style="margin: 0; font-size: 0.9rem;">${resolution.broadcasts.en}</p>
          <p id="broadcast-txt-es" style="margin: 0; font-size: 0.9rem; display: none;">${resolution.broadcasts.es}</p>
          <p id="broadcast-txt-fr" style="margin: 0; font-size: 0.9rem; display: none;">${resolution.broadcasts.fr}</p>
        </div>
      `;
    }
  }

  switchBroadcastLang(lang) {
    const tabs = document.querySelectorAll('.loc-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.textContent.toLowerCase() === lang);
    });

    ['en', 'es', 'fr'].forEach(l => {
      const el = document.getElementById(`broadcast-txt-${l}`);
      if (el) el.style.display = l === lang ? 'block' : 'none';
    });
  }

  setupAccessibilitySettings() {
    const btnContrast = document.getElementById('btn-contrast-toggle');
    const btnTextSize = document.getElementById('btn-text-size');

    if (btnContrast) {
      btnContrast.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
        const active = document.body.classList.contains('high-contrast');
        btnContrast.style.border = active ? '2px solid var(--color-brand-primary)' : '';
        this.appendSystemLog(`High Contrast Mode: ${active ? 'ON' : 'OFF'}`, "info");
      });
    }

    if (btnTextSize) {
      btnTextSize.addEventListener('click', () => {
        let size = document.body.style.fontSize;
        if (!size || size === '100%') {
          document.body.style.fontSize = '115%';
          btnTextSize.textContent = 'Text: Large';
        } else if (size === '115%') {
          document.body.style.fontSize = '130%';
          btnTextSize.textContent = 'Text: Extra Large';
        } else {
          document.body.style.fontSize = '100%';
          btnTextSize.textContent = 'Text: Standard';
        }
      });
    }
  }

  startTelemetrySimulation() {
    // Updates values every 5 seconds to show a responsive stadium system
    setInterval(() => {
      // Solar variation based on time
      const hour = new Date().getHours();
      let sunMultiplier = 1.0;
      if (hour < 6 || hour > 19) sunMultiplier = 0.05;
      else if (hour > 10 && hour < 15) sunMultiplier = 1.3;
      
      this.telemetry.solarGeneration = Math.round(300 + (Math.random() * 80 - 40) * sunMultiplier);
      this.telemetry.waterSaved += Math.floor(Math.random() * 5 + 2);
      this.telemetry.energySaved += Math.floor(Math.random() * 4 + 1);
      
      // Gate fluctuations
      Object.keys(GATES_DATA).forEach(g => {
        const drift = Math.floor(Math.random() * 7 - 3);
        GATES_DATA[g].crowdLevel = Math.max(10, Math.min(99, GATES_DATA[g].crowdLevel + drift));
        GATES_DATA[g].scanRate = Math.max(5, Math.min(60, GATES_DATA[g].scanRate + Math.floor(drift / 2)));
      });

      this.renderSustainability();
      this.updateOperationsTicker();
    }, 5000);
  }

  renderSustainability() {
    // Render Telemetry parameters
    const txtSolar = document.getElementById('telemetry-solar');
    const txtWater = document.getElementById('telemetry-water');
    const txtEnergy = document.getElementById('telemetry-energy');
    const barWaste = document.getElementById('bar-waste-diversion');
    const txtWasteVal = document.getElementById('waste-value-text');

    if (txtSolar) txtSolar.textContent = this.telemetry.solarGeneration + " kW";
    if (txtWater) txtWater.textContent = this.telemetry.waterSaved.toLocaleString() + " Gallons";
    if (txtEnergy) txtEnergy.textContent = this.telemetry.energySaved.toLocaleString() + " kWh";
    
    if (barWaste) barWaste.style.width = this.telemetry.wasteDiverted + "%";
    if (txtWasteVal) txtWasteVal.textContent = this.telemetry.wasteDiverted + "%";

    // Re-generate AI recommendations
    const recsList = document.getElementById('sustainability-tips');
    if (recsList) {
      const recs = this.ai.generateSustainabilityRecommendations(this.telemetry);
      recsList.innerHTML = recs.map(r => `
        <div style="background: rgba(0, 230, 118, 0.04); border: 1px solid rgba(0, 230, 118, 0.15); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs);">
          <strong style="color: var(--color-success); font-size: 0.85rem;">🌱 ${r.title}</strong>
          <p style="font-size: 0.75rem; margin-top: 2px; color: var(--color-text-secondary);">${r.description}</p>
          <span style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic;">Potential Savings: ${r.savings}</span>
        </div>
      `).join('');
    }
  }

  updateOperationsTicker() {
    const list = document.getElementById('gates-list');
    if (!list) return;

    list.innerHTML = Object.keys(GATES_DATA).map(name => {
      const gate = GATES_DATA[name];
      const barColor = gate.crowdLevel > 80 ? 'fill-danger' : gate.crowdLevel > 50 ? 'fill-warning' : 'fill-primary';
      return `
        <div class="progress-container" style="background: rgba(255, 255, 255, 0.02); padding: var(--spacing-sm); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs);">
          <div class="progress-label-row">
            <span><strong>${name}</strong> (${gate.access})</span>
            <span>${gate.crowdLevel}% density (${gate.scanRate} scans/min)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${barColor}" style="width: ${gate.crowdLevel}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderSuggestions(suggestions) {
    const suggestionsBox = document.getElementById('chat-suggestions');
    if (!suggestionsBox) return;

    suggestionsBox.innerHTML = suggestions.map(s => `
      <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 4px 10px;" onclick="window.ui.handleSuggestionClick('${s.replace(/'/g, "\\'")}')">${s}</button>
    `).join('');
  }

  handleSuggestionClick(text) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = text;
      // Trigger submission
      const btnSend = document.getElementById('btn-send');
      if (btnSend) btnSend.click();
    }
  }

  appendUserMessage(text) {
    const container = document.getElementById('chat-box-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-message message-user';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  appendAIMessage(text) {
    const container = document.getElementById('chat-box-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-message message-ai';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  showTypingIndicator() {
    const container = document.getElementById('chat-box-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-message message-ai';
    div.id = 'chat-typing-indicator';
    div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) indicator.remove();
  }

  appendSystemLog(text, severity = 'info') {
    const logBox = document.getElementById('ops-system-logs');
    if (!logBox) return;

    const timestamp = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-item log-${severity} animate-slide-down`;
    div.innerHTML = `
      <span><strong>[${timestamp}]</strong> ${text}</span>
      <span style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.8;">${severity}</span>
    `;
    logBox.insertBefore(div, logBox.firstChild);
  }

  /**
   * Simulates resolving an active dispatch ticket, updating telemetry metrics back to optimal.
   */
  resolveDispatch(incidentId, index) {
    const el = document.getElementById(`dispatch-item-${index}`);
    if (el) {
      el.remove();
    }
    
    this.appendSystemLog(`Dispatch team resolved task for ${incidentId}`, "success");

    if (incidentId === 'INC-101') {
      GATES_DATA['Gate A'].crowdLevel = 35;
      GATES_DATA['Gate A'].status = 'Optimal';
      GATES_DATA['Gate A'].scanRate = 32;
      this.map.updateSectorCrowd('sec-east', 35);
      this.map.init();
      this.map.applyHighlight(null);
      this.appendSystemLog("Gate A local network routers repaired. Crowd levels normalized.", "success");
    } else if (incidentId === 'INC-102') {
      this.map.applyHighlight(null);
      this.appendSystemLog("North stand Lift #3 mechanical repairs completed. Elevators active.", "success");
    } else if (incidentId === 'INC-103') {
      document.querySelectorAll('.map-sector').forEach(s => {
        s.removeAttribute('style');
        s.setAttribute('fill', 'rgba(0, 242, 254, 0.15)');
      });
      this.map.init();
      this.map.applyHighlight(null);
      this.appendSystemLog("Lightning warning cleared. Concourse evacuations canceled.", "success");
    } else if (incidentId === 'INC-104') {
      this.appendSystemLog("Shuttle route cleared of traffic. Shuttle frequency restored.", "success");
    }
    
    this.updateOperationsTicker();
  }

  /**
   * Logs a user-initiated Eco-Action and updates CO2 offsets and badge levels.
   */
  handleEcoActionLog(actionId) {
    this.appendUserMessage(`Sustainability log: Submitting action ${actionId}...`);
    this.showTypingIndicator();
    
    setTimeout(() => {
      this.removeTypingIndicator();
      const result = this.ai.logEcoAction(actionId, this.fanCO2Total);
      this.fanCO2Total = result.newTotal;
      this.appendAIMessage(result.message);

      // Increment water saved dynamically if it is a water action
      if (actionId === 'eco-4') {
        this.telemetry.waterSaved += 1;
      }
      this.telemetry.carbonFootprintOffset += Math.round(result.offset * 10);
      
      this.renderSustainability();
      this.appendSystemLog(`Fan logged eco-action: ${result.challenge.title}. Total offset: ${this.fanCO2Total.toFixed(2)} kg`, "success");
    }, 600);
  }

  /**
   * Recommends food options and highlights routes on the map.
   */
  handleFoodFinderSelection(preference) {
    this.appendUserMessage(`Food Finder: Looking for ${preference} options...`);
    this.showTypingIndicator();
    
    setTimeout(() => {
      this.removeTypingIndicator();
      const result = this.ai.findBestConcession(preference, this.fanContext.ticketSection);
      this.appendAIMessage(result.response);
      this.map.applyHighlight(result.highlightMap);
    }, 600);
  }
}

// Export definitions for browser loading or module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArenaFlowUIManager;
}
