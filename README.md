# ZERO-WAIT STS 3D Pitch Simulator

Storyboard-style React/Vite + Three.js demo for the PEMA ZERO-WAIT STS proposal. The simulator walks through the full solution flow: baseline crane waiting, live data feeds, PLC trigger, look-ahead ranking, micro-slot vehicle positioning, dynamic resequencing, spreader guidance, handoff, zero-wait operation, safety modes, and feedback logging.

## Requirements

- Node.js 20 or newer
- npm

## How To Run

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Open the app in a browser:

```text
http://localhost:5173/
```

If port `5173` is already in use, Vite will print the alternate local URL in the terminal.

## Useful Commands

Build the production bundle:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Notes

- The simulator uses simulated operational data, not live terminal feeds.
- `zero_wait_sts_simulation.html` is kept as the legacy single-file reference.
- Open the Vite server URL instead of opening `index.html` directly as a local file.
