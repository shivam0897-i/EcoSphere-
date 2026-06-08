import { test, expect } from '@playwright/test';
import { EcoSpherePage } from '../pom/EcoSpherePage.js';

test.describe('Tier 4: Real-world user scenarios', () => {
  let ecosphere;

  test.beforeEach(async ({ page }) => {
    ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();
  });

  test('Scenario 1: Eco-Conscious Journey', async () => {
    // 1. User sets vegan diet, low energy (20), low transit (20)
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 20, transit: 20 });
    
    // 2. User toggles thermostat card and public transit card
    await ecosphere.toggleSuggestionCard('thermostat');
    await ecosphere.toggleSuggestionCard('transit');

    // Scores check:
    // Diet: 1.5
    // Energy: 20 * 0.15 * 0.85 = 2.55
    // Transit: 20 * 0.2 * 0.6 = 2.4
    // Total = 1.5 + 2.55 + 2.4 = 6.45 -> rounded to 6.5
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(6.5);
    expect(scores.diet).toBe(1.5);
    expect(scores.energy).toBe(2.6); // 2.55 -> rounded to 2.6
    expect(scores.transit).toBe(2.4);

    // 3. Verify clean environment
    await expect(ecosphere.svgContainer).toHaveClass(/state-clean/);

    // 4. Verify localStorage state preservation
    const state = await ecosphere.getLocalStorageState();
    expect(state).not.toBeNull();
    expect(state.inputs.diet).toBe('vegan');
    expect(state.inputs.energy).toBe(20);
    expect(state.inputs.transit).toBe(20);
    expect(state.oneClickActions.smartThermostat).toBe(true);
    expect(state.oneClickActions.publicTransit).toBe(true);
  });

  test('Scenario 2: High Polluter Intervention', async ({ page }) => {
    // 1. User starts with high scores (heavy state)
    await ecosphere.setFootprintInputs({ diet: 'omnivore', energy: 80, transit: 80 });
    // Total score = 4.5 + 12.0 + 16.0 = 32.5
    let scores = await ecosphere.getScores();
    expect(scores.total).toBe(32.5);
    await expect(ecosphere.svgContainer).toHaveClass(/state-heavy/);

    // 2. Chat with bot about transit
    await ecosphere.sendAssistantMessage('What about my transit commute emissions?');
    await page.waitForTimeout(500);
    let logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/Your transit score is 16.0 tons/);
    await expect(logs).toContainText(/clicking the Public Transit action card/);

    // 3. Pop transit balloon (keyboard or click)
    const transitBalloon = ecosphere.page.locator('#balloon-transit');
    await ecosphere.page.locator('#balloon-transit ellipse').click({ force: true });
    await expect(transitBalloon).toHaveClass(/popped/);

    // 4. Chat again about energy
    await ecosphere.sendAssistantMessage('how to reduce energy consumption?');
    await page.waitForTimeout(500);
    await expect(logs).toContainText(/Your energy score is 12.0 tons/);
    await expect(logs).toContainText(/renewable energy or using a smart thermostat/);

    // 5. Toggle energy card
    await ecosphere.toggleSuggestionCard('green-energy');

    // 6. Verify moderate state
    // New scores: diet(4.5) + energy(12 * 0.5 = 6.0) + transit(16 * 0.6 = 9.6) = 20.1
    scores = await ecosphere.getScores();
    expect(scores.total).toBe(20.1);
    await expect(ecosphere.svgContainer).toHaveClass(/state-moderate/);
  });

  test('Scenario 3: Session Recovery & Theme', async ({ page }) => {
    // 1. Toggle theme to light
    const themeBtn = ecosphere.page.locator('#theme-toggle');
    await themeBtn.click();
    await expect(ecosphere.page.locator('body')).toHaveClass(/theme-light/);

    // 2. Modify scores
    await ecosphere.setFootprintInputs({ diet: 'vegetarian', energy: 40, transit: 60 });
    // Vegetarian: 2.5, Energy: 40 * 0.15 = 6.0, Transit: 60 * 0.2 = 12.0. Total = 20.5
    let scores = await ecosphere.getScores();
    expect(scores.total).toBe(20.5);

    // 3. Refresh page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 4. Verify light theme is recovered
    await expect(ecosphere.page.locator('body')).toHaveClass(/theme-light/);
    await expect(themeBtn).toHaveAttribute('aria-pressed', 'true');

    // 5. Verify scores are recovered
    scores = await ecosphere.getScores();
    expect(scores.total).toBe(20.5);
    expect(scores.diet).toBe(2.5);
    expect(scores.energy).toBe(6.0);
    expect(scores.transit).toBe(12.0);
  });

  test('Scenario 4: Keyboard Accessibility Audit', async ({ page }) => {
    // 1. Skip link navigation
    const skipLink = page.locator('.skip-link');
    await skipLink.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();

    // 2. Toggle theme via keyboard
    const themeBtn = page.locator('#theme-toggle');
    await themeBtn.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('body')).toHaveClass(/theme-light/);

    // 3. Set diet via keyboard
    await ecosphere.dietSelect.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // 4. Focus transit card and toggle it
    const transitCard = page.locator('#toggle-public-transit');
    await transitCard.focus();
    await page.keyboard.press('Space');
    await expect(transitCard).toHaveAttribute('aria-checked', 'true');

    // 5. Pop diet balloon using keyboard dispatch
    const dietBalloon = page.locator('#balloon-diet');
    await dietBalloon.dispatchEvent('keydown', { key: 'Enter' });
    await expect(dietBalloon).toHaveClass(/popped/);

    // 6. Check final score:
    // Diet: 1.5 * 0.9 = 1.35
    // Energy: 50 * 0.15 = 7.5
    // Transit: 50 * 0.2 * 0.6 = 6.0
    // Total = 1.35 + 7.5 + 6.0 = 14.85 -> 14.9
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(14.9);

    // 7. Verify announcer spoken alert
    const announcer = page.locator('#sr-announcer');
    await expect(announcer).toHaveText(/Your updated carbon footprint score is 14.9 tons/);
  });

  test('Scenario 5: Chat Dialogue & System Reset', async ({ page }) => {
    // 1. Click quick prompt button
    const promptBtn = page.locator('.btn-prompt').first(); // "How can I reduce transit score?"
    await promptBtn.click();
    await page.waitForTimeout(500);

    // 2. Verify chatbot replied with transit recommendations
    const logs = page.locator('#chat-logs');
    await expect(logs).toContainText(/How can I reduce transit score\?/);
    await expect(logs).toContainText(/Your transit score is/);

    // 3. Send custom dome query
    await ecosphere.sendAssistantMessage('tell me about the greenhouse dome');
    await page.waitForTimeout(500);
    await expect(logs).toContainText(/tell me about the greenhouse dome/);
    await expect(logs).toContainText(/The green greenhouse dome represents/);

    // 4. Reset page state
    const resetBtn = page.locator('#reset-state');
    await resetBtn.click();

    // 5. Verify page is reset back to dark theme and default scores
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(22.0);
    expect(scores.diet).toBe(4.5);
    expect(scores.energy).toBe(7.5);
    expect(scores.transit).toBe(10.0);

    // 6. Verify chat history contains greeting only
    const chatMsgCount = await page.locator('.chat-message').count();
    expect(chatMsgCount).toBe(1);
  });
});
