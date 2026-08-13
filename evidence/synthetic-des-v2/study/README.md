# ZERO-WAIT synthetic DES v2 — curated reproducibility guide

`SYNTHETIC_OFFLINE_NOT_CHESSCON`

This is the executable source of a standalone, offline Python discrete-event
simulation (DES). It models synthetic readiness coordination only. It contains
no terminal data, TOS feed, PLC interface, CHESSCON project, native controller
binding, or native treatment result.

Read [CLAIM_BOUNDARY.md](CLAIM_BOUNDARY.md) before using the study. The frozen
aggregate results and figures are in [../results](../results); the full raw
trace archive is intentionally excluded from Git and identified in
[../RELEASE_ASSET_POINTER.md](../RELEASE_ASSET_POINTER.md).

## Reproduce

From the repository root:

```bash
python3 -m pip install -r evidence/synthetic-des-v2/requirements.txt
cd evidence/synthetic-des-v2/study
python3 -m unittest discover -s tests -v
python3 run_study.py
python3 build_release.py
python3 verify_package.py
```

The model uses Python 3.11+ and Pillow for deterministic PNG figures; all
other dependencies are from the standard library. Local execution materialises
raw per-move/per-run traces and a policy-independent random tape under
`generated/`. Those raw outputs are ignored by Git. To compare a local
regeneration with the frozen release, consult the source and generated
manifests in [../provenance](../provenance).

## Fixed synthetic experiment

Each replication contains one STS crane, five one-container internal transfer
vehicles, one yard-service point, one physical pre-stage position, and 120
import moves. The pre-specified scenario manifest fixes the topology,
distributions, seeds, metrics, and controller conditions.

- `R0_REACTIVE` dispatches an eligible vehicle only after handoff demand.
- `R1_ZERO_WAIT` evaluates every five seconds, ranks eligible vehicles by
  projected ETA, examines three task candidates, commits a reservation at the
  final grid tick 10 to less than 15 seconds before a nominal 130-second
  forecast, permits one staged vehicle, and uses reactive fallback when it
  cannot stage a vehicle.

The 180 planned terminating runs are 3 conditions × 30 paired replications ×
2 policies. The SHA-256 keyed random tape is policy independent; realised STS
service and post-selection vehicle delays are not revealed to the ETA ranking.
Per-move logs retain task/vehicle selection, controller evaluations,
reservation and forecast timing, staging/fallback state, block recovery,
realised delay, and inter-cycle dwell.

## Interpretation boundary

The results are uncalibrated synthetic simulation summaries. They are not
terminal-performance confidence intervals. They are not a native CHESSCON
result. They are not empirical results or evidence of a field deployment. The
model abstracts pre-stage readiness and omits road-lane conflicts, upstream
queues, cancellation costs, operator behaviour, safety logic, multi-crane
interactions, and CHESSCON controller binding.

For the fixed configuration, see [config/scenario_manifest.json](config/scenario_manifest.json).
For the build-release logic, see [build_release.py](build_release.py). The
frozen release provenance is [../provenance/RELEASE_PROVENANCE.md](../provenance/RELEASE_PROVENANCE.md).
