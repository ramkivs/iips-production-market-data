# IPD P11 bounded-library scope and IRR Row 26 reconciliation

**Record date:** 2026-10-20  
**IPD repository inspected:** `ramkivs/iips-production-market-data`  
**IPD revision inspected:** `b6e622432cb0ca3e5452c4194bc683c496a688fc` (`arena/21bc6f5f-iips-production-market-data`)  
**IRR repository inspected read-only:** `ramkivs/iips-review-recovered`  
**IRR revision inspected:** `37e82b7514c39b66ac6fca0c14a6a667977047fc` (`main`)  
**Nature of record:** repository-side scope disposition and evidence reconciliation; it is not a product-integration authorization, a Row 26 acceptance act, or a claim that all P11 criteria have been met.

## 1. Bounded scope disposition

For this workstream, P11 is treated as the existing **in-process IPD library capability**. The bounded capability includes the `DataBoundExecutor`, namespace guard, governed defaults, frozen sector engines, and the recalculation DAG. A specific product consumer is not commissioned by the evidence inspected here. No HTTP transport is required merely because Row 26 has an E2E-pending cell. IPD/IRR engine equivalence is not presumed and is not established as an acceptance requirement by this record.

The two remediations published in IPD commit `b6e622432cb0ca3e5452c4194bc683c496a688fc` are evidence about this library boundary only:

- canonical `D01_QUOTES.pctChange` now reaches the scoring engine, with the existing neutral zero fallback retained and identified as a fallback; and
- output lineage now hashes the effective post-fallback inputs together with the derived result, company/engine identity, version vector, and as-of context.

Those fixes and tests do not, alone, establish all P11 acceptance criteria, product-consumer behavior, cross-repository invocation, or full provider-to-score lineage. The broader P15 offline lineage harness is not evidence of a live consumer, an IPD-to-IRR call, or engine equivalence.

## 2. Records and evidence read

1. IRR `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` at `37e82b7514c39b66ac6fca0c14a6a667977047fc`, §18.1, row 26: “IPD engine adapters + `CertifiedSectorEngineId` bridge (IPD WSD P11)”; separate cells report authority/integration/validation status and `EP` for E2E. The row does not itself define a consumer contract, HTTP requirement, or equivalence test.
2. IPD `evidence/np04/IIPS_v3.0_IPD_IRR_CAPABILITY_INVENTORY_AND_TRACKER_RECONCILIATION_2026-10-17.md`, row 13: IPD engine adapters are a library, “P — no product route,” with library tests and E2E marked NA.
3. IPD `tests/wsd_p11_engine_adapters.test.ts` and `tests/wsf_p15_e2e_lineage.test.ts`; source in `src/engine_adapters/**`, `src/e2e/lineage_verifier.ts`, and the published remediation diff in commit `b6e6224`.
4. IPD `evidence/p15/p15-certification-report.md`: describes the offline seven-hop harness and its 13-engine/golden-digest claims. This is characterized here as offline qualification evidence, not a composed cross-repository execution test.
5. IPD cross-repository reconciliation `evidence/cross-repository/IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md`, especially §5.2 and its row-26 entry: records separate IPD and IRR adapters, no observed IRR import of IPD P11, no demonstrated taxonomy equivalence, and no evidence establishing a new cross-layer endpoint/interface requirement from the inspected G-2 scope.
6. Remote references were resolved during this task: IPD `main` remains `3d44e0a123f2495f3b88ce0ab8b47fbc5bf072db`; the IPD task branch points to `b6e622432cb0ca3e5452c4194bc683c496a688fc`; IRR `main` is `37e82b7514c39b66ac6fca0c14a6a667977047fc`.

The IPD v1.0 program tracker workbook's Work Tracker is historical/stale: the IRR register's own V14 notes all 59 P00–P13 rows as `NOT STARTED`. It is not used as current acceptance evidence.

## 3. Acceptance reconciliation

