# DHAN W-06 — ROOT CAUSE ESTABLISHED: Vendor Error 806, Data API Subscription Inactive (2026-11-13)

**Status:** ROOT CAUSE CONFIRMED — `EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE`.
**No vendor request was made by this work item.** The decisive evidence was produced independently by the
operator and is recorded here verbatim.
**Starting HEAD:** `42800056998ad291909e131e452fc8f97349212e`
**Repository:** `ramkivs/iips-production-market-data`, branch `arena/84d1e063-iips-production-market-data`.
**Roadmap authority:** IRR `DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` v1.1, W-06.

---

## 1. Root cause — confirmed

> **`EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE`**

Dhan refuses `POST /v2/marketfeed/quote` for this account because the account does not hold a Data API
subscription. This is the vendor's own explicit statement, not an inference.

### 1.1 The decisive evidence

The operator executed an independent Python script against the Dhan Reliance quote endpoint using the
**exact same Client ID and access token** provisioned in the Windows DPAPI carriers and used by the IIPS
daemon.

```text
HTTP STATUS: 401
```

```json
{
  "data": {
    "806": "Data APIs not Subscribed"
  },
  "status": "failed"
}
```

| Element | Value |
| --- | --- |
| Vendor error code | **`806`** |
| Vendor message | **`Data APIs not Subscribed`** |
| Vendor status | `failed` |
| HTTP status | **401** |
| Content | no credential material, no market data |

The annexure documents `806` as *"Data APIs not subscribed"*. The vendor has named the cause exactly.

---

## 2. Why this is conclusive rather than suggestive

Four independent facts now intersect, and each rules out its alternatives:

| # | Fact | Rules out |
| --- | --- | --- |
| 1 | `GET /v2/profile` with the same pair → **HTTP 200**, *Authentication Successful* | Invalid, expired, revoked or mismatched credentials; DPAPI resolution failure |
| 2 | The same pair → **401** on `/marketfeed/quote`, with vendor code **806** | Any local request-construction defect, any parse defect, any transport defect |
| 3 | `806` is the documented **entitlement** code, distinct from `807`–`810` (credential) | Credential-class refusal |
| 4 | IIPS produced the identical failure (`AUTHENTICATION_FAILURE`, vendor 401) from its conformant request | That IPD behaves differently from an independent client |

Facts 1 and 2 together are the key structure: **the same credential succeeds on one endpoint and is
refused on another within the same session**. That is only possible if the refusal is about something
*other than* the credential — and the vendor says what: the subscription.

### 2.1 This vindicates a retraction made earlier the same day

The prior record (`DHAN-W06-REQUEST-CONFORMANCE-AND-401-CLASSIFICATION-2026-11-13.md`) originally claimed
that error `806` maps to HTTP **403**, and used that to "exclude" the entitlement cause for the observed
401. That claim was retracted in
`DHAN-W06-PROFILE-AUTHENTICATION-AND-ENTITLEMENT-REASSESSMENT-2026-11-13.md` §2.1, on the grounds that the
annexure publishes no HTTP status column.

**The observation now proves the retraction was correct and the original claim was wrong: `806` arrived
with HTTP 401, not 403.** Had the original (invented) mapping been trusted, the entitlement cause would
have been dismissed on false grounds and the investigation sent further down a credential path that was
already disproven. The retraction is therefore recorded as **validated by evidence**, and test
`W06C-12` pins it so the false mapping cannot return.

### 2.2 A related consequence worth recording

Because entitlement refusal (`806`) and credential refusal (`807`–`810`) can both arrive as **HTTP 401**,
a bare status can never distinguish them. IPD maps 401 to `AUTHENTICATION_FAILURE`
(`dhan_api_client.ts` `mapHttpStatus`) and deliberately never reads the vendor body — so from IPD's
surface, an entitlement problem is **indistinguishable in type** from a credential problem.

**This is not a defect, and no change is proposed.** Reading and reflecting a vendor error body is the
exact behaviour that risks credential reflection, and it was excluded by policy for good reason. The
diagnostic that *did* help — `vendorHttpStatus` added in correction A — is what made the 401 observable
at all. The lesson is recorded for the operator: **`AUTHENTICATION_FAILURE` means "Dhan refused", not
"Dhan rejected your credentials".** The typed code is intentionally coarser than the vendor's taxonomy.

---

## 3. Credential authentication vs. data entitlement — the essential distinction

These are **separate layers**, and conflating them is what made this failure look like an auth problem.

| Layer | Question | Status for this account | Evidence |
| --- | --- | --- | --- |
| **Credential authentication** | Do the Client ID and access token identify a real, live session? | ✅ **PASSING** | `/v2/profile` → 200 |
| **Data API entitlement** | Is this account subscribed to the Data product? | ❌ **NOT ACTIVE** | `806 Data APIs not Subscribed` |
| Local DPAPI resolution | Did the daemon decrypt the right secrets? | ✅ **PASSING** | same pair works at the vendor |
| Request construction | Does IPD build a conformant request? | ✅ **PASSING** | contract conformance suite |
| Local transport auth | Did the operator authenticate to the daemon? | ✅ **PASSING** | request reached the service |

### 3.1 Explicitly NOT recommended

- **Do not rotate the access token.** It is proven valid by external authentication. Rotating it would
  discard working credentials to chase a cause that has been identified.
- **Do not reprovision the DPAPI carriers.** Resolution is proven correct; the daemon sends exactly the
  secrets the operator authenticated with.
- **Do not regenerate the Client ID.** Pairing is proven correct.
- **Do not alter request construction.** It conforms to the published contract, and an independent
  client reproduces the same refusal.

Any of the above would be action taken on a cause already excluded by evidence.

---

## 4. Proposed resolution

