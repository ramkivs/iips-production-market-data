# D4 Part K — P12 Contract Delta (G2 Retired)

**SPECIFICATION ONLY — NO IMPLEMENTATION.**
**Authority:** AD-12 **RETIRE G2 TERMINOLOGY**.

> **No "G2" layer is created.** "G2" has **zero occurrences** in the existing IIPS repository.
> P12 is restated against the real, certified analogues: `EngineApiAdapter`,
> `EngineApiRequest`/`EngineApiResponse`, product transports and typed API clients.

---

## K.1 Existing contract surface (the extension base)

| Artifact | Location | Role |
|---|---|---|
| `EngineApiAdapter` | `src/integration/EngineApiAdapter.ts` | Governed engine API; `apiVersion '1.0'`; structured `provenance{}`; `makeCertifiedEngine()` rejects uncertified engines |
| `EngineApiRequest` | same | `{apiVersion, engineId, requestId, inputs}` |
| `EngineApiResponse` | same | `{apiVersion, engineId, requestId, ies, engineVersion, state, verdict?, composite?, snapshotRef?, evidenceRef?, evidenceId?, provenance{…}, reason?}` |
| Product transports | `frontend/server/executive-transport.ts`, `admin-transport.ts`, `engine-transport.ts`, `product-transport.ts` | HTTP surface |
| Typed clients | `frontend/src/api/*.ts` (10) | `executive`, `portfolio`, `company`, `crossSector`, `decisionMatrix`, `engines`, `evidence`, `replay`, `admin`, `aiAdvisory` |
| Existing endpoints | | `/api/executive`, `/api/portfolio`, `/api/cross-sector`, `/api/company/:id`, `/api/decision-matrix`, `/api/engines`, `/api/engines/:id/execute`, `/api/evidence/:id`, `/api/replay/:id`, `/api/ai-advisory/*`, 14 × `/api/admin/*`, `/api/health` |

**Key existing asset — the provenance vocabulary already exists:**

```ts
export interface ExecutiveProvenance {
  readonly dataSource: string;
  readonly freshness: 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY';
  readonly calibratedAt: string;
  readonly transportSemantics: string;
}
```

`freshness` is an **exact match** for NFR-03/NFR-09 needs. The **shape is reusable**; the
**values are currently literals** and must become derived (Part 10).

---

## K.2 Contract delta — additive only

### K.2.1 Data provenance DTO (extends `ExecutiveProvenance`)

| Field | Status | Requirement |
|---|---|---|
| `dataSource` | **REUSE — semantics fixed** | Must become a **derived** governed source descriptor, not a literal. **Never a provider name** (NFR-06) |
| `freshness` | **REUSE** | Derived from `DataSourceMeta.quality` + `asOf`/`receivedAt` |
| `calibratedAt` | **REUSE** | Derived |
| `transportSemantics` | **REUSE** | Derived |
| **`asOf`** | **NEW** | Market-data time |
| **`receivedAt`** | **NEW** | Acquisition time |
| **`dataVersion`** | **NEW** | Vintage identity |
| **`mode`** | **NEW** | `LIVE \| SNAPSHOT \| PIT` — explicit; no silent mixing (SPEC ¶17) |
| **`quality`** | **NEW** | `good \| stale \| partial \| unavailable` |
| **`completenessPct`** | **NEW** | 0–100 |
| **`contributingSnapshotIds`** | **NEW** | Part 7 lineage |
| **`identityMappingVersion`** | **NEW** | Part 6 |
| **`namespaceVersion`** | **NEW** | Part 5 |
| **`classification`** | **NEW** | Per-field provenance class (Part 10): REAL / CERTIFIED-ENGINE / CERTIFIED-PRODUCT / DERIVED / SYNTHESIZED / PRESENTATIONAL |

**Rule:** provider identity is **never** exposed in product DTOs (NFR-06, INT-004 Notes).

### K.2.2 Quality / freshness / completeness propagation

Every data-bearing DTO must carry, at the granularity at which quality can vary
(per-value where values differ in vintage, else per-payload):
`quality`, `completenessPct`, `asOf`, `mode`.

