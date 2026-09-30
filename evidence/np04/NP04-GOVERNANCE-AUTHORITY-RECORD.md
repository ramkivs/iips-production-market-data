# NP04 — GOVERNANCE AUTHORITY RECORD

**Act identifier:** `np04-governance-authority-record-2026-09-30-001`
**Authority:** RAMKI — "NP04-G32 — NP04 Governance Recording Authority Designation" (2026-09-30)
**Recording Agent:** Arena (recording only — no implementation, no new governance framework)
**Scope:** NP04
**Nature:** Governance / Recording Only

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Execution Mode:** NON_PRODUCTION
**Recorded At (local, Asia/Calcutta):** 2026-09-30
**Antecedent Checkpoint:** `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e`
**Session branch:** `arena/01a0f308-iips-production-market-data`
**Repository:** `ramkivs/iips-production-market-data` (IPD — authoritative)

---

## 1. PURPOSE AND AUTHORITY

This act authorizes and constitutes the **creation of the missing canonical NP04 governance
record**. It is a historical/current governance record, **not** an implementation artifact.

Authorized by this act, and nothing more:

* creation of this single NP04 governance record;
* one governance-only commit;
* push of that governance-only commit to the authoritative IPD remote.

**Not authorized by this act:** any implementation commit, any dependency change, any schema
change, any OIDC change, any source implementation modification, any modification of historical
D115 evidence, and any modification of existing historical governance artifacts.

This act does **not** create a new governance framework. It uses the repository's established
governance/evidence convention (a single, identified, scope-bound authority record under
`evidence/`), and records decisions that were already established and accepted before this act.
**No decision is reinterpreted, altered, extended, or reopened by this record.**

---

## 2. SCOPE OF CONSOLIDATION

This record consolidates the five NP04 governance decisions enumerated by the authorizing
instruction:

| Gate | Subject |
|---|---|
| **G22** | Durable persistence foundation — technical direction |
| **G24** | Durable persistence implementation authorization and bounded implementation outcome |
| **G29** | Post-implementation reconciliation |
| **G30** | Tenant authority investigation and decision packet |
| **G31** | D115 tenant-authority disposition and deferred status |

**Scope note.** This is the consolidation scope set by the authorizing instruction. It is not
asserted to be a complete enumeration of every activity performed within the NP04 series.

**Out of scope of this record (unchanged, untouched):** D115 historical evidence; existing
historical governance artifacts; all protected implementation surfaces listed in §8.

---

## 3. EVIDENTIARY BASIS AND PROVENANCE

Per the recording rule, every statement in this record is classified by how it is established.
No statement below outruns its evidence class.

| Class | Meaning |
|---|---|
| **[RV]** | **Repository-verifiable** — reproducible from a commit SHA, file path, or source constant at the antecedent checkpoint. |
| **[HI]** | **Historical governance artifact** — sourced from an existing, unmodified governance/evidence artifact in this repository. |
| **[AI]** | **Authority instruction** — recorded from the authorizing Program Authority instruction (G32) or from a prior gate determination that left **no** in-repository artifact of its own. |
| **[ER]** | **Execution record** — result of a test/verification execution during the G24 gate; not reproducible from a static repository artifact. |

**Provenance disclosure.** Prior to this act, the NP04 series had **no** governance/evidence
artifact in this repository: the token `NP04` appeared in **zero** files under `docs/` and
`evidence/`, and only two commits in the entire history referenced NP04 (`8c99627`, `d4fdb33`) —
both implementation commits. The NP04 trace was otherwise limited to source and test header
comments. **[RV]** Consequently, G22, G29, G30 and G31 are recorded here **[AI]**, from the
authority instruction and prior gate determinations, and are **not** independently reproducible
from a pre-existing repository artifact. This record is their first in-repository attestation.

---

## 4. RECORDED DECISIONS

### 4.1 G22 — Durable persistence foundation technical direction

