import './setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { StateManager, DEFAULT_STATE } from '../../js/state.js';

describe('StateManager', () => {
  let originalWarn;
  let originalError;

  beforeEach(() => {
    localStorage.clear();
    localStorage.shouldThrow = false;
    StateManager.clearListeners();
    originalWarn = console.warn;
    originalError = console.error;
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
  });

  test('init() should use DEFAULT_STATE when localStorage is empty', () => {
    StateManager.init();
    assert.strictEqual(StateManager.state.inputs.diet, 'omnivore');
    assert.strictEqual(StateManager.state.theme, 'dark');
  });

  test('init() should load saved state from localStorage', () => {
    const customState = {
      inputs: { diet: 'vegan', energy: 20, transit: 30 },
      oneClickActions: { greenEnergySwitch: true, smartThermostat: false, meatlessMondays: false, publicTransit: false },
      scores: { dietScore: 1.5, energyScore: 3, transitScore: 6, totalScore: 10.5 },
      chatHistory: [{ sender: 'user', text: 'Hi', timestamp: '2026-06-08' }],
      theme: 'light'
    };
    localStorage.setItem('ecoSphereState', JSON.stringify(customState));

    StateManager.init();

    assert.strictEqual(StateManager.state.inputs.diet, 'vegan');
    assert.strictEqual(StateManager.state.theme, 'light');
    assert.strictEqual(StateManager.state.chatHistory[0].text, 'Hi');
  });

  test('init() should handle partial state stored in localStorage', () => {
    // Missing chatHistory and theme
    const partialState = {
      inputs: { diet: 'vegetarian' },
      oneClickActions: {},
      scores: {}
    };
    localStorage.setItem('ecoSphereState', JSON.stringify(partialState));

    StateManager.init();

    assert.strictEqual(StateManager.state.inputs.diet, 'vegetarian');
    // Default fallback values should fill in the missing fields
    assert.strictEqual(StateManager.state.theme, DEFAULT_STATE.theme);
    assert.deepEqual(StateManager.state.chatHistory, DEFAULT_STATE.chatHistory);
  });

  test('init() should handle localStorage throwing error by falling back and calling console.warn', () => {
    console.warn = () => {}; // Stub console.warn to keep output clean
    localStorage.shouldThrow = true;

    StateManager.init();

    assert.strictEqual(StateManager.state.inputs.diet, 'omnivore');
    assert.strictEqual(StateManager.state.theme, 'dark');
  });

  test('save() should handle localStorage throwing error by calling console.error', () => {
    let errorCalled = false;
    console.error = () => { errorCalled = true; };
    localStorage.shouldThrow = true;

    StateManager.save();

    assert.ok(errorCalled);
  });

  test('subscribe() should register listener, invoke it immediately, and return an unsubscribe function', () => {
    let calledCount = 0;
    let receivedState = null;
    const callback = (state) => {
      calledCount++;
      receivedState = state;
    };

    const unsubscribe = StateManager.subscribe(callback);

    assert.strictEqual(calledCount, 1);
    assert.deepEqual(receivedState, StateManager.state);

    // Trigger update to verify subscriber is notified
    StateManager.updateInputs({ diet: 'vegan' });
    assert.strictEqual(calledCount, 2);

    // Unsubscribe and trigger another update
    unsubscribe();
    StateManager.updateInputs({ diet: 'vegetarian' });
    assert.strictEqual(calledCount, 2); // Count remains 2 because we unsubscribed
  });

  test('notify() should catch errors thrown by subscribers and proceed without throwing', () => {
    let errorCalled = false;
    console.error = () => { errorCalled = true; };

    let nextSubscriberCalled = false;
    let shouldThrow = false;
    let initialized = false;

    // First subscriber throws an error ONLY when shouldThrow is true and initialized is true
    const unsubscribe1 = StateManager.subscribe(() => {
      if (initialized && shouldThrow) {
        throw new Error("Subscriber error");
      }
    });

    // Second subscriber should still run
    const unsubscribe2 = StateManager.subscribe(() => {
      nextSubscriberCalled = true;
    });

    initialized = true;
    shouldThrow = true;
    nextSubscriberCalled = false; // Reset before notify to verify it runs during notify

    // Notify all
    StateManager.notify();

    assert.ok(errorCalled);
    assert.ok(nextSubscriberCalled);

    // Unsubscribe to prevent leakage to other tests
    unsubscribe1();
    unsubscribe2();
  });

  test('updateInputs() should update inputs, recalculate scores, and save state', () => {
    StateManager.init();
    StateManager.updateInputs({ diet: 'vegan', energy: 10 });

    assert.strictEqual(StateManager.state.inputs.diet, 'vegan');
    assert.strictEqual(StateManager.state.inputs.energy, 10);
    // recalculation verifies: vegan (1.5) + energy (10 * 0.15 = 1.5) + transit (50 * 0.2 = 10) = 13.0
    assert.strictEqual(StateManager.state.scores.totalScore, 13.0);
  });

  test('toggleAction() should toggle existing actions and recalculate scores', () => {
    StateManager.init();
    
    // Default greenEnergySwitch is false, let's toggle it to true
    StateManager.toggleAction('greenEnergySwitch');
    assert.strictEqual(StateManager.state.oneClickActions.greenEnergySwitch, true);

    // Toggle again to false
    StateManager.toggleAction('greenEnergySwitch');
    assert.strictEqual(StateManager.state.oneClickActions.greenEnergySwitch, false);
  });

  test('toggleAction() should do nothing for non-existent action keys', () => {
    StateManager.init();
    const originalActionsState = JSON.stringify(StateManager.state.oneClickActions);

    StateManager.toggleAction('nonExistentActionKey');
    assert.strictEqual(JSON.stringify(StateManager.state.oneClickActions), originalActionsState);
  });

  test('updateScores() should merge external scores, save, and notify', () => {
    StateManager.init();
    StateManager.updateScores({ totalScore: 99.9 });
    assert.strictEqual(StateManager.state.scores.totalScore, 99.9);
  });

  test('addChatMessage() should append user and assistant messages with timestamps', () => {
    StateManager.init();
    StateManager.addChatMessage('user', 'Testing chatbot messages');

    const lastMsg = StateManager.state.chatHistory[StateManager.state.chatHistory.length - 1];
    assert.strictEqual(lastMsg.sender, 'user');
    assert.strictEqual(lastMsg.text, 'Testing chatbot messages');
    assert.ok(lastMsg.timestamp);
  });

  test('setTheme() should set theme and save to localStorage', () => {
    StateManager.init();
    StateManager.setTheme('light');
    assert.strictEqual(StateManager.state.theme, 'light');

    const savedState = JSON.parse(localStorage.getItem('ecoSphereState'));
    assert.strictEqual(savedState.theme, 'light');
  });

  test('reset() should reset state to defaults', () => {
    StateManager.init();
    StateManager.updateInputs({ diet: 'vegan', energy: 0 });
    StateManager.setTheme('light');

    StateManager.reset();

    assert.strictEqual(StateManager.state.inputs.diet, 'omnivore');
    assert.strictEqual(StateManager.state.theme, 'dark');
  });

  test('init() should reject corrupted localStorage with string primitive', () => {
    // Test that string primitives are rejected
    localStorage.setItem('ecoSphereState', JSON.stringify("corrupt"));
    StateManager.init();
    
    // Should fall back to defaults
    assert.strictEqual(StateManager.state.inputs.diet, 'omnivore');
    assert.strictEqual(StateManager.state.theme, 'dark');
  });

  test('init() should reject corrupted localStorage with array', () => {
    // Test that arrays are rejected
    localStorage.setItem('ecoSphereState', JSON.stringify(["array", "data"]));
    StateManager.init();
    
    // Should fall back to defaults
    assert.strictEqual(StateManager.state.inputs.diet, 'omnivore');
    assert.strictEqual(StateManager.state.theme, 'dark');
  });

  test('clearListeners() should remove all registered listeners', () => {
    let callCount1 = 0;
    let callCount2 = 0;
    
    StateManager.subscribe(() => callCount1++);
    StateManager.subscribe(() => callCount2++);
    
    // Both should have been called once on subscription
    assert.strictEqual(callCount1, 1);
    assert.strictEqual(callCount2, 1);
    
    // Clear all listeners
    StateManager.clearListeners();
    
    // Trigger an update - listeners should not be called
    StateManager.updateInputs({ diet: 'vegan' });
    
    // Call counts should remain at 1
    assert.strictEqual(callCount1, 1);
    assert.strictEqual(callCount2, 1);
  });
});
