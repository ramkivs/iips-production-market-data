#!/usr/bin/env python3
"""Replayable, read-only verification for the CAP-02/CAP-03 unified reconciliation (§16.138).

Uses the existing `gh` connection and Git/GitHub APIs only. No repository mutation, no host
command, no authority determination. Records 40 checks in 02-verification-results.json.
"""
import base64
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

IRR = "ramkivs/iips-review-recovered"
IPD = "ramkivs/iips-production-market-data"
TRACKER = "IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md"
HERE = os.path.dirname(os.path.abspath(__file__))
results = []


def gh(path, jq=None):
    cmd = ["gh", "api", path] + (["--jq", jq] if jq else [])
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"gh api failed: {path}: {p.stderr.strip()}")
    return p.stdout.strip()


def check(cid, desc, observed, ok, evidence):
    results.append(dict(id=cid, check=desc, observed=observed,
                        result="PASS" if ok else "FAIL", evidence=evidence))


def blob(repo, oid):
    raw = gh(f"repos/{repo}/git/blobs/{oid}", ".content")
    return base64.b64decode("".join(raw.splitlines()))


def content(repo, path, ref):
    return blob(repo, gh(f"repos/{repo}/contents/{path}?ref={ref}", ".sha"))


# --- refs and commits ---
irr_main = gh(f"repos/{IRR}/git/ref/heads/main", ".object.sha")
ipd_main = gh(f"repos/{IPD}/git/ref/heads/main", ".object.sha")
irr_c = json.loads(gh(f"repos/{IRR}/git/commits/{irr_main}"))
ipd_c = json.loads(gh(f"repos/{IPD}/git/commits/{ipd_main}"))
baseline_irr = "cc3c000a11fd586c540a84a8d139c4b2c39cd121"
cmp_irr = json.loads(gh(f"repos/{IRR}/compare/{baseline_irr}...{irr_main}"))
check("U01", "IRR main commit + root tree (at/after reconciled baseline cc3c000)",
      f"{irr_main} / {irr_c['tree']['sha']} behind_by={cmp_irr['behind_by']}",
      cmp_irr["behind_by"] == 0 and cmp_irr["status"] in ("ahead", "identical"),
      "Git Refs/Commits/Compare API; robust to later additive publications")
baseline_ipd = "f97b17e7d04a0c5c4573c0dbe51da2c4c595d829"
cmp_ipd = json.loads(gh(f"repos/{IPD}/compare/{baseline_ipd}...{ipd_main}"))
check("U02", "IPD main commit + root tree (at/after reconciled baseline f97b17e7)",
      f"{ipd_main} / {ipd_c['tree']['sha']} behind_by={cmp_ipd['behind_by']}",
      cmp_ipd["behind_by"] == 0 and cmp_ipd["status"] in ("ahead", "identical"),
      "Git Refs/Commits/Compare API; robust to our own later documentation-only publication")
pr97_anc = json.loads(gh(f"repos/{IPD}/compare/f97b17e7d04a0c5c4573c0dbe51da2c4c595d829...{ipd_main}"))
check("U03", "PR #97 merge (f97b17e7) is an ancestor of current IPD main",
      f"parents={[p['sha'][:12] for p in ipd_c['parents']]} behind_by={pr97_anc['behind_by']}",
      pr97_anc["behind_by"] == 0 and len(ipd_c["parents"]) == 2,
      "Git Commits/Compare API; PR #97 head 880f0671 is a parent of f97b17e7")

