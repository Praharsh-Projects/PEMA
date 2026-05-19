# ZERO-WAIT STS 3D Pitch Simulator

Storyboard-style React/Vite + Three.js demo for the PEMA ZERO-WAIT STS proposal. The simulator walks through the full solution flow: baseline crane waiting, live data feeds, PLC trigger, look-ahead ranking, micro-slot vehicle positioning, dynamic resequencing, spreader guidance, handoff, zero-wait operation, safety modes, and feedback logging.

## Live Demo

Public link:

```text
https://praharsh-projects.github.io/PEMA/
```

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

Open the synthetic implementation MVP console:

```text
http://localhost:5173/#implementation
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

Run advisory-engine tests:

```bash
npm test
```

## Implementation MVP

The implementation console is a synthetic-only working foundation for the real ZERO-WAIT STS advisory layer. It includes feed contracts, synthetic TOS/PLC/GPS/yard/weather data, look-ahead scoring, micro-slot recommendations, safety-mode degradation, replay KPIs, and black-box event logs.

See [docs/implementation-mvp.md](docs/implementation-mvp.md) for the real-port integration path and the boundary between what the synthetic MVP can prove versus what still needs terminal data.

For the complete project blueprint, see [docs/zero-wait-sts-project-plan.md](docs/zero-wait-sts-project-plan.md).

## Notes

- The simulator uses simulated operational data, not live terminal feeds.
- `zero_wait_sts_simulation.html` is kept as the legacy single-file reference.
- Open the Vite server URL instead of opening `index.html` directly as a local file.
