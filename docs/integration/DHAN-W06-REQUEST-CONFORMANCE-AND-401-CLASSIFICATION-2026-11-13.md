# DHAN W-06 — Request Conformance and 401 Classification (2026-11-13)

**Status:** INVESTIGATION RECORD + CONFORMANCE TESTS. **No vendor request was made in this work item.**
**Starting HEAD:** `a624d06` (re-provisioned checkout; reconciled to `8bbc299` by content identity, §2).
**Repository:** `ramkivs/iips-production-market-data`, branch `arena/84d1e063-iips-production-market-data`.
**Roadmap authority:** IRR `DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` v1.1, W-06.

---

## 1. Executive finding

**The observed `vendorHttpStatus: 401` is not explained by any defect in the request IPD builds. The
request conforms to Dhan's published Market Quote contract field for field, and the status is
credential-class by Dhan's own taxonomy. The remaining causes are operator-controlled at Dhan, and the
single most likely is that the Data API entitlement is not active for this account.**

The evidence that closes the implementation question:

1. **The request is conformant.** Endpoint, method, the two credential headers (names and form), the
   segmented payload, and the absence of a `version` header all match the authoritative documentation
   (§4). Asserted mechanically against the *real* client in `tests/dhan_w06_quote_contract_conformance.test.ts`.
2. **A missing `version` header is not a defect.** In Dhan's documentation `version` is a constructor
   argument of the **websocket** `MarketFeed` client, not an HTTP header on `POST /marketfeed/quote`.
   The documented REST header table lists only `access-token` and `client-id`. The hint in the work
   item was examined and **disproved**, not assumed either way (§5).
3. **`/v2/profile` and `/marketfeed/quote` sit in different API classes, and entitlement is enforced
   per class.** Dhan's annexure (authoritative) defines Trading API errors `DH-901`/`DH-902` and a
   *separate* Data API error table. `DH-902` — "User has not subscribed to Data APIs or does not have
   access to Trading APIs…" — exists precisely because a valid token can be refused a data endpoint.
4. **A 401 can only mean a credential-class refusal** (codes 807/808/809/810), *not* an input error
   (813/DH-905 → 400) and *not* the canonical not-subscribed code (806 → 403). So the payload, the
   security ID and the header shapes are all excluded **by the status itself** (§6).

**Verdict: external, operator-controlled.** No production code change is justified; a "fix" here would
be invention. What IPD *can* do is stop guessing — §8 specifies the precise next action.

---

## 2. Repository reconciliation

The checkout again arrived at `a624d06` with the branch contents present but untracked (61 dirty paths).
As before, nothing was reset or discarded:

- Every dirty path was proven **byte-identical** to its `8bbc299` blob — 0 differences, 0 files in
  `8bbc299` missing locally.
- A SHA-256 manifest of 63 affected files was taken before and after the pointer move: **identical**.
- `git reset --mixed` was used (never writes working-tree files); no `--hard`, no force-push.

The published history was already intact; only this checkout's pointer was stale.

---

## 3. Established live evidence (supplied by the operator)

| Fact | Value |
| --- | --- |
| Daemon | running locally, `127.0.0.1:8791`, Windows DPAPI backend |
| `/v1/health` | HTTP 200, provider configuration `CONFIGURED` |
| Local transport auth | successful (the request reached the service) |
| Dhan credentials | resolved through Windows DPAPI |
| Independent `GET /v2/profile` with the same pair | **HTTP 200, authentication successful** |
| Controlled `POST /v1/quotes` for Reliance | **HTTP 502**, `AUTHENTICATION_FAILURE`, **`vendorHttpStatus: 401`**, elapsed ≈ 14.9 s |
| Second request | **not executed** |

Two facts follow immediately, and both matter:

- `vendorHttpStatus: 401` proves a **vendor response was received** — a `401` from Dhan, not a local
  failure. Correction A is therefore working as designed, and the question the W-06 investigation could
  not answer is now answered.
- `/v2/profile` returning 200 with the same pair proves the pair is **not simply dead**. That is the
  crux of §7: the credential authenticates, yet a data endpoint refuses it.

**Neither fact is a vendor authentication success for the quote API**, and neither may be used as one.

---

## 4. Contract comparison — documented vs. what IPD sends

Authoritative sources: DhanHQ v2 **Market Quote**, **Authentication** and **Annexure** pages.

| Contract element | Dhan documents | IPD sends | Conforms |
| --- | --- | --- | --- |
| Base URL | `https://api.dhan.co/v2` | `https://api.dhan.co/v2` | ✅ |
| Method + path | `POST /marketfeed/quote` | `POST /marketfeed/quote` | ✅ |
| `access-token` header | required, bare token | `access-token: <token>`, no `Bearer` prefix | ✅ |
| `client-id` header | required, lowercase hyphenated | `client-id: <clientId>` | ✅ |
| Content type | `application/json` | `Content-Type: application/json` | ✅ |
| Accept | `application/json` | `Accept: application/json` | ✅ |
| Payload shape | `{ "NSE_EQ": [11536] }` — grouped by segment | `{"NSE_EQ":["2885"]}` | ✅ |
| Segment enum | `NSE_EQ` valid for NSE equity cash | `NSE_EQ` | ✅ |
| `version` header | **not part of the REST contract** | not sent | ✅ (correctly absent) |
| Instrument limit | up to 1000 per request | 1 | ✅ |
| Rate limit | 1 request/second | pre-send limiter | ✅ |

