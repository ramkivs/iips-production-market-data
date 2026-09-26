# B1 Windows Tier-3 Operator Certification Record

Certification scope: IES-016 / IES-017 / IES-020
B1 baseline: b3cfbe194bba426077a97ab1293ec881b38801ec
Environment: Windows operator qualification
Evidence date: 2026-09-25

## 1. Tier-3 execution

Authoritative Windows Tier-3 execution completed against the B1 baseline.

Result:

- Tests: 87
- Pass: 87
- Fail: 0
- Cancelled: 0
- Skipped: 0
- Exit code: 0

The 12 prescribed Tier-3 test-file hashes were verified before execution and verified unchanged after execution.

## 2. API qualification

GET /api/engines returned:

- HTTP 200
- 13 engines
- X-IIPS-Certification: NONE CLAIMED
- provenance.b1Certification: NONE CLAIMED
- freshness: FROZEN

IES-016, IES-017 and IES-020 were present.

Their certificationLineage was:

historical A1 lineage / B1 adoption pending certification

No B1 certification claim was exposed by the API.

## 3. Execute-route fail-closed qualification

For each of IES-016, IES-017 and IES-020:

- POST /api/engines/{IES}/execute = HTTP 405
- GET /api/engines/{IES}/execute = HTTP 404

No Execute route was exposed.

## 4. Browser qualification

The Windows operator observed /research/engines at:

http://127.0.0.1:5173/research/engines

Observed:

- 13 engines displayed
- IES-016 Telecommunications displayed
- IES-017 Automobile displayed
- IES-020 Materials & Metals displayed
- historical A1 lineage / B1 adoption pending certification (NOT B1-certified) displayed for the three adopted engines
- freshness FROZEN displayed
- deterministic runtime configuration displayed
- no Execute control exposed for the adopted engines

The page rendered normally.

## 5. Compiler qualification

Independent TypeScript compiler execution:

npx.cmd --no-install tsc

Exit code: 0.

Evidence is captured in build-tsc-compiler-only.txt.

## 6. Build qualification limitations

The prescribed root build:tsc command was not a clean Windows build because package.json contains:

tsc && cp iips-platform/package.json dist/iips-platform/package.json

The Windows environment does not provide the Unix cp command.

No source or package-script modification was authorized or performed during G2.

The independent Vite build produced the expected transformed/rendered production output, including:

98 modules transformed
rendering chunks
built in 1.01s

However, the PowerShell/npm invocation returned a non-zero status associated with the Vite reporter output. Therefore the Vite command is NOT recorded as a clean PASS.

These build observations are recorded as qualification limitations and are not converted into PASS claims.

## 7. Repository integrity

No source-code modification was made during the Windows Tier-3 qualification.

The B1 certification baseline remained:

b3cfbe194bba426077a97ab1293ec881b38801ec

The evidence deposition is operator evidence only and does not itself issue B1 certification.

## 8. Certification disclosure

This record does NOT issue or claim B1 certification for IES-016, IES-017 or IES-020.

The authoritative disclosure remains:

X-IIPS-Certification: NONE CLAIMED

b1Certification: NONE CLAIMED

historical A1 lineage / B1 adoption pending certification

## 9. Evidence files

The accompanying directory contains the raw API, execute-probe, build, server-log and parsed-response artifacts captured during the Windows qualification.
