# Snapshot-to-Live W04 — IRR holding-identity endpoint: revision binding assessment

**Date:** 2026-11-13
**Roadmap item:** W04, "Actual security and issuer coverage" ([roadmap](IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md)), host evidence item E1 of the [W04 evidence assessment](IIPS-W04-IDENTITY-COVERAGE-REVISION-1-EVIDENCE-ASSESSMENT-2026-11-13.md)
**Subject:** the IRR route `GET /api/investment/portfolio/<portfolioId>/identities`
**Repositories read:** IRR `ramkivs/iips-review-recovered` at `main` `08411bcd6d782a601fe5c82cc9983d076831148d` (the build the host reported) and at the head of open PR #563, `d10afbb31573d999f4b331484fcb79c510df1304`; IPD `ramkivs/iips-production-market-data` at `main` `a624d06f66c376f03a29571cb24c3f0f77f0c24d` and on this branch, which changes no source or test file

**Conclusion.** The route reads the **current** state of the portfolio. It cannot be asked for a revision, and its response names no revision and no provenance digest. A response from it is therefore not, by itself, evidence about revision 1. The revision can be established with reads that already exist, by bracketing; section 8 gives the host operation. No code or contract change is needed for that operation, and none was made.

**W04 status is unchanged: PARTIALLY COMPLETE, not accepted.**

This assessment was made from the two repositories only. Nothing on the Windows host was read or requested. No portfolio data was read, no import was performed, and no acceptance criterion was changed.

## 1. How to read this record

| Label | Meaning |
|---|---|
| **R** | Verified here from tracked repository content: by reading source, by running the repository's own tests, or by running unmodified application code on synthetic input. |
| **D** | Derived by reasoning from **R**. The condition it depends on is stated. |
| **U** | Not observable from the repositories. |

Line numbers refer to IRR `08411bc` and IPD `a624d06`. The IPD files under `src/ipc`, `src/persistence` and `src/contracts` are identical at `a624d06`, at the host-reported IPD checkout `1fded9d`, and on this branch (**R**, `git diff --name-only`: no file).

## 2. Answers

| # | Question | Answer | Label |
|---|---|---|---|
| 1 | Does the route read a specifically requested persisted revision, or the current state? | The current state only. The request has one parameter, the portfolio id. A query string is discarded. The one IPC request it causes is `portfolio.get` with the payload `{ portfolioId }`, and IPD answers that operation from the portfolio's current revision. | R |
| 2 | Is the response bound to revision 1 and its provenance digest? | No. The response carries no revision, no provenance digest and no timestamp. The server reads both values from IPD and drops them before the response is built. | R |
| 3 | Does the response give identity counts by state and reason? | Not as counts. It gives `count` (the number of holdings) and, for each holding, `state` and `reason`. Counts by state and reason have to be tallied by the reader. | R |
| 4 | Does it give the roster version, digest and data class? | Yes: `directory.rosterVersion`, `directory.rosterDigest`, `directory.rosterDataClass`. The first two are the same value. The listing-map and corporate-action digests are not in the response. | R |
| 5 | If revision binding is unsupported, which existing method establishes it? | `GET /api/user-portfolios/<portfolioId>` returns `revision` and `provenanceDigest` from the same IPC operation, through the same server and adapter. Reading it immediately before and after the identities request, and comparing both with the captured values, establishes the revision by bracketing. `GET /api/user-portfolios/<portfolioId>/revisions` corroborates. Section 7. | R, D |
| 6 | Is a code or contract change necessary? | Not for the host step. A change would be needed for a response that names its own revision, or for reading a revision that is no longer current. Section 10 states each gap and the authority it needs. Nothing was implemented. | R |

## 3. The route as implemented

### 3.1 Contract evidence

No tracked document in IRR specifies this route. A search of IRR `main` for the path, the route id and the handler name finds them in eight TypeScript files and in no Markdown, JSON or YAML file (**R**). The contract is the code and its tests:

