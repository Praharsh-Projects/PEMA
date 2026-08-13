# PEMA ZERO-WAIT STS

ZERO-WAIT STS is an advisory coordination concept for reducing avoidable
inter-cycle dwell between ship-to-shore (STS) crane moves. This repository
keeps the presentation prototype, synthetic simulation evidence, and
CHESSCON integration work explicitly separate.

## Evidence boundary

Nothing in this repository is a terminal-performance result, a field
deployment, or a native CHESSCON ZERO-WAIT treatment result. ZERO-WAIT is
advisory in concept: it proposes readiness and fallback choices; operators and
existing safety systems remain in control.

| Track | Location | What it is | What it is not |
| --- | --- | --- | --- |
| Python synthetic DES | [evidence/synthetic-des-v2](evidence/synthetic-des-v2) | A standalone, uncalibrated, offline Python discrete-event study labelled SYNTHETIC_OFFLINE_NOT_CHESSCON | A calibrated terminal model or CHESSCON R0/R1 result |
| Advisory presentation demo | [src](src) and [docs/implementation-mvp.md](docs/implementation-mvp.md) | A React/Vite/Three.js storyboard and synthetic advisory-engine MVP | A live TOS, PLC, GPS, or safety-system integration |
| CHESSCON readiness | [evidence/chesscon-integration-readiness](evidence/chesscon-integration-readiness) | Curated integration-readiness status and provenance | Evidence that ZERO-WAIT was installed, bound, Project-Checked, or executed natively |

## Public project access

The public, versioned evidence entry point is
[evidence/synthetic-des-v2](evidence/synthetic-des-v2). The full raw synthetic
data archive is deliberately excluded from Git history and is provided as a
checksummed asset in the
[GitHub Release for zero-wait-synthetic-des-v1.0.0](https://github.com/Praharsh-Projects/PEMA/releases/tag/zero-wait-synthetic-des-v1.0.0).

These named public links are appropriate for a public or camera-ready paper,
but must not be cited in a double-blind submission. The blinded submission uses
its separately frozen anonymous supplementary package.

## Python synthetic DES

The curated repository includes source code, tests, configuration, aggregate
results, figures, verification output, and SHA-256 manifests in
[evidence/synthetic-des-v2](evidence/synthetic-des-v2). The release asset
contains the full raw per-move and per-run traces plus the materialized random
tape. Its expected SHA-256 is recorded in
[RELEASE_ASSET_POINTER.md](evidence/synthetic-des-v2/RELEASE_ASSET_POINTER.md).

Verify the curated snapshot with Python 3.11+ and Pillow:

~~~
python3 -m pip install -r evidence/synthetic-des-v2/requirements.txt
python3 scripts/verify_curated_synthetic_des_release.py
~~~

To reproduce the complete study locally (which writes ignored raw traces):

~~~
cd evidence/synthetic-des-v2/study
python3 -m unittest discover -s tests -v
python3 run_study.py
python3 build_release.py
python3 verify_package.py
~~~

The experiment uses 3 synthetic conditions × 30 paired replications × 2
policies = 180 terminating runs. It uses policy-independent, SHA-256-keyed
random tapes so paired policies see matched exogenous inputs. Potential
vehicle-delay draws materialize after vehicle selection rather than being
visible to ETA ranking. Results are synthetic simulation summaries only, not
terminal-performance confidence intervals.

The curated repository check validates hashes, claim boundaries, aggregate
records, and the preserved full-study verification report. It deliberately does
not claim to revalidate raw traces excluded from Git.

Maintainers can stage a vetted build without copying raw traces into Git:

~~~
python3 scripts/stage_synthetic_des_release.py \
  --source /path/to/build/synthetic_des_release \
  --raw-archive /path/to/zero-wait-synthetic-des-v2-raw-data.zip
~~~

The staging command rejects a source that lacks the required
SYNTHETIC_OFFLINE_NOT_CHESSCON label or contains obsolete “pre-registered”
wording.

## Advisory presentation demo

The web application is a React/Vite + Three.js storyboard and synthetic
advisory-engine MVP. It represents synthetic feeds and recommendations rather
than connecting to a terminal. It can be used for workshops and pitch
walkthroughs of look-ahead ranking, micro-slot positioning, resequencing,
handoff, safety-mode visualization, and feedback logging.

Requirements: Node.js 20+ and npm.

~~~
npm install
npm run dev
~~~

Open the displayed Vite URL, normally http://localhost:5173/. The synthetic
implementation console is at http://localhost:5173/#implementation.

Useful checks:

~~~
npm test
npm run quality
~~~

npm run quality runs the high-severity dependency audit and a production
build. For the proposed real-port integration path and safety boundary, see
[docs/implementation-mvp.md](docs/implementation-mvp.md) and
[docs/zero-wait-sts-project-plan.md](docs/zero-wait-sts-project-plan.md).

## CHESSCON integration-readiness work

The CHESSCON materials are documented as integration-readiness work only. The
currently admitted evidence supports safe-copy and readiness-path activities;
it does **not** establish a native ZERO-WAIT installation, controller/TOS
binding, Project Check, paired baseline/treatment run, or native ZERO-WAIT
result. The curated record is dossier-only readiness evidence and does not
include an unverified native runtime diagnostic.

See [evidence/chesscon-integration-readiness](evidence/chesscon-integration-readiness)
for the claim boundary, dossier-derived status matrix, and owner-authorized
contextual screenshot. The image is illustrative only, not a treatment or
performance result.

## Licenses

- Source code: [MIT License](LICENSE).
- Documentation and synthetic data: [CC BY 4.0](LICENSE-DATA-DOCS.md).
- The owner-authorized CHESSCON screenshot is excluded from both licences; see
  its [separate rights/provenance record](evidence/chesscon-integration-readiness/assets/SCREENSHOT_RIGHTS_AND_PROVENANCE.md).

zero_wait_sts_simulation.html remains a legacy single-file reference.
