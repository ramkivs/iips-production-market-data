# IIPS v3.0 — G3-D0 Documentation Publication Receipt

| Field | Value |
|---|---|
| Repository | `ramkivs/iips-production-market-data` |
| Starting `main` verified before G3-D0 documentation | `f678363de5db1486aa6c52be79e4d290380fdd27` |
| Documentation PR | [#20](https://github.com/ramkivs/iips-production-market-data/pull/20) |
| PR head | `30c6b5876c831b756cabca0c146583d001d50568` |
| Merge commit / ending `main` | `8b65971f01862c66e24103ab2aeddcd84a43a05c` |
| PR merge time | `2026-10-18T16:17:25Z` |
| PR CI | run `39144261163` — `success`; typecheck, build, guarded tests and executed-test-count checks passed |
| Post-merge `main` CI | run `39144322819` — `success`; head SHA `8b65971f01862c66e24103ab2aeddcd84a43a05c` |
| Current Gate B designated ref at verification | `cec7080252183a6a5332efe351e61c254d342a2d` (unchanged) |

## Changes published

PR #20 merged five documentation paths only:

- `evidence/cross-repository/IIPS_V3_G3_D0_DISPOSITION_2026-10-18.md` (new)
- `evidence/cross-repository/IIPS_V3_G3_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-18.md`
- `evidence/cross-repository/IIPS_V3_CV20_OPTION_A_OWNERSHIP_SOURCE_DESIGNATION_RECORD_2026-10-18.md`
- `evidence/cross-repository/IIPS_V3_IPD_IRR_PORTFOLIO_AND_CONSUMER_READINESS_RECONCILIATION_2026-10-18.md`
- `evidence/cross-repository/IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md`

PR #20 diff: 5 files, 79 insertions, 5 deletions. PR and post-merge remote state were independently read back; `git ls-remote origin refs/heads/main` returned the merge SHA above. The published request, CV-20 record and readiness/continuation records contain additive references to the authoritative G3-D0 record.

## Scope and result

Documentation only; no source, test, dependency, route, persistence, runtime, or configuration file changed. No Git ref other than the documentation PR branch and its merge to `main` moved as part of the authorized publication; the Gate B designated ref remains at its previously verified SHA. The user-approved decision resolves only the implementation-basis choice. **No new implementation scope or authority was granted.** IPD portfolio persistence remains `SESSION_ONLY` / `durable: false`; IRR portfolio routes remain HTTP 503; no off-main promotion, durable write, route admission, qualification, fence lift, Windows Gate A′/Gate C execution, or production release is claimed.

*End of publication receipt.*
