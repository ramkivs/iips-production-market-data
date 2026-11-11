# Stage 2: 64 persisted holdings, unavailable identity observations

## Disposition and source identity

**Persisted portfolio confirmed by supplied Windows evidence; end-to-end identity
qualification NOT established. No production correction is safe from this evidence
alone.** This report and synthetic producer-boundary regression tests are the
published result. No portfolio, binding, runtime configuration, dataset, rights,
certification, IRR code or historical artifact is modified.

Sources inspected:

- IPD main/base `a624d06f66c376f03a29571cb24c3f0f77f0c24d`.
- IPD PR #151 collector head `5312d49fb64e76adbfa3fe57a5134bc7c65abcbb`,
  fetched read-only; it is not on this work item's main-derived branch.
- IRR remote main independently queried and inspected at
  `08cdf491b3b6daedab997e1b51f81675a5ae984b`. IRR was read through GitHub;
  isolated source copies were used for probes, not an IRR working-branch change.
- Actual Windows evidence is the user's 2026-11-11 summary, not an assistant
  recapture. No actual 64-row holding payload, identity HTTP status/body, per-row
  security keys, or identity-file manifest was supplied. Source findings must not
  be represented as an attestation of those missing runtime values.

## 1. Exact findings for the 64-holding observation

| Fact | What can be concluded |
|---|---|
| Discovery OBSERVED; one portfolio, revision 1, INITIAL, isSaved=false; 64 active/0 inactive; one history entry | A persisted INITIAL revision was observed. isSaved describes operation, not absence. |
| Provenance digest `17b2b2833268222310c21f7b685d0ca5e595ebd6a62bda7f118a9c0c6b84781f` | Identifies the supplied stored provenance; not an issuer/rights certification or identity-file digest. |
| IPD reconciliation MATCHED_AT_READS; consumer MATCHED_AT_READ | Independently timed portfolio/count/revision reads agree. No atomic identity join follows. |
| W04 observedRows=0; unavailableRows=64 | No accepted 64-row identity array was observed by the collector. **Not 64 resolver rejections.** |
| W06 64 UNKNOWN observations | There is one placeholder per persisted holding. They are not evidence of 64 performed identity/freshness requests. |
| Canonical D114 identity present/absent for each actual row | UNKNOWN: the summary does not include those fields or presence counts. |
| IRR RESOLVED/UNMATCHED/conflict states for each actual row | UNKNOWN, not zero resolved and not 64 unmatched. No row-level issuer determination can be published. |
| W08 OBSERVED_UNVERSIONED_NOT_QUALIFIED | Conservative about qualification, but the literal label is assigned unconditionally after portfolio enumeration; it does not establish identity observation. |
| W09 LIST_OBSERVED, count 1 | IRR portfolio list was observed; it does not attest the identity route or same binding over every call. |

The proposed causes therefore have different evidence positions: missing exchange
is a **confirmed producer/consumer prerequisite gap**; loss of nested identity in
IRR observation construction is a **confirmed source-level projection gap**; missing
IRR roster/files, HTTP authorization failure, route failure, row-count mismatch and
runtime data/version mismatch are **not distinguishable from the supplied W04
summary**. There is no evidence that the provenance digest is wrong.

## 2. W04 path: unavailable is not unresolved

At the pinned collector, `scripts/Collect-IipsStage2Evidence.ps1:27-28,111,131-140`:

1. `GetLocal` GETs `/api/investment/portfolio/:id/identities` with no caller owner
   fields. HTTP failures/timeouts become null; HTTP status and bounded error code
   are discarded. `AsMap` also returns null if conversion fails.
2. Only an `identities` array whose length equals the persisted holdings length
   enters the observation branch. All states, even UNMATCHED or malformed-state
   UNKNOWN, increment **observedRows** once that branch is entered.
3. Otherwise the entire holdings count increments **unavailableRows**.

Thus a valid complete response with 64 UNMATCHED records would report 64 observed
rows, not the supplied 0. Missing or wrong-sized result, endpoint HTTP failure,
invalid JSON and missing source/holdings routes remain possible. The successful
portfolio read does not prove a separate identity read succeeded.

