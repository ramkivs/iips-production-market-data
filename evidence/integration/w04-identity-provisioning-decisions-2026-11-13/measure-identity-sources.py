#!/usr/bin/env python3
"""W04 decisions D1-D4: measurements of the P04 master against the source files tracked in this repository.

READ-ONLY. Standard library only. Reads tracked files of this repository and, when a path is
given, the tracked identity rosters of an IRR checkout. Writes one JSON document to standard
output. Opens no socket and writes no file.

    python3 measure-identity-sources.py [<IRR checkout>]

The output is counts, plus the public reference facts of the two withheld Jain Irrigation
securities. It contains no portfolio data. Run from the repository root.

Each measurement compares files; none of them establishes which file is right.
"""
import collections
import csv
import glob
import hashlib
import io
import json
import os
import re
import sys
import zipfile

DEPOSIT = 'evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json'
MANIFEST = 'evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json'
BUNDLE = 'evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip'
PUBLISHED = 'evidence/D05-Wave3/arena_B05_latestcsvs.zip'
DERIVED_MCA = 'evidence/D05-Wave3/derived/arena_mca_identity_bridged.derived.csv'
DERIVED_TAXONOMY = 'evidence/D05-Wave3/derived/arena_taxonomy_submission.derived.csv'
DERIVED_BSE = 'evidence/D05-Wave3/derived/arena_bse_identity_bridged.derived.csv'
P01 = 'docs/p01/P01_IDENTITY_AND_LINEAGE.md'

NSE_MEMBER = '01_source_material/NSE/EQUITY_L(1).csv'
BSE_MEMBER = '01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv'
DEPOSITORY_MEMBER = '01_source_material/Depository/ISIN_DETAILS_05-Nov-2026.csv'
BRIDGE_MEMBER = '02_latest_prepared_candidates/arena_mca_identity_bridged.csv'
MCA_MASTER_MEMBER = '01_source_material/MCA/company_master_data_2026-11-07.zip'
PUBLISHED_MCA_MEMBER = 'arena_mca_identity_bridged.csv'
PUBLISHED_TAXONOMY_MEMBER = 'arena_taxonomy_submission.csv'

CIN = re.compile(r'^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$')
JAIN = ('INE175A01038', 'IN9175A01010')


def sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for block in iter(lambda: handle.read(1 << 20), b''):
            digest.update(block)
    return digest.hexdigest()


def rows(archive, member):
    with zipfile.ZipFile(archive) as bundle:
        data = bundle.read(member)
    text = data.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text, newline=''), skipinitialspace=True)
    return [{(key or '').strip(): (value or '').strip() for key, value in row.items()} for row in reader], hashlib.sha256(data).hexdigest()


def cin_profile(values):
    valid = [value for value in values if CIN.match(value)]
    states = collections.Counter(value[6:8] for value in valid)
    years = sorted(value[8:12] for value in valid)
    counts = collections.Counter(valid)
    return {
        'nonBlank': sum(1 for value in values if value),
        'cinFormat': len(valid),
        'distinctCin': len(counts),
        'cinSharedByMoreThanOneIsin': sum(1 for count in counts.values() if count > 1),
        'distinctStateCodes': len(states),
        'stateCodeMH': states.get('MH', 0),
        'earliestYear': years[0] if years else None,
        'latestYear': years[-1] if years else None,
    }


