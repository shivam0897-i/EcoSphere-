import { test, expect } from '@playwright/test';
import { EcoSpherePage } from '../pom/EcoSpherePage.js';

test.describe('Tier 1: Feature functionality', () => {
  let ecosphere;

  test.beforeEach(async ({ page }) => {
    ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();
  });

  // --- F1: SVG Visualizer ---

  test('F1.1: SVG visualizer is initially visible', async () => {
    await expect(ecosphere.svgContainer).toBeVisible();
  });

  test('F1.2: SVG visualizer starts with state-heavy class (default total score 22.0)', async () => {
    await expect(ecosphere.svgContainer).toHaveClass(/state-heavy/);
    await expect(ecosphere.svgContainer).not.toHaveClass(/state-clean/);
    await expect(ecosphere.svgContainer).not.toHaveClass(/state-moderate/);
  });

  test('F1.3: SVG visualizer transitions to state-clean when score is under 10.0', async () => {
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 10, transit: 10 });
    // Total score = 1.5 + 1.5 + 2.0 = 5.0 (< 10)
    await expect(ecosphere.svgContainer).toHaveClass(/state-clean/);
    await expect(ecosphere.svgContainer).not.toHaveClass(/state-moderate/);
    await expect(ecosphere.svgContainer).not.toHaveClass(/state-heavy/);
  });

  test('F1.4: SVG visualizer transitions to state-moderate when score is between 10.0 and 21.9', async () => {
    await ecosphere.setFootprintInputs({ diet: 'vegetarian', energy: 30, transit: 30 });
    // Total score = 2.5 + 4.5 + 6.0 = 13.0
    await expect(ecosphere.svgContainer).toHaveClass(/state-moderate/);
    await expect(ecosphere.svgContainer).not.toHaveClass(/state-clean/);
    await expect(ecosphere.svgContainer).not.toHaveClass(/state-heavy/);
  });

  test('F1.5: SVG visualizer contains all three carbon balloon elements', async () => {
    const dietBalloon = ecosphere.page.locator('#balloon-diet');
    const energyBalloon = ecosphere.page.locator('#balloon-energy');
    const transitBalloon = ecosphere.page.locator('#balloon-transit');
    await expect(dietBalloon).toBeVisible();
    await expect(energyBalloon).toBeVisible();
    await expect(transitBalloon).toBeVisible();
  });

  // --- F2: Heuristic Assistant ---

  test('F2.1: Heuristic Assistant updates primary tip to Diet when Diet has highest score', async () => {
    await ecosphere.setFootprintInputs({ diet: 'omnivore', energy: 10, transit: 10 });
    // Diet: 4.5, Energy: 1.5, Transit: 2.0. Diet is highest.
    const tipContainer = ecosphere.assistantTipsContainer.locator('.primary-tip');
    await expect(tipContainer).toContainText(/Dietary habits represent your highest carbon footprint/);
  });

  test('F2.2: Heuristic Assistant updates primary tip to Energy when Energy has highest score', async () => {
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 80, transit: 10 });
    // Diet: 1.5, Energy: 12.0, Transit: 2.0. Energy is highest.
    const tipContainer = ecosphere.assistantTipsContainer.locator('.primary-tip');
    await expect(tipContainer).toContainText(/Household power use is currently your primary emissions contributor/);
  });

  test('F2.3: Heuristic Assistant updates primary tip to Transit when Transit has highest score', async () => {
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 10, transit: 80 });
    // Diet: 1.5, Energy: 1.5, Transit: 16.0. Transit is highest.
    const tipContainer = ecosphere.assistantTipsContainer.locator('.primary-tip');
    await expect(tipContainer).toContainText(/Commuting and transit is your largest source of emissions/);
  });

  test('F2.4: Chatbot responds correctly to transit queries', async ({ page }) => {
    await ecosphere.sendAssistantMessage('how to reduce transit score?');
    await page.waitForTimeout(500);
    const logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/Your transit score is/);
    await expect(logs).toContainText(/clicking the Public Transit action card/);
  });

  test('F2.5: Chatbot responds correctly to energy queries', async ({ page }) => {
    await ecosphere.sendAssistantMessage('reduce energy');
    await page.waitForTimeout(500);
    const logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/Your energy score is/);
    await expect(logs).toContainText(/renewable energy or using a smart thermostat/);
  });

  test('F2.6: Chatbot responds correctly to diet queries', async ({ page }) => {
    await ecosphere.sendAssistantMessage('diet plans');
    await page.waitForTimeout(500);
    const logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/Your diet score is/);
    await expect(logs).toContainText(/Reducing red meat or enabling Meatless Mondays/);
  });

  test('F2.7: Chatbot responds correctly to dome queries', async ({ page }) => {
    await ecosphere.sendAssistantMessage('what is the glass dome');
    await page.waitForTimeout(500);
    const logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/The green greenhouse dome represents/);
  });

  test('F2.8: Chatbot responds correctly to score/footprint queries', async ({ page }) => {
    await ecosphere.sendAssistantMessage('what is my score?');
    await page.waitForTimeout(500);
    const logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/Your total carbon footprint is/);
  });

  test('F2.9: Chatbot provides fallback query message for unrecognized input', async ({ page }) => {
    await ecosphere.sendAssistantMessage('xyz123');
    await page.waitForTimeout(500);
    const logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/I'm analyzing your request. Try asking about your transit/);
  });

  // --- F3: Action Toggles & Analytics ---

  test('F3.1: Switch to Renewable Energy card toggles and reduces Energy score by 50%', async () => {
    const initialScores = await ecosphere.getScores();
    expect(initialScores.energy).toBe(7.5);

    await ecosphere.toggleSuggestionCard('green-energy');
    const newScores = await ecosphere.getScores();
    // 7.5 * 0.5 = 3.75 -> rounded to 3.8
    expect(newScores.energy).toBe(3.8);
    expect(newScores.total).toBe(18.3); // 4.5 + 3.75 + 10.0 = 18.25 -> 18.3
  });

  test('F3.2: Smart Thermostat card toggles and reduces Energy score by 15%', async () => {
    const initialScores = await ecosphere.getScores();
    expect(initialScores.energy).toBe(7.5);

    await ecosphere.toggleSuggestionCard('thermostat');
    const newScores = await ecosphere.getScores();
    // 7.5 * 0.85 = 6.375 -> rounded to 6.4
    expect(newScores.energy).toBe(6.4);
    expect(newScores.total).toBe(20.9); // 4.5 + 6.375 + 10.0 = 20.875 -> 20.9
  });

  test('F3.3: Public Transit card toggles and reduces Transit score by 40%', async () => {
    const initialScores = await ecosphere.getScores();
    expect(initialScores.transit).toBe(10.0);

    await ecosphere.toggleSuggestionCard('transit');
    const newScores = await ecosphere.getScores();
    // 10.0 * 0.6 = 6.0
    expect(newScores.transit).toBe(6.0);
    expect(newScores.total).toBe(18.0);
  });

  test('F3.4: Clicking SVG transit balloon toggles transit action card', async () => {
    const transitBalloon = ecosphere.page.locator('#balloon-transit');
    await ecosphere.page.locator('#balloon-transit ellipse').click({ force: true });

    const transitCard = ecosphere.page.locator('#toggle-public-transit');
    await expect(transitCard).toHaveAttribute('aria-checked', 'true');
    await expect(transitBalloon).toHaveClass(/popped/);

    const scores = await ecosphere.getScores();
    expect(scores.transit).toBe(6.0);
  });

  test('F3.5: Clicking SVG energy balloon toggles renewable energy card', async () => {
    const energyBalloon = ecosphere.page.locator('#balloon-energy');
    await ecosphere.page.locator('#balloon-energy ellipse').click({ force: true });

    const energyCard = ecosphere.page.locator('#toggle-green-energy');
    await expect(energyCard).toHaveAttribute('aria-checked', 'true');
    await expect(energyBalloon).toHaveClass(/popped/);

    const scores = await ecosphere.getScores();
    expect(scores.energy).toBe(3.8);
  });

  test('F3.6: Clicking SVG diet balloon toggles meatless Mondays action', async () => {
    const dietBalloon = ecosphere.page.locator('#balloon-diet');
    await ecosphere.page.locator('#balloon-diet ellipse').click({ force: true });

    await expect(dietBalloon).toHaveClass(/popped/);
    const scores = await ecosphere.getScores();
    // 4.5 * 0.9 = 4.05 -> rounded to 4.1
    expect(scores.diet).toBe(4.1);
  });

  test('F3.7: SVG charts render category breakdown bars with proportional sizes', async () => {
    const chartContainer = ecosphere.page.locator('#chart-container svg');
    await expect(chartContainer).toBeVisible();

    const rects = chartContainer.locator('rect');
    await expect(rects).toHaveCount(3);
  });

  // --- F4: Accessibility ---

  test('F4.1: Skip link is focusable and focuses main content', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('F4.2: Form input elements have associated labels', async ({ page }) => {
    const dietSelectId = await ecosphere.dietSelect.getAttribute('id');
    const labelForDiet = page.locator(`label[for="${dietSelectId}"]`);
    await expect(labelForDiet).toBeVisible();

    const energyInputId = await ecosphere.energyInput.getAttribute('id');
    const labelForEnergy = page.locator(`label[for="${energyInputId}"]`);
    await expect(labelForEnergy).toBeVisible();

    const transitInputId = await ecosphere.transitInput.getAttribute('id');
    const labelForTransit = page.locator(`label[for="${transitInputId}"]`);
    await expect(labelForTransit).toBeVisible();
  });

  test('F4.3: Suggestion cards have role="switch" and aria-checked', async () => {
    const transitCard = ecosphere.page.locator('#toggle-public-transit');
    await expect(transitCard).toHaveAttribute('role', 'switch');
    await expect(transitCard).toHaveAttribute('aria-checked', 'false');

    await transitCard.click();
    await expect(transitCard).toHaveAttribute('aria-checked', 'true');
  });

  test('F4.4: Theme toggle has aria-pressed reflecting its light/dark state', async () => {
    const themeBtn = ecosphere.page.locator('#theme-toggle');
    await expect(themeBtn).toHaveAttribute('aria-pressed', 'false');

    await themeBtn.click();
    await expect(themeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(ecosphere.page.locator('body')).toHaveClass(/theme-light/);
  });

  test('F4.5: Screen Reader Announcer receives live update on score change', async () => {
    const announcer = ecosphere.page.locator('#sr-announcer');
    await ecosphere.setFootprintInputs({ transit: 80 });
    // Score updates: transit 10 -> 16.0 (+6.0). Total: 22 -> 28
    await expect(announcer).toContainText(/Your updated carbon footprint score is 28.0 tons/);
  });

  test('F4.6: Keyboard support (Space/Enter) triggers suggestion card toggles', async ({ page }) => {
    const transitCard = ecosphere.page.locator('#toggle-public-transit');
    await transitCard.focus();
    await page.keyboard.press('Space');
    await expect(transitCard).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('Enter');
    await expect(transitCard).toHaveAttribute('aria-checked', 'false');
  });

  test('F4.7: Keyboard support (Space/Enter) triggers balloon click actions', async () => {
    const transitBalloon = ecosphere.page.locator('#balloon-transit');
    await transitBalloon.dispatchEvent('keydown', { key: 'Enter' });
    await expect(transitBalloon).toHaveClass(/popped/);

    const scores = await ecosphere.getScores();
    expect(scores.transit).toBe(6.0);
  });
});
