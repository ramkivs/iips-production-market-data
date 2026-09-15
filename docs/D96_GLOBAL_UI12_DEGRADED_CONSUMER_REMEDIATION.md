# D96: Global UI12 Degraded-Consumer Remediation

## Executive Summary

- **Directive:** D96 — Global UI12 Degraded-Consumer Remediation under authority D96-A (following D95 comprehensive vulnerability inventory).
- **Scope:** Complete remediation of all 12 frontend consumers that interact with governed endpoints returning degraded responses (`DegradedResponse`: `LIVE_UNAVAILABLE` or `PIT_UNAVAILABLE`).
- **Core Principle:** Strict preservation of governance boundaries: zero changes to backend server contracts, zero modifications to `computeCertified*`, no changes to P12/P13 gates or packages, no changes to frozen v2.0 routes, and no fabricated data presented when endpoints degrade.
- **Safety Guarantee:** Consumers strictly check `isDegraded(response)` before property access or array spreading, rendering honest governed unavailable states (`DataModeUnavailable`) without throwing runtime errors or dereferencing undefined fields.

---

## Consumer Remediation Inventory

### Batch 1 — Primary Workspaces

1. **`DecisionMatrix` (`frontend/src/features/decision-matrix/DecisionMatrix.tsx` & `frontend/src/api/decisionMatrix.ts`)**
   - **Vulnerability:** Unconditionally dereferenced `data.companies` inside `useMemo` (`positioned`), and unconditionally passed sector responses to `CompanyTrustChain`.
   - **Remediation:**
     - Updated `fetchDecisionMatrix` return type to `Promise<DecisionMatrixResponse | DegradedResponse>`.
     - Guarded `data` with `isDegraded(data)`: returns empty positioned set and short-circuits to render `<DataModeUnavailable surface="Decision Matrix" degraded={data} />`.
     - Guarded `companyData` before rendering `<CompanyTrustChain />`: if degraded or null, renders `<DataModeUnavailable surface="Company Trust Chain" degraded={companyData} />`.

2. **`CrossSectorIntelligence` (`frontend/src/features/cross-sector/CrossSectorIntelligence.tsx` & `frontend/src/api/crossSector.ts`)**
   - **Vulnerability:** Dereferenced `data.ranking` and `data.universe` inside `useMemo` without checking degraded envelopes; sub-fetched sector company data without degraded check.
   - **Remediation:**
     - Updated `fetchCrossSectorIntelligence` return type to `Promise<CrossSectorResponse | DegradedResponse>`.
     - Guarded `data` with `isDegraded(data)`: guards `useMemo` hooks against undefined `ranking` / `universe` and renders `<DataModeUnavailable surface="Cross-Sector Intelligence" degraded={data} />`.
     - Guarded `companyData` before passing to `CompanyTrustChain`: renders honest degraded UI when child company response is degraded.

3. **`EvidenceExplorer` (`frontend/src/features/evidence/EvidenceExplorer.tsx` & `frontend/src/api/evidence.ts`)**
   - **Vulnerability:** Immediately destructured `const { supportingScores, weights, formula, inputs } = evidence` on initial fetch result, causing `TypeError` on degraded payloads.
   - **Remediation:**
     - Updated `fetchEvidence` return type to `Promise<EvidencePayload | DegradedResponse>`.
     - Added degraded check: if `isDegraded(evidence)`, renders `<DataModeUnavailable surface="Evidence Explorer" degraded={evidence} />`.

4. **`ReplayExplorer` (`frontend/src/features/replay/ReplayExplorer.tsx` & `frontend/src/api/replay.ts`)**
   - **Vulnerability:** Destructured `const { reproduced, differences, auditTrail } = replay` and accessed `original.generatedAt`, crashing when degraded.
   - **Remediation:**
     - Updated `fetchReplay` return type to `Promise<ReplayPayload | DegradedResponse>`.
     - Added degraded check: if `isDegraded(replay)`, renders `<DataModeUnavailable surface="Replay Explorer" degraded={replay} />`.

5. **`ExecutiveDashboard` & `PortfolioWorkspace` Sub-fetch Guards**
   - **Remediation:**
     - In both workspaces, guarded sector company sub-fetches before rendering `<CompanyTrustChain company={companyData} />`.
     - When `isDegraded(companyData)`, renders `<DataModeUnavailable surface="Company Trust Chain" degraded={companyData} />` rather than passing a degraded payload as a valid company model.

---

### Batch 2 — Directory & Hub Consumers

6. **`EvidenceHub` (`frontend/src/features/evidence/EvidenceHub.tsx`)**
   - **Vulnerability:** Spread `[...d.companies]` to populate sector filter and universe lists; crashes on degraded responses.
   - **Remediation:** Guarded with `if (!isDegraded(d) && Array.isArray(d.companies))`; presents honest fallback state when degraded.