IRR's actual mounted route is at
`frontend/server/executive-transport.ts:925-944`; it calls
`frontend/server/investment/holding-identity-transport.ts`:

- GET/HEAD only; portfolio ID is decoded from the route.
- `handleHoldingIdentityRequest` loads governed identity sources first. Missing or
  invalid sources return 503 `identity-sources-unavailable` with file-level issues.
- The holding provider then reads the owner-scoped portfolio. Failure returns 503
  `holdings-unavailable`; composition's catch also uses that bounded error.
- Successful response: `status`, `portfolioId`, `count`, `identities`, `directory`,
  disclosures. Each identity has holdingIndex, state, nullable issuerId/securityId,
  basis, reason and assessable. Unresolved rows are retained, not removed.
- `directory` exposes rosterVersion/rosterDigest/rosterDataClass only. It is NOT a
  portfolio revision or full identity-source-set attestation.

`frontend/server/investment/sources.ts:153-164` enforces IRR's server-owned binding
precondition before constructing `IpcUserPortfolioPort`, supplies an empty scope,
and returns `view.holdings`. IPD still resolves its own ACTIVE binding. No identity
must be supplied by the browser, collector, query string, or fallback owner.

IRR loads **three separate governed files** from
`<IIPS_DATA_DIR>/investment/identity`: `eligible-roster.json`, `listing-map.json`,
`corporate-actions.json` (`identity/sources.ts:549-588`). Missing/invalid files
reject the set. Financial files in `investment/dataset` do not substitute for it.
Default data root without configuration is cwd-relative `.iips-data`; this is a
source fact, not a diagnosis of the user's configuration. Do not change roots or
copy synthetic/real-issuer certification fixtures into the runtime to force a pass.

## 3. Producer key contract and IRR projection gap

IPD `src/persistence/portfolio_store.ts:1097-1113` reconstructs a stored holding
with companyId, symbol and **nested** `securityIdentity`. It does not project flat
`isin` or `exchange`. A D114 object (`src/contracts/types.ts:74-134`) has
`securityId = ISIN:<isin>:<series>`, `isin`, `series`, and
`isinAuthority=NON_AUTHORITATIVE`. It has no exchange and no IRR issuer ID.
Legacy absence remains null; company/symbol labels do not establish identity.

IRR `frontend/server/user-portfolio/ipcPortAdapter.ts:472-511` passes the holdings
array through by a type assertion. Its `G2HoldingView` mirror has optional flat
isin/exchange but no declared nested securityIdentity (`userPortfolioContract.ts:
264-287`). **The cast itself does not remove JSON fields.** The loss happens at
`frontend/server/investment/sources.ts:41-73`: `toHoldingObservation` reads only
`holding.isin`, `holding.exchange`, symbol and company hint; it does not consume
nested securityIdentity and sets series=null.

Consequences when using the inspected IPD projection: explicit nested ISIN/series
are not carried into the IRR identity observation. This is an IRR-owned adapter
boundary, not a reason to rewrite historical portfolios or add guessed producer
fields. It can lead to unresolved observations, but it **does not explain zero
observed rows by itself**: a successful identity response still includes a result
for each holding.

IRR `identity/resolver.ts` resolves against governed sources and an asOf date.
Malformed/unknown ISIN does not fall back to a symbol. CompanyId is a conflict hint,
not identity proof. The resolver supports EXCHANGE_SYMBOL when ISIN is absent;
this investigation does not approve that as evidence for the 64-row bridge.

### Is a non-symbol-only join possible?

Conditionally, yes: validate the nested D114 tuple, carry its explicit ISIN into
the governed roster lookup, obtain the roster's security/issuer relationship and
an effective listing with compatible series and explicit exchange evidence. IRR
uses distinct grammars (`IN:ISIN:<isin>` and issuer `IN:CIN:` / `IN:EQISIN:`), so
string equality with IPD `ISIN:<isin>:<series>` is not a join. No companyId-to-issuerId
identity equivalence is admitted. Validate conflicts, check digits, ambiguity,
effective dates and the data class/provenance of the loaded reference set.

