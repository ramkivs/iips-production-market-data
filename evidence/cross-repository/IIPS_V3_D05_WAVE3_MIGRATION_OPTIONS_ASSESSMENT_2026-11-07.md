# IIPS V3 — D05 Wave-3 — Migration / Replacement Options Assessment

**Governing authorization:** Program Authority task, 2026-11-07 — “Migration/Replacement assessment documentation — append-only retention vs governed replacement vs authenticated-universe-alongside; compatibility with manifests, revision semantics, identity resolution, provenance, runtime consumers. Do not choose and do not implement.”
**Scope:** IPD (`ramkivs/iips-production-market-data`) only. IRR untouched. Baseline `main@ac8b9be2be0fc7a418e536f69ead002fe0ac9bdd`.
**Status:** ASSESSMENT ONLY. No option is chosen, implemented, or pre-approved by this document. The Program Authority makes the decision; an execution pass requires its explicit task, sequencing and review.

## 0. Why this exists

The 2,250-record D05 broad-universe deposit (Wave-1 revision, `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`, SHA-256 `7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5`) is byte-frozen evidence. A governed Wave-3 expansion (authoritative NSE/BSE/MCA/taxonomy-backed) has not deposited anything yet. Before any such deposit is admitted, the corpus strategy must be picked: keep adding to the frozen baseline (A), replace it under a new revision (B), or run the authenticated universe alongside it (C). This document lays out what each implies. **It is not a decision.**

Read alongside: `docs/d05_audit_and_source_readiness_tools.md` (the A/B tooling), the corpus audit output (`audits/d05-corpus/corpus-audit.md`, git-ignored), and the Wave-3 receipt (`evidence/cross-repository/IIPS_V3_D05_WAVE3_UNIVERSE_EXPANSION_RECEIPT_2026-11-06.md`).

## 1. Invariants every option must preserve

1. **Records are PA-decision artifacts.** No record is invented, inferred from name similarity, promotion-eligible-by-tool, or numerically regularized to match the 2,250.
2. **Wave-1/Wave-2 evidence is immutable.** `evidence/operator_drop/d05_security_master_manifest.json` (`063288b3…`), `…wave2_disposition_manifest.json` (`21a6b473…`) and Wave-2/Wave-3 disposition logs and receipts stay byte-identical; W-1 stays hard-false.
3. **All-or-nothing admission.** A Wave-3 deposit is admitted as a reviewed unit (one gate run, one merged corpus JSON + manifest + runtime asset + re-pinned constant + tests in one green PR), never row-by-row in production.
4. **No automatic promotion to authenticated.** Every record, however sourced, starts `UNCLASSIFIED` until evidence-bound issuer verification admits it (PA decision 2026-10-19-01 C1–C3). The two tools produced for this task enforce exactly that.
5. **Runtime identity-resolution behavior does not change silently.** Any option touching `src/identity/d05_broad_universe_data.ts`, `broker_observation_resolver.ts` or reconciliation v1/v2 is a code change with its own review, tests and PA sign-off — none of that is implicit in a data act.
6. **No operational DB, provisioning, SCM0, or deployment** result from any option without a fresh explicit PA authorization.
7. **Corporate actions are effective-window events**, not in-place edits; superseded rows retain their windows.

## 2. Current-state facts the options must absorb

| Fact | Value |
|---|---|
| Records in deposit | 2,250 — all 16 fields present 2,250/2,250; 0 missing/blank/null; 0 findings on corpus audit (`CRITICAL=0/WARNING=0/INFO=0`) |
| Composition | 52 real-looking (Nifty-50-like + `AIIL` + `AGI`) + 2,198 algorithmic-series markers (name `^<TOKEN>\d{4} India Limited$` == companyId token) — detectors report COUNTS only |
| Origin policy | `UNCLASSIFIED` for every record; markers are not authenticity verdicts |
| Listings | 2,251 NSE + 2,252 BSE entries; exchange pairs `BSE+NSE` = 2,250; listings/record: 2,248×2, 1×3 (AIIL), 1×4 (AGI) |
| Uniqueness | companyId / ISIN / CIN / NSE symbol / BSE symbol / BSE scrip code all unique (2,250 each, audit `CHECK-UNIQUENESS` PASS); every ISIN passes ISO-6166 shape + Luhn; every CIN MCA-like `L…` |
| Sector/industry | 15 sectors (uniform-ish ~146–154), 75 industries; uniform `effectiveFrom 2015-01-01T00:00:00.000Z`; `tickSize 0.05` all; `lotSize 1` all; `faceValue ∈ {1,2,5,10}` (567/565/557/561) |
| Runtime overlay | AIIL BSE 543989→539177 correction is RUNTIME-ONLY (`src/identity/d05_listing_corrections.ts`); deposit byte-preserved |
| Runtime asset | `src/identity/d05_broad_universe_data.ts` SHA-256 `6810c28e…`; pinned by `D05_BROAD_UNIVERSE_SOURCE_REVISION` in `src/identity/governed_fixture_master.ts` plus ~10 count/checksum pins across tests |
| Wave-3 deposition | Not run; `scripts/wave3_universe_expansion.mjs` + gate ready; zero authoritative bytes deposited as of 2026-11-07 |
| B-06 (68 rows) | Reassessment permitted ONLY against a NEW Wave-3 revision, never against the existing 2,250 |

