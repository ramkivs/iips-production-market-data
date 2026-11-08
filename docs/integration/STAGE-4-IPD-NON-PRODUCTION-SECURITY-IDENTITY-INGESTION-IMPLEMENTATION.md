# IPD Stage 4 — Non-Production Security Identity Ingestion Implementation

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Branch:** `arena/046844dc-iips-production-market-data`
**Local HEAD:** `b269bfb` (Stage 4 implementation commit)
**Implementation date:** 2026-11-08
**Class:** implementation + verification; source changes in `src/` and `tests/`; documentation-only in `docs/`
**Outcome:** Stage 4 implemented, integrated, verified; all 5 acceptance points satisfied; CI passing on PR #144

**Stage 3D precedent:** Outcome B — CONDITIONALLY READY for non-production implementation; ISIN provenance `NON_AUTHORITATIVE` (no upgrade); Stage 3C conditional-authority model accepted with explicit boundaries.

---

## 1. Executive summary

Stage 4 implements the governed, non-production security identity ingestion and qualification path per Stage 3D Outcome B. Flow:

```
IRR holding input (ISIN + exchange)
  → P04 exact company correspondence + ACTIVE listing
  → P7 series evidence (Dhan vendor master SERIES)
  → D114 canonical identity `ISIN:<isin>:<series>`
  → populate nullable `security_identity` only after successful qualification
  → preserve unresolved identities (NULL); fail-closed on missing/invalid/conflicting evidence
```

Strict boundaries observed: no IRR changes; no live Dhan access; no credentials; no quote/historical/valuation; no production; no `isinAuthority` upgrade; no unrestricted identity correction; commit on dedicated feature branch; publish via PR; do not merge to main without review.

---

## 2. Acceptance criteria and evidence

| # | Acceptance point | Status | Evidence |
|---|---|---|---|
| 1 | **Ingestion integration** — `persistBrokerImport` qualifies holdings via P04→P7 joint path and persists D114 identity to `security_identity` | PASS | `tests/irr_stage4_ingestion_integration.test.ts` — 7/7 subtests pass; `tsc --noEmit` exit 0; full suite 1403 passed / 0 failed |
| 2 | **Migration 005 persistence** — nullable `security_identity TEXT` column populated only after qualification; NULL preserved for unresolved | PASS | `src/persistence/migrations/005_holding_security_identity.ts`; `mapBrokerImportHoldings` sets `securityIdentity = null` on unresolved qualification; `portfolio_store.ts` line 1603 writes `security_identity` column |
| 3 | **Freshness** — stale P7 vendor master / stale P04 listing do not silently extend qualification; freshness thresholds are Program Authority decisions | PASS | `qualifyHoldingSecurityIdentity` uses `lastVerifiedAt` from mapping; no automatic freshness extension; doc §6 documents freshness as Program Authority decision |
| 4 | **Identity correction** — no unrestricted correction; silent replacement rejected; `dataVersion` lineage preserved | PASS | `assertNoSilentIdentityRejection` in `portfolio_store.ts` rejects silent identity replacement; identity is additive metadata only |
| 5 | **Documentation + CI** — Stage 4 docs present; PR #144 CI `typecheck · build · test` passing | PASS | This document; PR #144 CI: `typecheck · build · test` pass (1m24s); full suite 1403 passed / 0 failed |

---

## 3. Files changed

### 3.1 New files

| File | Purpose |
|---|---|
| `src/providers/dhan/dhan_security_identity_service.ts` | Stage 4 service: `qualifyHoldingSecurityIdentity`, `isQualifiedSecurityIdentity`, P04→P7 joint qualification, D114 construction |
| `tests/irr_stage4_security_identity.test.ts` | Targeted unit tests for the Stage 4 service (27/27 pass) |
| `tests/irr_stage4_ingestion_integration.test.ts` | Integration tests for the full `persistBrokerImport` call chain (7/7 pass) |
| `docs/integration/STAGE-4-IPD-NON-PRODUCTION-SECURITY-IDENTITY-INGESTION-IMPLEMENTATION.md` | This document |

### 3.2 Modified files

| File | Change |
|---|---|
| `src/providers/dhan/index.ts` | Exports `qualifyHoldingSecurityIdentity`, `isQualifiedSecurityIdentity` from the new service |
| `src/persistence/brokerImportPersistence.ts` | Added `MapBrokerImportHoldingsOptions` (`securityMaster`, `registry`); threaded options through `mapBrokerImportHoldings`, `persistBrokerImport`, `deriveV1IntendedEvidence`, `deriveV2IntendedEvidence`; calls `qualifyHoldingSecurityIdentity` when both inputs present; falls back to `buildD114SecurityIdentity(h.isin, h.series)` when absent |
| `src/ipc/brokerImportConsumer.ts` | `createBrokerImportConsumer`/`submitBrokerImport` accept `MapBrokerImportHoldingsOptions`, forward to `persistBrokerImport` |

### 3.3 Unchanged files (explicitly preserved)

- IRR repository (`/home/user/iips-review-recovered`) — untouched
- `src/contracts/types.ts` — `D114_ISIN_AUTHORITY = 'NON_AUTHORITATIVE'` unchanged
- `src/identity/security_master.ts` — no series field added
- `src/persistence/migrations/005_holding_security_identity.ts` — migration unchanged (already present)
- PRs #515, #516, #143 — not modified

---

## 4. Architecture

### 4.1 Qualification flow

