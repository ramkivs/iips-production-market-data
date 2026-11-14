# DHAN W-02 — Windows DPAPI Directory ACL Idempotency

**Status:** PRODUCTION CORRECTION IMPLEMENTED AND VERIFIED IN ARENA — **a fresh Windows-host acceptance run is required**
**Work item:** W-02 (roadmap v1.1), decision D-1
**Repository:** `ramkivs/iips-production-market-data`
**Branch:** `arena/84d1e063-iips-production-market-data`
**Pull request:** #156
**Date:** 2026-11-12 (UTC)

> Three kinds of evidence appear below and are never mixed: **(A)** the user's Windows-host
> evidence, supplied from the operator's machine; **(B)** what Arena executed; **(C)** what is
> still pending on Windows. Arena made **no** Windows call and claims **no** Windows result.

---

## 1. Root cause

The carrier write path applied the carrier-directory DACL on **every** write, and the applier
rewrote the DACL unconditionally.

The operator reproduced the failure on the real Windows host:

| Operation | Result |
| --- | --- |
| First directory ACL application | PASS |
| First temporary-file ACL | PASS |
| **Second directory ACL application** | **FAIL** |
| Second temporary-file ACL | PASS |

```
System.Security.AccessControl.PrivilegeNotHeldException
HRESULT: -2147024891  (0x80070005, ERROR_ACCESS_DENIED)
```

With two carriers this is deterministic:

1. client-id carrier write → directory DACL applied (succeeds);
2. client-id beside-file DACL applied (succeeds), carrier swapped into place;
3. access-token carrier write → directory DACL applied **again**;
4. the OS refuses the redundant rewrite → `PrivilegeNotHeldException`;
5. the access-token carrier is never written.

The temporary-file path was never the problem: a fresh beside-file inherits, so its DACL really
does need writing every time.

**Correct fix:** verify the observed DACL and write only when it actually differs. Not a wider
ACL, not a suppressed exception, not "skip the directory check".

## 2. Production correction

The access-control policy had no production implementation: `writeDpapiCarrierAtomically` accepted
an injected `applyOwnerOnlyAcl` callback and the only implementation in the repository was the
acceptance harness's private static script. That is now corrected — the policy and its application
are production modules.

| File | Change |
| --- | --- |
| `src/providers/dhan/dhan_dpapi_acl.ts` | **new** — `evaluateOwnerOnlyAcl` (the D-1 policy as one pure function), `parseDpapiAclResponse`, `createWindowsDpapiAclApplier` (read → evaluate → apply only on a difference → read back → verify), `createWindowsDpapiAclContainer`, `DpapiAclApplyError`, the defect and failure taxonomies |
| `src/providers/dhan/dhan_dpapi_process.ts` | two static child programs added: `read-acl` (full descriptor: owner SID, `AreAccessRulesProtected`, every rule's SID, type, rights, inheritance and propagation flags, inherited) and `apply-acl` (apply-only, never evaluates). `describe-acl` and `unprotect` unchanged |
| `src/providers/dhan/dhan_dpapi_carrier.ts` | `applyOwnerOnlyAcl`/`DpapiAclApplyResult` widened so the write reports whether the directory DACL was really rewritten; `DpapiCarrierWriteResult.directoryAclRewritten` added. Atomic write-beside/verify/swap, the envelope schema and the error taxonomy are untouched |
| `src/providers/dhan/index.ts` | exports the new module |
| `windows-acceptance/w02_dpapi_acceptance.mjs` | its private ACL script is **removed**; the harness now composes the production applier, so the Windows run exercises the shipped code. New case `W02-WIN-08B` proves the second application is a no-op |

### Behaviour

1. **Read** the descriptor (one `read-acl` child process).
2. **Evaluate** the exact policy in the parent process: inheritance disabled, owner is the current
   user, exactly two rules, current user + SYSTEM each exactly once, `Allow`, `FullControl`,
   the kind's inheritance flags (`ContainerInherit|ObjectInherit` for a directory, `None` for a
   file), `PropagationFlags.None`, nothing inherited. Any deviation is a named defect.
3. **Correct** (only when it differs): apply, read back, evaluate again. A result that still fails
   is `ACL_VERIFY_FAILED` with the observed defect — never accepted.
4. **Every beside-file** still receives the file DACL before content exists, and is still verified
   after the swap.

Nothing is suppressed: `PrivilegeNotHeldException` surfaces as a non-zero child exit → fixed
`ACL_APPLY_FAILED`, which the carrier maps to `DpapiCarrierWriteError('ACL', …)` and the previous
carrier is left authoritative.

Preserved unchanged: DPAPI `CurrentUser` semantics, the two-carrier layout, the envelope schema,
atomic replacement, the failure taxonomy, readiness gating and fail-closed behaviour.

## 3. Regression tests

`tests/dhan_w02_dpapi_acl.test.ts` — **16 tests**, running the real production policy, the real
applier and the real atomic writer. Only the Windows OS boundary is emulated (an injected runner
that maintains DACL state exactly as the static programs do); nothing is mocked past the boundary.

