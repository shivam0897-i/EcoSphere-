/**
 * js/charts.js
 * Renders native SVG-based bar charts of the carbon footprint breakdown categories.
 */

import { round1 } from './utils.js';

export const Charts = {
  containerElement: null,

  /**
   * Initializes the chart module.
   * @param {string} [containerId] 
   */
  init(containerId = '#chart-container') {
    this.containerElement = document.querySelector(containerId);
  },

  /**
   * Renders the bar chart with the updated state scores.
   * @param {Object} state 
   */
  render(state) {
    if (!this.containerElement) {
      this.containerElement = document.querySelector('#chart-container');
    }
    if (!this.containerElement) return;

    const { dietScore, energyScore, transitScore } = state.scores;

    // Use a baseline scale factor. Maximum value maps to a proportional SVG width.
    const maxVal = Math.max(dietScore, energyScore, transitScore, 5) || 5;
    const baseWidth = 240; // Max visual width of the bar in px
    
    const dietWidth = parseFloat(Math.max((dietScore / maxVal) * baseWidth, 4).toFixed(1));
    const energyWidth = parseFloat(Math.max((energyScore / maxVal) * baseWidth, 4).toFixed(1));
    const transitWidth = parseFloat(Math.max((transitScore / maxVal) * baseWidth, 4).toFixed(1));

    this.containerElement.innerHTML = `
      <svg viewBox="0 0 380 180" width="100%" height="100%" aria-label="Footprint Category Breakdown Chart" role="img" style="overflow: visible;">
        <!-- Y-Axis line -->
        <line x1="70" y1="10" x2="70" y2="160" stroke="var(--border-color)" stroke-width="2" />
        
        <!-- Grid reference lines -->
        <line x1="190" y1="10" x2="190" y2="160" stroke="var(--border-color)" stroke-dasharray="3 3" opacity="0.4" />
        <line x1="310" y1="10" x2="310" y2="160" stroke="var(--border-color)" stroke-dasharray="3 3" opacity="0.4" />

        <!-- Diet Category Bar -->
        <g class="chart-bar-group">
          <text x="60" y="45" font-size="12" font-weight="600" fill="var(--text-primary)" text-anchor="end">Diet</text>
          <rect x="71" y="30" width="${dietWidth}" height="24" fill="var(--color-balloon-diet)" rx="4" />
          <text x="${78 + dietWidth}" y="45" font-size="11" font-weight="bold" fill="var(--text-secondary)">${round1(dietScore)} t</text>
        </g>

        <!-- Energy Category Bar -->
        <g class="chart-bar-group">
          <text x="60" y="95" font-size="12" font-weight="600" fill="var(--text-primary)" text-anchor="end">Energy</text>
          <rect x="71" y="80" width="${energyWidth}" height="24" fill="var(--color-balloon-energy)" rx="4" />
          <text x="${78 + energyWidth}" y="95" font-size="11" font-weight="bold" fill="var(--text-secondary)">${round1(energyScore)} t</text>
        </g>

        <!-- Transit Category Bar -->
        <g class="chart-bar-group">
          <text x="60" y="145" font-size="12" font-weight="600" fill="var(--text-primary)" text-anchor="end">Transit</text>
          <rect x="71" y="130" width="${transitWidth}" height="24" fill="var(--color-balloon-transit)" rx="4" />
          <text x="${78 + transitWidth}" y="145" font-size="11" font-weight="bold" fill="var(--text-secondary)">${round1(transitScore)} t</text>
        </g>
      </svg>
    `;
  }
};
