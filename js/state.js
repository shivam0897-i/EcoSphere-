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
   * Validates that parsed state data is a valid object structure.
   * @param {*} parsed - The parsed data to validate
   * @returns {boolean} - True if valid object, not array or primitive
   */
  isValidState(parsed) {
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  },

  /**
   * Merges loaded state with defaults to ensure all required fields exist.
   * Handles schema changes by filling in missing fields from defaults.
   * @param {Object} loaded - The loaded state from storage
   * @returns {Object} - Merged state with all required fields
   */
  mergeWithDefaults(loaded) {
    const merged = {
      ...loaded,
      inputs: { ...DEFAULT_STATE.inputs, ...loaded.inputs },
      oneClickActions: { ...DEFAULT_STATE.oneClickActions, ...loaded.oneClickActions },
      scores: { ...DEFAULT_STATE.scores, ...loaded.scores },
    };

    if (!merged.chatHistory) {
      merged.chatHistory = JSON.parse(JSON.stringify(DEFAULT_STATE.chatHistory));
    }
    if (!merged.theme) {
      merged.theme = DEFAULT_STATE.theme;
    }

    return merged;
  },

  /**
   * Loads and validates state from localStorage with fallback to defaults.
   * Handles corrupted data, schema changes, and storage errors gracefully.
   * @returns {Object|null} - Valid state object or null to use defaults
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('ecoSphereState');
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      if (!this.isValidState(parsed)) {
        console.warn('Invalid state structure in localStorage, using defaults');
        return null;
      }

      return this.mergeWithDefaults(parsed);
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
      return null;
    }
  },

  /**
   * Initializes the state, loading from localStorage if present.
   * Falls back to default state on corruption, schema changes, or errors.
   */
  init() {
    const loadedState = this.loadFromStorage();

    if (loadedState) {
      this.state = loadedState;
    } else {
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
    // If callback throws, remove it from listeners to prevent leak
    try {
      callback(this.state);
    } catch (e) {
      this.listeners = this.listeners.filter(l => l !== callback);
      throw e;
    }
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
  },

  /**
   * Clears all registered listeners (useful for testing)
   */
  clearListeners() {
    this.listeners = [];
  }
};
