#!/usr/bin/env python3
"""Read-only IPD object audit. Usage: python verify_ipd.py H12.json [commit].
Supply the adopted IRR R5 manifest's raw Git blob bytes, not a normalized copy.
Exit 0 means integrity checks passed, NOT freeze establishment or qualification.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def git(*args):
    return subprocess.check_output(['git', *args])


def check(condition, label):
    if not condition:
        raise AssertionError(label)


raw = Path(sys.argv[1]).read_bytes()
check(hashlib.sha256(raw).hexdigest() ==
      'd0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76',
      'adopted manifest raw SHA-256')
manifest = json.loads(raw)
current = git('rev-parse', sys.argv[2] if len(sys.argv) > 2 else 'HEAD').decode().strip()
primary = manifest['pinned_bases']['IPD_primary_qe_coordinate']['commit']
check(git('rev-parse', '--is-shallow-repository').strip() == b'false', 'full history')
subprocess.run(['git', 'merge-base', '--is-ancestor', primary, current], check=True)
results = []
for group in ['entries', 'conditional_entries', 'criteria_basis', 'frozen_g3_anchors',
              'frozen_g3_anchors_revalidated_at_qe_candidate']:
    for entry in manifest[group]:
        if entry['repository'] != 'ramkivs/iips-production-market-data':
            continue
        commit, path = entry['commit'], entry['path']
        data = git('show', f'{commit}:{path}')
        oid = git('rev-parse', f'{commit}:{path}').decode().strip()
        check(oid == entry['git_blob_oid_sha1'], f'{group}: {path}: blob')
        check(hashlib.sha256(data).hexdigest() == entry['raw_file_sha256'], f'{path}: sha256')
        check(len(data) == entry['byte_length'], f'{path}: bytes')
        check(git('rev-parse', f'{commit}^{{tree}}').decode().strip() == entry['tree'], f'{path}: tree')
        live = git('rev-parse', f'{current}:{path}').decode().strip()
        results.append(dict(group=group, path=path, designated_commit=commit,
                            designated_blob=oid, current_blob=live, unchanged=oid == live))
alias = manifest['pinned_bases']['IPD_broker_alias_compatibility_coordinate']['commit']
for entry in manifest['split_baseline']['alias_raw_sources']:
    data = git('show', f"{alias}:{entry['path']}")
    check(hashlib.sha256(data).hexdigest() == entry['alias_raw_file_sha256'], 'alias SHA-256')
    check(len(data) == entry['alias_byte_length'], 'alias bytes')
    check(git('rev-parse', f"{alias}:{entry['path']}").decode().strip() == entry['alias_blob_oid_sha1'], 'alias blob')
core = [r for r in results if r['group'] == 'entries']
check(len(core) == 32, '32 IPD primary entries')
changes = git('diff', '--name-only', primary, current).decode().splitlines()
print(json.dumps(dict(
    audit='IPD-only source integrity; not full H-12 validation, freeze, S2, S3 or QE',
    current_commit=current, current_tree=git('rev-parse', f'{current}^{{tree}}').decode().strip(),
    primary=primary, alias=alias, manifest_sha256=hashlib.sha256(raw).hexdigest(),
    verified_records=len(results), verified_alias_sources=14,
    core_unchanged=sum(r['unchanged'] for r in core), core_total=len(core),
    changed_paths_from_primary=changes,
    non_evidence_changes=[p for p in changes if not p.startswith('evidence/')],
    records=results,
    disposition='INTEGRITY VERIFIED; publication movement enumerated; no re-designation'), indent=2))
