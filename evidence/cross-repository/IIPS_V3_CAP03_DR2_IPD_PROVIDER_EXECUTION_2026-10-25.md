# CAP-03 DR-2 / DQ-1 — IPD provider-half execution record — 2026-10-25

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP03-DR2-IPD-PROVIDER-EXECUTION-2026-10-25-01` |
| Repository | `ramkivs/iips-production-market-data` (IPD) |
| Branch | `arena/dff844a3-iips-production-market-data` |
| Base commit / tree | `4b5c65a731a66a6fa1260146a55df9ed772953a5` / `cf5e85856009360de3ffb9614970c383a26d73ba` (= `origin/main` at start, zero drift) |
| Governing act | PA decision `IIPS-V3-CAP03-DR2-DQ1-PA-DECISION-2026-10-25-01` §2 (IRR locus, `docs/integration/IIPS_v3.0_CAP03_ONE_PASS_PA_DECISION_AND_IRR_EXECUTION_2026-10-25.md`), which selects **Option A** and assigns the producer half to IPD |
| IRR consumer reference | impl `51ce168306b67f208d026cf6178a72d170d5052c`; PR #265 head `c059c326c355b80c3224ad861dfecfb93963f112` (**OPEN / UNMERGED**, unchanged by this pass) |
| Authorized change manifest | `src/persistence/portfolio_store.ts`, `tests/q1_ipc_read_contract_conformance.test.ts` — **exactly these two source/test paths** |
| Execution mode | non-production, local fixture/offline; no host, no provisioning, no write, no admission |
| Evidence annex | `evidence/cross-repository/cap03_dr2_2026-10-25_ipd_provider/` |

## 1. Authority and scope boundary

The IRR half of DR-2 / DQ-1 is published (PR #265) and explicitly records the IPD
producer half as the outstanding cross-repository execution boundary:

> "IPD: `src/persistence/portfolio_store.ts` and
> `tests/q1_ipc_read_contract_conformance.test.ts` — **not changed in this
> IRR-bound session**." … "Cross-repository DR-2 closure therefore remains open
> until the exact authorized IPD producer/test change is published in the IPD
> locus and independently verified."

This pass executes exactly that, under the PA's direct one-pass instruction and the
standing global authorization. It does not reopen the IRR determination, does not
touch the IRR locus, and makes no new decision.

**Not authorized, not performed:** any migration or schema change; any frozen G2
type change; any additional field, alias or default; any endpoint activation or
user-portfolio route (none exists in this repository); any read-pair admission
(Gate 5 remains `NOT ADMITTED`); any write authorization (`W-1` remains hard-false);
any `durable:true`/`durable:false` emission (DR-3 / DQ-2 unchanged); any final pin or
freeze (DQ-4 sequencing only); any H-12 regeneration or adoption; any host preflight,
P-1 provisioning, S2/S3 execution or QE-1…QE-11 attempt; any repackaging of the
completed CAP-03 host-operations package; any change to PR #265.

## 2. What the provider now supplies

All seven approved values, projected from the stored row that owns each value. The
v1 wire names are preserved exactly, so the three authorized renames remain an
IRR-boundary concern only.

| Shape | Added by this change | Source (stored) | Rename performed here? |
|---|---|---|---|
| `portfolio.list` | `weightSumPercentage`, `provenanceDigest`, `isSaved` | current revision row (`portfolio_revisions` joined on `current_revision`) | **No** — `holdingsCount` kept |
| `portfolio.get` | `isSaved` (with `weightSumPercentage`, `provenanceDigest` already present in the detail contract) | current revision row | **No** — `holdingsCount` kept |
| `portfolio.revisions` | `totalMarketValue`, `provenanceDigest`, `holdingsCount` | **each historical revision's own row** | **No** — `committedAt` kept |

`isSaved` implements the DQ-1 materialized-state rule and nothing else:

```
MERGE | REPLACE  -> true
INITIAL | RESET  -> false
any other stored operation (e.g. DELETE) -> no result at all (refusal)
```

It is never derived from the revision number, from a non-empty holdings array, or
from history, and it is never attached to a history entry (the frozen
`G2RevisionEntry` does not carry it).

### 2.1 Fail-closed projection

Every required value is validated before a read result is built. A missing (NULL
from the `LEFT JOIN`), non-finite, wrong-typed, fractional, negative or blank stored
value raises `ContractEnvelopeViolationError` and produces no partial result.

- The three former fabrication sites are removed: `COALESCE(r.holdings_count, 0)`,
  `COALESCE(r.total_market_value, 0)`, and `revisionRow?.… ?? 0` / `?? ''`.
- An **empty `provenance_digest` is a stored fact** and is passed through verbatim;
  only a non-string is refused.
- A SQL `NULL` `content_digest` means the optional v1 property is genuinely absent,
  so the property is omitted rather than emitted as `null`.
- Missing, foreign-owned and tombstoned records still refuse **before** any
  projection with the pre-existing `ResourceUnavailableError`
  (`RESOURCE_UNAVAILABLE` on the wire), so `isSaved` can never be emitted for an
  unavailable record. That contract is not widened.
- A malformed stored row is reported as the generic Class A `UNAVAILABLE` outcome
  (the dispatcher's existing catch-all), which the IRR adapter maps to
  `UPSTREAM_UNAVAILABLE` — the established contract-envelope refusal. It is
  deliberately **not** `RESOURCE_UNAVAILABLE`, whose meaning must stay
  missing ≡ foreign ≡ tombstoned.

The one blast-radius consequence is stated explicitly rather than hidden: because a
row may be neither fabricated nor silently dropped, a single malformed row makes the
whole `portfolio.list` result refuse (measured in harness check 7). Dropping the row
would silently misreport the owner's portfolios; emitting a zero would fabricate a
value. Refusal is the fail-closed reading of the act.

## 3. Changed-file manifest

The two authorized source/test paths change, plus this record, its evidence annex and
one append-only tracker reconciliation. Nothing else:

| Status | Path |
|---|---|
| M | `src/persistence/portfolio_store.ts` |
| M | `tests/q1_ipc_read_contract_conformance.test.ts` |
| A | `evidence/cross-repository/IIPS_V3_CAP03_DR2_IPD_PROVIDER_EXECUTION_2026-10-25.md` |
| A | `evidence/cross-repository/cap03_dr2_2026-10-25_ipd_provider/` (12 annex files) |
| M | `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` (append-only reconciliation) |

No other path is touched. `src/ipc/protocol.ts`, `src/ipc/dispatch.ts`,
`src/ipc/entrypoint.ts`, all four migrations, `package.json`,
`package-lock.json`, `.github/workflows/ci.yml`, `scripts/**` and every other source
or test file are byte-unchanged (`07_frozen_source_sha256.txt`).

## 4. Validation — executed in order on this tree (Linux x86_64, Node v22.22.3, npm 10.9.8)

| # | Check | Command | Result |
|---|---|---|---|
| 0 | Baseline, pre-change | `npx tsc --noEmit` / `npm run build` / old Q1 / `npm test` / `test:package-consumer` | all exit 0; **897 executed / 896 pass / 0 fail / 1 skip** |
| 1 | Focused Q1 provider conformance | `node --test --test-reporter=tap dist/tests/q1_ipc_read_contract_conformance.test.js` | **exit 0 — 30 tests, 30 pass, 0 fail, 2 suites** |
| 2 | Persistence + user-portfolio suites (15 files) | `node --test … g3_* q1_* bi07_* portfolio_ui_package` | **exit 0 — 316 tests, 316 pass, 0 fail** |
| 3 | Required repository suite + guard | `npm test` | **exit 0 — 924 executed, 923 pass, 0 fail, 1 skip** (`[test-guard] OK`; +27 vs baseline) |
| 4 | Type checks | `npx tsc --noEmit` (CI's exact step) | **exit 0** |
| 5 | Build + package consumer | `npm run build` / `npm run test:package-consumer` | **exit 0 / exit 0** (pack, IRR importer resolution, strict declaration check all PASS) |
| 6 | Cross-repository compatibility | real IRR adapter vs real IPD endpoint (§6) | **exit 0 — 15/15 checks PASS** |
| 7 | Whitespace integrity | `git diff --check` | **exit 0** |

Checks 1–5 were re-executed as a FINAL run on the exact tree this record describes
after the evidence files were written; the annexed logs (`03_q1_final.txt`,
`04_focused_suites_summary.txt`, `05_full_suite_summary.txt`,
`06_typecheck_build_package_summary.txt`, `08_cross_repo_harness.txt`) are those
final runs, and `SHA256SUMS.txt` pins them. Whole-log hashes differ between two runs
of the same tree only in TAP timing fields, which is why the summary files record the
hash of the run they summarise.

`dist` file count remains **1,140** — no new source file was added, so the recorded
H-12 `dist/**` count is unaffected.

### 4.1 Retained failure

The first focused run (`02_q1_iteration1_failure.txt`, 24 pass / 5 fail) is preserved
deliberately. It surfaced four genuine facts, each of which changed the suite rather
than the contract:

1. `portfolio_revisions.content_digest` stores the revision's **computed** content
   hash; the request's `contentDigest` is the contribution-ledger key. The assertion
   was corrected to compare against the stored row.
2. The frozen schema's `CHECK (operation IN ('INITIAL','MERGE','REPLACE','RESET','DELETE'))`
   makes a blank or unknown stored operation **unstorable**, so those two synthetic
   cases were removed as unreachable; the reachable "no lawful `isSaved`" case is a
   stored `DELETE`.
3. A `TEXT` column's affinity converts a bound number back to text, so "text in a
   text column" is not reachable; a `BLOB` is the reachable non-string value and is
   now used. `node:sqlite` returns it as `Uint8Array`.
4. The IRR adapter refuses a **populated** contribution ledger under its separate
   DR-4r / DQ-3 guard, which is an open cross-repository boundary rather than a DR-2
   field defect. The suite now proves the DR-2 field mapping on an empty-ledger view
   and asserts the DR-4r boundary explicitly.

## 5. Test coverage added (30 tests, 2 suites)

| Requirement (from the execution mandate) | Test |
|---|---|
| all seven required values and exact mappings | §1 tests 1–3; test 6 (exactly-seven delta) |
| the three authorized renames, and no unauthorized rename | test 5 (`holdingsCount`/`committedAt` kept, `totalHoldingsCount`/`createdAt` absent) |
| `isSaved` for MERGE / REPLACE / INITIAL / RESET | tests 7–10 |
| tombstoned / missing / foreign | tests 11–13 (foreign byte-identical to missing) |
| historical revisions use their own stored values | tests 14–15 (four-row matrix vs the SQL rows) |
| missing and null required values | §2 test 1 (absent current-revision row → NULLs), test 3 |
| non-finite numerics and invalid field types | §2 tests 2–5 (Infinity, BLOB, fractional, negative, blank) |
| refusal without fabricated output | §2 tests 1–5, 8 (Class A `UNAVAILABLE`, no `result`) |
| compatibility with the IRR adapter envelope | tests 16–18 (adapter rules applied to real bytes; legacy shape refused) |
| frozen interfaces / schema / migrations / routes / fences | tests 19–22 |

The suite also pins the stored empty `provenance_digest` as a stored fact (test 4),
the SQL-NULL optional `content_digest` (§2 test 6), and the unwidened
`RESOURCE_UNAVAILABLE` contract (§2 test 7).

## 6. Cross-repository conformance — measured, not asserted

The IRR adapter lives in a different repository, so the IPD suite judges IPD bytes
with a **faithful test-local transcription** of the adapter's validation and mapping
rules (tests 16–18). That transcription is corroborated by a stronger, out-of-tree
harness that runs the **actual IRR code**:

- Five IRR modules (`ipcPortAdapter`, `ipcClient`, `userPortfolioContract`,
  `userPortfolioPort`, `ownerContextFromBinding`) were copied from IRR PR #265 head
  `c059c32…` (adapter blob `1e20e980…`, contract blob `e6b57bb8…` — the frozen
  contract is byte-identical to the pre-decision blob the act cites) and compiled
  **unmodified** with `tsc` (NodeNext/ES2022).
- The harness starts the real IPD entrypoint on a real AF_UNIX socket against a
  fixture SQLite store, then constructs the real `IpcUserPortfolioPort` with the real
  `callIpc` transport and drives `listPortfolios`, `getPortfolio`,
  `revisionHistory`.
- **15/15 checks PASS** (`08_cross_repo_harness.txt`), including: the frozen
  `G2PortfolioSummary` nine-field key set; `totalHoldingsCount` as the only summary
  rename; the four-value `isSaved` lifecycle; the eleven-field
  `G2PortfolioView` on an empty ledger; `createdAt` as the only revision rename with
  per-row values `[INITIAL 1000/1, MERGE 1500/2, REPLACE 700/1, RESET 0/1]`; no
  `isSaved` on history; tombstoned and missing records → `NOT_FOUND`; a malformed
  stored value → `UPSTREAM_UNAVAILABLE` with no value disclosed; and the IRR-local
  tenant hint never transmitted.

Neither repository was modified by the harness. It is evidence tooling, retained as
`09_cross_repo_harness.mjs` so the result is reproducible.

## 7. Cross-repository DR-2 closure assessment

| Dimension | IPD (provider) | IRR (adapter) | Conformant? |
|---|---|---|---|
| Summary: 3 added values | supplied from the current revision row | validated and mapped | **Yes** |
| View: `isSaved` | supplied | validated and copied verbatim | **Yes** |
| History: 3 added values | supplied per stored row | validated and mapped | **Yes** |
| `holdingsCount` → `totalHoldingsCount` | **not** renamed (v1 name kept) | renamed once, only here | **Yes** |
| `committedAt` → `createdAt` | **not** renamed | renamed once, only here | **Yes** |
| No extra field / alias / default | seven additions, no more | rejects unknown-shaped required values; refuses `durability`/`durable` | **Yes** |
| `isSaved` lifecycle | computed from the stored operation | never inferred; copied | **Yes** |
| unavailable records | `RESOURCE_UNAVAILABLE`, no field | `NOT_FOUND`, no portfolio object | **Yes** |
| malformed values | refusal, no fabrication | `UPSTREAM_UNAVAILABLE` | **Yes** |
| historical `isSaved` | never emitted | rejects/never expects it | **Yes** |

**DR-2 field-and-lifecycle conformance across the two implementations is established
at the tested commits.** It is *not* the same as DR-2 closure, and this record does
not claim closure, for these independently verified reasons:

1. **The IRR determinations are not effective yet.** PR #265 is `OPEN`/`UNMERGED`, so
   by the act's own effectiveness rule ("effective upon publication to IRR `main`,
   green exact-head CI, and independent remote read-back") the consumer-half mapping
   is published but not operative. The IPD half cannot close a decision whose other
   half is unmerged.
2. **DR-4r / DQ-3 remains open by decision.** Option B scopes `G2Contribution`
   projection out of the first Gate 5 admission, so the IRR adapter refuses any view
   with a non-empty contribution ledger — which is the ordinary state of every
   imported portfolio. A full `portfolio.get` read remains refused **by design**, not
   by defect (harness check 3; IPD test 17).
3. **No final pin exists.** DQ-4 requires the freeze to record exact commits and trees
   after the authorized DR-2…DR-4r implementations land; the PA explicitly forbade
   pin designation, H-12 regeneration/adoption in this pass. The CAP-03 primary
   package pin `2d9130e7…` and the broker-import alias `70b24f02…` are unchanged and
   are not final QE pins.
4. **No operative read path exists on the host.** Gate A′ provisioning is `APPROVED —
   NOT EXECUTED`, so no binding/membership row exists outside fixtures; every
   production write is refused by `W-1`; `QE` remains `0/11`.

**Conclusion:** the IPD provider half of DR-2 / DQ-1 is **implemented, tested,
published and independently verifiable**; the cross-repository *implementation*
dependency is satisfied. DR-2 **closure** still requires the IRR-half merge
effectiveness, the DR-4r/DQ-3 decision for full views, and the DQ-4 freeze — none of
which this pass may perform.

## 8. Gate, host and non-grant state (unchanged by this pass)

| Item | State |
|---|---|
| Gate 4 | **AUTHORIZED — NOT STARTED** |
| QE-1…QE-11 | **0/11**; no QE result executed or accepted |
| Gate 5 read-pair admission | **NOT INITIATED / NOT ADMITTED** |
| `W-1` write authorization | **unmet**; `evaluatePortSaveGuard()` hard-false, both reasons |
| `durable:true` / `durable:false` | **not emitted**; `durability`/`durable` still absent |
| H-12 | **NOT ADOPTED**; no regeneration, no repackaging |
| P-1 / S2 / S3 / host preflight | **NOT EXECUTED** |
| User-portfolio routes / fences | **none in this repository**; nothing activated or lifted |
| Provisioning | **APPROVED — NOT EXECUTED** |
| PR #265 (IRR) | **OPEN / UNMERGED** — state unchanged |
| Windows | no native-Windows qualification performed or claimed; every test is host-adaptive and this pass ran on Linux only |

## 9. Reproduction

```bash
npm ci
npx tsc --noEmit
npm run build
node --test --test-reporter=tap dist/tests/q1_ipc_read_contract_conformance.test.js
npm test
npm run test:package-consumer
```

The cross-repository harness additionally requires a checkout of
`ramkivs/iips-review-recovered` at `c059c326…`; see `09_cross_repo_harness.mjs` and
`10_irr_consumer_provenance.txt`.
