# IIPS: Remaining Product Surface Inventory (Recovery Scope Reset)

This is a bounded inventory of what is left to restore. It uses only the current tree and recovery evidence that has already been established. No new donor archaeology, visual-parity work or implementation was done.

- **Current tree:** `cafa347` (D2 `2a80b56` + D3 forensic report).
- **Governing ref `arena/01a0d1d3`:** at `2a80b56`. The fast-forward to `cafa347` is still pending on the operator side.
- **Main evidence reused:**
  - `IIPS_DONOR_CROSS_VERIFICATION_AND_ACCESS_RESOLUTION_REPORT.md` §8, §12 and §15, which give the historical component blobs and the per-surface minimum recovery units. The donor ref is `origin/m1-ad4-repair`, product `7964fcc`.
  - The current `App.tsx` / `navigation.ts` route bindings.
  - The current dev topology: `vite.config.ts`, with `/api` sent to 8788.

**Key fact for reuse:** the 8788 dev authority already serves `/api/company/:id`, `/api/decision-matrix`, `/api/evidence/:id` and `/api/replay/:id`. The matching browser clients already exist in `frontend/src/api/`: `company.ts`, `decisionMatrix.ts`, `evidence.ts`, `replay.ts`, plus `authFetch.ts` and `dataMode.ts`. `authFetch` is presentation-only: no Keycloak, and the token is optional. The Company/Sector recovery proved that donor components run on this stack without OIDC.

## Inventory

| Surface (route) | Current state | Known working / historical implementation | Missing unit | Blocker | Smallest recovery action | Dependencies |
|---|---|---|---|---|---|---|
| Portfolio (`/portfolio`) | **RESTORED** (BI-08 `PortfolioWorkspace`, certified BI-07) | current lineage governs; donor version superseded | none | none | none | — |
| Security Master (`/security-master`) | **RESTORED** (F-3, D05 governed, in-process) | current lineage only | none | none | none | — |
| Research Company (`/research/company/:id`) | **RESTORED, functional SNAPSHOT** (Prompt 2C; 05D-A/D2 visual) | donor `CompanyIntelligence` `23cb1af6` (recovered) | Windows D3 colour check only; AI advisory is deferred by authority | none (D3 is verification, not implementation) | run Windows D3 | 8788 authority |
| Research Sector (`/research/sector/:id`) | **RESTORED, functional SNAPSHOT** | donor `SectorIntelligence` `4f724d0d` (recovered) | Windows D3 check only | none | run Windows D3 | 8788 authority |
| Executive (`/executive`) | **COMPONENT RESTORED, DATA PATH MISSING IN DEV**. `/api/executive` returns 404 (D3 forensic) | `executive-transport.ts` `createExecutiveServer` (present, never started); donor `ExecutiveDashboard` `5c4637af`; values derivable (donor report §9) | a dev launcher for 8787 + an `/api/executive` proxy rule placed before `/api` | 05A allowed only the Research/Sector topology | **R-1** (D3 forensic §8): launcher + `dev:executive` script + specific proxy rule + tests | none new; server code exists |
| Intelligence: Decision Matrix (`/intelligence/decision-matrix`) | STRUCTURAL (`UnavailableSurface`) | donor `DecisionMatrix.tsx` `c3b6e947` (capture `decision-matrix.png`) | component port only; `/api/decision-matrix` and its client already exist | none technical | port `DecisionMatrix.tsx` plus its absent UI imports (donor report §15 closure); bind the route | 8788 (existing) |
| Research Events (`/research/events/:id`) | STRUCTURAL | donor `ResearchEvents.tsx` `d64f58a1` | component port only; its decisionMatrix, evidence and replay APIs are all already served | none technical | port `ResearchEvents.tsx` + closure; bind the route | 8788 (existing) |
| Evidence hub / detail / replay (`/evidence`, `/evidence/:id`, `/evidence/replay/:id`) | `/evidence` = UI11 mounted without inputs, so it shows unavailable; the children are STRUCTURAL | donor `EvidenceHub` `fa85f2d9`, `EvidenceExplorer` `9f5927ff`, `ReplayExplorer` `1dfc2855` | component ports; `/api/evidence` and `/api/replay` are already served | none technical. The replay provenance is fixture constants that the code itself discloses, so the AD-17 "NOT VERIFIED" semantics must be kept | port the 3 components + closure; bind the 3 routes | 8788 (existing) |
| Screener (`/screener`) | PARTIAL: UI06 is mounted with no candidate universe ("PAYLOAD NOT COMMISSIONED") | donor `Screener.tsx` `915238ac` used the `/api/decision-matrix` universe (capture `screener.png`, 9/9 rows derived) | a universe feed; the data is already served | a payload decision: whether the decision-matrix universe counts as a commissioned UI06 universe | feed UI06 from the existing `/api/decision-matrix` client (preferred: keeps UI06), **or** port donor `Screener.tsx` | 8788 (existing) |
| Research Cross-Sector (`/research/cross-sector`) | STRUCTURAL | donor `CrossSectorIntelligence.tsx` `e811c57d` (capture) + donor `/api/cross-sector` | endpoint + `crossSector` client + component | none technical; the CSIP/`CrossSectorEngine` compute already exists in `src/transports/executive_transport.ts` | add a GET `/api/cross-sector` to a dev authority that reuses the existing CSIP compute; port the client + component | Executive transport compute |
| Watchlists (`/watchlists`) | STRUCTURAL | donor `Watchlists.tsx` `eae01a06` + `watchlists-transport` (universe = decision-matrix); also D81 on `windows/d114-stage5-…` (not in the current lineage) | transport (with persistence) + component | a persistence/mutation decision (write surface) | port the donor transport onto a dev authority + the component | decision-matrix universe; persistence choice |
| Governed Screener (`/screener/governed`) | STRUCTURAL | donor `GovernedScreener.tsx` `048c8d21` + `p12-transport` | transport + component | none technical | port `p12-transport` + component | p12 modules (donor closure) |
| Reports / Collaboration / Settings | STRUCTURAL | D82 (UI08 Reports), D83 (UI10 Collaboration), D80 (UI12 Settings) on `windows/d114-stage5-…`, not in the current lineage | per surface: component + transport (+ persistence) | governing standing of that lineage; persistence decisions | port the D80/D82/D83 units one surface at a time, after a standing decision | persistence |
| Research UI03 (`/research`) / Intelligence UI04 (`/intelligence`) | PARTIAL: mounted without a DTO, so they fail closed | current-lineage builders (UI03 fundamentals, UI04 intelligence) | a governed payload (FundamentalsDTO / IntelligenceDTO) | no commissioned payload source | payload commissioning decision; UI unchanged | payload authority |
| Search (`/search`) | STRUCTURAL | not identified in the established evidence | unknown | no proven implementation located | leave structural unless a donor unit is named | — |
| Executive widgets (Quick Actions, Watchlist Highlights, Alerts, Score Distribution) | absent | p14-r7 / `windows/d114` TARGET-UI composition (`d1481ae2` / `f6cbe39f`); authority acts not found; ruled non-governing (`3b23f27` precedent) | — | governance standing | optional; only after an adoption act | Executive R-1 |
| Administration (8 tabs) | AUTHORIZATION-REQUIRED structural | donor `Administration.tsx` `60c97217` + `admin-transport` | component + transport | **the server `authorizeRead` is fail-closed without an IdP; needs D115 / identity** | none until identity authority exists | D115 / identity |
| Macro (`/research/macro`) | EXCLUDED | donor exists (live MoSPI) | — | **standing exclusion D91/D88 (LIVE-only)** | none | authority relief |
| Replay Studio, Intelligence Opportunities / Risks / Rankings | placeholder / future | **no implementation in any lineage** | whole surface | no implementation exists | new construction only if authorized | — |
| AI Advisory (within Company/Sector) | DEFERRED by authority | donor `/api/company/:id/ai-advisory` path | — | standing deferral | none | authority |

