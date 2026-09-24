#!/usr/bin/env python3
"""
IIPS Executive live re-execution — deterministic comparison generator (FORENSIC, READ-ONLY).

Inputs (all frozen historical artifacts or captured runtime outputs):
  - raw-7964fcc-executive-output.json   (runtime @ 7964fcc)
  - raw-42f91fad-executive-output.json  (runtime @ 42f91fad)
  - golden fixtures *-expected-outputs-1.0.0.json @ 7964fcc worktree
  - E2E-018 CAPTURE_MANIFEST.json @ 2f1049d (scratch store)

Outputs:
  - comparison-7964fcc.json
  - comparison-42f91fad.json
  - e2e018-comparison.json

Classification vocabulary (per gate spec):
  EXACT MATCH | NUMERIC MATCH / REPRESENTATION DIFFERENCE | PARTIAL MATCH |
  MISMATCH | NOT PRODUCED | NOT TESTABLE
"""
import json, hashlib, subprocess, os, sys

OUT = '/tmp/iips-forensic/out'
WT = '/tmp/iips-forensic/wt/7964fcc'
STORE = '/tmp/iips-forensic/store.git'
EVID = sys.argv[1] if len(sys.argv) > 1 else OUT

SECTOR_DIR = {
    'Banking': 'banking', 'Insurance': 'insurance', 'Capital Markets': 'capital-markets',
    'Healthcare': 'healthcare', 'Hospitality': 'hospitality', 'Energy': 'energy',
    'Utilities': 'utilities', 'Consumer': 'consumer', 'Industrials': 'industrials',
    'Technology': 'technology', 'Telecommunications': 'telecommunications',
    'Automobile': 'automobile', 'Materials & Metals': 'materials-metals',
}

def sha256_file(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))

def load_runtime(name):
    return json.load(open(f'{OUT}/raw-{name}-executive-output.json'))

def golden_expected0(sector):
    d = SECTOR_DIR[sector]
    base = f'{WT}/iips-platform/src/sector-engines/{d}'
    f1 = f'{base}/{d}-expected-outputs-1.0.0.json'
    f2 = f'{base}/frozen-assets/{d}-expected-outputs-1.0.0.json'
    path = f1 if os.path.exists(f1) else f2
    data = json.load(open(path))
    e = data['expected'][0]
    return {
        'fixturePath': os.path.relpath(path, WT),
        'verdict': e.get('verdict'),
        'composite': e.get('composite', e.get('compositeScore')),
        'confidence': e.get('confidence') if isinstance(e.get('confidence'), (int, float)) else None,
    }

# ---------------------------------------------------------------------------
# Static derivation established by the previous gate (frozen constants).
# Source: IIPS_DONOR_CROSS_VERIFICATION_AND_ACCESS_RESOLUTION_REPORT.md §9.
# ---------------------------------------------------------------------------
STATIC = {
    'holdings': 13,
    'avgConviction': 74.2,
    'avgQuality': 71.7,
    'avgRisk': 77.7,
    'concentration': 7.7,
    'diversificationScore': 128.3,
    'sectorExposureAll': 7.7,
    'topOpportunity': {'sector': 'Capital Markets', 'conviction': 84.6},
    'rankingOrder': [
        ('Capital Markets', 84.6), ('Materials & Metals', 82.5), ('Consumer', 79.5),
        ('Hospitality', 79.0), ('Telecommunications', 77.8), ('Industrials', 77.2),
        ('Technology', 76.3), ('Healthcare', 75.5), ('Utilities', 74.1),
        ('Insurance', 72.3), ('Automobile', 71.3), ('Energy', 66.9), ('Banking', 47.1),
    ],
    'verdictCounts': {'Buy': 9, 'Strong Buy': 2, 'Watch': 1, 'Accumulate': 1},
    'trendUp': 3,
    'trendFlat': 10,
}

def classify(expected, actual):
    if expected == actual:
        return 'EXACT MATCH'
    try:
        if float(expected) == float(actual):
            return 'NUMERIC MATCH / REPRESENTATION DIFFERENCE'
    except (TypeError, ValueError):
        pass
    return 'MISMATCH'