**Subject.** Durable persistence foundation: technical direction. **[AI]**

**Direction recorded (accepted, not reopened):**

* durable persistence is owned by **IPD**;
* the persistence substrate direction is **SQLite**;
* `better-sqlite3` is the accepted driver candidate;
* the existing **PortfolioStore is extended, not replaced** — no second portfolio model is built.

**Corroborating repository evidence [RV]:** `better-sqlite3` pinned to the exact version
`13.0.3` (no range) in `package.json`; `@types/better-sqlite3` pinned to `9.6.0`;
`src/portfolio/consolidation.ts` and `src/portfolio/durable-store.ts` reuse the certified types
from `frontend/src/features/portfolio/`; the certified PortfolioStore directory
`frontend/src/features/portfolio/` has **0 files changed** against baseline `0dab122`.

**Status:** ACCEPTED DIRECTION — implemented under G24; not reopened by this record.

### 4.2 G24 — Durable persistence implementation authorization and bounded implementation outcome

**Subject.** Implementation authorization and the bounded implementation outcome. **[AI]**, with
full repository corroboration **[RV]**.

**Authorization scope recorded:** IPD durable user-portfolio domain; SQLite via exact-pinned
`better-sqlite3@13.0.3`; lifecycle **validate → connect → migrate → verify → listen**; fail-closed
database errors with **no in-memory fallback**; configuration supplied exclusively through
`IPD_PORTFOLIO_DB_PATH`; isolated temporary databases in tests; phased delivery A–J including
`tenant_memberships`; IPD OIDC audience `ipd-user-portfolio-api`; authorization on
`applicationUserId + tenantId + portfolioId`; additive `/api/ipd` surface.

**Bounded outcome recorded [RV]:**

| Item | Value |
|---|---|
| Implementation commits | `8c99627`, `d4fdb33` |
| Antecedent HEAD | `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e` |
| Baseline | `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c` |
| Commits since baseline | 2 |
| Files changed vs baseline | 41 total = **39 added + 2 modified** |
| Modified pre-existing files | `package.json`, `package-lock.json` **only** |
| Schema version | `002` |
| Migrations | `001_initial_schema`, `002_audit_event_sequence` |

**Status:** AUTHORIZED — IMPLEMENTATION COMPLETE.

### 4.3 G29 — Post-implementation reconciliation

**Subject.** Read-only post-implementation reconciliation. **[AI]**

**Disposition recorded:**

```text
G24 IMPLEMENTATION — TECHNICALLY COMPLETE; FOLLOW-UP GOVERNANCE REMAINS
```

**Open items carried from G29 (recorded, not resolved here):**

* tenant provisioning authority;
* tenant membership audit;
* cross-system security-audit delivery authority;
* live Keycloak runtime verification;
* four pre-existing `tsc` errors in `wsi_iu1` / `wsj_iu3` (baseline, not G24-attributable).

**Mutation status of G29:** NONE. Commit: NONE. Push: NONE.

### 4.4 G30 — Tenant authority investigation and decision packet

**Subject.** Tenant membership authority — governance decision packet. **[AI]**

**Disposition recorded:**

```text
TENANT AUTHORITY DECISION PACKET COMPLETE — HUMAN GOVERNANCE REQUIRED
```

**Findings recorded [RV] — implementation facts, not governance authority:**

* `tenant_memberships` primary key `(application_user_id, tenant_id)`; foreign key to
  `application_users`; `CHECK (state IN ('ACTIVE','REVOKED'))`; index on `tenant_id`.
* `provisionTenantMembership` (`src/app_identity/service.ts` L418) and
  `revokeTenantMembership` (L439) are transactional upserts that generate **no audit events**.
* `resolveTenant` (L466) is **fail-closed at every branch**: no memberships → Missing;
  explicit tenant not found → Missing; state not `ACTIVE` → Revoked; more than one `ACTIVE`
  membership with no tenantId supplied → **Missing (never guessed)**; zero `ACTIVE` → Revoked.
