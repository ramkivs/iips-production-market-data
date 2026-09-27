# GP-6 E6 PATH A — RUNTIME QUALIFICATION EVIDENCE
# Result: QUALIFICATION FAIL — 6 failures remain. NO remediation performed.

IMPLEMENTATION_COMMIT = 6a1fda1be1f0757ac6bba3c69d736d6e626a95bd
PROVENANCE_TS_BLOB    = 1bd9fe01f354e60f9acd53513fa23f6f6fc88306

## RESULT PROGRESSION
BASELINE     542 tests / 542 pass / 0 fail
PREVIOUS_E6  542 tests / 467 pass / 75 fail
PATH_A       tests 542
PATH_A       pass 536
PATH_A       fail 6

## REMAINING FAILURE PATHS (all E6_DIRECT_UNDEFINED_REJECTION)
$.records.<date>.priorSha256Hex   x5   src/d114/historical_feasibility_runner.ts
$.quarter                         x1   src/fundamentals/statement_normalizer.ts

## STATUS: OUTSIDE AUTHORIZED PATH A SCOPE
Neither path appears in the 7 authorized field paths nor in the original
19-rejection evidence. Both were MASKED by RFC 8785 JCS sorted-key order:
  localPath(idx 6) < priorSha256Hex(idx 7)  in the record object
  cashFlow(idx 1)  < quarter(idx 6)         in the statement object
Fixing the authorized paths let the serializer advance to the next
present-undefined property. Remediating them requires a NEW authority grant.

## FILE MANIFEST (sha256)
6bd52000ea05c6990e577757421b0cef6250617acace38c02f106863230d0ab3         186 B  00-environment.txt
bf7f56ff489526735bbc2172da452de7a91e7bf59dbc35afaf06790f179d9376         296 B  01-fence.txt
6ae15a27a74012899658c2bfd38df7833e0503c3fcc6445baf6a869eedd7c284         247 B  02-npm-ci-RAW.txt
3e66bff3780033376c8cadbe8184d6d7444a8f6f94487602c34731a784915800          67 B  03-build-tsc-RAW.txt
3277762603ad8fa1462d186623ae1b8d09f7a63c4a14f29db45d6fedd44300dd     4371263 B  10-qualification-test-RAW.tap
d837a8117961ae486a8f07682f4d4e60746c3db8be84a6874c98e89be5c088b1         769 B  11-remaining-failures.txt
d54d177952093a953c21384fc97d9f4d08b6c7a6078ae042cab579b3c6cf9549         736 B  12-remaining-jcs-rejections.txt
