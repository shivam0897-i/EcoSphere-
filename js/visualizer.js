/**
 * js/visualizer.js
 * Controls the SVG-based environment visualization.
 * Balloons rise/sink vertically based on individual category scores.
 * Greenhouse dome, sky, smokestacks, and saplings respond to total score.
 */

import { StateManager } from './state.js';

export const Visualizer = {
  svgElement: null,

  // Balloon baseline Y positions (matching SVG markup)
  BALLOON_BASELINES: {
    diet:    { cy: 300, maxRise: -120, maxSink: 60 },
    energy:  { cy: 230, maxRise: -100, maxSink: 80 },
    transit: { cy: 320, maxRise: -110, maxSink: 70 }
  },

  // Max individual score for normalization (energy=15, transit=20, diet=4.5)
  MAX_SCORES: { diet: 4.5, energy: 15, transit: 20 },

  /**
   * Initializes the visualizer, selects the SVG, and binds interaction handlers.
   * @param {string} [svgContainerId] 
   */
  init(svgContainerId = '#eco-visualizer-svg') {
    this.svgElement = document.querySelector(svgContainerId);
    this.bindClickEvents();
  },

  /**
   * Binds click and keyboard events to SVGs balloons.
   */
  bindClickEvents() {
    ['diet', 'energy', 'transit'].forEach(cat => {
      const el = document.getElementById(`balloon-${cat}`);
      if (el) {
        el.addEventListener('click', () => {
          if (cat === 'diet') {
            StateManager.toggleAction('meatlessMondays');
          } else if (cat === 'energy') {
            StateManager.toggleAction('greenEnergySwitch');
          } else if (cat === 'transit') {
            StateManager.toggleAction('publicTransit');
          }
        });
        
        // Accessibility: Keyboard trigger
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.dispatchEvent(new Event('click'));
          }
        });
      }
    });
  },

  /**
   * Maps a category score to a vertical Y offset for the balloon.
   * Low score → balloon rises (negative Y). High score → balloon sinks (positive Y).
   * @param {string} category 
   * @param {number} score 
   * @returns {number} Y offset in SVG units
   */
  computeBalloonOffset(category, score) {
    const config = this.BALLOON_BASELINES[category];
    if (!config) return 0;

    const maxScore = this.MAX_SCORES[category] || 15;
    // Normalize score to 0..1 range (clamped)
    const ratio = Math.min(Math.max(score / maxScore, 0), 1);

    // ratio 0 → maxRise (balloon high up), ratio 1 → maxSink (balloon near ground)
    return config.maxRise + ratio * (config.maxSink - config.maxRise);
  },

  /**
   * Updates CSS state classes on the SVG root based on total score.
   * @param {number} totalScore 
   */
  updateVisuals(totalScore) {
    if (!this.svgElement) {
      this.svgElement = document.querySelector('#eco-visualizer-svg');
    }
    if (!this.svgElement) return;

    // Reset classes
    this.svgElement.classList.remove('state-clean', 'state-moderate', 'state-heavy');

    if (totalScore < 10) {
      this.svgElement.classList.add('state-clean');
    } else if (totalScore < 22) {
      this.svgElement.classList.add('state-moderate');
    } else {
      this.svgElement.classList.add('state-heavy');
    }
  },

  /**
   * Updates balloon vertical positions using CSS custom properties.
   * The CSS keyframe animations reference these variables for translateY.
   * @param {Object} scores 
   */
  updateBalloonPositions(scores) {
    if (!this.svgElement) return;

    const categories = ['diet', 'energy', 'transit'];
    const scoreKeys = { diet: 'dietScore', energy: 'energyScore', transit: 'transitScore' };

    categories.forEach(cat => {
      const score = scores[scoreKeys[cat]] || 0;
      const offset = this.computeBalloonOffset(cat, score);
      
      // Update CSS custom property for the keyframe animation
      this.svgElement.style.setProperty(`--balloon-${cat}-y`, `${offset}px`);
    });
  },

  /**
   * Renders full visualization updates from global state.
   * @param {Object} state 
   */
  render(state) {
    const total = state.scores.totalScore;
    this.updateVisuals(total);
    this.updateBalloonPositions(state.scores);

    // Sync balloon popped classes based on state action values
    const balloonsPopped = {
      diet: state.oneClickActions.meatlessMondays,
      energy: state.oneClickActions.greenEnergySwitch,
      transit: state.oneClickActions.publicTransit
    };

    Object.keys(balloonsPopped).forEach(key => {
      const balloon = document.getElementById(`balloon-${key}`);
      if (balloon) {
        if (balloonsPopped[key]) {
          balloon.classList.add('popped');
          balloon.setAttribute('aria-hidden', 'true');
        } else {
          balloon.classList.remove('popped');
          balloon.setAttribute('aria-hidden', 'false');
        }
      }
    });
  }
};
