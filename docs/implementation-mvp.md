# ZERO-WAIT STS Implementation MVP

This repository now contains two layers:

- `Pitch simulator`: the public 3D storyboard used for presentation.
- `Implementation MVP console`: a synthetic advisory engine that shows how ZERO-WAIT STS would work without real port feeds.

For the full engineering blueprint, see [zero-wait-sts-project-plan.md](zero-wait-sts-project-plan.md).

Open the implementation console locally at:

```text
http://localhost:5173/#implementation
```

## What Is Implemented

- Canonical synthetic data contracts for TOS/BAPLIE, PLC, GPS/VMT, yard readiness, weather, recommendations, and event logs.
- Synthetic feed generator for four scenarios: normal operation, late truck, vessel dig, and sensor dropout.
- Advisory decision engine:
  - PLC trigger detection.
  - Look-ahead ranking for the next three moves.
  - Vehicle/container compatibility checks.
  - ETA and lane readiness scoring.
  - Fallback vehicle promotion.
  - Vessel-dig move blocking.
  - Coordinated / Recommendation / Manual mode selection.
- Micro-slot advisory output for the VMT/driver view.
- Replay summary KPIs for recovered idle time, fallback activation, manual events, and effective moves/hour.
- Black-box event log for auditability.
- Unit tests for core recommendation behavior.

## What Data A Real Pilot Needs

| Feed | Minimum Fields | Target Freshness |
| --- | --- | --- |
| TOS/BAPLIE | container ID, ISO, weight, bay-row-tier, move sequence, priority, special handling | per vessel call plus live updates |
| Crane PLC | hoist height, trolley position, spreader/twistlock state, load cell, anti-sway, move timestamps | 100-500 ms |
| Vehicle/VMT/GPS | vehicle ID, lane, position, speed, chassis type, assignment, loaded/empty state | around 1 s |
| Yard/quay readiness | slot availability, lane occupancy, blocked bays, pinning/twistlock exceptions | 1-5 s |
| Weather/context | wind, gust, visibility, restrictions | 5-15 s |
| Operator log | accepted, ignored, overridden, manual fallback reason | event based |

## Real-Port Integration Path

1. Build read-only adapters for each feed and normalize them into the same snapshot shape used by the synthetic engine.
2. Run offline replay against historical vessel calls.
3. Run shadow mode beside one STS crane with no operator-facing recommendation.
4. Tune thresholds for ETA, feed freshness, and fallback promotion.
5. Run advisory pilot with operator acceptance/override logging.
6. Scale to more cranes once one-crane KPIs are proven.

## Synthetic-Only Boundary

The synthetic MVP can prove the software architecture, ranking behavior, fallback logic, visualization, replay logging, and KPI calculations. It cannot prove actual terminal productivity, real PLC latency, GPS lane accuracy, operator acceptance, safety approval, or real ROI without terminal data.

The current realistic completion level without port access is roughly 70-80% of the software product. The remaining work is integration, calibration, validation, and terminal safety governance.
