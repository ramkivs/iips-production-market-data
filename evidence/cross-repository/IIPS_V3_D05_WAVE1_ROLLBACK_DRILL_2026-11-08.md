# D05 — Wave-1 Historical Preservation & Rollback Drill (P8) — receipt (2026-11-08)

**Governing authorisation:** PA directive 2026-11-08 FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT + "Decision: MERGE AUTHORIZED" instruction of 2026-11-08 (post-merge P8/P9 scope). Plan reference: Option-B §5, P8 (verbatim): "Wave-1 bytes re-verified post-merge (`7f53540b…`); rollback drill: hydrated legacy master loads, resolves one pinned legacy ISIN, registers quarantine paths intact; drill is evidence-only (not a runtime toggle) | Drill receipt in evidence; Wave-1 checksum re-computed = pin."

**Execution environment:** session branch `arena/59e54963-iips-production-market-data`, fast-forwarded to `b60db672e298f3804942ba961bb9daed688b08da` (the PR #139 merge commit on `main`). As-of: 2026-11-08 (UTC).

## 1. As-deposited Wave-1 pins — re-verified against the *merged* tree (`b60db67`)

| Item | Command | Result |
|---|---|---|
| Wave-1 corpus | `git show b60db67:evidence/operator_drop/d05_security_master_broad_universe.json \| sha256sum` | `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5` ✓ |
| Wave-1 manifest | `git show b60db67:evidence/operator_drop/d05_security_master_manifest.json \| sha256sum` | `063288b329e09aa937899e0071ae5ff77321791501aab57766e8ce215156d51c` ✓ |
| Wave-2 disposition manifest | `git show b60db67:evidence/operator_drop/d05_security_master_wave2_disposition_manifest.json \| sha256sum` | `21a6b47316753755897bf8dabce84c88bc069d13b3d6ecbc83dc272218ada63c` ✓ |
| Wave-1 runtime asset | `git show b60db67:src/identity/d05_broad_universe_data.ts \| sha256sum` | `6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5` ✓ |

No Wave-1 byte was modified by the replacement (verified again at the merge commit — expected: the replacement commit contains no Wave-1 content edits).

## 2. Rollback drill — executed as `tests/d05_wave1_rollback_drill.test.ts` (RB-01 … RB-05)

- **RB-01** — corpus + runtime asset sha256 equal their pins; `D05_BROAD_UNIVERSE_ENTITIES.length === 2250`.
- **RB-02** — `getGovernedLegacyWave1SecurityMaster()` hydrates; `sourceRevision` binds `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001` / recordCount 2250 / `AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001`.
- **RB-03** — pinned legacy ISIN `INE206F01022` resolves → `EQ_AIIL_IN`; `BSE:539177` resolves → `EQ_AIIL_IN`; legacy runtime projection carries `['539177']` only.
- **RB-04** — quarantine paths intact: `BSE:543989` fails closed (`UNMAPPED_IDENTIFIER`, Sai Silks absent from Wave-1); unmapped ticker refuses via `IdentityAmbiguityError`; authenticated provider shows `INE438K01021` → `EQ_KALAMANDIR_IN` (own entity).
- **RB-05** — the drill is evidence-only: production remains `getGovernedBroadSecurityMaster()` → `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001` / 2,390; legacy object identity ≠ current object; no pointer flipped.

Drill result on the post-merge tree: **RB-01 … RB-05 — all pass** (`npm test`).
Drill receipt: this file. **Retention:** `evidence/cross-repository/`, alongside the other D05 receipts. **Rollback triggers** (per R-8/D-12) remain: hydration failure, integrity drift, fatal data defect — each would require a dedicated PA rollback act; neither fired and no rollback was performed or enabled.

## 3. Limits

- The drill proves the as-deposited Wave-1 evidence is byte-identical and its legacy hydration is loadable — it is **not** a runtime toggle and carries no authority to revert the 2026-11-08 replacement.
- The legacy corpus keeps its as-deposited content (including the as-deposited dual listing rows for `EQ_AIIL_IN`); the runtime *projection* corrected only the wrong-issuer scrip, unchanged by this drill.