## 3. Option A — Append-only retention (expand the pinned revision)

Keep the 2,250 deposit byte-identical; materialize a Wave-3 corpus as Wave-1 bytes + governed append (or a sibling revision that embeds the first 2,250 unchanged and appends new rows).

**Compatibility with manifests.** Wave-1/Wave-2 chain stays intact (no edits to any pinned manifest). The Wave-3 EXPANSION_DEPOSITION manifest points at the prior revision and records `D05_BROAD_UNIVERSE_SOURCE_REVISION` bump alongside `priorRevision` binding; the receipt chain (Wave-2 → Wave-3) remains legible.
**Revision semantics.** New revision id; the checksum-chained “corpus = exact bytes” pin moves to the merged file; Wave-1 bytes remain documented-by-reference (`evidence/operator_drop/…` is never overwritten — the deposit prefix lives in the new merged artifact, verified by prefix-value-identity test).
**Identity resolution.** No behavior change; the runtime asset is re-rendered from the merged corpus with the same overlay machinery. Newly admitted real securities resolve exactly as the existing 52 do.
**Provenance.** Every appended row must carry deposit evidence (source act, source hash, as-of); the 2,250 legacy rows keep their `UNCLASSIFIED` status — appending does not launder them.
**Runtime consumers.** `d05_broad_universe_data.ts` re-rendered; broker_observation_resolver unchanged (it observes symbols/ISINs, not counts); count/checksum pins re-pinned in ONE green PR; W-1 untouched.
**Blast radius.** Largest on tests (≈10–20 pin assertions + `governed_fixture_master.ts`); zero on behavior.
**Trade-offs.**
- + Preserves maximal institutional continuity; the deposit narrative stays serial and auditable.
- + The Wave-3 CLI (`scripts/wave3_universe_expansion.mjs`) already implements EXACTLY this materialization (merged corpus JSON + manifest + runtime asset into `--output-dir`) with prior-revision value-identity verification.
- − The 2,198 synthetic-series rows remain in the operational universe forever; only provenance distinguishes them; any consumer reading the runtime asset cannot tell which rows are legacy-synthetic without consulting the audit.
- − Uniqueness conflicts with prior rows are the depositor’s problem: all 2,250 prior ids/ISINs are reserved; the gate rejects collisions deterministically.
- − If the expansion is rejected or fails review, the runtime asset is not re-rendered — low rollback cost (one revert), high pin friction (re-pin twice).

## 4. Option B — Governed replacement (new revision supersedes Wave-1)

The deposit corpus is replaced wholesale by the Wave-3 authorized dataset; Wave-1 is retired from runtime; its bytes persist only as historical evidence.

