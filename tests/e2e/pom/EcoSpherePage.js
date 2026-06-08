/**
 * Page Object Model for the EcoSphere SPA
 */
export class EcoSpherePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // --- Selectors ---

    // Carbon Calculator Inputs
    this.dietSelect = page.locator('#diet-select');
    this.energyInput = page.locator('#energy-input');
    this.transitInput = page.locator('#transit-input');

    // Footprint Analytics Displays
    this.totalScoreDisplay = page.locator('#total-score');
    this.dietScoreDisplay = page.locator('#diet-score');
    this.energyScoreDisplay = page.locator('#energy-score');
    this.transitScoreDisplay = page.locator('#transit-score');

    // Suggestion Cards (One-Click Toggles)
    this.greenEnergyCardToggle = page.locator('#toggle-green-energy');
    this.thermostatCardToggle = page.locator('#toggle-smart-thermostat');
    this.publicTransitCardToggle = page.locator('#toggle-public-transit');
    this.meatlessMondaysCardToggle = page.locator('#toggle-meatless-mondays');

    // Smart Heuristic Assistant / Chatbot
    this.assistantInput = page.locator('#assistant-input');
    this.assistantSubmitBtn = page.locator('#assistant-send-btn');
    this.assistantChatHistory = page.locator('#chat-history');
    this.assistantTipsContainer = page.locator('#assistant-tips');
    this.chatInput = page.locator('#chat-input');
    this.chatSendBtn = page.locator('#chat-send-btn');
    this.chatLogs = page.locator('#chat-logs');

    // SVG Eco-Visualizer elements
    this.svgContainer = page.locator('#eco-visualizer-svg');
    this.skyBackground = page.locator('#svg-sky');
    this.balloons = page.locator('.carbon-balloon');
    this.smokyParticles = page.locator('.smoky-particle');

    // Accessibility Live Region
    this.liveAnnouncer = page.locator('[aria-live="polite"], [role="status"]');
  }

  // --- Actions ---

  /**
   * Navigate to the home page of the application
   */
  async navigate() {
    await this.page.goto('/');
  }

  /**
   * Set inputs on the carbon footprint calculator
   * @param {Object} inputs
   * @param {string} [inputs.diet]
   * @param {number|string} [inputs.energy]
   * @param {number|string} [inputs.transit]
   */
  async setFootprintInputs({ diet, energy, transit }) {
    if (diet) await this.dietSelect.selectOption(diet);
    if (energy !== undefined) await this.energyInput.fill(energy.toString());
    if (transit !== undefined) await this.transitInput.fill(transit.toString());
  }

  /**
   * Send a message to the heuristic assistant chatbot
   * @param {string} text
   */
  async sendAssistantMessage(text) {
    if (await this.assistantInput.isVisible()) {
      await this.assistantInput.fill(text);
      await this.assistantSubmitBtn.click();
    } else {
      await this.chatInput.fill(text);
      await this.chatSendBtn.click();
    }
  }

  /**
   * Toggle a suggestion card by its identifier
   * @param {string} cardId
   */
  async toggleSuggestionCard(cardId) {
    switch (cardId) {
      case 'green-energy':
        await this.greenEnergyCardToggle.click();
        break;
      case 'thermostat':
        await this.thermostatCardToggle.click();
        break;
      case 'transit':
        await this.publicTransitCardToggle.click();
        break;
      case 'meatless-mondays':
        await this.meatlessMondaysCardToggle.click();
        break;
      default:
        throw new Error(`Unknown card: ${cardId}`);
    }
  }

  // --- Getters / Assertions ---

  /**
   * Retrieve the current footprint scores from the display
   * @returns {Promise<{total: number, diet: number, energy: number, transit: number}>}
   */
  async getScores() {
    return {
      total: parseFloat((await this.totalScoreDisplay.innerText()).trim()),
      diet: parseFloat((await this.dietScoreDisplay.innerText()).trim()),
      energy: parseFloat((await this.energyScoreDisplay.innerText()).trim()),
      transit: parseFloat((await this.transitScoreDisplay.innerText()).trim()),
    };
  }

  /**
   * Retrieve the application state stored in localStorage
   * @returns {Promise<Object|null>}
   */
  async getLocalStorageState() {
    return await this.page.evaluate(() => {
      const state = localStorage.getItem('ecoSphereState');
      return state ? JSON.parse(state) : null;
    });
  }
}
