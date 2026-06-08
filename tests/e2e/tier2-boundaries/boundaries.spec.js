import { test, expect } from '@playwright/test';
import { EcoSpherePage } from '../pom/EcoSpherePage.js';

test.describe('Tier 2: Boundary conditions', () => {
  let ecosphere;

  test.beforeEach(async ({ page }) => {
    ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();
  });

  // --- F1 SVG Class boundaries ---

  test('F1.1: Extreme low score (1.5) triggers state-clean', async () => {
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 0, transit: 0 });
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(1.5);
    await expect(ecosphere.svgContainer).toHaveClass(/state-clean/);
  });

  test('F1.2: Clean boundary upper limit (9.9) triggers state-clean', async () => {
    // Vegan (1.5), transit (42 * 0.2 = 8.4), energy (0) -> total = 9.9
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 0, transit: 42 });
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(9.9);
    await expect(ecosphere.svgContainer).toHaveClass(/state-clean/);
  });

  test('F1.3: Moderate boundary lower limit (10.0) triggers state-moderate', async () => {
    // Vegetarian (2.5), transit (30 * 0.2 = 6.0), energy (10 * 0.15 = 1.5) -> total = 10.0
    await ecosphere.setFootprintInputs({ diet: 'vegetarian', energy: 10, transit: 30 });
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(10.0);
    await expect(ecosphere.svgContainer).toHaveClass(/state-moderate/);
  });

  test('F1.4: Moderate boundary upper limit (21.9) triggers state-moderate', async () => {
    // Vegan (1.5), transit (72 * 0.2 = 14.4), energy (40 * 0.15 = 6.0) -> total = 21.9
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 40, transit: 72 });
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(21.9);
    await expect(ecosphere.svgContainer).toHaveClass(/state-moderate/);
  });

  test('F1.5: Heavy boundary lower limit (22.0) triggers state-heavy', async () => {
    // Omnivore (4.5), energy (50 * 0.15 = 7.5), transit (50 * 0.2 = 10.0) -> total = 22.0
    await ecosphere.setFootprintInputs({ diet: 'omnivore', energy: 50, transit: 50 });
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(22.0);
    await expect(ecosphere.svgContainer).toHaveClass(/state-heavy/);
  });

  test('F1.6: Extreme high score (39.5) triggers state-heavy', async () => {
    await ecosphere.setFootprintInputs({ diet: 'omnivore', energy: 100, transit: 100 });
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(39.5);
    await expect(ecosphere.svgContainer).toHaveClass(/state-heavy/);
  });

  // --- F2 Assistant ties/zeros ---

  test('F2.1: Equal highest category scores (energy vs transit tie) break stably', async () => {
    // Vegan (1.5), transit (15 * 0.2 = 3.0), energy (20 * 0.15 = 3.0). Tie at 3.0.
    // Order in categories: diet, energy, transit. Thus energy should be evaluated as highest.
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 20, transit: 15 });
    const tipContainer = ecosphere.assistantTipsContainer.locator('.primary-tip');
    await expect(tipContainer).toContainText(/Household power use is currently your primary emissions contributor/);
  });

  test('F2.2: Zero inputs for energy and transit', async () => {
    await ecosphere.setFootprintInputs({ energy: 0, transit: 0 });
    const scores = await ecosphere.getScores();
    expect(scores.energy).toBe(0);
    expect(scores.transit).toBe(0);
  });

  test('F2.3: Empty chatbot query is ignored and not added to logs', async ({ page }) => {
    const chatInput = ecosphere.page.locator('#chat-input');
    await chatInput.fill('');
    await ecosphere.page.locator('#chat-form').dispatchEvent('submit');
    await page.waitForTimeout(100);

    // Only initial bot greeting should exist, no empty user message
    const msgCount = await ecosphere.page.locator('.chat-message').count();
    expect(msgCount).toBe(1);
  });

  test('F2.4: Whitespace chatbot query is ignored and not added to logs', async ({ page }) => {
    const chatInput = ecosphere.page.locator('#chat-input');
    await chatInput.fill('    ');
    await ecosphere.page.locator('#chat-form').dispatchEvent('submit');
    await page.waitForTimeout(100);

    const msgCount = await ecosphere.page.locator('.chat-message').count();
    expect(msgCount).toBe(1);
  });

  test('F2.5: Very long chatbot query is handled gracefully', async ({ page }) => {
    const longQuery = 'a'.repeat(1000);
    await ecosphere.sendAssistantMessage(longQuery);
    await page.waitForTimeout(500);

    const logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/I'm analyzing your request/);
  });

  test('F2.6: Chatbot handles special characters and script tags safely', async ({ page }) => {
    const unsafeQuery = '<script>alert("hack")</script> & < > " \'';
    await ecosphere.sendAssistantMessage(unsafeQuery);
    await page.waitForTimeout(500);

    const lastMessage = ecosphere.page.locator('.chat-message.user').last();
    // Verify it is rendered as text and not executed or lost
    await expect(lastMessage).toHaveText(unsafeQuery);
  });

  // --- F3 Action toggles cumulative and extreme boundaries ---

  test('F3.1: Energy action card combinations apply multiplication factor cumulatively', async () => {
    // Start with default energy 7.5.
    // Toggle green energy (0.5) and thermostat (0.85) -> cumulative factor: 0.425
    // 7.5 * 0.425 = 3.1875 -> rounded to 3.2
    await ecosphere.toggleSuggestionCard('green-energy');
    await ecosphere.toggleSuggestionCard('thermostat');

    const scores = await ecosphere.getScores();
    expect(scores.energy).toBe(3.2);
  });

  test('F3.2: Toggling actions at 0% inputs leaves scores at 0', async () => {
    await ecosphere.setFootprintInputs({ energy: 0, transit: 0 });
    await ecosphere.toggleSuggestionCard('green-energy');
    await ecosphere.toggleSuggestionCard('thermostat');
    await ecosphere.toggleSuggestionCard('transit');

    const scores = await ecosphere.getScores();
    expect(scores.energy).toBe(0.0);
    expect(scores.transit).toBe(0.0);
  });

  test('F3.3: Toggling actions at 100% inputs computes properly', async () => {
    await ecosphere.setFootprintInputs({ diet: 'omnivore', energy: 100, transit: 100 });
    // Omnivore = 4.5. Energy = 15. Transit = 20.
    // Toggle all actions:
    await ecosphere.toggleSuggestionCard('green-energy');
    await ecosphere.toggleSuggestionCard('thermostat');
    await ecosphere.toggleSuggestionCard('transit');
    await ecosphere.page.locator('#balloon-diet ellipse').click({ force: true }); // meatless mondays

    const scores = await ecosphere.getScores();
    // Diet: 4.5 * 0.9 = 4.05 -> 4.1
    // Energy: 15.0 * 0.5 * 0.85 = 6.375 -> 6.4
    // Transit: 20.0 * 0.6 = 12.0
    // Total = 4.05 + 6.375 + 12.0 = 22.425 -> 22.4
    expect(scores.diet).toBe(4.1);
    expect(scores.energy).toBe(6.4);
    expect(scores.transit).toBe(12.0);
    expect(scores.total).toBe(22.4);
  });

  test('F3.4: Page reset clearing multiple active actions and custom inputs', async () => {
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 90, transit: 90 });
    await ecosphere.toggleSuggestionCard('green-energy');
    await ecosphere.toggleSuggestionCard('transit');

    // Click Reset
    await ecosphere.page.locator('#reset-state').click();

    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(22.0);
    expect(scores.diet).toBe(4.5);
    expect(scores.energy).toBe(7.5);
    expect(scores.transit).toBe(10.0);

    const greenEnergyCard = ecosphere.page.locator('#toggle-green-energy');
    const transitCard = ecosphere.page.locator('#toggle-public-transit');
    await expect(greenEnergyCard).toHaveAttribute('aria-checked', 'false');
    await expect(transitCard).toHaveAttribute('aria-checked', 'false');
  });

  test('F3.5: SVG bar chart widths at minimum stay >= 4px for zero scores', async () => {
    await ecosphere.setFootprintInputs({ energy: 0, transit: 0 });
    const energyBar = ecosphere.page.locator('#chart-container svg g:nth-of-type(2) rect');
    const transitBar = ecosphere.page.locator('#chart-container svg g:nth-of-type(3) rect');

    await expect(energyBar).toHaveAttribute('width', '4');
    await expect(transitBar).toHaveAttribute('width', '4');
  });

  test('F3.6: SVG bar chart widths at maximum value do not exceed baseline max (240px)', async () => {
    await ecosphere.setFootprintInputs({ diet: 'omnivore', energy: 100, transit: 100 });
    // Transit score is 20.0 (max).
    const transitBar = ecosphere.page.locator('#chart-container svg g:nth-of-type(3) rect');
    await expect(transitBar).toHaveAttribute('width', '240');
  });

  // --- F4 A11y input boundaries ---

  test('F4.1: Slider updates when adjusted via keyboard arrow keys', async ({ page }) => {
    await ecosphere.energyInput.focus();
    const initialVal = await ecosphere.energyInput.inputValue();
    expect(initialVal).toBe('50');

    await page.keyboard.press('ArrowRight');
    const stepUpVal = await ecosphere.energyInput.inputValue();
    expect(Number(stepUpVal)).toBeGreaterThan(50);

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    const stepDownVal = await ecosphere.energyInput.inputValue();
    expect(Number(stepDownVal)).toBeLessThan(50);
  });

  test('F4.2: Select dropdown updates when navigated via keyboard options selection', async ({ page }) => {
    await ecosphere.dietSelect.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    const selectedValue = await ecosphere.dietSelect.inputValue();
    expect(selectedValue).toBe('vegan');

    const scores = await ecosphere.getScores();
    expect(scores.diet).toBe(1.5);
  });

  test('F4.3: Fast rapid updates to screen announcer do not cause failures', async () => {
    const announcer = ecosphere.page.locator('#sr-announcer');
    
    // Rapidly change energy input
    await ecosphere.energyInput.fill('10');
    await ecosphere.energyInput.fill('20');
    await ecosphere.energyInput.fill('30');
    await ecosphere.energyInput.fill('40');

    // Announcer should reflect the final score: 4.5 + 40 * 0.15 + 10.0 = 20.5
    await expect(announcer).toContainText(/Your updated carbon footprint score is 20.5 tons/);
  });
});
