#!/usr/bin/env python3
"""
D05 — deterministic derivation of the governed deposit input (2026-11-08 act).

Act-bindings consumed:
  D-1 / B1/B2/B3/B4/D-4/D-9 of IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT

Inputs (all committed and sha256-pinned):
  1. evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip
       members: 01_source_material/NSE/EQUITY_L(1).csv (universe of record: NSE CM EQ)
                01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv (BSE master; D-3 scope = supplied master)
  2. evidence/D05-Wave3/arena_B05_latestcsvs.zip
       member: arena_mca_identity_bridged.csv   (CIN values verbatim — B1 acceptance classes)
       member: arena_taxonomy_submission.csv    (sector/industry verbatim — B3 acceptance)

Outputs (evidence/D05-Wave3/deposit-2026-11-08/):
  arena_bse_identity_bridged.deposit.csv   verified B2 bridge (exact-ISIN join; 100 governed exclusions)
  pa_decisions.json                        act-bound governed exceptions for the source-readiness tool
  field_sources.csv                        per-record field provenance annex
  universe_facts.json                      reconstruction counts and bindings for the act
  sha256s.txt                              sha256 of every emitted file

Determinism: no clock, no network, no randomness; identical inputs -> byte-identical outputs.
"""
import csv, hashlib, io, json, re, sys, zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUNDLE = ROOT / 'evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip'
PUBLISHED = ROOT / 'evidence/D05-Wave3/arena_B05_latestcsvs.zip'
OUT = ROOT / 'evidence/D05-Wave3/deposit-2026-11-08'

def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def read_csv_zip(z: zipfile.ZipFile, member: str) -> list[dict[str, str]]:
    with z.open(member) as fh:
        text = fh.read().decode('utf-8-sig')
    return list(csv.DictReader(text.splitlines()))

