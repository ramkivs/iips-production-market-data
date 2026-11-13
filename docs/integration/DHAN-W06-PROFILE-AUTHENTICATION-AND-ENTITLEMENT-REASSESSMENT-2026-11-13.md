# DHAN W-06 — Profile Authentication and Entitlement Reassessment (2026-11-13)

**Status:** CORRECTION + REASSESSMENT. **No vendor request was made in this work item.**
**Supersedes parts of:** `DHAN-W06-REQUEST-CONFORMANCE-AND-401-CLASSIFICATION-2026-11-13.md` (§1 item 4, §6, §7).
**Starting HEAD:** `b890839d2b0cc91522c9a55a08df9aa1e626e824`
**Repository:** `ramkivs/iips-production-market-data`, branch `arena/84d1e063-iips-production-market-data`.
**Roadmap authority:** IRR `DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` v1.1, W-06.

---

## 1. Executive conclusion

The successful `GET /v2/profile` is **external, authoritative proof that the credential pair is valid
and that Dhan accepts it**. That settles the question this investigation was originally built to
answer, and it retires several hypotheses outright.

It does **not** settle why `/marketfeed/quote` returns 401, and — this is the important correction — **the
vendor's published documentation does not permit the inference that a 401 establishes an entitlement
problem.** A prior version of the W-06 record asserted that it did. That reasoning is withdrawn here.

**What is now established (documented fact):**

- The credential pair is correct, current and accepted by Dhan. Not regenerable-by-suspicion, not
  mismatched, not stale.
- The quote request IPD builds conforms to Dhan's published Market Quote contract.
- Dhan's error taxonomy **distinguishes** credential failures, entitlement failures and input failures
  by *error code*, and documents **no HTTP status for any of them**.

**What is not established (and was wrongly implied before):**

- That the 401 indicates missing Data API entitlement. It does not follow from the status.
- That it indicates anything specific at all, beyond "a refusal occurred".

**The strongest evidence-supported next step costs no vendor request:** the operator's profile response
already contains — or can be re-read from the body they already have — the `dataPlan` field, which is
Dhan's own documented Data API subscription indicator. That single field discriminates between the two
remaining families, and it is one the authentication test already exercised without anyone realising.

---

## 2. Correction to the record: what I got wrong

Three specific errors in `DHAN-W06-REQUEST-CONFORMANCE-AND-401-CLASSIFICATION-2026-11-13.md`:

### 2.1 I invented a code → HTTP status mapping

That record stated, in a table, that error `806` maps to **403**, `813`/`DH-905` to **400**, `805` to
**429**, and so on — and used those arrows to "exclude" entitlement and input causes for the observed 401.

**The annexure does not contain an HTTP status column.** Its two error tables are:

| Table | Columns |
| --- | --- |
| Trading API Error | Type, Code, Message |
| Data API Error | Code, Description |

No status anywhere. Every arrow in that table was my inference, dressed as documentation. This is
exactly the class of error the W-06 investigation exists to prevent, and it is corrected in place with an
explicit RETRACTED banner rather than quietly edited.

### 2.2 I treated the profile evidence as if it tested entitlement — it does not

The documented profile response has a dedicated field for this:

```json
{
  "dhanClientId": "1100003626",
  "tokenValidity": "30/03/2025 15:37",
  "activeSegment": "Equity, Derivative, Currency, Commodity",
  "ddpi": "Active",
  "mtf": "Active",
  "dataPlan": "Active",
  "dataValidity": "2024-12-05 09:37:52.0"
}
```

`dataPlan` is documented as *"Data API subscription status — Active / Deactive"*. The operator reported
**`tokenValidity`** and **`activeSegment`** — neither of which is `dataPlan`.

`activeSegment` is documented as *"All active segments in user accounts"*, enumerating trading segments
(Equity, Derivative, Currency, Commodity). **It is not a data entitlement, and reading it as one is a
category error** — the same mistake in a new costume as §2.1.

