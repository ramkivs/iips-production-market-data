# Institutional Investment Platform System (IIPS)
# WATCHLISTS — PERSISTENCE AUTHORITY DESIGNATION: AUTHORITY ACT

**Act ID:** `watchlists-persistence-authority-designation-2026-09-27-001`
**Act Type:** AUTHORITY ACT — PERSISTENCE AUTHORITY DESIGNATION (non-executable; **this act
authorizes NO persistence implementation, NO storage technology, NO transport**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Designating Authority:** RAMKI
**Recording Agent:** Arena (recording only)
**Selection Basis:** conditional authority instruction for this gate — *"If persistence
authority can be designated against the principal scope without an exact runtime identifier,
do so"* — jointly with the framework prerequisites verified in §1–§2 and the sub-gate rule
of §5; no mechanism, storage technology, or lifecycle policy was inferred by the Recording
Agent
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (UTC):** 2026-09-27
**Antecedent Checkpoint:** `2cfd8a4557e9b3815bfa5cb4544a4e094c337f0b`

---

## 1. ANTECEDENT STATE (verified fail-closed before this act)

| Item | Value | Verified |
| --- | --- | --- |
| Authoritative remote main | `origin/main` = `4d3e1cdca3a33da0ec3be8b336b17128108a502c` | ✓ |
| Branch / HEAD (pre-act) | `arena/01a0e30c-iips-production-market-data` @ `2cfd8a4…37f0b`; LOCAL == REMOTE | ✓ |
| Worktree (pre-act) | CLEAN (reflog inspected — no re-clone event since prior recovery) | ✓ |
| Product-surface designation | `35acb91` — act file + decision string | ✓ |
| Durability classification | `146c97f` — `DURABLE` string | ✓ |
| Identity/ownership designation | `2cfd8a4` — `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL OWNERSHIP` + `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` preservation string | ✓ |

**Layer separation preserved (from `146c97f` and `2cfd8a4`):** durability classification ✅
(DURABLE) · identity/ownership ✅ (scope) · runtime principal identifier ⬜ (UNRESOLVED —
preserved) · persistence authority ← **this gate** · persistence implementation ⬜ (not
collapsed into this act) · transport ⬜ (closed).

## 2. EXISTING PERSISTENCE-AUTHORITY FRAMEWORK (records inspected directly)

| # | Framework question | Finding (evidence) |
| --- | --- | --- |
| 1 | Designation mechanism | **Program-Authority persistence charters/authority acts** recorded under `evidence/`: `BI-07-AUTH-2026-01` ("Portfolio Domain Store & Atomic Persistence Boundary", `portfolio-store.ts` header), `GOVERNED_MULTI_BROKER_ATOMIC_MERGE` charter (`evidence/bi04/…`), `BI-08-IDEMPOTENT-MULTI-BROKER-INGRESS-CHARTER` (`evidence/bi08/…`), `GOV-REC-2026-NON-PROD-OPERATOR-BYPASS-01` (`evidence/operator_drop/…`) |
| 2 | Authority holder/role | RAMKI — Program / Designating Authority (charters record explicit Program-Authority selections, e.g. BI-08 "OPTION A — CONTENT-HASH IDEMPOTENCY (SELECTED)") |
| 3 | Required fields | charter/act identifier; authority decision; governing charters; execution mode; scope & objective; operational invariants; acceptance criteria; certification/durability record |
| 4 | Storage scope & lifecycle expression | **bundle tolerated only where the charter itself names the mechanism** (BI-07: in-memory atomic store + Tier-B session continuity + reset utilities) |
| 5 | Write/delete authority expression | operational invariants inside the charter (Save Guards, merge rules, content-hash idempotency, reset) — i.e., **defined with the mechanism** |
| 6 | Authority vs implementation | **distinct**: charters precede implementation; certification follows separately (`bi07-final-certification`) |
| 7 | May an act designate a bounded storage mechanism? | Precedent: yes — persistence charters name their mechanism ⟹ the mechanism **cannot be inferred** for Watchlists; it must be explicitly designated |
| 8 | Retention/lifecycle placement | with the mechanism charter in precedent ⟹ for Watchlists it follows the storage classification (sub-gated, §6) |

## 3. AUTHORITY DECISION RECORDED

> ### **PERSISTENCE AUTHORITY = ESTABLISHED WITH EXPLICIT SUB-GATES**
> ### for durable Watchlists state within the designated personal/single-user/local scope
> **Recording basis:** the conditional authority instruction for this gate, satisfied
> framework prerequisites (§1–§2), and the sub-gate determinations in §5–§6. Nothing else.

### 3.1 What persistence is authorized (capability scope — the *entire* grant)

1. **Authority to persist exists** for the bounded Watchlists state defined in §4.
2. **Authorized owner scope:** `PERSONAL APPLICATION PRINCIPAL / SINGLE-USER LOCAL
   OWNERSHIP` — exactly as designated by `2cfd8a4`; unchanged. No `companyId`, `tenantId`,
   `ANONYMOUS_SESSION`, `system`, `IIPS_OFFLINE_BOOTSTRAP`, or donor-Keycloak substitution.
3. **Authorized environment:** local · personal · single-user · **NON_PRODUCTION /
   LOCAL_FIXTURE_AND_OFFLINE_DEV** · non-shared · non-deployed — unchanged.
4. **Nothing else.** This act designates *authority to persist* in that scope. It does
   not name a storage technology, does not define operational lifecycle, and does not
   authorize implementation (§5–§7).

## 4. AUTHORIZED STATE BOUNDARY (narrowest legitimate)

**Covered:** Watchlists **list state only** —
(i) watchlist definitions (list identity, display name, ordering metadata);
(ii) list **membership as references to governed securities by canonical `companyId`**
(membership references, never security identity ownership — `companyId` remains
security-identification only);
(iii) provenance/audit metadata for list mutations (timestamps, source classification,
lineage digests per the existing P01-05 provenance chain — cited as architectural
evidence, not promoted).

**Explicitly outside the boundary** (each requires its own future authority):
trigger/alert/score-change **history or rule persistence** (separate state domain; also
gated on engine-data dependencies per `P13-07` deps P07/P11/P12) · market-data snapshots,
quotes, scores, or engine outputs embedded in list state (derived data must come from
governed planes at read time) · portfolio state · fundamentals · intelligence · screener
state · general user preferences · alerts outside Watchlists · authentication state or
credentials · tenant state · any unrelated product state.

## 5. EXPLICIT SUB-GATES (established as separately governed; NOT performed)

| # | Sub-gate | Why separate (authority/evidence) |
| --- | --- | --- |
| SG-1 | **Storage-technology classification** (bounded storage mechanism designation) | Framework precedent names mechanism inside persistence charters; this gate's authority instruction prohibits inference (no technology may be selected for convenience); verified absence of all browser-aside mechanisms keeps the choice fully open |
| SG-2 | **Write / update / delete / reset operational semantics** | Framework precedent defines these as charter invariants **with the mechanism**; no operational semantics were selected by this gate's instruction; no lifecycle policy may be invented |
| SG-3 | **Retention / lifecycle policy** | Same bundling precedent (§2 row 8); follows SG-1 |
| SG-4 | **Trigger / score-change persistence** | Out-of-boundary state domain (§4); independent authority + data-plane dependencies |
| SG-5 | **Exact runtime principal identifier** | `EXACT RUNTIME PRINCIPAL IDENTIFIER = UNRESOLVED` preserved verbatim; required only when a storage mechanism binds keys to a runtime identity (SG-1 dependency); capability designation against the **principal scope** is complete without it |

**Lifecycle status table (per this act):** create/write = SG-2 · update = SG-2 ·
delete/reset = SG-2 · retention = SG-3. **None is authorized now**; the DURABLE-across-
reload intent stands from `146c97f` without a lifecycle policy being invented.

## 6. EXCLUSIONS (absolute)

No storage technology assumed or selected (no database, `localStorage`, IndexedDB,
filesystem, SQLite, server database, cloud storage, or API persistence) · no existing
store promoted (`PortfolioStore`, `PointInTimeStore`, `IdentityMappingStore`, provenance/
serialization, any in-memory singleton — evidence only; technical capability ≠ authority)
· no persistence implementation (no Watchlist store, adapter, schema, browser storage,
filesystem file, migration, fixture) · no transport (`/api/watchlists`, server actions,
RPC, network, WebSocket, EventSource, `authFetch`, Keycloak, P12 Watchlist DTOs) · no
authentication or identity-runtime resolution · no production (`productionEligible: false`;
no D115 change; no provider entitlement) · no donor Watchlists persistence import · no
`/watchlists`, navigation, UI registry, or unrelated-surface change · no tracker/spec edits.

## 7. GOVERNANCE SEQUENCING (recorded; next gate NOT performed)

```
Product-surface designation      ✅  35acb91
Durability = DURABLE             ✅  146c97f   (classification only)
Identity/ownership scope         ✅  2cfd8a4   (scope; identifier UNRESOLVED)
Persistence authority            ✅  THIS ACT (capability established — SG-1..SG-5 closed)
Storage-technology classification ←  NEXT SINGLE GATE (SG-1)
Write/update/delete + retention  ←  with/following SG-1 (SG-2, SG-3)
Trigger/score-change persistence ←  separate state-domain gate (SG-4)
Runtime principal identifier     ←  bounded identity/runtime step when required (SG-5)
Transport authority              ←  later separate gate
Implementation authorization     ←  later read-only pre-flight / implementation gate
Implementation                   ←  later separate authority-controlled act
```

## 8. VALIDATION (targeted, governance-only)

- Sole repository change: ADD of this act file. Zero application, persistence,
  transport, identity/authentication, configuration, or production-boundary changes.
- No build or test suite executed (non-executable act).
- Framework findings (§2) verified by direct inspection of the cited charters and store
  contract headers; no technology inferred; no store promoted; the unresolved principal
  identifier state read from `2cfd8a4` and preserved verbatim.

## 9. DURABILITY CHECKPOINT

| Step | Result |
| --- | --- |
| Exact diff reviewed | only this act file added |
| Application/persistence/transport/identity/config/production changes | none |
| Commit | (SHA in final report / git log) |
| Push to `arena/01a0e30c-iips-production-market-data` | completed |
| LOCAL == REMOTE (`ls-remote`, post-push) | verified |
| Tracking / clean worktree | verified |

---

## OUTCOME

# **PERSISTENCE AUTHORITY ESTABLISHED WITH EXPLICIT SUB-GATES**
# for durable Watchlists list state — personal/single-user/local/non-production scope.
# Storage technology: NOT selected. Operational lifecycle: NOT defined.
# **Next single gate: storage-technology classification. STOPPED.**
