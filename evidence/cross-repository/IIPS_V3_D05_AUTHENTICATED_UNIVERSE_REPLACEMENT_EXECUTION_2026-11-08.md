# D05 — One-Time Governed Replacement: Runtime Execution & Verification (2026-11-08)

**Governing directive:** IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT (PA, RAMAKAISHRAN).
**Branch:** `arena/59e54963-iips-production-market-data` (unmerged). **PR #139 merge authority NOT established.**
**Scope discipline:** no inventory/WMS; no operational/promotion writes; PR #139 unchanged; P9 / B-06 remain post-merge and unexecuted.
**Supersedes nothing:** the Wave-1 deposition stays byte-pinned as immutable as-deposited evidence; the 2026-11-07 Wave-3
publication and its `DEPOSITION_BLOCKED` verdict remain historical record. This pass executes the 2026-11-08 directive only.

The directive's verbatim 12-item acceptance enumeration is **not restated here** (a paraphrase could substitute for the
directive); it is retained in the directive itself and in the PR #139 review trail. Delivery is mapped below to the directive's
decision atoms, each with its as-of time and basis. Where a fact could not be independently verified, that is stated.

## 1. Deposition layer (committed as `44040ca`)

- Latest publication zip verified (sha256 `c86230451ec35f6fd5aa91d20a31db9de7f38e109ea3afedb9ceffaecc1014ee`;
  the Wave-3/arena_D05_evidence.zip). Its as-published verdict `DEPOSITION_BLOCKED` is preserved, not edited.
- Replacement asset derived and bound: `evidence/operator_drop/arena_B05_latestcsvs.zip` was consumed read-only; the deposit
  `d05_security_master_authenticated_universe_2026-11-08.json` carries **2,390 records**, sha256
  `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`, asset sha256 `f886e6c9a31beb9e84e0dfa6d2e62d315cf7cc242a57132159f373ee247eabba`,
  manifest sha256 `7c5b60221102ff4b0646d89e39c9156eca9bcc4db6d7ed5c3b2d341f5e9b0012`;
  revision `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`; act `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`.
- **D-2 / B2 final binding.** B2 conditional acceptance REJECTED; the act binds the **verified exact-ISIN join**:
  2,290 BSE-dual scrips reconstructed against the supplied BSE active-equity master @66362fc3 + exactly **100** `UNLISTED-BSE`
  governed exclusions (act-bound, never resolvable codes); the published (B2) scrip layer was disproven
  (2,181 of 2,290 contradicted) and is NOT treated as identity.
- Readiness rerun: `DEPOSITION_READY` (deposit-bound). Reconciliation/id-stability implemented; docs appended append-only.

## 2. Execution layer (this change-set, uncommitted until this commit)

- `src/identity/d05_authenticated_universe_data.ts` — generated, byte-identical to the deposit (verified by `--check` and by
  `d05_browser_runtime_hydration.test.ts` EXPECTED_CHECKSUM).
- `src/identity/governed_fixture_master.ts` — `getGovernedBroadSecurityMaster()` now binds the authenticated universe
  (act-bound hydration, fail-closed `length !== 2390`); the Wave-1 path preserved verbatim as `getGovernedLegacyWave1SecurityMaster()`;
  Wave-1 occurrences of `applyD05AiilListingCorrection` untouched.
- `src/identity/broker_observation_resolver.ts` — hard guard re-pinned `recordCount !== 2250` → `recordCount !== 2390`,
  act reference updated.
- `frontend/src/features/security-master/SecurityMasterSurface.tsx` — governed-source marker now discloses
  "D05 Governed Authenticated Universe (2,390 entities)" and the replacement batch id.
- `src/audit/d05_corpus_audit.ts` + `scripts/d05_corpus_audit.mjs` — governed-exception marker set `UNLISTED-BSE` recognised as
  act-bound (UNLISTED-BSE never validates as a code); Wave-1 output compatibility preserved.
- `scripts/build_d05_authenticated_universe.py` — deterministic derivation (`--check` reproduces the deposit byte-identically).

## 3. Verification transcript for this pass (all re-run on 2026-11-08, UTC)

| Gate | Result |
|---|---|
| `npm run build:tsc` | clean (rc 0) |
| Deposit `--check` byte-identity | matches `b555fd28…` |
| Corpus audit | **0 CRITICAL** / 34 WARNING / 58 INFO (`evidence/D05-Wave3/deposit-2026-11-08/corpus-audit/`; Wave-1 byte pins unchanged) |
| `npm test` | **1179 executed, 1178 passed, 1 skipped (pre-existing windows-conditional in `g3_startup_validation`), 0 failed, exit 0** |

Per-test re-pins are **behaviour deltas, re-verified row-by-row against the authenticated deposit** (never silently weakened):

