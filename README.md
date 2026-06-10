# ZERO-WAIT STS 3D Pitch Simulator

React/Vite + Three.js simulator for the PEMA ZERO-WAIT STS proposal. The project turns a port-terminal coordination concept into a visual workflow that can be reviewed with engineers, domain experts, and non-technical stakeholders.

## Product Framing

The simulator focuses on a practical product problem: how to explain and evaluate a coordinated crane and vehicle workflow before connecting it to live terminal systems.

It demonstrates:
- baseline crane waiting and queue buildup
- live-data and PLC-trigger placeholders
- look-ahead ranking for the next container move
- micro-slot vehicle positioning
- dynamic resequencing when the plan changes
- spreader guidance, handoff, zero-wait operation, and safety modes
- feedback logging for later evaluation

The implementation uses simulated operational data. It is a stakeholder-facing prototype, not an integration with production terminal equipment.

## Requirements to Workflow

| Requirement | Simulator behavior |
| --- | --- |
| Make coordination logic inspectable | Animated sequence shows each decision state and transition. |
| Support cross-functional discussion | UI labels and scene changes make the operational story visible without code review. |
| Represent safe fallbacks | Safety modes and resequencing steps are explicit in the storyboard. |
| Keep the demo reproducible | Vite app can be run locally with a fixed scenario file. |

## Architecture

```text
src/
  App.jsx          Main app shell and scenario controls
  PortScene.jsx    Three.js scene rendering
  scenario.js      Ordered workflow states and explanatory copy
  styles.css       Presentation styling
```

The legacy `zero_wait_sts_simulation.html` file is kept as a single-file reference. The Vite app is the preferred review target.

## How to Run

Requirements:
- Node.js 20 or newer
- npm

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

If port `5173` is already in use, Vite will print the alternate local URL.

## Useful Commands

Build the production bundle:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Demo Notes

Use the simulator to discuss:
- which operational events should become platform inputs
- what decision states need traceability
- which exceptions require fallback behavior
- how a coordination concept can become requirements for APIs, telemetry, and operator-facing dashboards

## Limitations

- Uses simulated operational data, not live terminal feeds.
- Does not connect to PLCs, TOS, AIS, or real equipment APIs.
- Does not optimize schedules; it visualizes a proposed decision workflow for review.
