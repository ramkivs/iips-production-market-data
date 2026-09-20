D114 Stage-5 UI Browser Observation — Replay / Banking

Route:
http://localhost:5173/evidence/Banking

Observed:
- Banking Evidence/Replay UI rendered successfully.
- snapshot = snap_Banking
- evidenceRef = ev_Banking
- framework = 1.0
- engine = 1.0.0
- methodology = IES-Banking
- verdict = Watch
- confidence = 47.180%
- calibration = 1.0.0
- generated = 2026-08-09T00:00:00.000Z

Governance observation:
- reproduced = true is displayed but explicitly marked NOT VERIFIED.
- byteIdentical = true is displayed but explicitly marked NOT VERIFIED.
- AD-17 / M-2 remains UNRESOLVED.
- The displayed values are identified as executive-transport fixture constants and are not evidence of runtime ReplayService verification.
- Resolution gate remains P15 / E2E Certification / external Existing-IIPS authority.

Acceptance interpretation:
- UI route/rendering/disclosure: OBSERVED PASS.
- Runtime replay reproduction verification: NOT ESTABLISHED.
- Runtime byte-identity verification: NOT ESTABLISHED.
- AD-17 / M-2: OPEN.
- No production authorization is implied.
