/**
 * js/carbonCalculator.js
 * Calculates carbon footprint scores based on user inputs and active suggestions/actions.
 */

import { CARBON_COEFFICIENTS } from "./constants.js";

/**
 * @typedef {Object} FootprintInputs
 * @property {'omnivore'|'vegetarian'|'vegan'} diet - The user's dietary habit.
 * @property {number} energy - The user's energy consumption (0-100).
 * @property {number} transit - The user's transit distance (0-100).
 */

/**
 * @typedef {Object} FootprintActions
 * @property {boolean} greenEnergySwitch - Reduces energy footprint by 50%.
 * @property {boolean} smartThermostat - Reduces energy footprint by 15%.
 * @property {boolean} meatlessMondays - Adjusts diet footprint by 10%.
 * @property {boolean} publicTransit - Reduces transit footprint by 40%.
 */

/**
 * Calculates scores for diet, energy, and transit.
 * @param {FootprintInputs} inputs - The footprint inputs.
 * @param {FootprintActions} [actions] - The one-click actions.
 * @returns {{ dietScore: number, energyScore: number, transitScore: number, totalScore: number }} The computed footprint scores.
 */
export function calculateFootprint(inputs, actions = {}) {
  const { diet = "omnivore", energy = 50, transit = 50 } = inputs || {};
  const {
    meatlessMondays = false,
    greenEnergySwitch = false,
    smartThermostat = false,
    publicTransit = false,
  } = actions || {};

  // Diet: Vegan, Vegetarian, Omnivore
  let dietCoeff = CARBON_COEFFICIENTS.diet.omnivore;
  const normalizedDiet = String(diet).toLowerCase();
  if (normalizedDiet === "vegan") {
    dietCoeff = CARBON_COEFFICIENTS.diet.vegan;
  } else if (normalizedDiet === "vegetarian") {
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
  let transitMultiplier =
    Number(transit) * CARBON_COEFFICIENTS.transit.multiplier;
  if (publicTransit) {
    transitMultiplier *= CARBON_COEFFICIENTS.transit.publicTransitFactor;
  }
  const transitScore = transitMultiplier;

  // Round individual components first
  const roundedDietScore = parseFloat(dietScore.toFixed(2));
  const roundedEnergyScore = parseFloat(energyScore.toFixed(2));
  const roundedTransitScore = parseFloat(transitScore.toFixed(2));

  // Calculate total as sum of already-rounded components to match UI display
  const totalScore = parseFloat(
    (roundedDietScore + roundedEnergyScore + roundedTransitScore).toFixed(2),
  );

  return {
    dietScore: roundedDietScore,
    energyScore: roundedEnergyScore,
    transitScore: roundedTransitScore,
    totalScore,
  };
}
