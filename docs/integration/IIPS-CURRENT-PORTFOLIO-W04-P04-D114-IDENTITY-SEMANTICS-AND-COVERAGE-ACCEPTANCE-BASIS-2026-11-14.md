# W04 — P04 versus D114 identity semantics and the coverage acceptance basis

**Date:** 14 November 2026. **Type:** read-only investigation and semantic reconciliation. Not a qualification, not an admission, not a Program Authority act, not an implementation.
**Roadmap authority:** `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` (work item **W04**, and the W20 coverage methodology in section K).
**Scope:** resolve the apparent discrepancy between persisted P04 identity status and the D114 security-to-issuer resolver outcome; establish the evidence-based W04 coverage acceptance methodology; and determine whether a numeric θI can legitimately be established now.

**Outcome in one line:** the discrepancy is **expected, not defective** — P04 and D114 are two different, compatible identity layers; the observed 1/64 is the **correct** D114 result for the evidence supplied; and **`THETA_I = NOT YET ESTABLISHED`** because the roadmap's threshold-setting inputs do not yet exist.

---

## 1. Repositories and exact commits inspected

| Repository | Commit | Inspection mode |
|---|---|---|
| `ramkivs/iips-production-market-data` (IPD) | `c260a8222661519c317183dc62c501d1b7a4cdae` | Read-only, via a fresh clone at `/tmp/w04-work`. The principal's own local checkout was **not** synchronized, switched, checked out, pulled, merged, rebased or reset. |
| `ramkivs/iips-review-recovered` (IRR) | `08411bcd6d782a601fe5c82cc9983d076831148d` (`main`) | Read-only, via a fresh clone at `/tmp/irr-clone`. |
| IRR PR #563 head | `87658602966cfedf98fa59a627807d160808f645` | Read-only, via `git fetch` of `origin/arena/e8f9f3d2-iips-review-recovered`. The D114 adapter and its tests live here and are **not** yet on IRR `main`. |

IRR PR #563 state at inspection: **OPEN, unmerged**, base `main`, head `arena/e8f9f3d2-iips-review-recovered`. Its D114 commits are `7f3f7db1` (implementation, 12 Nov 2026) and `8765860` (the published D114 test commit, 14 Nov 2026 — the same date as the host evidence in the task).

**No cross-repository write was made. No PR was merged. No portfolio was mutated. No identifier was manufactured or enriched. No source data was substituted. No market refresh, endpoint or scheduler was introduced.**

---

## 2. P04 semantic trace

### 2.1 The four terms, traced to their definitions

| Term | Defining location | Actual type / value | Meaning |
|---|---|---|---|
| `identityStatus` | `src/persistence/brokerImportPersistence.ts:43` | literal type `'RESOLVED'` (only one permitted value in the resolved variant) | The **issuer-level** broker observation resolved to exactly one governed P04 canonical company. |
| `resolutionDisposition` | `src/persistence/brokerImportPersistence.ts:44` | literal type `'CANONICAL_P04'` | The company was sourced from the **governed P04 security master**, not from an operator bypass or a manual entry. |
| `companyId` | `src/persistence/portfolio_store.ts:80` | `string` | The **authoritative issuer identity** in P04: `src/identity/security_master.ts:20` declares `companyId: string; // Authoritative engine-compatible ID`. |
| nested `securityIdentity` | `src/persistence/portfolio_store.ts:92-98` | `D114SecurityIdentity \| null \| undefined` | The **exact tradable security identity** `ISIN:<isin>:<series>` (`src/contracts/types.ts:81-86`). |

### 2.1.1 Where `identityStatus` / `resolutionDisposition` come from

`src/persistence/brokerImportPersistence.ts:71-78`:

```ts
const outcome = resolver.resolve(holding, request.importedAt);
if (outcome.status !== 'RESOLVED') { /* refused */ }
assessments.push({ symbol: holding.symbol, saveable: true, sourceRevision: outcome.sourceRevision });
resolved.push({ ...holding, companyId: outcome.companyId, identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04' });
```

The resolver is `src/identity/broker_observation_resolver.ts`. Its resolution is **issuer-scoped by construction**:

- `resolveCompanyId` (`src/identity/mapping_store.ts:44-92`) resolves an identifier to a **`companyId`** through the P04 mapping store, with effective-dating (`effectiveFrom`/`effectiveTo`) and fail-closed quarantine on zero or multiple distinct `companyId`s.
- The broker observation it accepts (`broker_observation_resolver.ts:7-11`) is `{ symbol, isin?, exchange? }` — **there is no `series` field anywhere in the P04 broker-import observation**. Without `series`, no canonical security identity can be formed at this layer at all.

### 2.1.2 Where the nested `securityIdentity` comes from — a *separate* path

`src/persistence/brokerImportPersistence.ts:127-166` (`mapBrokerImportHoldings`):

```ts
let securityIdentity: D114SecurityIdentity | null = null;
if (h.isin && h.exchange && securityMaster && registry) {
  const result = qualifyHoldingSecurityIdentity({ isin: h.isin, exchange: h.exchange, symbol: h.symbol }, securityMaster, registry);
  if (isQualifiedSecurityIdentity(result)) { securityIdentity = result.securityIdentity; }
  // Unresolved → securityIdentity stays null; holding is still mapped
  // and persisted (identity is additive, never blocks portfolio data).
} else {
  securityIdentity = buildD114SecurityIdentity(h.isin, h.series) ?? null;
}
return { ..., identityStatus: h.identityStatus, resolutionDisposition: h.resolutionDisposition, securityIdentity };
```

**This is the mechanism behind the observed data.** `identityStatus` and `resolutionDisposition` are copied **verbatim** from the issuer-level broker-import outcome. `securityIdentity` is set by an **independent** qualification path (`src/providers/dhan/dhan_security_identity_service.ts`) that can fail closed to `null` while the holding is still persisted. The two fields are not derived from one another.

### 2.2 What P04 actually represents

**P04 is canonical company/issuer association, and — for a given ISIN — security qualification.** It is *not* a security-to-listing resolution and it is *not* a security-level identity.

`src/providers/dhan/dhan_security_identity_service.ts` documents the joint path precisely (header, lines 8-12):

```
IRR holding input (ISIN + exchange)
  → P04 exact company correspondence + ACTIVE exchange listing
  → P7 vendor-master series evidence + qualification
  → D114 canonical identity (ISIN:<isin>:<series>)
```

So P04 contributes two things to a D114 identity: (a) the **issuer** via `resolveCompanyId`, and (b) an **ACTIVE listing** check. The **series** — the third D114 component — comes from P7, not P04. P04 alone cannot produce `ISIN:<isin>:<series>`.

The P04 entity itself is issuer-shaped (`src/identity/security_master.ts:19-34`):

```ts
export interface SecurityMasterEntity {
  companyId: string; // Authoritative engine-compatible ID
  isin: string;
  companyName: string;
  industry: string;
  sector: string;
  listings: ExchangeListing[];   // exchange, symbol, scripCode, status, lotSize, tickSize
  effectiveFrom: string;
  effectiveTo?: string;
  ...
}
```

