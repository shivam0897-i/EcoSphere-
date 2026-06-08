/**
 * js/visualizer.js
 * Controls the SVG-based environment visualization (glass dome, balloons, smokestacks).
 */

import { StateManager } from './state.js';

export const Visualizer = {
  svgElement: null,

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
   * Updates CSS state classes on the SVG root based on total score.
   * Interface contract from PROJECT.md
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
   * Renders full visualization updates from global state.
   * @param {Object} state 
   */
  render(state) {
    const total = state.scores.totalScore;
    this.updateVisuals(total);

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
