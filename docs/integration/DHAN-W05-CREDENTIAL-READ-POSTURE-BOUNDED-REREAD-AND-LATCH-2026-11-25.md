# W-05 — Credential Read Posture, Bounded Re-read and Authentication Latch

- **Work item:** **W-05** (DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11, v1.1)
- **Repository:** IPD (`ramkivs/iips-production-market-data`)
- **Branch:** `arena/f93e947f-iips-production-market-data`
- **Date:** 25 November 2026
- **Dependency satisfied:** D-2 (credential read posture) · W-02 (DPAPI backend) — both previously accepted
- **Blocker addressed:** **BLK-5**
- **Milestone contribution:** **M4** (W-05 is an explicit M4 conjunct)
- **Live vendor request made by this work item:** **no.** Every verification is synthetic and offline.
  No credential was read, generated, rotated or transmitted; no Windows host was touched.

---

## 1. The controlling decision, quoted

D-2 is an **IRR** decision and was not re-decided here. Its scope text
(`docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`, section D-2) is the
authority, and the operative clauses are reproduced verbatim because the implementation is a direct
transcription of them:

> **Posture.** Resolve at daemon start after config validation; hold the material only in IPD process
> memory; clear on shutdown.
> **Permitted re-read triggers (exhaustive):** (a) daemon start; (b) crossing the token `expiresAt`
> boundary; (c) exactly **one** bounded re-read following an HTTP 401/403 on a request; (d) explicit
> operator restart.
> **Prohibited:** re-read on any other event; any loop; any re-read keyed on a transient failure code.
> **Expired vs invalid.** `CREDENTIALS_EXPIRED` is a *local, pre-flight* determination (known expiry
> or REVOKED/EXPIRED status) and results in **no vendor call**. `AUTHENTICATION_FAILURE` is a *vendor*
> determination (401/403) and implies the material is present but not accepted.
> **After the single re-read.** If the replacement material is also rejected, the daemon latches a
> failed-auth state, performs **no further re-reads**, stops attempting to recover automatically, and
> surfaces the condition per D-7; only operator intervention (re-provision plus restart) clears it.
> **Rationale to record:** retrying the same expired token can never recover authentication, so no
> retry budget is allocated to auth codes.

W-05's own verification clause, which defines what "done" means:

> **Targeted:** exactly one re-read on 401/403 and zero on success; a second consecutive 401 performs
> no third read and latches; expired pre-flight issues no vendor call; no material in any error, log
> or serialized diagnostic; a latency assertion that repeated quotes do not each pay a vault read.

## 2. Baseline: what existed and what did not

| Component | State before W-05 |
|---|---|
| `dhan_local_vault_resolver.ts` | Complete. Validates SecretRef status, `expiresAt` (strict UTC), version, and maps six distinct failure paths to `CREDENTIALS_EXPIRED`. No caching, no re-read policy — it is a per-call resolver. |
| `dhan_provider_state.ts` | Complete D-7 derivation. Contains `credentialsExpired` and `lastVendorOutcome`, so `EXPIRED` and `DEGRADED` were already derivable. |
| `dhan_provider_state_recorder.ts` | Complete W-08 recorder. Already carried `consecutiveAuthFailures`, `authLatched` and `DHAN_AUTH_LATCH_THRESHOLD = 2`, and blocked post-latch success. |
| `dhan_api_client.ts` | **Called `credentialResolver.resolve()` on every request.** No session, no re-read, no latch enforcement at the credential layer, and a 401 was a terminal failure with no retry. |
| `dhan_credential_session.ts` | **Did not exist.** |

So the W-08 *recording* half was already built (it is a different work item), while the W-05
*policy* half — session, triggers, bounded re-read, latch enforcement — was entirely absent. That is
exactly the residual the roadmap's D-2 row recorded as "the bounded re-read/latch half is W-05".

## 3. Implementation

### 3.1 New module — `src/providers/dhan/dhan_credential_session.ts`

`DhanCredentialSessionHolder` owns the only long-lived reference to credential material and is the
only component permitted to call `resolver.resolve()`. It performs no I/O, creates no timers, and
writes nothing to disk.

