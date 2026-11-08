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

## WS-A-ADDENDUM-2026-11-08 — Re-assessment against the 2026-11-08 replacement (P9 / B-06)

Append-only addendum. Governing acts: PA directive 2026-11-08 FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT; the PA "MERGE AUTHORIZED" instruction of 2026-11-08 (PR #139 merged as b60db672e298f3804942ba961bb9daed688b08da).

Re-running the 68 rows through the unchanged pipeline against the authenticated replacement master yields:

- Empty master: 0/68 resolved (control holds on the merged tree).
- Legacy Wave-1 master: 1/68 resolved (`AGI GREENPAC` → `EQ_AGI_IN` — alias semantics unchanged), matching the 2026-11-05 record exactly.
- **Authenticated replacement master: 3/68 resolved — rows 1 (`AGI GREENPAC` → `EQ_AGI_IN`), 21 (`GHCL` → `EQ_GHCL_IN`), 40 (`KROSS` → `EQ_KROSS_IN`); 65 remain `UNRESOLVED` (`UNSCOPED_NAME_OR_SYMBOL` / `NO_AUTHORITATIVE_IDENTIFIER_MATCH`); import remains REJECTED with zero rows persisted.**

The 65 unresolved rows require broker-supplied ISINs or exchange-scoped symbols (DHAN_WEB_UI_SUMMARY_V1 emits neither). Remediation and the full enumeration are filed at
`evidence/cross-repository/IIPS_V3_D05_B06_68ROW_REASSESSMENT_2026-11-08.md`; per-row outcomes at
`evidence/integration/ws-a-dhan-68-row/identity-outcomes-authenticated-2026-11-08.json`. The 2026-11-05 record above is retained verbatim.

## WS-A-ADDENDUM-2026-11-08-B — B-06 root-cause investigation (append-only)

Governing act: PA instruction 2026-11-08 — "B-06 — 65 UNRESOLVED ROWS: ROOT-CAUSE INVESTIGATION" (B-06 explicitly remains OPEN; no closure, no residual-exception reclassification, no persistence).

Finding: the 65 UNRESOLVED rows are the result of an identifier-free observed surface (DHAN_WEB_UI_SUMMARY_V1 carries no ISIN/exchange), not of missing evidence or of an implementation defect. The committed companion broker export `evidence/operator_drop/wave2-2026-11-06/source.csv` carries ISINs for all 68 positions joined 1:1 to the observed surface; 62 of the 65 rows resolve through the existing exact-ISIN path against the authenticated replacement (verified read-only), and 3 rows (44 INE721I01024 — BSE-exclusive listing of the National Stock Exchange of India; 51 INE583V01021 — NSE series BE, BSE group T/SME; 63 INE562X01013 — NSE series BE, absent BSE active-equity) are outside the authorized NSE CM EQ universe act and fail closed by design.

The full diagnostic matrix, root-cause category counts, spot-check corrections (rows 37/67 — Jio Platforms `INE0BJO01010`/`JPL` and Waaree Renewable `INE299N01021`/`WAAREERTL`; Jio Financial and Waaree Energies are irrelevant to these rows), minimum corrective actions, and the revised B-06 status are filed at `evidence/cross-repository/IIPS_V3_D05_B06_ROOT_CAUSE_INVESTIGATION_2026-11-08.md`. This addendum does not re-execute the ingress, does not persist anything, and does not alter any prior record. The "residual exceptions" framing of the 2026-11-08 B-06 reassessment record is withdrawn by that investigation report; B-06 stays OPEN pending PA disposition.

## WS-A-ADDENDUM-2026-11-08-C — B-06 §9-A one-time ISIN-scoped reassessment executed (append-only)

Governing acts: PA instruction 2026-11-08 (B-06 root-cause investigation); PA authorization 2026-11-08 (execution of §9-A; §9-C declined — universe retained at exactly 2,390 NSE CM EQ securities; no aliases/exceptions/alternative mappings; B-06 remains OPEN pending PA review; no persistence, no user-position writes, no rule changes, no eligibility assertions).

Execution (one-time, read-only; `$0` persisted; `saveable=false`):

- Inputs: observed surface positions (E7, `rows.json`, `bfd0496e…`) joined 1:1 by exact case-insensitive whitespace-normalized display name to the committed B-04 companion Dhan holdings export ISINs (E8, `source.csv`, `2dc1d1fb…`). Join: 68/68 (no unmatched rows, no duplicate keys); quantity agreement 65/68 (disagreements: rows 1, 38, 54 — the documented de-concatenation class; E8's unambiguous quantities 2/142/336 agree with the UI alternative readings).
- Identity path: unchanged `GOVERNED_AUTHENTICATED_MASTER_2026-11-08` (`getGovernedAuthenticatedSecurityMaster()`), exact ISIN lookup only. No UNSCOPED namespace trial was relied upon for the reassessed rows. No aliases added, no normalization changed, no matching logic modified, no universe change.
- Result: **65/68 RESOLVED** — including the 62 previously unresolved in-scope rows (each exactly equal to Appendix A of the investigation report, verified row-by-row against the published artifact, 62/62) and the three previously resolved rows with identities preserved (`EQ_AGI_IN`, `EQ_GHCL_IN`, `EQ_KROSS_IN` — now also reachable via exact ISIN, identical canonical ids).
- **Rows 44 (`INE721I01024`), 51 (`INE583V01021`), 63 (`INE562X01013`) remain UNRESOLVED / `UNMAPPED_IDENTIFIER` — fail-closed, excluded under PA-declined universe expansion (§9-C).** No aliases, no exceptions, no alternative identity mappings were created.
- Import disposition remains **REJECTED**; `persistedRows=0`; `saveable=false` (`refusalCodes: {UNMAPPED_IDENTIFIER: 3}`); eligibility remains `NOT_ASSERTED` everywhere.

Per-row outcomes (68 rows), join evidence, Appendix A verification results, and preservation checks: `evidence/integration/ws-a-dhan-68-row/identity-outcomes-reassessment-2026-11-08.json` (SHA-256 `e99989b9962a686d33df42b43746f9127929ebced9c0a99690a64e6270ae5c2e`). B-06 remains **OPEN** pending PA review of this reassessment evidence; nothing in this addendum constitutes closure. The 2026-11-05 record is retained verbatim.