* **0 non-test callers**, **0 HTTP endpoints**, and **0 role/actor authorization guards** exist
  for tenant provisioning or revocation.
* `tenantId` has **no upstream authoritative source** in the repository — it is an opaque
  caller-supplied string.
* `upsertTenantMembership` uses `ON CONFLICT (application_user_id, tenant_id) DO UPDATE SET
  state = excluded.state`, producing an implicit `REVOKED → ACTIVE` restoration behaviour.

**Mutation status of G30:** NONE. Commit: NONE. Push: NONE.

### 4.5 G31 — D115 tenant-authority disposition and deferred status

**Subject.** Recording of the approved human D115 tenant-authority disposition. **[AI]**

**Disposition recorded:**

```text
D115 TENANT AUTHORITY DISPOSITION ACCEPTED — GOVERNANCE RECORDING LOCATION NOT ESTABLISHED
```

G31 accepted the approved human disposition substantively, but determined that **no authorized
governance recording location then existed**, and reported the gap rather than filling it. That
gap is closed by the present act, which is the authority designation G31 identified as missing.

**Mutation status of G31:** NONE. Commit: NONE. Push: NONE.

---

## 5. G31 APPROVED TENANT DISPOSITION (RECORDED VERBATIM)

> **D115 tenancy remains unresolved and authoritative tenant administration remains outside IPD
> pending explicit D115 disposition. The G24 IPD tenant-resolution boundary remains intact and
> fail-closed, but `tenant_memberships` is not designated as the authoritative enterprise tenant
> source. No tenant-administration endpoint, role, self-service, delegation, restoration, or
> cross-system audit authority is authorized at this time.**

### 5.1 Resulting statuses (recorded exactly as approved)

```text
Tenant source of truth        = D115-deferred
Tenant administration         = NOT AUTHORIZED
Tenant-admin authorization    = NOT AUTHORIZED
Tenant lifecycle expansion    = DEFERRED
Tenant restoration semantics  = DEFERRED
Tenant membership audit       = DEFERRED
Cross-system security audit   = UNRESOLVED / DEFERRED
Live Keycloak verification    = ENVIRONMENT-DEPENDENT OUTSTANDING
G24 portfolio authorization   = COMPLETE / UNCHANGED
Durable portfolio persistence = COMPLETE
```

### 5.2 D115 relationship

```text
D115-CONSTRAINED
AUTHORITY NOT ESTABLISHED
DEFERRED PENDING D115 DISPOSITION
```

D115 is **not** resolved, modified, or reopened by this record. Historical D115 evidence is
unchanged: `evidence/target-shell-integration/IIPS-HISTORICAL-CURRENT-CONVERGENCE-INVENTORY.md`
(row 46 Tenants — PRUNED / D115-adjacent / AUTH-BLOCKED (D115); §G authority-blocked; §I
D115-constrained) and `docs/PHASE1_AUTHORIZATION_PREPARATION.md` (D115 C / D UNRESOLVED; D115
production activation NOT AUTHORIZED) are each verified **0 changes** against baseline `0dab122`.

### 5.3 Tenant lifecycle follow-up

The implicit `REVOKED → ACTIVE` behaviour of `upsertTenantMembership` is **preserved unchanged**
by this record. It is recorded as:

```text
TENANT LIFECYCLE FOLLOW-UP:
DEFERRED / GOVERNANCE REQUIRED
```

This preserves the implementation while preventing the current behaviour from being mistaken for
a newly approved governance policy.

### 5.4 Tenant audit and cross-system audit

```text
Mapping mutations:
AUDITED

Tenant membership mutations:
CURRENTLY NOT AUDITED

Tenant membership audit authority:
NOT ESTABLISHED

Implementation change:
NOT AUTHORIZED
```

```text
Cross-system security-audit delivery:
NOT ESTABLISHED

Audit destination:
NONE AUTHORIZED

Implementation:
NOT AUTHORIZED
```

