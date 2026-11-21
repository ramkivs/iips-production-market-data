# D-7 — Provider State Model, Verify-Connection Semantics and Diagnostics Disclosure Policy

**Decision ID:** `D-7`
**Title:** Provider state model, the meaning of "verify connection", and the diagnostics disclosure policy
**Status:** **ADOPTED FOR IPD** (governance decision, recorded 2026-11-12). IRR-side acceptance is
outstanding and is **not** granted by this record (see §12). **Amended 2026-11-20** to record the six
W-24 owner decisions (§4.6–§4.10, recorded in §4.5); the amendment adds decisions and clarifies §4.2's
substring rule. It does not grant IRR acceptance, does not change the owner of D-7, and does not
authorize implementation (§11).
**Authority:** Program Authority under roadmap v1.1 (`DHAN-LIVE-ROADMAP-2026-11-11`), which names the
owner of D-7 as **IPD + IRR**. Recorded in IPD under that owner's IPD half. **This is a governance
decision, not implementation authorization** (§11).
**Implementation repository:** `ramkivs/iips-production-market-data`
**Roadmap authority:** `ramkivs/iips-review-recovered` →
`docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` (v1.1), blob
`4bea162db299cab844edf7d0d025dd5a56c81d0e`, §5 (D-7), §2 (B-5, B-6, B-13, B-15), §8 (evidence ladder),
§9.1 (L3), §10.1/§10.3 (M1, M4)
**Prerequisites satisfied:** none required by the roadmap; built on accepted W-01 and W-02
**Date:** 2026-11-12 (UTC)
**Reviewed implementation head:** `126db279438da197435ac98d96978085800d9572`

> No credential, carrier, DPAPI call, vendor call or product code is involved in this record. It
> decides vocabulary and disclosure only.

---

## 1. Context and problem statement

Three separate defects make D-7 necessary, and all three are recorded in the roadmap as blockers:

* **B-5 — the vocabulary cannot express a live provider.** `ServiceHealth.liveProviderConnectivity`
  and `.providerQualification` are **literal types** (`'NOT_CHECKED_PRE_ACCESS'`,
  `'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED'`, `src/providers/dhan/dhan_market_data_service.ts:59-70`), and
  IPD's transport client rejects any other value as `MALFORMED_RESPONSE`. IRR already needs
  `CONNECTED_LIVE` and `LIVE_QUALIFIED` (`frontend/server/market-data/dhanHealthState.ts`).
* **B-6 — two sources of truth.** IRR derives readiness from its own environment rather than from IPD.
* **B-15 — diagnostics publish locations.** `describeDhanConfig` renders `accessTokenKeyPath` and
  `clientIdKeyPath` (`src/providers/dhan/dhan_config.ts:284-294`), and IRR copies those `vault://`
  strings into its health report through `secretRefPointersOf`
  (`frontend/server/market-data/dhanHealthTransport.ts:114`). This is too much under the disclosure
  policy.

Without a fixed vocabulary and a fixed disclosure rule, W-03, W-07, W-09 and W-10 would each invent
their own, and the distinction the roadmap insists on — *local credential readiness is not vendor
connectivity* (§8) — would erode the first time a diagnostics view was written.

**What D-7 must therefore fix, and what it must not.** It fixes (a) the state names, their evidence
and their transitions, (b) the exact meaning of an operator "Verify connection" action, and (c) what
diagnostics may and may not say. It changes no code, widens no contract, and claims no capability.

## 2. Decision — provider state model

**Normative vocabulary (exactly these eight states, no aliases, no extras):**

`UNCONFIGURED`, `CONFIGURED`, `CREDENTIALS_RESOLVED`, `AUTHENTICATED`, `OPERATIONAL`, `EXPIRED`,
`DEGRADED`, `UNAVAILABLE`.

`UNCONFIGURED` → `CONFIGURED` → `CREDENTIALS_RESOLVED` → `AUTHENTICATED` → `OPERATIONAL` is the
capability ladder. `EXPIRED`, `DEGRADED` and `UNAVAILABLE` are off-ladder states.

### 2.1 Meaning and justifying evidence

A state is only ever **reported from observed evidence**. "Observed" means: a value this process has
actually read or a response it has actually received. No state may be derived from a prediction, a
configuration default, a previous run, or the fact that a screen was opened.