def main() -> None:
    bundle_sha = sha256_bytes(BUNDLE.read_bytes())
    published_sha = sha256_bytes(PUBLISHED.read_bytes())
    bz = zipfile.ZipFile(BUNDLE)
    pz = zipfile.ZipFile(PUBLISHED)

    nse_rows = [r for r in read_csv_zip(bz, '01_source_material/NSE/EQUITY_L(1).csv') if (r.get(' SERIES') or r.get('SERIES') or '').strip() == 'EQ']
    sym_k = next(k for k in nse_rows[0] if k.strip() == 'SYMBOL')
    name_k = next(k for k in nse_rows[0] if k.strip() == 'NAME OF COMPANY')
    isin_k = next(k for k in nse_rows[0] if k.strip() == 'ISIN NUMBER')
    date_k = next(k for k in nse_rows[0] if k.strip() == 'DATE OF LISTING')
    lot_k = next(k for k in nse_rows[0] if k.strip() == 'MARKET LOT')
    fv_k = next(k for k in nse_rows[0] if k.strip() == 'FACE VALUE')
    nse_sha = sha256_bytes(BUNDLE.read_bytes())  # referenced via bundle pin; EQ filter pinned in act

    # BSE supplied master; strict six-digit numerics only
    bse_master: dict[str, tuple[str, str, str]] = {}
    for e in read_csv_zip(bz, '01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv'):
        isin = (e.get('ISIN No') or '').strip().upper()
        code = (e.get('Security Code') or '').strip()
        sid = (e.get('Security Id') or '').strip()
        inst = (e.get('Instrument') or '').strip().lower()
        if isin and re.fullmatch(r'\d{6}', code) and inst == 'equity':
            bse_master[isin] = (code, sid, e.get('Security Name') or '')

    # latest (act-accepted, limitation-labelled) MCA and taxonomy bytes — verbatim
    mca_rows = read_csv_zip(pz, 'arena_mca_identity_bridged.csv')
    tax_rows = read_csv_zip(pz, 'arena_taxonomy_submission.csv')
    mca_by_isin = {r['isin'].strip().upper(): r for r in mca_rows}
    tax_by_isin = {r['isin'].strip().upper(): r for r in tax_rows}

    def norm_token(symbol: str) -> str:
        return re.sub(r'[^A-Z0-9]', '', symbol.upper())

    dual = exclusive = 0
    bse_buf = io.StringIO()
    bse_w = csv.writer(bse_buf, lineterminator='\n')
    bse_w.writerow(['isin','symbol','companyName','bseScripCode','bseIdentityStatus','exchangeClassification','bseProvenance'])
    excluded_isins: list[str] = []
    facts_lot_exceptions = []
    listing_dates: list[datetime] = []
    fv_values: set[str] = set()
    for r in nse_rows:
        isin = r[isin_k].strip().upper()
        sym = r[sym_k].strip()
        nm = r[name_k].strip()
        dt = datetime.strptime(r[date_k].strip(), '%d-%b-%Y')
        listing_dates.append(dt)
        fv_values.add(r[fv_k].strip())
        if int(r[lot_k].strip() or '1') != 1:
            facts_lot_exceptions.append({'symbol': sym, 'isin': isin, 'lotSize': int(r[lot_k])})
        hit = bse_master.get(isin)
        if hit:
            code, sid, _ = hit
            dual += 1
            bse_w.writerow([
                isin, sym, nm, code,
                'Verified via BSE Scrip Master ISIN Cross-Walk Match (supplied active-equity export, sha-pinned bundle member, exact-ISIN reconstruction 2026-11-08)',
                'Dual-Listed / Active BSE Listing',
                'BSE active-equity export (instrument=Equity, status=Active, six-digit numerics); exact-ISIN join; act-bound D-3 verification of the 2290 matched records',
            ])
        else:
            exclusive += 1
            excluded_isins.append(isin)
            bse_w.writerow([
                isin, sym, nm, 'UNLISTED-BSE',
                'Governed NSE-Exclusive Disposition Prepared (D-3, Pending Sign-off)',
                'NSE-Exclusive / Governed Disposition Prepared (Not Yet Effective)',
                'No Security Code matched this ISIN in the supplied BSE active-equity export (exact-ISIN reconstruction 2026-11-08); exclusion bound FOR THIS ONE-TIME REPLACEMENT by the 2026-11-08 act; NOT an assertion of permanent exclusivity; admission review required before reuse',
            ])

    bse_csv = bse_buf.getvalue()

    mca_unlinked = sorted(r['isin'].strip().upper() for r in mca_rows if not r['cin'].strip())
    mca_exempt = sorted(r['isin'].strip().upper() for r in mca_rows if r['cin'].startswith('EXEMPT-STRUCT'))
    mca_alias = sorted(r['isin'].strip().upper() for r in mca_rows if r['cin'].startswith('ALIAS-MATCH'))
    pa_decisions = {
        'authorizationRef': 'IIPS-PA-DIRECTIVE-2026-11-08-FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT',
        'effectiveDate': '2026-11-08',
        'bseExclusionIsins': sorted(excluded_isins),
        'mcaExemptionIsins': mca_exempt,
        'mcaAliasIsins': mca_alias,
        'mcaUnlinkedRescindedIsins': mca_unlinked,
        'faceValueSource': 'NSE_LISTING_MASTER',
    }

    fs_buf = io.StringIO()
    fs_w = csv.writer(fs_buf, lineterminator='\n')
    fs_w.writerow(['isin','companyId','nseSymbol','nseListingMaster','faceValue_source','lotSize_source','tickSize_source','cin_source','cin_class','bseScripCode_source','bseSymbol_source','industry_source','sector_source','currency_source','listingStatus_source','effectiveFrom_source','companyId_source'])
    for r in nse_rows:
        isin = r[isin_k].strip().upper()
        sym = r[sym_k].strip()
        companyId = f'EQ_{norm_token(sym)}_IN'
        mcAr = mca_by_isin[isin]
        if not mcAr['cin'].strip():
            mc_cls, mc_src = 'MCA_UNLINKED_UNSUPPORTED_CLAIM_RESCINDED', 'arena_mca_identity_bridged.csv (blank CIN — B1 disclosed unlinked exception; no claim)'
        elif mcAr['cin'].startswith('EXEMPT-STRUCT'):
            mc_cls, mc_src = 'MCA_GOVERNED_EXEMPTION', 'arena_mca_identity_bridged.csv (governed exemption token — never a registry match)'
        elif mcAr['cin'].startswith('ALIAS-MATCH'):
            mc_cls, mc_src = 'MCA_ALIAS_MATCH', 'arena_mca_identity_bridged.csv (registry alias match — never a direct MCA registry match)'
        elif re.fullmatch(r'^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$', mcAr['cin'].strip()):
            mc_cls, mc_src = 'MCA_REGISTRY_MASTER_MATCH_CLAIM_ACT_BOUND', 'arena_mca_identity_bridged.csv (registry-master-match claim as published; accepted by B1 act, authenticity limitation disclosed)'
        else:
            mc_cls, mc_src = 'MCA_STATUTORY_GOVERNMENT', 'arena_mca_identity_bridged.csv (statutory/government attribution — not represented as a direct registry match)'
        hit = bse_master.get(isin)
        if hit:
            bs_src = 'BSE active-equity export (exact-ISIN join to Security Code; pinned supplied master)'
            ss_src = 'BSE active-equity export (Security Id; pinned supplied master)'
        else:
            bs_src = 'UNLISTED-BSE (D-3 governed exclusion; not present in supplied BSE master)'
            ss_src = bs_src
        taxAr = tax_by_isin[isin]
        fs_w.writerow([
            isin, companyId, sym,
            'EQUITY_L(1).csv (CM EQ tier, pinned bundle member)', 'EQUITY_L(1).csv FACE VALUE', 'EQUITY_L(1).csv MARKET LOT',
            'D-9 uniform 0.05 (capacity-exempt limitation disclosure; reference prices omitted; act-bound)',
            mc_src, mc_cls, bs_src, ss_src,
            f"arena_taxonomy_submission.csv basicIndustry={taxAr['basicIndustry']} (B3 act-bound; systematic-classification limitation disclosed)",
            f"arena_taxonomy_submission.csv sector={taxAr['sector']} (B3 act-bound)",
            'INR uniform derivation, stated in the deposit act (D05 CM INR universe)',
            'ACTIVE as-of listing master (act as-of)',
            f"EQUITY_L(1).csv DATE OF LISTING={r[date_k].strip()}",
            'D-4 (i) EQ_<TOKEN>_IN derivation from NSE listing master SYMBOL (alnum uppercase)',
        ])

    universe_facts = {
        'recordCount': len(nse_rows),
        'dualListed': dual,
        'nseExclusiveGovernedExclusions': exclusive,
        'exclusionIsinsSha256': sha256_bytes('\n'.join(sorted(excluded_isins)).encode()),
        'listingDateRange': {'min': min(listing_dates).strftime('%Y-%m-%d'), 'max': max(listing_dates).strftime('%Y-%m-%d')},
        'faceValueDistinct': sorted(fv_values, key=lambda v: (len(v), v)),
        'marketLotNonUnitRows': facts_lot_exceptions,
        'inputs': {
            'bundle': {'path': str(BUNDLE.relative_to(ROOT)), 'sha256': bundle_sha},
            'published_latest': {'path': str(PUBLISHED.relative_to(ROOT)), 'sha256': published_sha},
            'nse_entry_count_eq': len(nse_rows),
            'bse_master_equity_rows': len(bse_master),
        },
    }

    OUT.mkdir(exist_ok=True)
    outputs = {
        'arena_bse_identity_bridged.deposit.csv': bse_csv.encode('utf-8'),
        'pa_decisions.json': (json.dumps(pa_decisions, indent=2) + '\n').encode('utf-8'),
        'field_sources.csv': fs_buf.getvalue().encode('utf-8'),
        'universe_facts.json': (json.dumps(universe_facts, indent=2) + '\n').encode('utf-8'),
    }
    (OUT / 'arena_bse_identity_bridged.deposit.csv').write_bytes(outputs['arena_bse_identity_bridged.deposit.csv'])
    (OUT / 'pa_decisions.json').write_bytes(outputs['pa_decisions.json'])
    (OUT / 'field_sources.csv').write_bytes(outputs['field_sources.csv'])
    (OUT / 'universe_facts.json').write_bytes(outputs['universe_facts.json'])
    sha_lines = [f'{sha256_bytes(b)}  {name}' for name, b in sorted(outputs.items())]
    sha_txt = '\n'.join(sha_lines) + '\n'
    (OUT / 'sha256s.txt').write_bytes(sha_txt.encode('utf-8'))
    print(sha_txt)
    print(f'records={len(nse_rows)} dual={dual} exclusive={exclusive} sha256s written to {OUT}')

if __name__ == '__main__':
    main()
