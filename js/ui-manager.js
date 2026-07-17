'use strict';

/* ArenaFlow UI Manager & Orchestrator */

class ArenaFlowUIManager {
  /**
   * @param {ArenaFlowAIEngine} aiEngine - AI engine module instance.
   * @param {StadiumMapRenderer} mapRenderer - Map rendering module instance.
   */
  constructor(aiEngine, mapRenderer) {
    this.ai = aiEngine;
    this.map = mapRenderer;
    this.currentView = 'ops'; // 'ops' or 'fan'
    this.selectedLanguage = 'en';
    
    // Fan Seating & Routing Context
    this.fanContext = {
      accessibilityNeeded: false,
      ticketSection: 118,
      currentGate: 'Gate A'
    };

    // Telemetry Telecommunication simulation state
    this.telemetry = { ...SUSTAINABILITY_TELEMETRY };
    this.fanCO2Total = 0.0;

    // DOM cache dictionary to avoid redundant search queries in loops
    this.dom = {};
  }

  /**
   * Bootstraps UI events and telemetry simulation.
   */
  init() {
    this.cacheDOM();
    this.setupViewSwitching();
    this.setupFanPortal();
    this.setupOperationsCenter();
    this.setupAccessibilitySettings();
    this.startTelemetrySimulation();
    
    // Initial display renders
    this.renderSustainability();
    this.appendSystemLog("System initialized. Monitoring MetLife Arena telemetry.", "success");
  }

  /**
   * Caches all frequently-accessed DOM elements in a single place for rendering efficiency.
   */
  cacheDOM() {
    this.dom = {
      viewOps: document.getElementById('view-ops'),
      viewFan: document.getElementById('view-fan'),
      chatForm: document.getElementById('chat-form'),
      chatInput: document.getElementById('chat-input'),
      voiceBtn: document.getElementById('btn-voice'),
      btnSend: document.getElementById('btn-send'),
      suggestionsBox: document.getElementById('chat-suggestions'),
      accessToggle: document.getElementById('fan-access-toggle'),
      secSelect: document.getElementById('fan-section-select'),
      gateSelect: document.getElementById('fan-gate-select'),
      langSelect: document.getElementById('fan-lang-select'),
      cotBox: document.getElementById('cot-reasoning'),
      sopBox: document.getElementById('sop-tasks'),
      dispatchBox: document.getElementById('dispatch-list'),
      translationBox: document.getElementById('broadcast-translations'),
      contrastBtn: document.getElementById('btn-contrast-toggle'),
      textSizeBtn: document.getElementById('btn-text-size'),
      solarText: document.getElementById('telemetry-solar'),
      waterText: document.getElementById('telemetry-water'),
      energyText: document.getElementById('telemetry-energy'),
      wasteBar: document.getElementById('bar-waste-diversion'),
      wasteText: document.getElementById('waste-value-text'),
      sustainabilityTips: document.getElementById('sustainability-tips'),
      gatesList: document.getElementById('gates-list'),
      chatMessages: document.getElementById('chat-box-messages'),
      opsLogs: document.getElementById('ops-system-logs'),
      announceBanner: document.getElementById('global-announcement-banner')
    };
  }