| Member | Role |
|---|---|
| `decideForRequest()` | Returns the D-2 trigger that applies, or `reused: true`. Never returns material. |
| `readForTrigger(reason, config)` | Performs one permitted read. Refuses (`DhanCredentialRereadNotPermittedError`) unless the trigger's permission is intact. |
| `consumeAuthRejectionBudget()` | Spends the single 401/403 re-read. Returns `true` exactly once per process. |
| `currentMaterial()` | Hands the caller a **copy** for building per-request headers. |
| `latchAuthFailure()` | Terminal failed-auth state. Also revokes any unspent grant. |
| `latchAuthFailure` / `isAuthLatched` | Read by the client before any read or egress. |
| `describe()` | Disclosure-safe counters, booleans and enumerated codes only. |
| `clear()` | Drops material on shutdown. **Cannot** clear the latch; there is deliberately no API that discards material on demand, because that would be a fifth trigger. |

Two design points carry the weight:

**The grant is separate from the budget.** `authRejectedOnce` records that the single re-read has been
*spent* — so no second one is ever issued — while `rereadGranted` records that the read it authorised
has not yet been *performed*. Collapsing them (an error this work item actually hit and fixed) makes
spending the budget block the very read it exists to permit. The state machine is now explicit.

**Concurrent cold-start readers coalesce.** `readInFlight` serialises readers, so a burst on a cold
daemon performs one read rather than one per request (W05-24). This matters in production precisely
because the read is a DPAPI process spawn.

### 3.2 Changes to `src/providers/dhan/dhan_api_client.ts`

- Owns a `DhanCredentialSessionHolder` (injectable for tests) and exposes
  `getCredentialSessionDescriptor()`. Nothing is read at construction.
- `resolveReadyCredentials(nowMs, forceReread)` keeps every existing local pre-flight guard —
  production refusal, SecretRef status, strict-UTC `expiresAt`, resolved-token deadline — and only
  then consults the session. All of those guards remain **local verdicts with no vendor call**.
- `executeJsonPost` is now a bounded attempt loop. `attempt` starts at 0, increments exactly once,
  and no path resets it, so **at most two vendor attempts can ever occur**. There is no
  `while (true)`. A 401/403 spends the budget and continues; a second rejection latches and returns.
  Every other failure returns immediately — a transient failure is explicitly **not** a re-read
  trigger.
- `probeOnce` (D-7 V2) passes `false`, so it can never spend the market-data re-read budget. D-7 §3
  rule 2 requires V2 to use material already in memory, and this work item preserves that narrowing
  rather than quietly adding a fifth trigger through the verify path (W05-17, W05-18).
- The module header documents the **deliberate deviation from strict per-request resolution**, which
  W-05's scope explicitly requires to be recorded.

### 3.3 Documentation of the deviation (required by W-05 scope)

Recorded in the `dhan_api_client.ts` header: earlier revisions re-resolved credentials per request;
on Windows that is a DPAPI process spawn (~200–500 ms) per quote, which D-2 judged unacceptable. The
deviation is bounded by construction because exactly four events may cause a read, and the latch is a
terminal state reachable only after a rejection has already consumed the single grant.

## 4. Required behavioural verification

| Scenario | Required behaviour | Result |
|---|---|---|
| Successful request | Zero additional credential reads | **W05-02, W05-08** ✔ |
| Vendor returns 401/403 | Exactly one credential re-read | **W05-03, W05-04** ✔ |
| Re-read succeeds | Retry with the new material | **W05-03** — asserts the **second** header carries the rotated token ✔ |
| Second 401/403 | Authentication latch activated | **W05-05, W05-06** ✔ |
| Credential expired at pre-flight | No vendor request | **W05-10, W05-11, W05-12** ✔ |
| Latched authentication state | Correct provider-state transition | **W05-14** — recorder and session latches agree, `consecutiveAuthFailures = 2` ✔ |
| Normal repeated quote requests | Credential reuse without unnecessary vault reads | **W05-02, W05-08** ✔ |
| Latency assertion (W-05 clause) | Repeated quotes must not each pay a read | **W05-08** ✔ — see §4.1 |

