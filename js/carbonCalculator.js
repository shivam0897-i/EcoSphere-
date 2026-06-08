/**
 * js/carbonCalculator.js
 * Calculates carbon footprint scores based on user inputs and active suggestions/actions.
 */

/**
 * Calculates scores for diet, energy, and transit.
 * @param {Object} inputs - { diet: 'omnivore'|'vegetarian'|'vegan', energy: 0..100, transit: 0..100 }
 * @param {Object} [actions] - { greenEnergySwitch: bool, smartThermostat: bool, meatlessMondays: bool, publicTransit: bool }
 * @returns {Object} - { dietScore: num, energyScore: num, transitScore: num, totalScore: num }
 */
export function calculateFootprint(inputs, actions = {}) {
  // Diet: Vegan (1.5), Vegetarian (2.5), Omnivore (4.5)
  let dietCoeff = 4.5;
  if (inputs && inputs.diet) {
    if (inputs.diet === 'vegan') {
      dietCoeff = 1.5;
    } else if (inputs.diet === 'vegetarian') {
      dietCoeff = 2.5;
    }
  }
  
  if (actions && actions.meatlessMondays) {
    dietCoeff *= 0.9; // 10% reduction
  }
  const dietScore = dietCoeff;

  // Energy: Base multiplier scaled by energy consumption input level (0-100)
  const rawEnergy = inputs && inputs.energy !== undefined ? Number(inputs.energy) : 50;
  let energyMultiplier = rawEnergy * 0.15;
  
  if (actions) {
    if (actions.greenEnergySwitch) {
      energyMultiplier *= 0.5; // 50% renewable switch saving
    }
    if (actions.smartThermostat) {
      energyMultiplier *= 0.85; // 15% smart thermostat saving
    }
  }
  const energyScore = energyMultiplier;

  // Transit: Base multiplier scaled by transit input level (0-100)
  const rawTransit = inputs && inputs.transit !== undefined ? Number(inputs.transit) : 50;
  let transitMultiplier = rawTransit * 0.2;
  
  if (actions && actions.publicTransit) {
    transitMultiplier *= 0.6; // 40% public transit saving
  }
  const transitScore = transitMultiplier;

  const totalScore = parseFloat((dietScore + energyScore + transitScore).toFixed(2));

  return {
    dietScore: parseFloat(dietScore.toFixed(2)),
    energyScore: parseFloat(energyScore.toFixed(2)),
    transitScore: parseFloat(transitScore.toFixed(2)),
    totalScore
  };
}
