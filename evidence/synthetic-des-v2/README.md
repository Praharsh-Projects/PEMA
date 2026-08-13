# ZERO-WAIT synthetic DES v2 — curated public snapshot

`SYNTHETIC_OFFLINE_NOT_CHESSCON`

This directory is a curated, named-repository snapshot of a standalone Python
discrete-event simulation (DES). It is not a CHESSCON project, terminal
deployment, field-calibrated model, or source of native ZERO-WAIT treatment
results.

## What is tracked in Git

The controlled staging script copies only reviewable, reproducible artefacts:

- Python source, configuration, and tests;
- the claim boundary and study documentation;
- aggregate paired summaries, figures, verification report, and failure record;
- SHA-256 manifests and a provenance record.

The source build must state `SYNTHETIC_OFFLINE_NOT_CHESSCON` and use
“pre-specified,” not “pre-registered,” for the fixed experiment configuration.

## What is not tracked in Git

Raw per-move and per-run traces, the materialized random tape, and their ZIP
archive are intentionally excluded. They are required reproducibility material
but are too large and are instead released as one checksummed GitHub Release
asset. See [RELEASE_ASSET_POINTER.md](RELEASE_ASSET_POINTER.md).

## Verify the curated snapshot

From the repository root:

```bash
python3 -m pip install -r evidence/synthetic-des-v2/requirements.txt
python3 scripts/verify_curated_synthetic_des_release.py
```

This validates the public files and the preserved full-study verification
report. It deliberately does not claim to revalidate raw traces which are not
present in Git.

## Stage a verified build

From the repository root, once the verified build and raw-data ZIP exist:

```bash
python3 scripts/stage_synthetic_des_release.py \
  --source /path/to/build/synthetic_des_release \
  --raw-archive /path/to/zero-wait-synthetic-des-v2-raw-data.zip
```

The command copies no raw trace into this repository. It records the raw
archive's filename, byte size, and SHA-256 in the release-asset pointer. The
pointer must be updated with the immutable GitHub Release URL only after the
post-review release is created.

## Reproduce the full study locally

```bash
python3 -m pip install -r requirements.txt
cd study
python3 -m unittest discover -s tests -v
python3 run_study.py
python3 build_release.py
python3 verify_package.py
```

Running the study locally recreates ignored raw files under `study/generated/`.
The published aggregate files remain a frozen record of the staged build.