**Compatibility with manifests.** Same chain mechanics as A, but the new manifest carries `kind: EXPANSION_DEPOSITION` with an explicit supersedure statement; Wave-1 manifest stays immutable as history. Downstream evidence consumers that cite `7f53540b…` must be annotated (docs only — pins unchanged where they reference the historical hash).
**Revision semantics.** Same `D05_BROAD_UNIVERSE_SOURCE_REVISION` bump; re-pins identical to A. The distinction is semantic: Wave-1 becomes NON-runtime evidence rather than a prefix of runtime truth.
**Identity resolution.** Runtime behavior identical to A (single corpus in memory). No change for consumers code-wise.
**Provenance.** Strongest hygiene: DEPOSITED Wave-3 bytes constitute the entire runtime truth; every ACTIVE row traces to one act. Legacy 2,250 records either enter via “carried-forward WITH Wave-3 re-validation” (each must re-derive all 16 fields against the Wave-3 sources — effectively making them new candidates) or retire from runtime entirely.
**Runtime consumers.** Same as A once re-rendered.
**Blast radius.** Highest on tests + operational review: every pin moves to the NEW corpus shape; records/counts/sector distributions change entirely; all distribution assertions and any hard-coded “2250” are re-pinned; reviewers must re-read the dataset, not a diff.
**Trade-offs.**
- + One authority, one act, one truth: no permanent synthetic-series tail; the deposit finally matches the intended “authoritative universe” claim, subject to PA naming the act.
- + Cleanest end state for B-06 reassessment afterwards (all securities re-verified post-replacement).
- − Requires an authorized Wave-3 deposit of size ≥ the full admitted universe, including revalidated RETAINED names (or explicit supersession without retention, leaving 52 real-but-unverified rows out — they may not exist in sources; treating them as new candidates is the only honest path).
- − Highest cost/risk now, with still-missing authoritative sources (see blocker section of the Wave-3 receipt).
- − Any collision-free “2,250 carried” set that keeps failing MCA/taxonomy linkage must be reconciled or rejected by the act — the PA owns that list.

## 5. Option C — Authenticated universe alongside (parallel authority)

Keep the 2,250 runtime corpus untouched. Deposit Wave-3 as a SEPARATE authenticated universe (own revision, own runtime asset, own audit pins), consulted by consumers per an explicit policy (authenticated-first with recorded fallback, or authenticated-only for new flows).

**Compatibility with manifests.** Wave-1/2/3 unchanged; Wave-3 manifest is additive with its OWN batchId; no prefix-inheritance binding needed; cross-corpus uniqueness enforced by a NEW check (`~universe-constitution` style) rather than the existing gate alone.
**Revision semantics.** Two revision pins coexist (`D05_BROAD_UNIVERSE_SOURCE_REVISION` stays on Wave-1; a parallel `D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION` governs the new asset). Governed-fixture pins split accordingly.
**Identity resolution.** The only option that intrinsically touches it: either (i) a strict feature-flag resolver (default OFF), (ii) resolution confined to new consumers, or (iii) dual-resolution with logged disagreement counters. Any of these changes observable identity-resolution behavior, so this option implicitly demands an Explicit Act amending the resolver policy — forbidden under this pass’s task terms (“no changes to runtime identity-resolution behaviour” unless a future task says otherwise; but C cannot exist without it).
**Provenance.** Best-of-both for the new set; legacy set untouched and still `UNCLASSIFIED`. Deposition hygiene identical to A/B for the new rows.
**Runtime consumers.** Two in-memory masters + precedence logic + telemetry; broker_observation_resolver gains a second revision to consult; every consumer needs the precedence contract documented and tested.
**Blast radius.** Code-wise: resolver/reconciliation/telemetry changes + new pins — larger engineering blast radius than A; smaller operational blast radius than B (nothing legacy moves).
**Trade-offs.**
- + Zero risk to the operational deposit; the authenticated population can be built incrementally and admitted in stages (still all-or-nothing per revision, but multiple revisions may land).
- + Rollback is trivial (never reads the parallel asset).
- − Two masters = permanent dual truth until a PA-scheduled retirement of Wave-1; every report must state which universe it read; reconciliation v1/v2 must learn both revisions.
- − Slows the B-06 reassessment truthfully resolving only after precedence is decided per consumer.
- − Silent drift risk if precedence is implicit; requires explicit acts amending resolver behavior — a bigger program than A or B and strictly additive work.

## 6. Side-by-side

