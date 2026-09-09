# P03 — LINEAGE AND VERSION IMPACT

**SPECIFICATION ONLY.**

> **Bottom line: P03 adds NOTHING to snapshot identity and NOTHING to the version axes.**
> Security context belongs in **request context** and **audit**, with a narrow, governed
> exception for AD-11 `tenantId` in lineage.

---

## 1. Placement decision — where each element belongs

| Element | Request context | Snapshot lineage | Audit record | **Snapshot identity** | Engine execution identity |
|---|---|---|---|---|---|
| Authenticated principal | **YES** | **NO** | **YES** | **NO** | **NO** |
| Principal type | YES | NO | YES | NO | NO |
| Session / token / credential | **YES (transient)** | **NEVER** | **NEVER (value)** | **NO** | **NO** |
| `tenantId` | **YES** | **CONDITIONAL** — §2 | **YES** | **NO** | **NO** |
| Authorization grant reference | YES | NO | **YES** | NO | NO |
| `entitlementRef` | YES | **YES** — where a field is `WITHHELD` | YES | **NO** | NO |
| AD-11 classification / region | YES | **YES** (existing AD-11 behaviour) | YES | NO | NO |
| Secret reference | YES (transient) | **NEVER** | **Reference only** | **NO** | **NO** |
| Environment | YES | **NO** | **YES** | **NO** | NO |
| `provider` (internal identity) | — | **YES** (P01/P02) | YES | **YES** (existing) | via ADR-02 |
| `adapterId` / `adapterVersion` | — | **YES** (P02) | YES | **NO** (P02 SI-4) | via lineage |

## 2. `tenantId` in lineage — the one conditional case

| # | Rule |
|---|---|
| T-1 | `tenantId` may appear in lineage **only** where AD-11 `DataGovernanceRuntime` classification already requires it — this is **existing, reused behaviour**, not a P03 addition |
| T-2 | It appears as a **governance attribute**, never as data provenance. *Who could see it* is not *where it came from* |
| T-3 | It **must never** cause the same data acquired under different tenants to receive different `snapshotId`s |
| T-4 | It **must never** appear as a canonical field |
| T-5 | Cross-tenant identity in lineage is prohibited (IS-3 L-1) |

## 3. Snapshot identity — unchanged, absolutely

| # | Rule |
|---|---|
| SI-1 | The P01 snapshot identity is **`data-${provider}-${dataVersion}-${asOf}`** — **format frozen (AD-6). P03 changes nothing about it** |
| SI-2 | **No security element enters it** — not principal, not tenant, not environment, not grant, not credential |
| SI-3 | It remains **never conflated** with engine-layer `SNAP_*`. They identify different things: which market-data input was consumed, versus which engine execution was produced |
| SI-4 | Identical `(provider, dataVersion, asOf)` yields an identical `snapshotId` **regardless of who requested it, in which tenant, in which environment** |
| SI-5 | ⚠ **The load-bearing consequence:** data identity is deliberately **tenant-independent**, so **tenant isolation must be enforced at access, never by fragmenting identity** (see `P03_TENANT_ISOLATION.md` D-3/D-4). An implementation keying storage solely on `snapshotId` without a tenant access check would leak across tenants while appearing correct |
| SI-6 | Were security context admitted into identity, two tenants receiving the same provider data would produce **different** identities for **identical** data — destroying determinism, replay comparability and lineage continuity. **This is why SI-2 is absolute** |

## 4. Version axes — none added, none altered

| # | Axis | Owner | P03 impact |
|---|---|---|---|
| 1 | `schemaVersion` | P01 | **NONE** |
| 2 | `dataVersion` | Provider | **NONE** — a credential rotation is not a content change |
| 3 | `namespaceVersion` | ADR-01 (⚠ OI-10) | **NONE** |
| 4 | `identityMappingVersion` | **P04** | **NONE** — pass-through preserved |
| 5 | `adapterVersion` | P02 | **NONE** — a credential change is not an adapter change |
| 6 | `providerSchemaVersion` | Provider | **NONE** |

| # | Rule |
|---|---|
| V-1 | **P03 introduces no seventh version axis** |
| V-2 | A credential issue, rotation, expiry or revocation **must not** change any axis, any `snapshotId`, or any historical record (`P03_SECRET_CONFIGURATION_REQUIREMENTS.md` SL-4) |
| V-3 | An authorization-policy change **must not** change any axis. It changes **who may access** data, not **what the data is** |
| V-4 | A tenant-configuration change **must not** change any axis |
| V-5 | Security policy is versioned in its **own governed configuration**, audited separately, and **never** entangled with data identity |

## 5. ADR-02 replay-identity impact — NONE

| # | Rule |
|---|---|
| R-1 | ADR-02's `contributingData` elements are unchanged: `dataSnapshotId`, `provider`, `dataVersion`, `asOf`, `receivedAt`, `mode`, `quality`, `completenessPct`, `lineage` |
| R-2 | **No security element is added** to `contributingData` |
| R-3 | Effective replay identity is **unaffected** by principal, tenant or environment |
| R-4 | ⚠ Necessary consequence: **replay is not an access-control mechanism.** Reproducing an execution must still pass the full G1–G5 gate chain at replay time. Historical authorization does not authorize a present read |
| R-5 | The inherited backward-compatibility requirement stands: an execution with no contributing market-data snapshot reproduces existing certified baselines **byte-identically** |
| R-6 | ⚠ **AD-17 remains UNRESOLVED.** `ReplayService` is untouched; nothing here resolves or reaches it |

## 6. Engine-execution identity — untouched

| # | Rule |
|---|---|
| E-1 | `SNAP_*` engine execution identity is **not modified** |
| E-2 | No security element enters engine inputs, `ExecutionRequest`, `ExecutionResult` or evidence |
| E-3 | The 13 certified engines see **no change whatsoever** |
| E-4 | Scoring, calibration and taxonomy are **untouched** |
| E-5 | AD-1 preserved: the certified `NormalizedHolding.companyId` CSIP join key is untouched, and **security principal identity is never mapped into data identity** |

## 7. Audit records vs lineage — the boundary

| Property | Lineage | Audit record |
|---|---|---|
| Answers | *Where did this datum come from?* | *Who asked for it, and were they allowed?* |
| Lives in | The immutable snapshot | A separate governed store |
| Immutable with the snapshot | **Yes** | Append-only, separate lifecycle |
| Carries principal | **No** | **Yes** |
| Carries tenant | Only via AD-11 classification | **Yes, always** |
| Carries environment | **No** | **Yes** |
| Participates in data identity | **Yes** (provider, version, vintage) | **No** |

| # | Rule |
|---|---|
| B-1 | **These are different records with different lifetimes and must not be merged** |
| B-2 | Writing security context into immutable lineage would make it **effectively unrevocable** — the same reasoning that makes `P03_SECRET_CONFIGURATION_REQUIREMENTS.md` NP-4 absolute |
| B-3 | Lineage must remain reconstructible without the audit store, and audit must remain interpretable without the snapshot |
