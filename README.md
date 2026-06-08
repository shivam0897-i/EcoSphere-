# EcoSphere 🌱

EcoSphere is an ultra-lightweight, high-performance client-side Single Page Application (SPA) designed to help individuals track, visualize, and reduce their daily carbon footprint. 

Built using **semantic HTML5**, **custom CSS grid/flexbox layouts with vanilla CSS animations**, and **pure vanilla JavaScript**, EcoSphere delivers an engaging, modern user experience without the bloat of heavy framework runtimes. It is fully self-contained, offline-first, and conforms to strict accessibility (A11y) guidelines.

---

## 🌟 Key Features

### 1. Interactive SVG Greenhouse Dome (Eco-Visualizer)
- **Dynamic Feedback:** A central greenhouse environment changes its visual state based on the user's total carbon footprint score:
  - **Clean Sky (`<10.0` tons):** Bright blue skies, a glowing yellow sun, and lush growing green saplings.
  - **Moderate Sky (`10.0 - 21.9` tons):** Pale yellow sky, amber sun, and standard green saplings.
  - **Heavy/Polluted Sky (`>=22.0` tons):** Dark slate-grey sky, dim red sun, withered brown plants, and active smokestacks emitting animated grey smoke.
- **Interactive Carbon Balloons:** Floating SVG balloons representing Diet, Energy, and Transit. Users can click or press space/enter on balloons to "pop" them, which automatically triggers corresponding carbon-reduction actions.

### 2. Context-Aware Smart Heuristic Assistant
- **Lightweight Conversational Interface:** A client-side conversational chatbot that parses user inquiries.
- **Targeted Heuristics:** The assistant inspects the user's current carbon profile to suggest tailored reduction tactics (e.g., if transit is the primary driver, it prompts public transit suggestions).
- **Safe & Secure:** Prevents injection attacks (XSS) by using DOM text node insertion rather than raw `innerHTML` for message text rendering.

### 3. One-Click Suggestion Cards & Analytics
- **Instant Actions:** Toggle cards for high-impact actions (Switch to Renewable Energy, Smart Thermostat Scheduling, Public Transit Commute) that instantly recalculate footprints and pop matching balloons.
- **Proportional Charts:** An inline, responsive SVG bar chart that updates dynamically to show carbon breakdowns.

### 4. Accessibility & Performance
- **Perfect Lighthouse Profile:** Semantic headings, skip-to-content links, and fully tab-navigable sliders, cards, and buttons.
- **Screen Reader Announcements:** An `aria-live="polite"` announcer region automatically broadcasts score updates to screen-reader users upon any slider adjustments or action toggles.
- **Zero-Dependency Core:** Loads in under **1.0 second** and fits under **2 MB** total repository size.

---

## 📊 Carbon Calculation Logic & Coefficients

All calculations run client-side in [js/carbonCalculator.js](file:///C:/Users/shiva/OneDrive/Desktop/Challenge%203/js/carbonCalculator.js) based on three primary categories:

### 1. Dietary Habits
- **Base Multiplier:** 
  - **Vegan:** `1.5` tons $CO_2e$/year
  - **Vegetarian:** `2.5` tons $CO_2e$/year
  - **Omnivore:** `4.5` tons $CO_2e$/year
- **Reduction Action (Meatless Mondays):** Reduces diet emissions by **10%** (factor of `0.9`).

### 2. Household Energy
- **Base Multiplier:** Scaled dynamically by the energy slider input ($0 - 100\%$), where:
  $$\text{Energy Score} = \text{Input Level} \times 0.15$$
- **Reduction Actions:**
  - **Switch to Renewable Energy:** Reduces energy score by **50%** (factor of `0.5`).
  - **Smart Thermostat Scheduling:** Reduces energy score by **15%** (factor of `0.85`).
  - These factors apply **cumulatively** (e.g., toggling both results in a factor of $0.5 \times 0.85 = 0.425$).

### 3. Transit & Commute
- **Base Multiplier:** Scaled dynamically by the transit slider input ($0 - 100\%$), where:
  $$\text{Transit Score} = \text{Input Level} \times 0.2$$
- **Reduction Action (Public Transit Commute):** Reduces transit score by **40%** (factor of `0.6`).

---

## 🛠️ Folder Structure & Code Layout

```
Challenge 3/
├── index.html              # Main Single Page Application HTML5 structure
├── style.css               # Design tokens, theme variables, glassmorphic layout, SVG styling & animations
├── js/
│   ├── app.js              # Orchestrator: binds event listeners, bootstraps state, handles view subscriptions
│   ├── state.js            # State store: Pub-Sub pattern managing inputs, scores, theme, and chat logs in localStorage
│   ├── carbonCalculator.js # Footprint coefficients and calculation formulas
│   ├── assistant.js        # Chatbot tip generation heuristics
│   ├── visualizer.js       # SVG greenhouse glass dome and balloon styling orchestrator
│   └── charts.js           # Dynamic SVG rendering of proportional category bar charts
├── tests/
│   ├── unit/               # Native Node.js unit test suite (100% logic coverage)
│   │   ├── setup.js        # Global localStorage environment mock
│   │   ├── assistant.test.js
│   │   ├── carbonCalculator.test.js
│   │   └── state.test.js
│   └── e2e/                # Playwright E2E browser automation test suites (Tiers 1-4)
│       ├── pom/
│       │   └── EcoSpherePage.js  # Page Object Model encapsulating selectors and helper actions
│       ├── tier1-features/  # Feature verification & sanity checks
│       ├── tier2-boundaries/# Edge inputs, limits, and tie-breakers
│       ├── tier3-combinations/# Multi-feature interaction scenarios
│       └── tier4-scenarios/ # Integrated real-world user flows
├── package.json            # NPM build, run, and test script definitions
└── playwright.config.js    # Playwright browser integration testing configuration
```

---

## 🧪 Testing & Verification

EcoSphere includes a comprehensive testing hierarchy with **100% pass rates**.

### 1. Running Unit Tests
Unit tests run using Node's native test runner (no extra test framework overhead):
```bash
npm run test:unit
```

### 2. Running End-to-End (E2E) Tests
E2E testing is powered by Playwright. The runner automatically launches a local server and runs tests across headless Chromium:
```bash
npm run test:e2e
```

To run Playwright tests in interactive UI mode:
```bash
npm run test:e2e:ui
```

---

## 🚀 How to Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the local server:**
   ```bash
   npm run serve
   ```
3. Open your browser and navigate to `http://127.0.0.1:8080/`.
