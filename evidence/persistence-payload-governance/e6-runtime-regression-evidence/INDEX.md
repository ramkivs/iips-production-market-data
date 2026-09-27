# GP-6 E6 — RUNTIME REGRESSION RAW EVIDENCE ARTIFACT
# Created under explicit RAMKI DURABLE_EVIDENCE_CAPTURE_AUTHORITY = GRANTED
# Purpose: preserve raw execution evidence so the 75-failure root-cause census
#          can be performed WITHOUT relying on /tmp or prior conversation.
# NO REMEDIATION. NO CONTRACT CHANGE. NO CALLER OR TEST CHANGE.

E6_IMPLEMENTATION_COMMIT = c4149198f58f0ecd21f84b777103090656537fa8
PROVENANCE_TS_BLOB       = 1bd9fe01f354e60f9acd53513fa23f6f6fc88306
BASELINE_PROVENANCE_BLOB = 459c77a430f00e5b20fa1f80cc1a3b780165444a (from main 4d3e1cdc)

## HEADLINE RESULT (re-derived in this gate, not carried over)
BASELINE tests 542
BASELINE pass 542
BASELINE fail 0
E6       tests 542
E6       pass 467
E6       fail 75

## FILE MANIFEST (sha256)
946feca5d3719dcc3d882c05c7db5ee429191a995107411764f21257840e7cd8         321 B  00-environment.txt
ad44914221ad9254726ef7f9a85cc298b6ff00c199bb479a6734425c5ae58afb         466 B  01-repository-fence.txt
6ae15a27a74012899658c2bfd38df7833e0503c3fcc6445baf6a869eedd7c284         247 B  02-npm-ci-RAW.txt
fe6905bd3db68bc28629e6875c042f146fe3ae48360b0392e6943d8afe54e618         318 B  10-baseline-setup.txt
f6b4f9faf52e403f61f420d6edb04926395138324b2be62d4f5601c6fb72b9d8          20 B  11-baseline-tsc-RAW.txt
3d13f4b98f7756e9ea4e7a2846e55a9610004d894afb8c87258ed238aeaf4449         314 B  12-baseline-summary.txt
d0686995a8588d37200732e61043ab173168b646a39c3c6836aba1f19f8eb98d     4082922 B  13-baseline-test-RAW.tap
4a56ffe73405d41420070a9cecac3d6457d4cc5b61337d0fc723986255f16640          70 B  20-e6-build-RAW.txt
5c567ccf88849483762e5aad9bd365aeb9784d550e0dc6a46e4225af9c12607b         297 B  21-e6-summary.txt
81cd1c4de8dfce4ad75ba7ff2e038270e9420aa8bfc6614ccbcda0d29c8f3032     4445546 B  22-e6-test-RAW.tap
3cff337196836da48a25aa0d16fb24d60aa22db5f207facba993d9fee5d7015a        9613 B  23-e6-failure-identifiers.txt
70c84a41c2ea43e18b6b4e0bbcf7aebae98f1421fbd37d19a7d6f025a95504ad        2817 B  24-e6-failure-messages.txt
c77f2c2ce5c3c0f326cbb1aa84b33854fe5c3073e62ab212376a26adb8191254        2132 B  25-e6-jcs-rejection-paths.txt