One entity holds **one** `companyId` and a **list of** listings. There is no `series` field and no security-level identifier on the entity. A P04 entity is therefore an **issuer** with listings — not a security.

### 2.3 The governing source and validation rules for P04 status

| Property | Evidence |
|---|---|
| Governing corpus | `src/identity/governed_fixture_master.ts:52-58` — `AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001`, batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, 2,390 records, checksum `b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4`. |
| Resolver precondition | `src/identity/broker_observation_resolver.ts:37-45` — the resolver **throws** unless the master revision has `recordCount === 2390`, a 64-hex checksum, and that exact authorization reference. A misconfigured master cannot silently resolve. |
| Every supplied identifier must agree | `broker_observation_resolver.ts:47-66` — all supplied identifiers resolve and must agree on one `companyId`; a valid ISIN may **not** mask a conflicting or unknown supplied symbol. |
| Fail-closed | `mapping_store.ts:58-89` — zero matches → `IdentityAmbiguityError(UNMAPPED_IDENTIFIER)`; multiple distinct `companyId`s → `IdentityAmbiguityError(AMBIGUOUS_COLLISION)`. |
| Effective-dated | `mapping_store.ts:52-55` — a mapping counts only when `asOf` lies inside `[effectiveFrom, effectiveTo]`. |
| Whole-import gate | `brokerImportPersistence.ts:79-84` — the import is refused unless **every** holding has one governed canonical identity. |

### 2.4 Is P04 `RESOLVED` permitted while `securityIdentity` is null?

**Yes — and this is by design, not a defect.** Three independent pieces of evidence:

**(a) The contract comment states it.** `src/persistence/portfolio_store.ts:92-97`:

> *"The exact canonical P04 `D114SecurityIdentity` (`ISIN:<isin>:<series>`), persisted verbatim when authoritative evidence supplied it. `null`/absent means EXPLICITLY UNRESOLVED — it is never reconstructed from symbol, company name, ISIN-only or exchange listing alone."*

Note precisely what this says: `null` means *security identity* is explicitly unresolved. It does not say the *issuer* is unresolved.

**(b) The implementation comment states it.** `src/persistence/brokerImportPersistence.ts:120-122`:

> *"When qualification fails closed, `securityIdentity` is null (unresolved) and the holding is still persisted — identity is additive metadata, not a blocker for portfolio data."*

**(c) Empirically reproduced (read-only, this investigation).** Driving the real P04 resolver and the real mapper over a synthetic holding:

```
P04 master recordCount: 2390
P04 master authRef: AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001
resolveCompanyId(NSE_SYMBOL:RELIANCE) -> EQ_RELIANCE_IN

Mapped holding:
  identityStatus        = RESOLVED
  resolutionDisposition = CANONICAL_P04
  companyId             = EQ_RELIANCE_IN
  securityIdentity      = null

=> P04 RESOLVED + CANONICAL_P04 with securityIdentity null: true
```

A symbol-only observation resolves to a governed issuer through the NSE_SYMBOL namespace, receives `RESOLVED` / `CANONICAL_P04`, and carries **no** security identity — because no `series` was ever supplied.

**This is exactly the state of the 63 unmatched rows.** The broker export that populated `DHAN_PORTFOLIO` carried no usable per-row security identifier; the issuer association nonetheless resolved through the governed master, and the security identity could not be formed.

### 2.5 Is `companyId` an authoritative issuer identity, a hint, or a narrower reference?

**In IPD it is an authoritative issuer identity.** `src/identity/security_master.ts:20` declares it as such, and `resolveCompanyId` is the governed function that produces it.

**In IRR it is deliberately demoted to a hint**, and it is demoted *at the IRR boundary*, not in IPD. `frontend/server/investment/sources.ts:70-71`:

```ts
// IPD's companyId is a lookup hint at most; the resolver never treats it as proof of identity.
companyIdHint: holding.companyId,
```

and `iips-platform/src/investment/identity/types.ts:94-95`:

```ts
/** IPD `companyId`, used as a conflict indicator only — it is never proof of identity. */
readonly companyIdHint: string | null;
```

These two statements are **consistent, not contradictory**. `companyId` is authoritative *for what it is*: the canonical issuer under P04. It is not authoritative *for security identity*, and IRR declines to use it as such.

### 2.6 Does the P04 contract distinguish issuer identity from exact tradable security identity?

**Yes — explicitly and in three places.**

1. `src/identity/security_master.ts:19-34` — the entity carries `companyId` plus a `listings[]` array; there is no security-level identifier and no `series`.
2. `src/contracts/types.ts:103-106` — `buildD114SecurityIdentity` builds an identity "only from explicit source values… **no series is inferred and no companyId is consulted**."
3. `src/providers/dhan/dhan_security_identity_service.ts:22-26` — the `HoldingIdentityInput` contract carries `isin` and `exchange` but explicitly **no** `series`: *"IRR provides available ISIN and exchange only; series is never supplied or inferred by IRR."*

The IRR-side assessment record reaches the same conclusion independently: `docs/integration/IRR_STAGE_3A_HOLDING_IDENTITY_AUTHORITATIVE_SOURCE_ASSESSMENT.md:26-27` — *"Company-level identity (`companyId`) is distinguished from security-level `ISIN:<isin>:<series>` throughout"* and *"`companyId` is an IPD company lookup hint at most; IRR never treats it as proof of security identity."*

### 2.7 Does any consumer incorrectly interpret P04 status as proof of D114-qualified security identity?

**No consumer was found that does so.** This was checked specifically:

| Checked consumer | Result |
|---|---|
| IRR `toHoldingObservation` (`frontend/server/investment/sources.ts`) | Treats `companyId` as a hint; sets `series` from the nested identity only; never treats `identityStatus` as identity proof. |
| IRR resolver (`iips-platform/src/investment/identity/resolver.ts:255-273`) | `companyIdHint` is used **only** to detect a conflict with the ISIN-derived issuer. It can never promote a row to `RESOLVED`. |
| IRR `holding-identity-transport.ts` | Resolves through `toHoldingObservation` → `identityInputOf` → `resolveIdentity`, reusing the coverage rules verbatim. |
| IPD `portfolio_store.ts` / `brokerImportPersistence.ts` | `identityStatus` and `resolutionDisposition` are never consulted when deciding whether `securityIdentity` is present. |
| IPD `manualPersonalPortfolio.ts:12-18` | Manual entries are separated by `resolutionDisposition: MANUAL_PERSONAL_ENTRY` precisely so an audit cannot confuse them with a canonical mapping. |

One nuance worth recording: IRR *does* carry IPD's `identityStatus` as `upstreamStatus` (`sources.ts:75`), explicitly labelled *"Upstream status the source surface published, carried for reconciliation, not for authority"* (`types.ts:101-102`). That is the opposite of a misreading — it is the upstream status preserved and explicitly disclaimed.

---

## 3. D114 semantic trace

### 3.1 Authoritative resolver inputs

