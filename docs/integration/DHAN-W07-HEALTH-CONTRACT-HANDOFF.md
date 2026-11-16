# W-07 — IPD health contract and IRR coordination

**Status: IPD implementation candidate; coordinated W-07 remains PARTIAL.** IPD owns the provider contract; IRR PR [#567](https://github.com/ramkivs/iips-review-recovered/pull/567), branch `arena/4bdc1e8b-iips-review-recovered`, head `2a45f675840be95671c520b66857b4bfde99f1d3`, contains the separate mirror implementation and awaits an IPD package-pin update and installed-client/consumer verification. Do not merge either leg or start W-08 on the basis of this record alone.

## Authority and baseline

- D-7's IPD adoption record is published unchanged in this branch lineage, including at `bcfa6cbbcaff63a8c55f4d7395c4cbb5d0088d52`: [IPD decision](DHAN-D7-PROVIDER-STATE-MODEL-AND-DIAGNOSTICS-POLICY-2026-11-12.md). Its statement that IRR acceptance was outstanding is historical, not the current cross-repository disposition.
- IRR's separate D-7 acceptance became effective through merged PR [#565](https://github.com/ramkivs/iips-review-recovered/pull/565), merge commit `3cc99a1f170cd19771f992160d903f8b8cb9fee3`, [acceptance record](https://github.com/ramkivs/iips-review-recovered/blob/3cc99a1f170cd19771f992160d903f8b8cb9fee3/docs/integration/DHAN-D7-IRR-ACCEPTANCE-2026-11-16.md). It accepts the IPD model without changing D-7 semantics. W-07 is independently authorized by this task.
- The IPD candidate branch is diverged from IPD main; this delivery retains its existing history and is **not** evidence that an owner has installed it. A PR targeting main necessarily includes that earlier candidate history, not just W-07. No main-line convergence or deployment is implied.

## Contract for the IRR pin-bump leg

| Field | Supported values |
| --- | --- |
| `liveProviderConnectivity` | `NOT_CHECKED_PRE_ACCESS` (legacy), `CONNECTED_LIVE` |
| `providerQualification` | `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` (legacy), `LIVE_QUALIFIED` |
| `contractVersion` | absent (legacy), numeric `1` (legacy), numeric `2` (W-07); the current daemon emits `2` |

This confirms IRR PR #567's proposed marker `contractVersion: 2`. `service` remains `UP`/`DOWN`; `providerConfiguration` remains `CONFIGURED`/`PRE_ACCESS_CREDENTIALS_UNAVAILABLE`. The transport client validates every field and rejects unknown values, unsupported versions, malformed inputs and a success-shaped body that also asserts failure (`ok: false`, `error` or `failure`) as `MALFORMED_RESPONSE`. It copies only governed fields and never echoes an untrusted body. Marker omission is preserved as omission, not fabricated. The two vocabulary fields are independently accepted in all four combinations, matching IRR #567; acceptance of a wire value is not evidence for a D-7 state transition or live qualification. Actual emitted connectivity and qualification remain the previous pre-access values; W-07 adds no observer, probe or vendor request.

The client and types are exported through `iips-production-market-data/dhan-server`. `tests/dhan_d3d_contract_drift.test.ts` exercises all value pairs and supported markers plus malformed, unknown and contradictory responses through the exported client. The package-consumer test packs and installs IPD into an isolated synthetic consumer and verifies the actual installed client using a fake `fetch`. Historical W-06 capture evidence remains unchanged; its current synthetic health-response assertion now includes the additive marker.

## Verification and remaining acceptance

- Build/typecheck and package-consumer/browser boundary checks: PASS. Focused contract/provider/daemon regressions: PASS.
- Full-suite gate: initial run **failed** one W-06 current-response exact-body assertion because the new version marker was absent from its expectation (1,734 passed, 1 failed, 4 skipped). The assertion was updated to require the additive field while preserving the historical captured prefix and the zero-provider-call check. Full rerun: **1,735 passed, 4 skipped, 0 failed** (1,739 total).
- This is synthetic evidence only. It does not establish vendor connectivity, live qualification, M1/M2 or W-11 acceptance. W-06 remains COMPLETE — OWNER ATTESTED; the Friday snapshot and its `UNAVAILABLE` freshness remain unchanged.
- IRR must update its own package pin to the published W-07 commit, replace the pending-pin tripwire, execute its joined and per-value installed-client verification, and review/accept both legs. IPD does not write to IRR. W-08 remains blocked until coordinated W-07 is verified and accepted.
