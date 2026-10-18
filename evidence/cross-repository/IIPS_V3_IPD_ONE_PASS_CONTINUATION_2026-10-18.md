# IIPS 3.0 — IPD One-Pass Continuation

**Date:** 2026-10-18 UTC  
**Repository:** `ramkivs/iips-production-market-data`  
**Status:** evidence update and decision-preparation; no authority decision, implementation authorization, qualification, admission, or production authorization is created by this record.

## 1. Verified published baseline

- IPD `main` is `9130c259ee753bad63611b256f67a470f715e37f` (PR #11 merge). The session branch began at the same commit; this pass fetched `origin` and confirmed the remote main SHA independently. PR #10 and #11 are MERGED. Latest IPD CI for the PR #11 merge is run `39129936129`, completed successfully; PR #11 head CI run `39129895633` also completed successfully.
- IRR `main` independently queried as `e9bb64c2e5aa5c888b689f6e40fc5ae3875ccab6`. PR #132 is MERGED. Latest IRR main CI run `39129422038` succeeded; PR #114 remains OPEN. No IRR files or refs were modified.
- The predecessor reconciliation is `evidence/cross-repository/IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md`; it records the detailed source inspection and test evidence. This continuation does not repeat that discovery or claim to rerun the tests reported there.

## 2. CV-20 — ownership authority request (still blocked)

**Verified/current disposition:** no qualifying non-authentication single-user ownership source has been designated in the inspected current records. The IRR `/api/user-portfolios*` owner-context-unavailable 503 fence remains required. IPD `main` remains `SESSION_ONLY` / `durable:false`. G-2's accepted IPD-owned durable portfolio architecture is preserved. The off-main G24 durable implementation and Gate B `WRITE_NOT_AUTHORIZED` path are not an admitted durable write capability.

**Exact decision requested from Program Authority:** select one of (a) designate a qualifying non-authentication owner source for the single-user application and define its trusted origin, lifecycle, reset/revocation semantics, failure behavior, and boundary; (b) explicitly decline to designate one; or (c) explicitly defer, retaining fail-closed behavior. No authentication/OIDC substitute or inferred owner is proposed. A designation alone does not authorize implementation, qualification, admission, or production use.

**Dependent sequence:** after a designation only, establish the versioned IPD→IRR consumer contract and separate implementation authority before dependent code. Preserve restart-durability requirements (including CV-24/CV-38) and later admission gates (including CV-52); keep the 503 until all required prerequisites and separate acts are satisfied.

## 3. CV-22 — D05 identity evidence and bounded probe preparation

The predecessor record reports a deposited D05 corpus of 2,250 records/unique `companyId`s; source-reported composition is 52 real Indian equities and 2,198 synthetic broad-universe entities. Its inspected record structure has no machine-readable real/synthetic discriminator. These counts/composition are source-reported and corpus-shape observations, not independently verified exchange/entitlement facts. IRR's 13 reference rows are sector references, with sector names used as `canonicalSecurityId`; they are not a 13-instrument security-master roster. IPD `companyId` (e.g. `EQ_RELIANCE_IN`) is not IRR PIT `securityId` (`ISIN:<isin>:<series>`). Neither can be derived from the other by name or sector. Commercial NSE entitlement/licensing remains unestablished.

**Probe readiness:** specification prepared, not executed and not approved for real-market acceptance. Before any probe, authority must approve the real/synthetic eligibility source and consumer identity contract, and an exact candidate's evidence pack must bind: (1) immutable D05 corpus revision/hash and exact companyId; (2) authoritative exchange/issuer instrument evidence for exact ISIN, series, symbol and effective date; (3) IRR PIT identifier and sector reference kept as distinct namespaces; and (4) applicable vendor/exchange entitlement and permitted use. Source-reported labels alone do not qualify an instrument.

**Narrow acceptance-probe procedure (proposal):** use one authority-approved, non-synthetic D05 row only; resolve by exact approved identity fields and effective date, with no fuzzy/company-name/sector fallback; traverse the composed consumer path from D05 identity resolution through the IRR consumer request to the pinned IPD PIT read contract; assert byte-for-byte preservation of the approved series-qualified PIT identifier, domain and `asOf`, and provenance of the returned source. Include negative cases: synthetic candidate presented as real is rejected; absent/unrepresented identity returns the existing not-governed 404/refusal; ambiguous or conflicting mappings fail closed; expired/not-effective identity is rejected; PIT miss remains typed and is never substituted. Record corpus hash, evidence references, request/response, test code/revision and outcome. This procedure is not executable authority and is not a pass claim.

## 4. CV-32 — PIT contract and consumer disposition

The predecessor record identifies IPD's `PointInTimeStore` / `PitReadService` public `./pit` package at the exact IPD commit pinned by IRR (`2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`), with requests requiring series-qualified `securityId`, domain and `asOf`, explicit misses and no substitution. IRR owns its adapter, HTTP API and client; IPD owns store/read semantics and package boundary. Existing IRR tests are consumer/API evidence, not mounted UI acceptance. No actual cross-repository incompatibility is demonstrated in the evidence reviewed; no cross-layer UI acceptance is established.

**Decision remains with Program Authority/product owner:** (a) bounded mounted panel, naming the company-view screen, fields, identity/freshness presentation, and requiring a mounted client→route→IPD contract test with typed misses; or (b) explicit API-only disposition, retaining API/runtime evidence without implying UI readiness. This record makes neither choice and adds no endpoint or UI code.

## 5. Other work and authoritative tracker reconciliation

Remote PR/run verification above confirms PR #10/#11 and PR #132 claims. Detailed prior evidence remains at the predecessor reconciliation and the IPD capability inventory `evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md`. No new implementation was safe to begin: portfolio code is CV-20 dependent; consumer identity and UI disposition are authority-bound; the source material supplied in this pass does not establish another independent ready implementation item. No tracker closure, mapping, or accepted decision has been invented. The repository's workbook `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx` is the existing program tracker; this continuation is an evidence record, not a replacement tracker. The precise CV-36 inconsistency was not reproducible from the accessible authoritative evidence in this checkout, so it remains an unverified reported issue rather than a corrected tracker fact.

No product code or tests were changed or rerun. No Windows/browser/host qualification, mounted UI acceptance, identity probe, cross-repository integration acceptance, admission or production acceptance is claimed.

## 6. Next actions / blockers

1. Program Authority: issue the explicit CV-20 designate/decline/defer disposition with owner-source semantics; until then portfolio implementation remains blocked and IRR stays 503.
2. Program Authority/product owner: CV-22 real/synthetic eligibility and exact identity decision; independently provide authoritative instrument and entitlement evidence before the proposed probe can run.
3. Program Authority/product owner: CV-32 bounded panel versus API-only decision; any UI work remains IRR-owned.
4. After CV-20, establish the versioned consumer contract and implementation act; then satisfy restart durability, qualification and admission gates separately.

**Result:** this pass independently verified remote baseline and CI, preserves all existing fences, and publishes precise decision/probe preparation. Pending authority decisions are not manufactured into closures; no additional authorized implementation was identified from current evidence.
