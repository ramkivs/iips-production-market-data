#!/usr/bin/env python3
"""Reproducible read-only verifier for the CAP-03 S2 47-file independent hash verification.

Record: IIPS-V3-CAP03-S2-47FILE-INDEPENDENT-HASH-VERIFICATION-IPD-RECORD-2026-10-28-01

Re-derives, from the IRR repository over the GitHub REST API, the SHA-256 of every committed
byte of the transferred CAP-03 S2 Windows evidence, and compares each digest with the entry
recorded in 01-per-file-results.json. No file is written, normalised, reserialised or altered.
No S2 step, test run, build or manifest generation is performed.

Exit 0 = the recorded per-file results reproduce exactly from the remote bytes.
Exit 1 = any divergence, or any retrieval failure.
"""
import base64
import hashlib
import json
import os
import subprocess
import sys

REPO = "ramkivs/iips-review-recovered"
REF = "54d5a56fc8ffda72fa98020aaeb7b8a71bd6c5e0"
DIR = "evidence/integration/cap03-s2-evidence-manifest-verification-2026-10-26/"
HERE = os.path.dirname(os.path.abspath(__file__))
CR = bytes([13])
LF = bytes([10])
CRLF = CR + LF


def api(path, *flags):
    r = subprocess.run(["gh", "api", path, *flags], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit("API failure: %s\n%s" % (path, r.stderr[:400]))
    return r.stdout


def sha(b):
    return hashlib.sha256(b).hexdigest().upper()


def main():
    recorded = json.load(open(os.path.join(HERE, "01-per-file-results.json")))
    tree = json.loads(api("repos/%s/git/trees/%s?recursive=1" % (REPO, REF)))
    blobs = {}
    for e in tree["tree"]:
        if e["path"].startswith(DIR) and e["type"] == "blob":
            blobs[e["path"][len(DIR):]] = e["sha"]

    failures = []
    checked = 0
    for entry in recorded["entries"]:
        name = entry["path"]
        if name not in blobs:
            failures.append("%s: absent from the published tree" % name)
            continue
        if blobs[name] != entry["git_blob"]:
            failures.append("%s: blob %s != recorded %s" % (name, blobs[name], entry["git_blob"]))
        raw = base64.b64decode(api("repos/%s/git/blobs/%s" % (REPO, blobs[name]), "--jq", ".content").strip())
        if len(raw) != entry["bytes_committed"]:
            failures.append("%s: %d bytes != recorded %d" % (name, len(raw), entry["bytes_committed"]))
        got = sha(raw)
        if got != entry["independent_sha256_as_committed"]:
            failures.append("%s: as-committed %s != recorded %s" % (name, got, entry["independent_sha256_as_committed"]))
        if sha(raw.replace(CRLF, LF).replace(LF, CRLF)) != entry["crlf_restored_sha256"]:
            failures.append("%s: crlf-restored digest does not reproduce" % name)
        expected_state = "MATCH" if got == entry["expected_sha256"] else "MISMATCH"
        if expected_state != entry["state"]:
            failures.append("%s: state %s != recorded %s" % (name, expected_state, entry["state"]))
        checked += 1

    s = recorded["summary"]
    win = [e for e in recorded["entries"] if e["classification"] == "windows-evidence"]
    if len(win) != s["windows_evidence_entries"]:
        failures.append("windows-evidence count %d != summary %d" % (len(win), s["windows_evidence_entries"]))
    if len(recorded["entries"]) != s["total_manifest_entries"]:
        failures.append("total entry count disagrees with summary")

    print("entries re-hashed from remote bytes : %d" % checked)
    print("windows-evidence entries            : %d" % len(win))
    print("  MATCH (as committed)              : %d" % sum(1 for e in win if e["state"] == "MATCH"))
    print("  MISMATCH (as committed)           : %d" % sum(1 for e in win if e["state"] == "MISMATCH"))
    print("    of which line-termination only  : %d" % sum(1 for e in win if e["state"] == "MISMATCH" and e["crlf_restored_matches_expected"]))
    print("    of which not reproduced         : %d" % sum(1 for e in win if e["state"] == "MISMATCH" and not e["crlf_restored_matches_expected"]))
    if failures:
        print("\nDIVERGENCES (%d):" % len(failures))
        for f in failures:
            print("  - " + f)
        return 1
    print("\nRESULT: recorded per-file results reproduce exactly from the remote committed bytes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
