import { test, expect } from '@playwright/test';
import { EcoSpherePage } from '../pom/EcoSpherePage.js';

test.describe('Tier 3: Cross-feature combinations', () => {
  let ecosphere;

  test.beforeEach(async ({ page }) => {
    ecosphere = new EcoSpherePage(page);
    await ecosphere.navigate();
  });

  test('Combo 1: Action toggle + SVG class + live region update', async () => {
    // Start state: omnivore(4.5) + energy(7.5) + transit(10) = 22.0 (state-heavy)
    await expect(ecosphere.svgContainer).toHaveClass(/state-heavy/);
    
    const announcer = ecosphere.page.locator('#sr-announcer');
    
    // Toggle public transit card -> reduces transit by 40% (10 -> 6)
    // New total: 4.5 + 7.5 + 6.0 = 18.0 (state-moderate)
    await ecosphere.toggleSuggestionCard('transit');
    
    await expect(ecosphere.svgContainer).toHaveClass(/state-moderate/);
    await expect(announcer).toHaveText(/Your updated carbon footprint score is 18.0 tons/);
  });

  test('Combo 2: Heuristic tips + Action toggle', async () => {
    // Set inputs: vegetarian (2.5), energy 60 (9.0), transit 40 (8.0)
    // Energy is highest (9.0)
    await ecosphere.setFootprintInputs({ diet: 'vegetarian', energy: 60, transit: 40 });
    
    const tipContainer = ecosphere.assistantTipsContainer.locator('.primary-tip');
    await expect(tipContainer).toContainText(/Household power use is currently your primary emissions contributor/);

    // Toggle green energy action -> energy score becomes 9.0 * 0.5 = 4.5
    // Now transit is highest (8.0)
    await ecosphere.toggleSuggestionCard('green-energy');
    
    await expect(tipContainer).toContainText(/Commuting and transit is your largest source of emissions/);
  });

  test('Combo 3: Chatbot query + Action toggle interaction', async ({ page }) => {
    // Ask about transit
    await ecosphere.sendAssistantMessage('how is my transit commute score?');
    await page.waitForTimeout(500);

    let logs = ecosphere.page.locator('#chat-logs');
    await expect(logs).toContainText(/Your transit score is 10.0 tons/);

    // Toggle public transit action card -> transit becomes 6.0 tons
    await ecosphere.toggleSuggestionCard('transit');

    // Ask about transit again
    await ecosphere.sendAssistantMessage('transit commute score now');
    await page.waitForTimeout(500);

    await expect(logs).toContainText(/Your transit score is 6.0 tons/);
  });

  test('Combo 4: Balloon keyboard trigger + Chart width + Announcer', async () => {
    // Focus and dispatch keydown to diet balloon to pop it -> triggers meatlessMondays (4.5 -> 4.1)
    // New total: 4.05 + 7.5 + 10.0 = 21.55 -> 21.6
    const dietBalloon = ecosphere.page.locator('#balloon-diet');
    await dietBalloon.dispatchEvent('keydown', { key: 'Enter' });

    // Check popped state
    await expect(dietBalloon).toHaveClass(/popped/);

    // Check chart bar width for Diet
    // maxVal = 10.0, dietScore = 4.05. Width = (4.05 / 10) * 240 = 97.2
    const dietBar = ecosphere.page.locator('#chart-container svg g:nth-of-type(1) rect');
    await expect(dietBar).toHaveAttribute('width', '97.2');

    // Check announcer
    const announcer = ecosphere.page.locator('#sr-announcer');
    await expect(announcer).toHaveText(/Your updated carbon footprint score is 21.6 tons/);
  });
});