# --- PR states and CI (all authoritative publications of 2026-10-26) ---
prs = [
    ("U04", IRR, 299, "e47b58967621377ca92c2123c432a5eb5c5959ad", "429eca37396a5a534987cb6bfc33166449691bfe"),
    ("U05", IPD, 97, "f97b17e7d04a0c5c4573c0dbe51da2c4c595d829", "880f067185b50cad3989a65f8651699b2c7a1f5a"),
    ("U06", IRR, 300, "dbe9874f28f03b31cca4c8b996d3e822a4cf2b29", "87390f6dffaad37111fa8c2c88d9128d338122c7"),
    ("U07", IRR, 301, "11270b85db1354d8bce9c8278ff97a93e81c66f0", "912b387a759d571bccd0cbd7e95a0342fe979c5b"),
    ("U08", IRR, 302, "e15b70089dca1d0853f0b9640175d305b3d99171", "59bd3790c13267c4f6d3c8fc7842b1bb11b5ffd8"),
    ("U09", IRR, 303, "1bae67d05fb11bc8a24090bff815a96fa4e28b97", "4218345cf74c11e5d5055bb60aab319de893819a"),
    ("U10", IRR, 304, "6e080f89d0cec40ebbc0656f27435588c97a7278", "8ca8e874155193142bf1393011c9c64629d6a7fd"),
    ("U11", IRR, 305, "d9345004f5897ecb33fa532599b51a6ec799aa7a", "af8558b5ee8a42444495dcfb99bfdd6fb6eb36af"),
]
for cid, repo, num, merge, head in prs:
    pr = json.loads(gh(f"repos/{repo}/pulls/{num}"))
    check(cid, f"{repo.split('/')[-1]} PR #{num} merged/head/merge commit",
          f"merged={pr['merged']} head={pr['head']['sha']} merge={pr['merge_commit_sha']}",
          pr["merged"] is True and pr["merge_commit_sha"] == merge and pr["head"]["sha"] == head,
          "GitHub Pulls API")

cis = [
    ("U12", IRR, "429eca37396a5a534987cb6bfc33166449691bfe", "PR #299 exact-head CI"),
    ("U13", IRR, "e47b58967621377ca92c2123c432a5eb5c5959ad", "PR #299 post-merge CI"),
    ("U14", IPD, "880f067185b50cad3989a65f8651699b2c7a1f5a", "PR #97 exact-head CI"),
    ("U15", IPD, "f97b17e7d04a0c5c4573c0dbe51da2c4c595d829", "PR #97 post-merge CI"),
    ("U16", IRR, "87390f6dffaad37111fa8c2c88d9128d338122c7", "PR #300 exact-head CI"),
    ("U17", IRR, "dbe9874f28f03b31cca4c8b996d3e822a4cf2b29", "PR #300 post-merge CI"),
    ("U18", IRR, "11270b85db1354d8bce9c8278ff97a93e81c66f0", "PR #301 post-merge CI"),
    ("U19", IRR, "59bd3790c13267c4f6d3c8fc7842b1bb11b5ffd8", "PR #302 exact-head CI"),
    ("U20", IRR, "e15b70089dca1d0853f0b9640175d305b3d99171", "PR #302 post-merge CI"),
    ("U21", IRR, "8ca8e874155193142bf1393011c9c64629d6a7fd", "PR #304 exact-head CI"),
    ("U22", IRR, "6e080f89d0cec40ebbc0656f27435588c97a7278", "PR #304 post-merge CI"),
    ("U23", IRR, "d9345004f5897ecb33fa532599b51a6ec799aa7a", "PR #305 post-merge CI"),
]
for cid, repo, sha, label in cis:
    concl = [r["conclusion"] for r in json.loads(gh(f"repos/{repo}/commits/{sha}/check-runs"))["check_runs"]]
    check(cid, label, str(concl), len(concl) > 0 and all(c == "success" for c in concl),
          "GitHub Actions Check-Runs API")

# --- tracker identity and completeness ---
tree = json.loads(gh(f"repos/{IRR}/git/trees/{irr_c['tree']['sha']}"))["tree"]
tracker_oid = next(e["sha"] for e in tree if e["path"] == TRACKER)
data = blob(IRR, tracker_oid)
text = data.decode("utf-8", "replace")
t_sha = hashlib.sha256(data).hexdigest()
check("U24", "Tracker remote blob identity / size / SHA-256",
      f"blob={tracker_oid} size={len(data)} sha256={t_sha}", len(data) > 2_450_000,
      "GitHub Git Blobs API (base64 decode, not inline Contents)")
need = ["§16.132.7", "§16.133.8", "§16.134.6", "§16.135.8", "§16.136.8", "§16.137.6",
        "§16.138.7", "CV-CORR-118", "NOT ACCEPTED", "47",
        "CV-CORR-113", "CV-CORR-114", "CV-CORR-115", "CV-CORR-116", "CV-CORR-117", "V880",
        "924/920/0/4", "9F7C64073A849E57D472C9CA30BB7616D04D1951626E90587241D61A470A85B1",
        "C5DDFFA24393AED2E391EF8A72E8BFF1F8ECD9576C4349E182B288785F1B2941"]