### 4.1 Operator action

**Subscribe to Dhan Data APIs.**

| Item | Detail |
| --- | --- |
| Product | **Data APIs** |
| Price | **₹499 + GST per month** |
| Action | *Subscribe to Data APIs* (Dhan developer/API panel) |
| Vendor documentation | <https://docs.dhanhq.co/api/v2/> |

Advertised capabilities of the subscription:

- Live Market Feed
- Daily & Intraday Charts Data
- Option Chain with Greeks
- Market Depth (20 levels)
- Rolling & Expired Options Data
- US Stocks Live Feed
- Company Info API

**This work item does not subscribe on the operator's behalf, and cannot**: the purchase requires the
operator's own authenticated Dhan account and payment instrument. It is recorded as the required action,
not performed.

### 4.2 What happens after activation

The subscription is the only known blocker. Once active, the remaining authorized quote request can be
spent, and the expected outcome is a `200` with a market-depth envelope — not because anything in IPD
changed, but because the vendor will stop refusing.

Activation timing is not inferred here: Dhan does not document a propagation delay, and none is assumed.
If the next request still returns `806`, the subscription has not taken effect yet; if it returns a
*different* code, that code is new information and supersedes this record.

---

## 5. Preserved evidence — nothing was overwritten

Both prior observations stand, unaltered, and are the two halves of this conclusion:

| Evidence | Record | Value |
| --- | --- | --- |
| Successful profile authentication | `DHAN-W06-PROFILE-AUTHENTICATION-AND-ENTITLEMENT-REASSESSMENT-2026-11-13.md` §3 | 200, *Authentication Successful*, `tokenValidity` 14/11/2026 09:43 IST, segments E/D/C/M |
| Failed IIPS quote | `DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md`; `DHAN-W06-REQUEST-CONFORMANCE-AND-401-CLASSIFICATION-2026-11-13.md` | 502, `AUTHENTICATION_FAILURE`, `vendorHttpStatus` 401 |
| Independent vendor 401 + `806` | **this record §1.1** | `{"data":{"806":"Data APIs not Subscribed"},"status":"failed"}` |

The earlier `dataPlan` recommendation (reassessment §8) is now **superseded by better evidence**: the
vendor error code answers the same question directly and more authoritatively than a profile field would.
That recommendation is closed, not left dangling — reading `dataPlan` after the fact would add nothing.

---

## 6. W-06 next action and milestone dependencies

### 6.1 W-06

| Item | Status |
| --- | --- |
| **W-06** | **OPEN** — root cause identified and attributed externally; the item cannot close until a successful quote proves the subscription resolved it |
| Root cause | **CONFIRMED** — `EXTERNAL_BLOCKER — DHAN_DATA_API_SUBSCRIPTION_INACTIVE` |
| Blocking dependency | Operator's Dhan Data API subscription (₹499 + GST/month) |
| Work remaining in IPD | **none known** — no implementation defect exists |
| Remaining authorized vendor request | **PRESERVED — unconsumed**, held for use after activation |

### 6.2 Milestone dependencies

| Milestone | Status | Dependency on this blocker |
| --- | --- | --- |
| **M1** | **NOT ACHIEVED** | Blocked: requires a successful authenticated quote, which requires the subscription |
| **M2a** | **NOT STARTED** | Blocked behind M1: no quote has ever been parsed |
| **M2** | **NOT STARTED** | Blocked behind M2a |
| **M3a / M3 / M4** | **NOT STARTED** | Unchanged; untouched |

No milestone is claimed, advanced or implied by this record. Identifying a blocker is not progress
toward the milestone it blocks — it prevents further wasted effort, which is a different thing.

---

## 7. Files changed

| File | Change |
| --- | --- |
| `docs/integration/DHAN-W06-ROOT-CAUSE-806-DATA-API-SUBSCRIPTION-2026-11-13.md` | **New.** This record. |
| `tests/dhan_w06_quote_contract_conformance.test.ts` | Two cases added: `W06C-12` pins that `806` arrived as 401 (refuting the dead mapping); `W06C-13` proves IPD fails closed on the captured vendor body without reflecting its text. |

**No production source was changed.** The decision is unchanged from the previous two work items and is
now confirmed by vendor evidence: there is no implementation defect to fix, and the parser already fails
closed correctly on the captured body.

---

## 8. Validation

| Check | Result |
| --- | --- |
| TypeScript compilation | clean |
| `dhan_w06_quote_contract_conformance.test.ts` | **13 / 13 pass** (+2) |
| Full guarded suite | **1708 executed / 1704 passed / 0 failed** |
| Negative controls | 2 injected mutations, **both bite** |
| Production source delta | **zero** |

Negative controls, run against the restored suite:

| # | Injected regression | Caught by |
| --- | --- | --- |
| A | assert `806` arrived as 403 (re-instating the dead mapping) | `W06C-12` |
| B | make the parser echo the vendor message | `W06C-13` |

Inconsistency checks performed across the W-06 corpus: no record now asserts a code → HTTP status
mapping; the retraction in the reassessment record is consistent with this evidence; no record recommends
credential rotation after the pair was proven valid.

---

## 9. Safety footer

No HTTP request was made to Dhan or any vendor endpoint by this work item; the decisive evidence was
produced independently by the operator and is recorded, not re-derived. No subscription was purchased or
initiated on the operator's behalf. The remaining authorized quote request was **not** consumed. No
credential was read, printed, rotated or reprovisioned. No DPAPI carrier, ACL or vault content was read or
modified. No secret value, authorization header or vendor response body containing credentials appears in
this record or any changed file — the recorded vendor body contains only the error code and message. No
authentication, security or fail-closed control was weakened. IRR and every other repository are
untouched. PR #156 was not merged.
