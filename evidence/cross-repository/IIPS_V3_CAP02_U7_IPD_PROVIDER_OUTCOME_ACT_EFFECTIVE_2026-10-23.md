# IIPS v3.0 CAP-02 — U7 IPD provider/UI outcome act

> **STATUS: RENDERED — EFFECTIVE FOR THE EXACT MANIFEST IN §2 ONLY.**
> This act authorises provider-side outcome semantics for the exported CAP-02 surface
> (`BrokerImportModal` + `PortfolioStorePort`). It creates no write path, no IPC operation, no wire
> field, no schema, no migration, no route, no listener, no `durable:true` capability and no gate
> movement. It does not mount the modal, does not compose a host, and does not modify IRR.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-U7-IPD-PROVIDER-OUTCOME-ACT-2026-10-23-01` |
| Decision date | 2026-10-23 (UTC) |
| Repository | `ramkivs/iips-production-market-data` (IPD) — the only repository written |
| Baseline | IPD `main@04e63edd995889b170eed6660e7010dd32e15fd3`, tree `3949ab645697d8c7c26dd5e5708c43bcdcd71cec`, working tree clean (re-verified this pass) |
| Cross-repository input (read-only) | IRR `main@30091d33ecf3c094cc25d78d4b66023ab3279759` — `IIPS-V3-CAP02-U7-READ-RESULT-CONTRACT-DECISION-EFFECTIVE-2026-10-23-01` §5 and `IIPS-V3-CAP02-BROKER-IMPORT-UI-COMPOSITION-ACT-EFFECTIVE-2026-10-23-03` §6 |
| Authority basis | Standing PA global decision/execution grant (2026-10-12), IRR F-3 record blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`, as construed by DEC-06 R-1/R-3/R-6/R-7 (IRR blob `4be3ea578a51a1a949337e5d218b89841c04892d`); the current PA CAP-02 execution direction of 2026-10-23 (Workstream F); the effective U7 IRR consumer contract §5, which names this act as the required IPD prerequisite |
| Explicitly NOT authority | The IRR composition act (it authorises IRR files only and expressly refuses to authorise any IPD change); any merged PR; any passing CI run; the export act's own scope (which excluded modal/port behaviour) |

## 1. Why this act is renderable now, and what changed

Before this pass, IPD's independent reconciliation recorded U7 as
`IRR-CONTRACT-DEPENDENT — PREPARE IPD SIDE; DO NOT GUESS` because IRR's U7 record was **prepared, not
effective**. That dependency has now resolved in the opposite direction: IRR's main at
`30091d33…` carries an **effective** U7 read/result contract whose §5 states the exact IPD act that
must land before any modal mount or IRR port implementation, and whose §6 states that no
`BrokerImportSurface`, no IRR `PortfolioStorePort` implementation and no revision-read route may be
created until this act's result is on IPD `main` and IRR repins to it.

The four gaps named by IRR §5 are verified in current IPD source, not adopted from the record:

| # | Verified current-source fact | File |
|---|---|---|
| g-1 | `PortfolioPortSaveSuccess.result` is **required** and is the full legacy `PortfolioSaveResult` (`portfolio`, `holdingsSavedCount`, `totalMarketValue`, `weightSumPercentage`, `savedAt`, `provenanceDigest`). An accepted v1 receipt (`{disposition, revision, durability, durable}`) cannot satisfy it, so any conforming adapter must fabricate. | `frontend/src/features/portfolio/portfolioStorePort.ts` |
| g-2 | `PortfolioPortSaveRefusal` requires `portfolio: PortfolioRecord`, `durability` and `durable`. A Class A refusal carries none of those; a conforming adapter must invent a record and a durability stance. | same |
| g-3 | The port outcome union has **no outcome-unknown member**, so a timeout/transport fault is forced into either `ok:true` or an ordinary refusal. | same |
| g-4 | The view model derives displayed durability from the **static** `storePort.durability` capability (`this.durability = params.storePort.durability`) and never from the operation receipt; it also fabricates refusal placeholders (`savedAt = new Date().toISOString()`, zero counts/totals, `provenanceDigest: ''`, and an invented fallback `PortfolioRecord`), and the modal's success panel falls back to **preview** totals, preview counts and the preview lineage digest when the result fields are absent. | `.../import/ui-broker-import-view-model.ts`, `.../BrokerImportModal.tsx` |

No IPD gate, decision or previously accepted manifest covers these four items: the export act
(`IIPS-V3-CAP02-IPD-EXPORT-IMPLEMENTATION-ACT-2026-10-23-01`) authorised export plumbing only and
expressly disclaimed behaviour; the U2 acts authorise persistence/identity/schema only and expressly
exclude UI/port changes. This record is therefore the specific act, rendered under the standing
grant, and it is the act IRR §5 requires.

## 2. Exact manifest

