# WS-A — Dhan 68-row import: captured evidence set

Source of record for Workstream A (Dhan broker holdings import — identity resolution,
P04 quarantine and refusal-evidence completeness). Owner repository: **IPD**
(`ramkivs/iips-production-market-data`) for parsing, normalization, identity resolution and the
durable broker-import leg; **IRR** (`ramkivs/iips-review-recovered`) for the browser preview,
the CAP-02 save boundary and import-evidence retention.

| File | Contents |
| :--- | :--- |
| `rows.json` | The 68 observed rows, verbatim names, each row's raw digit string, the numeric reading used, **every** alternative decomposition, and the explicit absence of ISIN/exchange. |
| `dhan-web-ui-summary-68-reconstructed.csv` | The 68-row `DHAN_WEB_UI_SUMMARY_V1` surface reconstructed from `rows.json` (used as the test fixture). |
| `identity-outcomes.json` | The per-row identity outcome of the **actual** pipeline for the same 68 rows under (a) an empty `SecurityMaster` and (b) the governed D05 broad-universe master. |

## What the observed run was

* 68 native rows, `PARSED_UNRESOLVED`, 0 resolved, 68 unresolved, 0 saved.
* Displayed content digest `468441dfd0264fddc1e8a7160ebc7c3e5239fa97d13c7545743d1500eb6264b1`,
  read timestamp `2026-11-05T07:50:49.090Z`.
* Displayed refusal: `Identity ambiguity detected for 'AGI GREENPAC': UNMAPPED_IDENTIFIER (No
  active mapping found for BSE_SYMBOL:AGI GREENPAC at asOf 2026-11-05T07:50:49.090Z)`.
* ISIN and Exchange were blank in the observed surface; no ISIN or exchange value is present in
  this evidence set or asserted by any artefact here.

## Evidence limitations (explicit)

1. **The original bytes were not retained.** The running system displayed only a digest. The
   digest therefore cannot be verified against a source file, and the reconstructed fixture has
   its own digest (`c44e3cdb06e2d49f88c46d61867444f8a301cdf71a068b0e3aa1d748e6d52f31`). No claim
   is made that it equals the observed digest.
2. **Numeric columns are a de-concatenation.** The supplied row evidence carries each row's
   three numeric fields as a single digit string. `rows.json` records the reading used and every
   alternative reading; 67 of 68 rows have at least one alternative decomposition. The names are
   verbatim and are what identity resolution acts on, so the identity conclusions do not depend
   on which decomposition is chosen.
