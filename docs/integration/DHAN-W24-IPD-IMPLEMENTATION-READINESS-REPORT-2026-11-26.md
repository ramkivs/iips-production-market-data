# W-24 — IPD Implementation Readiness Report (Sequence 7)

**Document ID:** `DHAN-W24-IPD-READINESS-2026-11-26`
**Date:** 2026-11-26
**Type:** Evidence-backed readiness assessment and implementation design. No source, configuration, test, credential or live Dhan call was modified to produce this report. No implementation is authorized by this document.
**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Baseline inspected:** `main` `eebaa3d3ed20d87826065d95dd410751a06c8eca` (merge PR #202, handoff `a6e75827`), investigation baseline `85ac12736cb9e2f21f639ca121d289d49ca2ba3c` (reproduced unchanged for W-24-relevant files)
**Related repository:** `ramkivs/iips-review-recovered` (IRR) `main` `e631cabc0eba32a5e85fc54b5c43ef07ac30b4f6`
**Work item:** W-24 — Traceable diagnostics across IRR → IPD → Dhan (`DHAN-LIVE-ROADMAP-2026-11-11` v1.1, §6 Track 2, §10.3 M4)
**Governing decision:** D-7 — Provider State Model, Verify-Connection Semantics and Diagnostics Disclosure Policy (`docs/integration/DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md`, adopted 2026-11-12, amended 2026-11-20, PR #186)
**Status:** **IPD READY — NOT AUTHORIZED.** Design is complete and ready for review; implementation remains pending explicit owner authorisation and IRR acceptance of the D-7 amendment.

---

## 1. Governing authority

### 1.1 D-7 approval and applicable requirements

| Fact | Evidence |
|---|---|
| **Adopted for IPD** | `DHAN-D7-…-2026-11-12.md` header: *ADOPTED FOR IPD (governance decision, recorded 2026-11-12). IRR-side acceptance is outstanding.* Authority: Program Authority under roadmap v1.1 §5 (owner IPD+IRR, recorded in IPD half). |
| **Reviewed head** | `126db279438da197435ac98d96978085800d9572` (D-7 header). |
| **Amended 2026-11-20** | §4.5–§4.10 (six owner decisions) recorded at IRR `001848e9c81a4049cc1f6ea2664250ba6351c610` (merge PR #611) and mirrored in IPD D-7 §§4.5–4.10 via PR #186. The amendment adds structured events, closed failure enum, in-memory rings, permitted correlation surfaces, `§4.2.1` sole identifier exception, and `§4.10` substring clarification. It explicitly does **not** replace §4.1–§4.4, does **not** change M4 criteria, and does **not** authorize implementation (D-7 §4.5, §11). |
| **Two clarifications 2026-11-21** | IRR `06a2b0db30e662a9fc77423ed1b6f3569fcd224d` (merge PR #612): (1) IRR response action reference is server-side only, never delivered to browser; (2) authenticated IRR↔IPD loopback transport is an approved surface with wire names `X-IIPS-Trace-Version` / `X-IIPS-Action-Id`. Recorded in IPD D-7 §4.2.1 (4) and §4.9. |
| **M4 interpretation resolved 2026-11-21** | Same commit `001848e9…` §10.3: *same IRR-generated `actionId` must reach IPD and be associated with IPD's local Dhan egress-attempt record. No trace header sent to Dhan; vendor-side correlation not required.* Recorded in IPD D-7 §12 U-4 as resolved (interpretation only, not acceptance) and in IRR roadmap §10.3. |

**Applicable normative requirements for W-24 (D-7):**

- **§2 Provider state model:** 8 states (`UNCONFIGURED`…`UNAVAILABLE`), transitions T1–T9, fail-closed rule (§2.3). Every diagnostic status must report observed evidence, never inference.
- **§3 Verify-connection semantics:** V1 (local readiness, no network) vs V2 (exactly one authenticated vendor request, no retry, no credential re-read). Outcomes enumerated; not applicable to W-24 beyond reuse of single-probe discipline.
- **§4 Diagnostics disclosure policy:** MAY list (§4.1) is exhaustive for `/v1/diagnostics`, `ServiceHealth`, startup line, logs, error responses. MUST NOT list (§4.2) prohibits secrets, tokens, `vault://`, carrier paths, metadata, child output, ciphertext, exception messages, credential material — **no surface, no form**. Any new field requires amendment.
- **§4.2.1 Sole exception:** Validated W-24 correlation identifiers permitted **exclusively** on 4 surfaces and no others: (1) allowlisted W-24 structured diagnostic events + authenticated operator readers, (2) D01 `traceId`/`correlationId` per §4.6 rule 2, (3) IRR response action reference server-side only, (4) validated `X-IIPS-Trace-Version`/`X-IIPS-Action-Id` headers on authenticated IRR↔IPD loopback transport only. Every other surface remains prohibited; transport headers never logged or serialized into events; no identifier sent to Dhan.
- **§4.6 Structured diagnostic events:** Exactly 12 fields (`schemaVersion`, `timestampUtc`, `component`, `operation`, `event`, `actionId`, `workId`, `attemptId`, `outcome`, `failureCategory`, `durationMs`, `sequence`). Closed enums for `component`/`operation`/`event`/`outcome`; three opaque lowercase UUIDv4 identifiers, cryptographically generated, never derived from payloads; D01 `traceId`/`correlationId` distinct roles (may share value); no retroactive provenance; 1 KiB size ceiling.
- **§4.7 Closed failure enumeration:** Exactly 13 values (`VALIDATION_ERROR`…`INTERNAL_ERROR`), unknown → `INTERNAL_ERROR`, no message pass-through.
- **§4.8 In-memory rings:** IRR 512, IPD 1,024 events, process-lifetime memory only, no disk/external sink, oldest-event eviction, never grow/spill/block.
- **§4.9 Permitted correlation surfaces and operator-reader safeguards:** 4 surfaces (same as §4.2.1), binding prohibitions (no secret/token/path/URL/payload/DTO/business identifier/hash/exception/child text; no trace to Dhan; §4.3 surfaces unchanged; browser never), reader safeguards (reuse existing bearer, constant-time verify, loopback-only, read-only, never browser, no unauthenticated fallback, fail closed when bearer unavailable).
- **§4.10 Substring clarification:** Coincidental UUID substring overlap with secret is not intentional disclosure where independently generated and no secret inspected (§4.10 rules 1–2); never inspect secret to generate/validate identifier (§4.10 rule 3: no credential resolution solely for tracing); intentional disclosure remains prohibited (rule 4); canary tests retained (rule 5); trusted generation vs untrusted input (rule 6: cryptographic facility vs validated-then-untrusted).
- **§5 Security and fail-closed:** W-02 non-exposure preserved, enumerated codes only, non-locating readiness, fail-closed defaults, separate axes, no vendor call from read-only surface.
- **§11 Decision vs implementation authorization:** *This record is a governance decision. It authorizes no implementation.* W-24 remains open.

### 1.2 W-24 acceptance criteria (authoritative)

From IRR roadmap v1.1 `DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` §6 Track 2 (blob `1e26ff5…`, re-verified via `gh api` at `56b38093`), supplemented by investigation `DHAN-LIVE-INVESTIGATION-2026-11-25.md` §3 row 30:

| Source | Criterion |
|---|---|
| **Roadmap W-24 scope** | *A request/correlation id created in IRR's server boundary, propagated on the transport call, carried into the daemon's log line and the canonical envelope's provenance, and written to a bounded local log ring (no external sink). Deliberately excludes any credential, vendor DTO and any path per D-7.* |
| **Roadmap W-24 verification** | *Targeted: one id appears in the IRR log, the daemon log and the response provenance; log lines contain no secret and no `vault://` string (assertion); ring is bounded.* |
| **Roadmap W-24 exit criteria** | *A failed screen action can be traced end-to-end from local logs.* |
| **Investigation W-24 synthesis** | *Design and policy approved; implementation not authorised — three opaque lowercase-UUIDv4 identifiers, allowlisted event fields, §4.2.1 sole exception, §4.10 substring clarification, ring capacities 512 IRR / 1,024 IPD. M4 Dhan-leg: `actionId` must reach IPD and be associated with IPD's local egress-attempt record — not vendor acknowledgement; no header sent to Dhan.* |
| **M4 trace criterion** | *One trace id spans IRR → IPD → Dhan* interpreted (owner-approved 2026-11-21, IPD D-7 §12 U-4, IRR roadmap §10.3): same `actionId` reaches IPD and links to IPD's local Dhan transport-attempt record with categorized outcome; no header to Dhan; does not prove Dhan receipt. |
| **Prior owner proposal §5** | *Six owner decisions recorded 2026-11-21 (see §1.1) — architecture, failure enum, M4 interpretation, D-7 field/surface amendment, substring clarification, transport-header names.* |

**Additional implied criteria from D-7 §4.6–§4.10 (binding on implementation):**

- All 12 event fields conform to closed enums; identifiers lowercase UUIDv4, cryptographically generated; D01 `traceId`/`correlationId` distinct semantic roles; no retroactive/cached provenance mutation; 1 KiB ceiling.
- Failure category drawn from 13-value closed set; unknown → `INTERNAL_ERROR`; no raw message.
- Rings exactly 512 (IRR) / 1,024 (IPD), oldest-eviction, memory-only, never persisted.
- Correlation only on 4 permitted surfaces; no secret/path/payload leakage; reader safeguards met; never browser, never Dhan.
- Substring coincidental overlap not a breach where independently generated; never inspect secret for tracing; canary tests pass.

### 1.3 Current IPD implementation-authority disposition

| Dimension | Status | Evidence |
|---|---|---|
| **Governance** | **NOT AUTHORIZED** | D-7 §11: *This record is a governance decision… It authorizes no implementation.* D-7 §12 standing status: *W-24 is open; this IPD amendment is awaiting IRR acceptance (U-3); M4 acceptance is not established (U-4); and W-24 implementation is not authorized.* Investigation `85ac127` → `eebaa3d` row 30: *Design and policy approved; implementation not authorised… IPD states explicitly: “W-24 remains open … implementation is not authorized”.* |
| **Roadmap sequencing** | **IPD first; IRR second.** Recommended sequence `D-5 follow-up → D-7 follow-up → W-24 IPD → W-24 IRR` (investigation §6 seq 7–8, §4 row 5, §5 BLK-6). W-24 IPD is ready *after* D-7 follow-up. |
| **This report** | **Readiness, not completion.** Per work-item objective §5: *Report W-24 IPD readiness separately from implementation completion. Implementation remains pending until explicit owner authorisation is recorded.* No code change accompanies this report. |

### 1.4 Dependencies and evidence required before implementation can be authorised

| # | What must happen | Who | Evidence that closes it | Blocks |
|---|---|---|---|---|
| 1 | **IRR acceptance of D-7 amendment (U-3)** — all of §4.5–§4.10 plus `§4.2.1` exception and `§4.10` clarification, including wire names `X-IIPS-Trace-Version`/`X-IIPS-Action-Id` | IRR (roadmap owner) | IRR record on `main` at a named SHA referencing `DHAN-D7-…-2026-11-12.md` `@ 1e26ff5…` §4.5–§4.10 / commits `001848e9…` + `06a2b0db…`; `gh api contents` fetchable | W-24 implementation (governance gate) |
| 2 | **Explicit owner authorisation to implement W-24 (IPD half)** | Program Authority / Principal | Short authorization note naming: IPD branch, contract version, PR # and head SHA to merge, reviewer, scope (IPD only) | W-24 build |
| 3 | **Prerequisites W-08, W-09 verified on current `main`** | IPD | `dhan_provider_state_recorder.ts` + `dhan_market_data_service.ts` `verifyConnection` + `dhan_market_data_http.ts` `/v1/connection/verify` + `/v1/diagnostics` green (investigation §3 rows 15–17: COMPLETE, PRs #168–#172, #169/#172) — already met | W-24 build |
| 4 | **D-1/D-2/W-01/W-02 backend selection unchanged** | IPD | `dhan_local_daemon.ts` `parseDhanVaultBackendSelector` allow-list `disabled`/`windows-dpapi`, `DHAN_VAULT_BACKEND_ENV` — already met | Startup provenance |

No live Dhan call, credential provisioning, or Windows host evidence is required for readiness or for the synthetic verification gates below. Live evidence is required only for M4/M6 acceptance, not for W-24 authorization.

---

## 2. IPD architecture — existing implementation and integration points

Inspected at `eebaa3d` (reproduced at `85ac127` for W-24-relevant files; delta `85ac127..eebaa3d` touches only `calendars/`, `docs/IPD-P5-FRESHNESS-HTTP.md`, `D-5` follow-up, `W06` investigation, `W23`/`W25` contracts — no W-24-relevant source change).

### 2.1 Current Dhan provider architecture (W-24-relevant)

```
┌─────────────────────────────────────────────────────────────────────┐
│  IPD provider boundary  src/providers/dhan/**                        │
│                                                                     │
│  DhanMarketDataService (dhan_market_data_service.ts, 1,775 lines)    │
│    ├── DhanMarketDataSource (dhan_market_data_source.ts, 217)       │
│    │     └── DhanApiClient (dhan_api_client.ts, 998)                │
│    │           ├── DhanCredentialSessionHolder (credential lifecycle)│
│    │           ├── DhanApiClient.fetchMarketQuotes() → egress       │
│    │           └── PreAccessNoNetworkTransport / DhanServerHttps    │
│    ├── DhanHistoricalAdapter (dhan_historical_adapter.ts, 290)       │
│    ├── DhanInstrumentRegistry (dhan_instrument_map.ts, 408)         │
│    ├── DhanBoundedCache / DhanHistoricalCache / RateLimiter /       │
│    │    ConcurrencyLimiter / Coalescer / RefreshOrchestrator        │
│    │    (dhan_operational_controls.ts, 572)                         │
│    ├── DhanProviderStateRecorder (dhan_provider_state_recorder.ts)  │
│    │    (W-08 observed state: lastSuccessAt, lastFailure, auth etc.)│
│    └── DhanStateStore (dhan_state_store.ts — W-23 persistence)     │
│                                                                     │
│  Daemon: startMarketDataDaemon (dhan_local_daemon.ts, 842)          │
│    ├── parseDhanVaultBackendSelector, resolveStateStore,            │
│    ├── createMarketDataHttpServer (dhan_market_data_http.ts, 1189) │
│    └── shutdown → persistRetainedState                               │
│                                                                     │
│  HTTP Transport (dhan_market_data_http.ts):                         │
│    POST /v1/quotes, POST /v1/historical, GET health/diagnostics/    │
│    freshness, POST /v1/connection/verify, POST /v1/instruments/**   │
│    Auth: Authorization: Bearer <IIPS_MARKET_DATA_TRANSPORT_TOKEN>   │
│    All routes authenticated, loopback-only, 16 KiB, 10s timeout.     │
│                                                                     │
│  Client: MarketDataTransportClient (same file) — all methods use     │
│    requestJson() with preflightCheck() (production refusal,          │
│    loopback, token validation) + 401/429/5xx handling.              │
│                                                                     │
│  Contracts: CanonicalEnvelope<T> (envelope.ts) + DataProvenanceDTO   │
│    (provenance.ts) with optional traceId/correlationId               │
│  Quote envelope built in normalizeDhanQuoteToCanonical()             │
│    (dhan_normalizer.ts) → D01 2.0.0 payload + provenance             │
└─────────────────────────────────────────────────────────────────────┘
```

**What exists today for W-24:**

- **Provenance fields present but unused for tracing:** `DataProvenanceDTO.traceId?` and `correlationId?` are optional strings (`src/contracts/provenance.ts:20–21`), carried in `CanonicalEnvelope<D01>.provenance` and preserved by `sanitizeProvenanceForConsumer`. No W-24 code populates them; `dhan_normalizer.ts` `normalizeDhanQuoteToCanonical` builds provenance without trace context. `traceId` appears only in contract definitions and in D-7 documentation (verified: `grep -rn actionId/X-IIPS src --include=*.ts` → zero in `src/providers/dhan`).
- **No ring, no diagnostic events:** No `DhanDiagnosticRing`, `DhanDiagnosticEvent`, `actionId`/`workId`/`attemptId` type exists in `src/providers/dhan`. `grep -rn ring src` → zero in provider boundary.
- **Observed state recorder is not a W-24 ring:** `DhanProviderStateRecorder` records bounded `lastSuccessAt`/`lastFailure`/`lastAuthOutcome`/`lastLatencyMs` + `consecutiveAuthFailures`/`authLatched` (W-08/D-2/D-7 §2). It is constant-space, not a ring; it records provider connectivity, not trace correlation. W-24 must not reuse it as a ring.
- **HTTP transport is ready for header propagation:** `dhan_market_data_http.ts` `createMarketDataHttpServer` already authenticates every route via `Authorization: Bearer <token>` (constant-time `timingSafeEqual`), validates `MARKET_DATA_TRANSPORT_TOKEN_ENV` at startup and per-request, and enforces `isLoopbackTransportHost` on both `listen` and request handling. This is the bearer and binding pattern W-24 readers will reuse (§4.9 safeguards 1–3). No trace header is parsed today.
- **Diagnostics contract is versioned and fail-closed:** `ServiceDiagnostics` at `DHAN_DIAGNOSTICS_CONTRACT_VERSION = 3` (W-23) with `validateDhanServiceDiagnostics` rejecting every earlier version and every unwhitelisted field. `ServiceHealth` at `DHAN_HEALTH_CONTRACT_VERSION = 2`. Both are additive but required — new fields move the version (precedent: W-25 → 2, W-23 → 3). W-24 will publish a **separate** ring reader (new route/version), not add identifiers to existing `ServiceDiagnostics` (§4.2.1 rule: §4.3 surfaces gain nothing).

### 2.2 Integration points for W-24

| Integration point | Current file | Exact location / contract | W-24 change |
|---|---|---|---|
| **Daemon-side trace/action provenance** | `dhan_market_data_service.ts` `DhanMarketDataService.getQuote()` (~L620–705) and `getHistorical()` (~L760–860) | Both build `DhanSecurityScope` → `orchestrator.refresh([scope])` → `source.fetchSnapshot` → `normalizeDhanQuoteToCanonical` → cached envelope. Provenance built in normalizer from `receivedAt`/`evaluatedAt`, not from trace context. | Inject `TraceContext { actionId, version }` into `getQuote`/`getHistorical` params; create `workId` on cache-miss shared refresh, link each coalesced `actionId` to it; create `attemptId` on each actual `client.fetchMarketQuotes` handoff; populate `traceId`/`correlationId` per §4.6 rule 2; record §4.6 events. |
| **Client-side propagation and correlation** | `dhan_market_data_http.ts` `MarketDataTransportClient` (`getQuote`, `getHistorical`, `getFreshness`, `verifyConnection`, `health`, `diagnostics`) — all through `requestJson(method, path, body)` | `preflightCheck()` already enforces production refusal, loopback, token. No trace header sent. Server `createMarketDataHttpServer` routes `quotes`/`historical`/`verifyConnection` read body and call `service.getQuote`/`getHistorical`/`verifyConnection`. | Client: generate `actionId` (crypto.randomUUID), send `X-IIPS-Trace-Version: 1` + `X-IIPS-Action-Id: <uuid>` on loopback transport (authenticated, loopback-only). Server: validate header before use (lowercase UUIDv4 syntax, version 1), reject missing/invalid without echoing, fail closed on mismatch, never log header, never retry mismatch (D-7 §4.2.1 (4), §4.10 rule 6). |
| **Server-side preservation of approved trace/action references** | `dhan_market_data_service.ts` envelope provenance + `dhan_historical_provenance.ts` | `DataProvenanceDTO` optional `traceId`/`correlationId` carried to consumer via `CanonicalEnvelope`. Historical provenance explicitly excludes `traceId` today (`DhanHistoricalProvenance` has `observationScope` + 4 timestamps + `revision` + `servedFromCache`, no trace). | D01: populate `traceId` = current `actionId`, `correlationId` = original producer `actionId` per §4.6 rule 2 (cache miss → same value; cache hit → current vs original; coalesced → each requester retains own `traceId`, shared `correlationId`). Return immutable per-request envelope copy (provenance shallow-copy with trace fields injected). Historical: **no invented D02 provenance** — historical result gains no `traceId` (W-24 D-7 §4.6 rule 3, D-4.3). |
| **Ring retention and retrieval of relevant provenance** | *(new)* `src/providers/dhan/dhan_diagnostic_ring.ts` + daemon + service wiring | No ring exists. W-23 `dhan_state_store.ts` persists quote cache; W-08 recorder is fixed-size state, not a ring. | New bounded in-memory ring (IPD 1,024, IRR 512) storing exactly the §4.6 event shape, `sequence` monotonically increasing, `durationMs` non-negative, `failureCategory` from 13-value enum, 1 KiB serialized ceiling (truncate by dropping optional numerics or drop event, never trim prohibited value). Ring lives for process lifetime, never persisted, never external sink, oldest eviction, never grows/spills/blocks. |
| **Existing envelopes and diagnostics contracts** | `src/contracts/envelope.ts` + `provenance.ts` + `dhan_market_data_service.ts` `ServiceHealth`/`ServiceDiagnostics` | `CanonicalEnvelope<T>` + `DataProvenanceDTO` + `ServiceDiagnostics@3` (`validateDhanServiceDiagnostics` rejects any extra field, any earlier version). | **Do not widen `ServiceDiagnostics` or `ServiceHealth`.** W-24 introduces a new read-only operator route `GET /v1/trace/ring` (or `GET /v1/diagnostics/trace`) with its own contract version, reusing the existing transport bearer (`IIPS_MARKET_DATA_TRANSPORT_TOKEN`) and loopback binding (D-7 §4.9 safeguards). D01 provenance change is the only envelope-level addition, via the existing optional fields. |
| **Relevant tests, guards, security boundaries** | `tests/dhan_d7_state_and_disclosure_conformance.test.ts`, `tests/dhan_p4_operational_controls.test.ts`, `tests/dhan_p5_service_transport.test.ts`, `tests/d5_bid_ask_representation.test.ts`, `tests/dhan_w19…`, `tests/w22…`, `tests/dhan_w25…`, `tests/dhan_w23…` + `dhan_api_client` egress guard + `dhan_local_daemon` loopback/bearer/DPAPI guards | W-02 guarantees: stdin-only, stdout-only, stderr byte-count, no secret in argv/temp/log, envelope versioned. D-7 §4.1 MAY exhaustive, §4.2 MUST NOT absolute, §5 fail-closed. | Add W-24 synthetic suites (see §3.8): identifier generation/validation, ring bounded/eviction/sequence, transport header validation/fail-closed, D01 provenance correctness (new/coalesced/cache-hit), disclosure canaries (no secret/`vault://`/path/payload/DTO/business-id/hash/exception/child-text/URL/header in ring/event/headers), latch/unknown-ring, browser exclusion. Retain existing canary tests (`dhan_d7_state_and_disclosure…`); new tests must not be rewritten to assert universal substring absence (§4.10 rule 2). |

---

## 3. IPD implementation contract

### 3.1 Data structures and fields

#### 3.1.1 Trace context (wire + in-process)

| Field | Type | Where | Notes |
|---|---|---|---|
| `traceVersion` | `1` | `X-IIPS-Trace-Version` header | Single version today. Version mismatch fails closed (§4.9). |
| `actionId` | `string` lowercase UUIDv4 | `X-IIPS-Action-Id` header; event `actionId`; D01 `traceId` | IRR-generated per screen action; IPD reuses verbatim (never regenerates). Opaque, cryptographically generated when minted in IRR. |
| `workId` | `string` lowercase UUIDv4 | Event `workId` | IPD-generated per **new shared quote refresh** (one `orchestrator.refresh` execution). All coalesced `actionId`s link to same `workId`. |
| `attemptId` | `string` lowercase UUIDv4 | Event `attemptId`; egress-attempt association | IPD-generated per **actual handoff to Dhan transport** (`DhanApiClient.fetchMarketQuotes` invocation). Proves local egress attempt, not Dhan receipt (§4.10). D01 provenance does **not** carry `attemptId`; ring does. |
| `component` | `'IRR' \| 'IPD'` | Event | IPD events are `IPD`; IRR reader will emit `IRR` (separate implementation). |
| `operation` | `'QUOTE' \| 'HISTORY' \| 'FRESHNESS'` | Event | `QUOTE` for `getQuote`, `HISTORY` for `getHistorical`, `FRESHNESS` for `getFreshness` supplementary read. |
| `event` | 11-value enum | Event | `ACTION_START`, `ACTION_END`, `REQUEST_ADMITTED`, `REQUEST_END`, `CACHE_HIT`, `WORK_START`, `WORK_JOIN`, `ATTEMPT_START`, `ATTEMPT_END`, `TIMEOUT`, `LATE_COMPLETION` (§4.6). |
| `outcome` | `'SUCCESS' \| 'FAILURE' \| 'TIMEOUT' \| 'NOT_ATTEMPTED' \| 'UNKNOWN'` | Event | Closed. |
| `failureCategory` | 13-value enum | Event §4.7 | `VALIDATION_ERROR`, `AUTHENTICATION_FAILED`, `AUTHORIZATION_FAILED`, `CONFIGURATION_ERROR`, `READINESS_FAILED`, `IDENTITY_REJECTED`, `RATE_LIMITED`, `CACHE_ERROR`, `TRANSPORT_ERROR`, `PROVIDER_ERROR`, `TIMEOUT`, `CONTRACT_MISMATCH`, `INTERNAL_ERROR`. Unknown → `INTERNAL_ERROR`. |
| `durationMs` | `number` non-negative | Event | Per-event wall-clock contribution, milliseconds. |
| `sequence` | `number` monotonically increasing within ring | Event | Global ring sequence; exposed as eviction/reset indicator. |
| `schemaVersion` | `1` | Event | Event-schema version. |
| `timestampUtc` | `string` ISO-8601 UTC | Event | Strict UTC. |

**New files:**

- `src/providers/dhan/dhan_trace.ts` (or `dhan_trace_context.ts`) — `TraceContext` type, `TRACE_VERSION = 1`, `TRACE_HEADER_VERSION = 'X-IIPS-Trace-Version'`, `TRACE_HEADER_ACTION = 'X-IIPS-Action-Id'`, `isLowercaseUuidV4`, `generateTraceId` (via `node:crypto.randomUUID`), `validateTraceHeaders`, `parseTraceHeaders`. Never reads credential material; never logs input.
- `src/providers/dhan/dhan_diagnostic_ring.ts` — `DhanDiagnosticEvent` (exactly the 12 fields, `readonly`, no index signature, no passthrough), `DhanDiagnosticRing` class (capacity, circular buffer, sequence counter, `record(eventWithoutSequence)`, `list(limit?, sinceSequence?)`, `clearForTestOnly` never exposed outside tests, `getStats()` with `evictedCount`/`resetCount`), size check ≤ 1 KiB serialized JSON.

**Envelope change (minimal):**

- `src/providers/dhan/dhan_normalizer.ts` `normalizeDhanQuoteToCanonical` and `DhanMarketDataService` envelope assembly: provenance now accepts optional `traceContext` and injects `traceId`/`correlationId` per §4.6 rule 2 without mutating cached provenance. No change to `DhanHistoricalProvenance` (no `traceId` invented).

#### 3.1.2 D01 provenance rules (M4-relevant, §4.6 rule 2)

| Case | `traceId` | `correlationId` | How |
|---|---|---|---|
| **New, non-coalesced observation** (cache miss, single requester) | current `actionId` | same current `actionId` | No earlier producer exists; both fields may be identical value — not a defect, roles remain distinct. |
| **Cache hit** | **current requester's** `actionId` | **original producer's** `actionId` (from cached provenance) | Current request did not produce data; provenance preserves original producer. Never mutate cached provenance to fill field. |
| **Coalesced requests** (multiple simultaneous same `scope`, one `workId`) | each requester's own `actionId` | shared producer `actionId` (the one that drove the single refresh) | Each requester retains own `traceId`; all share `correlationId`. Late-joiners are `WORK_JOIN`. |
| **Historical / D02** | not present | not present | No provenance invented for D02 per rule 3. Historical `DhanHistoricalNormalizationResult.provenance` carries no trace fields. |

### 3.2 Trace/action identity lifecycle

1. **Mint (IRR only):** IRR generates `actionId` via `crypto.randomUUID()` (lowercase) at the start of a user action (quote, history, supplementary freshness read). One action → one `actionId`; a supplementary `GET /v1/freshness` for the same observation reuses the same `actionId` (§4.6 rule 2 context note). Generation never inspects secret material (D-7 §4.10 rule 3). IRR records `ACTION_START` in its own ring (IRR half, not this design).

2. **Propagate (IRR → IPD):** `MarketDataTransportClient` adds `X-IIPS-Trace-Version: 1` + `X-IIPS-Action-Id: <uuid>` to `POST /v1/quotes` / `POST /v1/historical` / `GET /v1/freshness`. The headers ride the authenticated loopback hop only (D-7 §4.2.1 surface 4). No header is sent to Dhan.

3. **Validate (IPD server):** `createMarketDataHttpServer` extracts headers **before** reading body for quote/historical/freshness. Validation: `X-IIPS-Trace-Version` must be `1` (exact string, no whitespace, no numeric coercion); `X-IIPS-Action-Id` must match `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` (lowercase UUIDv4). Invalid version → `CONTRACT_MISMATCH` event, HTTP 400 with D-7 diagnostic message (no secret/path echo), no ring write beyond the mismatch event, **no retry** (D-7 §4.2.1 (4), §4.9 safeguards). Missing/empty headers → same fail-closed path; trace coverage is not silently claimed. Valid headers are **never logged**, never serialized into diagnostic events beyond the `actionId` field, never forwarded.

4. **Admit (IPD service):** `DhanMarketDataService.getQuote(TraceContext?)` validates `validationOutcome` (MISSING_REQUIRED_FIELD, IDENTITY_REJECTED etc. via `failureCategory`). On valid input, service creates **one** `DhanDiagnosticEvent` with `event: REQUEST_ADMITTED`, records in ring, increments sequence. `TraceContext` is carried as method-local state, never stored beyond request lifetime except in ring and envelope provenance.

5. **Work assignment:** On cache hit, no `workId`/`attemptId` is created (W-24: cache hit creates no vendor attempt). Service returns envelope copy with `traceId` = current `actionId`, `correlationId` = cached `traceId` (or cached `actionId` if cached envelope predates W-24). On cache miss, service creates new `workId` via `crypto.randomUUID()`, records `WORK_START`; concurrent same-scope callers arriving during the single `orchestrator.refresh` execution join via `WORK_JOIN` (same `workId`, distinct `actionId`). `workId` is never derived from payload, DTO, business identifier, URL, path, or header (§4.6 rule 1).

6. **Attempt execution:** Within `orchestrator.refresh`'s `fetchQuote` closure, service creates `attemptId` per actual `DhanApiClient.fetchMarketQuotes` call (one attempt per handoff), records `ATTEMPT_START`, performs egress, then records `ATTEMPT_END` with `outcome`/`failureCategory`/`durationMs`. Second-attempt scenario: `attemptId` is new per handoff even when `workId` is shared. No correlation header/param/body field sent to Dhan.

7. **End and ring write:** Service records `REQUEST_END` (or `ACTION_END` for single-requester path) with final outcome and duration, associated with `actionId`/`workId`/`attemptId`. Returned envelope for D01 carries `traceId`/`correlationId` per §3.1.2 (immutable per-request copy: cached provenance shallow-copied with trace fields injected, original cache entry untouched).

8. **Acknowledge:** HTTP response includes no trace header. Trace coverage is not reported in `ServiceHealth`/`ServiceDiagnostics` (D-7 §4.3 unchanged). Instead, `GET /v1/trace/ring` reader (authenticated, loopback-only) exposes ring contents where caller can find `actionId → workId → attemptId → outcome`.

### 3.3 Daemon and client responsibilities

| Component | File | Responsibility |
|---|---|---|
| **Daemon** | `src/providers/dhan/dhan_local_daemon.ts` `startMarketDataDaemon()` | Instantiate `DhanDiagnosticRing(1024)` once; pass to `DhanMarketDataService` constructor and to `createMarketDataHttpServer` (reader needs ring reference). Include ring in `MarketDataDaemonDiagnostics`? — No: per D-7 §4.3, startup line gains nothing; instead emit one-line `traceRingCapacity=1024` in startup line as operational count (not secret) only if owner approves minimal additive field — otherwise keep startup line unchanged and publish capacity via reader's `X-Total-Count` header. On `shutdown()`, ring is **not** persisted (D-7 §4.8: memory only, lost on exit). |
| **Service** | `src/providers/dhan/dhan_market_data_service.ts` `DhanMarketDataService` | Own ring (constructor-injected), trace header validation helper (delegates to `dhan_trace.ts`), `getQuote(request, traceCtx?)` / `getHistorical(request, traceCtx?)` / `getFreshness(request, traceCtx?)` overloads. Create `workId`/`attemptId`, record all §4.6 events, build per-request envelope copies, enforce no-mutation-of-cached-provenance, enforce size ceiling (drop numeric fields or drop event). Expose `getDiagnosticRing()` for HTTP reader; no other accessor. |
| **HTTP Server** | `src/providers/dhan/dhan_market_data_http.ts` `createMarketDataHttpServer` | Extract/validate trace headers on `POST /v1/quotes`/`POST /v1/historical`/`GET /v1/freshness`; reject invalid/missing with 400 `CONTRACT_MISMATCH` without echoing input; **never log headers**; never serialize headers into events; forward validated `TraceContext` to service. New operator reader: `GET /v1/trace/ring` — reuses existing `IIPS_MARKET_DATA_TRANSPORT_TOKEN` bearer (constant-time `timingSafeEqual`), loopback-only binding check, read-only (never mutation/eviction/reset), no unauthenticated fallback, fail closed with 401 and zero entries when bearer absent/mismatched, bounded `limit` query param (default 100, max 1024). Response body: `{ ok: true, events: DhanDiagnosticEvent[], stats: { capacity, size, evictedCount, resetCount, nextSequence }, schemaVersion: 1 }` with `ContractVersion: 1` header. Never expose secrets/paths/payloads; only allowlisted 12 fields. |
| **Client** | `src/providers/dhan/dhan_market_data_http.ts` `MarketDataTransportClient` | New: `generateTraceContext()` (crypto.randomUUID), `getQuote(request, traceOptions?)` + `getHistorical(request, traceOptions?)` + `getFreshness(request, traceOptions?)` + new `getTraceRing(options?)` method. Trace headers sent only on loopback authenticated hop; validated `TraceContext` passed as method argument (never derived from secret). `getTraceRing` reuses same `requestJson`/`preflightCheck` (production refusal, loopback, token). On trace-contract mismatch response (400 `CONTRACT_MISMATCH`), **do not retry** (D-7 §4.2.1 (4): daemon may already have acted). |
| **Egress client** | `src/providers/dhan/dhan_api_client.ts` `DhanApiClient` | Associate `attemptId` with local egress-attempt record (new optional field `traceAttemptId` in internal `metrics` passed to recorder, not sent to Dhan). Existing `DhanStateRecorder` records `lastSuccessAt`/`lastFailure`/`lastAuthOutcome`/`latencyMs`; W-24 ring records the `attemptId`-bearing event — two recorders, separate concerns, no merge. |

### 3.4 Provenance recording and retention behaviour

- **What is provenance:** One `attemptId` per actual `fetchMarketQuotes` handoff, plus surrounding `workId`/`actionId` linkage, stored as ring events. The egress attempt is local evidence — locally observed outcome categorised via `failureCategory`, locally measured `durationMs`, no Dhan receipt proof (M4 §10.3).
- **What is not provenance:** No Dhan payload, DTO, business identifier, hash of business identifier, vendor error message, or path is recorded (§4.2 items 1–8). Historical `DhanHistoricalProvenance` gains no trace field (§4.6 rule 3); D02 freshness remains trace-free.
- **Retention:** RING-ONLY. No file, database, message bus, external collector, crash dump, telemetry endpoint (D-7 §4.8 rule 2 on sink). Process-lifetime memory, cleared on exit and on `clearForTestOnly` test helper only. Startup with new process yields empty ring (`nextSequence` resets to 0, `evictedCount`/`resetCount` reflect prior process lifetime only — not persisted).
- **Eviction:** Oldest-first when `size === capacity` (1024 IPD). Eviction count tracked for reader `X-Evicted` indicator. No ring growth, no spill, no writer blocking.
- **Immutability of cached provenance:** Cached envelope (in `DhanBoundedCache`) is never mutated to add trace fields. On cache hit, service builds a new envelope object: `{ ...cachedEnvelope, provenance: { ...cachedProvenance, traceId: currentActionId, correlationId: cachedTraceId ?? cachedActionId } }` and returns that copy. Original cached entry retains its original provenance (or none for pre-W-24 entries). This satisfies §4.6 rule 3 (no retroactive provenance).

### 3.5 Ring integration and retrieval behaviour

- **Ring implementation:** New `src/providers/dhan/dhan_diagnostic_ring.ts` `DhanDiagnosticRing`:

  ```ts
  export const W24_RING_CAPACITY_IPD = 1024 as const;
  export const W24_RING_CAPACITY_IRR = 512 as const; // IRR will reuse same constant from IPD package
  export const W24_EVENT_SCHEMA_VERSION = 1 as const;
  export const W24_MAX_EVENT_BYTES = 1024 as const; // 1 KiB serialized JSON
  export interface DhanDiagnosticEvent { readonly schemaVersion: 1; readonly timestampUtc: string; readonly component: 'IRR'|'IPD'; readonly operation: 'QUOTE'|'HISTORY'|'FRESHNESS'; readonly event: 11-value; readonly actionId: string; readonly workId: string; readonly attemptId: string; readonly outcome: 5-value; readonly failureCategory: DhanObservedFailureCategory | null; readonly durationMs: number; readonly sequence: number; }
  export class DhanDiagnosticRing { constructor(capacity: number); record(partial: Omit<DhanDiagnosticEvent,'sequence'>): DhanDiagnosticEvent | null; list(opts?: { limit?: number, sinceSequence?: number }): DhanDiagnosticEvent[]; getStats(): { capacity, size, evictedCount, resetCount, nextSequence }; }
  ```

  Circular buffer (`Array(capacity)` + head/tail indices), monotonic `nextSequence` (uint32, wraps safely or errors — not silent). `record` checks serialized `JSON.stringify(event)` byte length ≤ 1024; if over, drop event (return `null`) rather than trim into prohibited value (§4.6 rule 4). Record never throws; ring never blocks writer.

- **Retrieval — operator reader:** `GET /v1/trace/ring?limit=100&sinceSequence=0`:

  - Reuses `MARKET_DATA_TRANSPORT_TOKEN_ENV` bearer (`Authorization: Bearer <token>`), constant-time compare, same `LOOPBACK_HOSTS` binding (§4.9 safeguard 4).
  - Loopback-only: checks `isLoopbackTransportHost` on socket remoteAddress, not `X-Forwarded-For`.
  - Read-only: no mutation, no `clear`/`reset`/`evict` param.
  - No unauthenticated fallback: missing bearer → 401, no entries (never partial/sample/count hint).
  - Fail closed when bearer unavailable/invalid: deny, zero diagnostic entries (D-7 §4.9 rule bearer-unavailable).
  - Bounded: `limit` default 100, max = capacity (1024), min 1; `sinceSequence` optional cursor.
  - Response never contains secret/path/payload/DTO/business-id/hash/exception/child-text/URL/header names — only allowlisted 12 fields (§4.2, §4.9). Browser never receives bearer (server-only reference in IRR, per 2026-11-21 clarification).

- **Integration wiring:**

  ```
  startMarketDataDaemon() {
    const ring = new DhanDiagnosticRing(1024);
    const service = new DhanMarketDataService({ ..., ring, now });
    const server = createMarketDataHttpServer({ service, ring, token, ... });
  }
  ```

  `createMarketDataHttpServer` captures `ring` closure for reader handler; service captures `ring` for event recording.

- **What is not retained:** No disk writer; no external sink registration; ring contents are internal (§4.8 rule 4) and exposed only through this reader. Shutdown does not persist ring (ring lost on exit by design).

### 3.6 Validation and failure handling

| Input | Valid set | On violation |
|---|---|---|
| `X-IIPS-Trace-Version` | Exact string `1` | `CONTRACT_MISMATCH` event + 400 `{ error: { code: 'CONTRACT_MISMATCH', message: 'trace version mismatch; daemon supports v1 only' } }`. No echo of supplied value. No retry (D-7 §4.2.1). |
| `X-IIPS-Action-Id` | Lowercase UUIDv4 `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`, length 36, no whitespace, no uppercase | `CONTRACT_MISMATCH` + 400 `{ code: 'CONTRACT_MISMATCH', message: 'actionId must be lowercase UUIDv4' }`. No echo. Never reads secret; never compares against secret material (§4.10 rules 3,6). Never treats valid syntax as proof of trusted generation (rule 6). |
| Missing headers on quote/history/freshness | Headers required per W-24; absence is not silent non-coverage | `CONTRACT_MISMATCH` + 400 (fail closed). Reader never silently claims trace coverage (D-7 §4.2.1). |
| Unknown `failureCategory` | 13-value closed set; anything else → `INTERNAL_ERROR` | Recorded as `INTERNAL_ERROR` (D-7 §4.7 rule 1). Never free-text message, never path/URL (§4.2). |
| `durationMs` | Non-negative integer, finite | Invalid → reject payload or clamp to 0 and record `INTERNAL_ERROR` — never negative. |
| `sequence` | Monotonically increasing within ring | Ring asserts monotonicity; gap indicates eviction (expose `evictedCount`). Reader reports `X-Evicted: true` when `sinceSequence` gap exceeds capacity. |
| `outcome` unknown | 5-value closed set | → `UNKNOWN` (D-7 §4.6). |
| Secret substring coincidence | Random UUID may contain run that occurs inside secret (§4.10 rules 1–2) | Not a breach where independently generated and no secret inspected. Canary tests (see §3.8) assert no *intentional* disclosure, not universal substring absence (§4.10 rule 2). |
| Bearer unavailable for reader | `IIPS_MARKET_DATA_TRANSPORT_TOKEN` absent/unset/expired/mismatch | Reader denies with 401, zero entries (§4.9 bearer-unavailable rule). Never resolves/refreshes/re-reads credential to make check succeed. |
| Dhan transport failure / auth rejection / rate limit | Governed `DhanFailureCode` → `failureCategory` mapping (closed table, see below) | Ring records `ATTEMPT_END` with mapped category (`AUTHENTICATION_FAILED` for 401/403, `RATE_LIMITED` for 429, `TRANSPORT_ERROR` for network, `PROVIDER_ERROR` for 5xx, `TIMEOUT` for deadline). No message pass-through (§4.7 rule 2). |

**Failure-code → `failureCategory` mapping (explicit, closed, required for M4 §4.7):**

| `DhanFailure.code` | `failureCategory` | Note |
|---|---|---|
| `MISSING_REQUIRED_FIELD` / `MALFORMED_INSTRUMENT_MAPPING` / `MALFORMED_RESPONSE` (validation shape) | `VALIDATION_ERROR` | |
| `AUTHENTICATION_FAILURE` (401/403 vendor) | `AUTHENTICATION_FAILED` | Never inferred from preflight `CREDENTIALS_UNAVAILABLE` |
| `PRODUCTION_NOT_AUTHORIZED` / `UNAUTHORIZED_OPERATION` | `AUTHORIZATION_FAILED` | |
| `CONFIGURATION_INCOMPLETE` | `CONFIGURATION_ERROR` | |
| `CREDENTIALS_UNAVAILABLE` / `CREDENTIALS_EXPIRED` (local preflight) | `READINESS_FAILED` | No vendor attempt |
| `UNRESOLVED_INSTRUMENT` / `INSTRUMENT_NOT_IN_RESPONSE` | `IDENTITY_REJECTED` | |
| `RATE_LIMITED` | `RATE_LIMITED` | |
| `STALE_DATA_SUPPRESSED` / `EMPTY_HISTORICAL_SERIES` | `CACHE_ERROR` | Suppression, not vendor |
| `TRANSPORT_FAILURE` / `TRANSPORT_NOT_CONFIGURED` | `TRANSPORT_ERROR` | |
| `HTTP_ERROR` / `PROVIDER_STATUS_FAILURE` / `MALFORMED_RESPONSE` (vendor 5xx) | `PROVIDER_ERROR` | |
| `TIMEOUT` / `REQUEST_TIMEOUT` | `TIMEOUT` | Includes `LATE_COMPLETION` where timeout then completes |
| Header version mismatch / missing headers / unparsable freshness query | `CONTRACT_MISMATCH` | |
| Anything else / unexpected throw | `INTERNAL_ERROR` | Unknown → `INTERNAL_ERROR` (§4.7 rule 1) |

### 3.7 Security and disclosure properties

This implementation **adds no new secret-handling code** and preserves every existing W-02/D-7 guarantee. The following properties are **invariant** and are asserted by canary tests (§3.8):

1. **No secret in any W-24 surface:** `DhanDiagnosticEvent` has no field capable of carrying a secret value, token, `vault://` reference, carrier path, filesystem directory, store metadata, DPAPI ciphertext, environment dump, exception message with path, or credential material in argv/temp/shell history (D-7 §4.2 items 1–8). The ring never records `vaultBackendId`/`vaultBackendSelector` beyond the existing startup line; those are non-secret counts and are not W-24 fields.
2. **No identifier derived from secret:** `generateTraceId` uses `node:crypto.randomUUID` (cryptographically secure, platform facility) and never reads `DhanCredentialResolver`, `LocalHostVaultSecretBackend`, or any carrier (§4.10 rule 3, §4.6 rule 1). Header validation never reads credential material; never compares identifier against secret.
3. **Substring clarification honored:** Coincidental UUID substring overlap with secret is not a breach where independently generated (D-7 §4.10 rules 1–2). No test asserts universal zero-overlap; canary tests assert no *intentional* disclosure.
4. **Only 4 surfaces carry identifiers (§4.2.1):** (1) W-24 events + authenticated reader, (2) D01 `traceId`/`correlationId`, (3) IRR response action reference server-side only, (4) `X-IIPS-Trace-Version`/`X-IIPS-Action-Id` on loopback. Every other surface (W-09 diagnostics, `ServiceHealth`, startup line, public Status, arbitrary logs/errors/HTTP bodies/browser/Dhan) remains prohibited for identifiers exactly as before. §4.2 precedence explicitly stated.
5. **Reader safeguards (§4.9):** Reuse existing bearer, constant-time, loopback-only, read-only, never browser/proxy, no unauthenticated fallback, fail closed when bearer absent/invalid. Reader never probes backend or warms cache.
6. **Tracing never causes credential resolution:** §4.10 rule 3 — *no secret inspection or credential resolution solely for tracing is authorized*. Ring recording uses only already-available context (identifiers, timestamps, enums). Unavailable credential → tracing proceeds without it (not error).
7. **Browser exclusion:** No browser-visible surface receives diagnostic events, ring contents, reader bearer token, or server-side response reference. IRR will enforce this in its half; IPD never ships a browser bundle containing W-24 ring code (ring is `node:http` server-only).
8. **Dhan exclusion:** No trace header/param/body field sent to Dhan. `DhanApiClient.fetchMarketQuotes` has no trace param; `DhanServerHttpsTransport.send` never adds `X-IIPS-*`.

### 3.8 Required tests and verification gates

**All tests are synthetic (E1/E2), no live Dhan, no credential, no Windows host.** Each gate is deterministic (injected `now`, injected transport, in-memory ring, isolated `DhanFileStateStore` not used here).

| Suite | File (proposed) | What it proves | W-24 criterion |
|---|---|---|---|
| **Trace generation** | `tests/dhan_w24_trace_generation.test.ts` | UUIDv4 generation: 1,000 IDs — all lowercase, all valid UUIDv4, ≥ entropy check (no duplicate in run), never derived from payload/secret, never reads `DhanCredentialResolver` (assert via injected fake backend with call counter). | §4.6 rule 1, §4.10 rule 3 |
| **Header validation** | `tests/dhan_w24_trace_header_validation.test.ts` | Valid headers accepted; missing/empty/uppercase/whitespace/uppercase-uuid/non-UUIDv4/version 2/non-numeric all → 400 `CONTRACT_MISMATCH` without echoing input; no log of header; no retry after mismatch. | §4.2.1 (4), §4.10 rule 6, §4.9 |
| **Ring boundedness** | `tests/dhan_w24_ring_bounded.test.ts` | Capacity exactly 1,024 IPD; at capacity+1 oldest evicted; never grows/spills/blocks; `sequence` monotonically increasing; oldest-eviction indicator correct; restart clears ring (new process → empty). | §4.8, §4.6 |
| **Ring size ceiling** | `tests/dhan_w24_event_size_ceiling.test.ts` | Oversize serialized event (>1 KiB) → dropped (never trimmed into prohibited value); normal event ≤1 KiB recorded; synthetic event with max-length fields stays ≤1 KiB. | §4.6 rule 4 |
| **D01 provenance — new request** | `tests/dhan_w24_d01_provenance_new.test.ts` | New non-coalesced quote → `traceId === actionId`, `correlationId === actionId` (same value, distinct roles); envelope is immutable copy, cached entry unchanged; no D02 provenance. | §4.6 rules 2–3 |
| **D01 provenance — cache hit** | `tests/dhan_w24_d01_provenance_cache_hit.test.ts` | Cache hit → `traceId` = current requester `actionId`, `correlationId` = original producer `actionId`; cached provenance never mutated; no vendor attempt, no `ATTEMPT_START`; `CACHE_HIT` event recorded. | §4.6 rules 2–3 |
| **Coalescing** | `tests/dhan_w24_coalescing.test.ts` | 3 simultaneous same-scope requests → one `workId`, one `attemptId`, 3 `REQUEST_ADMITTED`, 1 `WORK_START` + 2 `WORK_JOIN`, 1 `ATTEMPT_START`/`ATTEMPT_END`; each response carries correct `traceId`/`correlationId` (shared producer). Late join handled. `LATE_COMPLETION` when timeout then completes. | §4.6 rule 2 (coalesced), §4.8 |
| **Timeout and late completion** | `tests/dhan_w24_timeout.test.ts` | Transport timeout → `TIMEOUT` event with `TIMEOUT` category; late completion after timeout → `LATE_COMPLETION` event, not `SUCCESS`; `MISSING_COVERAGE` freshness path still traces. | §4.6, §4.7 |
| **Failure category mapping** | `tests/dhan_w24_failure_category.test.ts` | Every `DhanFailureCode` maps to exactly one `failureCategory` per closed table; unknown code → `INTERNAL_ERROR`; no raw message recorded. | §4.7 |
| **Reader safeguards** | `tests/dhan_w24_reader_safeguards.test.ts` | Reuses `IIPS_MARKET_DATA_TRANSPORT_TOKEN`; constant-time compare (no timing leak test, but code review asserts `timingSafeEqual`); loopback-only refuses non-loopback origin; read-only (no `?clear` param); no unauthenticated fallback; missing bearer → 401 zero entries (no count hint); never exposes secret/path/payload. | §4.9 |
| **Disclosure canaries** | `tests/dhan_w24_disclosure_canary.test.ts` | Set canary secrets `CANARY_SECRET_VALUE_…`, `vault://dhan/client-id` in env; every W-24 surface (HTTP response body for `POST /v1/quotes`, `GET /v1/trace/ring`, D01 envelope JSON, ring event JSON, error bodies) asserted to contain no canary, no `vault://`, no carrier path, no business identifier hash, no exception text. Synthetic secrets only — never real credential. | §4.2, §4.10, W-02 |
| **Browser exclusion** | `tests/dhan_w24_browser_exclusion.test.ts` | No `src/providers/dhan/dhan_diagnostic_ring.ts` or ring code appears in `dist/ui` / `dist/pit` / `dhan-server` browser bundles; IRR reader verification is server-side only. | §4.2.1, §4.9 |
| **Dhan header exclusion** | `tests/dhan_w24_no_dhan_header.test.ts` | Injected `DhanServerHttpsTransport` asserts `send(request)` never contains `X-IIPS-*` or any trace field in headers/params/body (all Dhan egress inspected). | §4.2.1, §4.9 |
| **Sequence with W-25 freshness** | `tests/dhan_w24_freshness_interaction.test.ts` | `getFreshness` with trace context → event recorded; effective thresholds unchanged; `evaluateFreshness` remains arithmetic owner; diagnostics unchanged. | §4.6, lane A |
| **Concurrency and eviction** | `tests/dhan_w24_concurrency.test.ts` | High-concurrency same-scope refresh: no lost events, sequence monotonic, no deadlock, ring never exceeds capacity. | §4.8 |

**Existing suites must remain green (regression):** `dhan_d7_state_and_disclosure_conformance.test.ts`, `dhan_p4_operational_controls.test.ts`, `dhan_p5_service_transport.test.ts`, `dhan_d1_provider_foundation.test.ts`, `dhan_w19_d02_freshness_cache.test.ts`, `w22_bse_bounded_calendar.test.ts`, `dhan_w25_configurable_thresholds.test.ts`, `dhan_w23_persistence_completion_record.test.ts`, plus full-suite guarded run (`npm test` → 2,189+ tests, 0 failures, `+ N` W-24 suites). Zero bypass of CI.

### 3.9 Acceptance-criteria and D-7 mapping (every proposed change → criterion)

| Proposed change | Maps to W-24 criterion | Maps to D-7 requirement |
|---|---|---|
| `dhan_trace.ts` + `generateTraceId` (crypto.randomUUID) | One id spans IRR→IPD (M4 trace) | §4.6 rule 1: opaque lowercase UUIDv4, cryptographic generation, never derived from payload/secret |
| `dhan_diagnostic_ring.ts` (1,024 IPD, 1 KiB ceiling, sequence, oldest eviction) | Ring bounded, local, no external sink | §4.8 (512 IRR / 1,024 IPD, memory-only, no disk/sink, oldest eviction); §4.6 rule 4 (1 KiB ceiling) |
| `DhanMarketDataService` `workId`/`attemptId` + `DhanDiagnosticEvent` recording (11-event enum, 5-outcome, 13-category) | Failed action traceable end-to-end (W-24 exit) | §4.6 (12-field closed enum), §4.7 (13-value failureCategory, unknown→INTERNAL_ERROR) |
| `DhanMarketDataService` D01 provenance copy (`traceId`/`correlationId` per cache-hit/coalesced rules) | One id appears in daemon log and response provenance | §4.6 rule 2 (distinct roles, may share value; cache-hit current vs original; coalesced shared producer; no retroactive mutation) |
| `dhan_market_data_http.ts` header propagation `X-IIPS-Trace-Version`/`X-IIPS-Action-Id` validation + fail-closed mismatch handling | Request/correlation id propagated on transport call; no silent coverage claim | §4.2.1 (4) validated headers on loopback only, §4.10 rule 6 (untrusted input, never proof of trusted generation), §4.9 (never logged/serialized, fail closed on mismatch, no retry) |
| `MarketDataTransportClient` actionId mint + header send + `getTraceRing()` | IRR creates opaque actionId, sends to IPD over authenticated transport | §4.2.1 (4), §4.9 (reuse bearer, loopback) |
| `GET /v1/trace/ring` operator reader (bearer reuse, constant-time, loopback-only, read-only, no fallback) | Bounded local log ring readable by operator, no external sink | §4.9 reader safeguards 1–6, bearer-unavailable fail-closed, D-7 §4.1 (reader is not W-09 diagnostics; §4.3 surfaces unchanged) |
| No `attemptId`/ring in `ServiceDiagnostics` (stays at contract v3) | Log lines contain no secret/`vault://` | §4.1 MAY exhaustive (new field requires amendment); §4.2.1 states §4.3 surfaces gain nothing; §4.9 binding prohibitions |
| No trace header/param/body sent to Dhan | Local egress-attempt record (M4 interpretation) | D-7 §4.2.1/§4.9: no trace metadata/headers sent to Dhan; §12 U-4 resolution (local handoff, not vendor acknowledgement) |
| `DhanHistoricalProvenance` unchanged (no `traceId` invented) | No retroactive/canonical D02 provenance invention | §4.6 rule 3 |
| Canary disclosure suites + browser/Dhan exclusion suites | Log lines contain no secret/`vault://`/path; ring bounded (assertion) | §4.2 MUST NOT (items 1–8), §4.10 rules 1–5 (coincidence not disclosure, not zero-overlap guarantee, intentional disclosure prohibited, canary tests retained), §5 |
| `DhanApiClient` `attemptId` association (internal metric only) | Transport-attempt evidence linkable to `actionId` | M4 Dhan-leg: IPD-local transport-attempt evidence (D-7 §12 U-4, roadmap §10.3) |

---

## 4. IPD-to-IRR handoff

The IPD stage publishes a package-level artefact that the IRR stage consumes. No IRR code is modified from IPD; IRR consumes by pin bump and its own implementation.

### 4.1 Contract and version

| Field | Value |
|---|---|
| **Package** | `iips-production-market-data` `@1.0.0` (same as W-23/W-25 lane) |
| **Subpath** | `iips-production-market-data/dhan-server` (existing, no new entry point) |
| **New contract version** | `W24_TRACE_CONTRACT_VERSION = 1` (new constant, not `DHAN_DIAGNOSTICS_CONTRACT_VERSION`/`DHAN_HEALTH_CONTRACT_VERSION`/`DHAN_PERSISTED_STATE_SCHEMA_VERSION`/`DHAN_VERIFICATION_CONTRACT_VERSION`) |
| **New route** | `GET /v1/trace/ring` — version `1`, path `MARKET_DATA_ROUTES.traceRing` |
| **Envelope addition** | `DataProvenanceDTO.traceId?` / `correlationId?` become populated on D01 `CanonicalEnvelope<MarketQuotePayload>.provenance` (existing optional fields, no new envelope version). Historical `DhanHistoricalProvenance` unchanged. |
| **Published commits** | Service + ring + reader + trace headers on `main` at named merge SHA; `dhan-server` package built artifact `dist/src/providers/dhan/**` includes new modules; `package.json#exports ./dhan-server` unchanged. |
| **Compatibility** | Additive: consumers that ignore `traceId`/`correlationId` are unaffected; `GET /v1/trace/ring` unauthenticated → 401 (not 404), so old IPD correctly refuses. Client `getTraceRing()` validated fail-closed when route absent (→ `MALFORMED_RESPONSE`, never retry). |

### 4.2 Public interfaces (IPD-owned, IRR-consumed)

```ts
// dhan_trace.ts
export const W24_TRACE_CONTRACT_VERSION = 1 as const;
export const TRACE_HEADER_VERSION = 'X-IIPS-Trace-Version' as const;
export const TRACE_HEADER_ACTION = 'X-IIPS-Action-Id' as const;
export function generateTraceId(): string; // crypto-backed lowercase UUIDv4
export function isLowercaseUuidV4(s: string): boolean;
export function validateTraceHeaders(headers: Record<string,string|undefined>): TraceContext | TraceHeaderRejection;
export type TraceContext = { traceVersion: 1, actionId: string };
export type TraceHeaderRejection = { code: 'CONTRACT_MISMATCH', reason: 'MISSING_HEADERS'|'INVALID_VERSION'|'INVALID_ACTION_ID' };

// dhan_diagnostic_ring.ts
export const W24_RING_CAPACITY_IPD = 1024 as const;
export const W24_RING_CAPACITY_IRR = 512 as const;
export const W24_MAX_EVENT_BYTES = 1024 as const;
export interface DhanDiagnosticEvent { readonly schemaVersion: 1; readonly timestampUtc: string; readonly component: 'IRR'|'IPD'; readonly operation: 'QUOTE'|'HISTORY'|'FRESHNESS'; readonly event: 11-value; readonly actionId: string; readonly workId: string; readonly attemptId: string; readonly outcome: 5-value; readonly failureCategory: DhanClosedFailureCategory | null; readonly durationMs: number; readonly sequence: number; }
export class DhanDiagnosticRing { constructor(capacity: number); record(partial: Omit<DhanDiagnosticEvent,'sequence'>): DhanDiagnosticEvent|null; list(opts?: { limit?: number, sinceSequence?: number }): DhanDiagnosticEvent[]; getStats(): { capacity, size, evictedCount, resetCount, nextSequence }; }

// dhan_market_data_service.ts
export interface TraceableQuoteRequest extends QuoteRequest { traceContext?: TraceContext; }
export interface TraceableHistoricalRequest extends HistoricalServiceRequest { traceContext?: TraceContext; }

// dhan_market_data_http.ts (server)
export const MARKET_DATA_ROUTES: { traceRing: '/v1/trace/ring', ...existing };
// GET /v1/trace/ring?limit=&sinceSequence=  →  { ok: true, events: DhanDiagnosticEvent[], stats: { capacity, size, evictedCount, resetCount, nextSequence }, schemaVersion: 1 } | { ok: false, failure }

// dhan_market_data_http.ts (client)
export class MarketDataTransportClient {
  generateTraceContext(): TraceContext;
  getQuote(req: QuoteRequest, traceCtx?: TraceContext): Promise<MarketDataTransportQuoteOutcome>;
  getHistorical(req: HistoricalServiceRequest, traceCtx?: TraceContext): Promise<...>;
  getFreshness(req: FreshnessRequest, traceCtx?: TraceContext): Promise<...>;
  getTraceRing(opts?: { limit?: number, sinceSequence?: number }): Promise<{ ok: true, events: DhanDiagnosticEvent[], stats } | { ok:false, failure }>;
}
```

### 4.3 Trace/action correlation semantics

- **Lifecycle:** IRR mints `actionId` per user action → propagates `X-IIPS-Trace-Version:1` + `X-IIPS-Action-Id` on loopback `POST /v1/quotes|/historical` (and `GET /v1/freshness` when supplementary) → IPD validates → admits `REQUEST_ADMITTED` → assigns `workId` on miss (shared across coalesced `actionId`s) → records `WORK_START`/`WORK_JOIN` → executes one `attemptId` per actual Dhan handoff → records `ATTEMPT_START`/`ATTEMPT_END` with outcome/latency/category → records `REQUEST_END`/`CACHE_HIT` where applicable → returns D01 envelope with `traceId`/`correlationId` per §4.6 rule 2.
- **D01 `traceId`/`correlationId` guarantees:**
  - New observation: `traceId === actionId`, `correlationId === actionId` (equal values, distinct roles).
  - Cache hit: `traceId === current actionId`, `correlationId === original producer actionId` from cached provenance.
  - Coalesced: each response's `traceId` is its own `actionId`; all share `correlationId` = shared producer's `actionId`.
  - `correlationId` never synthesized for historical or for failed actions (no successful envelope).
  - Cached provenance never mutated (copy-on-serve).

### 4.4 Provenance guarantees

- D01 envelope provenance `traceId`/`correlationId` are exactly the W-24 identifiers, not business IDs, not hashes of business IDs, not derived values. Immutability guarantee: returned envelope is a new object; cache entry untouched.
- Historical `DhanHistoricalProvenance` carries no trace fields; D02 provenance invention is prohibited (§4.6 rule 3, D-4.3).
- Ring events carry exactly 12 allowlisted fields; never credentials, tokens, `vault://`, paths, DTOs, payloads, business identifiers, or raw child/HTTP bodies. 1 KiB ceiling enforced (drop, never trim-prohibited).

### 4.5 Tests and compatibility requirements (for IRR to consume)

- IRR must bump its `iips-production-market-data` pin to the exact `main` merge SHA recorded in the IPD PR description and pass:
  - `gh api contents` fetchable at new `sha` (`W24_TRACE_CONTRACT_VERSION = 1` present in `dhan_trace.ts`, ring file present).
  - `MarketDataTransportClient.getTraceRing` parity test: old daemon (no ring route) → `CONTRACT_MISMATCH` without retry; new daemon → one `actionId` appears across IRR's `ACTION_START` event, IPD ring `REQUEST_ADMITTED`/`ATTEMPT_END`, and D01 `provenance.traceId` (end-to-end).
  - Disclosure canary: after enabling W-24, every surface (ring reader, envelope, error bodies) still free of canary secrets.
  - Browser bundle boundary: no W-24 ring code in any browser bundle.
  - Joined synthetic suite (IPD + IRR) on same `main` pins: 512 IRR + 1,024 IPD capacities respected; eviction indicator correct; late-completion path verified.

---

## 5. Outstanding decisions and dependencies

| # | Decision / dependency | Status | Owner | Blocks |
|---|---|---|---|---|
| 1 | **IRR acceptance of D-7 amendment** (U-3: §4.5–§4.10, §4.2.1, §4.10, wire names) | **Outstanding — governance gate.** Amendment recorded at `001848e9…` + `06a2b0db…` is IPD-only until IRR records acceptance on IRR `main` at named SHA. | IRR | W-24 authorization |
| 2 | **Explicit owner authorisation to implement W-24 IPD half** (D-7 §11) | **Outstanding.** This readiness report is approval to **review**, not to build. Required: short note naming contract version `1`, PR head SHA, reviewer, IPD-only scope. | Program Authority / Principal | W-24 build PR |
| 3 | **Ring reader vs generic diagnostics route** | **Resolved in design:** New route `GET /v1/trace/ring`, not `/v1/diagnostics` (D-7 §4.3 surfaces gain nothing; §4.1 MAY exhaustive). Capacity 1,024/512, 1 KiB ceiling, authenticated reader. | IPD (this design) | No longer blocks |
| 4 | **M4 Dhan-leg interpretation** | **Resolved:** IPD-local handoff (D-7 §12 U-4, roadmap §10.3, owner decision). W-24 design implements exactly that; no Dhan header. | — | No longer blocks W-24 |
| 5 | **M4 interpretation formal recording through roadmap authority** | **Outstanding for M4 acceptance** (not for W-24). The owner interpretation at `001848e9…` is not yet formally recorded through the roadmap authority; until then it may not be cited as M4 satisfaction. W-24 contributes one conjunct (trace) to M4 but does not close M4. | Roadmap authority | M4 declaration |
| 6 | **IRR reader bearer choice** | Design reuses `IIPS_MARKET_DATA_TRANSPORT_TOKEN` (D-7 §4.9 (1) — bearer already in memory, already authorized). If later expanded to separate IRR operator listener, that expansion requires **its own** security approval (D-7 §4.9, owner proposal §4). | Owner security | IRR half |
| 7 | **W-05 credential lash / W-23 persistence interaction** | No design coupling: W-24 ring is orthogonal to auth latch (D-2) and persisted state (W-23 `dhan_state_store.ts`). Ring is never persisted; restart clears it (D-7 §4.8 rule 1). | — | No block |

---

## 6. Implementation-authority status (explicit)

| Question | Answer |
|---|---|
| Is W-24 implementation authorized? | **No.** D-7 §11: *This record … authorizes no implementation. W-24 remains open.* Standing status (§12): *W-24 is open; this IPD amendment is awaiting IRR acceptance (U-3); M4 acceptance is not established (U-4); and W-24 implementation is not authorized.* Investigation (§3 row 30, §5 BLK-6, §6 seq 7): *Implementation not authorised — IPD first, then IRR.* |
| What does this report authorize? | **Review only.** It establishes readiness (architecture inspected, design specified, handoff defined, tests planned) so the owner can decide. |
| What authorization is required next? | (1) IRR acceptance of the D-7 amendment on IRR `main` at named SHA (U-3). (2) Explicit owner note authorizing W-24 IPD implementation on this branch, naming `W24_TRACE_CONTRACT_VERSION = 1`, expected PR and head SHA pattern, reviewer, and IPD-only scope. No live Dhan call or Windows host evidence is required for authorization. |
| What happens after authorization? | IPD implements daemon, client, provenance and ring on this branch, synthetically verifies (all suites in §3.8), publishes via PR to `main` with `typecheck·build·test` + `executed test count` SUCCESS and `MERGEABLE/CLEAN`, then IRR consumes the pin and implements correlation + ring. Windows acceptance and M4 declaration are separate, later gates. |

---

## 7. Evidence and traceability

| Determination | Repository | Branch / commit | File · PR · evidence |
|---|---|---|---|
| W-24 roadmap definition | IRR `ramkivs/iips-review-recovered` | `main` `e631cabc` → v1.1 `1e26ff5…` | `DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` §5 D-7, §6 W-24, §10.3 M4, §11 W-02 first |
| D-7 adopted + amended for W-24 | IPD `ramkivs/iips-production-market-data` | `main` `eebaa3d` (PR #186 at `126db279…`) | `DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md` §§1–12, esp. §4.5–§4.10, §4.2.1, §11, §12 U-1…U-4 |
| Six W-24 owner decisions + wire names | IRR | `001848e9c81a4049…` (PR #611) + `06a2b0db30e662a…` (PR #612) | `DHAN-W24-OWNER-DECISION-PROPOSAL-2026-11-21.md` + roadmap §10.3 |
| W-24 status: NOT STARTED | IPD | `85ac127` → `eebaa3d` investigation | `DHAN-LIVE-INVESTIGATION-…-2026-11-25.md` §3 row 30, §4 row 5, §5 BLK-6, §6 seq 7–8 |
| W-08/W-09 COMPLETE | IPD | `eebaa3d` | PRs #168, #169, #170, #172; `dhan_provider_state_recorder.ts` + `dhan_market_data_service.ts` `verifyConnection` + `dhan_market_data_http.ts` `/v1/connection/verify`/`/v1/diagnostics` |
| Existing envelope/provenance | IPD | `eebaa3d` | `src/contracts/provenance.ts:20–21` `traceId?`/`correlationId?` + `src/contracts/envelope.ts` + `src/providers/dhan/dhan_normalizer.ts` + `src/providers/dhan/dhan_market_data_source.ts` |
| Ring absence today | IPD | `eebaa3d` | `grep -rn actionId/X-IIPS src/providers/dhan` → 0; `grep -rn ring src/providers/dhan` → 0 |
| This readiness report | IPD | `arena/f93e947f-…` head `eebaa3d` + `HEAD` | `DHAN-W24-IPD-IMPLEMENTATION-READINESS-REPORT-2026-11-26.md` |

---

## 8. Roadmap update

The authoritative **IPD investigation roadmap** `docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` §3 row 30 (W-24), §4 row 5, §5 BLK-6 and §6 sequence are the correct place to record this assessment. The next commit on this branch will patch that file to reference this report and mark W-24 as **IPD READY — NOT AUTHORIZED** (evidence references above), without claiming implementation completion.

---

*End of W-24 IPD readiness report. No implementation is authorized by this document.*
