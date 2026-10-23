# CAP-02 Gate 4 H-12 v3 candidate — content-integrity validation and stop record

**Record status:** `CONTENT-INTEGRITY VALIDATION COMPLETE FOR OBSERVED SET; FULL H-12 v3 VALIDATION
BLOCKED BY EFFECTIVE 33-PATH MEMBERSHIP CONFLICT; NOT ADOPTED`.

This is the replacement preparation required by the effective Gate 4 act §8. It is not an adoption
act, host preflight, QE evidence or result acceptance. The exact conflict is preserved rather than
silently resolved.

## Exact artifact and pins

- Candidate: `evidence/cross-repository/IIPS_V3_CAP02_G4_H12_MANIFEST_V3_CANDIDATE_2026-10-23.json`
- Candidate raw SHA-256: `344d1bd19c35231cc9d243c58f7e1ce22ccb7bfeda541966a71c1355a17d0594`
- IPD final Limb A merge pin: `a52b47b0f8ca448c8c9c195cf261e83ecf813ba3`; root tree `1467802e9b9497f84acb1bc6bb3ddd386792499a`
- IRR current QE consumer pin (read-only): `4740ba21ea6103f1a7ebc9768269ae7795920698`; root tree `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162`
- Historical IRR Gate 3 acceptance identity retained separately: `d355d904aa52988e70a98324714886f6a1c0ea2a` / `e631cf3287fc19a2d1c8f73a0eb5f8d640370e27`

## Observed validation results

| Set | Result |
|---|---:|
| Observed mandatory IPD path records | **32/32 present and verified** at the final commit, including `tests/g4_run_tests_summary_parsing.test.ts` |
| Effective act §8 required IPD membership | **33 mandatory paths**; one path membership is unresolved, not fabricated |
| Mandatory IRR consumer paths | **24/24 present and verified** at current IRR `main` |
| Authoritative criteria references | **9/9 verified** |
| Frozen Gate 3 anchors | **10/10 verified** |
| Conditional parser helper | **PRESENT**, with Git blob SHA-1 and raw SHA-256 recorded |
| Runtime `dist/**` set | Captured at build time with SHA-256; not a host/QE result |
| QE evidence-deposit set | **NOT GENERATED**; explicit because QE-1…QE-11 have not executed |

For every PRESENT repository entry, the validator resolved the recorded commit/tree, `git rev-parse
<commit>:<path>` blob, exact `git cat-file blob` bytes, byte length, LF/CRLF/bare-CR counts, and
SHA-256. No normalization, `autocrlf` conversion or working-tree bytes were used. Both repositories
were read-only; no IRR file, branch, PR, issue, comment or tracker was changed.

## Material integrity/authority conflict — STOP

- The effective published act `IIPS_V3_G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01`
  §8 explicitly requires **33 mandatory IPD paths**, described as the candidate's 32 plus the
  mandatory parser test.
- The preserved determination packet D-7/§4.7 defines **32 mandatory IPD paths** and already names
  `tests/g4_run_tests_summary_parsing.test.ts` as the required future path. The machine-readable v2
  candidate contains 32 IPD path records total: 31 present at its old pin plus that absent parser-test
  record. At the final Limb A commit, the same record set has 32 present paths.
- No authoritative record names a distinct 33rd path. Adding an unlisted path or duplicating the
  parser test would fabricate membership; silently using 32 would contradict the effective act.

**Required decision:** Program Authority must issue a corrective membership determination or an
explicit adoption-boundary disposition reconciling the §8 count and path set. Until then, H-12 is
**NOT ADOPTED**, and host preflight/QE cannot start. Gate A′ identity values remain separately
unresolved; no provisioning, host operation or QE item was executed.

## Reproduction

From fresh clones, verify each recorded commit/tree, `git rev-parse <commit>:<path>`, and hash the
raw `git cat-file blob` bytes, including newline counts. Rebuild IPD with `npm run build` only for the
local runtime capture; do not substitute generated `dist/**` for host evidence. Do not adopt this
candidate or proceed to host/QE until the separate PA membership decision is durably published and
read back.
