# SYNTHETIC_OFFLINE_NOT_CHESSCON — release provenance

This release is a self-contained, author-defined, offline synthetic DES package. Its only numerical inputs are the pre-specified distributions and condition settings in `../study/config/scenario_manifest.json`; it contains no field, terminal, TOS, telemetry, PLC, CHESSCON-project, or native-controller data.

The release process is intentionally reproducible:

1. `run_study.py` materialises policy-independent SHA-256 random-input tapes and executes the fixed 180-run matrix.
2. `build_release.py` creates the full raw-data ZIP and its file-level SHA-256 inventory.
3. `verify_package.py` recomputes event-level metrics, checks controller and capacity invariants, checks paired inputs and claim boundaries, and validates generated, package, and ZIP checksums.

The archive is a synthetic methods/data artifact. It is not a CHESSCON result, empirical study, terminal-performance estimate, native CHESSCON execution, or validation of a field deployment. The controller is advisory in concept and does not override operators or safety systems.

The package retains the stated model limits: one STS, five ITVs, one yard-service point, one physical stage position, no external spatial network, no operator-behaviour model, no safety logic, no TOS/telemetry feed, no multi-crane interactions, and no CHESSCON controller binding.