This is a **required owned contract**, not a new mapping implemented here. No
actual row can be certified until its keys and reference evidence are observed.

## 4. W06: skipped probes and separate market authority

Pinned collector lines 141-152 initialize UNKNOWN, then require all of:

- market port > 0 and existing transport token;
- explicit top-level exchange NSE/BSE;
- nested D114 securityId matching the grammar;
- nonempty companyId.

For IPD's inspected persisted-holding projection, the exchange test fails even
when all 64 nested identities are valid. Neither POST identity nor per-row GET
freshness executes. `EQ` is a **series**, not proof of NSE versus BSE. No exchange
may be inferred from symbol suffix, default NSE, or guessed company mapping.

IPD contract:

- `POST /v1/identity/resolve`: exact companyId/exchange/securityId; P04+P7 validation,
  not a ticker search or an IRR legal-issuer resolver.
- `POST /v1/identity/qualify`: explicit exchange and optional ISIN/symbol. It must
  not be used as a symbol-only shortcut in this investigation.
- `GET /v1/freshness?domain=D01_QUOTES&companyId=...&exchangeSegment=...&securityId=...`:
  exact scope and **status only**; it does not fetch quotes.
- All routes authenticate the existing server-side transport token before work
  (`dhan_market_data_http.ts:185-224,249-280`). No credential belongs in evidence.

`dhan_identity_api.ts:26-49` verifies exact P7 mapping, P04 company correspondence,
exchange and series. A valid D114 grammar does not prove a qualified P7 mapping.

Historical W06 is independent: the collector's authenticated GET
`/v1/freshness?domain=D02_OHLCV` is outside the holding loop. The supplied summary
contains no historical verdict. Do not infer historical availability, access rights,
provider connectivity or fresh quotes from 64 placeholders. Do not invoke quote,
historical-fetch, refresh or write endpoints to fill these evidence gaps.

## 5. W08 revision/provenance contract needed (IRR-owned)

The current identity provider returns only an array of holdings, losing the
portfolio revision/provenance supplied by IPD. The endpoint independently loads
identity files and supplies today's date to the resolver, but omits that asOf,
portfolio revision/digest, holding-set digest and full file-set versions/digests
from its response. `holdingIndex` alone cannot bind two independently read arrays.
Even matching list/detail counts and revision numbers outside that endpoint do not
make its separate read atomic or prove unchanged ownership across requests.

Required separately reviewed additive contract:

1. Owner-scoped portfolio snapshot captured by the existing authorized provider:
   portfolio reference, revision, provenance digest and a canonical ordered
   holding-input digest (index, validated security keys, active state as defined
   by the contract). No new client authority fields.
2. The very same snapshot supplies the identity inputs. Return resolver asOf,
   semantics/version, and full roster/listing-map/corporate-action versions and
   digests plus data class. Existing `IdentitySourceVersions` defines all six
   version/digest fields; the endpoint currently projects only two.
3. Per-row stable key/index with conflicts and ambiguity retained. Canonical
   issuer/security/listing bindings remain source-governed, not manufactured.
4. Collector verifies revision/provenance/holding-input digest and complete row
   coverage before qualifying a bridge. Changed revisions, source versions,
   digest mismatch, unavailable owner and partial arrays remain unqualified.
5. Preserve owner preconditions and IPD binding resolution; public response must
   not disclose principal/tenant IDs or accept one from a caller. Equal revisions
   are not an owner-attestation replacement.

No IRR code or API was changed in this IPD session. No resolver or bridge is
reimplemented inside the collector. In particular the unconditional W08 label
must not be treated as a positive observation when W04 observedRows is zero.

## 6. W05 and W07 are not fixed by resolving identities

W05: `/api/investment/coverage/investment` reads the financial snapshot separately
from identity sources; its issuers rows legitimately carry COVERED, NO_FINANCIALS,
SECTOR_NOT_MEASURED or ISSUED_DATA. The collector only joins those rows after an
observed RESOLVED issuerId. With W04 unavailable this per-holding financial join
is unobserved. No W05 manifest/rights content was supplied, so financial breadth,
mandatory-input sufficiency and rights remain UNKNOWN, not zero/not licensed.
A `sourceRights=OPERATOR_ASSERTED` declaration is not independent permission.
Needed: actual served dataset version/digest and periods/coverage, correct issuer
join, issuer primary-source provenance and separately verified acquisition/use/
processing/display/retention/redistribution rights for the actual data and use.
Identity source content-addressing alone does not establish those rights.

