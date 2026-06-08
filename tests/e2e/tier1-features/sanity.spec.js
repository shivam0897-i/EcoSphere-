import { test, expect } from '@playwright/test';
import { EcoSpherePage } from '../pom/EcoSpherePage.js';

test.describe('Sanity Check', () => {
  test('should import and instantiate EcoSpherePage and load about:blank', async ({ page }) => {
    const ecosphere = new EcoSpherePage(page);
    await page.goto('about:blank');
    expect(ecosphere).toBeDefined();
    expect(page.url()).toBe('about:blank');
  });

  test('should load the EcoSphere SPA and verify initial scores', async ({ page }) => {
    const ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();

    // Verify initial scores
    const scores = await ecosphere.getScores();
    expect(scores.total).toBe(22.0);
    expect(scores.diet).toBe(4.5);
    expect(scores.energy).toBe(7.5);
    expect(scores.transit).toBe(10.0);
  });

  test('should update scores when a suggestion card is toggled', async ({ page }) => {
    const ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();

    // Toggle green energy action
    await ecosphere.toggleSuggestionCard('green-energy');

    // Energy score should be reduced by 50% (7.5 -> 3.75, rounded to 3.8)
    // Total score: 4.5 + 3.75 + 10.0 = 18.25 -> rounded to 18.3
    const scores = await ecosphere.getScores();
    expect(scores.energy).toBe(3.8);
    expect(scores.total).toBe(18.3);
  });

  test('should update scores when sliders are changed', async ({ page }) => {
    const ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();

    // Set diet to vegan, energy to 80, transit to 30
    await ecosphere.setFootprintInputs({
      diet: 'vegan',
      energy: 80,
      transit: 30
    });

    // Diet score: 1.5
    // Energy score: 80 * 0.15 = 12.0
    // Transit score: 30 * 0.2 = 6.0
    // Total: 1.5 + 12.0 + 6.0 = 19.5
    const scores = await ecosphere.getScores();
    expect(scores.diet).toBe(1.5);
    expect(scores.energy).toBe(12.0);
    expect(scores.transit).toBe(6.0);
    expect(scores.total).toBe(19.5);
  });

  test('should reset scores to defaults when reset is clicked', async ({ page }) => {
    const ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();

    // Modify some values
    await ecosphere.setFootprintInputs({ diet: 'vegan', energy: 10 });
    let scores = await ecosphere.getScores();
    expect(scores.total).not.toBe(22.0);

    // Click Reset
    await page.locator('#reset-state').click();

    // Values should return to default
    scores = await ecosphere.getScores();
    expect(scores.total).toBe(22.0);
    expect(scores.diet).toBe(4.5);
    expect(scores.energy).toBe(7.5);
    expect(scores.transit).toBe(10.0);
  });

  test('should update chat logs when a message is sent', async ({ page }) => {
    const ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();

    // Send a message
    await ecosphere.sendAssistantMessage('Tell me about transit score');

    // Message should appear in chat history
    const chatLogText = await ecosphere.assistantChatHistory.innerText();
    expect(chatLogText).toContain('Tell me about transit score');

    // Heuristic response should arrive
    await page.waitForTimeout(600);
    const updatedChatLogText = await ecosphere.assistantChatHistory.innerText();
    expect(updatedChatLogText).toContain('reduce it by clicking the Public Transit action card');
  });
});