| Evidence | Location |
|---|---|
| Route declaration: one pattern, methods `GET` and `HEAD`, `mutating: false` | `frontend/server/investment/holding-identity-transport.ts` l.34–42, `HOLDING_IDENTITY_ROUTES` |
| Error vocabulary | same file l.44–61, `HOLDING_IDENTITY_ERRORS` |
| Per-holding response type | same file l.63–76, `HoldingIdentity` |
| Handler and response body | same file l.145–216 |
| Browser client and its mirror of the response type | `frontend/src/api/investmentDiscovery.ts` l.84–125 |
| Mount in the HTTP server | `frontend/server/executive-transport.ts` l.925–945 |
| Tests | `frontend/server/investment/iidWi2Discovery.test.ts` l.356–463; `frontend/server/investment/iidWi2aIdentifierResolution.test.ts`; `frontend/src/features/user-portfolios/iidWi2LinkIndependence.test.tsx` |

The tests pin the path match, the 405 for other methods, the two 503 cases, the independence from dispositions and the row order. No test asserts anything about a revision, and none asserts the `directory` block.

### 3.2 Request

| Element | Behaviour | Source |
|---|---|---|
| Path | Exactly five segments: `/api/investment/portfolio/<portfolioId>/identities`. A sixth segment is not this route. | `isHoldingIdentityPath`, l.85–95 |
| `portfolioId` | URL-decoded and trimmed. Empty gives 400 `invalid-request`. | `parsePortfolioIdOf`, l.97–106 |
| Query string | Removed before matching (`split('?')[0]`) and never parsed. `?revision=1` is accepted and has no effect. | l.86, l.99 |
| Methods | `GET` and `HEAD`. Anything else: 405 with `Allow: GET, HEAD`, before any read. | l.152–162 |
| Body, headers, cookies | Not read. | handler |
| Network | The server listens on `127.0.0.1` only. The path is in the owner-scoped list, so no wildcard cross-origin header is set. | `executive-transport.ts` l.705–715, l.721, l.1259 |

### 3.3 Response

Status 200:

```
{
  "status": "OK",
  "portfolioId": <string>,
  "count": <number of holdings>,
  "identities": [ {
      "holdingIndex", "symbol", "isin", "state", "issuerId", "securityId",
      "resolutionBasis", "reason", "reasonText", "assessable"
  } ],
  "directory":   { "rosterVersion", "rosterDigest", "rosterDataClass" },
  "disclosures": { "decisionSupportOnly": true, "nonProduction": true, "independentOfDispositions": true }
}
```

Other statuses:

| Status | Body | When |
|---|---|---|
| 400 | `{ "error": "invalid-request" }` | empty or undecodable portfolio id |
| 405 | `{ "error": "method-not-allowed" }` | any method other than `GET`, `HEAD` |
| 503 | `{ "error": "identity-sources-unavailable", "detail", "issues": [ { "file", "code", "subject" } ] }` | the identity files did not load. Checked first: no holdings are read in this case. |
| 503 | `{ "error": "holdings-unavailable", "detail" }` | the owner precondition is not set, or the IPC read failed or was refused |

Three points a reader of a response must know (**R**):

- `rosterVersion` and `rosterDigest` are the same value, the digest of the validated roster (`iips-platform/src/investment/identity/sources.ts` l.524–538). There is no separate version label.
- `rosterDataClass` is `SYNTHETIC_FIXTURE` when the roster's own label contains "synthetic", otherwise `OPERATOR_SUPPLIED` (l.542–544).
- On `08411bc`, `issues[].subject` of the 503 for missing files is the absolute path of the identity directory. On `d10afbb` it is not.

The identity is resolved "as of" the server's current UTC date (l.193). That date is not returned.

## 4. Call path