`iips-platform/src/investment/identity/types.ts:86-96` — `IdentityInput`:

| Field | Authority |
|---|---|
| `isin` | **Authoritative.** Primary resolver input. |
| `symbol` | Authoritative only in combination with `exchange`. |
| `exchange` | Authoritative only in combination with `symbol`; must be `NSE` or `BSE`. |
| `series` | Authoritative discriminator when the source publishes one; **never inferred** (`types.ts:93`). |
| `cin` | Optional issuer key; validated, never trusted blindly. |
| `companyIdHint` | **Conflict indicator only — never proof of identity** (`types.ts:94-95`). |

The contract header (`types.ts:5-7`) is the governing statement:

> *"Three identity levels, never conflated: issuer (CIN-primary, equity-ISIN fallback), security (ISIN), listing (exchange + symbol + series + instrument + effective window). An observation resolves to all three or it resolves to nothing, with a named state and a displayable reason."*

### 3.2 How ISIN and series are handled

**ISIN path** (`resolver.ts:222-397`): syntax-validate (`isValidIsin`) → look up in the roster by ISIN (**no fallback** — a valid ISIN absent from the roster is `ISIN_NOT_IN_ROSTER`, `resolver.ts:228-233`) → derive the issuer from `security.issuerId` → check CIN and company-hint agreement → require at least one listing → narrow the active listings **by the observation's own series, symbol and exchange evidence**, reporting any narrowing that would leave nothing rather than silently ignoring it → resolve to exactly one listing.

**Series is a real discriminator, not decoration** (`resolver.ts:300-307`):

> *"A series is a real discriminator: one ISIN can carry several listings (an equity listing and a warrants listing, say), and a holding that says `series=BE` is not the `EQ` listing even though both belong to the same security… An explicitly supplied series is never overridden by a preference rule."*

**Symbol path** (`resolver.ts:398-500`): requires both `symbol` and `exchange`; looks up the listing map; filters by series when supplied; filters by effective window; rejects a reused symbol, a symbol shared by several securities, and a symbol belonging to a different security than observed.

### 3.3 Is exchange/listing evidence required, and how obtained?

**Yes, for the symbol path** — without `exchange` the resolver refuses before any lookup (`resolver.ts:398-404`). For the ISIN path, exchange is *not* a required input; the listing is derived from the listing map and then **narrowed** by whatever exchange/symbol/series the observation carries. Listing evidence comes from the governed listing map (`types.ts:170-182` — `ListingMapEntry` with `exchange`, `symbol`, `series`, `instrumentType`, `effectiveFrom`, `effectiveTo`).

### 3.4 How null identity is represented

**In IPD:** `securityIdentity` is `null` (explicitly unresolved) or absent. `src/persistence/portfolio_store.ts:1120-1121`:

```ts
private projectedSecurityIdentity(raw: unknown, symbol: string): D114SecurityIdentity | null {
  if (raw === null || raw === undefined) return null;
```

A stored value that is malformed, or does not conform to the canonical D114 grammar, **refuses the read** rather than projecting a fabricated identity (`portfolio_store.ts:1131-1133`).

**In IRR:** the projection classifies the nested value into four kinds (`iips-platform/src/investment/identity/d114Projection.ts`):

| Kind | Meaning | Resolver effect |
|---|---|---|
| `absent` | No `securityIdentity` property. | Flat compatibility path (`isin`/`series` as supplied, else null). |
| `unresolved_null` | Explicit `null`. | `isin`/`series` null. **Nothing inferred.** |
| `populated` | Valid D114 object. | Lossless projection of `securityId`, `isin`, `series`, `isinAuthority`. |
| `rejected` | Malformed, or conflicting with a co-supplied flat ISIN/series. | `MALFORMED` or `CONFLICT`; the resolver refuses fail-closed, never silently falling back to `symbol + exchange`. |

### 3.5 Why symbol-only or companyId-only matching cannot promote a security to `RESOLVED`

**companyId-only cannot promote, by construction.** `companyIdHint` is read at exactly one place in the ISIN path (`resolver.ts:255-273`) and its only effect is to *fail* the row with `ISSUER_KEY_CONFLICT` when it disagrees with the ISIN-derived issuer. There is no code path in which `companyIdHint` yields an `issuerId`. `resolvedWith` (`resolver.ts:157-181`) is only ever called with an `issuer` obtained from `issuerById.get(security.issuerId)` or `issuerById.get(distinctSecurities[0].issuerId)` — **always derived from a security, never from a company hint.**

**Symbol-only cannot promote without an exchange.** The symbol path requires both (`resolver.ts:398-404`), and `exchange` must be `NSE` or `BSE` (`resolver.ts:406-411`). A symbol that is not in the listing map is `SYMBOL_NOT_IN_LISTING_MAP`; a symbol with no active listing is `STALE_REFERENCE`; a symbol shared by two securities is `AMBIGUOUS` / `AMBIGUOUS_LISTING`; a symbol belonging to a different security is `SYMBOL_REUSED_BY_OTHER_SECURITY`.

**This is the governing roadmap rule too** — W08's acceptance evidence requires *"no symbol-only identity"*, and the roadmap's W04 acceptance requires *"reconciled rows and exact security→listing→issuer mapping; **no symbol-only identity**."*

### 3.6 Is `NO_IDENTIFIER_PROVIDED` the correct outcome for the 63 rows?

**Yes — it is the correct and only permitted outcome for a row carrying neither a usable ISIN nor an exchange-qualified symbol.**

`resolver.ts:398-404`:

```ts
if (input.symbol === null || input.exchange === null) {
  return withObservationId(
    failure('UNMATCHED', 'NO_IDENTIFIER_PROVIDED', 'the row carries neither a usable ISIN nor an exchange symbol'),
    input.observationId,
  );
}
```

`types.ts:60`: *"The row carries neither an ISIN nor an exchange symbol, so nothing can be resolved."*

**Empirically reproduced (read-only, this investigation)**, driving the real resolver over the real row shapes:

```
companyId-only (observed 63 rows)
  state        = UNMATCHED
  reason       = NO_IDENTIFIER_PROVIDED
  issuerId     = null
  securityId   = null
  listingId    = null
  basis        = null

companyId + symbol, no exchange
  state        = UNMATCHED
  reason       = NO_IDENTIFIER_PROVIDED
  issuerId     = null
  securityId   = null
  listingId    = null
  basis        = null

nested D114 identity (observed 1 row)
  state        = RESOLVED
  reason       = null
  issuerId     = IN:CIN:U72200TN2001PLC000005
  securityId   = IN:ISIN:IN0000000029
  listingId    = IN:NSE:BODHI:EQ:EQUITY
  basis        = ISIN
```

The observed 63-row outcome is reproduced **exactly**. The observed 1-row outcome is reproduced **exactly**.

### 3.7 Does the adapter preserve the nested identity losslessly?

**Yes, and it is covered by a dedicated published test.** The IRR PR #563 test commit `8765860` adds `frontend/server/investment/phase1D114WireToResolverInput.test.ts`, which carries a persisted IPD holding over the **real** read path:

```
IPD `portfolio.get` response frame
  → `callIpc` (framing + OC-6 inbound disclosure scan)
  → `IpcUserPortfolioPort.getPortfolio` (`toG2View`)
  → `createPortfolioHoldingsProvider`
  → `toHoldingObservation` (`projectD114SecurityIdentity`)
  → `identityInputOf`  (the resolver input)
  → `resolveIdentity`
```

Its assertions include: `expect(JSON.stringify(holdings)).toBe(JSON.stringify(WIRE_HOLDINGS))` — *"Byte-for-byte: same keys, same order, same values, `null` still `null`. Nothing added, nothing dropped"* — and, per holding, `expect(Object.prototype.hasOwnProperty.call(holding, 'isin')).toBe(false)` and the same for `exchange`: *"IPD persists neither a flat ISIN nor an exchange; the read path must not manufacture either."*

The test also asserts the decisive case directly — a holding with `identityStatus: 'RESOLVED'`, `resolutionDisposition: 'CANONICAL_P04'` and `securityIdentity: null`:

```ts
expect(identities[1]).toMatchObject({
  state: 'UNMATCHED',
  reason: 'NO_IDENTIFIER_PROVIDED',
  outcomeClass: 'UNRESOLVED',
  issuerId: null, securityId: null, listingId: null, isin: null, series: null,
  d114SecurityIdentity: null,
});
```

with the comment: *"`AARAV` is an active NSE symbol in the fixture listing map. A stored NULL identity must not be completed from it: there is no ISIN and no exchange, so there is no identity."*

**The IRR side already implements exactly the correct behaviour for the observed data.** No D114 implementation or test work is needed or duplicated.

---

## 4. Reconciliation — is the discrepancy expected or defective?

**Finding: A. P04 and D114 represent two different, compatible identity layers. There is no contract or implementation defect.**

### 4.1 Field-by-field semantic comparison

| Field | P04 (IPD) | D114 (IRR) | Same thing? |
|---|---|---|---|
| `identityStatus` | `RESOLVED` — the broker observation resolved to one governed P04 **issuer** | (not consumed as authority; carried as `upstreamStatus` for reconciliation only) | **No** — different layer |
| `resolutionDisposition` | `CANONICAL_P04` — the issuer came from the governed P04 master, not a bypass or manual entry | (same: carried, disclaimed) | **No** — provenance of the *issuer* |
| `companyId` | Authoritative **issuer** identity (`security_master.ts:20`) | `companyIdHint` — a **conflict indicator**, never proof of identity | **No** — demoted at the IRR boundary, deliberately |
| nested `securityIdentity` | The **exact tradable security** `ISIN:<isin>:<series>`, `isinAuthority: NON_AUTHORITATIVE`; `null` = explicitly unresolved | `d114SecurityIdentity` — projected losslessly; `null` = explicitly unresolved | **Yes — this is the shared, security-level fact** |
| *(not present in P04)* | — | `issuerId` / `securityId` / `listingId` / `resolutionBasis` | **No** — D114-only outputs |

### 4.2 The two measurements are of different things

| | P04 status | D114 resolver outcome |
|---|---|---|
| Question answered | *Which issuer does this observation belong to?* | *What exact tradable security, listing and issuer does this row evidence?* |
| Input needed | symbol (or ISIN) + exchange | ISIN **and** series, **or** symbol **and** exchange — plus a matching listing map |
| Result on the 63 rows | `RESOLVED` — issuer association succeeded | `UNMATCHED / NO_IDENTIFIER_PROVIDED` — no security-level evidence exists |
| Result on the 1 row | `RESOLVED` | `RESOLVED` on ISIN basis |

The P04 status answers a question the D114 resolver does not ask. The two are **not equivalent measurements**, and the task's instruction that they "must not be treated as equivalent measurements until their contracts and meanings have been traced" is now discharged: they are **not equivalent measurements, and were never intended to be.**

### 4.3 Why the 63 rows have a P04 issuer but no D114 security identity

The Dhan broker export that populated `DHAN_PORTFOLIO` supplied **no usable per-row security identifier**. IPD's own broker-import observation contract has no `series` field, and the export carried no ISIN/exchange pair that survived the governed qualification path. So:

- The **issuer** association succeeded through the P04 master's symbol/exchange namespaces → `RESOLVED` / `CANONICAL_P04`.
- The **security** identity could not be formed → `securityIdentity: null`.

Both statements are true simultaneously and are *designed* to be independently true.

### 4.4 Precedent — the same pattern, already reconciled

IRR's `docs/integration/WS-A-68-ROW-IDENTITY-ASSESSMENT-RECONCILIATION-2026-11-09.md` records the identical phenomenon on the 68-row surface, and settles the interpretive question:

- **R1/R2/R3** — 68 positions, *name only* supplied, resolved 0 / 1 / 3 depending on the master revision.
- **R4** — the same 68 positions with an ISIN supplied from the B-04 companion export, resolved **65**.

Its conclusion (§1.1): *"R4 is therefore NOT a result obtained from the Web UI Summary CSV… the governed path can only attempt exact-key lookups in the `NSE_SYMBOL` and `BSE_SYMBOL` namespaces… No lookup was *attempted* against the ISIN namespace because the input contract never carried one."*

That is the same structural cause as the present 1/64: **the identifier the higher-precision layer needs was never in the source.** The 64-row result is the D114-equivalent of R3.

### 4.5 What each surface should expose

| Surface | Status it should expose | Owner |
|---|---|---|
| IPD `portfolio.get` → holding | `identityStatus` (issuer), `resolutionDisposition` (issuer provenance), `securityIdentity` (security-level, possibly `null`) — **exactly as today** | IPD |
| IRR holding-identity endpoint | `state` / `reason` from the governed resolver, plus `d114SecurityIdentity` — **exactly as today** | IRR |
| W04 coverage census | **Two separate columns**: P04 issuer status and D114 security-identity status | W04 record (this document) |

**No code change is required to make these surfaces agree, and none should be made.** Making them display the same status would misrepresent the evidence: it would erase the distinction between "we know the issuer" and "we know the security", which is the distinction the entire W04/W08 split rests on.

---

## 5. W04 coverage census — the same-revision 64 rows

### 5.1 Method and limitations

**Census basis:** the actual host evidence supplied for this task — portfolio `DHAN_PORTFOLIO`, captured persisted revision **1**, **64 holdings**, before/after snapshots identical, provenance digest `17b2b2833268222310c21f7b685d0ca5e595ebd6a62bda7f118a9c0c6b84781f`, identity endpoint HTTP success with **64 rows**.

**This census is derived from the supplied host evidence and the traced contracts. No host was accessed in this investigation** (the roadmap's B02 and the task's own restrictions place host access outside this pass), and **no row-level identifier, quantity, price or value is reproduced here.** Counts are sanitized aggregations only.

### 5.2 Category census

The roadmap's required categories, reconciled so that each row has exactly one disposition:

| Roadmap category | Count | Basis |
|---|---:|---|
| **Qualified and resolved** (exact security identity + eligible listing/series + traceable to one issuer) | **1** | D114 `RESOLVED` on ISIN basis; nested D114 identity present and valid; listing resolved. |
| **Ambiguous** | **0** | No row returned `AMBIGUOUS`, `AMBIGUOUS_LISTING`, `DUPLICATE_ACTIVE_SYMBOL`, `MULTIPLE_SECURITIES_SHARE_LISTING` or `ISSUER_KEY_CONFLICT`. |
| **Missing / unresolved** | **63** | D114 `UNMATCHED` with reason `NO_IDENTIFIER_PROVIDED` on all 63. The rows carry an issuer reference but no security-level identifier. |
| **Expired / ineligible** | **0** | No row returned `STALE_REFERENCE`, `INELIGIBLE`, `LISTING_WINDOW_EXPIRED`, `LISTING_NOT_YET_EFFECTIVE`, `SECURITY_NOT_LISTED`, `INSTRUMENT_NOT_ASSESSABLE`, `NON_INDIAN_ISSUER`, `EXCHANGE_NOT_SUPPORTED` or `ISSUER_NOT_ELIGIBLE`. |
| **Unavailable** | **0** | The identity endpoint returned HTTP success with 64 rows; the roster, listing map and corporate-action table loaded (roster version `sha256:4baa4e…`, classification `OPERATOR_SUPPLIED`, 2,388 issuers / 2,388 securities / 2,388 listings, zero corporate-action records). **Nothing was unavailable.** |

**Reconciliation:** `|T| = 64 = 1 + 63`. Every row carries exactly one disposition. `|E|` (the eligible set) is **not** established by this census — see §6.

**The zero counts are as important as the non-zero ones.** There are **zero** ambiguous rows, **zero** expired/ineligible rows and **zero** unavailable rows. The 63 unmatched rows are *missing*, not *ambiguous*, not *expired* and not *unavailable*. That is a materially different diagnosis: the gap is an **identifier-supply gap**, not a data-quality, listing-lifecycle or source-availability problem.

### 5.3 The five dimensions kept separate

| Dimension | 64-row result | Notes |
|---|---|---|
| **P04 canonical identity status** (issuer) | 64 `RESOLVED` / `CANONICAL_P04` | Issuer association. All 64 carry a `companyId` reference. |
| **D114 exact security identity resolution** | 1 `RESOLVED`, 63 `UNMATCHED` | The only metric the roadmap's identity numerator is built on. |
| **Qualified listing and series** | 1 | Only the resolved row has an eligible listing. The 63 have no series at all, so no listing could be selected. |
| **Issuer resolution** | 64 at issuer level (P04); 1 at D114 level | The issuer is known for all 64; the *security-to-issuer* trace exists for 1. |
| **Unavailable source evidence** | 0 | The roster/listing-map/CA sources loaded and served 64 rows successfully. |

### 5.4 Overlapping reason classifications (not summed as disjoint)

The 63 unmatched rows carry one primary category (**Missing/unresolved**) and one primary reason (`NO_IDENTIFIER_PROVIDED`). They additionally carry these **overlapping** attributes, which must not be added to the partition:

- P04 issuer association **present** (not a failure of P04).
- Security-level identity **absent** (the specific gap).
- `series` **not supplied** by the source (root cause of the gap).
- Listing selection **not attempted** (no series to select on) — **not** a `NO_LISTING_FOR_SECURITY` failure.
- Roster membership **not tested** for these rows (no ISIN to test) — **not** an `ISIN_NOT_IN_ROSTER` failure.
- Source availability **satisfied** — **not** an unavailable-source failure.

**Explicitly not done:** P04 `RESOLVED` was **not** counted as D114 identity success; unavailable was **not** counted as unmatched (there were none); and no row was excluded from the population to improve coverage.

---

## 6. The 1/64 result — exact explanation

The 1/64 ratio is **not** a coverage measurement of the product's identity capability. It is a **measurement of identifier supply** on one broker-import surface.

| Step | What happened |
|---|---|
| 1 | The broker export populated `DHAN_PORTFOLIO` with 64 holdings. It supplied, per row, a symbol and a quantity/price set — and **no usable security identifier**. |
| 2 | IPD's governed broker-import resolver matched each row's symbol (with exchange) against the P04 master and obtained **one** canonical issuer per row. All 64 rows therefore persisted with `identityStatus: 'RESOLVED'`, `resolutionDisposition: 'CANONICAL_P04'` and a `companyId`. |
| 3 | The **separate** security-identity qualification path needed an ISIN **and** an exchange **and** a P07 series. Without the identifier the export did not supply, it failed closed on 63 rows, leaving `securityIdentity: null` — a legitimate persisted state, by design. |
| 4 | IRR read the 64 holdings over the real IPC path, projected the nested identity losslessly, and fed the resolver. |
| 5 | The resolver had an ISIN for exactly one row and resolved it on the ISIN basis to one issuer, one security and one listing. For the other 63 it had **neither an ISIN nor an exchange**, and returned `UNMATCHED / NO_IDENTIFIER_PROVIDED` — the only correct outcome. |

**Therefore 1/64 measures the supply of security identifiers in one source export, not the quality of either identity implementation.** Both implementations behaved correctly on every one of the 64 rows.

**The decisive corroboration** is the IRR PR #563 test at `8765860`, whose fixture rows are *"exactly the key set IPD's `PortfolioStore.holdingFromRow` emits for a persisted holding: no flat `isin`, no `exchange`, a nested `securityIdentity` that is either the stored D114 object or `null`"* — and whose assertions reproduce the observed 1-resolved / unmatched-with-`NO_IDENTIFIER_PROVIDED` behaviour exactly.

**A prior reading would have been wrong in both directions.** Counting P04 `RESOLVED` as D114 success would report 64/64 — an 100% identity coverage claim that the evidence does not support and that would let a 64-row portfolio pass a gate on one qualified row's worth of real security identity. Conversely, reading 1/64 as the product's identity capability would wrongly condemn two correct implementations.

---

## 7. θI determination

### 7.1 Determination

```
THETA_I = NOT YET ESTABLISHED
```

**A numeric θI cannot defensibly be established at this stage.** The roadmap's own §K text already records this, and this investigation confirms it against actual host data for the first time:

> *"**Currently insufficient evidence:** the audit has no actual revision/holding counts, eligible scope and exposures, per-row identity and financial coverage, available qualified prices, engine outputs, or quantified consequences of omitted holdings. Therefore no defensible numeric `θI`, `θF`, `θA` or `θM` can be asserted now."* (roadmap §K)

**`1/64` must not be converted into a threshold.** The roadmap forbids it explicitly (§K, *Threshold-setting and proof*): *"Establish the thresholds against that evidence and purpose, **not merely to pass an observed result**."* And §K ¶3: *"One successful holding is necessary evidence for a specific real-issuer path but is never sufficient for portfolio-wide acceptance."* Adopting `1/64` as θI would additionally be self-defeating: it would encode a supply defect as a product requirement.

### 7.2 What the roadmap requires for θI, and which inputs exist

