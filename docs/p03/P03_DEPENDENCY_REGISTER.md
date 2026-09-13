# P03 — DEPENDENCY REGISTER

Recording an item does **not** resolve it. **No downstream dependency is converted into P03
scope.**

---

## 1. Upstream — accepted artifacts P03 consumes

| Source | Consumed | P03 modifies it? |
|---|---|---|
| **P01** `P01_DATA_CONTRACT.md` | Canonical contract; `availability` enum; lineage block | **NO** |
| **P01** `P01_IDENTITY_AND_LINEAGE.md` | Lineage elements; AD-1 boundary; ADR-02 linkage | **NO** |
| **P01** `P01_VALIDATION_RULES.md` | `WITHHELD` / `NOT_PROVIDED` distinction; rejection semantics | **NO** |
| **P01** `P01_VERSIONING_COMPATIBILITY.md` | Four version axes | **NO** |
| **P02** `P02_ENTITLEMENT_MODEL.md` | Entitlement dimensions; matrix structure; fail-closed rules; secrets prohibition | **NO** |
| **P02** `P02_ERROR_TAXONOMY.md` | E1–E8 | **NO — reused, not extended for provider-side conditions** |
| **P02** `P02_PROVIDER_ABSTRACTION_CONTRACT.md` | Adapter boundary; containment | **NO** |
| **P02** `P02_OBSERVABILITY_REQUIREMENTS.md` | Record content; redaction RD-1…RD-6 | **NO — inherited verbatim** |
| **P02** `P02_PROVIDER_IDENTITY_VERSIONING.md` | Six version axes | **NO** |

## 2. Inherited open items — disposition in P03

| Item | State (unchanged) | Touches P03 how | Resolved here? | Owner |
|---|---|---|---|---|
| **A1 person assignment** | **CLEARED, `person_named: false`** | Substantive security/identity content decisions need a recorded A1 decision | **NO — and no person is assigned or inferred** | A1 |
| **M-5** authentication not wired | **OPEN — existing-IIPS** | **DIRECT** exposure on G1/G2/G3; makes AP-1 specifiable but not satisfiable | **NO — not repaired, existing-IIPS untouched** | Existing-IIPS |
| **M-6** retention not enforced | **OPEN — existing-IIPS** | Security audit records carry the strongest retention obligation; enforcement absent | **NO** | Existing-IIPS |
| **OI-08** cardinality 1→N | **OPEN** | None on P03 — identity content decision | **NO — belongs to P04** | P04 / A1 |
| **OI-09** identifier standard | **OPEN** | None on P03 — identity content decision | **NO — belongs to P04** | P04 / A1 |
| **OI-10** namespace token | **`APPROVED-BUT-REQUIRES-EXACT-TOKEN-RECORDING`** | No P03 impact — P03 introduces no canonical field | **NO** | ADR-01 authority |
| **AD-17** replay literal returns | **UNRESOLVED** | Only that replay is not an access-control mechanism (R-4) | **NO — `ReplayService` untouched** | Existing-IIPS |
| **M-1 / AD-4** | **`OPEN_REVALIDATION_REQUIRED`** | Blocks P15 certification of anything, including C12 | **NO** — E2E-030 NOT REVOKED / NOT RENEWED | External |
| **OI-05** alt-data applicability | **OPEN** | D09 entitlement scope | **NO** | P10 |
| **OI-06 / CD-01 / AD-9** | **OPEN** | No P03 impact recorded | **NO** | Various |
| **C12** data-plane security/tenant enforcement | **BLOCKED** (`D4_11:50`) | The certification this phase eventually feeds | **NO — specification does not unblock it** | **A2** — cleared, `person_named: false`, `certification_granted: false` (`P03_SCOPE_AND_BOUNDARY.md` §3.1) |

## 3. Downstream dependencies — NOT P03 scope

