/**
 * js/app.js
 * App Orchestrator. Binds UI event listeners, initializes modules, and subscribes views to the state.
 */

import { StateManager } from './state.js';
import { Visualizer } from './visualizer.js';
import { Charts } from './charts.js';
import { generateTips } from './assistant.js';

document.addEventListener('DOMContentLoaded', () => {
  // Rounding helper to ensure consistent display and test values
  const round1 = (val) => (Math.round(val * 10) / 10).toFixed(1);

  // 1. Initialize Visual Modules
  Visualizer.init('#eco-visualizer-svg');
  Charts.init('#chart-container');

  // 2. Bind Input Controls
  const dietSelect = document.getElementById('diet-select');
  const energyInput = document.getElementById('energy-input');
  const transitInput = document.getElementById('transit-input');

  const updateInputsFromDOM = () => {
    StateManager.updateInputs({
      diet: dietSelect.value,
      energy: Number(energyInput.value),
      transit: Number(transitInput.value)
    });
  };

  if (dietSelect) dietSelect.addEventListener('change', updateInputsFromDOM);
  if (energyInput) energyInput.addEventListener('input', updateInputsFromDOM);
  if (transitInput) transitInput.addEventListener('input', updateInputsFromDOM);

  // 3. Bind Suggestion Action Cards
  const bindActionCard = (id, key) => {
    const card = document.getElementById(id);
    if (card) {
      card.addEventListener('click', () => {
        StateManager.toggleAction(key);
      });
      // Keyboard support
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          StateManager.toggleAction(key);
        }
      });
    }
  };

  bindActionCard('toggle-green-energy', 'greenEnergySwitch');
  bindActionCard('toggle-smart-thermostat', 'smartThermostat');
  bindActionCard('toggle-public-transit', 'publicTransit');

  // 4. Bind Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = StateManager.state.theme === 'dark' ? 'light' : 'dark';
      StateManager.setTheme(nextTheme);
    });
  }

  // 5. Bind Reset Control
  const resetBtn = document.getElementById('reset-state');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      StateManager.reset();
      
      // Sync DOM controls back to initial state
      if (dietSelect) dietSelect.value = StateManager.state.inputs.diet;
      if (energyInput) energyInput.value = StateManager.state.inputs.energy;
      if (transitInput) transitInput.value = StateManager.state.inputs.transit;
    });
  }

  // 6. Bind Chatbot Form & Quick Prompts
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!chatInput) return;
      const text = chatInput.value.trim();
      if (!text) return;

      // Add user message to state
      StateManager.addChatMessage('user', text);
      chatInput.value = '';

      // Generate a responsive heuristic chatbot message
      setTimeout(() => {
        let reply = "I'm analyzing your request. Try asking about your transit score or the green dome!";
        const query = text.toLowerCase();
        const currentState = StateManager.state;
        
        if (query.includes('transit') || query.includes('commute')) {
          reply = `Your transit score is ${round1(currentState.scores.transitScore)} tons. You can reduce it by clicking the Public Transit action card below.`;
        } else if (query.includes('energy') || query.includes('power')) {
          reply = `Your energy score is ${round1(currentState.scores.energyScore)} tons. Try switching to renewable energy or using a smart thermostat to lower it.`;
        } else if (query.includes('diet') || query.includes('food')) {
          reply = `Your diet score is ${round1(currentState.scores.dietScore)} tons. Reducing red meat or enabling Meatless Mondays helps!`;
        } else if (query.includes('dome') || query.includes('green greenhouse')) {
          reply = "The green greenhouse dome represents your environmental health. Clean scores make saplings grow, while heavy scores wither them.";
        } else if (query.includes('score') || query.includes('footprint')) {
          reply = `Your total carbon footprint is ${round1(currentState.scores.totalScore)} tons. Swapping actions and sliders will live-update the environment.`;
        }
        
        StateManager.addChatMessage('assistant', reply);
      }, 400);
    });
  }

  // Bind Quick Prompts clicks
  document.querySelectorAll('.btn-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (chatInput) {
        chatInput.value = btn.textContent;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });

  // 7. Subscribe Rendering Views to StateManager updates
  let lastScore = null;

  StateManager.subscribe((state) => {
    // A. Sync Theme on Body
    document.body.className = state.theme === 'light' ? 'theme-light' : 'theme-dark';
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', state.theme === 'light' ? 'true' : 'false');
    }

    // B. Sync DOM Input values (for external or reset changes)
    if (dietSelect && dietSelect.value !== state.inputs.diet) {
      dietSelect.value = state.inputs.diet;
    }
    if (energyInput && Number(energyInput.value) !== state.inputs.energy) {
      energyInput.value = state.inputs.energy;
    }
    if (transitInput && Number(transitInput.value) !== state.inputs.transit) {
      transitInput.value = state.inputs.transit;
    }

    // Update range numeric text
    const energyVal = document.getElementById('energy-val');
    if (energyVal) energyVal.textContent = `${state.inputs.energy}%`;
    const transitVal = document.getElementById('transit-val');
    if (transitVal) transitVal.textContent = `${state.inputs.transit}%`;

    // C. Sync suggestion action cards aria states
    const greenEnergyCard = document.getElementById('toggle-green-energy');
    if (greenEnergyCard) {
      greenEnergyCard.setAttribute('aria-checked', state.oneClickActions.greenEnergySwitch ? 'true' : 'false');
    }
    const thermostatCard = document.getElementById('toggle-smart-thermostat');
    if (thermostatCard) {
      thermostatCard.setAttribute('aria-checked', state.oneClickActions.smartThermostat ? 'true' : 'false');
    }
    const publicTransitCard = document.getElementById('toggle-public-transit');
    if (publicTransitCard) {
      publicTransitCard.setAttribute('aria-checked', state.oneClickActions.publicTransit ? 'true' : 'false');
    }

    // D. Sync numeric score display elements
    const totalScoreEl = document.getElementById('total-score');
    if (totalScoreEl) totalScoreEl.textContent = round1(state.scores.totalScore);
    
    const dietScoreEl = document.getElementById('diet-score');
    if (dietScoreEl) dietScoreEl.textContent = round1(state.scores.dietScore);
    
    const energyScoreEl = document.getElementById('energy-score');
    if (energyScoreEl) energyScoreEl.textContent = round1(state.scores.energyScore);
    
    const transitScoreEl = document.getElementById('transit-score');
    if (transitScoreEl) transitScoreEl.textContent = round1(state.scores.transitScore);

    // E. Render SVG Visualizer, SVG Charts, and Assistant tips
    Visualizer.render(state);
    Charts.render(state);

    const tips = generateTips(state.inputs, state.scores);
    const tipsContainer = document.getElementById('assistant-tips');
    if (tipsContainer) {
      tipsContainer.innerHTML = `
        <div class="primary-tip">${tips.primaryTip}</div>
        <ul>
          ${tips.categoryTips.map(tip => `<li class="category-tip">${tip}</li>`).join('')}
        </ul>
      `;
    }

    // F. Sync Chat history message log
    const chatLogs = document.getElementById('chat-logs');
    if (chatLogs) {
      chatLogs.innerHTML = '';
      state.chatHistory.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.sender}`;
        div.textContent = msg.text;
        chatLogs.appendChild(div);
      });
      
      const chatHistory = document.getElementById('chat-history');
      if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }
    }

    // G. Accessibility Screen Reader announcement
    const currentScore = state.scores.totalScore;
    if (lastScore !== null && lastScore !== currentScore) {
      const announcer = document.getElementById('sr-announcer');
      if (announcer) {
        announcer.textContent = `Your updated carbon footprint score is ${round1(currentScore)} tons of carbon dioxide equivalent.`;
      }
    }
    lastScore = currentScore;
  });

  // 8. Bootstrap State (loads saved settings and triggers initial notify)
  StateManager.init();
});