W07 is a historical register position, not a measurement of these 64 holdings.
The collector hardcodes the cited statuses; this run did not recertify them.
IRR's pinned evidence records establish the outstanding closure requirements:

- **L-038 (Marico)**: read the latest register §§17.23–17.24, not just
  the earlier residual docket. The owner decisions have **already been made**:
  strict same-instant debt is retained (no earlier-period fallback), and cash-side
  and debt-versus-cash same-instant guards were implemented. Those are not pending
  decisions to reopen. The remaining preference-capital evidence is still
  MISSING/NOT_REPORTED after three audited consolidated reports and the formerly
  unread share-capital page were examined. Closure needs an admissible audited
  consolidated issued-preference-capital amount, explicit nil/absence statement,
  redemption schedule or exhaustive class-of-shares wording with source provenance.
  Authorised capital, equity-only wording, omitted captions, arithmetic residuals
  and prior-year carry-forward do not supply it. Published period-mismatch
  refusals remain intact; settling a policy does not produce a computable number.
- **L-039 (KEC)**: latest register §17.25 includes a **real reported machine zero**,
  not merely an absent caption: audited consolidated 2026-03-31 XBRL
  CurrentInvestments=0. The fact-level follow-up resolved context/INR/instant/no
  dimensions, but concluded **outcome C, indeterminate source semantics**. Precision
  is decimals=-7 (₹1 crore accuracy); it is not proof of exact economic zero.
  The relative taxonomy entry point returned 404; definitions, labels, schema-
  default dimensions and presentation remain unverified. Standalone and
  September zeros do not prove template-default filling. Neither issuer economic
  zero nor template default has been established, and no mapping is authorised.
  Needed: independently verified issuer/exchange correspondence and taxonomy/
  rendering semantics for that fact, with owner adjudication, or a separately
  disclosed same-instant consolidated amount. A verified numeric zero can be
  PRESENT; do not reject it merely for being zero. A nil-disclosure route is
  distinct and still requires admissible wording and governed cash-aggregation
  treatment. Never substitute bank balances, noncurrent assets, silence or a
  residual. The original MISSING/NOT_REPORTED and OPEN status remain unchanged.
- **L-040** remains RESOLVED as supplied/pinned; do not edit its historical payload.

Authoritative latest inspected records at the IRR pin:

- `docs/integration/IIPS_V3_IID_LIMITATION_AND_COVERAGE_REGISTER_2026-11-06.md`
  §§17.23, 17.24, 17.25 including the fact-level follow-up.
- `evidence/WI11-L038-CONTRACT-DECISION-2026-11-08/decision-owner-authorization.json`.
- `evidence/real-issuer/WI12-L038-PREFERENCE-CAPITAL-2026-11-08/determination.json`.
- `evidence/real-issuer/WI12-L039-CURRENT-INVESTMENTS-2026-11-05/determination.json`.

The earlier WI7 residual and WI8 cash-side determinations were also read but are
not used to resurrect policy questions or fact-context gaps closed by these later
entries. These findings identify owned evidence/adjudication actions; they do not
change certification here. No new external filing retrieval was performed.

## 7. Tests and implementation disposition

Added `tests/stage2_identity_boundary.test.ts` (3 synthetic tests): 64 INITIAL
holdings retain nested identities; no flat ISIN/exchange or issuer is fabricated;
null identity stays null despite company/symbol labels; foreign owner/tenant reads
refuse and stale revision writes refuse without changing revision/history. The
fixture digest and identifiers are synthetic and do not reuse the user's import.

Commands executed locally (Linux):

```sh
npm ci --ignore-scripts
npm run build:tsc
node --test dist/tests/stage2_identity_boundary.test.js \
  dist/tests/g2_holding_security_identity.test.js \
  dist/tests/ipd_p4_identity_http.test.js \
  dist/tests/dhan_p6_exact_identity.test.js \
  dist/tests/stage2_binding_concurrency.test.js \
  dist/tests/stage2_portfolio_read_snapshot.test.js
```

