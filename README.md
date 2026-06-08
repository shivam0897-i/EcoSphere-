# EcoSphere 🌱

> **Interactive Carbon Footprint Tracker** — Visualize, understand, and reduce your personal carbon emissions in real-time.

EcoSphere is an ultra-lightweight, high-performance client-side Single Page Application (SPA) that helps individuals track, visualize, and reduce their daily carbon footprint through an immersive, data-driven experience.

Built with **semantic HTML5**, **glassmorphic CSS with custom animations**, and **pure vanilla JavaScript** — zero frameworks, zero backend, 100% offline-capable.

---

## ✨ What Makes EcoSphere Different

### 🎈 Reactive SVG Balloon Visualizer
Each carbon category (Diet, Energy, Transit) is represented by a floating balloon that **physically rises and sinks based on your actual score**:
- **Low emissions** → balloons float high in a clear blue sky with golden sunlight
- **Moderate emissions** → balloons drift mid-level under an amber sky
- **High emissions** → balloons sink low as the sky darkens, smokestacks activate, and plants wither

Click any balloon to "pop" it — triggering its linked reduction action. The entire scene transitions smoothly with CSS keyframe animations and custom properties.

### 📊 Real-World Score Context
Your total footprint isn't just a number — it's contextualized with:
- 🌳 Trees needed to offset your emissions
- ✈️ Equivalent domestic flights
- 🌍 Percentage comparison to the global average (4.8t CO₂e/person)
- Color-coded verdict (green/amber/red) with actionable guidance

### 🤖 Intent-Aware Smart Assistant
A client-side chatbot that uses **regex-based intent classification** across 11 topic patterns:
- Understands natural questions about transit, energy, diet, balloons, comparisons, and reductions
- Responds with **score-aware, personalized advice** (e.g., "Your transit is 45% of your total — try enabling Public Transit")
- Graceful fallback that identifies your highest-impact category instead of a generic error

### 🎯 One-Click Impact Cards
Four toggle cards for instant carbon reduction:
| Card | Effect | Category |
|------|--------|----------|
| 🔌 Renewable Energy | -50% Energy | Energy |
| 🌡️ Smart Thermostat | -15% Energy | Energy |
| 🚌 Public Transit | -40% Transit | Transit |
| 🥗 Meatless Mondays | -10% Diet | Diet |

Actions stack cumulatively (e.g., Renewable + Thermostat = -57.5% energy reduction).

### 🎨 Premium Design
- **Glassmorphism** panels with `backdrop-filter: blur()` and semi-transparent backgrounds
- **Inter** font family via Google Fonts for crisp, modern typography
- **Micro-animations**: logo pulse, message slide-in, card hover shimmer, balloon hover glow
- **Dark/Light themes** with smooth color transitions and sticky frosted-glass header
- Fully responsive across desktop, tablet, and mobile breakpoints

---

## 📊 Carbon Calculation Logic

All calculations run client-side in [`carbonCalculator.js`](js/carbonCalculator.js):

### Diet
| Type | Base (tons CO₂e/year) |
|------|----------------------|
| Vegan | 1.5 |
| Vegetarian | 2.5 |
| Omnivore | 4.5 |

**Meatless Mondays** reduces diet emissions by 10%.

### Energy
$$\text{Score} = \text{Slider Value} \times 0.15$$
- **Renewable Energy**: -50%
- **Smart Thermostat**: -15%
- Both stack: $0.5 \times 0.85 = 0.425$ multiplier

### Transit
$$\text{Score} = \text{Slider Value} \times 0.2$$
- **Public Transit**: -40%

---

## 🛠️ Architecture

```
EcoSphere/
├── index.html              # Semantic HTML5 SPA with inline SVG visualizer
├── style.css               # Glassmorphic design system with CSS custom properties
├── js/
│   ├── app.js              # Orchestrator: event binding, chatbot, score context
│   ├── state.js            # Pub-Sub state store with localStorage persistence
│   ├── carbonCalculator.js # Pure-function emission calculator
│   ├── assistant.js        # Heuristic tip generator
│   ├── visualizer.js       # SVG balloon positioning & scene state manager
│   └── charts.js           # Dynamic SVG bar chart renderer
├── tests/
│   ├── unit/               # Node.js native test runner (34+ tests)
│   └── e2e/                # Playwright E2E browser automation (64+ tests)
│       ├── pom/            # Page Object Model
│       ├── tier1-features/ # Core feature verification
│       ├── tier2-boundaries/# Edge cases & limits
│       ├── tier3-combinations/# Multi-feature interactions
│       └── tier4-scenarios/# Full user journey flows
├── package.json
└── playwright.config.js
```

**Design Patterns Used:**
- **Pub-Sub** (StateManager) for reactive data flow
- **Page Object Model** for maintainable E2E tests
- **Module Pattern** (ES modules) for clean separation of concerns
- **CSS Custom Properties** for dynamic theming and score-responsive animations

---

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```
34+ tests covering calculator logic, state management, assistant heuristics, and adversarial edge cases.

### E2E Tests (Playwright)
```bash
npm run test:e2e          # Headless Chromium
npm run test:e2e:ui       # Interactive UI mode
```
64+ tests across 4 tiers: features, boundaries, combinations, and full user scenarios.

---

## 🚀 Run Locally

```bash
npm install
npm run serve
# Open http://127.0.0.1:8080/
```

---

## ♿ Accessibility

- Skip-to-content link for keyboard navigation
- Full `aria-*` attributes on interactive elements (sliders, toggles, balloons)
- `aria-live="polite"` announcer for screen reader score updates
- Keyboard-navigable cards, balloons, and chat interface
- Semantic heading hierarchy (`h1` → `h2` → `h3` → `h4`)
- High-contrast color ratios in both themes

---

*Built with ♻️ for a greener planet.*