| State | Meaning | Evidence that justifies it (all conditions) | Evidence class |
| --- | --- | --- | --- |
| `UNCONFIGURED` | No usable credential configuration | `resolveDhanProviderConfig` fails closed; `readiness = 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'`; `missingKeys` non-empty; no valid `SecretRef` pair exists | E1 |
| `CONFIGURED` | References are valid and governed, but no credential material has been read | `readiness = 'CREDENTIAL_REFERENCES_CONFIGURED'`; both `SecretRef`s validate (`WINDOWS_DPAPI`, governed key paths, pinned version); **no** successful carrier read has been observed in this process | E1 |
| `CREDENTIALS_RESOLVED` | The store works: both carriers present, owner-only, intact, decryptable and unexpired | awaited `probeReadiness()` returns `liveResolutionSupported: true`; both carriers pass DACL, schema and metadata validation; DPAPI unprotect returns the values; `expiresAtUtc` is in the future | E1/E3 |
| `AUTHENTICATED` | The vendor **accepted** the credential | at least one authenticated vendor interaction returned an accepting response in this process lifetime, with no later failure | **E4 only** |
| `OPERATIONAL` | The provider is serving market data | `AUTHENTICATED` **and** at least one vendor-sourced market-data response has been served since startup, **and** no latched failure applies | **E4 only** |
| `EXPIRED` | Material is present but unusable by the clock, with no vendor call | carrier metadata `expiresAtUtc` is at or before now, or the carrier status is `REVOKED`/`EXPIRED` — a **local pre-flight** verdict, per D-2 | E1/E3 |
| `DEGRADED` | A vendor interaction was attempted and did not succeed, while the credential is locally valid | credentials locally valid **and** the most recent vendor interaction failed: auth rejected (after D-2's single bounded re-read), transport failure, or vendor error | E4 (for auth/transport) |
| `UNAVAILABLE` | No more specific state applies | the platform/backend cannot resolve credentials at all (`liveResolutionSupported: false` for a non-credential reason), the daemon is not running, or the evidence available is insufficient or contradictory (see §2.3) | E1/E3 |

**`OPERATIONAL` is not `LIVE_QUALIFIED`.** Serving a response says nothing about that response being
correct. Qualification is a separate axis (`providerQualification`) closed only by M2/M3 evidence
(roadmap §8, §10.1). A state of `OPERATIONAL` may be reported while qualification remains
`SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`; the two fields are reported side by side and never merged.

**Local readiness is not connectivity.** `CREDENTIALS_RESOLVED` is the highest state reachable
without a vendor call. W-02's executed 19/19 acceptance run proves the store at class E3; it is
evidence for `CREDENTIALS_RESOLVED` and for nothing above it.

### 2.2 Transitions

| ID | Transition | Trigger (observed) |
| --- | --- | --- |
| T1 | `UNCONFIGURED` → `CONFIGURED` | configuration now resolves and both references validate |
| T2 | `CONFIGURED` → `CREDENTIALS_RESOLVED` | first successful awaited probe read of both carriers |
| T3 | `CREDENTIALS_RESOLVED` → `AUTHENTICATED` | first vendor-accepted authenticated interaction |
| T4 | `AUTHENTICATED` → `OPERATIONAL` | first vendor-sourced market-data response |
| T5 | any → `EXPIRED` | local pre-flight: expiry reached or status revoked/expired |
| T6 | `CREDENTIALS_RESOLVED` \| `AUTHENTICATED` \| `OPERATIONAL` → `DEGRADED` | a vendor interaction fails (§2.1) |
| T7 | `DEGRADED` → `AUTHENTICATED` | a later interaction is accepted, and no auth latch is in force |
| T8 | any → `UNAVAILABLE` | backend/platform incapability, daemon stopped, or insufficient evidence |
| T9 | any → re-derived state | operator restart; the state is re-derived from local evidence only, and no prior vendor state is remembered |

**Forbidden, without exception:**

* any transition that skips a rung — `CONFIGURED` → `AUTHENTICATED`, `CREDENTIALS_RESOLVED` →
  `OPERATIONAL`, `DEGRADED` → `OPERATIONAL`;
* `AUTHENTICATED` or `OPERATIONAL` without an observed vendor success in this process lifetime;
* a transition caused by a screen open, a status poll, or a timer (the roadmap rule: Status **reads**
  the last observed state and never calls the vendor on screen open);
* a transition derived from local readiness alone (`CREDENTIALS_RESOLVED` → `AUTHENTICATED` on the
  strength of a DPAPI probe);
* recovery out of a **latched** auth failure without operator intervention (D-2: re-provision plus
  restart).

### 2.3 Fail-closed rule (normative)

**Insufficient, ambiguous or contradictory evidence reports the least capable applicable state, and
never a more capable one.** Concretely:

1. Unknown or absent evidence → `UNAVAILABLE`.
2. A vendor success older than the current process lifetime is not evidence; after restart the state
   is re-derived locally and may only reach `CREDENTIALS_RESOLVED` (T9).
3. A readiness probe that succeeds while a required carrier fails metadata validation is **not**
   `CREDENTIALS_RESOLVED`: the stricter check wins and the state stays `CONFIGURED` with the failure
   code published.
4. A credential that is expired is `EXPIRED`, even if it was accepted earlier — expiry is evaluated
   before any attempt, and an expired credential produces **no** vendor call (D-2).
5. A latched auth failure stays `DEGRADED` until operator intervention; the daemon must not
   auto-recover.

## 3. Decision — "Verify connection" semantics

The operator action exists so that *"is this working?"* can be answered without pretending that a
local store check answers it. Two distinct verifications are defined and must never be conflated:

| | **V1 — Local readiness verification** | **V2 — Authenticated vendor verification** |
| --- | --- | --- |
| What runs | awaited `probeReadiness()` on the configured backend | exactly **one** authenticated request to a vendor endpoint that requires the credential |
| Uses the network | no | yes, one request |
| Proves | the carriers are present, owner-only, schema-valid, unexpired and decryptable; the store works | the vendor accepted the credential **at that instant** |
| Does **not** prove | that Dhan accepts the credential; that any market data is reachable | that a quote or series is correct, mapped or qualified; that quotes/history work |
| Highest state it can justify | `CREDENTIALS_RESOLVED` | `AUTHENTICATED` |

**Rules (normative):**

1. **Operator-initiated only.** No screen open, status poll, scheduled timer or startup path may
   trigger V2. (Startup performs V1 only — W-03's awaited probe.)
2. **V2 is exactly one request.** No retry, no loop, no follow-up call, and **no credential re-read**:
   V2 uses the material already resolved in memory. D-2 governs re-reads and lists its four permitted
   triggers; "verify connection" is not one of them, and D-7 deliberately does not add a fifth.
   This is narrower than D-2's single bounded re-read on a *market-data* 401/403 and is chosen for the
   same reason D-2 gives: retrying the same rejected credential cannot recover authentication.
3. **Outcomes are enumerated and sanitised** — exactly these codes, no free text:

| Outcome code | Meaning | State effect |
| --- | --- | --- |
| `VERIFIED_VENDOR_ACCEPTED` | V2 returned an accepting response | → `AUTHENTICATED` (if not already) |
| `VERIFIED_LOCAL_ONLY` | V1 succeeded; no vendor call was made | → `CREDENTIALS_RESOLVED` |
| `AUTH_REJECTED` | V2 returned 401/403 | → `DEGRADED` (latched per D-2 if the replacement material is also rejected) |
| `EXPIRED_LOCAL` | pre-flight expiry; no vendor call was made | → `EXPIRED` |
| `NOT_ATTEMPTED_NOT_READY` | local readiness is false; nothing was attempted | → stays `CONFIGURED`/`UNAVAILABLE` |
| `FAILED_TRANSPORT` | timeout, DNS, TLS or connection failure | → `DEGRADED` |
| `FAILED_VENDOR_RESPONSE` | unexpected status or unparseable response | → `DEGRADED` |

4. **What is recorded.** `lastVerifiedAtUtc`, the outcome code, the failure category, and the latency.
   Never a value, a ciphertext, a path, a `vault://` reference, or raw child/HTTP bodies.
5. **Prohibited representation.** A successful DPAPI probe (V1) — including W-02's 19/19 run — must
   **never** be presented as authentication, as vendor connectivity, or as live market-data access.
   The evidence ladder (roadmap §8) is explicit that a credential decryption proves only that the
   store works.

## 4. Decision — diagnostics disclosure policy

**Rule of construction: the MAY list is exhaustive.** Anything not on it is prohibited; there is no
"reasonable equivalent" clause. A new field requires an amendment to this record, not a judgement
call at implementation time.

### 4.1 MAY be exposed

| Field | Where | Notes |
| --- | --- | --- |
| Backend identifier (`vaultBackendId`) | startup line, diagnostics, health | an identifier, not a location |
| Backend readiness (supported / not supported) | startup line, diagnostics | `liveResolutionSupported` |
| Credential-resolution outcome as an **enumerated code** | startup line, diagnostics, health | e.g. `CREDENTIALS_UNAVAILABLE`, `CREDENTIALS_EXPIRED`, `CONFIGURATION_INCOMPLETE` |
| Provider state (the §2 vocabulary) | health, diagnostics, Status | one of the eight names |
| Connectivity state and qualification state | health, diagnostics, Status | reported separately, never merged |
| Last successful interaction timestamp | diagnostics, Status | ISO-8601 UTC |
| Last failure **category** | diagnostics, Status | from the §2.1/§3 enumerations |
| Latency | diagnostics, Status | milliseconds |
| Request counters | diagnostics | counts only |
| Mapping count (`qualifiedMappingsLoaded`) | startup line, diagnostics | a count, never the rows |
| Daemon status, loopback bind address and port | startup line, health | endpoint only; this is not a secret-store location |
| Egress mode (`vendorEgressMode`) | startup line, diagnostics | `DISABLED_PRE_ACCESS` / `IPD_SERVER_HTTPS` / `SYNTHETIC_INJECTED` |
| Process/service availability (`service: UP/DOWN`) | health | |

### 4.2 MUST NOT be exposed — in any surface, in any form, including logs, errors, HTTP bodies, bundles

1. Secret values, tokens, or **any prefix or substring** of them. This prohibition is about
   *intentional* disclosure and remains absolute: no surface may emit a secret, a token, or a prefix or
   substring of one. It is **not** a claim that a byte-for-byte match is mathematically impossible: a
   randomly generated identifier (for example a UUID under §4.6) may, by coincidence, contain a
   character run that also occurs inside a secret. See §4.10 for the clarification that governs how such
   a coincidence is classified, and for the requirements on identifier generation and on untrusted
   input. A coincidental overlap is not intentional disclosure **only** where the identifier was
   generated independently, with no inspection of the secret (§4.10 rules 1–4).
2. `vault://` references, of either secret.
3. Carrier file names, paths or directories; the carrier root; the store directory.
4. Any secret-store metadata from which a local sensitive location can be derived.
5. Raw child-process output (stdout or stderr) that could contain credential material. W-02's rule
   stands: the stderr **byte count** may be recorded; the bytes may not.
6. DPAPI ciphertext, or any encoding of it. **Decided here, explicitly:** ciphertext is not needed to
   diagnose any failure the enumerated codes do not already name, so it is prohibited rather than
   merely optional.
7. Environment dumps and exception messages that can embed paths (`_$_.Exception.Message` may not be
   echoed without a whitelist; the runner's `Get-IipsFailureCode` whitelist is the model).
8. Any credential material in argv, a temporary file, or a shell history line (W-02 guarantee,
   restated here because diagnostics is the usual place it is lost).

### 4.3 Per-surface rendering (so W-03/W-09/W-10 need no judgement calls)

| Surface | Renders | Never renders |
| --- | --- | --- |
| Daemon startup line | loopback URL, `providerReadiness` code, `vaultBackend`, `liveCredentialResolution`, `vendorEgress`, `qualifiedMappings`, **provider state** | paths, `vault://`, values, child output |
| `ServiceHealth` (W-07 widens the literals) | `service`, `providerConfiguration`, connectivity, qualification, **provider state**, last-success/last-failure category | anything in §4.2 |
| `/v1/diagnostics` (W-09) | the whole §4.1 set | the whole §4.2 set |
| Logs | enumerated codes, counters, timings, `win32=` codes | exception text, paths, payloads |
| Error responses | `DhanFailure` codes and the vault `reason`/`code` enumerations | underlying messages, stack traces carrying paths |

### 4.4 Superseded behaviours (named, per the roadmap's verification requirement)

| Behaviour | Location | Status |
| --- | --- | --- |
| `describeDhanConfig` returns `accessTokenKeyPath` / `clientIdKeyPath` | `src/providers/dhan/dhan_config.ts:284-294` | **Superseded.** W-03 removes the key-path material from this output. Until W-03 lands, no new surface may consume or republish these fields |
| IRR copies `vault://` pointers into its health report via `secretRefPointersOf` | IRR `frontend/server/market-data/dhanHealthTransport.ts:114`, used at `:189` and `:206` | **Superseded.** W-10 stops publishing them; this record does not modify IRR |

### 4.5 Amendment record — W-24 owner decisions (2026-11-20)

**Authority for this amendment.** The six decisions recorded in §4.6–§4.10 are the owner decisions
recorded in `ramkivs/iips-review-recovered`, file
`docs/integration/DHAN-W24-OWNER-DECISION-PROPOSAL-2026-11-21.md` (+137 lines), plus a +2/−0 line in
`DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`, as merged at immutable commit
**`001848e9c81a4049cc1f6ea2664250ba6351c610`** (merge of IRR PR #611). That commit is the authority;
this section records it. The IRR record is not modified, and this record does not speak for IRR.

**What this amendment does and does not do.**

* It **adds** decisions: structured diagnostic events (§4.6), their closed failure enumeration (§4.7),
  the in-memory rings (§4.8), the permitted correlation surfaces and operator-reader safeguards (§4.9),
  and the clarification of the §4.2 substring rule (§4.10).
* It **does not** replace, relax or re-open §4.1–§4.4. The §4.1 MAY list remains **exhaustive for the
  surfaces §4.3 governs**. §4.6–§4.10 define a *separate* structured-event surface with its own
  exhaustive allowlist; an event field is not thereby added to the §4.1 list, to `/v1/diagnostics`
  (W-09-as-scoped-in-§4.3), to `ServiceHealth`, or to the public Status.
* It **does not** change the owner of D-7 (§ header), the acceptance criteria of §9, or the status of
  §11/§12. **IRR-side acceptance is still outstanding** (§12 U-1, U-3).
* It **does not** establish M4 (§12 U-4) and **authorizes no implementation** (§11). W-24 remains open.
  The M4 *interpretation* has since been formally recorded on IRR main
  (`001848e9c81a4049cc1f6ea2664250ba6351c610`, §10.3), which resolves that question only; **M4 acceptance
  remains not established**.

### 4.6 Structured diagnostic events and correlation identifiers

An internal structured diagnostic event, if and when W-24 is implemented, consists of **exactly** the
following fields and no others. The field set is closed: adding a field requires a new owner decision,
not an implementation choice.

| Field | Kind | Permitted values / form |
| --- | --- | --- |
| `schemaVersion` | literal | the event-schema version |
| `timestampUtc` | literal | ISO-8601 UTC |
| `component` | enum | `IRR` \| `IPD` |
| `operation` | enum | `QUOTE` \| `HISTORY` \| `FRESHNESS` |
| `event` | enum | `ACTION_START` \| `ACTION_END` \| `REQUEST_ADMITTED` \| `REQUEST_END` \| `CACHE_HIT` \| `WORK_START` \| `WORK_JOIN` \| `ATTEMPT_START` \| `ATTEMPT_END` \| `TIMEOUT` \| `LATE_COMPLETION` |
| `actionId` | identifier | opaque, lowercase UUIDv4 |
| `workId` | identifier | opaque, lowercase UUIDv4 |
| `attemptId` | identifier | opaque, lowercase UUIDv4 |
| `outcome` | enum | `SUCCESS` \| `FAILURE` \| `TIMEOUT` \| `NOT_ATTEMPTED` \| `UNKNOWN` |
| `failureCategory` | enum | one value from the closed enumeration in §4.7 |
| `durationMs` | number | milliseconds, non-negative |
| `sequence` | number | monotonically increasing within a ring |

1. **Three opaque identifiers, never derived from payloads.** `actionId`, `workId` and `attemptId` are
   independently generated lowercase UUIDv4 values. Each is opaque: it identifies a unit of work and
   nothing else. It must not be derived from, hashed from, or computed over a credential, a payload, a
   DTO, a business identifier, a URL, a path or a header value (§4.2).
2. **D01 correlation.** In the D01 quote path, `traceId` identifies the **current** action and
   `correlationId` identifies the **original producer** of the data. They are distinct roles and must
   not be collapsed into one value.
3. **No retroactive provenance.** Implementing correlation **does not** permit mutating provenance that
   is already cached, and **does not** permit inventing provenance for D02. Where D02 has no producer
   correlation, it reports none (§4.10's rules on absence apply by extension); a value is never
   fabricated to fill the field.
4. **Size ceiling.** A single serialized event must not exceed **1 KiB**. An event that would exceed the
   ceiling is truncated by dropping optional numeric fields or is dropped — never by trimming into, or
   quoting from, a prohibited value (§4.2).

### 4.7 Closed failure enumeration

`failureCategory` is drawn from this **closed** set of thirteen values:

`VALIDATION_ERROR`, `AUTHENTICATION_FAILED`, `AUTHORIZATION_FAILED`, `CONFIGURATION_ERROR`,
`READINESS_FAILED`, `IDENTITY_REJECTED`, `RATE_LIMITED`, `CACHE_ERROR`, `TRANSPORT_ERROR`,
`PROVIDER_ERROR`, `TIMEOUT`, `CONTRACT_MISMATCH`, `INTERNAL_ERROR`

1. **Unknown maps to `INTERNAL_ERROR`.** Any condition the enumeration does not name is recorded as
   `INTERNAL_ERROR`. It is never mapped to a free-text message, and never to a category chosen for
   appearance.
2. **No message pass-through.** The category is the whole payload. Underlying exception text,
   child-process output, paths and URLs remain prohibited (§4.2 items 1–8) and are not "the detail" of
   a category.
3. An earlier, different enum considered during W-24 is **superseded** by this list and is retained, if
   at all, as history only. It must not be implemented.

### 4.8 In-memory rings

| Holder | Capacity | Storage |
| --- | --- | --- |
| IRR | **512** events | process-lifetime memory only |
| IPD | **1,024** events | process-lifetime memory only |

1. **Memory only.** Rings live for the lifetime of the process and are lost on exit. They are never
   persisted.
2. **No disk, no external sink.** No ring content may be written to a file, a log file, a database, a
   message bus, an external collector, a crash dump or a telemetry endpoint. The prohibition is on the
   *sink*, not on the transport used to reach it.
3. **Oldest-event eviction.** At capacity, the oldest event is evicted. Rings do not grow, do not spill,
   and do not block the writer.
4. Ring contents are internal. Exposing them is permitted only through the operator readers in §4.9 and
   is otherwise prohibited.

### 4.9 Permitted correlation surfaces and operator-reader safeguards

**Permitted surfaces.** Correlation metadata may appear only on these surfaces:

1. **Internal IRR↔IPD trace headers**, on the internal hop between the two repos — not on any edge to a
   third party.
2. **D01 `traceId` / `correlationId`**, per §4.6 rule 2.
3. **An IRR response action reference** — the identifier by which an IRR response refers back to the
   action that produced it.
4. **Separately authenticated, loopback-only operator readers** for the rings in §4.8.

**Binding prohibitions carried forward from this amendment's authority** (unchanged, not narrowed):

* No secret, token, `vault://` reference, path, URL, header, payload, DTO, business identifier, hash of a
  business identifier, or arbitrary exception / child-process text may appear in an event or a ring.
* **No trace metadata and no trace headers may be sent to Dhan.** Correlation is internal to IRR↔IPD.
* **W-09 diagnostics as scoped in §4.3 and the public Status are unchanged.** They do not gain the rings,
  the events, or the identifiers defined here.
* **The browser has no access** to a ring and no access to a reader bearer token.

**Reader safeguards (binding on any implementation).** Each operator reader must:

1. **Reuse the existing operator bearer** credential rather than mint a new one;
2. **Verify in constant time**, so a failing comparison leaks no timing signal;
3. **Bind loopback-only** — no non-loopback origin is served, and the check is on the bound socket, not on
   a header that a caller can set;
4. Be **read-only**: no mutation, no eviction control, no ring reset;
5. Be **never exposed to a browser**, directly or via any proxy the product ships;
6. Have **no unauthenticated fallback** — a missing or unverifiable credential fails closed, and there is
   no debug, localhost-exempt or "trusted network" bypass.

### 4.10 Clarification of the §4.2 substring rule

§4.2 item 1 prohibits emitting a secret, a token, or a prefix or substring of one. This subsection states
what that prohibition does and does not claim. It **adds no permission** and **removes none**.

1. **Coincidence is not disclosure.** A randomly generated identifier may contain a character run that
   also occurs inside a secret. Where the identifier was generated independently and no secret was
   inspected in order to produce or validate it, such a coincidental overlap is **not** intentional
   disclosure and is not a breach of §4.2 item 1.
2. **Not a zero-overlap guarantee.** This clarification is **not** a claim that overlap is mathematically
   impossible, and no implementation may advertise, test for, or rely on a guaranteed zero-overlap
   property. Absolute prevention cannot be achieved by choosing an identifier format.
3. **Never inspect a secret to generate or validate an identifier.** Identifier generation must not read
   secret material, and validation must not compare an identifier against secret material. Doing so would
   convert a coincidental overlap into a disclosure and would itself breach §4.2.
4. **The intentional-disclosure prohibitions are preserved in full.** Deliberately embedding, encoding,
   hashing or salting a secret into an identifier remains prohibited. §4.10 does not authorize
   intentional disclosure and must not be cited as if it did.
5. **Canary tests are retained.** The existing tests that place a canary secret in the environment and
   assert it never appears in a surface must be kept and must continue to pass. They test for
   *intentional* disclosure; they must not be rewritten to assert universal substring absence, which
   rule 2 disclaims, and they must not be deleted.
6. **Trusted generation, untrusted input.** Identifiers minted inside the process must come from a
   trusted generator (the platform UUID facility). Identifiers arriving from transport are **untrusted**
   and must be validated before use — but **UUID syntax validation alone does not prove independent
   generation**: a syntactically valid UUID could have been constructed *from* a secret by another party.
   Input identifiers are therefore treated as opaque correlation handles only: they are never used to
   build a secret, never compared against secret material, and never echoed into a surface that §4.2
   governs.

## 5. Security and fail-closed requirements (binding on every implementing item)

1. **W-02's non-exposure guarantees are preserved unchanged**: stdin-only input, stdout-only reading,
   stderr reduced to a byte count, no secret in argv, no temporary file, no secret in a log, error or
   diagnostic.
2. **Enumerated codes only** for credential and provider outcomes; no message pass-through.
3. **Non-locating readiness summaries** (`prerequisiteSummary`) remain non-locating; adding a field
   that locates the store is a policy breach, not a feature.
4. **Fail-closed defaults**: an unknown selector, an unparsable state, or a missing observation
   yields the least capable state (`UNAVAILABLE`), never a permissive one.
5. **Separate axes**: connectivity, qualification and freshness are three fields; collapsing any pair
   is prohibited because each is closed by different evidence (roadmap §8).
6. **No vendor call from a read-only surface.** Status and diagnostics are read-only by construction.

## 6. Non-goals and explicit limitations

* **No implementation.** No selector, no widened contract, no `/v1/diagnostics`, no IRR change is
  introduced by this record.
* **No new capability, no vendor call, no credential use** — none was made while writing it.
* **Does not decide:** W-09's HTTP shape, W-15's screen wording, freshness semantics (D-3), D-02
  precedence (D-4), bid/ask representation (D-5), token acquisition (D-6).
* **Does not claim:** authentication, live market data, qualification, or production readiness.
* **At-rest limitation (carried from D-1, restated):** DPAPI user scope protects the secret at rest
  against other users, offline disk inspection and file copying; it does **not** protect against
  another process running as the same Windows user. Nothing here may read as claiming otherwise.
* **Not a security boundary by itself.** D-7 governs disclosure; it does not add encryption,
  authentication or access control beyond what W-01/W-02 already provide.

## 7. Consequences and dependencies

| Item | Effect of this decision |
| --- | --- |
| **W-03** (next) | emits the provider state in the startup line and diagnostics, publishes only §4.1 fields, and **removes** the key paths from `describeDhanConfig` (§4.4) |
| **W-07** | widens `ServiceHealth`'s literal types to the §2 vocabulary and the connectivity/qualification values IRR already expects (`CONNECTED_LIVE`, `LIVE_QUALIFIED`), keeping state, connectivity and qualification as separate fields |
| **W-08** | records last-success timestamp, last failure category and latency — the §4.1 fields that make the model observable |
| **W-09** | renders the §4.1 set at `/v1/diagnostics`, and nothing from §4.2 |
| **W-10** | maps IPD state to the IRR screen vocabulary (§8) and stops publishing `secretRefPointers` |
| **W-06 / M1** | must produce E4 evidence for `AUTHENTICATED`; nothing in D-7 substitutes for it |
| **D-2** | unchanged; V2 adds no re-read trigger (§3 rule 2) |
| **D-1 / W-02** | unchanged; the readiness gate supplies the evidence for `CREDENTIALS_RESOLVED` |

## 8. IRR mapping (so W-10 needs no judgement call)

IRR's screen vocabulary is `UNAVAILABLE | PRE_ACCESS | DISCONNECTED | AUTHENTICATED | OPERATIONAL`
(`frontend/server/market-data/dhanHealthState.ts:79-87`). IPD state maps as follows, and the mapping is
total:

| IPD state | IRR screen state | Note |
| --- | --- | --- |
| `UNCONFIGURED` | `UNAVAILABLE` | nothing configured |
| `CONFIGURED` | `PRE_ACCESS` | references valid, no material read |
| `CREDENTIALS_RESOLVED` | `PRE_ACCESS` | credential-ready detail travels as the resolution code, never as a location |
| `EXPIRED` | `PRE_ACCESS` | expired credential cannot attempt access; the code reads `CREDENTIALS_EXPIRED` |
| `DEGRADED` | `DISCONNECTED` | IRR's definition — attempted and failed — matches exactly |
| `AUTHENTICATED` | `AUTHENTICATED` | E4 evidence only |
| `OPERATIONAL` | `OPERATIONAL` | E4 evidence only; qualification still reported separately |
| `UNAVAILABLE` | `UNAVAILABLE` | including "insufficient evidence" |

IRR keeps its not-attempted-versus-disconnected correction: `PRE_ACCESS` must never be rendered as
`DISCONNECTED`.

## 9. Acceptance criteria for D-7 itself

1. The eight states are named exactly as the roadmap names them, with an evidence rule and a set of
   exits for each (§2.1, §2.2).
2. Forbidden transitions are enumerated and include every skip and every screen-open-driven change
   (§2.2).
3. The fail-closed rule is normative and covers absent, stale, contradictory and expired evidence
   (§2.3).
4. Local readiness and vendor connectivity are separated by evidence class, and a DPAPI probe may
   never justify `AUTHENTICATED` (§2.1, §3 rule 5).
5. "Verify connection" is defined as V1 and V2 with enumerated outcomes, exactly one vendor request,
   no retry and no credential re-read (§3).
6. The disclosure policy is two explicit lists, the MAY list is exhaustive, and the superseded
   behaviours are named with their locations (§4).
7. W-03, W-07, W-09 and W-10 can each be implemented without a further judgement call (§4.3, §7, §8).
8. No implementation is introduced by the decision (§6, §11).

## 10. Supporting evidence and implementation references

| Reference | What it establishes |
| --- | --- |
| `src/providers/dhan/dhan_market_data_service.ts:59-70` | the current literal `ServiceHealth` (B-5 input) |
| `src/providers/dhan/dhan_config.ts:53-68, 284-294` | `DhanCredentialReadiness` vocabulary and the key-path output W-03 removes (B-15) |
| `src/providers/dhan/dhan_local_vault_resolver.ts:47-63, 97-101` | reason/mapped-code taxonomy and `LocalHostVaultBackendReadiness` |
| `src/providers/dhan/dhan_local_daemon.ts:78-91, 203-213` | `MarketDataDaemonDiagnostics` and the startup line fields |
| `docs/integration/DHAN-W02-WINDOWS-DPAPI-BACKEND-2026-11-12.md` | the accepted backend, readiness gate and failure taxonomy |
| `docs/integration/DHAN-W02-WINDOWS-ACCEPTANCE-EVIDENCE-2026-11-12.md` §B, §F | the executed 19/19 Windows run (E3) and the W-02 gate decision |
| IRR `frontend/server/market-data/dhanHealthState.ts`, `dhanHealthTransport.ts` | IRR's vocabulary and the `secretRefPointers` output (read-only; not modified) |

## 11. Decision versus implementation authorization

**This record is a governance decision.** It fixes vocabulary, semantics and disclosure, and thereby
removes the judgement calls that would otherwise land in W-03, W-07, W-09 and W-10.

**It authorizes no implementation.** Adding the selector (W-03), widening `ServiceHealth` (W-07),
recording provider state (W-08), serving `/v1/diagnostics` (W-09) or changing IRR (W-10) each requires
that item's own implementation authorization under roadmap §11 and the operating rules in force.
Nothing in this record may be cited as authority to change code.

## 12. Unresolved — requiring authority this record does not have

| # | Question | Choices and consequences | Required authority | Blocks W-03? |
| --- | --- | --- | --- | --- |
| U-1 | Does IRR accept this vocabulary and disclosure policy? The roadmap's exit criterion is *"model and disclosure policy accepted by both repos"* | Accept → W-10 may implement the §8 mapping. Reject → W-10 needs a revised mapping, and this record is amended; IPD-side work is unaffected | **IRR owner** (IRR is not modified by this record, and no IRR modification is authorized here) | **No.** W-03 is IPD-only and consumes the IPD half |
| U-2 | Is the operator "Verify connection" action surfaced in the UI at all? The roadmap says such an action *may* perform one authenticated probe | Surface it → the §3 semantics bind it (W-09/W-15 work). Do not surface it → the semantics remain dormant and nothing else changes | **Operator / product authority**, inside W-09/W-15 scope | **No.** §3 fixes semantics only if the action is built |
| U-3 | Does IRR accept the **2026-11-20 amendment** (§4.5–§4.10), including the §4.10 substring clarification? | Accept → the W-24 disclosure model is jointly accepted and W-24 implementation may be considered under §11. Reject or qualify → this record is amended again and the amendment is not binding on IRR | **IRR owner.** The owner decisions at `001848e9…` record the owner's intent; this IPD amendment is **awaiting IRR acceptance** and is not accepted on IRR's behalf | **No.** W-03 remains IPD-only and does not consume §4.6–§4.10 |
| U-4 | **Resolved 2026-11-20 — interpretation recorded; acceptance still not established.** Has the M4 Dhan leg been formally defined as IPD-local transport-attempt evidence? | Now recorded → the IRR-generated `actionId` must reach IPD and be associated with IPD's local Dhan egress-attempt record. This demonstrates the local handoff and the locally observed outcome; it **does not prove Dhan received or processed the request**. No trace header or parameter is sent to Dhan, and vendor-side correlation is not required. The interpretation **changes no M4 criterion, dependency or status** | **Resolved by the roadmap owner** — recorded in IRR at immutable commit **`001848e9c81a4049cc1f6ea2664250ba6351c610`**, §10.3 (*Exit criteria*, +2/−0). That commit is not modified by this record, and this record does not speak for IRR | **No.** W-03 does not depend on M4 |

No other question remains open: everything else D-7 must decide is prescribed by the roadmap and
recorded above.

**Standing status after the 2026-11-20 amendment:** W-24 is **open**; this IPD amendment is **awaiting IRR
acceptance** (U-3); M4 acceptance is **not established** (U-4); and W-24 implementation is **not
authorized** (§11). None of the four items above is closed by the amendment.

**M4 interpretation, stated separately so it is not read as acceptance.** Four distinct things are often
conflated, and only the first is settled:

1. The **M4 interpretation** — that M4's Dhan leg means IPD-local transport-attempt evidence — is
   **formally recorded on IRR main** at immutable commit `001848e9c81a4049cc1f6ea2664250ba6351c610`
   (§10.3). This resolves the *interpretation question* only.
2. This **IPD D-7 amendment** is **awaiting IRR acceptance** (U-3). Recording the interpretation is not
   IRR's acceptance of this amendment.
3. **M4 acceptance is NOT ESTABLISHED.** No M4 exit criterion has been met or demonstrated, and no
   attempt evidence may be cited as satisfaction of M4. The interpretation changes no M4 criterion,
   dependency or status.
4. **W-24 implementation is NOT AUTHORIZED** (§11).

## 13. Relationship to W-03 (the next item)

W-03 · *Add daemon backend selection and honest egress diagnostics* lists **D-7** as a prerequisite.
This record satisfies it for IPD by fixing: the state vocabulary and its evidence (§2), the
fail-closed rule (§2.3), the disclosure MAY/MUST NOT lists and per-surface rendering (§4.3), the
superseded key-path outputs W-03 must remove (§4.4), and the guarantee that no diagnostics field may
locate the store (§5).

W-03 remains **unimplemented**. This record introduces no selector, no environment variable, no
diagnostics field and no code path.