| Required input | Status | Evidence |
|---|---|---|
| **W03 actual-revision census** | ✅ **Now available.** Revision 1, 64 holdings, reconciled, provenance digest unchanged. | Supplied host evidence; this census §5. |
| **W04 per-row identity evidence** | ✅ **Now available.** 1 qualified and resolved; 63 missing/unresolved with `NO_IDENTIFIER_PROVIDED`; 0 ambiguous; 0 expired/ineligible; 0 unavailable. | This census §5.2–5.3. |
| **Eligible population `E` under objective product-scope rules fixed before coverage is evaluated** | ❌ **NOT ESTABLISHED.** No documented, pre-registered scope rule (e.g. "active positions only") exists for this portfolio. | Roadmap §K: *"`E` be the nonempty subset eligible under documented objective product-scope rules **fixed before coverage is evaluated**."* Without `E`, neither numerator nor denominator is defined. |
| **W05 financial coverage and rights** | ❌ Not available for this revision. | Roadmap W05: *"actual per-issuer coverage and rights unknown."* |
| **W06 market observations and freshness** | ❌ Not available for this revision. | Roadmap W06: *"actual eligible quote coverage unverified; D02 unknown/unavailable."* |
| **W10–W14 method-specific inputs, engine outcomes and analytical purpose** | ❌ Not available. | Roadmap W10–W14. |
| **Absolute and value-weighted exposure left uncovered** | ❌ **Cannot be computed.** | Requires a qualified price and FX policy (§K θM). |
| **Materiality and concentration risks** | ❌ Cannot be assessed. | Depends on the value-weighted distribution. |
| **Treatment of unknown values** | ❌ Not specified for this portfolio. | §K: *"Unknown eligibility blocks a complete census rather than being silently excluded."* |
| **Justification for any permitted gaps** | ❌ Cannot be written. | Depends on the analytical purpose, which W10–W14 supply. |
| **Protection against presenting a small successful subset as the whole portfolio** | ⚠️ **Designable now; not yet met.** | The one resolved row is 1/64 of the population. Any θI ≤ 1/64 would permit representing that single row as portfolio-wide analysis — precisely what §K ¶3 forbids. |

### 7.3 The binding constraint

**θI is blocked by two independent gaps, and either alone is sufficient to block it:**

1. **The eligible population `E` is undefined.** No objective, pre-registered product-scope rule has been fixed for this portfolio. The roadmap forbids fixing one *after* observing coverage, and forbids removing unresolved rows from `E` to improve a ratio (§K: *"Do not remove ambiguous identity, missing/uncertain financials, stale or absent quotes, or withheld/no engine output from `E` merely to improve a ratio."*). With no `E`, the denominator is undefined, and §K requires the denominator to be *"exactly `|E|`, not the number of resolved or selected holdings."*

2. **The threshold-setting evidence base does not exist.** θI must be set from W03–W06 census evidence *plus* W10–W14 method-specific inputs, engine outcomes and analytical purpose, and must state the uncovered exposure, materiality and concentration risks, the treatment of unknown values, and the justification for each permitted gap. W05, W06 and W10–W14 have not been executed against this revision. A number derived from the W04 identity census alone would be a **coverage ratio**, not an acceptance threshold.

### 7.4 Exact evidence required, and the acceptance test

**To establish θI:**

1. **Pre-register the eligible scope.** A documented objective product-scope rule for `DHAN_PORTFOLIO` — e.g. active positions only, or all persisted rows — fixed and recorded **before** coverage is evaluated, with `|E|` computed and every excluded row's rule, reason and treatment disclosed (roadmap §K ¶2). Each row assigned exactly once; `|T| = |E| + |X|`; unresolved and withheld disclosed as **overlapping** reason categories, not added to that partition.
2. **Complete W05** — per-issuer financial coverage, source rights, filing/period/basis, dataset digest — against the same revision.
3. **Complete W06** — per-identity quote source/as-of/received/evaluated/verdict/eligibility and aggregate coverage, against the same revision.
4. **Complete W10–W14** — the per-engine mandatory-input matrix with eligible/withheld dispositions, actual engine outcomes, the feasible portfolio methodology, and the consequences of omitting holdings.
5. **Set θI against that evidence**, stating: absolute and value-weighted uncovered exposure; materiality and concentration risks; why each permitted gap is tolerable for the claimed use; the treatment of unknown values; and how the threshold prevents a small successful subset from being represented as the whole portfolio.
6. **Then and only then** measure the observed identity ratio over the unchanged eligible census and compare against θI.

**The acceptance test to apply once θI is established:**

```
identity numerator = |{ i ∈ E : exact security identity qualified, eligible listing/series,
                       traceable to one issuer under applicable source versions }|
denominator        = |E|          (NOT the resolved subset)

PASS  ⟺  (identity numerator / |E|)  ≥  θI
```
with ambiguous, unresolved and unavailable rows counted as **failures**, the unrounded ratio used for the comparison, and rounding applied only for display.

**Note on the current value.** For the eligible set that the scope rule will define, the identity numerator **cannot exceed 1** until the identifier supply gap is closed (§7.5). Any θI above 1/64 would therefore fail on the current evidence. Establishing θI therefore requires either closing the identifier gap or establishing, on the W05/W06/W10–W14 evidence, that a coverage of this level is tolerable for the claimed analytical use — and the second is a decision that must be justified against that evidence, not asserted now.

### 7.5 The dependency that actually gates improvement

The 63-row gap is an **identifier-supply** gap, and the roadmap's own W08 supplies the mechanism:

> **W08 — Exact security-to-issuer bridge.** *Status:* IPD D114 object not explicitly consumed by IID mapper; actual mapping unproved. … *Deliverable:* minimal compatible mapping, implemented only where evidence shows a gap. *Acceptance/evidence:* **ISIN/series and separately evidenced exchange/listing→issuer**, missing, ambiguous, reused-symbol, multi-series and expired tests; owner guard preserved.*

W08's prerequisite is exactly what is missing: an ISIN (and, separately, a series) per row. The IRR side of that bridge is **already implemented and tested** in PR #563 (`7f3f7db1` + `8765860`) — the D114 projection, the lossless read-path test, and the issuer conflict guard. What is missing is **source data**, not code.

---

## 8. Outstanding evidence and dependencies