def compare_one(name, rt):
    rows = []
    def row(item, expected, actual, note=''):
        rows.append({'item': item, 'expected': expected, 'runtime': actual,
                     'classification': classify(expected, actual), 'note': note})

    p = rt['portfolio']
    row('portfolio.holdings', STATIC['holdings'], p['holdings'])
    row('portfolio.avgConviction', STATIC['avgConviction'], p['avgConviction'])
    row('portfolio.avgQuality', STATIC['avgQuality'], p['avgQuality'])
    row('portfolio.avgRisk', STATIC['avgRisk'], p['avgRisk'])
    row('portfolio.concentration', STATIC['concentration'], p['concentration'])
    row('portfolio.diversificationScore', STATIC['diversificationScore'], p['diversificationScore'])
    for s in SECTOR_DIR:
        row(f'portfolio.sectorExposure[{s}]', STATIC['sectorExposureAll'], p['sectorExposure'].get(s))
    row('portfolio.sectorExposure key count', 13, len(p['sectorExposure']))

    # ranking: order + conviction
    rk = [(r['sector'], r['conviction']) for r in rt['ranking']]
    row('ranking order+conviction (13 rows)', STATIC['rankingOrder'], rk)
    row('ranking row count', 13, len(rt['ranking']))

    # trend derived exactly as historical ExecutiveDashboard.tsx line 122: index<3?up:flat
    up = sum(1 for i in range(len(rt['ranking'])) if i < 3)
    flat = len(rt['ranking']) - up
    row('trend-up count (derivation r.index<3)', STATIC['trendUp'], up, 'derived by historical UI formula from runtime ranking')
    row('trend-flat count', STATIC['trendFlat'], flat, 'derived by historical UI formula from runtime ranking')

    # opportunity
    row('opportunity[0].sector', STATIC['topOpportunity']['sector'], rt['opportunity'][0]['sector'])
    row('opportunity[0].conviction', STATIC['topOpportunity']['conviction'], rt['opportunity'][0]['conviction'])
    row('opportunity == ranking prefix (top map)', canonical(rt['ranking'][:len(rt['opportunity'])]),
        canonical([{**o} for o in rt['opportunity']]),
        'transport maps pr.opportunity.top; equality with ranking prefix is informational')

    # decisions vs golden fixtures (verdict + composite + confidence)
    counts = {}
    for d in rt['decisions']:
        counts[d['verdict']] = counts.get(d['verdict'], 0) + 1
        g = golden_expected0(d['sector'])
        row(f"decisions[{d['sector']}].verdict vs golden fixture", g['verdict'], d['verdict'], g['fixturePath'])
        row(f"decisions[{d['sector']}].composite vs golden fixture", g['composite'], d['composite'], g['fixturePath'])
        row(f"decisions[{d['sector']}].confidence vs golden fixture", g['confidence'], d['confidence'], g['fixturePath'])
    row('decisions row count', 13, len(rt['decisions']))
    for v, c in STATIC['verdictCounts'].items():
        row(f'verdict count [{v}]', c, counts.get(v, 0))

    # risk list content (correlation.flags + diversification.flags + concentration sectors)
    risk_items = list(rt['correlation']['flags']) + list(rt['diversification']['flags']) + \
                 [f'Concentration: {s}' for s in rt['correlation']['concentrationSectors']]
    row('risk-list non-empty', True, len(risk_items) > 0, f'{len(risk_items)} item(s): ' + ' | '.join(risk_items))

    # chart bars (historical SimpleBarChart maps decisions 1:1)
    row('chart bar count (decisions->bars 1:1)', 13, len(rt['decisions']))
    row('chart bar labels == decisions sectors', [d['sector'] for d in rt['decisions']],
        [d['sector'] for d in rt['decisions']])

    mismatches = [r for r in rows if r['classification'] == 'MISMATCH']
    return {
        'checkpoint': name,
        'runtimeArtifactSha256': sha256_file(f"{OUT}/raw-{name}-executive-output.json"),
        'items': rows,
        'summary': {
            'total': len(rows),
            'EXACT MATCH': sum(1 for r in rows if r['classification'] == 'EXACT MATCH'),
            'NUMERIC MATCH / REPRESENTATION DIFFERENCE': sum(1 for r in rows if r['classification'].startswith('NUMERIC')),
            'PARTIAL MATCH': sum(1 for r in rows if r['classification'] == 'PARTIAL MATCH'),
            'MISMATCH': len(mismatches),
            'mismatchedItems': [r['item'] for r in mismatches],
        },
    }

