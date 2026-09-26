# B1 Three-Engine G4 Role-Separated Verification Report

## Verification identity

- Gate: G4 — Role-Separated Evidence Verification
- Scope: IES-016 / IES-017 / IES-020
- B1 evidence baseline: `b3cfbe194bba426077a97ab1293ec881b38801ec`
- G3 deposited evidence commit: `0c1027ce2e992c8076b95b16a162874668eb8ed0`
- G4 verification checkout: `G:\IIPS\B1-TIER3-CERT-20260925-G4-VERIFY-02`
- G4 verification checkout commit: `a089f65dd18f890f9060216200c3d8a42ab918fe`
- Verification mode: evidence-only, no execution
- Role disclosure: ROLE-SEPARATED, NOT ORGANIZATIONALLY INDEPENDENT.

## 1. G3 evidence integrity

The G4 checkout was verified at commit `a089f65dd18f890f9060216200c3d8a42ab918fe`.

The checkout was clean.

The G3 operator certification record was present.

The ten required raw G3 artifacts were present:

- `environment.txt`
- `frontend-server.log`
- `git-head-after.txt`
- `git-head-before.txt`
- `git-status-before.txt`
- `research-server.log`
- `tier3-command.txt`
- `tier3-hashes-after.txt`
- `tier3-hashes-before.txt`
- `tier3-transcript.txt`

## 2. Windows Tier-3 evidence

The deposited operator record documents:

- Tests: 87
- Pass: 87
- Fail: 0
- Exit code: 0
- Twelve prescribed Tier-3 test-file hashes unchanged after execution.

G4 verifies these deposited statements as evidence.

G4 does not claim to have executed Tier-3 itself.

## 3. API evidence

The deposited parsed API evidence was verified as follows:

- engine count: 13;
- IES-016 present exactly once;
- IES-017 present exactly once;
- IES-020 present exactly once;
- each target engine has certification lineage:

  `historical A1 lineage / B1 adoption pending certification`

- `provenance.b1Certification = NONE CLAIMED`;
- `provenance.freshness = FROZEN`.

## 4. Execute-route evidence

For each of IES-016, IES-017 and IES-020:

- POST `/api/engines/{IES}/execute` = HTTP 405 Method Not Allowed;
- POST response body identifies `method-not-allowed`;
- GET `/api/engines/{IES}/execute` = HTTP 404 Not Found;
- GET response body identifies `not found`;
- certification disclosure remains `NONE CLAIMED`.

Therefore G4 records that no Execute route was exposed by the deposited evidence.

## 5. Decision 4 — L-5 fresh classification

G4 records the following classifications for the carried-forward D7 qualifications.

| Item | Engines | G4 classification |
|---|---|---|
| IES-017 stale-pack discrepancy | IES-017 | NO EFFECT ON B1 EXECUTION + PERMANENT DISCLOSURE; discrepancy remains registered OPEN |
| DF-1 | IES-016 / IES-017 / IES-020 | NON-BLOCKING |
| 33/33 manifest qualification | IES-016 / IES-017 / IES-020 | NON-BLOCKING |
| Q5 ontology compatibility | IES-016 / IES-017 / IES-020 | OUTSIDE CERTIFICATION CRITERION |
| IES-020 §28 Q1, Q2, Q3, Q5 | IES-020 | OUTSIDE CERTIFICATION CRITERION |
| IES-020 §28 Q4 | IES-020 | NON-BLOCKING |
| D7 independence OPEN / NEGATIVE | IES-016 / IES-017 / IES-020 | PERMANENT DISCLOSURE |
| D7 adjudicator non-independence | IES-016 / IES-017 / IES-020 | PERMANENT DISCLOSURE |
| D7 adjudication report `2296764a3023bda223231dd02ef144661b0cd6dd7701c60132609e78f9df888a` unrecoverable | IES-016 / IES-017 / IES-020 | PERMANENT DISCLOSURE |

No item is classified BLOCKING.

D7 remains CLOSED. This report does not reopen, amend, or re-adjudicate D7.

## 6. Permanent qualifications carried forward

The following remain disclosed:

1. D7 independence OPEN / NEGATIVE.
2. D7 adjudicator non-independence.
3. D7 adjudication report unrecoverable.
4. Q5 outside the B1 certification criterion.
5. IES-020 §28 Q1–Q3 and Q5 outside the B1 certification criterion.
6. IES-020 §28 Q4 non-blocking.
7. Frozen IES-017 `PROPOSED, NOT AUTHORITY` historical self-label.
8. IES-017 stale-pack discrepancy remains OPEN.
9. Historical `phase13-next` Tier-3 execution remains historical and is not B1 evidence.
10. Linux 87/87 reproduction remains reproduction evidence and is not substituted for the Windows Tier-3 run.
11. 30/36 manifest-pin CRLF rendering convention.
12. Global API certification disclosure remains `NONE CLAIMED` until separately authorized G6.
13. Role separation is role separation only; it is NOT organizational independence.

## 7. G4 determination

G4 evidence verification = PASS.

The verification establishes that the G3 evidence package contains the required evidence and that Decision 4 has no BLOCKING classification.

This report does not issue B1 certification.

Issuance remains reserved for the separately authorized G5 RAMKI maintainer issuance act.

G6 remains separately required for any served per-engine certification disclosure transition.

## 8. Prohibitions preserved

G4 does not authorize:

- product-code changes;
- registry or API changes;
- Execute enablement;
- production or release;
- promotion or tagging;
- D115, NSE, Dhan or provider activation;
- reopening D7;
- transfer of historical A1 certification;
- representation of Linux evidence as Windows evidence;
- organizational-independence claims;
- amendment or force-push.

## 9. Verification status

G4 ROLE-SEPARATED VERIFICATION = PASS

ROLE-SEPARATED, NOT ORGANIZATIONALLY INDEPENDENT.

G5 RAMKI issuance remains a separate gate.
