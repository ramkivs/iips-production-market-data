# IIPS Windows Full-Shell Visual Acceptance

Date: 2026-09-23
Acceptance target: 28a6ed28308ac4eab0c06f8ae72b009c974dd7db
Acceptance worktree: G:\IIPS-IIPS-FULL-SHELL-WINDOWS-ACCEPTANCE

## Scope

Operator visual acceptance of the Offline Full-Shell Restoration target.

## Observed

- Master IIPS application shell rendered successfully.
- Governance header rendered.
- Tenant/role chrome rendered.
- Search control rendered.
- Notifications control rendered.
- Notes control rendered.
- Sign-out structural control rendered.
- Portfolio -> Overview rendered.
- BI-08 governed Portfolio workspace remained mounted.
- Portfolio displayed an explicit empty/no-holdings state.
- Executive rendered an explicit Data Unavailable / No Data state.
- Research -> Company rendered an explicit OFFLINE / SERVICE NOT ACTIVE state.
- Notes rendered an explicit OFFLINE state.
- Sidebar restored the broader Master IIPS menu structure.
- Partial, Unavailable and Future states were visibly distinguished.
- No fabricated investment data was observed.
- No production provider activation was performed.
- No D115 activation or authentication was performed.
- No Dhan activation was performed.
- No NSE production activation was performed.

## Acceptance Classification

SHELL / NAVIGATION: PASS
OFFLINE FAIL-CLOSED PRESENTATION: PASS
BACKEND / PROVIDER FUNCTIONALITY: NOT CLAIMED
PRODUCTION READINESS: NOT CLAIMED

## Evidence

Operator screenshots were captured during this acceptance session showing:
1. Portfolio / Overview
2. Executive Summary
3. Research / Company

## Boundary

This evidence certifies operator observation of the rendered offline shell and fail-closed states only. It does not certify production service availability, authentication, D115, Dhan, NSE, or other externally gated dependencies.

## Windows Technical Acceptance

Certified on 2026-09-23 from acceptance commit:

`ccab1cd11c0539497b0c31ed76d0d76dca9fe964`

### Compiled Test Suite

- Command: `npm.cmd test`
- Exit code: 0
- Tests: 516
- Passed: 516
- Failed: 0
- Cancelled: 0
- Skipped: 0
- Todo: 0
- Suites: 81
- Duration: approximately 8.0 seconds

### Result

WINDOWS TECHNICAL ACCEPTANCE: PASS

The complete compiled test suite executed successfully on the isolated Windows acceptance worktree.

The test output was captured separately during execution. The raw verbose log is intentionally not included in the acceptance commit; the authoritative result above records the exit code and complete test summary.

