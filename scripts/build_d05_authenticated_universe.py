#!/usr/bin/env python3
"""
D05 one-time replacement — deterministic build of the authenticated universe corpus,
the browser-safe canonical dataset asset and the REPLACEMENT_DEPOSITION manifest
(IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT; D-1/D-2/D-4/D-5/D-6/D-9, B1/B3).

Usage:
  build_d05_authenticated_universe.py --dropped-at <ISO-8601 UTC instant>  # build (writes outputs)
  build_d05_authenticated_universe.py --check                              # read-only byte verification

Fail-closed against pinned inputs; identical inputs produce byte-identical outputs.
"""
import argparse, csv, hashlib, io, json, re, sys, zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUNDLE = ROOT / 'evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip'
PUBLISHED = ROOT / 'evidence/D05-Wave3/arena_B05_latestcsvs.zip'
DEPOSIT_BRIDGE = ROOT / 'evidence/D05-Wave3/deposit-2026-11-08/arena_bse_identity_bridged.deposit.csv'
PA_DECISIONS = ROOT / 'evidence/D05-Wave3/deposit-2026-11-08/pa_decisions.json'
CORPUS = ROOT / 'evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json'
MANIFEST = ROOT / 'evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json'
ASSET = ROOT / 'src/identity/d05_authenticated_universe_data.ts'

EXPECTED = {
    'bundle_sha256': '6332b050132a160e89e5906d131e12535ac1105d4b781330fa63f0e0af1d41f4',
    'published_sha256': '73f1e3a330ab4915ced0b4520e4a3c1a7274d95258808227b3dad7dad806d0d2',
    'nse_member_sha256': 'da7eb83cf21156cca3a8bcc5b94ea55f825ff7348e02c89abc51658788361fa5',
    'bse_master_member_sha256': '66362fc392c820656ebfb0ab960da8d920a643e980bd3895c93418ae6c9a9947',
    'deposit_bridge_sha256': '307cf96d3afb2568f4c10091b6bc8c2a5a195ab476fd862c82ede46615530c99',
    'pa_decisions_sha256': 'a3219f407b29826e4d88619bec243c619e74508747ce367fd23d0e842c04e064',
    'recordCount': 2390,
    'dual': 2290,
    'exclusive': 100,
}

WAVE1_SUPERSEDES = {
    'kind': 'OFFLINE_BOOTSTRAP',
    'authorizationRef': 'AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001',
    'recordCount': 2250,
    'fileChecksumSha256': '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5',
    'artifact': 'evidence/operator_drop/d05_security_master_broad_universe.json',
    'disposition': 'RETAINED_IMMUTABLE_AS_LEGACY_EVIDENCE_NEVER_DELETED',
}

def sha256(b: bytes) -> str: return hashlib.sha256(b).hexdigest()

