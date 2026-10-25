#!/usr/bin/env python3
"""Independent verification of adopted H-12 R5 manifest against
   (a) the effective PA adoption act's recorded identities,
   (b) IPD git object store at the designated pins,
   (c) IRR remote blobs at the designated consumer pin.
Read-only. Prints a machine-checkable transcript."""
import json, hashlib, subprocess, sys, base64, urllib.request, os

MAN = "/home/user/work/irr/G4-H12-MANIFEST-v2-CANDIDATE-2026-10-25-R5.json"
IPD = "/home/user/iips-production-market-data"
IRR_REMOTE = "https://api.github.com/repos/ramkivs/iips-review-recovered"

checks = 0
fails = []
def ck(cond, label, detail=""):
    global checks
    checks += 1
    if not cond:
        fails.append(f"{label} :: {detail}")
    print(("PASS  " if cond else "FAIL  ") + label + (f"  [{detail}]" if detail else ""))

raw = open(MAN, "rb").read()
ck(len(raw) == 143813, "manifest byte_length == 143,813", str(len(raw)))
ck(hashlib.sha256(raw).hexdigest() == "d0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76",
   "manifest raw SHA-256 == d0be8bef…", hashlib.sha256(raw).hexdigest())
blob = subprocess.run(["git", "hash-object", "-t", "blob", MAN], capture_output=True, text=True).stdout.strip()
ck(blob == "f4649e36a81c7013287810cd3202b99586dbd951", "manifest git blob OID == f4649e36…", blob)
man = json.loads(raw)

# ---- act-recorded structure
ck(man["entry_count"] == 56, "entry_count == 56", str(man["entry_count"]))
ck(man["present_entry_count"] == 56, "present_entry_count == 56", str(man["present_entry_count"]))
ck(man["absent_required_or_future_count"] == 0, "absent_required_or_future_count == 0", str(man["absent_required_or_future_count"]))
ck(man["ipd_entry_count"] == 32 and man["irr_entry_count"] == 24, "ipd 32 / irr 24", f'{man["ipd_entry_count"]}/{man["irr_entry_count"]}')
ent = man["entries"]
ck(len(ent) == 56, "len(entries) == 56", str(len(ent)))
ipd_e = [e for e in ent if e["repository"].endswith("iips-production-market-data")]
irr_e = [e for e in ent if e["repository"].endswith("iips-review-recovered")]
ck(len(ipd_e) == 32, "32 IPD core entries", str(len(ipd_e)))
ck(len(irr_e) == 24, "24 IRR core entries", str(len(irr_e)))
ck(all(e["state"] == "PRESENT" for e in ent), "all 56 core entries marked PRESENT")
paths = [(e["repository"], e["path"]) for e in ent]
ck(len(set(paths)) == 56, "no duplicate core entries", str(len(set(paths))))
ck(ent[23]["path"] == "tests/g4_run_tests_summary_parsing.test.ts", "entries[23] is the parser test", ent[23]["path"])
ck(ent[23]["git_blob_oid_sha1"] == "49e901b6ca957a5cc705b42e96cdeaf0365cfbc9", "entries[23] blob 49e901b6…", ent[23]["git_blob_oid_sha1"])
cond = man["conditional_entries"]
ck(len(cond) == 1 and cond[0]["path"] == "scripts/test-summary-parser.mjs", "1 conditional helper == scripts/test-summary-parser.mjs")
ck(cond[0]["git_blob_oid_sha1"] == "15c849fa739765af501182919748e4610acc4157", "helper blob 15c849fa…", cond[0]["git_blob_oid_sha1"])
ck(len(man["criteria_basis"]) == 9, "9 criteria_basis entries", str(len(man["criteria_basis"])))
ck(len(man["frozen_g3_anchors"]) == 10, "10 preserved Gate 3 anchors", str(len(man["frozen_g3_anchors"])))
ck(len(man["frozen_g3_anchors_revalidated_at_qe_candidate"]) == 10, "10 re-measured Gate 3 anchors", str(len(man["frozen_g3_anchors_revalidated_at_qe_candidate"])))
ck(man["historical_superseded_set"]["entry_count"] == 17 and len(man["historical_superseded_set"]["entries"]) == 17, "17 historical Gate C entries", str(man["historical_superseded_set"]["entry_count"]))
ck(man["pinned_bases"]["IPD_primary_qe_coordinate"]["commit"] == "8eec74ae27cda09f3c368b9c299895eae41554db", "primary pin == 8eec74ae…")
ck(man["pinned_bases"]["IPD_primary_qe_coordinate"]["tree"] == "4eba29029f8d95cfe483e615a7047426b298ce50", "primary tree == 4eba2902…")
ck(man["pinned_bases"]["IPD_broker_alias_compatibility_coordinate"]["commit"] == "70b24f029842a7e9b7f615e4d9df7376fd4ff817", "alias pin == 70b24f02…")
ck(man["pinned_bases"]["IPD_broker_alias_compatibility_coordinate"]["tree"] == "cc0f0117822850f9046e9a51bd05c1d45f80cd57", "alias tree == cc0f0117…")
ck(man["pinned_bases"]["IRR_qe_consumer"]["commit"] == "ba64b2d5927c2f872560710cf1474c25a5cde0d5", "IRR consumer pin == ba64b2d5…")
ck(man["pinned_bases"]["IRR_qe_consumer"]["tree"] == "5e4262f1cd75bf13b76ced5b45058f31434b5dad", "IRR consumer tree == 5e4262f1…")
ck(man["split_baseline"]["alias_raw_source_count"] == 14, "14 alias raw sources", str(man["split_baseline"]["alias_raw_source_count"]))
ck(man["split_baseline"]["alias_raw_sources_identical_at_both_coordinates"] == 10, "10 alias sources identical")
ck(man["split_baseline"]["alias_raw_sources_divergent_at_coordinates"] == 4, "4 alias sources divergent")