---

## 6. IMPLEMENTATION FACTS ESTABLISHED BY REPOSITORY EVIDENCE

Distinct from governance authority. Each item below is **[RV]** at the antecedent checkpoint
unless marked otherwise.

| Fact | Evidence |
|---|---|
| Persistence lifecycle order | validate → connect → migrate → verify → listen (`src/persistence/bootstrap.ts`) |
| No in-memory fallback | fail-closed; persistence failures are never downgraded to in-memory (`src/persistence/errors.ts`, `bootstrap.ts`) |
| DB path configuration | `IPD_PORTFOLIO_DB_PATH` — absolute path required (`src/persistence/config.ts`) |
| Schema version | `002` |
| Migrations present | `001_initial_schema`, `002_audit_event_sequence` |
| Deterministic audit ordering | `seq INTEGER PRIMARY KEY AUTOINCREMENT`; reads `ORDER BY seq ASC` |
| OIDC audience | `IPD_DEFAULT_AUDIENCE = 'ipd-user-portfolio-api'` (`src/auth/config.ts`) |
| Trusted JWS algorithms | `['RS256', 'ES256']` (`src/auth/config.ts`) |
| Authorized HTTP surface | additive `/api/ipd/*`; authentication required on every `/api/ipd/*` route (`src/server/http-server.ts`) |
| Authorization triple | `applicationUserId + tenantId + portfolioId` (`src/server/authorization.ts`) |
| Portfolio tenancy | `user_portfolios.tenant_id TEXT NOT NULL` — one portfolio belongs to exactly one tenant |
| Test isolation | isolated temporary databases via `IPD_PORTFOLIO_DB_PATH` (`tests/g24_*`) |
| Execution mode | NON_PRODUCTION (`src/persistence/config.ts`, `src/server/config.ts`) |
| Full-suite test result | 782 passed / 0 failed, across 4 consecutive full-suite runs **[ER]** |
| G24 suite result | 84/84 (A10 B10 C13 D13 E9 F15 G4 H10); baseline 698 intact **[ER]** |
| Typecheck | `npx tsc` emits only the 4 pre-existing baseline errors (`wsi_iu1_pit_series_aware_keying` ×1, `wsj_iu3_pit_read_boundary` ×3); no G24-attributable errors **[ER]** |

---

## 7. DEFERRED / UNRESOLVED GOVERNANCE ITEMS

Recorded as open. None is resolved, narrowed, or expanded by this act.

| Item | Status |
|---|---|
| Tenant source of truth | **D115-deferred** |
| Tenant administration authority | **NOT AUTHORIZED** |
| Tenant-admin authorization (roles / actors / primitive) | **NOT AUTHORIZED** |
| Tenant lifecycle expansion | **DEFERRED** |
| Tenant restoration semantics (`REVOKED → ACTIVE`) | **DEFERRED** |
| Tenant membership audit | **DEFERRED** |
| Cross-system security-audit delivery authority | **UNRESOLVED / DEFERRED** |
| D115 disposition (C and D) | **UNRESOLVED — NOT addressed by this record** |
| Delegation / transfer / multi-admin / emergency / self-service tenant semantics | **NOT ESTABLISHED — no such semantics exist in the repository** |

---

## 8. ENVIRONMENT-DEPENDENT VERIFICATION ITEMS

| Item | Status |
|---|---|
| Live Keycloak runtime verification | **ENVIRONMENT-DEPENDENT OUTSTANDING** |
| Repository-implemented OIDC verification | **ESTABLISHED** (audience, trusted algorithms, verification path present in source) |

These are recorded separately. The presence of repository-implemented OIDC verification is **not**
evidence of live Keycloak verification, and the absence of a live Keycloak environment is **not**
recorded as a failure of the implementation.

---

## 9. EXPLICIT NON-IMPLICATIONS

