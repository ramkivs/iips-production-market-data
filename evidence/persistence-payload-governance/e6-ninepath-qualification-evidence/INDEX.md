# GP-6 E6 PATH A — NINE-PATH RUNTIME QUALIFICATION EVIDENCE
# Result: QUALIFICATION PASS — 542/542, 0 failures.

IMPLEMENTATION_COMMIT = 7e9e590daa3a125fe41d27ca35b1d1d4265d61ca
PROVENANCE_TS_BLOB    = 1bd9fe01f354e60f9acd53513fa23f6f6fc88306

## RESULT PROGRESSION
BASELINE            542 / 542 pass /  0 fail
E6 UNREMEDIATED     542 / 467 pass / 75 fail
AFTER 7 PATHS       542 / 536 pass /  6 fail
AFTER 9 PATHS       tests 542
AFTER 9 PATHS       pass 542
AFTER 9 PATHS       fail 0

## ATTRIBUTION (current run)
AUTHORIZED_E6_REJECTION = 0
NEW_MASKED_SUCCESSOR    = 0   (NONE observed)
ROLLUP_CASCADE          = 0
DIGEST_CHANGE           = 0
UNRELATED_FAILURE       = 0

## NINE_AUTHORIZED_PATHS_CLEAR = YES  (see 11-per-path-proof.txt)
All 75 originally-failing tests and all 6 previously-remaining tests now PASS.

## FILE MANIFEST (sha256)
5cda03321b166320854b44953997d216a9fd23596b3e500e11a2b8e66fe8103d         186 B  00-environment.txt
8ab169c7567a94141b438b445b7bd63d7b04423511a7badb4c191c5919f8b21e         334 B  01-fence.txt
47621cf4a57c0d8fd770d00284bf8b7f322680c9e149042bba0aeee2a4013ee4         247 B  02-npm-ci-RAW.txt
3e66bff3780033376c8cadbe8184d6d7444a8f6f94487602c34731a784915800          67 B  03-build-tsc-RAW.txt
84a689eddb6e0007d1709d8a706f6e007c6e3270db22dc7d5e6b8dc4187b8f20     4363959 B  10-qualification-test-RAW.tap
a9de654cae4844881001346c2a62cc0fbc8a8bb0f05a52121c6fbdb6e1b44ff2         596 B  11-per-path-proof.txt