| Step | What happens | Source |
|---|---|---|
| 1 | The HTTP server matches the path by pattern and loads the handler with one provider, `createPortfolioHoldingsProvider()`. | `frontend/server/executive-transport.ts` l.929–936 |
| 2 | The handler checks the path and method, parses the portfolio id, and loads the three identity files from `<IIPS_DATA_DIR>/investment/identity`. | `holding-identity-transport.ts` l.150–182; `iips-platform/src/investment/identity/sources.ts` l.563–585 |
| 3 | The provider checks the IRR-local binding precondition and calls `port.getPortfolio({ scope: {}, portfolioId })`. It returns `view.holdings` and nothing else. `view.revision` and `view.provenanceDigest` are dropped here. | `frontend/server/investment/sources.ts` l.153–165 |
| 4 | The port's read parameters are a scope and a portfolio id. There is no revision parameter. | `frontend/server/user-portfolio/userPortfolioPort.ts` l.66–69 |
| 5 | The adapter sends one IPC request: operation `portfolio.get`, payload `{ portfolioId }`, protocol version 1. | `frontend/server/user-portfolio/ipcPortAdapter.ts` l.249–254; `ipcClient.ts` l.65 |
| 6 | IPD dispatches `portfolio.get` to `store.get(owner, portfolioId)`. The owner comes from IPD's own binding. Only `portfolioId` is read from the payload. | IPD `src/ipc/dispatch.ts` l.131–138, l.174–192, l.533–537 |
| 7 | The store resolves the portfolio row, takes its `current_revision`, and selects the revision row and the holding rows `WHERE revision = <current revision>`, inside one read transaction. | IPD `src/persistence/portfolio_store.ts` l.749–773, l.781–826 |
| 8 | The adapter validates the result and passes the holdings array through unchanged. | `ipcPortAdapter.ts` l.475–516 |
| 9 | Each holding is turned into an observation from `symbol`, `isin`, `exchange` and `companyId`, and resolved against the loaded files. On `08411bc` the nested `securityIdentity` object is not read. | `sources.ts` l.41–74; `holding-identity-transport.ts` l.114–138 |
| 10 | The body is written with the fields of section 3.3. | `holding-identity-transport.ts` l.194–214 |

The whole path is read-only. The handler writes no file and no store. The IPD operation it reaches is in the closed read set, and the code it runs there (owner resolution, `store.get`) contains no `INSERT`, `UPDATE` or `DELETE` statement.

## 5. Findings on revision binding

- **F1 (R).** The request cannot name a revision. The path has no revision segment, the query string is discarded, and the port, the adapter and the IPC payload carry a portfolio id only.
- **F2 (R).** IPD has no operation that reads the holdings of a named revision. The read operations are `portfolio.list`, `portfolio.get` and `portfolio.revisions` (`src/ipc/protocol.ts` l.57–61). `portfolio.revisions` returns one summary entry per revision and no holdings. The store method `holdingsForRevision` exists, but its own comment restricts it: "Never call from dispatch" (`portfolio_store.ts` l.1034–1051). The accepted handoff contract gives the `portfolio.get` request as `{ portfolioId?: string }` (IPD `docs/integration/IIPS_V3_DIRECT_P1_PROVISIONING_AND_IRR_HANDOFF_2026-11-01.md`, section 3.3).
- **F3 (R).** A protocol v1 request `portfolio.get` whose payload also carries `revision: 1` is answered with the current revision. The extra key is ignored. An extra key on the envelope is refused with zero bytes. Protocol v2 closes the payload to `portfolioId` (`protocol.ts` l.375–381); IRR does not send v2.
- **F4 (R).** The identities response carries no revision, provenance digest, content digest, stored instant or generation time.
- **F5 (R).** With the same holdings, the response for a portfolio at revision 1 and the response for the same portfolio at revision 7 are byte-identical. With `?revision=1` in the request and the portfolio at revision 7 with different holdings, the response describes the revision-7 holdings.
- **F6 (R).** The head of PR #563 adds fields to each identity and to `directory`. It adds no revision and no provenance digest, and it does not change the provider. The route is current-state there as well.
- **F7 (R).** A provenance digest alone does not identify a revision number. A restore writes a new revision that repeats the provenance digest of the revision it restores (`portfolio_store.ts` l.1777–1782). Both the number and the digest must be checked.
- **F8 (R).** IPD revision numbers only move forward. Every write path sets the new current revision to the expected revision plus one, under a conflict check (`portfolio_store.ts` l.1207–1224, l.1624), or to the last revision plus one on restore (l.1777). No runtime statement updates or deletes a row of `portfolio_holdings` or `portfolio_revisions`; schema migrations 005 and 006 alter or rebuild those tables once, at service start.

F3, F5, F7 and F8 were also observed by running the unmodified code on synthetic input (section 12).

## 6. The route against the W04 host evidence plan