### 4.1 The latency assertion, stated precisely

W-05 asks for "a latency assertion that repeated quotes do not each pay a vault read". The assertion
implemented is **structural**: 12 vendor-reaching quote requests, each advancing the clock a day to
defeat the D02 quote cache, must produce exactly **one** vault read, with the amortised cost asserted
as `readsPerRequest <= 1/12`.

This is deliberate. A wall-clock latency figure measured in this sandbox would describe the test
machine and not the decision. The cost D-2 exists to remove is a **read** — on Windows, a process
spawn — so a flat read count across N requests is the property that makes per-quote operation
acceptable, and it is the property that is asserted. A separate wall-clock claim is not made and
should not be inferred.

## 5. Acceptance-criteria evidence

| Criterion | Status | Evidence |
|---|---|---|
| Session holder | **MET** | `DhanCredentialSessionHolder`; W05-01, W05-19, W05-20, W05-24 |
| Bounded re-read | **MET** | Structural attempt bound; W05-03, W05-07 |
| Four permitted triggers | **MET** | (a) W05-01 · (b) W05-09 · (c) W05-03/04/05/06 · (d) process lifetime, no runtime member — pinned by W05-23 |
| Authentication latch | **MET** | W05-05, W05-06, W05-13, W05-14, W05-19 |
| Expired pre-flight handling | **MET** | W05-10, W05-11, W05-12 — zero vendor calls |
| Latency assertion | **MET** | W05-08 (§4.1) |
| Regression tests | **MET** | 25 new cases; 6 pre-existing suites updated to the D-2 policy — see §6 |
| BLK-5 | **RESOLVED** | §7 |
| M4 contribution | **PARTIAL** | §8 |

## 6. Regression coverage and the suites that had to change

**New:** `tests/dhan_w05_credential_session.test.ts` — **25 cases, all passing.**

W05-01 … W05-25 cover: construction purity, zero reads on success, one re-read on 401 and on 403, the
retry carrying the *new* material, latch on the second rejection, budget ownership, the structural
refusal of an unbounded read, the latency assertion, the `expiresAt` boundary, expired pre-flight on
both the resolver and SecretRef paths, latch persistence against a "fixed" vault, recorder/session
agreement, prohibited transient triggers, the recovery path, V2's no-re-read rule, clear-on-shutdown,
zero-plaintext surfaces, governed error mapping, the closed trigger enumeration, cold-start
coalescing, and recorder silence on local outcomes.

**Updated — and this is the substantive point of this record.** Six existing suites asserted the
*pre-D-2* policy, in which an HTTP 401 was terminal and a credential was resolved per request. Those
assertions had to change, because D-2 replaced "never retry" with "retry exactly once after
re-reading". Each change is a re-statement against the decision, not a relaxation:

| Suite | Old assertion | New assertion | Why |
|---|---|---|---|
| `dhan_w08_provider_state_recorder` | 401 → 1 vendor call, quote fails | 401 → 2 calls (rejection + bounded retry), quote **recovers**; added W08-02a for the rejected-replacement case | D-2 (c) |
| `dhan_w08_provider_state_recorder` | latch needed two separate requests | one request produces the whole sequence | D-2 (c) |
| `dhan_w06_first_request_evidence` | "an auth failure is never retried", 1 send | bounded at **2** sends, never the transient 3, latch engaged | D-2 (c) + (0) |
| `dhan_w10_connection_verify_endpoint` | 4 probes → 4 resolver calls | 4 probes → **1** resolver call | D-7 §3 rule 2 |
| `dhan_stage1_admission` | 401 then 429 in sequence | 429 asserted **first**; a 401 now latches and would block the 429 | D-2 latch |
| `dhan_stage1_operational_wiring` | mutate the vault mid-session, expect `CREDENTIALS_EXPIRED` | fresh daemon with an already-expired token | a warm session is **supposed** not to re-read; the old test asserted the behaviour W-05 removes |