| ID | Outstanding item | Owner | Blocks | Type |
|---|---|---|---|---|
| **W04-01** | Pre-register the objective eligible-scope rule for `DHAN_PORTFOLIO`; compute `|E|`, `|X|` and every excluded row's reason and treatment. | Principal / IPD | θI denominator | **Immediate** — no external access needed |
| **W04-02** | Supply a per-row identifier that survives the governed qualification path (ISIN **and** exchange, and separately a `series`) for the 63 rows — via an operator-supplied broker export with those columns. | Operator / source holder | Identity numerator | **External** — source evidence + rights |
| **W04-03** | Record the roster, listing-map and corporate-action table versions and digests alongside the identity census, and confirm the 2,388/2,388/2,388 shape and the zero corporate-action count against the served files. | IRR identity owner | Source-version disclosure | External (re-verification) |
| **W04-04** | Explain and evidence the **zero corporate-action records** in the roster. A zero-CA table means no listing-window, symbol-reuse or series-change history is available to disambiguate a reused symbol — which materially affects how a future ambiguous row would be diagnosed. | IRR identity owner / source holder | Ambiguity diagnosis capability | **External** — source evidence |
| **W04-05** | W05 financial coverage and source rights for the same revision. | IRR financial data / operator | θF, θM | External |
| **W04-06** | W06 quote coverage and freshness for the same revision. | IPD freshness / IRR consumer | θM, θA | External |
| **W04-07** | W10–W14 method-specific inputs, engine outcomes, analytical purpose and the consequences of omission. | IRR methodology / engines | θI, θF, θA justification | External |
| **W04-08** | Merge IRR PR #563 so the D114 adapter and its tests are on IRR `main`. | IRR | Nothing for W04's findings (already read at the PR head) | **Implementation** — in the owning repository |
| **W04-09** | Decide whether any **coverage surface** should display P04 issuer status alongside D114 security status, so an operator is never shown a single "identity" status that conflates the two. | IRR presentation / IPD | Presentation only, **not** this census | Deferred — presentation design |

**No code defect was found.** W04-08 is a merge of already-completed, already-tested IRR work — not an implementation this investigation requires.

> **Superseding update — 15 November 2026.** The five open items above were addressed by the follow-up assessment `docs/integration/IIPS-CURRENT-PORTFOLIO-W04-IDENTITY-PROVENANCE-AND-GOVERNANCE-COMPLETION-2026-11-15.md`, which records:
> - **W04-03** — the listing-map and corporate-action-table versions were **not unavailable**; the IRR coverage report already publishes all three source-version digests (`coverage.ts:228-234`). Closure is a **re-read of the same endpoint**, not a new extract or a new source holder.
> - **W04-04** — the corporate-action zero is established as an **extract-content fact** whose cause remains unknown, and whose effect on the census is **nil** (corporate actions are consulted only for MERGER/DEMERGER successor reconciliation, not primary resolution).
> - **W04-01** — a **draft** eligible-scope rule is written but **not approved**; `|E|` remains undefined. The prior statement that this "requires no external access" is **corrected**: the rule's approval is a Principal decision, and computing `|E|` additionally requires the `active` distribution over the captured rows, which was **deliberately not read** before the rule is approved.
> - **W04-02** — the **execution owner** is established as **user host** (IRR `IID-P6A-RUNTIME-DEPENDENCY-ASSESSMENT-2026-11-09.md:52`), and the root cause is localized to the **upstream holding-record projection**, not the resolver.
> - **Source versions** — the D05 security-master version, the embedded issuer-level version, and the P07 Dhan instrument-master version are now **fully established** with digests, counts, acts and timestamps.
>
> **W04 remains PARTIALLY COMPLETE** and **`THETA_I` remains NOT YET ESTABLISHED**. The semantic findings of this document (§2–§7) are carried forward **unchanged**. Closure conditions C1–C6 are stated in the follow-up assessment §7.5.

---

## 9. W04 status recommendation

### **W04 — PARTIALLY COMPLETE**

**Reasoning, by the roadmap's own W04 specification:**

> *"**Deliverable:** same-revision qualified/resolved, ambiguous, missing, expired/ineligible and unavailable counts with source and listing/series versions. **Acceptance/evidence:** reconciled rows and exact security→listing→issuer mapping; no symbol-only identity."*

| W04 element | Status | Basis |
|---|---|---|
| Same-revision qualified/resolved, ambiguous, missing, expired/ineligible, unavailable counts | ✅ **Delivered** | §5.2 — 1 / 0 / 63 / 0 / 0, reconciled to 64. |
| Reconciled rows | ✅ **Delivered** | §5.2 — each row assigned exactly one disposition; `|T| = |E| + |X|` verified. |
| Exact security→listing→issuer mapping | ✅ **Delivered for the 1 qualified row**; the 63 have no security-level evidence to map | §5.3, §5.4. |
| No symbol-only identity | ✅ **Verified** | §3.5, §5.4 — no row was resolved from a symbol; `companyId` never promoted; reproduced empirically. |
| Source versions | ⚠️ **Partially delivered** | Roster version `sha256:4baa4e…` and classification `OPERATOR_SUPPLIED` are recorded. The **listing-map and corporate-action-table versions were not supplied** in the host evidence — W04-03. |
| Listing/series versions | ⚠️ **Partially delivered** | Series was recorded for the 1 resolved row. The 63 rows have no series, so no listing/series version applies to them — but the served listing-map version is undisclosed — W04-03. |
| The **coverage acceptance basis** this task asked to establish | ✅ **Delivered** | §6, §7. |
| θI | ❌ **NOT ESTABLISHED** — and correctly so | §7. |

**Why not COMPLETE:** two of W04's required elements are only partially discharged — the source and listing/series **versions** are incomplete (W04-03), and the corporate-action table's zero-record state is unexplained (W04-04). W04's acceptance evidence explicitly requires *"with source and listing/series versions"*. Recording a census without the source versions that produced it would leave the census unreproducible, which is the specific failure mode the roadmap's W19 preservation discipline exists to prevent.

**Why not BLOCKED:** every substantive W04 element that can be discharged from the evidence actually supplied **has** been discharged. The census is complete, reconciled, and reproduced against both real implementations. The outstanding items are (a) a version disclosure the host read did not carry and (b) an explanation for a zero-count source file — **not** a blocker on obtaining or reconciling the identity census itself. The work is incomplete in a disclosable, narrow way, not stuck.

**The investigation question itself is fully answered:** the discrepancy is expected, not defective; the 1/64 result is correctly explained; and θI is not yet establishable.

---

## 10. Exact next roadmap action

**Next action: W03 → W04 census publication with source versions, then W04-01 (the eligible-scope pre-registration).**

Concretely, in roadmap order:

1. **Publish the W04 census** (this document) with the **source and listing/series versions** completed — obtaining the listing-map and corporate-action-table versions/digests from the served identity directory (W04-03) and recording the zero-corporate-action count as a disclosed fact with its explanation or an explicit "not supplied" marker (W04-04). This completes W04's stated deliverable.

2. **Pre-register the eligible-scope rule** for `DHAN_PORTFOLIO` (W04-01) — an objective product-scope rule fixed **before** coverage is evaluated — and compute `|E|`, `|X|` and every excluded row's reason and treatment. This is the prerequisite that gives θI a denominator, and it requires no external access.

3. **Raise the identifier-supply question** with the source holder (W04-02), since the 63-row gap is an identifier-supply gap with no code remedy on either side. The D114 bridge itself is already built and tested in IRR PR #563; merging it (W04-08) is IRR-side work that does not require a further decision.

4. **Do not** start W05 or later implementation in this pass, and **do not** merge any PR.

