import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateFootprint } from '../../js/carbonCalculator.js';

describe('carbonCalculator', () => {
  test('should handle default parameters', () => {
    const res = calculateFootprint();
    assert.strictEqual(res.dietScore, 4.5);
    assert.strictEqual(res.energyScore, 7.5);
    assert.strictEqual(res.transitScore, 10.0);
    assert.strictEqual(res.totalScore, 22.0);
  });

  test('should handle diet vegan', () => {
    const res = calculateFootprint({ diet: 'vegan' });
    assert.strictEqual(res.dietScore, 1.5);
  });

  test('should handle diet vegetarian', () => {
    const res = calculateFootprint({ diet: 'vegetarian' });
    assert.strictEqual(res.dietScore, 2.5);
  });

  test('should handle diet omnivore explicitly', () => {
    const res = calculateFootprint({ diet: 'omnivore' });
    assert.strictEqual(res.dietScore, 4.5);
  });

  test('should handle unknown diet value', () => {
    const res = calculateFootprint({ diet: 'carnivore' });
    assert.strictEqual(res.dietScore, 4.5);
  });

  test('should handle meatlessMondays reduction', () => {
    const res = calculateFootprint({ diet: 'vegan' }, { meatlessMondays: true });
    assert.strictEqual(res.dietScore, 1.35);
  });

  test('should use default values if inputs is null/undefined', () => {
    const res1 = calculateFootprint(null);
    assert.strictEqual(res1.dietScore, 4.5);
    assert.strictEqual(res1.energyScore, 7.5);
    assert.strictEqual(res1.transitScore, 10.0);

    const res2 = calculateFootprint(undefined);
    assert.strictEqual(res2.dietScore, 4.5);
    assert.strictEqual(res2.energyScore, 7.5);
    assert.strictEqual(res2.transitScore, 10.0);
  });

  test('should handle energy and transit values', () => {
    const res = calculateFootprint({ energy: 100, transit: 10 });
    assert.strictEqual(res.energyScore, 15);
    assert.strictEqual(res.transitScore, 2);
  });

  test('should handle null/undefined actions object', () => {
    const res = calculateFootprint({ energy: 100, transit: 10 }, null);
    assert.strictEqual(res.energyScore, 15);
    assert.strictEqual(res.transitScore, 2);
  });

  test('should handle one-click actions: greenEnergySwitch', () => {
    const res = calculateFootprint({ energy: 100 }, { greenEnergySwitch: true });
    assert.strictEqual(res.energyScore, 7.5);
  });

  test('should handle one-click actions: smartThermostat', () => {
    const res = calculateFootprint({ energy: 100 }, { smartThermostat: true });
    assert.strictEqual(res.energyScore, 12.75);
  });

  test('should handle combination of greenEnergySwitch and smartThermostat', () => {
    const res = calculateFootprint({ energy: 100 }, { greenEnergySwitch: true, smartThermostat: true });
    assert.strictEqual(res.energyScore, 6.38);
  });

  test('should handle publicTransit action', () => {
    const res = calculateFootprint({ transit: 50 }, { publicTransit: true });
    assert.strictEqual(res.transitScore, 6.0);
  });

  test('should handle case-insensitive diet matching', () => {
    const resVeganLower = calculateFootprint({ diet: 'vegan' });
    const resVeganUpper = calculateFootprint({ diet: 'Vegan' });
    const resVeganMixed = calculateFootprint({ diet: 'VeGaN' });
    assert.strictEqual(resVeganLower.dietScore, 1.5);
    assert.strictEqual(resVeganUpper.dietScore, 1.5);
    assert.strictEqual(resVeganMixed.dietScore, 1.5);

    const resVegLower = calculateFootprint({ diet: 'vegetarian' });
    const resVegUpper = calculateFootprint({ diet: 'VEGETARIAN' });
    assert.strictEqual(resVegLower.dietScore, 2.5);
    assert.strictEqual(resVegUpper.dietScore, 2.5);
  });

  test('should calculate totalScore as sum of rounded components', () => {
    // Test the specific case from the challenge report
    const res = calculateFootprint(
      { diet: 'omnivore', energy: 1, transit: 0 },
      { meatlessMondays: true, greenEnergySwitch: true }
    );
    const sumOfComponents = parseFloat((res.dietScore + res.energyScore + res.transitScore).toFixed(2));
    assert.strictEqual(res.totalScore, sumOfComponents);
    assert.strictEqual(res.dietScore, 4.05);
    assert.strictEqual(res.energyScore, 0.07);
    assert.strictEqual(res.transitScore, 0);
    assert.strictEqual(res.totalScore, 4.12);
  });
});
