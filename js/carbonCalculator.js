/**
 * js/carbonCalculator.js
 * Calculates carbon footprint scores based on user inputs and active suggestions/actions.
 */

import { CARBON_COEFFICIENTS } from './constants.js';

/**
 * Calculates scores for diet, energy, and transit.
 * @param {Object} inputs - { diet: 'omnivore'|'vegetarian'|'vegan', energy: 0..100, transit: 0..100 }
 * @param {Object} [actions] - { greenEnergySwitch: bool, smartThermostat: bool, meatlessMondays: bool, publicTransit: bool }
 * @returns {Object} - { dietScore: num, energyScore: num, transitScore: num, totalScore: num }
 */
export function calculateFootprint(inputs, actions = {}) {
  // Diet: Vegan, Vegetarian, Omnivore
  let dietCoeff = CARBON_COEFFICIENTS.diet.omnivore;
  if (inputs && inputs.diet) {
    // Normalize diet input to lowercase for case-insensitive matching
    const normalizedDiet = inputs.diet.toLowerCase();
    if (normalizedDiet === 'vegan') {
      dietCoeff = CARBON_COEFFICIENTS.diet.vegan;
    } else if (normalizedDiet === 'vegetarian') {
      dietCoeff = CARBON_COEFFICIENTS.diet.vegetarian;
    }
  }
  
  if (actions && actions.meatlessMondays) {
    dietCoeff *= CARBON_COEFFICIENTS.actions.meatlessMondaysFactor;
  }
  const dietScore = dietCoeff;

  // Energy: Base multiplier scaled by energy consumption input level (0-100)
  const rawEnergy = inputs && inputs.energy !== undefined ? Number(inputs.energy) : 50;
  let energyMultiplier = rawEnergy * CARBON_COEFFICIENTS.energy.multiplier;
  
  if (actions) {
    if (actions.greenEnergySwitch) {
      energyMultiplier *= CARBON_COEFFICIENTS.energy.greenEnergySwitchFactor;
    }
    if (actions.smartThermostat) {
      energyMultiplier *= CARBON_COEFFICIENTS.energy.smartThermostatFactor;
    }
  }
  const energyScore = energyMultiplier;

  // Transit: Base multiplier scaled by transit input level (0-100)
  const rawTransit = inputs && inputs.transit !== undefined ? Number(inputs.transit) : 50;
  let transitMultiplier = rawTransit * CARBON_COEFFICIENTS.transit.multiplier;
  
  if (actions && actions.publicTransit) {
    transitMultiplier *= CARBON_COEFFICIENTS.transit.publicTransitFactor;
  }
  const transitScore = transitMultiplier;

  // Round individual components first
  const roundedDietScore = parseFloat(dietScore.toFixed(2));
  const roundedEnergyScore = parseFloat(energyScore.toFixed(2));
  const roundedTransitScore = parseFloat(transitScore.toFixed(2));
  
  // Calculate total as sum of already-rounded components to match UI display
  const totalScore = parseFloat((roundedDietScore + roundedEnergyScore + roundedTransitScore).toFixed(2));

  return {
    dietScore: roundedDietScore,
    energyScore: roundedEnergyScore,
    transitScore: roundedTransitScore,
    totalScore
  };
}
