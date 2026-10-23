# IIPS v3.0 — 51 × 17 Capability Matrix: Post-Merge Independent Verification

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAPMATRIX-51X17-POSTMERGE-VERIFICATION-2026-10-23-01` |
| **Record type** | Verification receipt. Documentation only; renders no authority, gate, fence, admission, acceptance, qualification or release decision |
| **Date** | `2026-10-23` (UTC) |
| **Repository / ref** | `ramkivs/iips-production-market-data` / `refs/heads/main` |
| **Verified `main` merge commit** | **`de2bb06339029934a9480b5514e4076758d0e33a`** (PR #65, merged `2026-10-23T14:53:40Z`) |
| **Verified root tree** | **`096c01eccb0ea76699316a05ae3a724e2a1eb616`** |
| **Superseded first merge** | `b8218eea22d73c55de3265e542b4d274f89349ce` (PR #64) — artifact defect corrected by `CR-01` in the publication receipt |
| **Method** | Artifacts were **re-downloaded from GitHub** through the Contents API at the live default branch (`gh api …/contents/<path>`), base64-decoded in a clean directory, then hashed and parsed. Nothing was read from the authoring worktree. |

---

## 1. Remote content read-back — hash comparison

| Artifact | Remote blob | Remote SHA-256 | Bytes | Matches receipt |
|---|---|---|---|---|
| `IIPS_V3_CAPABILITY_MATRIX_51x17_RECONSTRUCTION_2026-10-23.md` | `90131a0501f2e8502d29c576e595b1eb4f6f3cff` | `b73b4db23a3bd860a14b1d76f18d068926ffcaf2d858f855d80199989a1d2408` | 82,992 | **YES** |
| `IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.csv` | `b02d5859022a1531a0af38d3154188c4b7f62b6b` | `9ae7138682d59c3e86822070be05123c7536fe72d468f734142cfc5ac4a65b50` | 38,300 | **YES** |
| `IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.xlsx` | `bd3d3a3df322d4f4896f8b69988bd67dd06741d9` | `b3fa8fcb4e053c4361f6fab015916e87ea8870e73b715fa86a41e9789ce50c50` | 25,566 | **YES** |

## 2. Structural verification of the published bytes

| # | Check | Result |
|---|---|---|
| 1 | Matrix data rows in the published report | **51** |
| 2 | Rows numbered 1–51, contiguous | **PASS** |
| 3 | Header row = the 17 required columns, exact and ordered | **PASS** |
| 4 | Every matrix row carries exactly 17 columns | **PASS** (51/51) |
| 5 | CSV header identical to the required 17 | **PASS** |
| 6 | CSV shape 51 × 17 | **PASS** |
| 7 | All 51 capability names **character-exact** against the required inventory (incl. `↔` row 20/40, `→` row 33) | **PASS** |
| 8 | XLSX sheets `51x17 Matrix` / `Dispositions` / `Legend`; matrix 51 × 17 | **PASS** |
| 9 | XLSX names character-exact against the inventory | **PASS** |
| 10 | Empty cells in the published XLSX matrix | **0** |
| 11 | Rows missing any of the 15 assessment dimensions (CSV) | **0** |
| 12 | §B disposition summary carries 51 rows; §E total line reads 51 / 1–51 | **PASS** |

## 3. What this verification establishes — and what it does not

**Establishes.** The published artifacts are retrievable from `main` at `de2bb063…`, are byte-identical to the identities recorded in the publication receipt, and satisfy the required 51-row / 17-column structure with the capability names preserved exactly. The report, the CSV and the XLSX encode the same matrix.

**Does not establish.** Any authority, gate movement, fence lift, lineage admission, product acceptance, qualification, release readiness or production eligibility. This record verifies **bytes and structure**, not product status. The matrix's own §E.3 statement stands: no row is release-ready for production.

## 4. Correction history preserved

| Publication | Merge commit | Outcome |
|---|---|---|
| First | `b8218eea22d73c55de3265e542b4d274f89349ce` (PR #64) | Three capability names used ASCII arrows instead of the required `↔`/`→`. Found **by this post-merge retrieval**, not by the authoring checks. Superseded identities preserved in the publication receipt `CR-01` |
| Corrected | `de2bb06339029934a9480b5514e4076758d0e33a` (PR #65) | Names exact; report, CSV, XLSX regenerated from the single data source; no status, dimension, anchor or count changed |

Neither the first nor the corrected publication altered source, tests, scripts, schemas, routes, fences or dependencies. The four `503`-fence blobs (`98147054…`, `51704c12…`, `cb8db45d…`, `e6b57bb8…`) remain byte-identical.