**37 tests passed**, zero failures/skips. Positive/negative exact qualification,
HTTP authentication, identity persistence, revision consistency and owner-scoping
are covered. No unrelated full regression was manually run.

Five additional scratch probes ran the exact pinned IRR resolver/source-loader
code (TypeScript-transpiled isolated copies, no IRR edits) with its committed
synthetic identity fixtures: explicit ISIN without symbol resolves; absent keys
remain unresolved; unknown ISIN does not fall back to known symbol; corrupt ISIN
refuses; missing source files are unavailable. **5 passed**. These are not a full
IRR build, endpoint test, Windows test, or actual 64-row determination.

No runtime/production correction is shipped: the actionable observation-key and
revision contract gaps are IRR-owned; the exact W04 HTTP cause and actual row keys
are absent. Adding symbol/exchange guesses, changing stored rows or claiming
qualified W08 would weaken evidence. NP-04 portfolio/report DBs and WAL/SHM were
not opened or modified. The Stage 2 collector itself and PR #151 are unchanged.

## 8. Next Windows verification: bounded read-only observations

No restart, import retry/replay or runtime configuration change is required for
these diagnostic GETs. On the already authorised non-production host, use existing
IRR port and the actual portfolio ID from its existing UI; do not guess DEFAULT
or copy owner/binding credentials into an API request. Example in PowerShell 7:

```powershell
$irrPort = [int](Read-Host 'Existing IRR HTTP port')
$portfolioId = Read-Host 'Exact portfolio ID displayed by the existing UI'
$urlId = [uri]::EscapeDataString($portfolioId)
$r = Invoke-WebRequest -Uri "http://127.0.0.1:$irrPort/api/investment/portfolio/$urlId/identities" `
    -Method Get -NoProxy -MaximumRedirection 0 -TimeoutSec 10 -SkipHttpErrorCheck
$body = $null
try { $body = $r.Content | ConvertFrom-Json -AsHashtable } catch { }
# Share only status and an allowlisted bounded error category, not Content,
# issues.subject, filesystem paths, raw row identifiers, or credentials.
$code = 'UNKNOWN_OR_UNEXPECTED_BODY'
if ($body -is [System.Collections.IDictionary]) {
    if ($body.Contains('error') -and $body.error -in @('identity-sources-unavailable','holdings-unavailable','owner-context-unavailable','invalid-request')) {
        $code = $body.error
    } elseif ($body.Contains('status') -and $body.Contains('identities') -and $body.status -eq 'OK' -and $body.identities -is [array]) {
        $code = 'IDENTITIES_ARRAY_OBSERVED'
    }
}
[pscustomobject]@{ httpStatus=[int]$r.StatusCode; category=$code }
```

Keep any raw body entirely local under approved access controls. If 503 identity-sources-unavailable, inspect locally only the bounded
file/code issues and verify the three existing governed files and their declared
versions/digests in the **serving IRR process's configured data domain**; do not
install fixtures, change roots, edit manifests or restart services as part of this
investigation. If holdings-unavailable, correlate the existing provider/IRR logs
and owner precondition without widening access. If 200, retain anonymous counts
by state/reason/basis and check count=identities.length=64; a count alone is still
not W08 qualification.

Separately obtain an approved sanitized **presence-only** inventory from existing
owner-scoped portfolio reads: number of holdings with valid nested D114 tuple,
flat ISIN, explicit exchange and company reference, with before/after revision
and provenance digest. Do not publish 64 symbols/IDs or open SQLite to obtain it.
No exact quote/freshness key should be constructed until explicit exchange and
canonical identity correspondence are evidenced. Do not POST identity/quote/
historical requests based on guesses. Preserve W04/W06 UNKNOWN and W08 unqualified
until those observations and the owned snapshot/provenance contract are available.

The decisive missing evidence is HTTP status/category + actual presence inventory
+ complete governed source-set provenance. These will distinguish availability,
authorization and contract projection from actual per-row identity failures.