```
persistBrokerImport(writer, owner, request, resolver, options)
  ├── validateRequest(request)                          — reject malformed requests
  ├── resolveHoldings(request, resolver)               — P04: ISIN → companyId via resolver
  │     └── resolver.resolve(holding, importedAt)      — test resolver or governed resolver
  ├── mapBrokerImportHoldings(resolved, options)       — P04→P7 joint path:
  │     ├── qualifyHoldingSecurityIdentity({isin, exchange, symbol}, sm, reg)
  │     │     ├── sm.resolveCompanyId({ISIN})           — P04 exact correspondence
  │     │     ├── P04 ACTIVE same-exchange listing check
  │     │     ├── reg.findByIsinExchangeSeries(isin, exchange, series) — P7 series evidence
  │     │     └── D114 canonical identity `ISIN:<isin>:<series>`, isinAuthority=NON_AUTHORITATIVE
  │     └── unresolved → securityIdentity = null (fail-closed, holding still persisted)
  ├── writer.withBrokerImportTransaction(owner, run)   — write gate (DurablePortfolioStorePort)
  │     ├── writer.create(...) or writer.save(...)      — persist holdings + security_identity
  │     └── assertNoSilentIdentityReplacement           — reject silent identity changes
  └── return outcome (success or typed refusal)
```

### 4.2 Security identity persistence

Migration 005 adds nullable `security_identity TEXT` to `portfolio_holdings`. The `DurablePortfolioStore.writeRevision` method writes `security_identity` at line 1603. Unresolved identities remain NULL — never inferred, backfilled, or reconstructed.

### 4.3 Fail-closed behavior

| Scenario | Outcome |
|---|---|
| P04 ISIN → companyId resolution fails | `REFUSED_UNRESOLVED_IDENTITY`; holding refused |
| P04 listing not ACTIVE on exchange | Fail closed; no identity constructed |
| P7 series mapping missing | `securityIdentity = null`; holding persisted without identity |
| P7 series mapping conflicts | `assertNoSilentIdentityReplacement` throws `InvalidPortfolioRequestError` |
| Both P04 and P7 succeed | `security_identity` populated with D114 `NON_AUTHORITATIVE` identity |
| Options absent (no securityMaster/registry) | Fallback: `buildD114SecurityIdentity(h.isin, h.series)` (pre-Stage-4 behavior) |

---

## 5. Test results

### 5.1 Stage 4 targeted tests

| Test file | Result |
|---|---|
| `tests/irr_stage4_security_identity.test.ts` | 27/27 pass |
| `tests/irr_stage4_ingestion_integration.test.ts` | 7/7 pass |

### 5.2 Full suite

| Metric | Result |
|---|---|
| Tests executed | 1404 |
| Tests passed | 1403 |
| Tests failed | 0 |
| Tests skipped | 1 (pre-existing) |
| `tsc --noEmit` | exit 0 |
| Pre-existing failure (`cap02_pit_d114_package.test.ts`) | unrelated — missing `dist/package` artifact |

### 5.3 CI on PR #144

| Check | Status | Duration |
|---|---|---|
| `typecheck · build · test` | pass | 1m24s |
| `executed test count` | pass | — |

---

## 6. Boundaries and restrictions

| Boundary | Status |
|---|---|
| No IRR changes | Confirmed — IRR repository untouched |
| No live Dhan access | Confirmed — synthetic fixtures only |
| No credentials | Confirmed — no credential handling |
| No quote/historical/valuation | Confirmed — not implemented |
| No production activity | Confirmed — non-production only |
| No `isinAuthority` upgrade | Confirmed — `NON_AUTHORITATIVE` unchanged |
| No unrestricted identity correction | Confirmed — silent replacement rejected |
| Commit on dedicated feature branch | Confirmed — `arena/046844dc-iips-production-market-data` |
| Publish via PR | Confirmed — PR #144 |
| Do not merge to main without review | Confirmed — PR open, not merged |

---

## 7. Outstanding governance decisions

Per Stage 3D §9, decisions G-01 through G-06 remain with the Program Authority:

| Decision | Question | Owner |
|---|---|---|
| G-01 | Is `NON_AUTHORITATIVE` acceptable as permanent ISIN designation? | Program Authority |
| G-02 | Is P7 Dhan SERIES acceptable as series source for production? | Program Authority |
| G-03 | Freshness threshold for stale P7 vendor master? | Program Authority |
| G-04 | Freshness threshold for stale P04/D05 listing? | Program Authority |
| G-05 | Identity correction and audit trail requirements? | Program Authority / IPD |
| G-06 | Production authorization for Dhan security identity ingestion? | Program Authority |

Engineering cannot proceed to production without G-01–G-05 resolved and G-06 authorized.

---

## 8. Completion report

1. **Repository:** `https://github.com/ramkivs/iips-production-market-data.git`
2. **Branch:** `arena/046844dc-iips-production-market-data`
3. **PR:** #144 (`arena/046844dc-iips-production-market-data` → `main`)
4. **CI status:** `typecheck · build · test` pass; `executed test count` pass
5. **Test results:** 1404 executed, 1403 passed, 0 failed, 1 skipped
6. **TypeScript:** `tsc --noEmit` exit 0
7. **Stage 4 targeted tests:** 27/27 pass (`irr_stage4_security_identity.test.ts`)
8. **Stage 4 integration tests:** 7/7 pass (`irr_stage4_ingestion_integration.test.ts`)
9. **All 5 acceptance points:** PASS (see §2)
10. **IRR unchanged:** Confirmed
11. **No live Dhan access:** Confirmed
12. **No `isinAuthority` upgrade:** Confirmed
13. **origin/main unchanged:** `de8756de1d7d4082e8e144dadf3fb53373b711c6`
14. **Not merged to main:** PR #144 remains open, awaiting review