### 4.1 The one deviation, recorded rather than "fixed"

The documented examples show **bare integers** (`[11536]`); IPD emits **JSON strings** (`"2885"`),
because `dhanSecurityId` is typed as a `string` throughout the instrument mapping. Dhan's own Python and
JS SDKs likewise hold security IDs as strings, so this is treated as a deliberate, tolerated deviation.

Critically, it **cannot** be the cause of the observed failure: a malformed security ID produces Data
API **813** or `DH-905`, which Dhan returns as an input error (HTTP 400), not 401. It is recorded in the
conformance suite (`W06C-04`) so it cannot drift unnoticed. It is not "fixed" by guessing at a vendor
contract that the vendor itself demonstrates both ways.

---

## 5. The `version` header hint — examined and disproved

The work item recorded that no `version` header is sent and instructed: *"Do not assume that the missing
version header is the cause."* Following that instruction rather than the temptation:

- Dhan's REST **Market Quote** page documents exactly two headers — `access-token` and `client-id`.
- `version` appears in Dhan's SDK documentation as a **websocket** constructor argument
  (`MarketFeed(dhan_context, instruments, version='v2')`), where it denotes the feed protocol revision.
- No Dhan REST endpoint documents a `version` header.

Adding one would mean inventing a header the vendor does not specify — a change to a contract IPD cannot
authoritatively know. `W06C-05` asserts its continued absence, so a future "helpful" addition is caught.

---

## 6. Why the status alone classifies the failure

The status is credential-class. Working backwards from Dhan's authoritative annexure:

| Possible cause | Vendor signal it would produce | Observed? |
| --- | --- | --- |
| Not subscribed to Data APIs | `806` → **403** | ❌ (we saw 401) |
| Expired token | `807` → 401 | possible |
| Client ID *or* access token invalid | `808` → 401 | possible |
| Access token invalid | `809` → 401 | possible |
| Client ID invalid | `810` → 401 | possible |
| Trading-API equivalent | `DH-901` → 401 | possible |
| Bad security ID | `813` / `DH-905` → 400 | ❌ excluded |
| Malformed request | `814` / `DH-905` → 400 | ❌ excluded |
| Rate limit | `805` / `DH-904` → 429 | ❌ excluded |
| Server fault | `800` / `DH-908` → 5xx | ❌ excluded |

So: the payload shape, the segment, the security ID and the header framing are **excluded by the
observed status**, not merely by inspection. That is a stronger conclusion than "the code looks right".

**The honest limit.** Dhan's numeric status cannot separate **807/808/809/810/DH-901** from one another;
only the vendor's **error code** (in its response body) does. IPD deliberately does not read or reflect
that body — a decision this record does **not** propose reversing, because a Dhan auth error body is
exactly the payload most likely to echo token fragments. §8 resolves the ambiguity without it.

---

## 7. Why `/v2/profile` succeeds while `/marketfeed/quote` fails

Four candidate explanations, ranked, with the evidence for each:

### H1 — The Data API subscription is not active — **MEDIUM-HIGH**

- **For:** Dhan sells Trading APIs free and Data APIs as a paid subscription (₹499 + GST/month). The
  annexure defines a dedicated not-subscribed code (`806`) and Dhan's Trading-API `DH-902` says "User
  has not subscribed to Data APIs **or** does not have access to Trading APIs". `/v2/profile` is a
  Trading-class endpoint: it needs *authentication only*, no data entitlement. `/marketfeed/quote` is a
  Data-class endpoint: it needs *authentication **and** entitlement*. A valid pair therefore behaves
  exactly as observed — 200 on profile, refusal on quote.
- **Complication:** the canonical not-subscribed code is `806`, which Dhan maps to **403**. IPD observed
  **401**. So either the account's refusal is being surfaced under a credential-class code (which Dhan's
  forums show happening), or the cause is genuinely credential-class and H2/H3 apply.
- **Unverifiable locally:** entitlement is an account fact.

### H2 — The token was generated as a "Trading API" token — **MEDIUM**

