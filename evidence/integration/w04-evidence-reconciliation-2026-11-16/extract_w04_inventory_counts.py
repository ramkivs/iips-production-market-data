#!/usr/bin/env python3
"""W04 evidence reconciliation, 2026-11-16: counts for one portfolio from the published
D02 D5/D16 read-only inventory archive.

READ-ONLY. Reads one zip file. Writes one JSON document to standard output. Opens no socket.

What it does
  1. Compares the SHA-256 of the archive with the recorded value.
  2. Compares every entry with the archive's own sha256s.txt.
  3. Reads the rows of Q06, Q07 and Q08 for the portfolio and prints counts.

What it leaves out, on purpose: market value, weights, digests of the revision, names, labels,
audit detail. The archive carries the notice LOCAL_PRINCIPAL_REVIEW_REQUIRED_BEFORE_EXTERNAL_SHARING;
this extract carries counts and classifications only.

Usage
  python3 extract_w04_inventory_counts.py <archive.zip> [portfolio id]

The archive is not in this folder. It is tracked on branch
arena/c32aea42-iips-production-market-data (see README.md, section 3):
  git show origin/arena/c32aea42-iips-production-market-data:evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip > /tmp/inventory.zip

Exit codes: 0 extract written; 2 usage; 3 archive digest differs; 4 an entry differs from the
archive's manifest; 5 the expected rows are absent.
"""
import hashlib
import io
import json
import sys
import zipfile

ARCHIVE_SHA256 = '813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3'
ARCHIVE_NAME = 'd02-d5-d16-inventory-20261116T143819255Z-96672044.zip'
MANIFEST = 'sha256s.txt'
RESULTS = '02-q01-q14-query-results.json'
SUMMARY = 'd5-d16-inventory-summary.json'


def fail(code, message):
    sys.stderr.write(message + '\n')
    sys.exit(code)


def main():
    if len(sys.argv) not in (2, 3):
        fail(2, 'usage: extract_w04_inventory_counts.py <archive.zip> [portfolio id]')
    portfolio = sys.argv[2] if len(sys.argv) == 3 else 'DHAN_PORTFOLIO'
    with open(sys.argv[1], 'rb') as handle:
        data = handle.read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != ARCHIVE_SHA256:
        fail(3, 'archive SHA-256 %s differs from the recorded %s' % (digest, ARCHIVE_SHA256))

    archive = zipfile.ZipFile(io.BytesIO(data))
    names = sorted(info.filename for info in archive.infolist())
    listed = {}
    for line in archive.read(MANIFEST).decode('utf-8').splitlines():
        if line.strip():
            value, name = line.split(None, 1)
            listed[name.strip().lstrip('*')] = value.lower()
    checked = 0
    for name in names:
        if name == MANIFEST:
            continue
        actual = hashlib.sha256(archive.read(name)).hexdigest()
        if listed.get(name) != actual:
            fail(4, 'entry %s differs from the manifest of the archive' % name)
        checked += 1
    if sorted(listed) != [name for name in names if name != MANIFEST]:
        fail(4, 'the manifest of the archive and its entries do not name the same files')

    results = json.loads(archive.read(RESULTS).decode('utf-8'))
    summary = json.loads(archive.read(SUMMARY).decode('utf-8'))
    statements = {item['statementId']: item for item in results['statements']}
    for wanted in ('Q06', 'Q07', 'Q08', 'Q14'):
        if wanted not in statements or statements[wanted]['status'] != 'EXECUTED_OK':
            fail(5, 'statement %s is absent or was not executed' % wanted)

    headers = [row for row in statements['Q06']['rows'] if row['portfolio_id'] == portfolio]
    revisions = [row for row in statements['Q07']['rows'] if row['portfolio_id'] == portfolio]
    groups = [row for row in statements['Q08']['rows'] if row['portfolio_id'] == portfolio]
    if len(headers) != 1 or not revisions or not groups:
        fail(5, 'no rows for portfolio %s' % portfolio)
    header = headers[0]
    current = header['current_revision']
    current_groups = [row for row in groups if row['revision'] == current]

    def total(rows, **where):
        return sum(row['holding_rows'] for row in rows
                   if all(row[key] == value for key, value in where.items()))

    document = {
        'schema': 'IPD_W04_INVENTORY_COUNTS_EXTRACT_V1',
        'archive': {
            'name': ARCHIVE_NAME,
            'sha256': digest,
            'bytes': len(data),
            'entries': len(names),
            'entriesEqualToTheArchiveManifest': checked,
            'resultsEntrySha256': hashlib.sha256(archive.read(RESULTS)).hexdigest(),
        },
        'run': {
            'disposition': summary['disposition'],
            'exitCode': summary['exitCode'],
            'startedAtUtc': summary['startedAtUtc'],
            'completedAtUtc': summary['completedAtUtc'],
            'databasePreSha256': summary['databasePreSha256'],
            'databasePostSha256': summary['databasePostSha256'],
            'databasePrePostSha256Identical': summary['databasePrePostSha256Identical'],
            'sidecarsAbsentPreAndPost': summary['sidecarsAbsentPreAndPost'],
            'statementsExecuted': sum(1 for item in results['statements'] if item['status'] == 'EXECUTED_OK'),
            'statementsInCatalog': results['statementCountCatalog'],
            'queryOnlyPragmaInsideSnapshot': statements['Q14']['rows'],
        },
        'portfolio': {
            'portfolioId': portfolio,
            'status': header['status'],
            'currentRevision': current,
            'revisions': [
                {'revision': row['revision'], 'operation': row['operation'], 'holdingsCount': row['holdings_count']}
                for row in sorted(revisions, key=lambda row: row['revision'])
            ],
        },
        'currentRevisionHoldings': {
            'rows': total(current_groups),
            'active': total(current_groups, active=1),
            'inactive': total(current_groups, active=0),
            'securityIdentityPopulated': total(current_groups, security_identity_state='POPULATED'),
            'securityIdentityNull': total(current_groups, security_identity_state='NULL'),
            'activeWithSecurityIdentityPopulated': total(current_groups, active=1, security_identity_state='POPULATED'),
            'activeWithSecurityIdentityNull': total(current_groups, active=1, security_identity_state='NULL'),
            'groups': [
                {
                    'sourceBroker': row['source_broker'],
                    'active': row['active'],
                    'identityStatus': row['identity_status'],
                    'resolutionDisposition': row['resolution_disposition'],
                    'securityIdentityState': row['security_identity_state'],
                    'holdingRows': row['holding_rows'],
                }
                for row in current_groups
            ],
        },
        'leftOut': 'market value, weights, revision digests, names, labels and audit detail are not copied',
    }
    sys.stdout.write(json.dumps(document, indent=2) + '\n')


if __name__ == '__main__':
    main()
