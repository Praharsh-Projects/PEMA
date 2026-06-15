# PEMA ZERO-WAIT STS 3D Pitch Simulator

React/Vite + Three.js simulator for demonstrating the PEMA ZERO-WAIT STS proposal. The project turns a terminal-operations innovation concept into a workshop-ready visual demo: baseline crane waiting, live-data style inputs, PLC trigger, look-ahead ranking, micro-slot vehicle positioning, dynamic resequencing, spreader guidance, handoff, safety modes, and feedback logging.

The simulator uses simulated operational data. It is built for explanation, pitch storytelling, and scenario walkthroughs rather than live terminal control.

## Why This Exists

The PEMA Global Student Challenge proposal needed a way to make the idea inspectable for non-specialist and technical audiences. This app shows the operational sequence visually so viewers can compare the baseline state with the proposed zero-wait coordination flow.

Useful contexts:

- innovation workshops and pitch sessions
- demo-led explanation of AI-assisted sequencing logic
- discussion of safe fallback states and dynamic resequencing
- early-stage validation of operational assumptions before production integration

## Implemented Demo Flow

- baseline crane waiting and vehicle-positioning bottleneck
- incoming operational signals represented as simulated live feeds
- PLC-style trigger event for coordination start
- look-ahead ranking for next vehicle or task candidate
- micro-slot positioning to reduce crane idle time
- dynamic resequencing when conditions change
- spreader guidance, handoff, and feedback logging
- safety-mode visualization for constrained conditions

## Stack

- React
- Vite
- Three.js / React Three Fiber
- @react-three/drei
- lucide-react

## Requirements

- Node.js 20 or newer
- npm

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app in a browser:

```text
http://localhost:5173/
```

If port `5173` is already in use, Vite prints the alternate local URL in the terminal.

## Useful Commands

Build the production bundle:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Repository Notes

- `zero_wait_sts_simulation.html` is kept as the legacy single-file reference.
- Open the Vite server URL instead of opening `index.html` directly as a local file.
- The simulator is a concept-demonstration artifact; it does not ingest live terminal feeds or control physical equipment.