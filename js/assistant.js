/**
 * js/assistant.js
 * Context-aware heuristic assistant providing targeted sustainability recommendations.
 */

/**
 * Generates personalized eco tips and suggestions based on current inputs and scores.
 * Interface contract from PROJECT.md
 * @param {Object} inputs
 * @param {Object} scores
 * @returns {Object} - { primaryTip: string, categoryTips: Array, suggestions: Array }
 */
export function generateTips(inputs, scores) {
  const dietScore = scores?.dietScore || 0;
  const energyScore = scores?.energyScore || 0;
  const transitScore = scores?.transitScore || 0;

  const categories = [
    {
      name: "diet",
      score: dietScore,
      tip: "Switch to more plant-based ingredients. Plant proteins generally have significantly lower emissions than beef or pork.",
    },
    {
      name: "energy",
      score: energyScore,
      tip: "Improve insulation, unplug phantom energy loads, and consider swapping out incandescent lights for LED alternatives.",
    },
    {
      name: "transit",
      score: transitScore,
      tip: "Try active transportation (walking, biking) or mass public transit options to offset long vehicle commutes.",
    },
  ];

  // Identify highest impact category
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const highest = sorted[0];

  let primaryTip =
    "Your footprint is balanced. Keep up the good work and continue monitoring your daily habits.";
  if (highest.score > 0) {
    if (highest.name === "diet") {
      primaryTip =
        "Dietary habits represent your highest carbon footprint. Cutting back on processed meats and dairy will make a big difference.";
    } else if (highest.name === "energy") {
      primaryTip =
        "Household power use is currently your primary emissions contributor. Consider green energy sources or smart thermostats.";
    } else if (highest.name === "transit") {
      primaryTip =
        "Commuting and transit is your largest source of emissions. Choosing public transit or carpooling can drastically improve your score.";
    }
  }

  const categoryTips = categories.map(
    (c) => `${c.name.charAt(0).toUpperCase() + c.name.slice(1)}: ${c.tip}`,
  );

  const suggestions = [
    {
      text: "Renewable Energy Plan",
      actionKey: "greenEnergySwitch",
      target: "energy",
    },
    {
      text: "Smart Thermostat Set",
      actionKey: "smartThermostat",
      target: "energy",
    },
    {
      text: "Meatless Mondays Challenge",
      actionKey: "meatlessMondays",
      target: "diet",
    },
    {
      text: "Use Public Transit",
      actionKey: "publicTransit",
      target: "transit",
    },
  ];

  return {
    primaryTip,
    categoryTips,
    suggestions,
  };
}
