# WS-A — Dhan broker holdings: identity evidence and refusal completeness (IPD)

**Record:** `WS-A-DHAN-BROKER-IDENTITY-EVIDENCE-RECORD-2026-11-05`
**Owner repository:** `ramkivs/iips-production-market-data` (IPD)
**Baseline:** IPD `main@b605a61` (verified `git ls-remote origin refs/heads/main`)
**Scope:** BI-03 mapper / BI-05 ingress identity evidence. No change to the security master, to
the P04 vocabulary, to the durable store schema, or to the W-1 write gate.

## Observed failure (2026-11-05T07:50:49.090Z)

A 68-row `DHAN_WEB_UI_SUMMARY_V1` import produced 0 resolved rows, one refusal message and no
per-row evidence. The single message named the *second* speculative lookup:

```
Identity ambiguity detected for 'AGI GREENPAC': UNMAPPED_IDENTIFIER
(No active mapping found for BSE_SYMBOL:AGI GREENPAC at asOf 2026-11-05T07:50:49.090Z)
```

## Defects found (IPD-owned)

| # | Defect | Evidence |
| :-- | :--- | :--- |
| IPD-D1 | The mapper aborted at the **first** unresolved security, so rows 2–68 were never assessed and the import had no per-row identity evidence at all. | `broker-holdings-mapper.ts` threw from inside the grouping loop. |
| IPD-D2 | The refusal surfaced only the **last** speculative lookup (`BSE_SYMBOL`) and discarded the primary lookup's record, so the reported reason misattributes the cause. | The observed message; reproduced verbatim in `tests/ws_a_dhan_broker_holdings_identity.test.js` (WS-A-07). |
| IPD-D3 | An unscoped name/symbol was resolved by trying `NSE_SYMBOL` then `BSE_SYMBOL` with **no record of either attempt**, so a consumer could not distinguish "looked up and absent" from "not looked up", nor see that the row supplied no ISIN and no exchange. | Same module; no assessment vector existed. |
| IPD-D4 | An exchange-scoped row (detailed Dhan export with an `Exchange` column) was looked up in the **NSE** namespace first regardless of the declared exchange. | Mapper ignored `group.exchange` in the lookup path. |
| IPD-D5 | With no `SecurityMaster` supplied the mapper published `identityStatus: 'RESOLVED'` with `companyId` equal to the raw symbol — an identity claim with no identity source. | Mapper's `let resolvedCompanyId = group.symbol; identityStatus = 'RESOLVED'`. |

## Corrections (this record)

1. New module `frontend/src/features/portfolio/import/broker-identity-assessment.ts`:
   `assessBrokerRowIdentity()` performs the governed lookups and returns a
   `BrokerIdentityAssessment` per **native row** — supplied identifier verbatim, identifier class
   (`ISIN` / `EXCHANGE_SCOPED_SYMBOL` / `UNSCOPED_NAME_OR_SYMBOL` / `NONE`), every lookup in
   attempt order with its outcome and quarantine id, every quarantine record, the status, the
   closed-vocabulary refusal code, and the **exact missing evidence**.
   `summariseBrokerIdentity()` produces the counts and the P04 whole-import `saveable` flag.
   `BrokerIdentityResolutionError extends IdentityAmbiguityError` carries the complete evidence
   through the refusal.
2. The mapper now assesses **every** row (including aggregated and row-validation-excluded rows)
   before refusing, and raises the typed refusal once. The surfaced quarantine record is the last
   authoritative lookup for the first refused row — exactly as before — so the observable refusal
   text is unchanged while the masked-evidence defect is removed.
3. Exchange-scoped rows are looked up **only** in the declared exchange's namespace.
4. No master supplied is reported as `NOT_EVALUATED` / `IDENTITY_NOT_EVALUATED` (never
   `RESOLVED`). The legacy permissive `failOnUnmappedIdentity: false` path is unchanged in
   behaviour but its assessments now record the true status.
5. `BrokerMappingResult.identityAssessments` / `.identitySummary` and
   `BrokerIngressResult.identityAssessments` / `.identitySummary` publish the evidence on success
   **and** on refusal.

Nothing in this change widens an identifier namespace, adds a name-similarity mapping, invents an
ISIN or exchange, or authorizes a save.

## Findings about the 68 rows (measured, not inferred)

Applying the corrected pipeline to the captured 68-row surface
(`evidence/integration/ws-a-dhan-68-row/`):

* Empty master: 68/68 `UNRESOLVED`, `NO_AUTHORITATIVE_IDENTIFIER_MATCH`, 68/68 rows assessed,
  every row with two recorded lookups and two quarantine records. The observed AGI GREENPAC
  refusal reproduces verbatim.
* Governed D05 master: 1/68 resolved — row 1 `AGI GREENPAC` → `EQ_AGI_IN` via the authorized
  governed alias (`NSE_SYMBOL` alias, effective 2022-01-01); the other 67 rows remain
  `UNRESOLVED` / `NO_AUTHORITATIVE_IDENTIFIER_MATCH`. The import is still refused: one resolved
  row does not authorize 67 unresolved rows (DP-2 Option 2F).
* No row of this surface is resolvable by any identifier the broker file actually supplies,
  except that single governed alias; the missing evidence for the other 67 rows is the ISIN
  (preferred) or an exchange-scoped trading symbol, which `DHAN_WEB_UI_SUMMARY_V1` does not emit.

## Tests

`tests/ws_a_dhan_broker_holdings_identity.test.ts` — 12 tests (WS-A-01 … WS-A-12), all passing;
see the Workstream A report for the exact transcript and for the unchanged suites re-run
(BI-03/04/05/07/08, Q1 durable import, P04 broad-universe, E2E multi-broker).
