#!/usr/bin/env python3
"""W04 reconciliation, 2026-11-16: compares the D02 reconciliation document with the inventory
archive it describes, for the statements listed below.

READ-ONLY. Reads one zip file and one Markdown file. Writes one JSON document to standard
output. Opens no socket. Changes neither file.

The archive is host output and is the authority. The document is a narrative written from it.
Where they differ, the archive stands.

Usage
  python3 compare_d02_document_with_archive.py <archive.zip> <document.md>

  archive.zip  evidence/d02-inventory-2026-11-16/windows-host/d02-d5-d16-inventory-20261116T143819255Z-96672044.zip
  document.md  the file at commit 8132c5b6bba0051cbac95dab060096f2983e7396, which is not on main:
               git show 8132c5b6bba0051cbac95dab060096f2983e7396:docs/integration/IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md > /tmp/d02.md

Exit codes: 0 comparison written; 2 usage; 3 archive digest differs; 4 document digest differs;
5 an expected row or statement is absent.
"""
import hashlib
import io
import json
import re
import sys
import zipfile

ARCHIVE_SHA256 = '813183b382a26d0b6affeeaee04d44b0ea0057bea140a83221b460d8720da1b3'
DOCUMENT_SHA256 = 'd4993aefa2beaaa89c605c46db4a3c9efdbf9e63ff2fd8adba513e09ae84e38d'
DOCUMENT_COMMIT = '8132c5b6bba0051cbac95dab060096f2983e7396'
DOCUMENT_PATH = 'docs/integration/IPD-D02-D5-D16-LIVE-EVIDENCE-RECONCILIATION-2026-11-16.md'
RESULTS = '02-q01-q14-query-results.json'
SCHEMA = '03-migration-ledger-and-schema-evidence.json'
PORTFOLIO = 'DHAN_PORTFOLIO'
PERSONAL = 'PERSONAL-fa8ad7bc-efec-5562-cfbd-de362b782fa2'


def fail(code, message):
    sys.stderr.write(message + '\n')
    sys.exit(code)


def one(pattern, text, what):
    found = re.search(pattern, text)
    if not found:
        fail(5, 'statement not found in the document: ' + what)
    return found.group(1)


def number(text):
    value = float(text)
    return int(value) if value == int(value) and '.' not in text else value