def read_member(z: zipfile.ZipFile, member: str) -> bytes:
    return z.open(member).read()

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--dropped-at')
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    # ── pin verification (fail-closed) ────────────────────────────────────────
    bundle_bytes = BUNDLE.read_bytes(); published_bytes = PUBLISHED.read_bytes()
    pins = {
        'bundle_sha256': sha256(bundle_bytes),
        'published_sha256': sha256(published_bytes),
        'deposit_bridge_sha256': sha256(DEPOSIT_BRIDGE.read_bytes()),
        'pa_decisions_sha256': sha256(PA_DECISIONS.read_bytes()),
    }
    bad = [k for k, v in pins.items() if v != EXPECTED[k]]
    if bad:
        raise SystemExit(f'pin verification failed: {bad} (expected {EXPECTED}, found {pins})')
    bz = zipfile.ZipFile(io.BytesIO(bundle_bytes)); pz = zipfile.ZipFile(io.BytesIO(published_bytes))
    nse_member = read_member(bz, '01_source_material/NSE/EQUITY_L(1).csv'); bse_member = read_member(bz, '01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv')
    if sha256(nse_member) != EXPECTED['nse_member_sha256']: raise SystemExit('NSE member pin failed')
    if sha256(bse_member) != EXPECTED['bse_master_member_sha256']: raise SystemExit('BSE master member pin failed')

    def rows_of(raw: bytes) -> list[dict[str, str]]:
        return list(csv.DictReader(io.TextIOWrapper(io.BytesIO(raw), encoding='utf-8-sig')))

    nse_rows = [r for r in rows_of(nse_member) if (r.get(' SERIES') or '').strip() == 'EQ']
    sym_k = next(k for k in nse_rows[0] if k.strip() == 'SYMBOL')
    name_k = next(k for k in nse_rows[0] if k.strip() == 'NAME OF COMPANY')
    isin_k = next(k for k in nse_rows[0] if k.strip() == 'ISIN NUMBER')
    date_k = next(k for k in nse_rows[0] if k.strip() == 'DATE OF LISTING')
    lot_k = next(k for k in nse_rows[0] if k.strip() == 'MARKET LOT')
    fv_k = next(k for k in nse_rows[0] if k.strip() == 'FACE VALUE')

    bse_master: dict[str, tuple[str, str]] = {}
    for e in rows_of(bse_member):
        isin = (e.get('ISIN No') or '').strip().upper(); code = (e.get('Security Code') or '').strip()
        inst = (e.get('Instrument') or '').strip().lower(); status = (e.get('Status') or '').strip().lower()
        if isin and re.fullmatch(r'\d{6}', code) and inst == 'equity' and status == 'active':
            bse_master[isin] = (code, (e.get('Security Id') or '').strip())

    mca_rows = rows_of(read_member(pz, 'arena_mca_identity_bridged.csv'))
    tax_rows = rows_of(read_member(pz, 'arena_taxonomy_submission.csv'))
    mca_by_isin = {r['isin'].strip().upper(): r for r in mca_rows}
    tax_by_isin = {r['isin'].strip().upper(): r for r in tax_rows}
    pa = json.loads(PA_DECISIONS.read_bytes())
    exclusions = set(pa['bseExclusionIsins'])

    # recompute the join; must agree with pinned deposit bridge and pa_decisions exactly
    dual_isins = {r[isin_k].strip().upper() for r in nse_rows if r[isin_k].strip().upper() in bse_master}
    excl_recalc = {r[isin_k].strip().upper() for r in nse_rows} - dual_isins
    if len(dual_isins) != EXPECTED['dual'] or excl_recalc != exclusions or len(excl_recalc) != EXPECTED['exclusive']:
        raise SystemExit('BSE master join no longer agrees with pinned deposit bridge / pa_decisions')

    norm_token = lambda s: re.sub(r'[^A-Z0-9]', '', s.upper())
    MONTHS = {'JAN':1,'FEB':2,'MAR':3,'APR':4,'MAY':5,'JUN':6,'JUL':7,'AUG':8,'SEP':9,'OCT':10,'NOV':11,'DEC':12}
    def iso_from_nse(s: str) -> str:
        d, mon, y = s.strip().split('-')
        dt = datetime(int(y), MONTHS[mon.upper()], int(d))
        return dt.strftime('%Y-%m-%dT00:00:00.000Z')

    records = []
    for r in nse_rows:
        isin = r[isin_k].strip().upper(); sym = r[sym_k].strip(); nm = r[name_k].strip()
        lot = int(r[lot_k].strip() or '1'); fv = float(r[fv_k].strip())
        fv_num = int(fv) if fv.is_integer() else fv
        hit = bse_master.get(isin)
        mcAr = mca_by_isin[isin]; taxAr = tax_by_isin[isin]
        cin = mcAr['cin'].strip()
        ent = {
            'companyId': f'EQ_{norm_token(sym)}_IN',
            'isin': isin,
            **({'cin': cin} if cin else {}),
            'nseSymbol': sym,
            **({'bseSymbol': hit[1], 'bseScripCode': hit[0]} if hit else {'bseSymbol': 'UNLISTED-BSE', 'bseScripCode': 'UNLISTED-BSE'}),
            'companyName': nm,
            'industry': taxAr['basicIndustry'],
            'sector': taxAr['sector'],
            'listingStatus': 'ACTIVE',
            'lotSize': lot,
            'tickSize': 0.05,
            'faceValue': fv_num,
            'currency': 'INR',
            'effectiveFrom': iso_from_nse(r[date_k]),
        }
        listing_entries = [{'exchange': 'NSE', 'symbol': sym, 'status': 'ACTIVE', 'lotSize': lot, 'tickSize': 0.05}]
        if hit:
            listing_entries.append({'exchange': 'BSE', 'symbol': hit[1], 'scripCode': hit[0], 'status': 'ACTIVE', 'lotSize': lot, 'tickSize': 0.05})
        ent['listings'] = listing_entries
        records.append(ent)

    # uniqueness gates (fail-closed)
    def unique(key, seq):
        dup = [v for v, c in ((v, seq.count(v)) for v in set(seq)) if c > 1]
        return dup
    dup_ids = unique('companyId', [r['companyId'] for r in records])
    dup_isins = unique('isin', [r['isin'] for r in records])
    dual_codes = [r['bseScripCode'] for r in records if r['bseScripCode'] != 'UNLISTED-BSE']
    dup_codes = unique('bseScripCode', dual_codes)
    dual_syms = [r['bseSymbol'] for r in records if r['bseSymbol'] != 'UNLISTED-BSE']
    dup_bsyms = unique('bseSymbol', dual_syms)
    if dup_ids or dup_isins or dup_codes or dup_bsyms:
        raise SystemExit(f'uniqueness gate failed: companyIds={dup_ids[:3]} isins={dup_isins[:3]} scrips={dup_codes[:3]} bsesyms={dup_bsyms[:3]}')
    if len(records) != EXPECTED['recordCount']:
        raise SystemExit(f'record count drifted: {len(records)}')

    corpus_json = json.dumps(records, indent=2, ensure_ascii=False).encode('utf-8')
    corpus_sha = sha256(corpus_json)

    asset_body = (
      '/**\n'
      ' * Institutional Investment Platform System (IIPS)\n'
      ' * Governed D05 Authenticated Universe Canonical Dataset Asset (One-Time Replacement)\n'
      ' *\n'
      ' * Governed under: AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001\n'
      ' * Scope: Tier 2 Active NSE CM Equities (2,390 canonical entities)\n'
      f' * Checksum: {corpus_sha}\n'
      ' *\n'
      ' * Browser-safe build-time imported canonical dataset.\n'
      ' */\n\n'
      'import { SecurityMasterEntity } from "./security_master.js";\n\n'
      'export const D05_AUTHENTICATED_UNIVERSE_ENTITIES: ReadonlyArray<SecurityMasterEntity> = '
    ).encode('utf-8') + corpus_json + ';\n'.encode('utf-8')

    manifest = {
        'batchId': 'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001',
        'domain': 'D05_SECURITY_MASTER',
        'kind': 'REPLACEMENT_DEPOSITION',
        'fileChecksumSha256': corpus_sha,
        'recordCount': len(records),
        'droppedAt': 'REQUIRED_ARG',
        'operatorId': 'OPERATOR_ADMIN_GOVERNED_01',
        'authorizationRef': 'AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001',
        'operatingMode': 'OFFLINE_BOOTSTRAP',
        'selectedTier': 'TIER_2_ACTIVE_NSE_CM',
        'universeSource': {
            'source': 'NSE CM EQ tier (EQUITY_L(1).csv, series=EQ, 2,390 rows) as pinned in the Wave-3 EQ bundle',
            'bundleRelativeMember': '01_source_material/NSE/EQUITY_L(1).csv',
            'bundleMemberSha256': EXPECTED['nse_member_sha256'],
            'order': 'bundle member order',
            'asOf': '2026-11-08 (one-time replacement act)',
        },
        'fieldBindings': {
            'faceValue': 'NSE listing master (FACE VALUE of each EQ listing; act-bound source; the MCA extract carries no faceValue column)',
            'tickSize': '0.05 uniform (D-9 documented one-time limitation; reference prices omitted; act-bound; never a code default)',
            'cin': 'arena_mca_identity_bridged.csv (published latest; verbatim, including blanks/exemptions/aliases; classes never misrepresented)',
            'bseScripCode': '2290 records: exact-ISIN join to the supplied BSE active-equity export (Security Code); 100 records: UNLISTED-BSE governed exclusion marker (D-3, act-bound; never a six-digit claim)',
            'bseSymbol': 'BSE Security Id for dual listings; UNLISTED-BSE marker for governed exclusions',
            'industry': 'arena_taxonomy_submission.csv basicIndustry (published latest, B3 act-bound; systematic-classification limitation disclosed)',
            'sector': 'arena_taxonomy_submission.csv sector (published latest, B3 act-bound)',
            'effectiveFrom': 'NSE listing master DATE OF LISTING (ISO instant); act-bound mapping',
            'lotSize': 'NSE listing master MARKET LOT (verbatim: 2,387 rows at 1, MODTHREAD 50, PRUDMOULI 100, TECILCHEM 50)',
            'companyId': 'D-4 (i) EQ_<TOKEN>_IN derivation from NSE listing master SYMBOL (uppercase alnum only); zero collisions',
            'currency': 'INR (uniform derivation; stated in the act)',
            'listingStatus': 'ACTIVE as-of the act (listing master as-of; no assertion of future status)',
        },
        'inputs': [
            {'label': 'Wave-3 EQ bundle (universe of record + BSE supplied master)', 'path': str(BUNDLE.relative_to(ROOT)), 'sha256': EXPECTED['bundle_sha256']},
            {'label': 'Published latest CSV bundle (B1/B2/B3/B4 classes; limitation-labelled)', 'path': str(PUBLISHED.relative_to(ROOT)), 'sha256': EXPECTED['published_sha256']},
            {'label': 'Verified B2 deposit bridge (exact-ISIN reconstruction)', 'path': str(DEPOSIT_BRIDGE.relative_to(ROOT)), 'sha256': EXPECTED['deposit_bridge_sha256']},
            {'label': 'PA act-bound governed exceptions (D-3/B1)', 'path': str(PA_DECISIONS.relative_to(ROOT)), 'sha256': EXPECTED['pa_decisions_sha256']},
        ],
        'supersedes': WAVE1_SUPERSEDES,
        'residualLimitations': [
            'MCA registry-match authenticity is not establishable inside this repository: successive artifact generations disagree byte-wise (bundle bridge vs 2026-11-08 submission vs 2026-11-08 latest); B1 acceptance rests on the act alone; no independent registry cross-check was performed; the deposit preserves the published classes, never upgrades an attribution',
            'Taxonomy is a systematic-classification claim (1,495 Industrial Products; quota-shaped distribution; one non-codebook label present 1x), accepted for this one-time replacement only; downstream consumers must not re-derive semantics from it',
            'Tick regime is uniform 0.05 under D-9 capacity-exempt limitation disclosure (reference prices omitted; non-compliant with price-linked compliance); re-admission requires price-band evidence',
            '100 NSE-exclusion records are act-bound governed dispositions (absent from the supplied BSE master); they are NOT assertions of permanent exclusivity and are not registry/exchange claims of any kind',
            '58 blank-CIN records are disclosed unlinked exceptions (claims rescinded); 27 governed exemptions and 7 registry alias matches are preserved as separate classes; 9 statutory/government attributions remain non-registry-verified',
            'BSE evidence pinned by instrument=Equity & status=Active in the supplied export; exchange masters as-of the bundle date; future staleness is possible; re-admission requires a fresh export and full revalidation',
        ],
    }

    if args.dropped_at:
        manifest['droppedAt'] = args.dropped_at
    elif not args.check:
        raise SystemExit('--dropped-at <ISO-8601 UTC instant> is required for a build (no clock reads)')

    manifest_checks = {
        'batchId': manifest['batchId'], 'domain': manifest['domain'], 'kind': manifest['kind'],
        'fileChecksumSha256': manifest['fileChecksumSha256'], 'recordCount': manifest['recordCount'],
        'authorizationRef': manifest['authorizationRef'], 'operatingMode': manifest['operatingMode'],
        'selectedTier': manifest['selectedTier'],
    }
    manifest_json = (json.dumps(manifest, indent=2, ensure_ascii=False) + '\n').encode('utf-8')

    if args.check:
        ok = True
        for path, expected in [(CORPUS, corpus_json), (ASSET, asset_body)]:
            try:
                actual = path.read_bytes()
            except FileNotFoundError:
                print(f'MISSING: {path}'); ok = False; continue
            same = actual == expected
            ok = ok and same
            print(f'{"OK " if same else "DRIFT"} {path}')
        try:
            m = json.loads(MANIFEST.read_bytes())
            mchk = {k: m.get(k) for k in manifest_checks}
            if mchk != manifest_checks:
                print(f'DRIFT manifest fields: {mchk} != {manifest_checks}'); ok = False
            else:
                print('OK  manifest fields (droppedAt excluded from byte compare)')
        except FileNotFoundError:
            print(f'MISSING: {MANIFEST}'); ok = False
        sys.exit(0 if ok else 1)

    CORPUS.write_bytes(corpus_json)
    ASSET.write_bytes(asset_body)
    MANIFEST.write_bytes(manifest_json)
    print(f'corpus sha256 {corpus_sha} ({len(corpus_json)} bytes, {len(records)} records)')
    print(f'asset  sha256 {sha256(asset_body)} ({len(asset_body)} bytes)')
    print(f'manifest sha256 {sha256(manifest_json)} ({len(manifest_json)} bytes)')
    print(f'dual {EXPECTED["dual"]} exclusive {EXPECTED["exclusive"]}')

if __name__ == '__main__':
    main()