Item E1 of the W04 evidence assessment asks for the IRR resolver outcome for the holdings of revision 1.

| E1 needs | Given by the route | How to obtain it |
|---|---|---|
| That the holdings read were those of revision 1 | No | Bracketing, section 7 |
| HTTP status | Yes | — |
| Count of holdings | Yes, `count` | — |
| Count per `state` | No aggregate | Tally `identities[].state` locally |
| Count per `reason` | No aggregate | Tally `identities[].reason` locally |
| Roster version | Yes, equal to the roster digest | `directory.rosterVersion` |
| Roster digest | Yes | `directory.rosterDigest` |
| Roster data class | Yes | `directory.rosterDataClass` |
| Listing-map and corporate-action versions | No | Not available from this route. Section 10, gap G3. |
| The 503 error and issue codes | Yes | `error`; `issues[].file`, `issues[].code`. Do not publish `issues[].subject`. |
| The resolver state of the one populated holding (item E3) | Yes, by row index | `identities[i]`, where `i` is the index of that holding in the detail read of section 7 |

The body also carries the portfolio id and each holding's symbol. The body itself must not be published.

## 7. Establishing the revision with existing reads

### 7.1 The reads

| Read | Returns | Source |
|---|---|---|
| `GET /api/user-portfolios/<portfolioId>` | `portfolio.revision`, `portfolio.provenanceDigest`, `portfolio.lastUpdated`, `portfolio.holdings[]` | `frontend/server/user-portfolio-transport.ts` l.467–470; type `G2PortfolioView`, `userPortfolioContract.ts` l.249–261 |
| `GET /api/user-portfolios/<portfolioId>/revisions` | one entry per revision: `revision`, `operation`, `provenanceDigest`, `holdingsCount`, `createdAt`, `totalMarketValue` | `user-portfolio-transport.ts` l.472–476; type `G2RevisionEntry`, l.317–324 |

Both are read-only when sent with `GET`. Both go through the same server process, the same environment and the same adapter as the identities route, and the detail read uses the same IPC operation, `portfolio.get` (**R**). The holdings array of the detail read and `identities[]` are in the same order, and the detail read passes each holding's `securityIdentity` through (**R**, observed).

### 7.2 The method

Read the detail, read the identities, read the detail again. Accept the identities response as a read of revision 1 only if, in both detail reads:

- `portfolio.revision` is 1;
- `portfolio.provenanceDigest` is the same string, and equals the provenance digest in the local capture, compared locally by exact equality;
- the number of holdings is 64, and equals `count` in the identities response.

The revisions read should show that the highest revision is 1 and that the entry for revision 1 carries the same provenance digest.

### 7.3 Why this is sound, and its limit

- **D.** If the current revision is 1 before and 1 after, it was 1 in between, because revision numbers only move forward (F8). The holding rows of revision 1 do not change once written (F8). The identities read in between therefore read the rows of revision 1. This depends on the IPD service on the host behaving as the reviewed source; the host-reported checkout has the same source for these files.
- **Limit.** This is read consistency by bracketing, across three separate requests. It is not a server-side binding and not atomicity. It is the same kind of evidence as the capture itself, whose acceptance rule is that both of its `portfolio.get` reads name the same revision and the same provenance digest (`frontend/server/user-portfolio/capture/ownerBoundPortfolioCapture.ts` l.34–44).
- **If the current revision is no longer 1,** the holdings of revision 1 cannot be read through any existing API (F2). In that case no identities response is evidence about revision 1, and none is to be presented as such.

The capture utility is an alternative for the before and after reads. It produces a sanitized summary with the revision, the history entry count and IPD's stored instant for that revision. It is a separate process with its own configuration, so that it read the same service as the IRR server is an operator attestation. The two `GET` reads above do not have that gap.

## 8. The host operation that can safely proceed

This is a description of an operation for the operator. It was not performed here, and nothing from the host is requested other than the sanitized values listed under "Publish".

**Preconditions.** The IRR server and the IPD IPC service are running as they were for the capture. Nothing is restarted, imported or saved for this step. The portfolio id is the one the operator already holds from the local capture.

**Requests.** All to the IRR server on the loopback address, all with method `GET`, with no request body, in this order and without delay between them:

| # | Request | Purpose |
|---|---|---|
| 1 | `GET /api/user-portfolios/<portfolioId>` | revision and provenance digest before |
| 2 | `GET /api/investment/portfolio/<portfolioId>/identities` | the resolver outcome |
| 3 | `GET /api/user-portfolios/<portfolioId>` | revision and provenance digest after |
| 4 | `GET /api/user-portfolios/<portfolioId>/revisions` | history corroboration |

**Hazard.** The path of requests 1 and 3 also accepts `DELETE` when the personal-use path is enabled, and `POST /api/user-portfolios` creates a portfolio. Use `GET` explicitly and nothing else. Request 2 refuses every method other than `GET` and `HEAD` before any read.

**Accept the result only if** all the checks of section 7.2 hold. If request 1 or 3 does not return revision 1 with the captured provenance digest, stop: report that fact and do not report the identities.

**Publish** (counts, digests of identity files, yes/no answers and status codes only):

- the IRR checkout commit, and the operator's UTC time before request 1 and after request 4;
- the HTTP status of each request;
- from requests 1 and 3: the revision number of each; whether the two provenance digests are equal; whether they equal the captured digest; the holdings count of each;
- from request 4: the number of entries; the highest revision; whether the entry for revision 1 carries the same provenance digest;
- from request 2, if 200: `count`; the tally per `state`; the tally per pair of `state` and `reason`; how many identities have a non-null `issuerId`, a non-null `securityId`, and `assessable` true; `directory.rosterDigest` and `directory.rosterDataClass`;
- for item E3: the `state` and `reason` of `identities[i]`, where `i` is the index, in the holdings array of request 1, of the one holding whose `securityIdentity` is an object;
- from request 2, if 503: `error`, and each issue's `file` and `code`.

**Do not publish** any response body, the portfolio id, any symbol, ISIN, issuer id, security id, company, quantity, price or amount, the provenance digest value, `issues[].subject`, or any path or endpoint name.

**What the result is.** The IRR resolver outcome on the reported build for the holdings of the portfolio while its current revision was 1 with the captured provenance digest. It is host evidence reported by the operator and subject to review. It does not accept W04.

## 9. What to expect on the reported build

- **D.** On IRR `08411bc`, if the identity files load, every one of the 64 holdings is expected to return `UNMATCHED` with reason `NO_IDENTIFIER_PROVIDED`. A holding persisted by IPD carries no flat `isin` and no `exchange`, and this build does not read `securityIdentity`. This is a prediction from source and from the synthetic runs of section 12. It is not a host fact.
- **D.** If the identity files are absent or invalid, the answer is 503 `identity-sources-unavailable`, and no holdings are read.

Either result is evidence. On this build the informative parts are the HTTP status, the roster digest and the roster data class, which are the only observation of the IRR identity source version loaded on the host. An issuer mapping for the one populated identity cannot come from this build; that needs the code in PR #563 (roadmap item W08).

## 10. Gaps, and the authority each change would need

Nothing in this table was implemented. None of it is needed for the operation of section 8.

| # | Gap | Change that would close it | Scope and authority |
|---|---|---|---|
| G1 | The identities response does not name the revision it read. | Return `revision` and `provenanceDigest` (and `lastUpdated`) from the same `portfolio.get` result the identities were resolved from. IPD reads them in one transaction with the holdings, so the response would be bound to one revision by construction. | IRR only: the provider in `sources.ts`, the handler, the client mirror and tests. An additive change to the route's response contract. Needs the decision of the IRR owner of this route. It touches the same files as open PR #563 and should be sequenced with it. IRR pushes from this workspace are refused, so delivery would be a patch or bundle. |
| G2 | No aggregate counts by state and reason. | An additive summary block in the response, or a read-only collector of the kind built for W03 that writes a sanitized summary. | IRR only. Same authority as G1. A collector is new IRR code and needs its own authorization. |
| G3 | The listing-map and corporate-action digests are not in the response. | Add them to `directory`. The loader already computes them. | IRR only. Same authority as G1. The W04 deliverable asks for listing versions, so this gap matters for the W04 record. |
| G4 | A revision that is no longer current cannot be read. | A revision-addressed read: a new IPD IPC operation or payload field, and a revision parameter on the IRR port. | A change to the IPD wire contract, whose operation set is closed, and to the IRR port. A cross-repository contract decision. Not needed while the current revision is 1. |
| G5 | On `08411bc`, the 503 for missing identity files returns a local directory path in `issues[].subject`. | Already changed at the head of PR #563. | None here. Handled in section 8 by not publishing `subject`. |

