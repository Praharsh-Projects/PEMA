# Dossier-only source status and provenance

**Evidence class:** CHESSCON integration-readiness only.
**Native ZERO-WAIT result:** none.

## Public statement

CHESSCON was used for integration-readiness work, not as the source of the
quantitative ZERO-WAIT comparison. Preserved records document non-overwriting
safe project copies and an Input-editor attempt that did not expose a
targetable readback window. The technical gate therefore stopped before a
treatment edit, Project Check, controller/TOS binding, pilot, or final run.
ZERO-WAIT was not installed or executed in CHESSCON; no native R0/R1 result is
reported. The quantitative results in the associated study come from the
standalone synthetic Python DES.

## Source verification

The public forensic dossier archive passed its ZIP integrity check. Its
SHA-256 was:

```text
f0cd5c94999de4548f050a5ad20d7bcd1ab02ae19aa8735d2eef7d80ee3e64fa
```

The following source artefacts matched the dossier's
`PUBLIC_SHA256_MANIFEST.csv` during the 2026-08-14 audit:

| Dossier-relative artefact | SHA-256 | Public interpretation |
| --- | --- | --- |
| `README_FIRST.md` | `b369b752e659d376981fe3a1b54cad05d97340e47b0775859b33a1ecc9883aab` | Dossier context only. |
| `00_INDEX/claim_register.csv` | `3a32ee6185c061e29a65a51170c4a7989eddfb7536d881056ba31de0a9cfb2b1` | Claim boundary source. |
| `02_COMPANION_DATA/DESIGN/NATIVE_CHESSCON_STATUS.md` | `a522c35abc5d73d19c9ea63be2f0d8bf13bacd8cfae7c89675524e34de8f8729` | Technical gate not passed; no treatment evidence. |
| `02_COMPANION_DATA/DESIGN/NATIVE_CHESSCON_CAMPAIGN.md` | `41f117d5cff36c3e9658662c544d8773dcac737e2374ea9e5dfd8dee343903e9` | Planned campaign context, not execution. |
| `02_COMPANION_DATA/R4/native_chesscon_status/campaign_plan.json` | `607cfd0519fbdb1d2618dca385f2306101da51e442537e6f31dc08d2a1819ffd` | Planned, unexecuted protocol. |
| `02_COMPANION_DATA/R4/native_chesscon_status/campaign_status.json` | `ae150d727caba55cbfbc58b2b3ba1629e90f29c495cb79c9c4d8c12e740f4d6b` | Zero pilots and zero final runs for every arm. |

## Status matrix

| Activity | Status | Allowed description |
| --- | --- | --- |
| 0%, 20%, and 40% safe copies | Completed | Non-overwriting copies were prepared for a planned readiness protocol. |
| Input-editor attempt on the 20% copy | Attempted | No targetable/readback window was available through the approved control interface. |
| Treatment edit and readback | Not completed | Semantic project configuration remained unchanged. |
| Project Check, controller/TOS binding | Not completed | Required native-execution gates remain unavailable. |
| Native pilot/final execution | Not completed | Pilots: 0; final runs: 0. |
| Native R0/R1 comparison | Not completed | No native treatment effect or comparison is available. |

## Exclusions

This repository intentionally excludes CHESSCON project trees, vendor
executables, databases, full forensic dossiers, and unexecuted configuration
SQL. The separately described diagnostic archive was unavailable during the
2026-08-14 audit and is not cited or represented here. It can be considered
only if it is later reattached and independently validated against its own
manifest and provenance.