- **For:** Dhan has multiple token-generation paths (web UI, API-key/TOTP flow, `RenewToken`). Dhan has
  previously returned "Invalid Token"-class errors for tokens that were valid for one API class and not
  another (documented in Dhan's own forum support responses).
- **Against:** not documented as a distinct token scope; speculative.

### H3 — The pair is stale or mismatched in a way `/v2/profile` tolerates — **LOW-MEDIUM**

- **For:** a token can expire between two observations; the quote request was ~14.9 s and could span a
  boundary in principle.
- **Against:** `profile` succeeded shortly before with the same pair; a 24-hour token expiring in that
  window is unlikely, though not impossible.

### H4 — An implementation defect in the quote request — **LOW (effectively excluded)**

- **Against:** §4 shows conformance field for field; §6 shows input-class defects would return 400, and
  a missing entitlement returns 403, neither of which is 401.

### 7.a The 14.9 seconds

Not evidence of retry ambiguity this time: `AUTHENTICATION_FAILURE` is not in `TRANSIENT_CODES`, so
`withBoundedRetry` does not retry it. The elapsed time is dominated by the per-request DPAPI child-process
round-trip plus TLS setup on a cold connection, not by repeated sends. It is recorded, not explained.

---

## 8. Required operator action — the decisive, non-guessing step

The status cannot separate "no subscription" from "token scope/validity". The operator can, without any
new IPD code and without exposing a secret:

1. **Open the Dhan Developer panel** (web.dhan.co → My Profile → *Access DhanHQ APIs*).
2. **Data API subscription:** confirm it shows an **active** subscription (Data APIs are a separate paid
   plan). Note the displayed status verbatim.
3. **Token panel:** confirm the currently displayed access token is **the one provisioned into the DPAPI
   carrier** — compare *generation time / last few characters*, never paste the value anywhere.
4. **Regenerate the access token** from that panel (this alone is permitted: it is a portal action, not a
   modification of DPAPI state by this work item), then re-provision through the existing CLI, which
   **rotates the carrier atomically** — and update `IIPS_DHAN_ACCESS_TOKEN_EXPIRES_AT` with an **explicit
   `Z`/offset** (correction B made that mandatory at startup).
5. **Then** use the remaining authorized request.

Interpretation of step 2 is decisive:

| Panel shows | Conclusion | Action |
| --- | --- | --- |
| Data API **inactive** | entitlement is the cause | subscribe, then one request |
| Data API **active**, token matches | credential-class cause remains | regenerate token, re-provision, one request |
| Data API active, token does **not** match | stale carrier | re-provision the displayed token, one request |

If the second request still returns 401 *after* an active subscription and a freshly generated,
correctly provisioned token, the remaining explanation is a vendor-side account restriction — and that
requires Dhan support, not another code change.

---

## 9. Files changed

| File | Change |
| --- | --- |
| `tests/dhan_w06_quote_contract_conformance.test.ts` | **New.** 9 conformance cases driving the **real** `DhanApiClient` through a capturing transport. |
| `docs/integration/DHAN-W06-REQUEST-CONFORMANCE-AND-401-CLASSIFICATION-2026-11-13.md` | This record. |

**No production source was changed.** That is the finding, not an omission: there is no evidence-supported
defect to fix. Correction A already delivered the diagnostic that made this analysis possible.

---

## 10. Test results

| Suite | Result |
| --- | --- |
| `dhan_w06_quote_contract_conformance.test.ts` | **9 / 9 pass** |
| Full guarded suite | **1704 executed / 1700 passed / 0 failed** (see §10.1) |

### 10.1 Negative controls

Six mutations were injected into `dhan_api_client.ts`; five bite:

| # | Mutation | Caught by |
| --- | --- | --- |
| A | `client-id` → `client_id` | `W06C-02` |
| B | add an undocumented `version: 'v2'` header | `W06C-02`, `W06C-05` |
| C | `access-token: Bearer <token>` | `W06C-02` |
| D | pre-seed an empty `NSE_EQ` bucket | **not caught — equivalent mutant** |
| E | quote path → `/marketfeed/ohlc` | `W06C-01` |
| F | flat array instead of segment groupings | `W06C-03` |

Control D is recorded as an **equivalent mutant**, verified by executing both versions and comparing
output: for a single-instrument request both produce exactly `{"NSE_EQ":["2885"]}`. A test cannot
distinguish them because they are the same request. Control F is the non-equivalent form of the same
mutation and does bite.

An earlier version of this suite captured a **hand-written copy** of the expected request — it tested
itself, and controls A–C did not bite. That was caught during control review and replaced with a real
client capture; all listed results are from the corrected version.

---

## 11. Status

| Item | Status |
| --- | --- |
| **M1** | **NOT ACHIEVED** — no successful quote was produced |
| **W-06** | **OPEN** — but materially advanced: the request path is now proven conformant and the failure is localized to the vendor account/entitlement layer |
| Second authorized request | **AVAILABLE — unconsumed** |
| Vendor requests made in this work item | **none** |
| PR #156 | OPEN / MERGEABLE / UNMERGED |

**No claim is made that the credentials are invalid, or valid, for the quote API.** The 401 says Dhan
refused on a credential-or-entitlement basis; it does not say which, and `/v2/profile` succeeding says
the pair is not simply dead. Both statements are true simultaneously and neither resolves the other.

---

## 12. Safety footer

No HTTP request was made to Dhan or any vendor endpoint in this work item. The failed quote was not
retried. The second authorized request was not consumed. No credential was read, printed, rotated,
replaced or reprovisioned. No DPAPI carrier, ACL or vault content was modified. No secret value,
authorization header or vendor response body appears in this record or in any changed file. No
production code, authentication, validation or fail-closed control was weakened, and no production
authorization was introduced. IRR and every other repository are untouched. PR #156 was not merged.