**What must not happen next:** the census must not be re-cut with the 63 rows excluded to improve a ratio; P04 `RESOLVED` must not be presented as D114 identity success; `1/64` must not be published as a coverage threshold; and the two surfaces must not be made to display the same status in order to make the discrepancy disappear.

---

## 11. Assessment boundary

This document records a read-only investigation and semantic reconciliation. It does not claim W04 acceptance, does not establish θI, does not claim W20 readiness, and does not grant implementation authority. It makes no Dhan API call and no host access. It changes no code, contract, configuration, credential, portfolio record or persisted holding in either repository. The 64 persisted holdings, their `companyId` references and their null security identities are exactly as captured.

**No personal holding identifier, quantity, price, value, secret or unnecessary portfolio detail appears in this document.** The only identifiers named are the two repository-owned governed-master identifiers already published in source (`EQ_RELIANCE_IN`, `IN0000000029` and the fixture issuer key), used solely to make the reproduced behaviour auditable; no actual holding symbol, ISIN or value from `DHAN_PORTFOLIO` is disclosed.

---

### Appendix A — Commits inspected

| Repository | Commit | Date | Note |
|---|---|---|---|
| IPD | `c260a8222661519c317183dc62c501d1b7a4cdae` | 2026-11-13 | Baseline for all IPD citations in this document. |
| IRR `main` | `08411bcd6d782a601fe5c82cc9983d076831148d` | 2026-11-13 | Baseline for IRR citations not specific to PR #563. |
| IRR PR #563 | `87658602966cfedf98fa59a627807d160808f645` | 2026-11-14 | **Published D114 test commit.** Lossless read-path test reproducing the observed 1/63 behaviour. |
| IRR PR #563 | `7f3f7db14eb6baeda2f8e9ddfac5045d43cce1a9` | 2026-11-12 | D114 projection, hardened source validation, `holding-identity-transport` outcome classification. |

### Appendix B — Independent reproduction commands

Both reproductions are read-only, use only repository-owned code, and touch no host and no portfolio.

**IPD (P04 issuer resolution ≠ security identity)** — `mapBrokerImportHoldings` over a synthetic holding:

```
identityStatus        = RESOLVED
resolutionDisposition = CANONICAL_P04
companyId             = EQ_RELIANCE_IN
securityIdentity      = null
```

**IRR (D114 outcome classes)** — `resolveIdentity` over the three observed row shapes:

```
companyId-only        → UNMATCHED / NO_IDENTIFIER_PROVIDED / issuerId null / securityId null / basis null
companyId + symbol    → UNMATCHED / NO_IDENTIFIER_PROVIDED / issuerId null / securityId null / basis null
nested D114 identity  → RESOLVED / issuerId set / securityId set / listingId set / basis ISIN
```

### Appendix C — Key source references

**IPD (`c260a82`)**
- `src/persistence/brokerImportPersistence.ts:43-44` — `ResolvedBrokerImportHolding` type.
- `src/persistence/brokerImportPersistence.ts:71-78` — where `identityStatus`/`resolutionDisposition` are set (issuer-level).
- `src/persistence/brokerImportPersistence.ts:120-122, 127-166` — where `securityIdentity` is set (separate path; may fail closed to `null`).
- `src/persistence/portfolio_store.ts:79-99` — `HoldingInput`; the `securityIdentity` contract comment.
- `src/persistence/portfolio_store.ts:1120-1135` — `projectedSecurityIdentity`; null stays null, malformed refuses.
- `src/identity/security_master.ts:19-34` — `SecurityMasterEntity`; `companyId` is the authoritative issuer ID.
- `src/identity/security_master.ts:144-146` — `resolveCompanyId`.
- `src/identity/mapping_store.ts:44-92` — effective-dated resolution; fail-closed quarantine.
- `src/identity/broker_observation_resolver.ts:7-11, 37-45, 47-66` — observation shape; master precondition; all-identifiers-must-agree.
- `src/identity/governed_fixture_master.ts:52-58` — the governed D05 authenticated universe revision.
- `src/contracts/types.ts:67-134` — the D114 contract, its grammar, `isinAuthority: NON_AUTHORITATIVE`, and "no companyId is consulted".
- `src/providers/dhan/dhan_security_identity_service.ts:8-12, 22-26, 101-110` — the P04 → P7 → D114 path and the eight qualification conditions.
- `src/persistence/manualPersonalPortfolio.ts:12-18` — manual entries separated by `MANUAL_PERSONAL_ENTRY`.

**IRR (`08411bc` and PR #563 `8765860`)**
- `iips-platform/src/investment/identity/types.ts:5-7` — "Three identity levels, never conflated."
- `iips-platform/src/investment/identity/types.ts:86-96` — `IdentityInput`; `companyIdHint` is a conflict indicator only.
- `iips-platform/src/investment/identity/types.ts:29-51, 56-79` — the closed state and reason vocabularies.
- `iips-platform/src/investment/identity/resolver.ts:157-181` — `resolvedWith`; the issuer always comes from a security.
- `iips-platform/src/investment/identity/resolver.ts:222-397` — the ISIN path; no fallback; series as a discriminator.
- `iips-platform/src/investment/identity/resolver.ts:255-273` — the only `companyIdHint` use; conflict detection only.
- `iips-platform/src/investment/identity/resolver.ts:398-404` — `NO_IDENTIFIER_PROVIDED`.
- `iips-platform/src/investment/identity/d114Projection.ts` — the four projection kinds; `MALFORMED`/`CONFLICT` rejection; `classifyObservationOutcome`.
- `frontend/server/investment/sources.ts:41-79` — `toHoldingObservation`; `companyIdHint`; `series` never inferred.
- `frontend/server/investment/holding-identity-transport.ts:114-138` — `resolveHoldingIdentities`.
- `frontend/server/user-portfolio/ipcPortAdapter.ts:475-515` — `toG2View`; holdings pass through verbatim.
- `frontend/server/user-portfolio/capture/ownerBoundPortfolioCapture.ts:325-420` — `summarizeHoldingIdentity`; identity counted from the actual nested object only.
- `frontend/server/investment/phase1D114WireToResolverInput.test.ts` (PR #563 `8765860`) — the lossless read-path test and the exact `UNMATCHED / NO_IDENTIFIER_PROVIDED` assertion for a stored-null identity.
- `docs/integration/WS-A-68-ROW-IDENTITY-ASSESSMENT-RECONCILIATION-2026-11-09.md` — the established precedent for identifier-supply-limited identity resolution.
- `docs/integration/IRR_STAGE_3A_HOLDING_IDENTITY_AUTHORITATIVE_SOURCE_ASSESSMENT.md:26-27, 66, 119` — company-level versus security-level identity, never conflated.

**Roadmap**
- `docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` — W04 specification; W08 specification; §K coverage methodology, θI/θF/θA/θM, threshold-setting process, and the "currently insufficient evidence" determination.
- `docs/integration/IIPS-CONSOLIDATED-SNAPSHOT-TO-CURRENT-ARCHITECTURAL-AUDIT.md` — CL-03 (same-revision identity counts), CL-11 (the D114-object gap), RA-04 (the joint identity bridge).
