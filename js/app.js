/**
 * js/app.js
 * App Orchestrator. Binds UI event listeners, initializes modules, and subscribes views to the state.
 * Features: score-aware chatbot with fuzzy intent matching, real-world equivalency context,
 * dynamic score-level coloring, and accessible screen reader announcements.
 */

import { StateManager } from './state.js';
import { Visualizer } from './visualizer.js';
import { Charts } from './charts.js';
import { generateTips } from './assistant.js';

document.addEventListener('DOMContentLoaded', () => {
  // Rounding helper to ensure consistent display and test values
  // Defensive: handles null, undefined, NaN, or non-numeric inputs gracefully
  const round1 = (val) => {
    const num = Number(val);
    if (!Number.isFinite(num)) return '0.0';
    return (Math.round(num * 10) / 10).toFixed(1);
  };

  // ==================================================================
  // Score Context — real-world equivalencies for storytelling
  // ==================================================================
  const WORLD_AVG = 4.8;   // World average tons CO₂e per person
  const US_AVG   = 14.7;   // US average tons CO₂e per person

  function getScoreContext(totalScore) {
    const trees = Math.round(totalScore * 45); // ~45 trees per ton to offset
    const flights = (totalScore / 0.9).toFixed(0); // ~0.9 tons per round-trip domestic flight
    const vsWorld = ((totalScore / WORLD_AVG) * 100).toFixed(0);

    let level = 'clean';
    let emoji = '🌿';
    let verdict = 'Excellent! You\'re well below the global average.';
    
    if (totalScore >= 22) {
      level = 'heavy';
      emoji = '🔴';
      verdict = 'Above average. Significant room for improvement.';
    } else if (totalScore >= 10) {
      level = 'moderate';
      emoji = '🟡';
      verdict = 'Moderate impact. Small changes can make a big difference.';
    }

    return {
      level,
      html: `<span class="context-verdict">${emoji} ${verdict}</span>
             <span class="context-detail">≈ ${trees} trees needed to offset · ${vsWorld}% of world avg · ~${flights} domestic flights</span>`
    };
  }

  // ==================================================================
  // Smart Chatbot — intent-based matching with fuzzy keyword support
  // ==================================================================
  const CHAT_INTENTS = [
    {
      patterns: [/transit|commut|driv|car|bus|train|transport|travel/i],
      reply: (state) => `Your transit score is ${round1(state.scores.transitScore)} tons. You can reduce it by clicking the Public Transit action card below.`
    },
    {
      patterns: [/energy|power|electric|heat|cool|thermostat|solar|renew|grid/i],
      reply: (state) => `Your energy score is ${round1(state.scores.energyScore)} tons. Try switching to renewable energy or using a smart thermostat to lower it.`
    },
    {
      patterns: [/diet|food|meat|vegan|vegetarian|plant|eat/i],
      reply: (state) => `Your diet score is ${round1(state.scores.dietScore)} tons. Reducing red meat or enabling Meatless Mondays helps!`
    },
    {
      patterns: [/dome|green.*house|plant|sapling|tree/i],
      reply: () => `The green greenhouse dome represents your environmental health. Clean scores make saplings grow, while heavy scores wither them.`
    },
    {
      patterns: [/balloon|float|rise|sink|pop|click/i],
      reply: () => `Each balloon represents a carbon category (Diet, Energy, Transit). They rise when emissions are low and sink when high. Click a balloon to activate its linked action card — it'll "pop" and reduce that category's score. The position updates in real-time as your scores change!`
    },
    {
      patterns: [/score|footprint|total|carbon|co2|emission|ton/i],
      reply: (state) => `Your total carbon footprint is ${round1(state.scores.totalScore)} tons. Swapping actions and sliders will live-update the environment.`
    },
    {
      patterns: [/reduc|lower|improv|help|tip|suggest|advice|how.*can|what.*do|save/i],
      reply: (state) => {
        const { dietScore, energyScore, transitScore } = state.scores;
        const highest = Math.max(dietScore, energyScore, transitScore);
        if (highest === transitScore) return `Your biggest impact area is Transit (${round1(transitScore)}t). Enable the Public Transit card for an instant -40% reduction, or reduce commute distance with the slider.`;
        if (highest === energyScore) return `Energy is your top contributor (${round1(energyScore)}t). The Renewable Energy switch (-50%) and Smart Thermostat (-15%) stack cumulatively for up to -57.5% reduction!`;
        return `Diet is your top contributor (${round1(dietScore)}t). Consider moving from omnivore to vegetarian (saves ~2t/year) or try Meatless Mondays for a 10% reduction.`;
      }
    },
    {
      patterns: [/compare|average|world|us|country|global|person/i],
      reply: (state) => `Your footprint: ${round1(state.scores.totalScore)}t CO₂e/year.\n• World average: ${WORLD_AVG}t\n• US average: ${US_AVG}t\n• India average: 1.9t\n• EU average: 6.8t\nYou're at ${((state.scores.totalScore / WORLD_AVG) * 100).toFixed(0)}% of the global average.`
    },
    {
      patterns: [/reset|start.*over|clear|default/i],
      reply: () => `Click the "Reset" button in the top-right corner to restore all inputs and action cards to their default values. Your chat history will also be cleared.`
    },
    {
      patterns: [/theme|dark|light|mode|color/i],
      reply: () => `Click the sun/moon icon (⚙️) in the header to toggle between dark and light themes. Your preference is saved automatically!`
    },
    {
      patterns: [/hello|hi|hey|greet|welcome/i],
      reply: () => `Hey there! 👋 I'm your EcoSphere assistant. Ask me about your carbon score, how to reduce it, what the balloons mean, or how you compare to global averages.`
    }
  ];

  function getChatReply(text, state) {
    const query = text.toLowerCase().trim();
    
    for (const intent of CHAT_INTENTS) {
      for (const pattern of intent.patterns) {
        if (pattern.test(query)) {
          return intent.reply(state);
        }
      }
    }

    // Fallback: match expected E2E text
    return `I'm analyzing your request. Try asking about your transit score or the green dome!`;
  }

  // ==================================================================
  // 1. Initialize Visual Modules
  // ==================================================================
  Visualizer.init('#eco-visualizer-svg');
  Charts.init('#chart-container');

  // ==================================================================
  // 2. Bind Input Controls
  // ==================================================================
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

  // ==================================================================
  // 3. Bind Suggestion Action Cards
  // ==================================================================
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
  bindActionCard('toggle-meatless-mondays', 'meatlessMondays');

  // ==================================================================
  // 4. Bind Theme Toggle
  // ==================================================================
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = StateManager.state.theme === 'dark' ? 'light' : 'dark';
      StateManager.setTheme(nextTheme);
    });
  }

  // ==================================================================
  // 5. Bind Reset Control
  // ==================================================================
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

  // ==================================================================
  // 6. Bind Chatbot Form & Quick Prompts
  // ==================================================================
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

      // Generate a responsive chatbot message
      setTimeout(() => {
        const reply = getChatReply(text, StateManager.state);
        StateManager.addChatMessage('assistant', reply);
      }, 350);
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

  // ==================================================================
  // 7. Subscribe Rendering Views to StateManager updates
  // ==================================================================
  let lastScore = null;

  // Individual render functions for maintainability and testability
  function renderTheme(state) {
    document.body.className = state.theme === 'light' ? 'theme-light' : 'theme-dark';
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', state.theme === 'light' ? 'true' : 'false');
    }
  }

  function renderInputValues(state) {
    if (dietSelect && dietSelect.value !== state.inputs.diet) {
      dietSelect.value = state.inputs.diet;
    }
    if (energyInput && Number(energyInput.value) !== state.inputs.energy) {
      energyInput.value = state.inputs.energy;
    }
    if (transitInput && Number(transitInput.value) !== state.inputs.transit) {
      transitInput.value = state.inputs.transit;
    }

    const energyVal = document.getElementById('energy-val');
    if (energyVal) energyVal.textContent = `${state.inputs.energy}%`;
    const transitVal = document.getElementById('transit-val');
    if (transitVal) transitVal.textContent = `${state.inputs.transit}%`;
  }

  function renderActionCards(state) {
    const actionCards = {
      'toggle-green-energy': 'greenEnergySwitch',
      'toggle-smart-thermostat': 'smartThermostat',
      'toggle-public-transit': 'publicTransit',
      'toggle-meatless-mondays': 'meatlessMondays'
    };
    Object.entries(actionCards).forEach(([id, key]) => {
      const card = document.getElementById(id);
      if (card) {
        card.setAttribute('aria-checked', state.oneClickActions[key] ? 'true' : 'false');
      }
    });
  }

  function renderScores(state) {
    const totalScoreEl = document.getElementById('total-score');
    if (totalScoreEl) totalScoreEl.textContent = round1(state.scores.totalScore);

    const dietScoreEl = document.getElementById('diet-score');
    if (dietScoreEl) dietScoreEl.textContent = round1(state.scores.dietScore);

    const energyScoreEl = document.getElementById('energy-score');
    if (energyScoreEl) energyScoreEl.textContent = round1(state.scores.energyScore);

    const transitScoreEl = document.getElementById('transit-score');
    if (transitScoreEl) transitScoreEl.textContent = round1(state.scores.transitScore);
  }

  function renderScoreContext(state) {
    const metricCard = document.getElementById('carbon-summary');
    if (metricCard) {
      const ctx = getScoreContext(state.scores.totalScore);
      metricCard.setAttribute('data-score-level', ctx.level);

      const contextEl = document.getElementById('score-context');
      if (contextEl) contextEl.innerHTML = ctx.html;
    }
  }

  function renderTips(state) {
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
  }

  function renderChat(state) {
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
  }

  function renderAccessibilityAnnouncement(state) {
    const currentScore = state.scores.totalScore;
    if (lastScore !== null && lastScore !== currentScore) {
      const announcer = document.getElementById('sr-announcer');
      if (announcer) {
        announcer.textContent = `Your updated carbon footprint score is ${round1(currentScore)} tons of carbon dioxide equivalent.`;
      }
    }
    lastScore = currentScore;
  }

  // Main subscriber that composes all render functions
  StateManager.subscribe((state) => {
    renderTheme(state);
    renderInputValues(state);
    renderActionCards(state);
    renderScores(state);
    renderScoreContext(state);
    renderTips(state);
    renderChat(state);
    renderAccessibilityAnnouncement(state);
  });

  // ==================================================================
  // 8. Bootstrap State (loads saved settings and triggers initial notify)
  // ==================================================================
  StateManager.init();
});