  /**
   * Escapes HTML control characters to prevent Cross-Site Scripting (XSS) injections.
   * @param {string} str - Raw input text.
   * @returns {string} Sanitized string.
   */
  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  /**
   * Handles sidebar menu navigation tab switches.
   */
  setupViewSwitching() {
    const navItems = document.querySelectorAll('.menu-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (!view) return;

        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Toggle Views via cached references
        if (this.dom.viewOps) this.dom.viewOps.style.display = view === 'ops' ? 'grid' : 'none';
        if (this.dom.viewFan) this.dom.viewFan.style.display = view === 'fan' ? 'grid' : 'none';
        this.currentView = view;

        // Re-init map SVG nodes on display layout toggle
        setTimeout(() => {
          this.map.init();
        }, 100);
      });
    });
  }

  /**
   * Wires spectator options, language parameters, and chatbot inputs.
   */
  setupFanPortal() {
    // Section/Gate changes update context
    if (this.dom.secSelect) {
      this.dom.secSelect.addEventListener('change', (e) => {
        this.fanContext.ticketSection = parseInt(e.target.value, 10);
        this.appendSystemLog(`Fan seating updated to Section ${this.fanContext.ticketSection}`, "info");
      });
    }

    if (this.dom.gateSelect) {
      this.dom.gateSelect.addEventListener('change', (e) => {
        this.fanContext.currentGate = e.target.value;
      });
    }

    if (this.dom.accessToggle) {
      this.dom.accessToggle.addEventListener('change', (e) => {
        this.fanContext.accessibilityNeeded = e.target.checked;
        this.appendSystemLog(`Accessibility support mode: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, "info");
      });
    }

    if (this.dom.langSelect) {
      this.dom.langSelect.addEventListener('change', (e) => {
        this.selectedLanguage = e.target.value;
        const responsePkg = this.ai.processFanQuery('hello', this.selectedLanguage, this.fanContext);
        this.appendAIMessage(responsePkg.response, responsePkg.inferenceContext);
      });
    }

    // Submit chat
    const handleChatSubmit = (e) => {
      if (e) e.preventDefault();
      if (!this.dom.chatInput) return;
      
      const text = this.dom.chatInput.value.trim();
      if (!text) return;

      this.appendUserMessage(text);
      this.dom.chatInput.value = '';
      this.showTypingIndicator();

      setTimeout(() => {
        this.removeTypingIndicator();
        const responsePkg = this.ai.processFanQuery(text, this.selectedLanguage, this.fanContext);
        this.appendAIMessage(responsePkg.response, responsePkg.inferenceContext);
        this.map.applyHighlight(responsePkg.highlightMap);
        this.renderSuggestions(responsePkg.suggestions);
      }, 800);
    };

    if (this.dom.chatForm) this.dom.chatForm.addEventListener('submit', handleChatSubmit);
    if (this.dom.btnSend) this.dom.btnSend.addEventListener('click', handleChatSubmit);

    // Mock Voice Assistance recording triggers
    if (this.dom.voiceBtn) {
      this.dom.voiceBtn.addEventListener('click', () => {
        this.appendSystemLog("Microphone activated. Listening...", "info");
        this.dom.voiceBtn.style.background = 'var(--color-danger)';
        this.dom.voiceBtn.innerHTML = '🎤 Listening...';
        
        setTimeout(() => {
          if (this.dom.voiceBtn) {
            this.dom.voiceBtn.style.background = '';
            this.dom.voiceBtn.innerHTML = '🎤 Mic';
          }
          
          let mockSpeech = "Where is wheelchair access?";
          if (this.selectedLanguage === 'es') mockSpeech = "¿Dónde hay acceso para silla de ruedas?";
          if (this.selectedLanguage === 'fr') mockSpeech = "Où est l'accès handicapé ?";

          if (this.dom.chatInput) this.dom.chatInput.value = mockSpeech;
          this.appendSystemLog("Voice recognized: " + mockSpeech, "success");
        }, 2000);
      });
    }

    // Initialize suggestions
    this.renderSuggestions(["Where is Section 118?", "Find vegan food", "Elevator locations"]);
  }

  /**
   * Configures operations triggers, incident selectors, and broadcasts.
   */
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

    // Trigger custom reports (with strict HTML escaping)
    if (btnCustomTrigger && customReportInput) {
      btnCustomTrigger.addEventListener('click', () => {
        const rawVal = customReportInput.value.trim();
        if (!rawVal) return;

        const val = this.escapeHTML(rawVal);
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

    // Broadcast announcements
    if (btnBroadcast) {
      btnBroadcast.addEventListener('click', () => {
        const activeTextEl = document.querySelector('.incident-broadcast-box p:not([style*="display: none"])');
        const text = activeTextEl ? activeTextEl.textContent : "ALERT: General Operations Announcement.";
        this.appendSystemLog(`[STADIUM BROADCAST]: "${text}"`, "critical");
        
        // Render globally in a visual alert box
        if (this.dom.announceBanner) {
          this.dom.announceBanner.style.display = 'block';
          this.dom.announceBanner.textContent = `⚠️ BROADCASTED: ${text}`;
          
          setTimeout(() => {
            if (this.dom.announceBanner) this.dom.announceBanner.style.display = 'none';
          }, 8000);
        }
      });
    }
  }

  /**
   * Processes incident resolution logic, updates the map, and displays dispatches.
   * @param {object} incident - Incident information structure.
   */
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
      this.map.applyHighlight({ type: 'route', from: 'Gate A', to: 'Section 118', accessible: false });
    } else if (incident.id === 'INC-102') { // Elevator outage
      this.map.applyHighlight({ type: 'route', from: 'Gate D', to: 'Section 202', accessible: true });
    } else if (incident.id === 'INC-103') { // Severe Weather
      document.querySelectorAll('.map-sector').forEach(s => s.setAttribute('fill', 'rgba(255, 82, 82, 0.2)'));
      this.appendSystemLog("Directing canopy closure (Est: 12 minutes).", "info");
    }

    // Render Chain of Thought (escaped variables)
    if (this.dom.cotBox) {
      this.dom.cotBox.innerHTML = `<h5>🧠 AI Reasoning (Chain-of-Thought)</h5>
                                   <pre style="white-space: pre-wrap; font-family: var(--font-body); font-size: 0.85rem; color: var(--color-brand-primary); margin-top: 8px;">${this.escapeHTML(resolution.chainOfThought)}</pre>`;
    }

    // Render SOP Checklist
    if (this.dom.sopBox) {
      this.dom.sopBox.innerHTML = resolution.actionPlan.map(task => `
        <li class="incident-sop-item">
          <span class="incident-sop-check">⚡</span>
          <span>${this.escapeHTML(task)}</span>
        </li>
      `).join('');
    }

    // Render Dispatches with XSS escaping
    if (this.dom.dispatchBox) {
      this.dom.dispatchBox.innerHTML = resolution.dispatches.map((d, index) => `
        <div class="log-item log-${d.priority === 'Critical' ? 'critical' : d.priority === 'High' ? 'warning' : 'info'}" id="dispatch-item-${index}">
          <div>
            <strong>${this.escapeHTML(d.team)} (${this.escapeHTML(d.unit)})</strong> @ ${this.escapeHTML(d.location)}<br/>
            <span style="font-size: 0.8rem; color: var(--color-text-secondary);">${this.escapeHTML(d.task)}</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end;">
            <span class="status-badge" style="background: rgba(255, 82, 82, 0.1); border-color: rgba(255, 82, 82, 0.3); color: var(--color-danger);">${this.escapeHTML(d.priority)}</span>
            <button class="btn btn-secondary" style="font-size: 0.65rem; padding: 2px 6px; margin-top: 4px;" onclick="window.ui.resolveDispatch('${this.escapeHTML(incident.id)}', ${index})">Resolve</button>
          </div>
        </div>
      `).join('');
    }

    // Render Translations Tabs
    if (this.dom.translationBox) {
      this.dom.translationBox.innerHTML = `
        <div class="localization-tabs">
          <button class="loc-tab active" onclick="window.ui.switchBroadcastLang('en')">EN</button>
          <button class="loc-tab" onclick="window.ui.switchBroadcastLang('es')">ES</button>
          <button class="loc-tab" onclick="window.ui.switchBroadcastLang('fr')">FR</button>
        </div>
        <div class="incident-broadcast-box" style="background: rgba(255, 255, 255, 0.05); padding: var(--spacing-sm); border-radius: var(--radius-sm);">
          <p id="broadcast-txt-en" style="margin: 0; font-size: 0.9rem;">${this.escapeHTML(resolution.broadcasts.en)}</p>
          <p id="broadcast-txt-es" style="margin: 0; font-size: 0.9rem; display: none;">${this.escapeHTML(resolution.broadcasts.es)}</p>
          <p id="broadcast-txt-fr" style="margin: 0; font-size: 0.9rem; display: none;">${this.escapeHTML(resolution.broadcasts.fr)}</p>
        </div>
      `;
    }
  }

  /**
   * Toggles active broadcast message preview language.
   * @param {string} lang - Language code.
   */
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

  /**
   * Configures contrast settings and text sizes.
   */
  setupAccessibilitySettings() {
    if (this.dom.contrastBtn) {
      this.dom.contrastBtn.addEventListener('click', () => {
        document.body.classList.toggle('high-contrast');
        const active = document.body.classList.contains('high-contrast');
        this.dom.contrastBtn.style.border = active ? '2px solid var(--color-brand-primary)' : '';
        this.appendSystemLog(`High Contrast Mode: ${active ? 'ON' : 'OFF'}`, "info");
      });
    }

    if (this.dom.textSizeBtn) {
      this.dom.textSizeBtn.addEventListener('click', () => {
        const size = document.body.style.fontSize;
        if (!size || size === '100%') {
          document.body.style.fontSize = '115%';
          this.dom.textSizeBtn.textContent = 'Text: Large';
        } else if (size === '115%') {
          document.body.style.fontSize = '130%';
          this.dom.textSizeBtn.textContent = 'Text: Extra Large';
        } else {
          document.body.style.fontSize = '100%';
          this.dom.textSizeBtn.textContent = 'Text: Standard';
        }
      });
    }
  }

  /**
   * Triggers background telemetry cycles.
   */
  startTelemetrySimulation() {
    setInterval(() => {
      const hour = new Date().getHours();
      let sunMultiplier = 1.0;
      if (hour < 6 || hour > 19) sunMultiplier = 0.05;
      else if (hour > 10 && hour < 15) sunMultiplier = 1.3;
      
      this.telemetry.solarGeneration = Math.round(300 + (Math.random() * 80 - 40) * sunMultiplier);
      this.telemetry.waterSaved += Math.floor(Math.random() * 5 + 2);
      this.telemetry.energySaved += Math.floor(Math.random() * 4 + 1);
      
      Object.keys(GATES_DATA).forEach(g => {
        const drift = Math.floor(Math.random() * 7 - 3);
        GATES_DATA[g].crowdLevel = Math.max(10, Math.min(99, GATES_DATA[g].crowdLevel + drift));
        GATES_DATA[g].scanRate = Math.max(5, Math.min(60, GATES_DATA[g].scanRate + Math.floor(drift / 2)));
      });

      this.renderSustainability();
      this.updateOperationsTicker();
    }, 5000);
  }

  /**
   * Refreshes the sustainability widget layout.
   */
  renderSustainability() {
    if (this.dom.solarText) this.dom.solarText.textContent = this.telemetry.solarGeneration + " kW";
    if (this.dom.waterText) this.dom.waterText.textContent = this.telemetry.waterSaved.toLocaleString() + " Gallons";
    if (this.dom.energyText) this.dom.energyText.textContent = this.telemetry.energySaved.toLocaleString() + " kWh";
    
    if (this.dom.wasteBar) this.dom.wasteBar.style.width = this.telemetry.wasteDiverted + "%";
    if (this.dom.wasteText) this.dom.wasteText.textContent = this.telemetry.wasteDiverted + "%";

    if (this.dom.sustainabilityTips) {
      const recs = this.ai.generateSustainabilityRecommendations(this.telemetry);
      this.dom.sustainabilityTips.innerHTML = recs.map(r => `
        <div style="background: rgba(0, 230, 118, 0.04); border: 1px solid rgba(0, 230, 118, 0.15); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs);">
          <strong style="color: var(--color-success); font-size: 0.85rem;">🌱 ${this.escapeHTML(r.title)}</strong>
          <p style="font-size: 0.75rem; margin-top: 2px; color: var(--color-text-secondary);">${this.escapeHTML(r.description)}</p>
          <span style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic;">Potential Savings: ${this.escapeHTML(r.savings)}</span>
        </div>
      `).join('');
    }
  }

  /**
   * Updates gate scanned speeds and crowd levels.
   */
  updateOperationsTicker() {
    if (!this.dom.gatesList) return;

    this.dom.gatesList.innerHTML = Object.keys(GATES_DATA).map(name => {
      const gate = GATES_DATA[name];
      const barColor = gate.crowdLevel > 80 ? 'fill-danger' : gate.crowdLevel > 50 ? 'fill-warning' : 'fill-primary';
      return `
        <div class="progress-container" style="background: rgba(255, 255, 255, 0.02); padding: var(--spacing-sm); border-radius: var(--radius-sm); margin-bottom: var(--spacing-xs);">
          <div class="progress-label-row">
            <span><strong>${this.escapeHTML(name)}</strong> (${this.escapeHTML(gate.access)})</span>
            <span>${gate.crowdLevel}% density (${gate.scanRate} scans/min)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${barColor}" style="width: ${gate.crowdLevel}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Populates chatbot suggestions panel.
   */
  renderSuggestions(suggestions) {
    if (!this.dom.suggestionsBox) return;

    this.dom.suggestionsBox.innerHTML = suggestions.map(s => `
      <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 4px 10px;" onclick="window.ui.handleSuggestionClick('${this.escapeHTML(s.replace(/'/g, "\\'"))}')">${this.escapeHTML(s)}</button>
    `).join('');
  }

  /**
   * Handles user clicks on suggestion buttons.
   */
  handleSuggestionClick(text) {
    if (this.dom.chatInput) {
      this.dom.chatInput.value = text;
      if (this.dom.btnSend) this.dom.btnSend.click();
    }
  }

  /**
   * Appends user queries securely using textContent.
   */
  appendUserMessage(text) {
    const container = this.dom.chatMessages;
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-message message-user';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Appends AI replies securely and displays contextual metadata tags.
   */
  appendAIMessage(text, inferenceContext = null) {
    const container = this.dom.chatMessages;
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message message-ai';
    
    // Set text safely via textContent
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    messageDiv.appendChild(textSpan);

    // Context metadata tags for problem statement alignment
    if (inferenceContext) {
      const metaDiv = document.createElement('div');
      metaDiv.style.fontSize = '0.7rem';
      metaDiv.style.marginTop = '6px';
      metaDiv.style.color = 'var(--color-brand-primary)';
      metaDiv.style.display = 'flex';
      metaDiv.style.gap = '8px';
      metaDiv.style.flexWrap = 'wrap';

      const langTag = document.createElement('span');
      langTag.textContent = `🌐 Lang: ${this.selectedLanguage.toUpperCase()}`;
      metaDiv.appendChild(langTag);

      const sectionTag = document.createElement('span');
      sectionTag.textContent = `📍 Section: ${inferenceContext.ticketSection}`;
      metaDiv.appendChild(sectionTag);

      const accessTag = document.createElement('span');
      accessTag.textContent = `♿ Step-free: ${inferenceContext.accessibilityNeeded ? 'Yes' : 'No'}`;
      metaDiv.appendChild(accessTag);

      messageDiv.appendChild(metaDiv);
    }

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Renders typing indicators.
   */
  showTypingIndicator() {
    const container = this.dom.chatMessages;
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-message message-ai';
    div.id = 'chat-typing-indicator';
    div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Removes active typing indicators.
   */
  removeTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) indicator.remove();
  }

  /**
   * Logs system audits securely with time stamp.
   */
  appendSystemLog(text, severity = 'info') {
    const logBox = this.dom.opsLogs;
    if (!logBox) return;

    const timestamp = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log-item log-${severity} animate-slide-down`;
    
    const contentSpan = document.createElement('span');
    contentSpan.innerHTML = `<strong>[${timestamp}]</strong> ${this.escapeHTML(text)}`;
    div.appendChild(contentSpan);

    const severitySpan = document.createElement('span');
    severitySpan.style.fontSize = '0.75rem';
    severitySpan.style.textTransform = 'uppercase';
    severitySpan.style.opacity = '0.8';
    severitySpan.textContent = severity;
    div.appendChild(severitySpan);

    logBox.insertBefore(div, logBox.firstChild);
  }

  /**
   * Simulates resolving an active dispatch ticket, updating telemetry metrics back to optimal.
   * @param {string} incidentId - Logged incident ID.
   * @param {number} index - Index of element inside dispatches list.
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
   * @param {string} actionId - Target Eco Action ID.
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
   * @param {string} preference - Dietary preference.
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