| Test | Delta |
|---|---|
| `d05_browser_runtime_hydration.test.ts` | checksum/count/corpus path → 2026-11-08 artefact; AIIL native; ASKAUTOLTD (not raw "ASK AUTOMOTIVE") |
| `d05_security_master_integrity_semantics.test.ts` | SMI-02/03/06/07/08/11 → authenticated corpus; AXISBANK window is the real 1998-11-16; AIIL window 2024-04-23 |
| `d05_identity_eligibility_characterization.test.ts` | CHAR-A/C/D re-scoped; new CHAR-D-02 pins the authenticated provider; Wave-1 assertions routed to the legacy drill |
| `d05_aiil_identity_reconciliation.test.ts` | deposit byte-check unchanged for Wave-1; current provider asserts 539177 native |
| `d05_wave2_broad_universe_disposition.test.ts` | W2-D-02/D-08 re-pinned: of the 67 disposition ISINs, **64 are now carried natively** by the authenticated universe (the Wave-2 act incorporated nothing); **3 remain UNRESOLVED** (`INE562X01013`, `INE583V01021`, `INE721I01024`) |
| `d05_wave3_evidence_reconciliation.test.ts` | execution-stage hard guard pin → `recordCount !== 2390`; Wave-1 as-deposited byte pins unchanged |
| `ws_a_dhan_broker_holdings_identity.test.ts` | WS-A-09: authenticated master resolves rows 1 (AGI GREENPAC alias), 21 (GHCL), 40 (KROSS) — 3 resolved / 65 unresolved; reject disposition unchanged |
| `non_production_operator_identity_bypass.test.ts` | criterion A (AMBUJACEM → `EQ_AMBUJACEM_IN`, INE079A01024); criterion B&C (ZOMATO row → `EQ_ETERNAL_IN` via ISIN `INE758T01015`, ISIN-first lookup; PAYTM row stays `UNRESOLVED/UNMAPPED_IDENTIFIER` — the fixture ISIN `INE982J01019` does not exist; the real one is `INE982J01020`, verified in the committed Wave-3 EQ source zip) |
| `p04_expanded_broad_universe_runtime_qualification.test.ts` | QUAL-02 → 2,390 + authenticated revision; QUAL-05 → 543989 = Kalamandir's own entity; QUAL-07 → TATAMOTORS retired in the Nov-2025 demerger (`TMCV`/`TMPV`); QUAL-01/Wave-1 pins kept as history |
| `e2e_broad_universe_multi_broker_integration.test.ts` | Phase 5 → 543989 resolves to `EQ_KALAMANDIR_IN` (never Authum) |
| `shell_security_master_surface.test.ts` | governed-source marker (2,390); CINs as deposited (INFY `L86033MH2008PLC368891`, RELIANCE `L77317MH1984PLC178202`) |
| `option_b_replacement_plan_conformance.test.ts` | runtime pin → `recordCount !== 2390`; Wave-1 plan doc assertions retained as history |
| `q1_broker_import_durability.test.ts` | guard-error message pin → authenticated act reference |

## 4. What is explicitly NOT claimed

- Deposit CIN/company facts are **record-keeping facts of the NSE CM EQ source**, not independently registry-verified (B1 discipline).
- Every record deposits **UNCLASSIFIED / UNKNOWN origin**; eligibility stays `NOT_ASSERTED`; no record is classed real-market.
- Exact-identifier resolution only — fuzzy matching is forbidden; `UNLISTED-BSE` never resolves; `ZOMATO` resolves only via its ISIN,
  never via name interpolation; PAYTM remains fail-closed under the fixture's (wrong) ISIN.
- No operational write, no market-data promotion, no IRR action; **PR #139 is NOT merged and NOT merge-authorized by this record.**
- P9 / B-06 and the gate run are post-merge and unexecuted.
- Docs were appended append-only (`docs/d05_audit_and_source_readiness_tools.md` §7).
- Where an as-of window existed (AXISBANK 1998-11-16, AIIL 2024-04-23, UTIBANK alias, 2020-pre-AIIL query), it was evaluated against
  the **real deposit windows**, never placeholder dates; pre-window queries fail closed.

## 5. Decision mapping (this pass)

| Decision | Binding as executed |
|---|---|
| D-1 | as-published `DEPOSITION_BLOCKED` retained; replacement executed from deposit-bound `DEPOSITION_READY` |
| B1 | every deposit record `UNCLASSIFIED`; zero generator markers; 58 CIN-less records carried as act-bound unlinked exceptions (INFO) |
| D-2 | exact-ISIN join only — ISIN queried first and alone; no symbol inference, no fuzzy match |
| D-3 | B2 conditional acceptance rejected; two-listed reconstruction bound; contradictions reported, never overridden |
| D-4 | `UNLISTED-BSE` accepted solely as the act-bound governed exclusion (100 rows); never a code |
| B3 | genuine deposited CINs preserved as-is; none invented — 34 MCA-like pattern findings left as WARNING |
| B5 | Wave-1 legacy index semantics retained via the legacy drill (`getGovernedLegacyWave1SecurityMaster`); B5 classification classes unchanged |
| D-9 | faceValue from NSE listing source; uniform `tickSize ₹0.05` recorded in deposit, never code-defaulted |
| D-13 | dual listing exactly for the 2,290 duals; 100 NSE-only exclusions; flags recorded per record |
| D-9/D-4 corpus integrity | corpus audit 0 CRITICAL; exclusion/marker logic act-bound; byte pins everywhere the corpus moved |

**As-of manifest time:** 2026-11-08 (UTC). **Manual approval:** PA RAMAKAISHRAN, per the 2026-11-08 directive (this pass) —
execution of an already-approved one-time replacement; no new authority is taken here.
