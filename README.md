# ZERO-WAIT STS

ZERO-WAIT STS is an advisory coordination concept for reducing avoidable
inter-cycle dwell between ship-to-shore (STS) crane moves. This repository
keeps three deliberately separate tracks so that a presentation prototype,
synthetic simulation evidence, and CHESSCON integration work are never
mistaken for one another.

## Evidence boundary

Nothing in this repository is a terminal-performance result, a field
deployment, or a native CHESSCON ZERO-WAIT treatment result. ZERO-WAIT is
advisory in concept: it proposes readiness and fallback choices; operators and
existing safety systems remain in control.

| Track | Location | What it is | What it is not |
| --- | --- | --- | --- |
| Python synthetic DES | [evidence/synthetic-des-v2](evidence/synthetic-des-v2) | A standalone, uncalibrated, offline Python discrete-event study labelled `SYNTHETIC_OFFLINE_NOT_CHESSCON` | A calibrated terminal model or CHESSCON R0/R1 result |
| Advisory presentation demo | [src](src) and [docs/implementation-mvp.md](docs/implementation-mvp.md) | A React/Vite/Three.js storyboard and synthetic advisory-engine MVP | A live TOS, PLC, GPS, or safety-system integration |
| CHESSCON readiness | [evidence/chesscon-integration-readiness](evidence/chesscon-integration-readiness) | Curated integration-readiness status and provenance | Evidence that ZERO-WAIT was installed, bound, Project-Checked, or executed natively |

## Public project access

The curated evidence is published on the named
[`codex/straight-quay-zero-wait`](https://github.com/Praharsh-Projects/PEMA/tree/codex/straight-quay-zero-wait)
branch and is proposed for [`main` in pull request
#1](https://github.com/Praharsh-Projects/PEMA/pull/1). The direct evidence
entry point is
[`evidence/synthetic-des-v2`](https://github.com/Praharsh-Projects/PEMA/tree/codex/straight-quay-zero-wait/evidence/synthetic-des-v2).

These are named public links. They are appropriate for the public or
camera-ready version of a paper, but must not be cited in a double-blind
submission. The blinded submission instead uses its separately frozen,
anonymous supplementary package.

## Python synthetic DES

The curated repository includes source code, tests, configuration, aggregate
results, figures, verification output, and SHA-256 manifests in
[`evidence/synthetic-des-v2`](evidence/synthetic-des-v2). The full raw package
(per-move and per-run traces plus the materialized random tape) remains outside
Git and will be published only as a checksummed GitHub Release asset after a
versioned release is approved.

Verify the published curated snapshot with Python 3.11+ and Pillow:

```bash
python3 -m pip install -r evidence/synthetic-des-v2/requirements.txt
python3 scripts/verify_curated_synthetic_des_release.py
```

To reproduce the complete study (which writes ignored raw traces locally):

```bash
cd evidence/synthetic-des-v2/study
python3 -m unittest discover -s tests -v
python3 run_study.py
python3 build_release.py
python3 verify_package.py
```

The experiment uses 3 synthetic conditions × 30 paired replications × 2
policies = 180 terminating runs. Its results are synthetic simulation
summaries only, not terminal-performance confidence intervals.

The curated repository check validates its hashes, claim boundary, aggregate
records, and the preserved full-study verification report. It deliberately
does not claim to revalidate raw traces that are excluded from Git; see
[`RELEASE_ASSET_POINTER.md`](evidence/synthetic-des-v2/RELEASE_ASSET_POINTER.md).

Maintainers stage a vetted build without copying raw traces into Git:

```bash
python3 scripts/stage_synthetic_des_release.py \
  --source /path/to/build/synthetic_des_release \
  --raw-archive /path/to/zero-wait-synthetic-des-v2-raw-data.zip
```

The staging command rejects a source that lacks the required
`SYNTHETIC_OFFLINE_NOT_CHESSCON` label or still contains obsolete
“pre-registered” wording.

## Advisory presentation demo

The web application is a storyboard-style React/Vite + Three.js demo and a
synthetic advisory-engine MVP. It intentionally models synthetic feeds and
recommendations rather than connecting to a terminal.

```bash
npm install
npm run dev
```

Open the displayed Vite URL, normally `http://localhost:5173/`. The synthetic
implementation console is at `http://localhost:5173/#implementation`.

Useful checks:

```bash
npm test
npm run build
```

For the proposed real-port integration path and its safety boundary, see
[docs/implementation-mvp.md](docs/implementation-mvp.md) and
[docs/zero-wait-sts-project-plan.md](docs/zero-wait-sts-project-plan.md).

## CHESSCON integration-readiness work

The CHESSCON materials are documented as integration-readiness work only. The
currently admitted evidence supports safe-copy and readiness-path activities;
it does **not** establish a native ZERO-WAIT installation, controller/TOS
binding, Project Check, paired baseline/treatment run, or native ZERO-WAIT
result. The curated record is dossier-only readiness evidence; it does not
include an unverified native runtime diagnostic.

See [evidence/chesscon-integration-readiness](evidence/chesscon-integration-readiness)
for the claim boundary, dossier-derived status matrix, and owner-authorized
contextual screenshot. The image is illustrative only, not a treatment or
performance result.

## Licenses

- Source code: [MIT License](LICENSE).
- Documentation and synthetic data: [CC BY 4.0](LICENSE-DATA-DOCS.md).
- The owner-cleared CHESSCON screenshot is explicitly excluded from both
  licences; see its [separate rights/provenance record](evidence/chesscon-integration-readiness/assets/SCREENSHOT_RIGHTS_AND_PROVENANCE.md).

`zero_wait_sts_simulation.html` remains a legacy single-file reference.