| Axis | A — Append-only retention | B — Governed replacement | C — Authenticated alongside |
|---|---|---|---|
| Wave-1/Wave-2 manifests | untouched (prefix verified) | untouched as history; superseded in runtime | untouched (new parallel manifest) |
| `D05_BROAD_UNIVERSE_SOURCE_REVISION` | bump to Wave-3 revision | bump to Wave-3 revision | unchanged (new parallel revision pin) |
| Merged corpus bytes | prefix-identical by test | entirely new asset; old asset retired from runtime | Wave-1 asset unchanged; new asset added |
| Synthetic-series rows 2,198 | retained forever in runtime | excluded (unless revalidated as candidates) | remain in legacy set only; authenticated set clean |
| Runtime identity resolution | unchanged | unchanged | **changes (requires amending act)** |
| Provenance hygiene of new rows | new+legacy coexist; per-row acts required | strongest monochrome act | strongest, additive |
| Provenance hygiene of legacy rows | unchanged (`UNCLASSIFIED`) | gone or re-deposited as candidates | unchanged legacy + clean authenticated set |
| Test/pin blast radius | ~10–20 re-pins (counts/checksums) | ~20–40 re-pins + distribution assertions rewrite | new pins + resolver/consumer tests; legacy pins stable |
| Operational risk on merge | medium | highest | low for legacy; medium for resolver |
| Rollback | revert one PR + re-pin | full dataset revert + re-pin | disable parallel asset; nothing legacy moves |
| Gate/CLI readiness | already implemented (`scripts/wave3_universe_expansion.mjs`) | same materializer; act must supersede | same deposit mechanics per parallel asset |
| Authoritative bytes requirement | Wave-3 act + dataset; NO live bytes in sandbox | same, plus decision to supersede 2,250 | same, plus precedence policy ratified |
| B-06 68-row reassessment | after Wave-3 merge, vs merged corpus | after Wave-3 merge, vs replacement corpus | after precedence act, per chosen precedence |

## 7. Exact evidence required before ANY option can execute

1. An authorized Wave-3 deposition act (name, effective date, signatory) naming the source set.
2. Authoritative, locally supplied, SHA-256-pinned sources for: NSE CM equity listing master; BSE listing master; MCA company master (CIN + face value; bridge column or exact-match rule); named industry/sector taxonomy. Tick-size treatment resolved (as-of band rule or act-bound uniform value — never defaulted).
3. A clean run of `scripts/source_readiness.mjs` (verdict `DEPOSITION_READY`, zero blocking reasons) recorded in the Wave-3 act evidence.
4. A dry-ruled `scripts/wave3_universe_expansion.mjs` output (ADDED set, conflicts list, scope coverage incl. the 67) reviewed pre-merge.
5. One green PR re-pinning governed constants + tests; merged before any B-06 reassessment; reconciliation v1/v2 semantics preserved unless the act says otherwise.

## 8. Decisions reserved for the Program Authority (not decided here)

1. Option A vs B vs C (or a staged A-then-B sequence).
2. Fate of the 2,198 synthetic-series rows under B (full exclusion vs selective re-admission via Wave-3 candidates) and under A/C (permanent legacy tagging in docs and audits).
3. Treatment of the 52 real-but-`UNCLASSIFIED` rows: require Wave-3 revalidation under B; keep under A/C with explicit notice.
4. AIIL `BSE 543989→539177` runtime-only overlay: deposit-time normalization under Wave-3, or runtime-only forever.
5. Tick-size binding for the CM set (uniform `0.05` with deviation notice, or per-band extract from an as-of NSE CM circular).
6. AGI/AIIL liveness: whether either is admitted as ACTIVE under Wave-3 evidence, and under which act.
7. B-06 reassessment sequencing relative to the Wave-3 merge.
8. Whether option C is ever admitted, and what the precedence act looks like if it is (resolver amendment, telemetry, rollback switch).

## 9. Explicit non-goals of this document

No implementation, no PR pin changes, no manifest edits, no resolver changes, no deployment, no claim that any option is approved, no claim that the ACTIVE NSE CM universe is expanded (it is not — tooling only as of 2026-11-07).

---

## Amendment — PA Decision (2026-11-07): Option B selected

**Decision:** The Program Authority has selected **Option B — Governed Replacement of the D05 Security Master** (authoritative reference: 2026-11-07 PA decision naming `main@fb6cf91219c0a270d42c3618aa20ed6682699817` as post-PR #135 baseline).
**Effect:** options A (append-only retention) and C (authenticated universe alongside) are **closed** — not under consideration in any future task unless a fresh PA decision re-opens them.
**Operationalization:** `evidence/cross-repository/IIPS_V3_D05_WAVE3_OPTION_B_GOVERNED_REPLACEMENT_PLAN_2026-11-07.md` records the verified-implementation inspection, exact replacement semantics, treatment of the 2,198 generated + 52 previously classified real records, the runtime consumer re-pinning blast radius, the phased execution plan (P0–P9), required source datasets/evidence, and the remaining PA sub-decisions (D-1…D-15).
**Nothing is deposited by this amendment.** The authenticated replacement universe does not exist; §3.1–§3.2 of the prior analysis stands as correct for A and C only in historical context. The 2,250-record Wave-1 revision remains byte-identical evidence (`7f53540b…74b5`) until a future, separately authorized execution completes P5–P7.