| Requirement | Test |
| --- | --- |
| Initial directory ACL establishment | `W-02-ACL-09`, `-14` |
| Repeated application when already correct | `W-02-ACL-04` |
| No unnecessary directory ACL rewrite | `W-02-ACL-04`, `-09` (`directoryAclRewritten === false`) |
| Incorrect DACL correction + read-back verification | `W-02-ACL-05`, `-06` |
| Unexpected principal handling | `W-02-ACL-02` (`ACL_UNEXPECTED_PRINCIPAL`, `ACL_DUPLICATE_PRINCIPAL`, `ACL_RULE_COUNT`) |
| Temporary-file ACL on every write | `W-02-ACL-10` |
| Directory ACL failure fail-closed | `W-02-ACL-11` (no carrier, stage `ACL`) |
| Temporary-file ACL failure fail-closed | `W-02-ACL-12` (previous carrier intact, beside-file removed) |
| Client-id carrier write | `W-02-ACL-09`, `-14` |
| Access-token carrier write | `W-02-ACL-09`, `-13` |
| Atomic replacement guarantees | `W-02-ACL-13` (replaced flag, no beside-file, envelope parses) |
| Existing DPAPI backend behaviour | `tests/dhan_w02_dpapi_backend.test.ts` 12/12, unchanged |
| Policy totality (every defect) | `W-02-ACL-01`, `-02`, `-03` |
| Static programs carry no data / no stderr plumbing | `W-02-ACL-15` |
| The harness uses the production applier | `W-02-ACL-16` |

## 4. A. User-supplied Windows-host evidence (not executed by Arena)

The operator ran `windows-acceptance/Invoke-W02DpapiAcceptance.ps1` on `DESKTOP-NO0NHTP`
(PowerShell 5.1.26100.9818, node v22.16.0), 2026-11-12T12:32:04Z → 12:32:16Z, and obtained
**18 entries, 18 PASS, 0 FAIL, Overall PASS**, including the real
`ProtectedData.Protect`/`Unprotect` round trip at `DataProtectionScope.CurrentUser`, both carriers,
carrier separation, DACL evidence, readiness gating, the typed negatives, non-exposure and cleanup.

That run was made after the operator applied the idempotency check **inside the harness's own ACL
script**. It is genuine evidence that the *approach* is correct on that host. It does **not**
validate the production implementation added here, which did not exist at the time — the harness
has since been changed to call the production applier. The evidence record itself is the
operator's file and is not reproduced or altered here.

## 5. B. Arena-executed validation (all that this environment can prove)

| Check | Command | Result |
| --- | --- | --- |
| New ACL suite | `node --test dist/tests/dhan_w02_dpapi_acl.test.js` | **PASS — 16/16** |
| W-02 backend suite (unchanged behaviour) | `node --test dist/tests/dhan_w02_dpapi_backend.test.js` | **PASS — 12/12** |
| Acceptance artefacts suite | `node --test dist/tests/w02_acceptance_harness.test.js` | **PASS — 5/5** |
| PowerShell structural validator | `python3 windows-setup/.validate-scripts.py windows-acceptance` | **PASS — 26 checks, 0 failed** |
| Harness syntax | `node --check windows-acceptance/w02_dpapi_acceptance.mjs` | **PASS** |
| TypeScript (all configs) + `vite` build | `npm run build` | **PASS** |
| Package consumer, strict typecheck | `npm run test:package-consumer` | **PASS**, `forbiddenHits: []` |
| Full repository suite | `npm test` | **PASS — 1529 executed, 1528 passed, 0 failed, 1 pre-existing skip** |

Not proven in Arena: any real Windows ACL call, any real DPAPI call, and the PowerShell programs'
runtime behaviour (`read-acl`, `apply-acl`) beyond their structure and the emulated boundary.

## 6. C. Remaining Windows-host acceptance — REQUIRED

Because the production DACL path changed, the earlier 18/18 result no longer covers it. One fresh
run on the Windows host is required:

```powershell
cd H:\IIPS\iips-production-market-data
git pull
npm ci
npm run build:tsc
powershell -ExecutionPolicy Bypass -File .\windows-acceptance\Invoke-W02DpapiAcceptance.ps1
```

Expected evidence log:
`H:\IIPS\logs\w02-dpapi-acceptance\<yyyyMMddTHHmmssZ>\W02-DPAPI-ACCEPTANCE-EVIDENCE.md`

What must be true in the new log:

* 19 entries, all `PASS` — 18 as before plus **`W02-WIN-08B`** (repeated directory ACL application
  is a no-op: `changed=false`, `verified=true`);
* `W02-WIN-03` reports `directory DACL rewritten: yes` and `W02-WIN-04` reports
  `directory DACL rewritten: no` — the exact sequence that failed before;
* no `PrivilegeNotHeldException`, no `ACL_APPLY_FAILED` in any entry.

Until that log exists, the Windows-host disposition stays **PENDING** and the roadmap's W-02 exit
criterion for real Windows ACL/DPAPI behaviour is not closed.

## 7. Scope

W-02 only. W-03 (selector, awaited `probeReadiness()`, D-7), W-04 (the interactive provisioning and
rotation utility that will compose `createWindowsDpapiAclContainer`) and W-05 are untouched. IRR and
the IPO Screening Engine are untouched.