| Phase | Depends on P03 | P03 does **not** do |
|---|---|---|
| **P04** Security Master | Tracker `P04-01` dep `P01, P02, P03` | Build the master; resolve identity; decide OI-08/OI-09 |
| **P05** Acquisition | `P05-02` dep `P02-01, P02-02, P03-01, P04-02` | Implement acquisition, adapters or credential runtime |
| **P07** Data Quality | Indirect | Freshness thresholds, reconciliation |
| **P12** Certified APIs | Tenant scoping server-side (`D4_09` K.2.6) | Design or build APIs/DTOs |
| **P13** UI Integration | UI12 Settings depends on the G3/M-5 gap (INT-014b) | Any UI work |
| **P16** Activation | Licensing, credentials, connectivity, controlled activation | Any activation, licence or provider onboarding |
| **P17** Operations | Monitoring, alerting, incident response | Any operational tooling |

## 4. P03-raised dependencies

| ID | Dependency | Why | Deferred to | Blocks P03 gate? |
|---|---|---|---|---|
| **DEP-P03-01** | Authentication mechanism/protocol undecided | Open A1 content decision (OD-1) | A1 | **No** — requirements are mechanism-neutral |
| **DEP-P03-02** | Role/permission taxonomy undecided | Open A1 content decision (OD-2) | A1 | No |
| **DEP-P03-03** | **AP-1 requirements are unsatisfiable until M-5 is repaired** | Existing-IIPS defect | Existing-IIPS | **No** — specification is the deliverable; satisfaction is not |
| **DEP-P03-04** | Secret-management substrate unselected | No authoritative evidence requires a product | A1 / P16 | No |
| **DEP-P03-05** | Rotation frequency and expiry values undecided | Operational policy (OD-3) | A1 / P17 | No |
| **DEP-P03-06** | Tenant model — the actual tenant set and hierarchy — undefined | Product/authority decision (OD-4) | A1 | No |
| **DEP-P03-07** | Region / data-residency requirements undefined | (OD-5) | A1 | No |
| **DEP-P03-08** | Security tests and authz tests not produced | Tracker `P03-01`/`P03-02` validation methods; specification-only phase | P05 + P15 | No — recorded as obligation |
| **DEP-P03-09** | Retention of security audit records is **unenforceable today** | M-6 stub | Existing-IIPS | No — recorded as a limitation |
| **DEP-P03-10** | Service-principal model for credential resolution undefined in detail | Depends on OD-1 | A1 | No |
| **DEP-P03-11** | Human break-glass access to production secret values undefined | Deliberately not designed; would need explicit authority | A1 | No |
| **DEP-P03-12** | **C12 certification remains blocked** | M-5 | Existing-IIPS + **A2** (cleared, not named) | No — P03 is not certification |

## 5. Tracker reconciliation

| Tracker row | Deliverable | Covered by | Deferred |
|---|---|---|---|
| `P03-01` Credential/secrets handling | *"Secrets design"* | `P03_SECRET_CONFIGURATION_REQUIREMENTS.md` | *Security tests*, *"Secrets flow passes security checks"* — **DEP-P03-08** |
| `P03-02` Tenant/access controls | *"Access-control contract"* | `P03_SECURITY_AUTH_CONTRACT.md` + `P03_TENANT_ISOLATION.md` | *Authz tests*, *"Unauthorized access denied"* — **DEP-P03-08** |

**Deviation:** both tracker rows name executable validation (*Security tests*, *Authz tests*)
and evidence artifacts. This is a specification-preparation task; the program has produced no
executable source in any phase. Recorded as **DEP-P03-08**, not silently implemented.

## 6. Prohibitions reaffirmed

| # | Prohibition |
|---|---|
| 1 | No implementation, no source code, no configuration, no policy files |
| 2 | **No secret, credential, key, token, endpoint, account or vendor product** |
| 3 | No repair of M-5, M-6 or any existing-IIPS defect |
| 4 | No modification of existing-IIPS authentication, methodology, scoring, calibration, taxonomy or certification |
| 5 | No resolution of OI-08/OI-09 (P04), OI-10 (ADR-01) or AD-17 |
| 6 | **No person assigned or inferred to A1** |
| 7 | No P04+ work; no downstream dependency absorbed into P03 |
| 8 | No certification granted; no production activation authorized |
| 9 | No change to `snapshotId`, lineage structure, version axes or engine identity |
| 10 | **UNKNOWN over guessing** — no invented authority, name, date or evidence |
