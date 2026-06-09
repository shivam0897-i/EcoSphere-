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
export function calculateFootprint(inputs, actions) {
  const { diet = 'omnivore', energy = 50, transit = 50 } = inputs || {};
  const { meatlessMondays = false, greenEnergySwitch = false, smartThermostat = false, publicTransit = false } = actions || {};

  // Diet: Vegan, Vegetarian, Omnivore
  let dietCoeff = CARBON_COEFFICIENTS.diet.omnivore;
  const normalizedDiet = String(diet).toLowerCase();
  if (normalizedDiet === 'vegan') {
    dietCoeff = CARBON_COEFFICIENTS.diet.vegan;
  } else if (normalizedDiet === 'vegetarian') {
    dietCoeff = CARBON_COEFFICIENTS.diet.vegetarian;
  }
  
  if (meatlessMondays) {
    dietCoeff *= CARBON_COEFFICIENTS.actions.meatlessMondaysFactor;
  }
  const dietScore = dietCoeff;

  // Energy: Base multiplier scaled by energy consumption input level (0-100)
  let energyMultiplier = Number(energy) * CARBON_COEFFICIENTS.energy.multiplier;
  if (greenEnergySwitch) {
    energyMultiplier *= CARBON_COEFFICIENTS.energy.greenEnergySwitchFactor;
  }
  if (smartThermostat) {
    energyMultiplier *= CARBON_COEFFICIENTS.energy.smartThermostatFactor;
  }
  const energyScore = energyMultiplier;

  // Transit: Base multiplier scaled by transit input level (0-100)
  let transitMultiplier = Number(transit) * CARBON_COEFFICIENTS.transit.multiplier;
  if (publicTransit) {
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