This record does **not** imply, and must not be read as implying, any of the following:

* that IPD owns or is designated as the enterprise tenancy source of truth;
* that `tenant_memberships` is an authoritative tenant register;
* that tenant administration, provisioning, or revocation authority has been granted;
* that the implicit `REVOKED → ACTIVE` behaviour is an approved governance policy;
* that tenant membership mutations are audited;
* that any cross-system security-audit authority or destination exists;
* that live Keycloak verification occurred;
* that any deferred item in §7 has been narrowed, expanded, or resolved.

An implementation mechanism is not converted into governance authority anywhere in this record.
Code identifiers such as `provisionTenantMembership` are recorded as code identifiers only; no
authority is inferred from naming.

---

## 10. PROTECTED IMPLEMENTATION

Verified unchanged against baseline `0dab1221fb0f89e2e0601ea905d642bfe72d5f9c`. Each of the
following records **0 changed files**, with the exception of the G24 implementation itself, which
is unchanged at its committed SHAs:

| Protected surface | Files changed vs baseline |
|---|---|
| G24 implementation (`8c99627`, `d4fdb33`) | unchanged — SHAs intact, not amended |
| Durable portfolio persistence | G24 scope; unchanged since `d4fdb33` |
| Tenant-resolution boundary (`resolveTenant`) | unchanged since `d4fdb33` |
| Dhan import (`frontend/src/features/portfolio/import`) | 0 |
| PIT (`src/pit`) | 0 |
| D114 (`src/d114`) | 0 |
| Operator Drop (`src/operator_drop`) | 0 |
| RR↔IPD (`src/ingress`, `src/contracts`) | 0 |
| IU-7 / IU-8 (`src/identity`) | 0 |
| G3/OIDC (`src/auth` — baseline portion) | 0 |
| IRR certified `/api/portfolio` | 0 (no `/api/portfolio` route exists in `src/`) |
| production | 0 |
| Historical D115 evidence | 0 |
| Historical governance artifacts (`evidence/`, `docs/`) | 0 |

---

## 11. GATE DISPOSITION CHAIN (NP04)

| Gate | Disposition recorded | Mutation |
|---|---|---|
| G22 | Accepted technical direction (§4.1) | not applicable — direction gate |
| G24 | Authorized — implementation complete (§4.2) | 39 added / 2 modified |
| G29 | `G24 IMPLEMENTATION — TECHNICALLY COMPLETE; FOLLOW-UP GOVERNANCE REMAINS` | NONE |
| G30 | `TENANT AUTHORITY DECISION PACKET COMPLETE — HUMAN GOVERNANCE REQUIRED` | NONE |
| G31 | `D115 TENANT AUTHORITY DISPOSITION ACCEPTED — GOVERNANCE RECORDING LOCATION NOT ESTABLISHED` | NONE |
| **G32** | **This act — governance recording authority designation** | **1 governance artifact** |

---

## 12. ATTESTATION

**Verified before commit:**

| Check | Result |
|---|---|
| Working tree clean at baseline | CLEAN — 0 dirty, 0 untracked, 0 stashes |
| Branch | `arena/01a0f308-iips-production-market-data` |
| HEAD before commit | `d4fdb33d9810b0736a9a382d6ab35b7ce2a7480e` |
| Local == remote before commit | identical |
| Protected implementation unchanged | verified (§10) |
| Historical D115 evidence changed | NO |
| Historical governance artifacts modified | NO |
| New governance artifacts | exactly one — this file |
| Implementation files changed | 0 |
| Dependency files changed | 0 |
| Schema files changed | 0 |

**Recording attestation.** This artifact was prepared by Arena as **Recording Agent** only. It
records decisions already accepted by the Program Authority and implementation facts already
established by repository evidence. It selects nothing, ranks nothing, recommends nothing, and
authorizes nothing beyond its own creation.

---

*End of record `np04-governance-authority-record-2026-09-30-001`.*
