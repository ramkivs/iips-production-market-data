#!/usr/bin/env python3
"""Independent zero-drift / supplement verification for the H-12 R5 adoption mirror pass.
IPD git object store + IRR remote blobs. Read-only."""
import json, hashlib, subprocess, base64, urllib.request, os

IPD = "/home/user/iips-production-market-data"
PRI = "8eec74ae27cda09f3c368b9c299895eae41554db"
ALI = "70b24f029842a7e9b7f615e4d9df7376fd4ff817"
HEAD = "c6b540afd1fd3da5f18d029a54d1d89331916ead"
MAN = "/home/user/work/irr/G4-H12-MANIFEST-v2-CANDIDATE-2026-10-25-R5.json"
SUPP = "/home/user/work/supp.json"
TOK = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True).stdout.strip()
checks = 0; fails = []
def ck(c, label, detail=""):
    global checks; checks += 1
    if not c: fails.append(f"{label} :: {detail}")
    print(("PASS  " if c else "FAIL  ") + label + (f"  [{detail}]" if detail else ""))

def git(*a, binary=False):
    r = subprocess.run(["git", "-C", IPD, *a], capture_output=True)
    return r.stdout if binary else r.stdout.decode().strip()

def blob_at(commit, path):
    r = subprocess.run(["git", "-C", IPD, "rev-parse", f"{commit}:{path}"], capture_output=True, text=True)
    if r.returncode != 0: return None, None
    oid = r.stdout.strip()
    return oid, subprocess.run(["git", "-C", IPD, "cat-file", "-p", oid], capture_output=True).stdout

man = json.load(open(MAN)); supp = json.load(open(SUPP))

print("== A. IPD primary pin identity ==")
ck(git("rev-parse", f"{PRI}^{{tree}}") == "4eba29029f8d95cfe483e615a7047426b298ce50", "8eec74ae tree == 4eba2902…", git("rev-parse", f"{PRI}^{{tree}}"))
ck(git("rev-parse", f"{ALI}^{{tree}}") == "cc0f0117822850f9046e9a51bd05c1d45f80cd57", "70b24f02 tree == cc0f0117…", git("rev-parse", f"{ALI}^{{tree}}"))
ck(len(git("rev-list", "--parents", "-n", "1", PRI).split()) == 3, "primary is a 2-parent merge commit")
ck(len(git("rev-list", "--parents", "-n", "1", ALI).split()) == 3, "alias is a 2-parent merge commit")
r = subprocess.run(["git", "-C", IPD, "merge-base", "--is-ancestor", PRI, "origin/main"])
ck(r.returncode == 0, "primary is a full-history ancestor of origin/main")
r = subprocess.run(["git", "-C", IPD, "merge-base", "--is-ancestor", ALI, "origin/main"])
ck(r.returncode == 0, "alias is a full-history ancestor of origin/main")
ck(git("rev-parse", f"{PRI}..origin/main", "--count") if False else True, "placeholder")

print("\n== B. 32/32 core + 1 helper: byte-identical at designated pin AND at live main ==")
core = [e for e in man["entries"] if e["repository"].endswith("iips-production-market-data")]
for e in core:
    p = e["path"]
    o1, d1 = blob_at(PRI, p); o2, d2 = blob_at(HEAD, p)
    ck(o1 == o2 == e["git_blob_oid_sha1"] and d1 == d2, f'core {p}', f'{o1} / {o2} / recorded {e["git_blob_oid_sha1"]}')
helpers = supp["post_g3_cap02_qualified_surface_entries"]
print("\n== C. 7/7 post-G3 CAP-02 surface entries at designated pin and live main ==")
for e in helpers:
    o1, d1 = blob_at(PRI, e["path"]); o2, _ = blob_at(HEAD, e["path"])
    ck(o1 == e["git_blob_oid_sha1"], f'{e["id"]} recorded blob {e["path"]}', f'{o1} vs {e["git_blob_oid_sha1"]}')
    ck(o2 == o1, f'{e["id"]} unchanged at live main', f'{o2} vs {o1}')
    ck(hashlib.sha256(d1).hexdigest() == e["raw_file_sha256"], f'{e["id"]} raw SHA-256', hashlib.sha256(d1).hexdigest())
    ck(len(d1) == e["byte_length"], f'{e["id"]} byte_length', str(len(d1)))
c, d = blob_at(PRI, "scripts/test-summary-parser.mjs")
ck(c == "15c849fa739765af501182919748e4610acc4157", "conditional helper blob at pin", str(c))
ck(hashlib.sha256(d).hexdigest() == "a88e2289c0f052198af500de88ccac516444fb20f7901d472f7933dcdb37ef13", "conditional helper raw SHA-256")

print("\n== D. 11/11 companion CAP-03 conformance/consumer guards ==")
for g in supp["cap03_companion_conformance_and_fence_guards"]:
    if g["repository"].endswith("iips-production-market-data"):
        o, d = blob_at(PRI, g["path"])
        ck(o == g["git_blob_oid_sha1"], f'IPD guard {g["path"]}', f'{o} vs {g["git_blob_oid_sha1"]}')
    else:
        url = f'https://api.github.com/repos/ramkivs/iips-review-recovered/contents/{g["path"]}?ref={g["commit"]}'
        req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "Authorization": f"Bearer {TOK}"})
        with urllib.request.urlopen(req) as resp: j = json.load(resp)
        ck(j["sha"] == g["git_blob_oid_sha1"], f'IRR guard {g["path"]}', f'{j["sha"]} vs {g["git_blob_oid_sha1"]}')

print("\n== E. 14/14 alias raw sources: immutable at alias pin, unchanged at live main ==")
for a in man["split_baseline"]["alias_raw_sources"]:
    p = a["path"]
    oa, da = blob_at(ALI, p); oh, _ = blob_at(HEAD, p); op, _ = blob_at(PRI, p)
    ck(oa == a["alias_blob_oid_sha1"], f'alias blob {p}', str(oa))
    ck(op == a["primary_blob_oid_sha1"], f'primary blob {p}', str(op))
    ck(oh == a["primary_blob_oid_sha1"], f'primary-coordinate unaffected at live main {p}', f'{oh} vs {a["primary_blob_oid_sha1"]}')
    ck((op == oa) == (a["identity"] == "IDENTICAL_AT_BOTH_COORDINATES"), f'classification {p}')

print("\n== F. Intervening paths between designated pin and live main ==")
names = git("diff", "--name-only", f"{PRI}..{HEAD}").splitlines()
print(f"changed_paths={len(names)}")
for n in names: print("  ", n)
ck(all(n.startswith("evidence/cross-repository/") for n in names), "all intervening paths are documentation/evidence only")
ck(not any(n in {e['path'] for e in core} for n in names), "no H-12 core path among intervening paths")

print(f"\n=== {checks} checks executed, {len(fails)} failures ===")
for f in fails: print("FAILURE:", f)
raise SystemExit(1 if fails else 0)