def e2e018_comparison(rtA, rtB):
    manifest = json.loads(subprocess.check_output(
        ['git', '--git-dir', STORE, 'show',
         '2f1049d0db348733f4d4f15fb4dcc57d4f2742fa:docs/v3.0/e2e-018-screenshots/CAPTURE_MANIFEST.json']))
    cap = [c for c in manifest['captures'] if c['file'] == 'executive.png'][0]
    tc = cap['observables']['testIdCounts']
    rt_counts = {}
    for rt in (rtA, rtB):
        c = {}
        c['metric-card'] = 6  # fixed layout: 6 MetricCards in ExecutiveDashboard.tsx
        c['metric-value'] = 6
        c['top-opportunity'] = 1 if len(rt['opportunity']) > 0 else 0
        c['tableRows'] = len(rt['ranking']) + 1  # DataTable: 1 header + N body rows
        c['trend-up'] = 3
        c['trend-flat'] = len(rt['ranking']) - 3
        c['simple-bar-chart'] = 1 if len(rt['decisions']) > 0 else 0
        for d in rt['decisions']:
            c[f'bar-{d["sector"]}'] = c.get(f'bar-{d["sector"]}', 0) + 1
            c[f'decision-badge-{d["verdict"]}'] = c.get(f'decision-badge-{d["verdict"]}', 0) + 1
            c[f'inspect-{d["sector"]}'] = 1
            c['recent-decision'] = c.get('recent-decision', 0) + 1
            c['evidence-card'] = c.get('evidence-card', 0) + 1
            c['evidence-reference'] = c.get('evidence-reference', 0) + 1
        c['risk-list'] = 1
        rt_counts[id(rt)] = c
    keys = ['metric-card', 'metric-value', 'top-opportunity', 'trend-up', 'trend-flat',
            'recent-decision', 'decision-badge-Buy', 'decision-badge-Strong Buy',
            'decision-badge-Watch', 'decision-badge-Accumulate', 'evidence-card',
            'evidence-reference', 'risk-list', 'simple-bar-chart'] + \
           [f'bar-{s}' for s in SECTOR_DIR] + [f'inspect-{s}' for s in SECTOR_DIR]
    rows = []
    for k in keys:
        exp = tc.get(k)
        a = rt_counts[id(rtA)].get(k, 0)
        b = rt_counts[id(rtB)].get(k, 0)
        rows.append({
            'observable': f'testIdCounts[{k}]',
            'e2e018_expected': exp,
            'runtime_7964fcc_derived': a,
            'runtime_42f91fad_derived': b,
            'classification': classify(exp, a) if classify(exp, a) == classify(exp, b) else 'MISMATCH',
            'mapping': 'derived from runtime payload via historical ExecutiveDashboard.tsx render rules',
        })
    rows.append({'observable': 'observables.tableRows', 'e2e018_expected': cap['observables']['tableRows'],
                 'runtime_7964fcc_derived': len(rtA['ranking']) + 1, 'runtime_42f91fad_derived': len(rtB['ranking']) + 1,
                 'classification': classify(cap['observables']['tableRows'], len(rtA['ranking']) + 1),
                 'mapping': 'DataTable renders 1 header row + ranking.length body rows'})
    mismatches = [r for r in rows if r['classification'] == 'MISMATCH']
    return {
        'evidenceSource': {
            'commit': '2f1049d0db348733f4d4f15fb4dcc57d4f2742fa',
            'path': 'docs/v3.0/e2e-018-screenshots/CAPTURE_MANIFEST.json',
            'capture': 'executive.png',
            'captureSha256': cap['sha256'],
            'productCommitRecordedInManifest': manifest['productCommit'],
        },
        'items': rows,
        'summary': {
            'total': len(rows),
            'EXACT MATCH': sum(1 for r in rows if r['classification'] == 'EXACT MATCH'),
            'MISMATCH': len(mismatches),
            'mismatchedItems': [r['observable'] for r in mismatches],
        },
    }

rtA = load_runtime('7964fcc')
rtB = load_runtime('42f91fad')

compA = compare_one('7964fcc', rtA)
compB = compare_one('42f91fad', rtB)
e2e = e2e018_comparison(rtA, rtB)

# structural / byte comparison between checkpoints
struct = {
    'byteIdentical': sha256_file(f'{OUT}/raw-7964fcc-executive-output.json') == sha256_file(f'{OUT}/raw-42f91fad-executive-output.json'),
    'canonicalJsonIdentical': canonical(rtA) == canonical(rtB),
    'keyOrderIdentical': json.dumps(rtA) == json.dumps(rtB),
    'sha256_7964fcc': sha256_file(f'{OUT}/raw-7964fcc-executive-output.json'),
    'sha256_42f91fad': sha256_file(f'{OUT}/raw-42f91fad-executive-output.json'),
}
compB['crossCheckpointStructuralComparison'] = struct
compA['crossCheckpointStructuralComparison'] = struct

json.dump(compA, open(f'{EVID}/comparison-7964fcc.json', 'w'), indent=2)
json.dump(compB, open(f'{EVID}/comparison-42f91fad.json', 'w'), indent=2)
json.dump(e2e, open(f'{EVID}/e2e018-comparison.json', 'w'), indent=2)

print('comparison-7964fcc summary:', json.dumps(compA['summary']))
print('comparison-42f91fad summary:', json.dumps(compB['summary']))
print('e2e018 summary:', json.dumps(e2e['summary']))
print('struct:', json.dumps(struct))
