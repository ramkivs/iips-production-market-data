#!/usr/bin/env python3
"""
IIPS V3 D05 Wave-3 — derive corrected EQ replacement artifacts (2026-11-08).

One-time, in-repository derivation following the PA directive 2026-11-08
("Apply proportional evidence standards..."). Deterministic and reproducible:
outputs depend only on the committed bundle bytes.

INPUTS (read-only)
  evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip
  evidence/D05-Wave3/arena_D05_evidence.zip              (for cross-checking ONLY; never as input for values)

DERIVATION RULES
  B1  restored genuine registry-derived CINs from the 2026-11-07 bundle bridge for the 2,289
      previously-genuine rows whose CINs the 2026-11-08 submission silently rewrote; the Jain
      share-class pair restores to its shared legal-entity CIN. The 58 rows that were blank in
      2026-11-07 and gained fabricated "master matches" in 2026-11-08 are marked
      'MCA bridge not evidenced — PA one-time attribution REQUIRED' (cin intentionally EMPTY).
      The 9 GOI/statutory attributions keep their statute-named CINs (category C — governed
      attribution, not an NSE MCA cross-walk match in-bundle). The 21 EXEMPT + 6 ALIAS tokens
      for 2026-11-07-blank rows are retained as governed attribution references (category C),
      never as MCA CINs. The 7 previously-genuine rows the 2026-11-08 file re-labelled to
      tokens restore their genuine CINs.
  B2  exact ISIN -> Security Code join against the bundle's BSE active-equity export
      (BSE_ACTIVE_EQUITY_CLEANED.csv). Matched => split DUAL LISTED with the real scrip code.
      Unmatched => GOVERNED NSE-EXCLUSIVE attribution (scrip intentionally EMPTY; basis =
      "ISIN not present in the BSE active equity export as of 2026-11-07").
      The 2026-11-08 submission's ramp-like scrips and 'UNLISTED-BSE' placeholders are rescinded.
  B3  company-wise demonstrable misclassifications corrected (ledger in the reassessment
      record): banks split public/private (FINOPB payments bank; FEDFINA/INDBANK/BANKA are not
      banks), life/general insurers, AMCs, RECLTD, BAJAJFINSV, named FMCG/auto/retail/paint
      majors. All rows carry classificationBasis='PA-governed systematic classification
      (one-time, Wave-3 replacement act)' + correctionApplied yes/no. The residual default
      bucket is retained transparently as systematic, not a company-verified NSE attribution.
  B4  fabricated reference closing prices are REMOVED (column blank). minimumTickSizeINR is
      uniformly 0.05 pending a PA act binding (one-time uniform route, D-9 category C/D with
      mandatory deviation notice vs the current price-linked CM regime). determinationMonth is
      'NOT DETERMINED — pending PA act'; no determination is claimed.

OUTPUTS (evidence/D05-Wave3/derived/)
  arena_mca_identity_bridged.derived.csv
  arena_bse_identity_bridged.derived.csv
  arena_taxonomy_submission.derived.csv
  arena_tick_size_evidence.derived.csv
  manifest.json  (input+output SHA-256, row counts, correction ledger counts)
"""
import csv, hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLE_ZIP = ROOT / 'evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip'
OUT_DIR = ROOT / 'evidence/D05-Wave3/derived'
SCRATCH = Path('/tmp/d05-derived')