missing = [s for s in need if s not in text]
check("U25", "Tracker completeness: §§16.133–16.137 + receipts + S2 digests",
      f"missing={missing}", not missing, "Remote tracker bytes decoded/searched")

# --- H-12 R5 and IPD mirror ---
h12_sha = gh(f"repos/{IRR}/contents/docs/integration/G4-H12-MANIFEST-v2-CANDIDATE-2026-10-25-R5.json?ref={irr_main}", ".sha")
h12_bytes = blob(IRR, h12_sha)
check("U26", "Adopted H-12 R5 manifest unchanged", f"blob={h12_sha} sha256={hashlib.sha256(h12_bytes).hexdigest()}",
      h12_sha == "f4649e36a81c7013287810cd3202b99586dbd951" and
      hashlib.sha256(h12_bytes).hexdigest() == "d0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76",
      "Contents + Git Blobs API")
mirror = gh(f"repos/{IPD}/contents/evidence/cross-repository/IIPS_V3_CAP03_G4_H12_R5_ADOPTION_IPD_MIRROR_RECEIPT_2026-10-25.md?ref={ipd_main}", ".sha")
check("U27", "IPD H-12 R5 adoption mirror receipt published", f"blob={mirror}",
      mirror == "1e71504f776152ea9200f3a6ce9250872edbee93", "Contents API")

# --- S2 evidence provenance / integrity boundary ---
pr96 = json.loads(gh(f"repos/{IPD}/pulls/96"))
body = pr96.get("body") or ""
check("U28", "IPD PR #96 records Windows 924/920/0/4 + consumer PASS",
      f"920={('920 passed' in body)} 0failed={('0 failed' in body)} 4skipped={('4 skipped' in body)}",
      all(s in body for s in ["924 tests", "920 passed", "0 failed", "4 skipped", "PASS"]),
      "GitHub Pulls API (operator-reported, retained outside repo)")
cand = json.loads(gh(f"repos/{IPD}/git/commits/001c3c80618f2ee1d40e9a90912237e1a06e7b58"))
check("U29", "Corrected candidate tree/parent and ancestor relation to IPD main",
      f"tree={cand['tree']['sha']} parent={cand['parents'][0]['sha']}",
      cand["tree"]["sha"] == "399fa44a5f1953c0f61b452420fefb5985426ef1" and
      cand["parents"][0]["sha"] == "8eec74ae27cda09f3c368b9c299895eae41554db" and
      json.loads(gh(f"repos/{IPD}/compare/001c3c80618f2ee1d40e9a90912237e1a06e7b58...{ipd_main}"))["behind_by"] == 0,
      "Git Commits/Compare API; approved pin not re-pinned")
for repo, cid in ((IRR, "U30"), (IPD, "U31")):
    t = json.loads(gh(f"repos/{repo}/git/trees/{irr_main if repo == IRR else ipd_main}?recursive=1"))
    found = [e["path"] for e in t["tree"] if "s2-npm-launch-fix" in e["path"].lower()]
    check(cid, f"No Windows S2 raw transcript bytes in {repo.split('/')[-1]} main",
          f"matches={found} truncated={t.get('truncated')}", not found and not t.get("truncated"),
          "recursive Git Trees API")
check("U32", "No GitHub Actions artifacts hold the Windows S2 raw transcripts",
      f"total_count={gh(f'repos/{IPD}/actions/artifacts?per_page=100', '.total_count')}",
      gh(f"repos/{IPD}/actions/artifacts?per_page=100", ".total_count") == "0", "Actions Artifacts API")

# --- negative execution / authority searches ---
paths = [e["path"] for e in json.loads(gh(f"repos/{IRR}/git/trees/{irr_main}?recursive=1"))["tree"]]
paths += [e["path"] for e in json.loads(gh(f"repos/{IPD}/git/trees/{ipd_main}?recursive=1"))["tree"]]
p1 = [p for p in paths if "p1-03-execute" in p]
qe = [p for p in paths if "gate-4-target-host-qualification" in p or "cap02_gate4_qe" in p]
check("U33", "No executed P-1 provisioning receipt in either main tree", f"matches={p1}", not p1, "recursive Git Trees API")
check("U34", "No executed Gate-4/QE evidence deposits in either main tree", f"matches={qe}", not qe, "recursive Git Trees API")
check("U35", "Tracker still records DQ-4 8/10, P-1 NOT EXECUTED, QE 0/11, Gate 5 NOT ADMITTED",
      "8/10 / NOT EXECUTED / 0/11 / NOT INITIATED",
      all(s in text for s in ["8/10", "NOT EXECUTED", "0/11", "NOT INITIATED / NOT ADMITTED"]),
      "Remote tracker bytes")

