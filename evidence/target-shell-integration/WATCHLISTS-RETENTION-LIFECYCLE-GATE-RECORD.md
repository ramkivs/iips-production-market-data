# Institutional Investment Platform System (IIPS)
# WATCHLISTS — SG-3 RETENTION/LIFECYCLE: GATE RECORD

**Gate ID:** `watchlists-sg3-retention-lifecycle-2026-09-27-001`
**Gate Type:** RETENTION/LIFECYCLE GOVERNANCE GATE (non-executable, analytic;
**this gate authorizes NO retention period, NO lifecycle policy, NO automatic
lifecycle behavior, NO implementation, NO transport**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Recording Agent:** Arena (recording only)
**Selection Basis:** the instruction for this gate is **analytic only** — it carries
**no explicit retention/lifecycle selection and no conditional directive** and
prohibits inventing a retention period or policy. Per the standing selection-integrity
rule (`bd9efbf`, `1650ef5`, `91dc3fe`, `d2f5174`, `f5f7608`), where no governing
record applies and no explicit selection is supplied, the gate HALTS on UNRESOLVED.
Nothing was inferred from `localStorage`/browser behavior, PortfolioStore behavior,
unrelated domains, conventions, or convenience
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `35a80f8b00b7b7838f56f895833144831688434b`

---

## 1. AUTHORITATIVE BASELINE (verified fail-closed before this gate)

| Item | Value | Verified |
| --- | --- | --- |
| Branch / HEAD (pre-act) | `arena/01a0e30c-iips-production-market-data` @ `35a80f8…88434b` | ✓ |
| LOCAL == REMOTE | fresh fetch (explicit tracking refspec) → `refs/remotes/origin/arena/…` == `HEAD` == `35a80f8` | ✓ |
| Worktree / reflog | CLEAN; reflog head = `35a80f8`, `f5f7608`, `bcb3dac`, `d2f5174` → workspace persistent; **no re-clone / no history replacement** | ✓ |

## 2. ANTECEDENT VERIFICATION (from commit objects)

| Antecedent | Verified content | Result |
| --- | --- | --- |
| Chain `1fff0c4` … `35a80f8` | all 13 commits ancestors of HEAD | ✓ |
| SG-1 `bcb3dac` | `A — STORAGE MECHANISM DESIGNATED`; `SELECTED MECHANISM: browser localStorage` | ✓ |
| SG-2 `35a80f8` | `A — OPERATIONAL SEMANTICS ESTABLISHED`; `CREATE = designated` … `RESET/CLEAR = designated`; hard-removal delete; explicit-only reset | ✓ |
| State boundary | list identity/name/ordering · membership by canonical companyId · mutation provenance/audit metadata — verbatim in `d01bc97` §4 / `35a80f8` §5 | ✓ |
| **SG-3 not already authorized** | `d01bc97` (SG-3 row + `retention = SG-3` lifecycle status) · `f5f7608` (SG-3 untouched) · `35a80f8` §15 (`retention/lifecycle — **CLOSED**; no expiry/retention policy invented`) | ✓ |

No antecedent absent, altered, ambiguous, non-authoritative, or inconsistent.

## 3. PERSISTENCE MECHANISM (preserved; not reconsidered)

> **SELECTED MECHANISM: browser localStorage** (`bcb3dac`) — unchanged.

## 4. STATE BOUNDARY (unchanged; SG-3 scope would be exactly this)

SG-3 applies only to Watchlists list state:
- list definitions
- list identity/name/ordering
- membership references by canonical companyId
- mutation provenance/audit metadata

**Excluded:** triggers · score-change history · alerts · research results · portfolio
holdings · securities master data · tenant state · credentials · authentication state ·
Dhan/NSE production data · server/cloud data. No expansion occurred.

## 5. OWNER / ENVIRONMENT BOUNDARY (preserved exactly)

- Owner scope: `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` — verbatim.
- `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` — verbatim; SG-5 untouched; no
  substitution of any kind.
- Environment: LOCAL · PERSONAL · SINGLE-USER · NON_PRODUCTION /
  LOCAL_FIXTURE_AND_OFFLINE_DEV · NON-SHARED · NON-DEPLOYED — unchanged.

## 6. FRAMEWORK PRECEDENTS INSPECTED (fresh, this gate)

| # | Finding (evidence) |
| --- | --- |
| F1 | `d01bc97` §2 row 8 / §5: retention/lifecycle is placed **with the mechanism charter** in precedent; for Watchlists it was expressly **sub-gated** — `retention = SG-3`; "no lifecycle policy may be invented" |
| F2 | `NP12-WATCHLISTS-FORENSIC-ASSESSMENT.md` §165: "Retention authority established? \| Session/process lifetime only (Tier-B continuity); no durable retention mechanism or policy exists \| **NOT ESTABLISHED**" |
| F3 | Repo-wide sweep (`docs/`, `evidence/`, durable-adjacent stores `portfolio-store.ts` / `pit_store.ts` / `mapping_store.ts`): **zero** retention/TTL/expiry/stale/archival authorization or policy language anywhere — the only lifecycle constructs that exist are per-domain **charter-bundled explicit reset utilities** (BI-07, portfolio domain) — operational semantics, not retention |
| F4 | BI-07 / BI-04 / BI-08 charters: domain-scoped; no duration, expiry, archival, or migration-lifecycle rule; nothing transferable (consistent with `f5f7608`) |
| F5 | `35a80f8` §10: reset designated **explicit-only** — "MUST NOT occur implicitly merely because the application starts, reloads, or encounters an empty state" — i.e., the only lifecycle-adjacent behavior authorized is explicit, and it is SG-2 content, preserved (§7, §9) |

**Determinations on the gate's five questions:**
1. A retention/lifecycle rule explicitly applicable to this Watchlists domain: **does not exist**.
2. Existing retention rules domain-specific or platform-wide: **neither exists** — no platform-wide retention rule at all; the only lifecycle records are session-lifetime facts (portfolio stores) and per-domain explicit-reset charters.
3. Framework requirement: **an explicit Designating-Authority selection is required** — retention was sub-gated for exactly this (`d01bc97` §5); the BI pattern shows lifecycle items exist only when chartered per domain.
4. Exact lifecycle decisions requiring designation: **the option space of §8**.
5. Automatic lifecycle behavior already authorized: **NONE** — SG-2 designated explicit-only reset and explicit hard delete; no automatic behavior is authorized anywhere in the framework.

## 7. DISTINCTION — TECHNICAL STORAGE PERSISTENCE vs RETENTION POLICY

Recorded separately, per instruction and `146c97f`/`d01bc97`:
- **DURABLE classification** (`146c97f`) = intent to survive beyond an ephemeral
  process/session boundary. **DURABLE does NOT mean retain forever, retain for N
  days, retain until browser eviction, retain until logout, retain until application
  reset, or retain indefinitely** — those are distinct, unmade policy decisions.
  (`d01bc97` §5: "the DURABLE-across-reload intent stands … without a lifecycle
  policy being invented".)
- **SG-1 mechanism designation** (`bcb3dac`) = where state may be held, not how long.
- **SG-2 operational semantics** (`35a80f8`) = how mutations occur (atomic writes;
  explicit delete; explicit reset), not how long state persists.
- **Browser `localStorage` technical behavior** (site-data persistence; user site-data
  clearing; browser storage-pressure eviction; uninstall) = **mechanism/platform
  behavior — not a governance retention policy**; nothing in this record converts it
  into one.
- **Implementation behavior** = closed (§10).

## 8. EXACT LIFECYCLE OPTION SPACE (supported by repository governance; evidence-only)

Each item: **authority-required, UNSELECTED** — framework records support the *decision
dimension* (F1/F5: lifecycle is chartered per domain) but select nothing. Neither
option of any pair is recommended or preferred; SG-2 designations are preserved, not
reopened.

| # | Decision point (requires explicit designation) | Repository basis | Current status |
| --- | --- | --- | --- |
| D1 | **Retention duration**: indefinite retention until explicit delete/reset **vs** bounded duration | `d01bc97` SG-3 sub-gate; F2 NOT ESTABLISHED | UNDESIGNATED — no duration, no indefinite rule |
| D2 | **Expiry / stale-state handling**: none vs TTL vs stale-marking semantics | no framework concept exists (F3) | UNDESIGNATED |
| D3 | **Automatic lifecycle behavior**: whether ANY automatic expiry/cleanup is ever permitted | SG-2 reset is explicit-only (`35a80f8` §10) — a negative boundary already fixed; the affirmative space is unaddressed | NONE authorized; UNDESIGNATED beyond the SG-2 negative |
| D4 | **Explicit termination** (delete/reset lifecycle) | `35a80f8` §9–§10 | **ALREADY DESIGNATED at SG-2** (hard delete; explicit-only reset) — fixed content, NOT reopened, NOT part of the unresolved space |
| D5 | **Browser-mediated loss posture**: site-data clearing / storage-pressure eviction / uninstall as accepted loss vs required mitigation policy | mechanism is browser localStorage (§3); no mitigation mechanism or posture authorized | UNDESIGNATED |
| D6 | **Archival vs deletion**: whether any archival/retained form of removed state is permitted | SG-2 delete = hard removal (fixed); archival never addressed within the bounded state | UNDESIGNATED |
| D7 | **Replacement / version lifecycle**: state replace-on-write is SG-2 atomic full-state; versioning across writes and versioned records policy | SG-2 covers atomicity of a write, not version lifecycle | UNDESIGNATED |
| D8 | **Migration lifecycle**: policy for schema/format evolution of persisted state | `bcb3dac` §10 deferred schema/version/migration; none designated | UNDESIGNATED |
| D9 | **Corruption lifecycle**: detection and response posture for corrupted stored state | SG-2 covers write-failure atomicity, not stored-state corruption | UNDESIGNATED |
| D10 | **Ownership / principal lifecycle**: whether retention/lifecycle binds to a runtime principal | SG-5 `UNRESOLVED` | **BLOCKED on SG-5 — recorded dependency; not a preference** |

## 9. EXACT SG-3 OUTCOME

> ### **C — RETENTION/LIFECYCLE UNRESOLVED**
>
> A fails: no existing governance explicitly authorizes a Watchlists lifecycle policy.
> B fails: no retention/lifecycle content is already authorized for this boundary
> (the explicit delete/reset are SG-2 operational semantics, preserved and not
> reopened), and the framework identifies no pre-named sub-gate content it would
> split. C holds: an explicit Designating-Authority decision is required. No
> retention period, duration, expiry, automatic cleanup, archival rule, or browser
> behavior was manufactured or adopted.

## 10. EXPLICIT EXCLUSIONS (absolute)

No retention period or lifecycle rule invented or selected · no automatic lifecycle
behavior authorized (explicit-only posture of SG-2 preserved) · no inference from
`localStorage`/browser eviction/site-data clearing/user-clearing behavior · no
PortfolioStore/PIT/IdentityMapping or unrelated-domain behavior promoted · no
mechanism reconsideration (§3) · no SG-2 reopening (§8 D4 fixed) · no boundary
expansion (§4) · SG-4/SG-5 untouched (`EXACT RUNTIME PRINCIPAL IDENTIFIER =
UNRESOLVED` verbatim) · no expiration/cleanup/deletion/migration/storage-init code,
no schema, no dependency, no UI, no transport, no authentication, no tracker/spec, no
donor, no production change · D115 canonical block unchanged ·
**this gate grants NO implementation authority** — sole repository change: this artifact.

## 11. NEXT SINGLE GOVERNANCE PREREQUISITE

> **One explicit Designating-Authority SG-3 selection** — a single authority act
> designating retention/lifecycle decisions across the §8 option space (D1 duration /
> indefinite-vs-bounded; D2 expiry/staleness; D3 automatic-behavior posture beyond the
> SG-2 explicit-only negative; D5 browser-mediated loss posture; D6 archival-vs-delete;
> D7 version lifecycle; D8 migration lifecycle; D9 corruption lifecycle; D10 principal
> lifecycle — which would first require SG-5). Framework pattern: one charter-style
> authority act with the mechanism (F1). Enumeration is the option space only —
> **no option is recommended or pre-selected.** SG-4, transport, and implementation remain
> independently gated (CLOSED).

---

## VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this gate record. Zero code/storage/transport/
  identity/config/dependency/UI/tracker/spec/donor/production changes. No build/test
  executed (non-executable gate).
- Antecedent strings verified from commit objects after fresh fetch (wrap-tolerant
  where artifact prose wraps); F3 sweep verified zero retention/expiry concepts in
  durable-adjacent stores and governance records outside the Watchlists chain.

## DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this gate record added |
| Code/storage/transport/identity/config/dependency/production changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| Re-fetch; LOCAL == REMOTE; commit reachable from authoritative branch | verified |
| Worktree CLEAN; delta sole artifact; no unrelated files changed | verified |

---

## OUTCOME

# **C — RETENTION/LIFECYCLE UNRESOLVED**
# No retention/lifecycle rule exists or is applicable to this boundary; no automatic
# lifecycle behavior is authorized; an explicit Designating-Authority selection is
# required across the D1–D10 option space. Nothing manufactured; D4 (explicit
# delete/reset) remains fixed SG-2 content; D10 blocked on SG-5.
# **Next single prerequisite: explicit Designating-Authority SG-3 retention/lifecycle
# selection. STOPPED.**