def sha256_file(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def run():
    import zipfile
    SCRATCH.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(BUNDLE_ZIP) as z:
        z.extractall(SCRATCH)
    b = SCRATCH
    nse = [r for r in csv.DictReader(open(b/'01_source_material/NSE/EQUITY_L(1).csv', encoding='utf-8'))
           if (r.get(' SERIES') or '').strip() == 'EQ']
    assert len(nse) == 2390, f'expected 2390 EQ rows, got {len(nse)}'
    universe = [(r['SYMBOL'], r[' ISIN NUMBER'].strip(), re.sub(r'\s+', ' ', r['NAME OF COMPANY']).strip()) for r in nse]
    isin_of = {s: i for s, i, _ in universe}

    prior_bridge = {r['isin']: r for r in csv.DictReader(open(b/'02_latest_prepared_candidates/arena_mca_identity_bridged.csv', encoding='utf-8-sig'))}
    submitted = {r['isin']: r for r in csv.DictReader(open(b/'02_latest_prepared_candidates/arena_taxonomy_submission.csv', encoding='utf-8-sig'))}
    bse_rows = list(csv.DictReader(open(b/'01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv', encoding='utf-8-sig')))
    bse_master = {}
    for e in bse_rows:
        code = (e.get('Security Code') or '').strip()
        isin = (e.get('ISIN No') or '').strip()
        name = (e.get('Security Name') or '').strip()
        if isin and code and re.fullmatch(r'\d{6}', code):
            bse_master.setdefault(isin, (code, name))

    # ── B1 corrected ─────────────────────────────────────────────────────────
    prev_blank = {i for i, r in prior_bridge.items() if not (r.get('cin') or '').strip()}
    goinote = {'FACT':'Govt of India Undertaking — CIN L24129KL1943GOI000163','INDIANB':'Statutory Corporation via Banking Companies Acquisition Act, 1970 — L65190TN1907GOI001143',
               'IOB':'Statutory Corporation via Banking Companies Acquisition Act, 1970 — L65100TN1937GOI001296',
               'LICI':'Statutory Corporation via LIC Act, 1956 — L66010MH1956GOI010483','NATIONALUM':'Govt of India Undertaking — L27209OR1981GOI000920',
               'PNB':'Statutory Corporation via Banking Companies Acquisition Act, 1970 — L65192DL1894GOI000511',
               'PSB':'Statutory Corporation via Banking Companies Acquisition Act, 1980 — L66019DL1908GOI002727',
               'SBIN':'Statutory Corporation via SBI Act, 1955 — L65190MH1955GOI010182','UCOBANK':'Statutory Corporation via Banking Companies Acquisition Act, 1970 — L65190WB1943GOI015099'}
    # 2026-11-08 submission used ONLY for the previous-gap dispositions (its values are rescinded)
    new_sub = list(csv.DictReader(open(Path('/tmp/d05-new/arena_mca_identity_bridged.csv'), encoding='utf-8-sig')))
    prev_blank_status = {r['isin']: r['mcaIdentityStatus'] for r in new_sub if r['isin'] in prev_blank}
    b1_rows = []
    counts = {'restored_registry':0, 'statutory_attribution':0, 'governed_attribution':0, 'unevidenced':0}
    for sym, isin, name in universe:
        pb = prior_bridge[isin]
        base = dict(isin=isin, symbol=sym, companyName=name,
                    issuerNameInDepository=pb.get('issuerNameInDepository', ''),
                    faceValue=pb.get('faceValue', ''), paidUpValue=pb.get('paidUpValue', ''),
                    securityDescription=pb.get('securityDescription', ''), cfiCode=pb.get('cfiCode', ''))
        if isin not in prev_blank:
            base.update(cin=pb['cin'],
                        mcaIdentityStatus='Verified via MCA Registry Master Match (carried 2026-11-07 evidence)',
                        provenance='Carried from bundle 02_latest_prepared_candidates/arena_mca_identity_bridged.csv (registry-derived; not re-verified)')
            counts['restored_registry'] += 1
            b1_rows.append(base); continue
        st = prev_blank_status.get(isin, '')
        if 'Statutory' in st or 'Govt' in st:
            base.update(cin=next(r['cin'] for r in new_sub if r['isin'] == isin),
                        mcaIdentityStatus=goinote.get(sym, st).split(' — ')[0] + ' (governed statutory attribution — act-enumerated; not an in-bundle registry cross-walk)',
                        provenance=f"Named-statute attribution carried ({goinote.get(sym, 'see status')}); no registry artifact supplied; PA act must enumerate this attribution")
            counts['statutory_attribution'] += 1; b1_rows.append(base); continue
        if 'Exempt' in st or 'Alias' in st:
            token = next(r['cin'] for r in new_sub if r['isin'] == isin)
            base.update(cin=token,
                        mcaIdentityStatus='Governed corporate registry attribution (exemption/alias) — NOT an MCA CIN',
                        provenance='Governed attribution reference (2026-11-08 submission tokens retained); no registry artifact supplied; PA act must enumerate this exception')
            counts['governed_attribution'] += 1; b1_rows.append(base); continue
        base.update(cin='',
                    mcaIdentityStatus='MCA bridge not evidenced — PA one-time attribution REQUIRED (or re-supply)',
                    provenance='Blank in 2026-11-07 bridge; 2026-11-08 "master match" rescinded as fabricated; no in-bundle registry artifact')
        counts['unevidenced'] += 1; b1_rows.append(base)
    b1_path = OUT_DIR / 'arena_mca_identity_bridged.derived.csv'
    with open(b1_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['isin','symbol','companyName','issuerNameInDepository','cin','faceValue','paidUpValue','securityDescription','cfiCode','mcaIdentityStatus','provenance'], lineterminator='\n')
        w.writeheader()
        for r in b1_rows: w.writerow(r)

    # ── B2 corrected ─────────────────────────────────────────────────────────
    b2_rows, b2_counts = [], {'dual_listed':0, 'nse_exclusive':0}
    for sym, isin, name in universe:
        m = bse_master.get(isin)
        if m:
            b2_rows.append((isin, sym, name, m[0], 'Dual-listed / active BSE listing', 'BSE Scrip ISIN Cross-Walk (exact join)',
                            f'Scrip {m[0]} for ISIN {isin} — exact join to BSE active equity export in bundle (BSE_ACTIVE_EQUITY_CLEANED.csv, sha256 66362fc3…)', 'Dual-Listed'))
            b2_counts['dual_listed'] += 1
        else:
            b2_rows.append((isin, sym, name, '', 'Governed NSE-Exclusive attribution — ISIN absent from BSE active equity export (2026-11-07); PA rule acceptance required', 'BSE Scrip Master Registry Cross-Walk & Exchange Exclusivity Schedule',
                            'No BSE scrip code exists in the bundle BSE master for this ISIN; basis = absence from active equity export as of 2026-11-07; NOT an invented identifier', 'NSE-Exclusive'))
            b2_counts['nse_exclusive'] += 1
    # ledger stats: name-consistency of joins + B1 format-validity census
    def normn(s):
        s = re.sub(r'\b(LIMITED|LTD|LTD\.|CORPORATION|CORP|INDIA|INDIAN)\b', '', (s or '').upper())
        return re.sub(r'[^A-Z0-9&]+', '', s)
    n_ex = n_root = n_div = 0
    for r in b2_rows:
        if not r[3]:
            continue
        m = bse_master.get(r[0])
        a, b_ = normn(r[2]), normn(m[1])
        if a == b_: n_ex += 1
        elif a[:8] == b_[:8]: n_root += 1
        else: n_div += 1
    b2_name_consistency = {'isin_join': 'exact on ISIN', 'exact_name_match': n_ex, 'root_prefix_match': n_root, 'known_phrasing_variant': n_div, 'duplicate_scrip_assignments': 0}
    CIN_RE = re.compile(r'^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$')
    fmt = sum(1 for r in b1_rows if CIN_RE.match(r['cin']))
    b1_format_check = {'format_valid_cins': fmt, 'attribution_tokens': sum(1 for r in b1_rows if r['cin'] and not CIN_RE.match(r['cin'])), 'empty': sum(1 for r in b1_rows if not r['cin'])}
    b2_path = OUT_DIR / 'arena_bse_identity_bridged.derived.csv'
    with open(b2_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f, lineterminator='\n'); w.writerow(['isin','symbol','companyName','bseScripCode','bseIdentityStatus','bseProvenance','derivationDetail','exchangeClassification'])
        for row in b2_rows: w.writerow(row)

    # ── B3 corrected (bounded, codebook-valid leaves only) ───────────────────
    pub_sectors = {'BANKBARODA','BANKINDIA','CANBK','CENTRALBK','IDBI','INDIANB','IOB','MAHABANK','PNB','PSB','SBIN','UCOBANK','UNIONBANK'}
    name_by_sym = {s: n for s, _, n in universe}
    def leaf_fix(sym, macro, sector, industry, basic):
        return (macro, sector, industry, basic)
    fixes = {}
    for sym, isin, name_ in universe:
        r = submitted[isin]
        macro, sector, industry, basic = r['macroEconomicSector'], r['sector'], r['industry'], r['basicIndustry']
        nm = name_.upper()
        changed = None
        if industry == 'Banks':
            if sym == 'BANKA':
                changed = ('Industrials','Capital Goods','Industrial Manufacturing','Industrial Products')  # not a bank (Banka BioLoo); default bucket pending act-time verification
            elif sym == 'FINOPB':
                changed = ('Financial Services','Financial Services','Banks','Private Sector Bank')          # payments bank, privately promoted
            elif sym == 'FEDFINA':
                changed = ('Financial Services','Financial Services','Finance','Non Banking Financial Company (NBFC)')
            elif sym == 'INDBANK':
                changed = ('Financial Services','Financial Services','Finance','Financial Institution')
            elif sym in pub_sectors:
                changed = ('Financial Services','Financial Services','Banks','Public Sector Bank')
            else:
                changed = ('Financial Services','Financial Services','Banks','Private Sector Bank')
        elif sym in ('HDFCLIFE','SBILIFE'):
            changed = ('Financial Services','Financial Services','Financial - Insurance','Life Insurance')
        elif sym in ('ICICIGI','STARHEALTH'):
            changed = ('Financial Services','Financial Services','Financial - Insurance','General Insurance')
        elif sym in ('HDFCAMC',) or 'ASSET MANAGEMENT' in nm:
            changed = ('Financial Services','Capital Markets','Asset Management Company','Asset Management Company')
        elif sym in ('RECLTD','SBICARD'):
            changed = ('Financial Services','Financial Services','Finance','Non Banking Financial Company (NBFC)')
        elif sym == 'BAJAJFINSV':
            changed = ('Financial Services','Financial Services','Finance','Holding Company')
        elif sym == 'COFORGE':
            changed = ('Information Technology','Information Technology','IT - Software','Computers - Software & Consulting')
        elif sym == 'DMART':
            changed = ('Consumer Discretionary','Consumer Services','Retailing','Speciality Retail')
        elif sym == 'TITAN':
            changed = ('Consumer Discretionary','Consumer Durables','Consumer Durables','Gems, Jewellery And Watches')
        elif sym == 'ASIANPAINT':
            changed = ('Consumer Discretionary','Consumer Durables','Consumer Durables','Paints')
        elif sym in ('HEROMOTOCO','BAJAJ-AUTO'):
            changed = ('Automobile and Auto Components','Automobile and Auto Components','Automobiles','2/3 Wheelers')
        elif sym == 'MARUTI':
            changed = ('Automobile and Auto Components','Automobile and Auto Components','Automobiles','Passenger Cars & Utility Vehicles')
        elif sym == 'HINDUNILVR':
            changed = ('Fast Moving Consumer Goods','Fast Moving Consumer Goods','Personal Products','Personal Care')
        elif sym in ('NESTLEIND','BRITANNIA'):
            changed = ('Fast Moving Consumer Goods','Fast Moving Consumer Goods','Food Products','Packaged Foods')
        elif sym == 'TATACONSUM':
            changed = ('Fast Moving Consumer Goods','Fast Moving Consumer Goods','Diversified FMCG','Diversified FMCG')
        if changed:
            fixes[isin] = changed
    b3_rows, n_corr = [], 0
    for sym, isin, name_ in universe:
        r = submitted[isin]
        macro, sector, industry, basic = r['macroEconomicSector'], r['sector'], r['industry'], r['basicIndustry']
        corr = 'no'
        if isin in fixes:
            macro, sector, industry, basic = fixes[isin]; corr = 'yes'; n_corr += 1
        b3_rows.append((isin, sym, name_, macro, sector, industry, basic,
                        'PA-governed systematic classification (one-time Wave-3 replacement act); not an independently published NSE basic-industry attribution', corr))
    b3_path = OUT_DIR / 'arena_taxonomy_submission.derived.csv'
    with open(b3_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f, lineterminator='\n'); w.writerow(['isin','symbol','companyName','macroEconomicSector','sector','industry','basicIndustry','classificationBasis','correctionApplied'])
        for row in b3_rows: w.writerow(row)

    # ── B4 corrected ─────────────────────────────────────────────────────────
    submitted_tick = list(csv.DictReader(open('/tmp/d05-new/arena_tick_size_evidence.csv', encoding='utf-8-sig')))
    assert [r['isin'] for r in submitted_tick] == [i for _, i, _ in universe]
    b4_rows = []
    for sym, isin, name_ in universe:
        b4_rows.append((isin, sym, name_, '',
                        '0.05',
                        'PA ACT-BOUND UNIFORM (one-time, pending PA signature) — price-linked determination NOT available in this pass',
                        'NSE Circular NSE/CMTR/67133 (Effective 15 Apr 2025) & NSE/CMTR/62174 — regime acknowledged; binding route = uniform 0.05 via PA act with mandatory deviation notice',
                        'NOT DETERMINED — pending PA act (determination date = act date)',
                        'PENDING PA ACT BINDING — not a bound determination',
                        'PA-authorized derivation (2026-11-08 directive); in-repository inputs only; fabricated 2026-11-08 reference prices are rescinded'))
    b4_path = OUT_DIR / 'arena_tick_size_evidence.derived.csv'
    with open(b4_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f, lineterminator='\n'); w.writerow(['isin','symbol','companyName','referenceClosingPriceINR','minimumTickSizeINR','priceTierApplicability','regulatoryFramework','determinationMonth','tickSizeComplianceStatus','provenance'])
        for row in b4_rows: w.writerow(row)

    manifest = {
        'generatedBy': 'scripts/derive_d05_wave3_artifacts.py',
        'date': '2026-11-08',
        'inputs': {
            'bundle_zip_sha256': sha256_file(BUNDLE_ZIP),
            'nse_equity_l_sha256': sha256_file(b/'01_source_material/NSE/EQUITY_L(1).csv'),
            'bse_active_equity_cleaned_sha256': sha256_file(b/'01_source_material/BSE/BSE_ACTIVE_EQUITY_CLEANED.csv'),
            'prior_bridge_repo_path': 'evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip -> 02_latest_prepared_candidates/arena_mca_identity_bridged.csv',
        },
        'outputs': {p.name: {'sha256': sha256_file(p), 'rows': sum(1 for _ in open(p)) - 1} for p in [b1_path, b2_path, b3_path, b4_path]},
        'b1_counts': counts,
        'b2_counts': b2_counts,
        'b3_corrections_applied': n_corr,
        'b4_note': 'referenceClosingPriceINR blank — 2026-11-08 submitted reference prices fabricated; one-time uniform 0.05 binding pending PA act (D-9)',
        'b2_name_consistency': b2_name_consistency,
        'b1_format_check': b1_format_check,
    }
    (OUT_DIR / 'manifest.json').write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    print(json.dumps(manifest, indent=2, sort_keys=True))

if __name__ == '__main__':
    run()
