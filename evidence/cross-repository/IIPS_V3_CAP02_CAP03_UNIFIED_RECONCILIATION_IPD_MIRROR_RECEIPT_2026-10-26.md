# CAP-02 + CAP-03 unified reconciliation — IPD-locus mirror receipt (`2026-10-26`, final pass)

> **Read-only mirror / preparation receipt.** Not a PA act, S2/P-1/S3/QE execution, gate-result
> acceptance, freeze, pin change or qualification claim. No IPD `main` object, source, test, script,
> manifest, lockfile, pin, workflow or fence was changed; this receipt and its evidence are published on
> the session branch `arena/878f394e-iips-production-market-data`.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-CAP03-UNIFIED-RECONCILIATION-IPD-MIRROR-RECEIPT-2026-10-26-01` |
| Governing record | IRR `docs/integration/IIPS_v3.0_CAP02_CAP03_UNIFIED_AUTHORITATIVE_STATUS_RECONCILIATION_2026-10-26.md`, tracker **§16.139** (`CV-CORR-119`) |
| IRR evidence | `evidence/integration/cap02-cap03-unified-reconciliation-2026-10-26/` |
| IPD evidence | `evidence/cross-repository/cap02_cap03_unified_reconciliation_2026-10-26/` |
| Verified baselines | IRR `main@cc3c000a11fd586c540a84a8d139c4b2c39cd121` (tree `00f55e4ecbf9a7b09acb97051c59e3bb2a1de31c`, PR #307); IPD `main@f97b17e7d04a0c5c4573c0dbe51da2c4c595d829` (tree `6da6f82970fd3fb836500776708bbb6ea206baa1`, PR #97) |
| Verification | **44 PASS / 0 FAIL** (`02-verification-results.json`, `03-verification-summary.txt`) |

## 0. Publication boundary (disclosed)

The authoritative tracker is in IRR. From this session both `git push` to IRR and REST
`git/blobs` / `git/refs` / issue-comment writes returned **HTTP 403 `Resource not accessible by
integration`** — the GitHub integration is scoped to the IPD repository. Therefore **§16.139 was not
published to IRR from this session**; no stale or invented tracker commit is claimed. Instead this
session publishes, on the IPD session branch:

- `IIPS_V3_CAP02_CAP03_UNIFIED_AUTHORITATIVE_STATUS_RECONCILIATION_2026-10-26.md` — the complete
  reconciliation record (durable IPD-locus copy, with the §16.139 registration row marked proposed);
- `cap02_cap03_unified_reconciliation_2026-10-26/TRACKER_PATCH_PROPOSED.diff` — the exact additive
  tracker patch (new §16.139 section, header current-state row and `CHG-2026-10-26-19` change-log row)
  against IRR `main@cc3c000a11fd586c540a84a8d139c4b2c39cd121`, ready for an IRR-capable session;
- the replayable verification bundle (44 checks).

An IRR-capable session can apply the patch, open a governed PR, verify exact-head + post-merge CI and
read back the blobs, then populate `§16.139.7` (`CHG-2026-10-26-20`, `V906`). No re-investigation is
needed; the dependency conclusions below are final for the verified baseline.

## 1. Reconciled state

- **CAP-02 — PARTIAL / NOT COMPLETE.** Complete: DB-C1 preview (IRR #114), U0/B-1/B-1R/U1,
  U2-1…U2-12, U7, S1 identity values (effective determination `b7746b5e…`; compiled constants at IPD
  `main` `src/persistence/gateAPrimeValidation.ts:50–52`), Gate A′ authority, Gate 4 host authority,
  H-12 R5 adoption + IPD mirror (`1e71504f…`), QE-8 `RV-1` Option A effective PA act, QE matrix/runbook.
  Outstanding: single P-1 execution, U3/QE `0/11`, U4 acceptance, U5 Gate 5, U6/W-1.
- **CAP-03 — S2 executed; evidence acceptance outstanding.** Complete: DQ-1…7, H-12 R5, DQ-4 criteria
  1–6/9/10 (`8/10`), Linux `924/923/0/1`, Windows corrected candidate `924/920/0/4` + consumer `PASS`
  (IPD PR #96, `001c3c80…`/`399fa44a…`), user-reported 47-entry final-manifest `PASS` with nine required
  S2 files (IRR §16.138, PRs #306/#307), IPD PR #97 `16/16` evidence, **PF-15 DESIGNATED / EFFECTIVE**
  (IRR acts `-01`/`-02`, PRs #302–#305). Outstanding: **raw Windows evidence-byte read-back PENDING**,
  **full S2 evidence acceptance NOT RENDERED**, **P-1 unspent and not yet admissible**, S3 NOT REACHED,
  QE `0/11`, DQ-4 criteria 7/8, Gate 4 AUTHORIZED — NOT STARTED, Gate 5 NOT ADMITTED.

## 2. S2 evidence determination (IPD-side corroboration)

- Provenance: IPD PR #96 body + IRR §§16.132.3/16.134.3/16.135.4/16.138.3; two-file fix merged as
  `1e76f4cf…`, ancestor of IPD `main` (`ahead 13/behind 0`). PR #96 head CI check `121512823128`
  (`924/923/0` on `ubuntu-latest`) is a hosted Linux check, **not** the Windows transcript.
- Integrity: suite SHA-256 `C5DDFFA2…`, consumer SHA-256 `9F7C6407…`; §16.138 adds the reported 47-entry
  manifest `PASS`. **Raw bytes external** (`C:\iips-evidence\cap03-s2\`), absent from both main trees,
  0 IPD Actions artifacts → independent re-hash **NOT COMPLETE**; `windows-session-transcript.txt` was
  locked during hashing and is not one of the 47 entries.
- Acceptance: component validation only; §16.138.4 states **full S2 evidence acceptance NOT RENDERED**
  and the S2 runbook §5.2 requires acceptance into the record before continuing. **The S2 execution
  satisfies its technical prerequisite — no rerun — but the evidence prerequisite (D1 raw-byte read-back
  + D4 acceptance record) does not.** D3 coordinate note (`8eec74ae…`↔`001c3c80…`, no silent re-pin)
  remains; D2 (only 2 of 5 commands) is closed as a user-reported fact by §16.138.3.

## 3. Two integrity corrections

1. **PF-15 exact-literal boundary.** Byte comparison (`05-pf15-literal-integrity.txt`) shows corrected
   act `-02` F1–F6 rows (including F2/F4/F5) are **identical** to act `-01`, which §16.137 declares
   defective for excess literal backslashes. Only Ramki (PA) can confirm the exact code points or render
   a genuinely corrected act; agents must not normalize/unescape/invent paths. Until then F2/F4/F5 are
   **STOP for host use**. PF-15 designation itself is effective and is not reopened.
2. **No new P-1 identity-value PA decision.** The effective S1 determination (IPD PR #80) names
   `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`; the constants are present
   at IPD `main`. §16.136/§16.137's "identity values unresolved" statements are historical mis-readings.

## 4. Single next action and authority boundary

**Exact next action (no rerun):** the operator supplies read-only copies of the 47 manifest-listed
Windows S2 files (at minimum the nine §16.138.3 files, the final manifest and the manifest-verification
output) from `C:\iips-evidence\cap03-s2\` through an approved artifact channel. Arena recomputes SHA-256
per file against the manifest, publishes a dated verification addendum, and only then renders the
distinct S2 evidence-acceptance record. Subsequent strict order: with accepted S2 evidence and
PA-confirmed F4, one bounded **P-1** (`V-A2-1`…`V-A2-8`) on `desktop-no0nhtp` → S3 → QE-1…QE-11
(QE-8 disposable copy) → evidence integrity → separate Gate C/U4 acceptance → DQ-4 freeze establishment
→ Gate 5 admission. Arena's environment is Linux, `desktop-no0nhtp` unresolved and PowerShell absent;
no host operation is claimed.

## 5. Scope and non-grants

No P-1 attempt consumed; no store, binding, membership, copy, endpoint or evidence root created; no
Windows command run; no enabling flag set; no pin/fence/manifest/route/workflow change; no IPD `main`
write; no PA decision rendered; no gate moved; no QE credited; no acceptance, admission, `durable:true`
or production claim. All IPD changes made by this pass are documentation/evidence on the named session
branch only.

*End of `IIPS-V3-CAP02-CAP03-UNIFIED-RECONCILIATION-IPD-MIRROR-RECEIPT-2026-10-26-01`.*
