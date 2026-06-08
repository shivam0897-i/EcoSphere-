/**
 * js/state.js
 * Central State Store for EcoSphere.
 * Implements the Pub-Sub pattern and persists state to localStorage.
 */

import { calculateFootprint } from './carbonCalculator.js';

export const DEFAULT_STATE = {
  inputs: {
    diet: 'omnivore',      // 'omnivore' | 'vegetarian' | 'vegan'
    energy: 50,           // Range 0 to 100
    transit: 50           // Range 0 to 100
  },
  scores: {
    dietScore: 4.5,
    energyScore: 7.5,
    transitScore: 10.0,
    totalScore: 22.0
  },
  oneClickActions: {
    greenEnergySwitch: false, // Reduces energy footprint by 50%
    smartThermostat: false,   // Reduces energy footprint by 15%
    meatlessMondays: false,   // Adjusts diet value/score by 10%
    publicTransit: false      // Reduces transit footprint by 40%
  },
  chatHistory: [
    {
      sender: 'assistant',
      text: "Hello! I'm your EcoSphere assistant. How can I help you reduce your footprint today?",
      timestamp: new Date().toISOString()
    }
  ],
  theme: 'dark' // 'light' | 'dark'
};

export const StateManager = {
  state: JSON.parse(JSON.stringify(DEFAULT_STATE)),
  listeners: [],

  /**
   * Initializes the state, loading from localStorage if present
   */
  init() {
    try {
      const saved = localStorage.getItem('ecoSphereState');
      if (saved) {
        this.state = JSON.parse(saved);
        // Ensure all required fields exist in case structure changes
        this.state.inputs = { ...DEFAULT_STATE.inputs, ...this.state.inputs };
        this.state.oneClickActions = { ...DEFAULT_STATE.oneClickActions, ...this.state.oneClickActions };
        this.state.scores = { ...DEFAULT_STATE.scores, ...this.state.scores };
        if (!this.state.chatHistory) {
          this.state.chatHistory = JSON.parse(JSON.stringify(DEFAULT_STATE.chatHistory));
        }
        if (!this.state.theme) {
          this.state.theme = DEFAULT_STATE.theme;
        }
      } else {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.recalculate();
      }
    } catch (e) {
      console.warn("LocalStorage access failed. Using memory fallback.", e);
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.recalculate();
    }
    this.notify();
  },

  /**
   * Recalculates scores based on inputs and actions, then saves
   */
  recalculate() {
    this.state.scores = calculateFootprint(this.state.inputs, this.state.oneClickActions);
    this.save();
  },

  /**
   * Saves current state to localStorage
   */
  save() {
    try {
      localStorage.setItem('ecoSphereState', JSON.stringify(this.state));
    } catch (e) {
      console.error("Failed to save state to localStorage.", e);
    }
  },

  /**
   * Registers a subscriber callback function
   * @param {Function} callback 
   */
  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately execute callback with initial state
    callback(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },

  /**
   * Notifies all subscribers of a state change
   */
  notify() {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (e) {
        console.error("Subscriber notification error", e);
      }
    });
  },

  /**
   * Updates footprint inputs
   * @param {Object} inputs 
   */
  updateInputs(inputs) {
    this.state.inputs = { ...this.state.inputs, ...inputs };
    this.recalculate();
    this.notify();
  },

  /**
   * Toggles one-click action cards
   * @param {string} actionKey 
   */
  toggleAction(actionKey) {
    if (actionKey in this.state.oneClickActions) {
      this.state.oneClickActions[actionKey] = !this.state.oneClickActions[actionKey];
      this.recalculate();
      this.notify();
    }
  },

  /**
   * Updates scores calculated externally (if needed, but usually recalculate is used)
   * @param {Object} scores 
   */
  updateScores(scores) {
    this.state.scores = { ...this.state.scores, ...scores };
    this.save();
    this.notify();
  },

  /**
   * Adds chat history messages
   * @param {string} sender - 'user' | 'assistant'
   * @param {string} text 
   */
  addChatMessage(sender, text) {
    this.state.chatHistory.push({
      sender,
      text,
      timestamp: new Date().toISOString()
    });
    this.save();
    this.notify();
  },

  /**
   * Updates UI Theme state
   * @param {string} theme - 'light' | 'dark'
   */
  setTheme(theme) {
    this.state.theme = theme;
    this.save();
    this.notify();
  },

  /**
   * Resets the state to defaults
   */
  reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.recalculate();
    this.notify();
  }
};
