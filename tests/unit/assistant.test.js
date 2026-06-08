import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateTips } from '../../js/assistant.js';

describe('assistant', () => {
  test('should handle undefined scores', () => {
    const res = generateTips({}, undefined);
    assert.strictEqual(res.primaryTip, "Your footprint is balanced. Keep up the good work and continue monitoring your daily habits.");
    assert.strictEqual(res.categoryTips.length, 3);
    assert.strictEqual(res.suggestions.length, 4);
  });

  test('should handle zero scores (balanced)', () => {
    const res = generateTips({}, { dietScore: 0, energyScore: 0, transitScore: 0 });
    assert.strictEqual(res.primaryTip, "Your footprint is balanced. Keep up the good work and continue monitoring your daily habits.");
  });

  test('should suggest diet when diet is highest', () => {
    const res = generateTips({}, { dietScore: 5, energyScore: 2, transitScore: 1 });
    assert.match(res.primaryTip, /Dietary habits/);
  });

  test('should suggest energy when energy is highest', () => {
    const res = generateTips({}, { dietScore: 2, energyScore: 5, transitScore: 1 });
    assert.match(res.primaryTip, /Household power/);
  });

  test('should suggest transit when transit is highest', () => {
    const res = generateTips({}, { dietScore: 2, energyScore: 1, transitScore: 5 });
    assert.match(res.primaryTip, /Commuting and transit/);
  });

  test('should output correctly formatted categoryTips and suggestions list', () => {
    const res = generateTips({}, { dietScore: 10, energyScore: 10, transitScore: 10 });
    assert.ok(res.categoryTips.some(tip => tip.startsWith('Diet:')));
    assert.ok(res.categoryTips.some(tip => tip.startsWith('Energy:')));
    assert.ok(res.categoryTips.some(tip => tip.startsWith('Transit:')));
    assert.strictEqual(res.suggestions[0].actionKey, 'greenEnergySwitch');
  });
});