### 2.3 I ranked a cause I could not test as the leading hypothesis

The prior record placed "Data API subscription inactive" at MEDIUM-HIGH and said the status made it
likely. With §2.1 retracted, the status supports no such ranking. It is now honestly labelled
**untested**, not probable.

**What survives unchanged:** the request-conformance analysis and its tests. The request really does
match the published contract, field for field; that finding was mechanical and is unaffected.

---

## 3. What the successful profile request proves

`GET https://api.dhan.co/v2/profile` with the **exact** Client ID and access token held in the Windows
DPAPI carriers, executed independently by the operator, returned:

| Observed | Meaning |
| --- | --- |
| HTTP **200** | Dhan reached, request accepted |
| *Authentication Successful* | the pair authenticated |
| `tokenValidity` 14/11/2026 09:43 IST | the token was valid, with a stated future expiry |
| `activeSegment` E, D, C, M | the account has trading segments active |

This is **stronger** evidence than anything IPD could produce locally, because it is an independent
client reaching the vendor directly with the same secret. It establishes:

1. **The credential pair is correct.** Client ID and access token belong together. (Hypothesis "pairing
   mismatch" — **closed**.)
2. **The token was live at that moment.** (Hypothesis "token expired or revoked" — **closed for the
   moment observed**.)
3. **DPAPI resolution yields the genuine secrets.** The daemon resolves the same values the operator
   used. (Any lingering doubt about the carrier contents — **closed**.)
4. **The account is not globally barred from the API.** Some API surface is authorised.

### 3.1 What it does *not* prove — precisely

- It does **not** prove Data API entitlement. `dataPlan` was not among the reported fields (§2.2).
- It does **not** prove the token was valid at the *instant* the quote request ran; the two observations
  are minutes apart, and a token can in principle expire between them. Unlikely with a 24-hour token
  whose stated validity is 14/11/2026 09:43 IST, but "unlikely" is not "impossible" and is recorded as such.
- It does **not** prove `/marketfeed/quote` is reachable for this account. That is the open question.

Most importantly: **profile 200 is an authentication fact, not a data-entitlement fact, and the two are
documented as separate account attributes.**

---

## 4. What the quote 401 proves

`POST /v2/marketfeed/quote` with the same pair returned a vendor 401 (captured as
`vendorHttpStatus: 401`, daemon 502, typed `AUTHENTICATION_FAILURE`).

Established:

- **A vendor response was received.** Not a local failure, not a transport failure, not a timeout. The
  diagnostic added in correction A is what makes this statement possible at all.
- **The vendor refused the request**, and Dhan signals refusal using the 401/403 range.
- **The refusal is endpoint-specific.** Same credentials, same window: `/profile` accepted,
  `/marketfeed/quote` refused.

Not established, and this is where the prior record went wrong:

- **Which** refusal. IPD maps 401 *and* 403 to `AUTHENTICATION_FAILURE`
  (`dhan_api_client.ts` `mapHttpStatus`), so its typed code carries no more information than "refused".
- **Whether the vendor's error code was a credential code (807/808/809/810), the entitlement code
  (806), or a trading-class code (DH-901/DH-902).** All of these exist in the annexure; **their HTTP
  statuses are undocumented**; and IPD deliberately never reads or reflects the vendor's response body.

So the honest statement is: *the vendor refused a conformant quote request from an account whose
credentials it had just accepted.* The refusal's category is **unknown**.

---

## 5. Does Dhan apply separate checks to these endpoints?

**Yes — this is documented, not inferred.** The evidence is structural and unambiguous:

| Observation | Source |
| --- | --- |
| Two separate error tables: **Trading API Error** and **Data API Error** | Annexure |
| `DH-902`: *"User has not subscribed to Data APIs **or** does not have access to Trading APIs. Kindly subscribe to Data APIs to be able to fetch Data."* | Annexure |
| `DH-903`: *"Errors related to User's Account. Check if the required segments are activated…"* | Annexure |
| Data API codes `806` (*Data APIs not subscribed*) and `810` (*Client ID is invalid*) coexist | Annexure |
| `dataPlan` / `dataValidity` are first-class profile fields, separate from `tokenValidity` | Authentication docs |
| Data APIs are described as a **separately charged** product ("For Data APIs, there are additional charges") | Authentication docs |

The existence of `DH-902` is the decisive documentary fact: Dhan's own text says a user may hold
**valid credentials** and still be refused **data** because they have not subscribed. That is not my
inference; it is the vendor's error string.

**But note what this proves and what it does not.** It proves that a *separate authorization layer
exists*. It does **not** prove that *this account* fails that layer — that requires `dataPlan`, which was
not observed. A separate layer existing is a reason the observation is *possible*, not evidence that it
is what happened.

Two further nuances from the documentation, both honest:

- Dhan's `RenewToken` and token-generation paths can produce tokens that are valid but which behave
  differently across API classes; the docs do not define a formal "scope", so token-scope explanations
  are **plausible but undocumented** — recorded as speculation, not fact.
- A `DH-901` (*"Client ID or user generated access token is invalid or expired"*) from a **Trading**-class
  endpoint would be consistent with a credential problem that `profile` did not encounter. Whether
  `profile` exercises the same validation path as a data endpoint is **not documented**.

---

## 6. Documented facts vs. inference — the discipline this record enforces

| Claim | Status |
| --- | --- |
| access-token + client-id are the only documented quote headers | **Documented** |
| The payload is grouped by exchange segment | **Documented** |
| `version` is a websocket constructor arg, not a REST header | **Documented** |
| `dataPlan` reports Data API subscription status | **Documented** |
| `activeSegment` lists trading segments, not data entitlement | **Documented** |
| Dhan charges separately for Data APIs | **Documented** |
| A valid user can be refused data without a subscription (DH-902's text) | **Documented** |
| Trading and Data APIs have separate error tables | **Documented** |
| **Error code `X` returns HTTP status `Y`** | **NOT DOCUMENTED — retracted** |
| **This account's `dataPlan` is Deactive** | **UNKNOWN — not observed** |
| **A 401 establishes an entitlement problem** | **NOT SUPPORTED — retracted** |
| **A 401 establishes a credential problem** | **NOT SUPPORTED** — the pair was accepted seconds earlier |
| The token carried a "data" scope | **Undocumented speculation** |

The middle rows are the ones that changed. Both directions of inference are blocked: a 401 neither
proves entitlement failure nor credential failure.

---

## 7. Evidence obtainable with no further vendor request

This is the productive part, and it needs nobody to repeat a test that already succeeded.

### 7.1 The profile response body the operator already has — **decisive**

The operator's script printed selected fields. The full JSON body it received contains **`dataPlan`**
and **`dataValidity`**. Reading those two fields from the response already in hand:

| `dataPlan` | Conclusion |
| --- | --- |
| `"Active"` (with a future `dataValidity`) | entitlement is **not** the cause; the 401 is credential/token-scope/account-class |
| `"Deactive"` | entitlement **is** a live candidate, and the documented next step is to subscribe |

**No vendor request is needed to obtain this** — it is already in a response the operator has. This is
the single highest-value action available, and it is what §8 recommends.

### 7.2 Dhan web portal (read-only)

The *Access DhanHQ APIs* panel displays the Data API subscription state independently of any API call.
Read-only inspection; no secret is exposed, no credential changed.

### 7.3 Local evidence already captured

- The daemon's captured failure record (`vendorHttpStatus: 401`, 502, elapsed) — already in hand.
- The DPAPI carrier's `createdAtUtc` / `expiresAtUtc` **metadata** (not the secret) would confirm the
  carrier's token is the same vintage as the one the operator authenticated with. Metadata only.

### 7.4 What genuinely requires a vendor request

Only two things: (a) the vendor's **error code** for the quote refusal, which would name the class
exactly; (b) a successful quote. Both are deferred to the remaining authorized request.

---

## 8. The strongest evidence-supported next step

**Step 1 — no vendor request, no credential handling, no operator re-authentication:**
Read `dataPlan` and `dataValidity` from the profile response body the operator already retrieved.

**Step 2 — branch on that single field:**

| `dataPlan` | Then |
| --- | --- |
| `Deactive` | Subscribe to Data APIs in the Dhan panel. Then spend the remaining authorized request. Entitlement is confirmed as the cause. |
| `Active` | Entitlement is excluded. The refusal is credential-class or account-class *despite* valid credentials — a condition only Dhan can explain. Capture the vendor error code (one authorized request) and, if it persists, raise it with Dhan support quoting `DH-902`/`DH-903` and the observation that `/profile` succeeds while `/marketfeed/quote` returns 401 on the same token. |
| Field absent | The account is on an older API version; fall back to the portal display (Step 2b, §7.2). |

**Do not** regenerate the token speculatively. It is proven valid; regenerating it would rotate a
working credential to chase an unproven hypothesis, and would discard the one clean observation we have.

**Do not** repeat the profile authentication test. It has succeeded with the exact credentials; repeating
it produces the same 200 and consumes nothing but time.

---

## 9. Files changed

| File | Change |
| --- | --- |
| `docs/integration/DHAN-W06-PROFILE-AUTHENTICATION-AND-ENTITLEMENT-REASSESSMENT-2026-11-13.md` | **New.** This record. |
| `docs/integration/DHAN-W06-REQUEST-CONFORMANCE-AND-401-CLASSIFICATION-2026-11-13.md` | **Corrected in place** — superseding banner, RETRACTED banners on §1 item 4 and §6, H1 downgraded to untested, H4's reasoning corrected. |
| `tests/dhan_w06_quote_contract_conformance.test.ts` | Taxonomy test corrected (no code → status mapping); `W06C-10` pins the "no HTTP status column" fact; `W06C-11` pins `dataPlan` vs `activeSegment`. |

**No production source changed.** The request-conformance finding stands; nothing in the implementation
was implicated then or now.

---

## 10. Test results

| Suite | Result |
| --- | --- |
| `dhan_w06_quote_contract_conformance.test.ts` | **11 / 11 pass** (was 9; +2 taxonomy guards) |
| Full guarded suite | **1706 executed / 1702 passed / 0 failed** |

The two new cases exist specifically so this correction cannot decay:

- `W06C-10` asserts the annexure carries no HTTP status column, and that IPD classifies 401 and 403
  identically — so re-introducing a "code → status" claim fails the suite.
- `W06C-11` asserts `dataPlan` is the entitlement field and that `activeSegment` is not — so the
  category error in §2.2 fails the suite.

---

## 11. Status

| Item | Status |
| --- | --- |
| **M1** | **NOT ACHIEVED** — no successful quote |
| **W-06** | **OPEN** — narrowed: credentials verified externally; request proven conformant; refusal category unknown |
| Credential pair | **VERIFIED VALID** by independent `GET /v2/profile` (HTTP 200) |
| Credential regeneration | **NOT justified** — the pair is proven working |
| Entitlement | **UNTESTED** — `dataPlan` not yet read |
| Remaining authorized vendor request | **AVAILABLE — unconsumed** |
| Vendor requests in this work item | **none** |
| PR #156 | OPEN / MERGEABLE / UNMERGED |

---

## 12. Safety footer

No HTTP request was made to Dhan or any vendor endpoint in this work item. No credential was read,
printed, rotated or reprovisioned. No DPAPI carrier, ACL or vault content was read or modified. No secret
value, authorization header or vendor response body appears in this record or in any changed file. No
production source, validation or fail-closed control was changed, and no production authorization was
introduced. IRR and every other repository are untouched. PR #156 was not merged.