# ---- (b) IPD git object store
def ipd_blob(commit, path):
    r = subprocess.run(["git", "-C", IPD, "rev-parse", f"{commit}:{path}"], capture_output=True, text=True)
    if r.returncode != 0:
        return None, None
    oid = r.stdout.strip()
    b = subprocess.run(["git", "-C", IPD, "cat-file", "-p", oid], capture_output=True)
    return oid, b.stdout

_extra = cond + man["criteria_basis"] + man["frozen_g3_anchors"] + man["frozen_g3_anchors_revalidated_at_qe_candidate"]
ipd_all = [e for e in (ipd_e + _extra) if e["repository"].endswith("iips-production-market-data")]
irr_remote = [e for e in (irr_e + _extra) if e["repository"].endswith("iips-review-recovered")]
alias = man["split_baseline"]["alias_raw_sources"]
print(f"\n-- IPD object verification: {len(ipd_all)} recorded entries + {len(alias)} alias raw sources --")
for e in ipd_all:
    oid, data = ipd_blob(e["commit"], e["path"])
    ck(oid == e["git_blob_oid_sha1"], f'blob {e["commit"][:8]}:{e["path"]}', f'{oid} vs {e["git_blob_oid_sha1"]}')
    if data is not None:
        ck(len(data) == e["byte_length"], f'len  {e["path"]}', f'{len(data)} vs {e["byte_length"]}')
        ck(hashlib.sha256(data).hexdigest() == e["raw_file_sha256"], f'sha  {e["path"]}', hashlib.sha256(data).hexdigest())
        ck(data.count(b"\r\n") == 0 and data.count(b"\r") == 0, f'LF/LF-only {e["path"]}')

print("\n-- split baseline: both designated coordinates --")
for a in alias:
    p = a.get("path")
    rid = a.get("identity") == "IDENTICAL_AT_BOTH_COORDINATES"
    poid, pdata = ipd_blob("8eec74ae27cda09f3c368b9c299895eae41554db", p)
    aoid, adata = ipd_blob("70b24f029842a7e9b7f615e4d9df7376fd4ff817", p)
    okp = (poid == a.get("primary_blob_oid_sha1"))
    oka = (aoid == a.get("alias_blob_oid_sha1"))
    ck(okp and oka, f'alias-source recorded OIDs {p}', f'primary {poid} alias {aoid}')
    ck((poid == aoid) == bool(rid), f'divergence classification {p}', f'identical={poid==aoid} recorded={rid}')
print("alias record keys:", sorted(alias[0].keys()))

# ---- (c) IRR remote blobs
print(f"\n-- IRR remote blob verification: {len(irr_e)} core entries + {len(irr_remote)-len(irr_e)} IRR-repo criteria/anchor entries at their recorded pins --")
for e in irr_remote:
    url = f'{IRR_REMOTE}/contents/{e["path"]}?ref={e["commit"]}'
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json"})
    tok = os.environ.get("GITHUB_TOKEN") or subprocess.run(["gh","auth","token"],capture_output=True,text=True).stdout.strip()
    if tok:
        req.add_header("Authorization", f"Bearer {tok}")
    with urllib.request.urlopen(req) as r:
        j = json.load(r)
    data = base64.b64decode(j["content"])
    ck(j["sha"] == e["git_blob_oid_sha1"], f'IRR blob {e["path"]}', f'{j["sha"]} vs {e["git_blob_oid_sha1"]}')
    ck(len(data) == e["byte_length"], f'IRR len {e["path"]}', f'{len(data)} vs {e["byte_length"]}')
    ck(hashlib.sha256(data).hexdigest() == e["raw_file_sha256"], f'IRR sha {e["path"]}')

print(f"\n=== {checks} checks executed, {len(fails)} failures ===")
for f in fails:
    print("FAILURE:", f)
sys.exit(1 if fails else 0)
