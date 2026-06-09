/**
 * js/constants.js
 * Shared configuration variables and coefficients.
 */

export const WORLD_AVG = 4.8;   // World average tons CO₂e per person
export const US_AVG   = 14.7;   // US average tons CO₂e per person

export const CARBON_COEFFICIENTS = {
  diet: {
    omnivore: 4.5,
    vegetarian: 2.5,
    vegan: 1.5
  },
  energy: {
    multiplier: 0.15,
    greenEnergySwitchFactor: 0.5,
    smartThermostatFactor: 0.85
  },
  transit: {
    multiplier: 0.2,
    publicTransitFactor: 0.6
  },
  actions: {
    meatlessMondaysFactor: 0.9
  }
};