`GET /api/investment/coverage` does return the listing-map and corporate-action versions. It is not part of section 8: it reads every portfolio of the owner and the watchlist store, and the watchlist journal loader has a tail-recovery path that rewrites the journal file, so the route is not shown here to be free of writes.

## 11. Corrections to item E1 of the W04 evidence assessment

Item E1 stays, with these corrections. The W04 evidence assessment now points here.

| E1 as written | Correction |
|---|---|
| Confirm revision 1 before and after with the capture utility | Use requests 1 and 3 of section 8; they go through the same server as the identities read. The capture utility remains an acceptable alternative. Check the revision number and the provenance digest, not the digest alone (F7). |
| Publish the count per `state` and per `reason` | These are local tallies of `identities[]`, not response fields. |
| Publish `directory.rosterVersion`, `rosterDigest` | One value; publishing `rosterDigest` is enough. |
| Publish each issue's `file` and `code` | Unchanged. In addition, never publish `subject`. |
| IRR source versions | The route gives the roster digest and data class only. Listing-map and corporate-action versions stay unavailable (G3). |
| Expected result: `UNMATCHED` for all 64, or 503 | Confirmed from source, with the reason `NO_IDENTIFIER_PROVIDED` (section 9). |

## 12. Verification

All runs were made in a Linux sandbox on 2026-11-13. Probe scripts and outputs are in [`evidence/integration/w04-identities-endpoint-revision-binding-2026-11-13/`](../../evidence/integration/w04-identities-endpoint-revision-binding-2026-11-13/README.md). Every probe uses synthetic input only.

| Run | Result |
|---|---|
| IRR `08411bc`, frontend suites for this route, the adapter, the IPC contract alignment, the user-portfolio transport, the capture utility and the two UI suites that consume the route (12 files) | 316 passed, 0 failed |
| IRR `08411bc`, platform `tests/investment/identity-*.test.ts` | 104 passed, 0 failed |
| IPD, read-contract, read-isolation, personal path, restore, holding security identity, framing, repeat-import and broker-import IPC suites (8 files) | 126 passed, 0 failed |
| IPD `npm run build:tsc` | exit 0 |
| Handler probe, `irr-identities-endpoint-probe.ts`, at `08411bc` and `d10afbb` | exit 0; F1, F4, F5, F6 and the response shape of section 3.3 |
| Composed-server probe, `irr-composed-server-probe.ts`, at `08411bc`: the real HTTP server and the real IPC client against IRR's own synthetic IPC peer | exit 0; the three routes of section 8 return 200; only `portfolio.get` and `portfolio.revisions` reach the peer; other methods on the identities route return 405 with no IPC request |
| IPD probe, `ipd-portfolio-get-revision-probe.mjs`: the real store and connection handler on an in-memory database | exit 0; F2, F3, F7, F8. Output identical on two runs. |

The composed-server probe cannot run at `d10afbb`: that branch predates the synthetic peer.

## 13. Status and next activity

| Part | State |
|---|---|
| Whether the route is revision-bound | Settled: it is not (section 5). |
| An existing read-only way to establish the revision | Identified and exercised on synthetic input (sections 7 and 8). |
| Host evidence E1 and E3 | Not collected. The operation of section 8 can proceed. |
| W04 | PARTIALLY COMPLETE. Not accepted. |

Next activity: the operator performs section 8 and reports the values listed there, together with items E2 and E4 of the W04 evidence assessment. A reviewer then reads them with the sanitized capture and inventory summaries.

## 14. Not examined

- Anything on the Windows host, including the identity files, the running services and their configuration.
- Whether the portfolio is still at revision 1.
- `GET /api/investment/coverage` beyond the note in section 10.
- The broker-import evidence route of item E4.
- Named-pipe behaviour on Windows; the synthetic runs used a local socket on Linux.