def main():
    if len(sys.argv) != 3:
        fail(2, 'usage: compare_d02_document_with_archive.py <archive.zip> <document.md>')
    with open(sys.argv[1], 'rb') as handle:
        archive_bytes = handle.read()
    if hashlib.sha256(archive_bytes).hexdigest() != ARCHIVE_SHA256:
        fail(3, 'archive SHA-256 differs from the recorded %s' % ARCHIVE_SHA256)
    with open(sys.argv[2], 'rb') as handle:
        document_bytes = handle.read()
    if hashlib.sha256(document_bytes).hexdigest() != DOCUMENT_SHA256:
        fail(4, 'document SHA-256 differs from the recorded %s' % DOCUMENT_SHA256)

    archive = zipfile.ZipFile(io.BytesIO(archive_bytes))
    statements = {s['statementId']: s for s in json.loads(archive.read(RESULTS).decode('utf-8-sig'))['statements']}
    schema = json.loads(archive.read(SCHEMA).decode('utf-8-sig'))
    archive_text = b'\n'.join(archive.read(info.filename) for info in archive.infolist()).decode('utf-8', 'replace')

    def row(statement, **where):
        rows = [r for r in statements[statement]['rows'] if all(r.get(k) == v for k, v in where.items())]
        if len(rows) != 1:
            fail(5, 'expected one row of %s for %r, found %d' % (statement, where, len(rows)))
        return rows[0]

    q06 = row('Q06', portfolio_id=PORTFOLIO)
    q07 = row('Q07', portfolio_id=PORTFOLIO, revision=q06['current_revision'])
    q08 = [r for r in statements['Q08']['rows'] if r['portfolio_id'] == PORTFOLIO and r['revision'] == q06['current_revision']]

    lines = document_bytes.decode('utf-8').splitlines()
    entry_number, entry = next(((n, l) for n, l in enumerate(lines, 1) if l.startswith('1. `%s`' % PORTFOLIO)), (None, None))
    if entry is None:
        fail(5, 'the %s entry was not found in the document' % PORTFOLIO)
    personal_number, personal = next(((n, l) for n, l in enumerate(lines, 1) if l.startswith('2. `%s`' % PERSONAL)), (None, None))
    if personal is None:
        fail(5, 'the %s entry was not found in the document' % PERSONAL)
    tables_number, tables = next(((n, l) for n, l in enumerate(lines, 1) if l.startswith('| Total tables |')), (None, None))
    if tables is None:
        fail(5, 'the "Total tables" row was not found in the document')

    def compare(field, line, document_value, archive_value, source):
        return {
            'field': field,
            'documentLine': line,
            'document': document_value,
            'archive': archive_value,
            'archiveSource': source,
            'equal': document_value == archive_value,
        }

    populated = sum(r['holding_rows'] for r in q08 if r['security_identity_state'] == 'POPULATED')
    null = sum(r['holding_rows'] for r in q08 if r['security_identity_state'] == 'NULL')
    active = sum(r['holding_rows'] for r in q08 if r['active'] == 1)
    named = [
        compare('portfolio_name', entry_number, one(r'portfolio_name = "([^"]*)"', entry, 'portfolio_name'), q06['portfolio_name'], 'Q06'),
        compare('total_market_value', entry_number, number(one(r'total_market_value = ([0-9.]+)', entry, 'total_market_value')), q07['total_market_value'], 'Q07'),
        compare('weight_sum_percentage', entry_number, number(one(r'weight_sum_percentage = ([0-9.]+)', entry, 'weight_sum_percentage')), q07['weight_sum_percentage'], 'Q07'),
    ]
    agreeing = [
        compare('created_at', entry_number, one(r'created_at = ([0-9TZ:.\-]+)', entry, 'created_at'), q06['created_at'], 'Q06'),
        compare('current_revision', entry_number, int(one(r'current_revision = ([0-9]+)', entry, 'current_revision')), q06['current_revision'], 'Q06'),
        compare('operation', entry_number, one(r'current_revision = [0-9]+` `([A-Z]+)`', entry, 'operation'), q07['operation'], 'Q07'),
        compare('active holding rows', entry_number, int(one(r'([0-9]+) active holding rows', entry, 'active holding rows')), active, 'Q08'),
        compare('declared holdings count', entry_number, int(one(r'([0-9]+) active holding rows', entry, 'holdings count')), q07['holdings_count'], 'Q07'),
        compare('security_identity populated', entry_number, int(one(r'([0-9]+) populated', entry, 'populated')), populated, 'Q08'),
        compare('security_identity NULL', entry_number, int(one(r'and ([0-9]+) `NULL`', entry, 'NULL')), null, 'Q08'),
        compare('identity_status', entry_number, one(r'identity_status = ([A-Z_]+)', entry, 'identity_status'), '/'.join(sorted({r['identity_status'] for r in q08})), 'Q08'),
        compare('resolution_disposition', entry_number, one(r'resolution_disposition = ([A-Z0-9_]+)', entry, 'resolution_disposition'), '/'.join(sorted({r['resolution_disposition'] for r in q08})), 'Q08'),
    ]
    other = [
        compare('number of tables', tables_number, int(one(r'\| Total tables \| ([0-9]+) \|', tables, 'Total tables')), schema['schemaObjectsByType']['table'], SCHEMA + ' schemaObjectsByType.table'),
    ]
    amount = one(r'`amount = ([0-9.]+)`', personal, 'amount')
    q09_columns = sorted(statements['Q09']['rows'][0].keys())
    document_values_in_archive = {
        text: text in archive_text
        for text in (named[0]['document'], repr(named[1]['document']), repr(named[2]['document']))
    }

    document = {
        'schema': 'IPD_W04_D02_DOCUMENT_ARCHIVE_COMPARISON_V1',
        'authority': 'the archive (host output); the document is a narrative written from it',
        'archive': {'sha256': ARCHIVE_SHA256, 'bytes': len(archive_bytes)},
        'document': {'path': DOCUMENT_PATH, 'commit': DOCUMENT_COMMIT, 'sha256': DOCUMENT_SHA256, 'bytes': len(document_bytes)},
        'portfolio': PORTFOLIO,
        'differing': [c for c in named + agreeing + other if not c['equal']],
        'agreeing': [c for c in named + agreeing + other if c['equal']],
        'differingDocumentValuesFoundAnywhereInTheArchive': document_values_in_archive,
        'notInTheArchive': [
            {
                'field': 'contribution amount of ' + PERSONAL,
                'documentLine': personal_number,
                'document': number(amount),
                'archive': None,
                'reason': 'statement Q09 does not select the amount column',
                'q09HasAmountColumn': 'amount' in q09_columns,
            }
        ],
        'effectOnTheW04Counts': 'none: revision, holding count and the 1 and 63 of the security identity are equal in both',
    }
    sys.stdout.write(json.dumps(document, indent=2) + '\n')


if __name__ == '__main__':
    main()