def main():
    deposit = json.load(open(DEPOSIT, encoding='utf-8'))
    by_isin = {record['isin']: record for record in deposit}
    manifest = json.load(open(MANIFEST, encoding='utf-8'))

    nse, nse_sha = rows(BUNDLE, NSE_MEMBER)
    bse, bse_sha = rows(BUNDLE, BSE_MEMBER)
    bridge, bridge_sha = rows(BUNDLE, BRIDGE_MEMBER)
    published, published_sha = rows(PUBLISHED, PUBLISHED_MCA_MEMBER)
    taxonomy, taxonomy_sha = rows(PUBLISHED, PUBLISHED_TAXONOMY_MEMBER)
    with open(DERIVED_MCA, newline='', encoding='utf-8-sig') as handle:
        derived = list(csv.DictReader(handle))
    with open(DERIVED_TAXONOMY, newline='', encoding='utf-8-sig') as handle:
        derived_taxonomy = list(csv.DictReader(handle))
    with open(DERIVED_BSE, newline='', encoding='utf-8-sig') as handle:
        derived_bse = {row['isin']: row['bseScripCode'].strip() for row in csv.DictReader(handle)}
    with zipfile.ZipFile(BUNDLE) as bundle:
        members = set(bundle.namelist())
        depository_bytes = bundle.read(DEPOSITORY_MEMBER)
    depository = {}
    for row in csv.DictReader(io.StringIO(depository_bytes.decode('utf-8-sig'), newline='')):
        if row['ISIN'] in by_isin:
            depository[row['ISIN']] = row

    out = {
        'schema': 'IPD_W04_IDENTITY_DECISION_MEASUREMENTS_V1',
        'note': 'Comparisons of tracked files. No measurement here establishes which file is right.',
        'inputs': {
            DEPOSIT: sha256(DEPOSIT),
            MANIFEST: sha256(MANIFEST),
            BUNDLE: sha256(BUNDLE),
            PUBLISHED: sha256(PUBLISHED),
            DERIVED_MCA: sha256(DERIVED_MCA),
            DERIVED_TAXONOMY: sha256(DERIVED_TAXONOMY),
            DERIVED_BSE: sha256(DERIVED_BSE),
            P01: sha256(P01),
            'members': {
                NSE_MEMBER: nse_sha,
                BSE_MEMBER: bse_sha,
                DEPOSITORY_MEMBER: hashlib.sha256(depository_bytes).hexdigest(),
                BRIDGE_MEMBER: bridge_sha,
                PUBLISHED_MCA_MEMBER: published_sha,
                PUBLISHED_TAXONOMY_MEMBER: taxonomy_sha,
            },
        },
    }

    # ---- manifest ----
    out['manifest'] = {
        'batchId': manifest['batchId'],
        'recordCount': manifest['recordCount'],
        'operatingMode': manifest['operatingMode'],
        'selectedTier': manifest['selectedTier'],
        'authorizationRef': manifest['authorizationRef'],
        'fileChecksumSha256': manifest['fileChecksumSha256'],
        'residualLimitationCount': len(manifest['residualLimitations']),
        'cinBinding': manifest['fieldBindings']['cin'],
        'bundleDeclaresMemberSha256': manifest['universeSource']['bundleMemberSha256'],
    }
    out['mcaCompanyMasterInBundle'] = MCA_MASTER_MEMBER in members

    # ---- NSE listing master: series per record ----
    series = collections.Counter(row['SERIES'] for row in nse)
    nse_by_isin = {row['ISIN NUMBER']: row for row in nse}
    eq_isins = {row['ISIN NUMBER'] for row in nse if row['SERIES'] == 'EQ'}
    out['nseListingMaster'] = {
        'rows': len(nse),
        'distinctIsins': len(nse_by_isin),
        'seriesCounts': dict(sorted(series.items())),
        'depositRecords': len(deposit),
        'depositRecordsPresentWithSeriesEqAndSameSymbol': sum(
            1 for isin, record in by_isin.items()
            if isin in nse_by_isin and nse_by_isin[isin]['SERIES'] == 'EQ' and nse_by_isin[isin]['SYMBOL'] == record.get('nseSymbol')
        ),
        'eqRowsAbsentFromDeposit': len(eq_isins - set(by_isin)),
        'depositRecordsAbsentFromEqRows': len(set(by_isin) - eq_isins),
        'companyNamesWithMoreThanOneEqRow': sum(
            1 for count in collections.Counter(row['NAME OF COMPANY'] for row in nse if row['SERIES'] == 'EQ').values() if count > 1
        ),
        'depositIsinsNotPrefixedINE': sorted(isin for isin in by_isin if not isin.startswith('INE')),
    }

    # ---- BSE active-equity export ----
    bse_by_isin = collections.defaultdict(list)
    for row in bse:
        bse_by_isin[row['ISIN No']].append(row)
    joined = [(isin, bse_by_isin[isin]) for isin in by_isin if isin in bse_by_isin]
    out['bseActiveEquityExport'] = {
        'rows': len(bse),
        'isinsWithMoreThanOneRow': sum(1 for group in bse_by_isin.values() if len(group) > 1),
        'depositIsinsPresent': len(joined),
        'scripCodeAgrees': sum(1 for isin, group in joined if len(group) == 1 and group[0]['Security Code'] == by_isin[isin].get('bseScripCode')),
        'securityIdAgrees': sum(1 for isin, group in joined if len(group) == 1 and group[0]['Security Id'] == by_isin[isin].get('bseSymbol')),
        'groupCounts': dict(sorted(collections.Counter(group[0]['Group'] for _, group in joined).items())),
        'statusCounts': dict(collections.Counter(group[0]['Status'] for _, group in joined)),
        'columns': list(bse[0].keys()),
        'hasListingDateColumn': any('date' in column.lower() for column in bse[0].keys()),
        'depositScripCodeEqualsDerivedJoin': sum(1 for isin, record in by_isin.items() if derived_bse.get(isin) == record.get('bseScripCode')),
        'depositScripCodeKinds': dict(collections.Counter(
            'six-digit' if re.fullmatch(r'\d{6}', str(record.get('bseScripCode') or '')) else str(record.get('bseScripCode'))
            for record in deposit
        )),
    }

    # ---- CIN: three tracked generations ----
    deposit_cin = {isin: (record.get('cin') or '') for isin, record in by_isin.items()}
    bridge_cin = {row['isin']: row['cin'] for row in bridge}
    published_cin = {row['isin']: row['cin'] for row in published}
    derived_cin = {row['isin']: row['cin'].strip() for row in derived}
    both_bridge = [isin for isin in by_isin if CIN.match(deposit_cin[isin]) and CIN.match(bridge_cin.get(isin, ''))]
    both_derived = [isin for isin in by_isin if CIN.match(deposit_cin[isin]) and CIN.match(derived_cin.get(isin, ''))]
    out['cin'] = {
        'deposit': cin_profile(list(deposit_cin.values())),
        'publishedLatest_2026_11_08': cin_profile(list(published_cin.values())),
        'bundleBridge_2026_11_07': cin_profile(list(bridge_cin.values())),
        'derivedBridge_reassessment': cin_profile(list(derived_cin.values())),
        'depositEqualsPublishedLatest': sum(1 for isin in by_isin if deposit_cin[isin] == published_cin.get(isin)),
        'bundleBridgeEqualsDerivedBridgeWhereBridgeIsCin': sum(
            1 for isin, value in bridge_cin.items() if CIN.match(value) and derived_cin.get(isin) == value
        ),
        'recordsWithCinInDepositAndInBundleBridge': len(both_bridge),
        'ofThoseEqual': sum(1 for isin in both_bridge if deposit_cin[isin] == bridge_cin[isin]),
        'recordsWithCinInDepositAndInDerivedBridge': len(both_derived),
        'ofThoseEqualToDerived': sum(1 for isin in both_derived if deposit_cin[isin] == derived_cin[isin]),
        'publishedStatusCounts': dict(collections.Counter(row['mcaIdentityStatus'] for row in published).most_common()),
    }

    # ---- taxonomy ----
    with_bank = [record for record in deposit if 'bank' in record['companyName'].lower()]
    out['taxonomy'] = {
        'depositSectorEqualsPublishedTaxonomy': sum(1 for row in taxonomy if by_isin[row['isin']]['sector'] == row['sector']),
        'depositIndustryEqualsPublishedBasicIndustry': sum(1 for row in taxonomy if by_isin[row['isin']]['industry'] == row['basicIndustry']),
        'distinctSectors': len({record['sector'] for record in deposit}),
        'sectorCapitalGoods': sum(1 for record in deposit if record['sector'] == 'Capital Goods'),
        'industryIndustrialProducts': sum(1 for record in deposit if record['industry'] == 'Industrial Products'),
        'recordsWithBankInCompanyName': len(with_bank),
        'ofThoseSectorFinancialServices': sum(1 for record in with_bank if record['sector'] == 'Financial Services'),
        'ofThoseSectorCapitalGoods': sum(1 for record in with_bank if record['sector'] == 'Capital Goods'),
        'depositSectorEqualsDerivedTaxonomySector': sum(1 for row in derived_taxonomy if by_isin[row['isin']]['sector'] == row['sector']),
        'derivedTaxonomySectorCapitalGoods': sum(1 for row in derived_taxonomy if row['sector'] == 'Capital Goods'),
        'derivedTaxonomyClassificationBasis': dict(collections.Counter(row['classificationBasis'] for row in derived_taxonomy)),
    }

    # ---- depository ----
    issuer_names = collections.defaultdict(list)
    for isin, row in depository.items():
        issuer_names[row['NAME_OF_ISSUER'].strip()].append(isin)
    out['depository'] = {
        'depositIsinsPresent': len(depository),
        'cfiCounts': dict(collections.Counter(row['CFI'] for row in depository.values()).most_common()),
        'issuerNamesCarryingMoreThanOneDepositIsin': sum(1 for group in issuer_names.values() if len(group) > 1),
    }

    # ---- the two withheld Jain Irrigation securities (public reference facts) ----
    jain = {}
    for isin in JAIN:
        record = by_isin[isin]
        jain[isin] = {
            'deposit': {key: record.get(key) for key in ('companyId', 'companyName', 'cin', 'nseSymbol', 'bseSymbol', 'bseScripCode', 'effectiveFrom', 'faceValue')},
            'nseListingMaster': {key: nse_by_isin[isin][key] for key in ('SYMBOL', 'NAME OF COMPANY', 'SERIES', 'DATE OF LISTING', 'FACE VALUE')},
            'bseActiveEquityExport': {key: bse_by_isin[isin][0][key] for key in ('Security Code', 'Issuer Name', 'Security Id', 'Security Name', 'Status', 'Group')},
            'depository': {key: depository[isin][key] for key in ('NAME_OF_ISSUER', 'SECURITY_DESCRIPTION', 'FISN', 'CFI')},
            'cinBundleBridge': bridge_cin[isin],
            'cinDerivedBridge': derived_cin[isin],
            'cinPublishedLatest': published_cin[isin],
        }
    out['jainIrrigation'] = jain
    out['jainIrrigationSummary'] = {
        'depositCinsEqualAcrossTheTwoIsins': by_isin[JAIN[0]].get('cin') == by_isin[JAIN[1]].get('cin'),
        'bundleBridgeCinsEqualAcrossTheTwoIsins': bridge_cin[JAIN[0]] == bridge_cin[JAIN[1]],
        'depositCinEqualsBundleBridgeCin': [by_isin[isin].get('cin') == bridge_cin[isin] for isin in JAIN],
    }

    # ---- optional: IRR tracked rosters ----
    if len(sys.argv) > 1:
        root = sys.argv[1]
        pairs = {}
        for path in glob.glob(os.path.join(root, 'evidence', 'real-issuer', '**', 'eligible-roster.json'), recursive=True):
            roster = json.load(open(path, encoding='utf-8'))
            issuer_cin = {issuer['issuerId']: issuer.get('cin') for issuer in roster.get('issuers', [])}
            for security in roster.get('securities', []):
                if issuer_cin.get(security['issuerId']):
                    pairs[security['isin']] = issuer_cin[security['issuerId']]
        listings = set()
        for path in glob.glob(os.path.join(root, 'evidence', 'real-issuer', '**', 'listing-map.json'), recursive=True):
            for entry in json.load(open(path, encoding='utf-8')).get('entries', []):
                listings.add((entry['exchange'], entry['series'], 'numeric' if entry['symbol'].isdigit() else 'alphanumeric', entry['listingId']))
        out['irrTrackedRosters'] = {
            'distinctSecuritiesWithACin': len(pairs),
            'presentInDeposit': sum(1 for isin in pairs if isin in by_isin),
            'depositCinEqualsIrrCin': sum(1 for isin, value in pairs.items() if deposit_cin.get(isin) == value),
            'bundleBridgeCinEqualsIrrCin': sum(1 for isin, value in pairs.items() if bridge_cin.get(isin) == value),
            'distinctListingsByExchangeSeriesSymbolKind': dict(sorted(collections.Counter(
                f'{exchange}/{series}/{kind}' for exchange, series, kind, _ in listings
            ).items())),
        }

    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
