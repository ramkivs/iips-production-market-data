# CAP-03 independent IPD evidence reconciliation — 2026-10-26

## Authority and scope

This is IPD-owned preparation/documentation and repeatable integrity evidence under the user's bounded instruction to advance independently authorized work. It is **not** an implementation grant, PA act, designation, freeze, host receipt or qualification. No application source, existing test, package, lockfile, pin, fence, manifest or IRR record is changed. No Gate A′ identity-value investigation is performed. No new implementation defect was demonstrated; the already-merged PR #96 correction is not reopened.

Authoritative governance was read at IRR `ramkivs/iips-review-recovered` **main@c493c5d3e9fa611475373f1f6428e285841a9456**, including the master tracker through **§16.132**, DQ-4 freeze manifest, S2/P-1/S3/QE matrix, PF-15 authority reconciliation and decision request. The tracker is over the GitHub contents API size limit for inline content: it was retrieved through its Git blob API, not treated as empty. Source identities are in `04-governance-sources.json`.

Those records identify IPD as **ramkivs/iips-production-market-data**, authoritative publication branch **main**, currently **1e76f4cf9e9ca7d385a8345c9b6f438ae1ad6745**, tree **7003a2828bde51985393348fa6e657a6cb8d4eed**. The corrected candidate **001c3c80618f2ee1d40e9a90912237e1a06e7b58** was merged by PR #96. Prior Arena/candidate branch names are historical, not instructions to switch branches. This evidence is published on the session branch **arena/8f07b78e-iips-production-market-data**, based on the verified authoritative main. Publishing here does not promote it to main or designate a new qualification pin.

## DQ-4 independent work completed

`verify_ipd.py` verifies raw adopted H-12 R5 bytes against SHA-256 `d0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76`, then independently checks IPD Git object IDs, raw SHA-256, lengths and source trees. It audits **59 IPD records** (32 primary, 1 conditional helper, 9 criteria references, 7 accepted IPD Gate 3 anchors and 10 candidate remeasurements) plus **14 alias raw sources**. This is intentionally an **IPD-only** audit, not a claim to repeat the full bilateral 981-check validation or validate the supplement/runtime-dist set.

- **32/32 primary entries unchanged** at current IPD main relative to the adopted primary coordinate. Conditional helper, criteria and candidate-remeasured anchors also remain unchanged.
- Three comparisons against *historical accepted Gate 3 anchor bytes* differ (`portfolioStorePort.ts`, `package.json`, `.github/workflows/ci.yml`). Their designated historical bytes all verify. These are not newly introduced drift: candidate remeasurements are distinct from historical acceptance and all 10 candidate remeasurements remain unchanged. No historical anchor is rewritten.
- The full primary-to-main path census is recorded, not reduced to “zero drift”: **35 paths**, 33 evidence paths plus **scripts/verify-public-package.mjs** and **tests/portfolio_ui_package.test.ts**. The two non-evidence changes are the verified merged PR #96 correction. This pass does not call current main identical to the approved baseline merely because 32 primary entries match.
- The **approved primary pin remains 8eec74ae27cda09f3c368b9c299895eae41554db**, tree `4eba29029f8d95cfe483e615a7047426b298ce50`. Alias remains `70b24f029842a7e9b7f615e4d9df7376fd4ff817`. Any needed candidate adoption/re-designation remains a separate PA-governed matter. Do not run qualification at current main on this audit's authority.

This advances DQ-4's exact-coordinate/content-integrity and drift-accounting evidence, and supplies an independently replayable IPD check supporting remote read-back. It does **not** newly close a freeze criterion. Current governance reports **8/10**: criteria **7** (host sequence) and **8** (native-Windows canonical evidence) remain unmet. Criteria 5/6 are already satisfied by the effective DQ-6b mirror and H-12 adoption/mirror; the older freeze manifest's 6/10 summary is historical.

## PF-15 independent work completed

The current IPD resolver and existing tests were inspected and validated without selecting an operational value:

| PF-15 obligation | Existing IPD evidence / boundary |
|---|---|
| Option A, explicit Windows named-pipe path | `src/ipc/endpoint.ts:resolveEndpointTarget`; existing `g3_no_network_listener` test accepts the Windows pipe namespace and refuses other Windows absolute paths. No state directory needed for this resolution form. |
| Option B, bare name plus absolute local-state directory | Resolver validates name grammar/no `..` and requires an absolute platform-matched state directory. Windows constructs a kernel pipe name, not a filesystem socket. Existing pure resolver test covers Windows and POSIX. |
| No URL, host:port, relative-path fallback | Existing resolver refusal tests pass. Missing configuration throws; no operational default is supplied. |
| DACL, capacity, collision, same-host refusal, shutdown | `windowsPipeDescriptor` explicitly distinguishes application controls from unverified platform behavior. Linux tests cannot prove actual Windows DACL, remote/SMB refusal or lifecycle. Native-host evidence remains required. |
| Local fixed NTFS, outside worktrees/sync roots, operator writability | Resolver absoluteness is **not** proof of these host properties. They require the designated host's observations; no directory is created or inspected here. |
| Exact values, store relation, MANIFEST/raw evidence, effectiveness | Separate value-bearing PA act in IRR is still required. Test strings are fixtures, **not candidates or designations**. No endpoint/state/database value is adopted here. |

This supplies IPD-locus readiness evidence; it does **not satisfy PF-15 designation**. The PA response must contain all seven contents in the current PF-15 request/reconciliation: exact endpoint; state path if needed; P-1 database relation; raw evidence treatment; MANIFEST/external-root treatment; native-host verification; and publication/effectiveness. No IPD implementation work is authorized merely by IRR's PF-15 designation label.

## Validation and replay

All commands ran on **Linux / Node v22.22.3** against IPD main `1e76f4cf…`, before these evidence-only additions:

| Evidence | Result |
|---|---|
| `10-install.txt`: `npm ci --no-audit --no-fund` | exit 0 |
| `11-build.txt`: `npm run build` | exit 0 (TypeScript, Vite and package builds) |
| `12-tests.txt`: `npm test` | exit 0; **924 tests, 923 pass, 0 fail, 1 skip**; guard OK |
| `13-package-consumer.txt`: `npm run test:package-consumer` | exit 0 |
| `01-ipd-object-audit.json` | integrity checks passed; differences explicitly retained |
| `03-negative-test.txt` | manifest with one extra newline correctly refused, exit 1 |
| `02-baseline-ci.json` | GitHub run **40305563564**, exact main SHA, completed/success |

An initial remote-CI lookup used unsupported `gh run list --commit`; this was corrected using the actions API with `head_sha`. No validation result was inferred from the failed lookup.

Replay from a full-history IPD checkout (read-only; `gh` needs its existing connection):

```sh
gh api 'repos/ramkivs/iips-review-recovered/contents/docs/integration/G4-H12-MANIFEST-v2-CANDIDATE-2026-10-25-R5.json?ref=c493c5d3e9fa611475373f1f6428e285841a9456' --jq .content | base64 -d > /tmp/cap03-h12-r5.json
python evidence/cross-repository/cap03_independent_2026-10-26/verify_ipd.py /tmp/cap03-h12-r5.json 1e76f4cf9e9ca7d385a8345c9b6f438ae1ad6745
```

Audit exit 0 denotes integrity success, **not current-main equivalence**. Review `non_evidence_changes` and each comparison. Raw logs and the audit are bound by `SHA256SUMS`. Publication remote verification is recorded separately after the content commit, so that no commit claims to hash itself.

## Remaining dependencies and non-grants

1. Latest IRR §16.132 records Windows corrected-candidate component results (package consumer and guarded suite), preserving the failed approved-baseline S2 as diagnostic. Those host files were **not independently byte-verified here**; Linux success neither replaces them nor completes full S2.
2. P-1 remains unspent/not started under current records. **Do not execute P-1** in this task. S3 needs the single bounded P-1 receipt with V-A2-1…V-A2-8, exact store/runtime/host facts and publication/read-back; no simulated store can substitute. Host sequence and canonical host evidence cannot be completed independently here.
3. PF-15's exact value-bearing PA act is independent of P-1 as a governance decision, but is not supplied by current records or this task. No IPD authority to invent its values exists. Database linkage must defer to or identify the actual P-1 store, not preselect it.
4. S3, QE **0/11**, Gate 4 execution, Gate 5, acceptance/admission and writes remain untouched. W-1/503 fences, single-user personal-use scope, split alias baseline and all authority boundaries are preserved. No authentication/RBAC/database/enterprise changes.

IRR was read only throughout. No blocker was recorded without examining current records and actual IPD bytes; independent integrity, resolver-readiness, validation and publication work continued despite host/P-1 dependencies.
