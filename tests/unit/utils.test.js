import { test, describe } from 'node:test';
import assert from 'node:assert';
import { round1 } from '../../js/utils.js';

describe('utils', () => {
  test('should round positive numbers to 1 decimal place as a string', () => {
    assert.strictEqual(round1(4.56), '4.6');
    assert.strictEqual(round1(4.54), '4.5');
    assert.strictEqual(round1(4.5), '4.5');
  });

  test('should format whole numbers to 1 decimal place as a string', () => {
    assert.strictEqual(round1(4), '4.0');
    assert.strictEqual(round1(0), '0.0');
  });

  test('should handle invalid inputs by returning 0.0', () => {
    assert.strictEqual(round1(NaN), '0.0');
    assert.strictEqual(round1(undefined), '0.0');
    assert.strictEqual(round1(null), '0.0');
    assert.strictEqual(round1('invalid'), '0.0');
  });
});