**Prohibited:** dropping quality on aggregation; presenting `partial`/`stale` as `good`;
defaulting absent quality to `good`; aggregating mixed-quality values without declaring the
worst-case (NFR-04).

### K.2.3 Screener contract (AD-9 — certified BEFORE UI)

| Element | Requirement |
|---|---|
| Universe definition | Derived from D05 security master; explicit, versioned |
| Filter model | Deterministic; declared operators; stable ordering |
| Field set | Canonical namespaced market-data + mapped fundamentals |
| Result rows | Per-row `quality`, `completenessPct`, `asOf` |
| Sorting | Deterministic and total (stable tie-break) |
| Saved screens | Re-executable; PIT-capable; reproducible for an as-of |
| Degraded behaviour | Stale/partial rows explicitly marked, **never silently ranked as good** |
| Tenant scoping | Enforced server-side |
| **Gate** | Contract certified **before** UI05 implementation (AD-9) |

### K.2.4 Object-resolution / search contract

| Element | Requirement |
|---|---|
| Resolution input | Canonical security ID, issuer ID, identifier, or symbol |
| Resolution output | Governed product object references (company, research, holding, decision, evidence, alert, report) |
| Identity source | **P04 adapter only** (Part 6) |
| Prohibited | Raw-provider search surface (INT-015 Notes) |
| Time-awareness | PIT resolution as of a stated boundary |
| Tenant scoping | Enforced server-side |
| Consumers | UI13 Global Search, UI14 Command Palette, UI02 |

### K.2.5 Evidence / replay linkage exposure

| Element | Requirement |
|---|---|
| Evidence DTO | Extended with contributing `DataSnapshot` IDs, `provider`* , `dataVersion`, `asOf`, `mode` (*provider governed-internal; exposure decision per NFR-06) |
| Replay DTO | Must disambiguate **data vintage** (Part 7) |
| ⚠ **AD-17** | `ReplayService` returns `reproduced/byteIdentical` as **literals** (M-2). DTOs **must not** present these as verified reproduction. **UNRESOLVED — existing-IIPS authority** |
| Consumers | UI16 EvidenceExplorer, UI17 ReplayExplorer |

### K.2.6 Security / tenant boundaries

| Element | Requirement |
|---|---|
| Tenant scoping | Server-enforced on every data endpoint |
| Classification | `DataGovernanceRuntime` classification respected (AD-11) |
| Entitlement | Provider entitlement enforced **behind** the data plane; never client-side |
| Secrets | Never in DTOs, logs or client bundles (NFR-05) |
| ⚠ **Blocked** | Authentication/session/enforcement **not wired** (G3 §5, M-5); **security/identity authority UNKNOWN** → P03 blocked |

---

## K.3 Endpoint delta (additive)

| Endpoint | Status | Notes |
|---|---|---|
| Existing 20+ endpoints | **PRESERVED** | Extended with provenance/quality fields; no breaking change |
| Screener endpoints | **NEW** | Per K.2.3; contract certified before UI |
| Object-resolution / search endpoints | **NEW** | Per K.2.4 |
| Watchlist endpoints | **NEW** | UI07 |
| Alert endpoints | **NEW** | UI09 |
| Report generation endpoints | **NEW** | UI08; PIT-reproducible |
| Collaboration endpoints | **NEW** | UI10 |
| Market-data admin endpoints | **EXTEND** `/api/admin/*` | Provider config, entitlement, feed health |

**Versioning:** `apiVersion '1.0'` is the existing extension point. Additive fields must not
break existing consumers. Any breaking change requires an explicit version increment and
authority.

---

## K.4 Tracker consequence (AD-12)

| Current | Corrected |
|---|---|
| `P12-02` — "G2 DTO integration" / Deliverable "G2 integration" / Evidence "G2 evidence" | **"Product API / DTO integration"** — deliverable "Product transport + typed client integration", evidence "Product API contract evidence" |

Specified in Part 13. **Not applied to the XLSX in this run.**

---

## K.5 Explicitly NOT created

- No "G2" interface, layer, module, namespace or DTO family.
- No parallel API stack alongside `EngineApiAdapter`.
- No provider-specific endpoints.
- No client-side entitlement or filtering.