| Path | Exact authorised change |
|---|---|
| `frontend/src/features/portfolio/portfolioStorePort.ts` | Add `PortfolioCommitDisposition` and `PortfolioCommitReceipt` (`{disposition, revision, durability, durable}` — the accepted v1 minimal receipt, verbatim fields, no additions). Add `PortfolioPortSaveOutcomeUnknown` (`ok: 'unknown'`, `code: 'OUTCOME_UNKNOWN'`, `message`, `portfolioId`, `reconciliationRequired: true`) and include it in `PortfolioPortSaveOutcome`. Make `PortfolioPortSaveSuccess.result` **optional**; make `PortfolioPortSaveRefusal.portfolio`, `.durability` and `.durable` **optional**; make `PortfolioStorePort.getAnalytics` **optional**. Add a required `receipt: PortfolioCommitReceipt` to `PortfolioPortSaveSuccess`, and have `SessionPortfolioStorePort` emit it from its own authoritative store result. No identity/authority parameter, no owner/tenant field, no retry, no durability upgrade. `SESSION_ONLY`/`durable:false` remain the only capability the shipped adapter declares. |
| `frontend/src/features/portfolio/import/ui-broker-import-view-model.ts` | Add `'OUTCOME_UNKNOWN'` to `BrokerImportUIState`. Add `commitReceipt?: PortfolioCommitReceipt`, `portOutcome: 'NONE' \| 'SUCCESS' \| 'REFUSED' \| 'OUTCOME_UNKNOWN'` and `outcomeUnknown?: {...}` to the view model. Set displayed `durability`/`durable` **only** from an authoritative receipt; on refusal or unknown, make no commit claim. Remove the fabricated failure-result synthesis (`buildFailureResult` and the `savedAt`/zero/empty-record placeholders on the port path). Populate `saveResult` only when the outcome actually carries one. No automatic retry anywhere. |
| `frontend/src/features/portfolio/BrokerImportModal.tsx` | Success panel renders **only** receipt-derived facts (disposition, revision, durability, durable) and renders value/weight/digest rows only when an authoritative result is present — never the preview fallbacks `?? totalMarketValue`, `?? acceptedHoldingsCount`, `|| lineageDigest`. Add a distinct `OUTCOME_UNKNOWN` panel with no retry control. Make `onSaveSuccess` optional (invoked only when an authoritative result exists) and add optional `onCommitReceipt`/`onOutcomeUnknown` callbacks. Preserve the `WRITE_NOT_AUTHORIZED`/`REFUSED_*` refusal panel unchanged. |
| `tests/q1_cap02_u7_provider_outcomes.test.ts` (new) | Provider-outcome conformance: minimal receipt on success; refusal with no record and no fabricated timestamp/zero/empty-provenance; distinct unknown outcome with no retry; receipt-driven durability separate from the static capability declaration; no preview fallback in the modal success path; `WRITE_NOT_AUTHORIZED`/denial vocabulary unchanged. |
| `tests/bi07_portfolio_store_port.test.ts` | Only narrowings required by the now-optional `result`/unknown member (`outcome.ok !== true` guards). No existing assertion may be weakened. |
| `tests/portfolio_ui_package.test.ts` | Only if the exported surface set changes (it must not: the export set is unchanged, so no edit is expected). |

Explicitly unchanged: `src/persistence/**`, `src/ipc/**`, `src/identity/**`, all migrations,
`src/ui/portfolio_ui_package.ts` export set, `package.json`, `tsconfig*.json`,
`frontend/src/features/portfolio/portfolio-store.ts` arithmetic, `PortfolioWorkspace.tsx`, and every
IRR path.

## 3. Required semantics

1. **Success is receipt-only.** A CAP-02 consumer must be able to render a committed result from
   `{disposition, revision, durability, durable}` alone, with no portfolio record, no counts, no
   totals, no digest and no timestamp. A duplicate is derived only from `ALREADY_IMPORTED_NO_OP`.
2. **Refusal fabricates nothing.** No `PortfolioRecord`, no `savedAt`, no zero metrics, no empty
   provenance, no durability claim, and no per-holding detail is invented. `actualRevision` may be
   populated only from an authoritative conflict outcome.
3. **Unknown is not refusal and not success.** `OUTCOME_UNKNOWN` is a third state with no retry, no
   rollback claim, no `durable:true` and no ordinary-refusal wording; reconciliation is a
   separately authorised read, and no read is performed here.
4. **Durability is receipt-driven.** A capability declaration (`durability`/`durable` on the port)
   is never per-operation commit evidence. `durable:true` wording is reachable only from a receipt
   that literally says `durable:true`, and the shipped adapter never emits one.
5. **Preview is never presented as committed.** Preview totals, counts, weights and lineage digests
   remain preview-only and are not substituted into the committed panel.
6. **No write, no gate, no fence moves.** `evaluatePortSaveGuard()` remains hard false; the IPC
   port refuses `WRITE_NOT_AUTHORIZED` before dispatch; `WRITE_NOT_AUTHORIZED` appears in the
   provider refusal vocabulary; the shipped port stays `SESSION_ONLY` / `durable:false`.
7. **Unexecuted consumer decisions are not guessed.** The IRR consumer contract is consumed verbatim
   where it is effective. The optional `portfolioId` widening (§5 of IRR's record) is **not**
   implemented: it is described there as optional and is not required for the default-only surface.

## 4. Decision state

```text
U7 IRR consumer contract:              EFFECTIVE (IRR main 30091d33) — read-only input, not amended
U7 IPD provider/UI act:                EFFECTIVE for §2 exact manifest (this record)
U7 provider implementation:            executed and published separately; see the execution receipt
Modal mount / host composition:        NOT AUTHORISED — IRR's decision, IRR capacity
Revision-read route:                   NOT ADMITTED
Operational writes:                    NOT AUTHORIZED; WRITE_NOT_AUTHORIZED preserved
durable:true:                          UNREACHABLE from the shipped adapter
Gate 4 / result acceptance / Gate 5:   unchanged by this act
End-to-end integration:                NOT CLAIMED
```

*Rendered under the recorded standing PA grant and the current PA-directed CAP-02 execution. No
signature, approval identifier, spoken selection or independent authority is fabricated.*
