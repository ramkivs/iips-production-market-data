# W05 roadmap source and IRR lifecycle reconciliation — evidence folder (2026-11-18)

Record: [`IIPS-W05-ROADMAP-SOURCE-AND-IRR-LIFECYCLE-RECONCILIATION-2026-11-18.md`](../../../docs/integration/IIPS-W05-ROADMAP-SOURCE-AND-IRR-LIFECYCLE-RECONCILIATION-2026-11-18.md).

Nothing in this folder was produced on the Windows host. Nothing here holds a holding identifier, a quantity, a price, a value, a filing or a financial figure.

## 1. Files

| File | What it is |
|---|---|
| `extract_roadmap_lines.py` | Read-only script. It checks that the roadmap file is the recorded Git blob and SHA-256, then prints the lines that govern W05, verbatim, with their line numbers. |
| `roadmap-w05-extract-2026-11-18.md` | Output of that script for the roadmap at IPD `main` `2685562522f1a2fd1d745a7857f771bf21453315`. This is the file to hand to the IRR session. |
| `irr-handoff-as-received-2026-11-17.md` | The IRR session's handoff, as it arrived through the Principal. Not compared with the IRR copy. |
| `access-readback-2026-11-18.json` | What this session could and could not read: IPD in full; IRR not at all (HTTP 403), with the methods tried. |

## 2. Grade of this evidence

- The roadmap extract is **verified here** from tracked content of this repository.
- The handoff is a **report from another session**. Its statements about IRR are not verified by IPD.

## 3. To reproduce the extract

```
git show 2685562522f1a2fd1d745a7857f771bf21453315:docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md > /tmp/roadmap.md
python3 evidence/integration/w05-roadmap-reconciliation-2026-11-18/extract_roadmap_lines.py /tmp/roadmap.md
```

Expected: exit code 0 and a document equal to `roadmap-w05-extract-2026-11-18.md`. A file that is not the recorded blob is refused with exit code 3. If the roadmap has changed since, the script refuses the new file on purpose: the extract is tied to one blob.

The script needs Python 3 and nothing else. It reads one file and writes to standard output only.