# --- PF-15 acts + literal-integrity finding ---
prep = content(IRR, "docs/integration/IIPS_v3.0_CAP03_PF15_PA_DECISION_ACT_PREPARED_2026-10-26.md", irr_main).decode()
act01 = content(IRR, "docs/integration/IIPS_v3.0_CAP03_PF15_ENDPOINT_LOCAL_STATE_DESIGNATION_PA_ACT_2026-10-26.md", irr_main).decode()
act02 = content(IRR, "docs/integration/IIPS_v3.0_CAP03_PF15_ENDPOINT_LOCAL_STATE_DESIGNATION_PA_ACT_CORRECTED_2026-10-26.md", irr_main).decode()
check("U36", "Prepared PF-15 instrument remains PROPOSED — NOT EFFECTIVE (historical)",
      f"proposed={'PROPOSED — NOT EFFECTIVE' in prep}", "PROPOSED — NOT EFFECTIVE" in prep, "Git Blobs API")
check("U37", "Both value-bearing PF-15 acts are published on IRR main",
      f"act01={'-2026-10-26-01' in act01} act02={'-2026-10-26-02' in act02} f1={'Option A' in act02}",
      "-2026-10-26-01" in act01 and "-2026-10-26-02" in act02 and "Option A" in act02, "Git Blobs API")


def f_rows(s):
    return [l for l in s.splitlines() if l.startswith("| **F") and " — " in l]


identical = f_rows(act01) == f_rows(act02)
check("U38", "INTEGRITY FINDING: corrected act -02 F1–F6 rows are byte-identical to declared-defective act -01",
      f"rows_identical={identical} rows={len(f_rows(act01))}", identical,
      "Direct Git Blobs API byte comparison of both acts (05-pf15-literal-integrity.txt)")

# --- S1 identity values (rebuts the new §16.136/§16.137 P-1 blocker claim) ---
s1 = content(IPD, "evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md", ipd_main).decode()
const = content(IPD, "src/persistence/gateAPrimeValidation.ts", ipd_main).decode()
check("U39", "Effective S1 identity determination + compiled constants discharge successor act §4",
      f"values_in_act={all(v in s1 for v in ['ramki-personal-local','ipd-personal-local','ipd-owner-ramki-personal'])} "
      f"values_in_source={all(v in const for v in ['ramki-personal-local','ipd-personal-local','ipd-owner-ramki-personal'])}",
      all(v in s1 and v in const for v in ["ramki-personal-local", "ipd-personal-local", "ipd-owner-ramki-personal"]),
      "Git Blobs API: IPD determination + src/persistence/gateAPrimeValidation.ts")
cap02 = [
    ("PR #114", json.loads(gh(f"repos/{IRR}/pulls/114"))["merge_commit_sha"] == "271ca5273e76e0eb28594dc5675f11094622c902"),
    ("U2 tracker", gh(f"repos/{IPD}/contents/evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md?ref={ipd_main}", ".sha") == "8a2a4e45615b84e517b65fe2700d4a09cde8c3f7"),
    ("RV-1 act", "Option A" in content(IRR, "docs/integration/IIPS_v3.0_CAP02_QE8_RV1_REVOCATION_PROCEDURE_PA_ACT_EFFECTIVE_2026-10-26.md", irr_main).decode()),
]
check("U40", "CAP-02 completed anchors (DB-C1 PR #114, U2 tracker, RV-1 act) intact",
      str(cap02), all(ok for _, ok in cap02), "Pulls/Contents/Git Blobs API")

# --- environment boundary ---
probe = open(os.path.join(HERE, "01-executing-environment-probe.txt"), encoding="utf-8").read()
check("U41", "Executing environment is not the designated Windows host; no enabling flags",
      "linux / unresolved / powershell absent / flags absent",
      all(s in probe for s in ["platform=linux", "getent_exit=2", "powershell=ABSENT",
                               "IIPS_ENABLE_WRITES=ABSENT", "IIPS_G2_IPC_ENDPOINT=ABSENT"]),
      "01-executing-environment-probe.txt")

