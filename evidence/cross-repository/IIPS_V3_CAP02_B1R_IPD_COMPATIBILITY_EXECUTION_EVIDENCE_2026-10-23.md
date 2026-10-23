# IIPS v3.0 CAP-02 — B-1R IPD compatibility execution evidence

> **LOCAL IMPLEMENTATION/PACKAGE EVIDENCE — PUBLICATION RECEIPT PENDING AT THIS REVISION.**
> This record is evidence for the exact non-production IPD compatibility act. It is not Gate 4
> qualification, target-host evidence, production acquisition evidence, operational-write approval,
> IRR repin evidence or cross-repository E2E evidence.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-B1R-IPD-COMPATIBILITY-EXECUTION-2026-10-23-01` |
| Date | 2026-10-23 (UTC) |
| Repository | `ramkivs/iips-production-market-data` only |
| Authority | `IIPS_V3_CAP02_B1R_IPD_COMPATIBILITY_IMPLEMENTATION_ACT_EFFECTIVE_2026-10-23.md` |
| Verified starting baseline | `main@b3428f3f431eceb1dcde60e3b120bbd1888622bb` |
| Read-only consumer source | IRR `98cd56a9a568f431ea31d5515e515a1b6cbb91ba` |
| Disposition | `NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_ONLY` |

## 1. Authority and boundary reconciliation

The Increment A act remains limited to `./portfolio-ui`; it was not stretched to authorize this work.
The U7 act remains the behavior authority; this implementation adds only its three existing type names
to the package entry and the two established refusal codes to the existing union. The D114 Stage-5
boundary remains offline/non-production. The C6 identity decision remains intact: `companyId`, IRR
identity and series-qualified `securityId` are not interchangeable.

No IRR file, ref, PR, issue, comment or tracker was modified. The IRR checkout used for comparison was
read-only. Off-main IPD material was used only for comparison; no off-main implementation was restored
or promoted wholesale.

## 2. Implemented compatibility contract

- `securityId` uses exactly `ISIN:<isin>:<series>`, with source-derived D114 ISIN/series values and
  `NON_AUTHORITATIVE` ISIN authority. Missing, blank, malformed or conflicting identity fails closed.
- PIT keys are `${companyId}:${domain}` for legacy records and
  `${companyId}:${domain}:${securityId}` for explicit series records. Explicit reads never fall back;
  company/domain reads select only a sole admitted key and throw on ambiguity.
- `PitReadService` is read-only, accepts no company identifier, returns typed hit/miss results, uses
  only actually admitted keys, excludes future vintages, and preserves the original provenance block.
- The frozen local D114 corpus drives both existing parser eras and the existing loader into one
  caller-supplied store. Three archives × two series × two domains produce 12 records; replay through
  the same loader produces 12 idempotent skips and no new records.
- The public package has exactly three subpaths: `./portfolio-ui`, `./pit`, and
  `./d114-non-production`. No persistence, privileged IPC, provisioning or wildcard export was added.
- `WRITE_NOT_AUTHORIZED`, `RESOURCE_UNAVAILABLE`, receipt-driven success/durability,
  `OUTCOME_UNKNOWN`, no automatic retry, `SESSION_ONLY` and `durable:false` remain explicit and tested.

## 3. Actual consumer matrix

The verification script packs the built package, installs the tarball into a temporary consumer, and
uses the installed package—not repository source paths—for runtime and TypeScript checks.

| Consumer | Evidence | Result |
|---|---|---|
| Public PIT fixture | `PointInTimeStore`, `PitReadService`, `CanonicalEnvelope`, `PITQuery`, `PitReadRequest`, `PitReadResult`, provenance/domain types | Runtime and declarations PASS |
| Public D114 population | All three population helpers, EQ/BL constants and three vintage constants | Runtime and declarations PASS; 12 records; replay 12 skips |
| Public UI | All existing runtime exports plus U7 receipt/outcome/refusal types | Runtime and declarations PASS; 22 runtime exports; session-only safeguard intact |
| IRR `frontend/server/pit/ipdPitReadAdapter.ts` | Verbatim file at `98cd56a9…`; installed `./pit` declarations; real adapter execution | Typecheck PASS; runtime PASS |
| IRR `frontend/server/pit/nonProductionPitStore.ts` | Verbatim file; installed `./pit`; real fixture population execution | Typecheck PASS; runtime PASS; 8 records |
| IRR `frontend/server/pit/nonProductionRuntimePitStore.ts` | Verbatim file; installed `./pit` and `./d114-non-production`; real combined population execution | Typecheck PASS; runtime PASS; 20 records |
| IRR `frontend/server/pit/pitD114RuntimeIntegration.test.ts` | Verbatim file; installed package declarations | Typecheck PASS; route test not executed |
| IRR `frontend/server/pit/pitRuntimeIntegration.test.ts` | Verbatim file; installed package declarations | Typecheck PASS; route test not executed |

The two route integration test files were compiled, not run. Only unrelated IRR HTTP/vitest
infrastructure was stubbed for that compile check; no IPD package import was rewritten or mocked. The
three production composition modules and the real adapter were executed against the installed pack.
This is deliberately **not** an IRR route/E2E claim.

The first verbatim-consumer compile exposed a real generic constructor incompatibility when an IRR
`PointInTimeStore<unknown>` was passed to `PitReadService<Record<string, unknown>>`. The IPD facade now
accepts the unknown-payload store and performs only a type-level payload projection; runtime behavior
is unchanged. The verbatim compile and runtime checks were rerun successfully after that correction.

## 4. Final local validation

Commands were run serially after the final source edits:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Exit 0 |
| `npm run build` | Exit 0; TypeScript, Vite and both package builds passed; only the existing Vite large-chunk advisory |
| Focused compiled PIT/D114/package/U7 suite | 99 tests, 99 passed, 0 failed |
| `npm test` | 875 executed, 874 passed, 0 failed, 1 skipped; 121 suites; guarded runner passed |
| `npm run test:package-consumer` | PASS using a fresh temporary pack/install and a fresh read-only IRR clone |
| Packed artifact | 121 files; 239,032 packed bytes; 2,706,254 unpacked bytes in the verified run |
| Actual IRR importer check | Five verbatim files typechecked; production composition/adapter runtime PASS |
| Browser closure | Installed `./portfolio-ui` browser bundle succeeded; 1,729,910 bytes; forbidden-hit list empty |
| `npm pack --dry-run --ignore-scripts` | Exit 0; 121 files; only `package.json` and `dist/package/**` contents |
| `git diff --check` | Exit 0 |

The isolated consumer summary reported `pitRecords:1`, `d114Records:12`,
`replayDuplicates:12`, `uiRuntimeExports:22`, `durability:"SESSION_ONLY"`, `durable:false`, and both
Class A refusal codes. The IRR composition summary reported 8 fixture records, 20 combined records,
D114 resolution at `2026-02-10T15:30:00.000Z`, and `INVALID_IDENTITY` for the malformed request.

## 5. Safety and non-claims

No production/network acquisition, live provider, credential, durable store, operator store, Windows
target host, privileged IPC endpoint, identity provisioning, binding provisioning or operational write
was used. The D114 data is explicitly frozen local non-production fixture data. Package/CI/Linux success
does not qualify Gate 4, render U4, grant U5/U6, provision Gate A′, accept results, admit Gate 5, enable
writes, execute the IRR B-1R repin or establish cross-repository E2E.

## 6. Publication receipt

**Pending at this revision.** The implementation candidate has not been called published. The receipt
will be appended only after the focused IPD PR, required checks, merge and remote read-back are complete.
