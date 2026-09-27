# Institutional Investment Platform System (IIPS)
# WATCHLISTS — PERSISTENCE / IDENTITY / TRANSPORT: GOVERNANCE DECISION RECORD

**Act identifier:** `watchlists-governance-decision-2026-09-27-001`
**Act Type:** AUTHORITY DECISION GATE RECORD (non-executable; decision only — **no implementation**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Antecedent Artifact:** `evidence/target-shell-integration/NP12-WATCHLISTS-FORENSIC-ASSESSMENT.md`
(commit `1fff0c4` — read-only forensic assessment, outcome "governance input required")
**Recording Agent:** Arena (recording of evidence-based determination only — **no authority is
created, granted, inferred, or exercised by this record**)
**Governing Authority (person/role):** RAMKI — Designating Authority (per `phase5-offline-full-shell-restoration-2026-09-23-001`,
`phase1c-intel-deferred-completion-2026-09-22-001`, `GATE-NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION`)
**Recorded At (UTC):** 2026-09-27
**Implementation Authority:** **NOT GRANTED**

---

## 1. Authoritative baseline

| Fact | Value |
| --- | --- |
| Repository | `ramkivs/iips-production-market-data` |
| Remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (fetched before this act) |
| Authoritative branch (remote) | `origin/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` |
| Recording branch | `arena/01a0e30c-iips-production-market-data` |
| HEAD at gate opening | `1fff0c4` (forensic assessment commit — sole divergence from `origin/main`, governance record only) |
| Worktree | CLEAN at gate opening |

Antecedent verification: the forensic assessment exists, was re-read in full, and every
authority document it cites was inspected **directly** (not via the assessment):
`PHASE5-OFFLINE-FULL-SHELL-RESTORATION-AUTHORITY-ACT.md`,
`NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md`,
`PHASE1C-INTELLIGENCE-DEFERRED-COMPLETION-AUTHORITY-RECORD.md`,
`BI08-MASTER-IIPS-INTEGRATION-FINAL-RECONCILIATION.md`,
`docs/PHASE1_AUTHORIZATION_PREPARATION.md` (§C surface matrix, §G identity record, §G.1 D115),
`docs/FULL_IIPS_BI08_CONVERGENCE_PLAN.md` / `..._FILE_MATRIX.md` (Tier-B, surface #30),
program spec §surface inventory and tracker (`P13-07`, `INT-011`, `DEP-MATRIX` row),
`frontend/src/core/session/session.ts`, `frontend/src/app/*`, `src/contracts/provenance.ts`,
`src/pit/pit_store.ts`, `src/identity/mapping_store.ts`, `src/d114/pit_ingestion_loader.ts`.

## 2. Existing Watchlists state

Unchanged from the forensic assessment; verbatim authority record:

- `/watchlists` route + `WatchlistsStructural` → `UnavailableSurface(state='offline')`
  (`frontend/src/app/App.tsx:274–278,417`), nav `status: 'unavailable'`
  (`navigation.ts:184`). Structural presence **only**; zero state, zero data, zero fetch.
- Standing product-surface record: donor surface **#30** `watchlists/Watchlists.tsx` |
  `api/watchlists` | **DEFER** (`docs/PHASE1_AUTHORIZATION_PREPARATION.md:200`);
  convergence inventory surface **#54**: `PRUNED / DEFER / hist api / OUTSIDE REGISTRY`.
- No Watchlists `UISurfaceId` (registry UI01–UI14; **UI07 = PIT_CORPORATE_ACTIONS**, not
  Watchlists; the "UI07 Watchlists" label is donor lineage only).
- Guard tests prohibit the donor component (`OPTA-11`) and pin the fail-closed rendering
  (`OPTA-04a`) and `unavailable` nav status.
- Work tracker: `P13-07 Watchlist integration` — **NOT STARTED** (deps P07/P11/P12);
  `INT-011 Watchlists / Alerts` — **BASELINE — VERIFY**, *"runtime topology remains a
  later governed decision."* **This gate is that later governed decision.**
- Program spec surface inventory (durable-intent semantics): *Watchlists | Yes |
  Data + triggers | **Persistent lists, triggers, score changes***.

## 3. Identity decision

Repository authority inspected: `PHASE1_AUTHORIZATION_PREPARATION.md` §G/§G.1, PHASE5 act §3,
designation packet §7, BI08 final reconciliation §10, `session.ts`, `main.tsx`.

| # | Question | Evidence | Determination |
| --- | --- | --- | --- |
| A1 | User/application principal established? | Only display-only `ANONYMOUS_SESSION` (`authenticated: false`, role `viewer`, "never an authorization authority"); Keycloak/OIDC deliberately excluded (`main.tsx` exclusions); PHASE5 §3: no auth tier | **NOT ESTABLISHED** |
| A2 | Application/runtime identity established? | §G.1: `runtimeCompanyId: UNRESOLVED`; `implementationAuthority: WITHHELD`; offline runtime is anonymous; `tenantId: 'IIPS_OFFLINE_BOOTSTRAP'` in the d114 loader is a **data-provenance marker** on historical envelopes, not a runtime principal | **NOT ESTABLISHED** |
| A3 | `companyId` established? | §G: "TARGET AUTHORITY: CURRENT MAIN CONTRACT (`companyId` / `SecurityMaster`)"; governed D05 master (2,250 records) + P04 effective-dated mapping, fail-closed; consumed canonically by BI-07/08. **Boundary preserved:** donor-lineage decision items D115 C/D remain **UNRESOLVED** and are untouched by this act | **ESTABLISHED for security (list-membership) identity only — NOT for any owning principal** |
| A4 | Tenant identity established? | No tenant runtime; `tenantId` is an optional provenance/telemetry plumbing field; `tenantId: 'system'` in `ANONYMOUS_SESSION` is display-only; admin Tenancy structural only | **NOT ESTABLISHED** |
| A5 | Authorized identity scope suitable for user-owned Watchlists? | Requires A1 (absent). Donor ownership semantics were Keycloak-user lists via `api/watchlists` (deferred tier). D115 = DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED | **NOT ESTABLISHED** |
| A6 | Environment authorizes persistence of user-owned state? | Environment authorizes in-process, session-lifetime, anonymous state only (BI-07 portfolio precedent — aggregate-specific, non-transferable); no durable persistence of any kind exists; user-owned durable state requires D115 + durability authority (both absent) | **NO — NOT AUTHORIZED** |

**No identity is inferred** from `ANONYMOUS_SESSION`, display roles, `tenantId: system`,
`portfolioId`, company/security identifiers, donor lineage, or prior statements.
**D115 state is preserved exactly: DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED.**

## 4. Persistence / durability decision

| # | Question | Determination | Evidence |
| --- | --- | --- | --- |
| B1 | Watchlist state classified durable or session-scoped? | **UNRESOLVED — NO AUTHORITY DESIGNATED.** No act classifies Watchlists either way. The spec records durable-intent semantics; no act designates a session-scoped deviation; the surface is DEFER + structural only | spec surface inventory; PHASE1 #30 DEFER; PHASE5 act; P13-07 NOT STARTED |
| B2 | Persistence authority (if durable)? | **UNRESOLVED — NO AUTHORITY DESIGNATED** | no authority act exists for Watchlists persistence |
| B3 | Storage mechanism authorized? | **UNRESOLVED — NO AUTHORITY DESIGNATED.** None exists in-environment at any tier: no disk persistence, no browser storage (verified: 0 `localStorage`/`sessionStorage`/`indexedDB` uses), no server | forensic assessment §5 |
| B4 | Identity scoping persisted state? | **UNRESOLVED** — dependent on B1 + A5; membership identity (governed `companyId`) exists; ownership identity absent (A1/A4/A5) | §3 above |
| B5 | Write authority? | **UNRESOLVED — NO AUTHORITY DESIGNATED.** The only governed write boundary (BI-07 atomic save: guards + idempotency + lineage digest) is **portfolio-specific**; it is **not promoted** to Watchlists | `portfolio-store.ts`; BI-07/08 acts |
| B6 | Retention/lifecycle authority? | **UNRESOLVED — NO AUTHORITY DESIGNATED.** Only existing lifecycle semantics: Tier-B session singletons (**BI-08 load-bearing, portfolio-specific**) and process-lifetime stores; no retention policy documents exist for product-surface state | convergence plan §9 (Tier-B); repo-wide authority search |
| B7 | Deletion/reset authority? | **UNRESOLVED — NO AUTHORITY DESIGNATED** (`resetPortfolio` at `portfolio-store.ts:100` and `resetDefaultPortfolioStore` at `portfolio-store.ts:534` are BI-07 test/session utilities, portfolio-specific) | `portfolio-store.ts:100–120, 521–537` |
| B8 | Persistence authority unavailable → behavior? | **No Watchlists persistence exists**; no authority defines unavailability behavior for it. The governed current behavior is the existing fail-closed structural surface (`UnavailableSurface`), which this record preserves unchanged | `App.tsx:274–278`, `UnavailableSurface.tsx` |

**Explicit non-acts:** no persistence mechanism selected for convenience; `PortfolioStore`
**not** promoted; no in-memory store treated as durable; no new persistence authority created.

## 5. Transport decision

| # | Question | Determination | Evidence |
| --- | --- | --- | --- |
| C1 | May Watchlists operate entirely in-process under a governance decision? | **Not authorized.** In-process operation is technically possible but no decision designates Watchlists operation at any scope | §6 capability table |
| C2 | State boundary if in-process operation were designated | Session-scoped · anonymous · process-local · non-durable — **recorded as implication only; NOT designated** | Tier-B/BI-07 mechanics |
| C3 | Server/network boundary authorized (if durability required it)? | **NO.** Network tier is absolutely excluded: PHASE5 act §3 ("NO production server tier; NO authFetch; NO /api/* calls; NO network calls of any kind"); every Path-L surface header asserts zero network call sites; verified zero `fetch`/XHR/WebSocket/`EventSource` in app code; no `server/` or `api/` directory | PHASE5 §3; forensic assessment §6 |
| C4 | Exact future authority required for durable/server semantics | In order: (i) product-surface designation act for Watchlists; (ii) durability classification act; (iii) if durable: persistence authority act (storage, owning identity, write/retention/deletion) **plus** D115 resolution for owning principal **plus** transport authority act (server/network) **plus** environment/production decisions | §3, §4, PHASE5 §3, packet §6/§7 |
| C5 | Bounded non-production implementation possible without crossing the environment boundary? | **Technically possible only** (session-scoped in-process, no network, no durable store); **requires a designation act that does not exist** — this gate does not create it | §6 capability table |

**Existing in-process transport pattern** (P12 typed DTOs, AD-13; P02 provider SPI) is
recorded as the only transport pattern available in-environment. **No transport was created.**

## 6. Technical possibility vs governance authority (mandatory separation)

| Capability | Technically possible? | Currently authorized? |
| --- | --- | --- |
| Session-scoped Watchlist | YES — in-process store pattern is proven (BI-07 mechanics; Tier-B hoisting) | **NO** — no act designates Watchlists for session scope; surface is DEFER + structural; designation is reserved to the authority holder; `PortfolioStore` may not be promoted |
| Durable Watchlist | NO — no durable storage mechanism exists in-environment | **NO** — no persistence authority designated |
| User-scoped Watchlist | NO — no user principal exists in the runtime | **NO** — D115 DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| Tenant-scoped Watchlist | NO — no tenant runtime exists | **NO** — D115; admin Tenancy structural only |
| Watchlist API | NO — no server tier exists | **NO** — PHASE5 §3 absolute exclusion |
| Network persistence | NO — no network transport exists | **NO** — PHASE5 §3 absolute exclusion |
| Watchlist triggers | PARTIAL — in-process evaluation machinery exists (P11 engines, P12 transports, P07 quality) for session lifetime; durable trigger state/history not possible without durability | **NO** — triggers are classified under the spec's persistent semantics; no authority act |
| Score-change persistence | NO — PIT store (P08) governs market-data domain snapshots only and may not be repurposed | **NO** — no authority designated |

## 7. Environment boundary (unchanged)

`NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV` · `productionEligible: false` · Live
Providers: 0 · Sockets: 0 · D115 DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED · Dhan
Level-1 DEFERRED (fixture-level BI-08 flow intact) · Macro EXCLUDED (D91/D88) · identity
conflict (companyId vs donor FIGI/`canonicalSecurityId`) UNRESOLVED, automatic
reconciliation PROHIBITED. This act modifies none of these.

## 8. Authority-type separation (per gate requirement; recorded independently)

| Type | Record |
| --- | --- |
| Person/role designated as authority holder | **RAMKI** (Designating Authority) — per PHASE5 act, PHASE1C record, designation packet |
| Authority acts (existing, Watchlists-relevant) | phase5 structural restoration (structure only; "NO per-surface Phase 5.x functional recovery … STOP"); PHASE1 surface matrix (#30 DEFER); designation packet (selection reserved to RAMKI; candidates were Executive/Evidence/Research — Watchlists was not presented); PHASE1C deferral record (deferral precedent); P13-07/INT-011 tracker rows |
| Technical implementation authority (Watchlists) | **NONE — NOT GRANTED** (packet §7: `implementationAuthority: NOT GRANTED` for any next surface; Watchlists never designated) |
| Environment authorization | NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV (present and sufficient for what already exists: the structural surface) |
| Production authorization | **`productionEligible: false` — NOT AUTHORIZED** (unchanged by this act) |
| Persistence authority (Watchlists) | **NONE DESIGNATED** |
| Transport authority (Watchlists) | **NONE** (network transport excluded by PHASE5 §3) |
| This decision gate | Records the evidence-based determination below; **grants no authority** |

## 9. Governance decision

### OPTION C — GOVERNANCE REMAINS UNRESOLVED

- **OPTION A (session-scoped) — not supportable.** Its defining precondition is that
  *"governing authority explicitly permits Watchlists to be session-scoped."* No authority
  record does: the only Watchlists records are DEFER (PHASE1 #30), structural fail-closed
  restoration (PHASE5), NOT STARTED (P13-07), and the spec's durable-intent semantics.
  The Tier-B/BI-07 session mechanics are portfolio-specific and non-transferable. A
  session-scope designation would also **deviate from recorded program semantics**
  ("Persistent lists, triggers, score changes"); that deviation is itself reserved to the
  designating authority and may not be manufactured by a recording gate.
- **OPTION B (durable) — not supportable.** None of its required elements exist:
  identity scope (A1/A4/A5 absent), persistence authority (B2), storage mechanism (B3),
  write authority (B5), retention/lifecycle authority (B6/B7), transport authority (C3).
- The mandated standing-question response:
  **`UNRESOLVED — NO AUTHORITY DESIGNATED`** (B1–B8; C4 for durable/server semantics).

## 10. Authorized scope (exactly what is authorized today for Watchlists)

1. The existing **structural fail-closed surface**: `/watchlists` route, `unavailable` nav
   status, `UnavailableSurface(state='offline')` — as implemented under PHASE5; preserved.
2. Continued honest disclosure of the boundary (no fabricated lists/triggers/data).
3. Nothing else. **No Watchlists implementation of any kind is authorized by this act.**

## 11. Explicitly unauthorized / deferred scope

- Any Watchlists state, store, list membership mutation, triggers, alerts, or score-change
  tracking (session or durable).
- Durable persistence by any mechanism (browser storage, file, server, database);
  promotion of `PortfolioStore`, PIT store, or any in-memory primitive to a Watchlists role.
- Network transport, API, server tier, RPC; Keycloak/OIDC or any authentication;
  user/tenant identity construction; display-session promotion to an authority.
- Donor `Watchlists` component import/activation (prohibited by OPTA-11; server-coupled).
- D115 modification; production eligibility change; Dhan/NSE/OIDC/operator-drop/P12 change;
  unrelated product-surface change.

## 12. Implementation preconditions (concrete, in required order)

1. **Product-surface designation act** for Watchlists by the designating authority
   (resolves DEFER/structural state and surface identity; possibly registry identity).
2. **Durability classification act**: session-scoped vs durable, reconciled with the spec's
   recorded persistent semantics (explicit deviation scope if session-scoped).
3. If **durable**: **persistence authority act** (storage mechanism; owning identity
   scope; write authority; retention/lifecycle; deletion/reset) **+ D115 resolution** for
   the owning principal **+ transport authority act** (server/network boundary) **+**
   environment/production boundary decisions.
4. If **session-scoped**: explicit authority act designating session-scoped, anonymous,
   process-local semantics with the durable/trigger semantics explicitly excluded or
   deferred, and lifecycle/reset rules stated.
5. Tracker closure for `P13-07` gate state and `INT-011` verification; then — and only
   then — a separate, authority-controlled implementation task.

## 13. Dependencies still unresolved

| Ref | Dependency | State |
| --- | --- | --- |
| D-1 | D115 (owning user/tenant principal; D115 C/D; runtimeCompanyId) | DEFERRED / WITHHELD / UNRESOLVED / NOT AUTHORIZED — preserved |
| D-2 | Watchlists durability classification | NO AUTHORITY DESIGNATED |
| D-3 | Watchlists persistence authority (storage/write/retention/deletion) | NO AUTHORITY DESIGNATED |
| D-4 | Watchlists transport authority (durable/server semantics) | EXCLUDED by PHASE5 §3; future authority required |
| D-5 | Product-surface designation for Watchlists | Reserved to designating authority; not presented, not selected |
| D-6 | Identity conflict (companyId vs donor FIGI) | UNRESOLVED — automatic reconciliation prohibited |

## 14. Final governance disposition

# `GOVERNANCE REMAINS UNRESOLVED`

Standing surface state unchanged: `/watchlists` remains the structural fail-closed surface
(PHASE1 DEFER / PHASE5 structural / P13-07 NOT STARTED). This gate manufactured no
decision, created no authority, and implemented nothing.

---

### VALIDATION RECORD (targeted only)

- No application code, tests, fixtures, contracts, transports, persistence, identity, or
  configuration changed — sole change: this document (ADD).
- No build, test suite, migration, production startup, network call, provider access, or
  credential operation executed; evidence gathered by targeted read/grep only.
- Every determination above cites an inspected authority record; nothing inferred from
  display-session values, donor lineage, or convenience; no authority holder conflated
  with technical/persistence/transport/production authority; no unauthorized scope introduced.
