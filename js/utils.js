/**
 * js/utils.js
 * Shared utility helper functions.
 */

/**
 * Rounds a number to 1 decimal place and formats it as a string.
 * Defensive: handles null, undefined, NaN, or non-numeric inputs gracefully.
 * @param {number|string|null|undefined} val 
 * @returns {string}
 */
export const round1 = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0.0';
  return (Math.round(num * 10) / 10).toFixed(1);
};