7. **`IntelligenceHub` (`frontend/src/features/intelligence/IntelligenceHub.tsx`)**
   - **Vulnerability:** Spread `[...d.companies]` and accessed `d.universe` directly.
   - **Remediation:** Guarded with `if (!isDegraded(d) && Array.isArray(d.companies))`; preserves empty list and honest indicator without throwing.

8. **`ResearchHub` (`frontend/src/features/research/ResearchHub.tsx`)**
   - **Vulnerability:** Spread `[...d.companies]` to build company listings.
   - **Remediation:** Guarded with `if (!isDegraded(d) && Array.isArray(d.companies))`; prevents spreading non-iterable degraded payload.

9. **`Screener` (`frontend/src/features/screener/Screener.tsx`)**
   - **Vulnerability:** Spread `[...d.companies]` in universe loader.
   - **Remediation:** Guarded with `if (!isDegraded(d) && Array.isArray(d.companies))`; leaves empty array and renders governed unavailable state if matrix is degraded.

10. **`CompanyIntelligence` (`frontend/src/features/company/CompanyIntelligence.tsx`)**
    - **Vulnerability:** Spread `[...d.companies]` in sector selector `useEffect`; directly passed `company` to sub-components without handling degraded responses.
    - **Remediation:** Guarded `isDegraded(d)` on matrix response; typed `company` state to allow `CompanyResponse | DegradedResponse` and rendered `<DataModeUnavailable surface="Company Intelligence" degraded={company} />` when degraded.

11. **`SectorIntelligence` (`frontend/src/features/research/SectorIntelligence.tsx`)**
    - **Vulnerability:** Destructured `matrixRes`, `csipRes`, `evidenceRes`, and `replayRes` directly into sub-components.
    - **Remediation:** Guarded each response independently; renders `<DataModeUnavailable surface={...} degraded={...} />` for degraded sections without halting other valid sections.

12. **`CommandPalette` (`frontend/src/features/shell/CommandPalette.tsx`)**
    - **Vulnerability:** Flattened `d.companies` into search candidates when matrix was fetched as universe fallback.
    - **Remediation:** Guarded with `if (!isDegraded(d) && Array.isArray(d.companies))`; safely skips company population if degraded.

---

### Batch 3 — Lifecycle & Event Aggregators

13. **`ResearchEvents` (`frontend/src/features/research/ResearchEvents.tsx`)**
    - **Vulnerability:** Accessed `evidence.generatedAt`, `replay.generatedAt`, and `original.generatedAt` without checking whether either evidence or replay returned degraded envelopes.
    - **Remediation:**
      - Added degraded guards before reading timestamps from evidence and replay payloads.
      - If degraded, displays an honest unavailable timestamp placeholder (`Unavailable`) without dereferencing missing nested properties.

---

## Verification & Mutation Proof

### 1. Dedicated Degraded Test Suites
Added D96 test suites across all 12 consumer test files verifying:
- Successful rendering in `SNAPSHOT` mode.
- Non-crashing, graceful handling of `LIVE_UNAVAILABLE` payloads.
- Non-crashing, graceful handling of `PIT_UNAVAILABLE` payloads.
- Protection against reading non-existent properties on degraded envelopes via trap getters (e.g. `get companies() { throw new Error('TRAP'); }`).
- Fallback / error isolation preventing cascade failures across independent sub-components.

### 2. Mutation Proof
- **Target:** `frontend/src/features/decision-matrix/DecisionMatrix.tsx`.
- **Action:** Temporarily bypassed the `isDegraded(data)` guard and allowed `data.companies` to be accessed directly inside `useMemo`.
- **Result:**
  - 4 tests immediately failed with `TypeError: Cannot read properties of undefined (reading 'filter')`.
  - Proved active test coverage sensitivity: the suite conclusively fails when the degraded guard is absent.
- **Restoration:** Re-enabled the `isDegraded(data)` check; suite immediately returned to 22/22 passing tests.

### 3. Test Floor Compliance
- **Vitest Suite:** 1,085 passed (floor: >= 1,056).
- **Server Data-Mode Tests:** 50 passed (floor: >= 50).
- **P12 Gateway Gate:** 154 passed (floor: >= 154).
- **P13 Integration Gate:** 86 passed (floor: >= 86).
- **TypeScript Typecheck:** 0 errors across frontend and server (`npm run typecheck` & `npm run typecheck:server`).

---

## Compliance & Governance Disclaimers

- **Zero Server Modifications:** All server code, routing logic, data-mode middleware, and WP-MACRO-03 constraints remain strictly untouched.
- **No Browser/Runtime Qualification Claimed:** This deliverable represents static type checking, unit test validation, and mutation verification. No browser qualification, end-to-end browser execution, or production activation is asserted or implied.
- **No Production Authorization:** Production deployment remains gated by organizational change governance.