No assertion was deleted without replacement, and none was weakened: where a count fell (4 → 1
resolver calls) it is because the decision says it must, and the vendor-call count in that same test
is unchanged at 4.

## 7. BLK-5 resolution

BLK-5 was that D-2's bounded re-read/latch policy had no implementation — the resolver was per-call,
no session existed, and a 401 was terminal with no recovery attempt. **BLK-5 is resolved:**

- a session holder exists and is the only credential path (W05-01, W05-23);
- the four triggers are the only ones implemented, and the enumeration is asserted closed (W05-23);
- exactly one re-read follows a 401/403 and the retry uses the replacement material (W05-03, W05-04);
- a second rejection latches with no third read and no third call (W05-05, W05-06);
- transients are provably not triggers (W05-15);
- expired material produces no vendor call (W05-10, W05-11, W05-12).

D-2's own D-2-row residual — *"the bounded re-read/latch half is W-05 and is not implemented"* — is
now closed by this record.

## 8. M4 contribution — and what is still missing

W-05 is an M4 conjunct. It is now **implemented and verified**, which removes it from M4's list of
outstanding engineering.

M4 is **not** achieved by this work item, and this record does not claim it. M4 remains the
conjunction of M2 ∧ M3 ∧ W-05 ∧ W-07→W-08→W-10 ∧ W-11 ∧ W-19 ∧ W-21 ∧ W-22, and in particular:

- **M2/M2a/M3 are unachieved** — live quote and historical qualification are still outstanding.
- W-05 was never on the M1 path, so this changes nothing about M1.
- This is **synthetic verification (E1/E3), not live qualification.** `providerQualification` remains
  `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`; the credential headers were never sent to Dhan.

## 9. Verification executed

| Gate | Result |
|---|---|
| `npm ci --no-audit --no-fund` | completed, 33 packages |
| `npm run build:tsc` | **exit 0** |
| `dist/tests/dhan_w05_credential_session.test.js` | **25 tests, 25 pass, 0 fail, 0 skipped** |
| `npm test` (guarded full suite) | **2,226 tests, 2,212 pass, 0 fail, 14 skipped**, guard `OK` |
| Baseline before this change | 2,201 tests / 2,187 pass / 14 skipped |
| `npm run build:vite` | **exit 0** |
| `npm run test:package-consumer` | **PASS** — browser bundle `forbiddenHits: []`, strict typecheck PASS |
| `DhanCredentialSessionHolder` in the browser bundle | **absent** — provider-internal, not exported on `./dhan-server` |

The 14 skips are the pre-existing host-gated set (D-5 §6.3 — three pass under CI's
`IIPS_POWERSHELL_RUNTIME_TESTS=1`). `# tests` rose by exactly the 25 cases added.

## 10. Zero-plaintext discipline (AD-17)

Verified by W05-21: the session descriptor, the observed provider state, the failure object and
`health()` are serialized together and asserted to contain none of the access token, the refreshed
token, the client id, the `vault://` reference, the carrier path, `AppData`, the vendor message, the
vendor error code, or `powershell`. W05-22 asserts a throwing resolver is reduced to a governed code
with its message discarded.

The descriptor carries counters, booleans, enumerated codes and the `expiresAt` string — never a
value. `currentMaterial()` returns a copy so a caller cannot mutate held state.

## 11. What W-05 does not do

- It does **not** qualify the provider for live use, and does not change `providerQualification`.
- It does **not** achieve M4 (§8), nor any milestone.
- It does **not** implement credential *acquisition* or *rotation* — D-6 keeps token acquisition
  manual and out of scope; W-04 owns the provisioning utility.
- It does **not** touch the W-02 DPAPI backend, the W-01 vault provider, the D-5 bid/ask contract or
  the D-18 captures.
- It does **not** alter the W-07 transient-retry ladder. Where that ladder retries, it still does;
  W-05 only asserts that a transient never causes a *credential* read.
- It does **not** make any performance claim beyond the read-count assertion in §4.1.