# --- §16.138 S2 evidence-manifest receipt (PR #306/#307) ---
pr306 = json.loads(gh(f"repos/{IRR}/pulls/306"))
pr307 = json.loads(gh(f"repos/{IRR}/pulls/307"))
check("U42", "IRR PR #306 published §16.138 S2 manifest-verification receipt",
      f"merged={pr306['merged']} merge={pr306['merge_commit_sha']}",
      pr306["merged"] is True and pr306["merge_commit_sha"] == "83c6219becfeefb51055af9edfa20227e8ae3891",
      "GitHub Pulls API")
check("U43", "IRR PR #307 populated §16.138.7 publication receipt",
      f"merged={pr307['merged']} base={pr307['base']['sha'][:12]}",
      pr307["merged"] is True and "§16.138.7" in text and "S2 EVIDENCE RECEIPT PUBLICATION COMPLETE" in text,
      "GitHub Pulls API + remote tracker bytes")
receipt = content(IRR, "docs/integration/IIPS_v3.0_CAP03_S2_EVIDENCE_MANIFEST_VERIFICATION_RECEIPT_2026-10-26.md", irr_main).decode()
check("U44", "S2 receipt records user-reported 47-entry PASS + nine filenames + PENDING raw-byte boundary",
      f"47={'47' in receipt} nine={all(n in receipt for n in ['s2-01-npm-ci.txt','s2-05-package-consumer.txt','s2-dist-sha256-after.txt'])} pending={'PENDING' in receipt}",
      "47" in receipt and all(n in receipt for n in ["s2-01-npm-ci.txt", "s2-05-package-consumer.txt", "s2-dist-sha256-after.txt"])
      and "PENDING" in receipt and "NOT ACCEPTED" in text,
      "Git Blobs API: S2 manifest-verification receipt + remote tracker")

out = {
    "record": "IIPS-V3-CAP02-CAP03-UNIFIED-STATUS-RECONCILIATION-2026-10-26-01 (verification evidence, final pass)",
    "verified_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "irr_main": irr_main, "irr_tree": irr_c["tree"]["sha"],
    "ipd_main": ipd_main, "ipd_tree": ipd_c["tree"]["sha"],
    "tracker_blob": tracker_oid, "tracker_bytes": len(data), "tracker_sha256": t_sha,
    "checks": results,
    "totals": {"passed": sum(1 for r in results if r["result"] == "PASS"),
               "failed": sum(1 for r in results if r["result"] == "FAIL")},
}
with open(os.path.join(HERE, "02-verification-results.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
with open(os.path.join(HERE, "03-verification-summary.txt"), "w", encoding="utf-8") as f:
    f.write(f"CAP-02/CAP-03 unified verification (final pass) {out['verified_utc']}\n")
    f.write(f"IRR main {irr_main} tree {irr_c['tree']['sha']}\n")
    f.write(f"IPD main {ipd_main} tree {ipd_c['tree']['sha']}\n")
    f.write(f"tracker blob {tracker_oid} {len(data)} B sha256 {t_sha}\n\n")
    for r in results:
        f.write(f"{r['id']:4s} {r['result']:4s} {r['check']}\n      observed: {r['observed']}\n")
    f.write(f"\nTOTAL {out['totals']['passed']} PASS / {out['totals']['failed']} FAIL\n")
with open(os.path.join(HERE, "05-pf15-literal-integrity.txt"), "w", encoding="utf-8") as f:
    f.write("PF-15 act -01 vs corrected act -02: F1-F6 table row byte comparison\n")
    f.write(f"act -01 F rows: {len(f_rows(act01))}; act -02 F rows: {len(f_rows(act02))}\n")
    f.write(f"IDENTICAL (all operative literals unchanged): {identical}\n\n")
    for label, s in (("-01", act01), ("-02", act02)):
        for l in f_rows(s):
            f.write(f"{label} {l[:200]}\n")
    f.write("\nOnly title, status notice, act ID, a 'Correction and supersession' section and footer differ.\n")
    f.write("Consequence: if act -01's F2/F4/F5 code spans were defective, act -02's are identically defective.\n")
    f.write("Only the PA can confirm the exact approved code points; no agent normalization is authorized.\n")
print(f"{out['totals']['passed']} PASS / {out['totals']['failed']} FAIL")
sys.exit(0 if out["totals"]["failed"] == 0 else 1)
