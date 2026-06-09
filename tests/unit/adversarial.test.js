import './setup.js';
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { calculateFootprint } from '../../js/carbonCalculator.js';
import { generateTips } from '../../js/assistant.js';
import { StateManager } from '../../js/state.js';

describe('Adversarial & Edge-Case Tests', () => {
  let originalWarn;
  let originalError;

  beforeEach(() => {
    localStorage.clear();
    localStorage.shouldThrow = false;
    StateManager.listeners = [];
    originalWarn = console.warn;
    originalError = console.error;
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
  });

  describe('carbonCalculator Boundary & Type Robustness', () => {
    test('should handle non-numeric energy and transit inputs gracefully by returning NaN scores', () => {
      // Inputs containing invalid types
      const res = calculateFootprint({ diet: 'vegan', energy: 'invalid_energy', transit: 'invalid_transit' });
      assert.ok(Number.isNaN(res.energyScore));
      assert.ok(Number.isNaN(res.transitScore));
      assert.ok(Number.isNaN(res.totalScore));
    });

    test('should handle negative energy and transit values', () => {
      // Inputs containing negative numbers
      const res = calculateFootprint({ diet: 'vegan', energy: -50, transit: -100 });
      assert.strictEqual(res.energyScore, -7.5);
      assert.strictEqual(res.transitScore, -20.0);
      assert.strictEqual(res.totalScore, -26.0); // 1.5 + (-7.5) + (-20) = -26
    });

    test('should handle extreme bounds / large numbers', () => {
      const res = calculateFootprint({ diet: 'vegan', energy: 1e10, transit: 1e10 });
      assert.strictEqual(res.energyScore, 1.5e9);
      assert.strictEqual(res.transitScore, 2e9);
      assert.strictEqual(res.totalScore, 3.5e9 + 1.5);
    });

    test('should handle null/undefined in specific inputs', () => {
      // Null parsed as Number(null) -> 0
      const resNull = calculateFootprint({ diet: 'vegan', energy: null, transit: null });
      assert.strictEqual(resNull.energyScore, 0);
      assert.strictEqual(resNull.transitScore, 0);
      assert.strictEqual(resNull.totalScore, 1.5);

      // Undefined defaults to 50
      const resUndef = calculateFootprint({ diet: 'vegan', energy: undefined, transit: undefined });
      assert.strictEqual(resUndef.energyScore, 7.5);
      assert.strictEqual(resUndef.transitScore, 10);
      assert.strictEqual(resUndef.totalScore, 19.0);
    });

    test('should handle invalid action types', () => {
      // Non-boolean action values
      const res = calculateFootprint(
        { diet: 'vegan', energy: 100, transit: 100 },
        { greenEnergySwitch: 'yes', smartThermostat: null, meatlessMondays: undefined, publicTransit: 0 }
      );
      // 'yes' is truthy, so greenEnergySwitch will apply (50% reduction)
      // null, undefined, 0 are falsy, so their actions will not apply
      assert.strictEqual(res.energyScore, 7.5); // 100 * 0.15 * 0.5 = 7.5
      assert.strictEqual(res.transitScore, 20); // 100 * 0.2 = 20
    });
  });

  describe('assistant Boundary & Type Robustness', () => {
    test('should handle NaN and non-numeric values in scores gracefully', () => {
      const res = generateTips({}, { dietScore: NaN, energyScore: 10, transitScore: 5 });
      // dietScore is converted to 0; energyScore (10) is the highest, producing the Household power tip
      assert.match(res.primaryTip, /Household power/);
      assert.ok(Array.isArray(res.categoryTips));
      assert.ok(Array.isArray(res.suggestions));

      // All NaN scores result in balanced fallback tip
      const resAllNaN = generateTips({}, { dietScore: NaN, energyScore: NaN, transitScore: NaN });
      assert.strictEqual(resAllNaN.primaryTip, "Your footprint is balanced. Keep up the good work and continue monitoring your daily habits.");
    });

    test('should handle negative values in scores gracefully', () => {
      const res = generateTips({}, { dietScore: -10, energyScore: -5, transitScore: -2 });
      // Since no score > 0, returns balanced fallback tip
      assert.strictEqual(res.primaryTip, "Your footprint is balanced. Keep up the good work and continue monitoring your daily habits.");
    });

    test('should handle missing and null inputs/scores arguments', () => {
      const res = generateTips(null, null);
      assert.strictEqual(res.primaryTip, "Your footprint is balanced. Keep up the good work and continue monitoring your daily habits.");
    });
  });

  describe('StateManager Subscriber and State Robustness', () => {
    test('leak vulnerability: subscribe callback throwing on initial execution does not remain in listeners', () => {
      let runCount = 0;
      let errorThrown = false;

      // Register subscriber that throws on initial execution
      try {
        StateManager.subscribe(() => {
          runCount++;
          throw new Error('Initial subscriber error');
        });
      } catch (e) {
        errorThrown = true;
        assert.strictEqual(e.message, 'Initial subscriber error');
      }

      assert.ok(errorThrown);
      assert.strictEqual(runCount, 1);

      // Verify that this callback was NOT leaked inside listeners because subscribe caught the error and filtered it out
      assert.strictEqual(StateManager.listeners.length, 0);

      // If we trigger an update, the callback should not run again
      let consoleErrorCalled = false;
      console.error = () => { consoleErrorCalled = true; };

      StateManager.updateInputs({ diet: 'vegan' });

      assert.strictEqual(runCount, 1); // It did NOT run again!
      assert.ok(!consoleErrorCalled); // No error logged
    });

    test('state corruption: UI crash vulnerability with null values in state scores', () => {
      // Simulate state corruption where scores properties are null/undefined
      StateManager.init();
      StateManager.updateScores({ totalScore: null });

      // Check that state has been updated to null
      assert.strictEqual(StateManager.state.scores.totalScore, null);

      // In real application, the UI subscriber calls state.scores.totalScore.toFixed(1)
      // This will throw: TypeError: Cannot read properties of null (reading 'toFixed')
      let crashed = false;
      try {
        StateManager.state.scores.totalScore.toFixed(1);
      } catch (e) {
        crashed = true;
        assert.ok(e instanceof TypeError);
      }
      assert.ok(crashed);
    });
  });
});
