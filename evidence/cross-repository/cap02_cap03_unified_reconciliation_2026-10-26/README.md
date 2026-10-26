# CAP-02 + CAP-03 unified reconciliation evidence (IPD session branch, `2026-10-26`)

Replayable, read-only verification bundle supporting IRR tracker §16.139 / `CV-CORR-119` and
[`IIPS_V3_CAP02_CAP03_UNIFIED_RECONCILIATION_IPD_MIRROR_RECEIPT_2026-10-26.md`](../IIPS_V3_CAP02_CAP03_UNIFIED_RECONCILIATION_IPD_MIRROR_RECEIPT_2026-10-26.md).

| File | Purpose |
|---|---|
| `01-executing-environment-probe.txt` | Linux `e2b.local`; `desktop-no0nhtp` unresolved; PowerShell absent; no endpoint/store/write-enable variables. Proves no host action was possible. |
| `verify_unified_status.py` | 44-check independent GitHub REST/Git/Actions/Blobs API verification. Read-only. |
| `02-verification-results.json` | Machine-readable results, baselines, tracker blob identity and SHA-256, per-check observed values. |
| `03-verification-summary.txt` | Human-readable transcript (`44 PASS / 0 FAIL`). |
| `04-legacy-validator-output.txt` | Supplemental legacy validator re-runs (91 + 62 assertions) and an honest note on the two path-bound H-12 validators. |
| `05-pf15-literal-integrity.txt` | PF-15 act `-01` vs `-02` byte comparison: F1–F6 rows identical; evidence for the exact-literal PA boundary. |
| `TRACKER_PATCH_PROPOSED.diff` | Exact additive IRR tracker patch (proposed §16.139, header row, `CHG-2026-10-26-19` row) against IRR `main@cc3c000…`; IRR writes were 403 from this session. |
| `SHA256SUMS.txt` | Digests of all files in this directory. |

Replay: `python3 verify_unified_status.py` from this directory (requires the existing `gh` connection).
The script re-reads live remote state, so its recorded baseline is the `verified_utc` value in the JSON,
not a self-assertion of the publication commit.

No source, test, script, manifest, lockfile, pin, workflow, fence, route, store, binding or gate was
changed. No PA decision is rendered here; PF-15 remains reserved to Ramki (Program Authority).