| Requirement / claim | Classification | Evidence and limit |
|---|---|---|
| P11 namespace enforcement and fail-closed identity boundary | **Satisfied by existing verified evidence** | `NamespaceGuard` rejects unnamespaced input; P11 tests exercise rejection and unmapped identity failure. This is library-boundary behavior, not consumer integration. |
| P11 deterministic frozen sector scoring / default behavior | **Satisfied by existing verified evidence** | Frozen engines and P11 tests cover sector execution and fallback quality; deterministic behavior is also tested by existing suites. The exact production/consumer applicability is not inferred. |
| Canonical momentum propagation (P11-01 remediation) | **Satisfied by newly published remediation evidence** | `b6e6224` changes executor input resolution and defaults; regression asserts positive/negative momentum reaches the factor and changes score, and absent momentum uses zero/neutral fallback. Prior task reported focused P11/P15 tests 19/19 and full `npm test` pass; these are historical results, not tests executed during this documentation task. No GitHub check runs were attached to the remediation commit when checked here. |
| Effective-input-to-derived-output lineage (P11-03 remediation) | **Satisfied by newly published remediation evidence** | `b6e6224` binds effective inputs, output, engine/version/company and as-of metadata; regression checks material input sensitivity, equivalent deterministic hash stability, and recomputes the binding. Prior task reported focused P11/P15 tests 19/19 and full `npm test` pass; historical, not re-executed here. This is the executor-level binding and does not validate the broader P15 provider-to-score chain or every P15 golden claim. |
| P11 as a complete acceptance item / all P11 criteria | **Partially satisfied** | Library implementation and named tests exist, including the two remediations. The inspected evidence does not define a complete P11 acceptance checklist that establishes every possible acceptance claim. No blanket P11 completion is recorded. |
| Product-consumer integration, HTTP transport, or cross-repository call | **Not applicable to the selected bounded library scope** | No specific consumer is commissioned in the inspected evidence. Row 26's `EP` is a status, not by itself an interface specification. The IRR repository has its own engine adapter and route; no IPD call was established. The IRR matrix row still uses “bridge” in its capability label, so acceptance authority must resolve whether that word denotes an additional required deliverable or is merely historical description. |
| IPD/IRR engine equivalence | **Not applicable to the selected bounded library scope** | Neither identity/taxonomy equivalence nor equivalence acceptance criteria were established in inspected records. No equivalence is claimed. |
| Meaning and acceptance consequence of Row 26 E2E-pending and “bridge” | **Requires an explicit acceptance-authority decision because the existing requirement is ambiguous** | The row has an E2E-pending cell and calls the capability a `CertifiedSectorEngineId` bridge, while IPD inventory row 13 identifies a library with no product route and E2E NA. The row does not name a particular consumer, observable integration, transport, engine mapping, or acceptance test. An authorized interpretation is required before changing the Row 26 status or treating it as closed. |
| Broad P15 provider-to-score lineage and golden-digest claims | **Partially satisfied** | The offline seven-hop harness is evidence for that harness's declared paths. The executor-level lineage fix strengthens its Hop 4 score evidence, but neither it nor digest presence/length proves every input dependency or a live cross-repository chain. Broader claims remain bounded to existing P15 tests and require their own evidence. |

No test was run as part of this documentation reconciliation. The historical test results above are attributed to the prior implementation session and are not relabelled as current execution.

## 4. Remaining findings

| Finding | Treatment under bounded-library scope |
|---|---|
| Recalculation triggers versus actual recalculation, replay, and snapshot retention | The DAG's trigger behavior is library evidence only. Responsibility and any additional P11 requirement are **unresolved** where governing requirements do not assign them. No redesign or retention claim is made. |
| `CSIP_COMPOSITE` dispatch semantics | Engine-ranking helper coverage does not establish a production dispatch contract. **Unresolved** unless an existing authoritative P11 criterion specifies dispatch behavior; no new semantics are created. |
| `mode` and `governedIntelligenceInputs` semantics | Not needed to claim the bounded scoring-library fixes. Whether existing P11 criteria require defined behavior remains **unresolved**; this record does not waive an explicit requirement. |
| UI05 compatibility | Outside this scope because no consumer is commissioned. If a consumer is later authorized, compatibility must be evaluated against its actual contract. |
| IPD/IRR taxonomy and engine equivalence | Outside this bounded scope and not established. Any later requirement needs explicit mapping and acceptance authority; none is invented here. |
| Broader P15 lineage-chain and golden-digest claims | Separate from P11 library acceptance; existing offline evidence is not promoted to cross-repository or live E2E evidence. |

## 5. Row 26 disposition

**Recommendation: C — separate the claims without creating a technical integration requirement.** Retain the IPD P11 library claim and its library-level evidence separately from any product-E2E/consumer claim. Do not close Row 26 solely from the bounded-scope selection or the two remediations. The matrix's `EP` and “bridge” wording requires an explicit interpretation by its acceptance authority before the E2E-pending status can be removed or recast as not applicable.

**Exact outstanding decision:** the IRR tracker/Row 26 acceptance authority must decide whether Row 26's “`CertifiedSectorEngineId` bridge” and E2E-pending cell require (a) a named product consumer and composed acceptance test, or (b) library-only acceptance with the E2E dimension explicitly treated as not applicable. If (b), that authority must authorize the corresponding Row 26 and governing tracker update. This record does not make that decision on their behalf.

## 6. Publication and scope boundary

This record and the IPD inventory annotation are published on the IPD task branch only. The IRR repository was inspected read-only and was not changed. Consequently IRR Row 26 remains exactly as it was at the verified IRR revision; no closure, status change, or acceptance act is claimed. No implementation code, product integration, HTTP service, engine bridge, or engine-equivalence test was built.