## A. Product restoration completion map

| Group | Surfaces |
|---|---|
| **Restored** (4) | Portfolio, Security Master, Research Company, Research Sector. The last two await only the Windows D3 colour check. |
| **Restorable now, with no new server work** (4 units: port the proven donor component onto existing endpoints and clients) | Decision Matrix; Research Events; Evidence hub/detail/replay; Screener (universe feed). |
| **Restorable with a small dev-topology addition, reusing existing server code** (2) | Executive (R-1); Cross-Sector (`/api/cross-sector` on the existing CSIP compute). |
| **Restorable with a transport port + persistence decision** (5) | Watchlists; Governed Screener; Reports; Collaboration; Settings. |
| **Needs a payload decision, not code** (2) | Research UI03, Intelligence UI04. |
| **Not restorable without external authority** | Administration (identity/D115), Macro (D91/D88), AI Advisory (deferral). |
| **No historical implementation exists** | Replay Studio; Opportunities/Risks/Rankings; Search (none identified). |

Counting only surfaces that have a proven historical implementation: 4 restored, 13 restorable (the 4 + 2 + 5 + 2 units in the rows above), 3 externally blocked.

## B. True blockers

These are the surfaces that literally cannot run without something outside this repository.

1. **Administration:** the donor server guard `authorizeRead` returns 401 without a configured IdP. It needs identity/D115 authority.
2. **Macro:** standing D91/D88 exclusion (LIVE-only data).
3. **Replay Studio, Opportunities, Risks, Rankings:** nothing exists to restore. They are new construction, not recovery.

Everything else is gated only by **scope authorizations**, not by missing technology. Those authorizations are: new dev endpoints/launchers beyond the 05A grant, component ports, the persistence choice, and the payload commissioning decision.

## C. Non-blocking external / production items

These are not needed for any restorable surface above:

- OIDC/Keycloak. `authFetch` already works without a token.
- D115 (except Administration).
- NSE, Dhan and other providers. All restorable surfaces run on frozen certified fixtures and engines.
- Production deployment/authorization; the dev proxy is dev-only.
- AI Advisory, PIT/asOf and LIVE data mode (they stay refused or deferred).
- The Executive p14-r7 widgets.
- Visual parity beyond the pending D3 check.

## D. Recommended execution order

Each step is one small gate: implement, test, commit, then Windows check.

1. **Operator:** fast-forward `arena/01a0d1d3` to `cafa347`, then run the **D3 Windows check** on Company, Sector, Security Master and Portfolio.
2. **Executive R-1:** Executive launcher + proxy rule. Also unblocks the Executive part of D3.
3. **Decision Matrix:** port only; existing endpoint.
4. **Evidence hub / detail / replay:** ports only; existing endpoints; keep AD-17 NOT VERIFIED.
5. **Research Events:** port only; existing endpoints.
6. **Screener:** feed UI06 from `/api/decision-matrix` after a one-line payload decision.
7. **Cross-Sector:** `/api/cross-sector` on the existing CSIP compute + port.
8. **Watchlists, then Governed Screener:** transport ports; decide persistence first.
9. **Reports / Collaboration / Settings:** only after a standing decision on the `windows/d114` D80–D83 lineage.
10. **Payload commissioning for UI03 / UI04:** a decision, not code.

**Not scheduled:** Administration, Macro, AI Advisory, Replay Studio, O/R/R and Search. Each needs external authority or new construction.

Order rationale: steps 2–6 reuse endpoints and server code that already exist, so they have the lowest risk and the most visible restoration. Steps 7–9 add server surface. Step 10 is governance.
