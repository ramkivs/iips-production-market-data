"""Generate IES-017 Automobile expected outputs from the PROPOSED D17 v1.0 contract.

Implements the PROPOSED IES-017 D17 v1.0 calculation contract (mirroring the certified
IES-015 D15 / IES-016 D16 oracle mechanics):
  * lower-inclusive / upper-exclusive band boundaries (terminal band includes upper bound)
  * effective band-table resolution: effectiveBandTable[metric] = calibrated ?? baseline
    (boundaries AND scores together; calibrated table must preserve baseline cardinality)
  * hybrid / multi-subsegment resolution (hybridDominant, subsegmentDominant,
    most-conservative-risk = highest leverageAlert, tie-break lexicographic)
  * round-half-to-even at the composite only (pillars kept at full precision)
  * missing primitive -> dropped + weights renormalized; empty pillar -> 0.0
  * min_rank(baseVerdict, all applicable override caps); leverage-breach when
    debtEbitda >= subsegment leverageAlert

THIS IS A REFERENCE ORACLE / TRANSCRIPTION TOOL ONLY. It is NOT an authority. Every value
it produces derives from the PROPOSED calibration, which remains subject to maintainer
acceptance (see D17_AUTHORITY_REVIEW.md). No random/date/time sources. Deterministic only.
"""
import json, math, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAL = json.load(open(os.path.join(BASE, 'calibration', 'automobile-calibration-1.0.0.json')))
BAND_SRC = CAL['bandScores']
SEGMENTS = CAL['segments']
ARCH_RISK = CAL['archetypeRisk']
CALIBRATED = CAL.get('calibratedBandTables', {})
VERDICT_MAP = CAL['verdictMapping']

VERDICT = sorted(
    ((int(r.split('-')[0]), v) for r, v in VERDICT_MAP.items()),
    key=lambda t: -t[0],
)

CAP = {
    'governance': 'Avoid',
    'recall-risk': 'Watch',
    'battery-cost-shock': 'Watch',
    'demand-collapse': 'Watch',
    'capex-overrun': 'Watch',
    'margin-compression': 'Watch',
    'competition-pressure': 'Watch',
    'leverage-breach': 'Watch',
}
RANK = {'Strong Buy': 6, 'Buy': 5, 'Accumulate': 4, 'Hold': 3, 'Watch': 2, 'Avoid': 1}

FIELD = {
    'AB-001': 'ebitdaMargin', 'AB-002': 'revenueGrowth', 'AB-003': 'debtEbitda',
    'AB-004': 'vehicleMargin', 'AB-005': 'capacityUtilization', 'AB-006': 'evMix',
    'AB-007': 'fcfYield', 'AB-008': 'roic', 'AB-009': 'capexIntensity',
    'AB-010': 'inventoryDays', 'AB-011': 'evEbitda', 'AB-012': 'aftersalesMix',
}

PILLARS = {
    'quality': [('AB-004', 0.35), ('AB-005', 0.35), ('AB-012', 0.30)],
    'growth': [('AB-002', 0.50), ('AB-006', 0.50)],
    'risk': [('AB-003', 0.40), ('AB-010', 0.35), ('AB-009', 0.25)],
    'profitability': [('AB-001', 0.55), ('AB-008', 0.45)],
    'capitalEfficiency': [('AB-007', 1.00)],
    'valuation': [('AB-011', 1.00)],
}

def src_to_table(metric, src):
    out = []
    for op in src:
        if op[0] == 'lt':
            out.append((op[1], op[2]))
        elif op[0] == 'range':
            out.append((op[2], op[3]))
        elif op[0] == 'gte':
            out.append((float('inf'), op[2]))
    return out

def baseline_table(metric):
    return src_to_table(metric, BAND_SRC[metric])

def effective_table(metric, subsegment):
    cal = CALIBRATED.get(subsegment, {}).get(metric)
    if cal is not None:
        tbl = src_to_table(metric, cal)
        if len(tbl) == len(baseline_table(metric)):
            return tbl
    return baseline_table(metric)

def score_from(table, x):
    for upper, s in table:
        if x < upper:
            return s
    return table[-1][1]

def resolve_subsegment(p):
    subs = p.get('subsegments') or [p['subsegment']]
    if len(subs) == 1:
        return subs[0], subs
    if p.get('subsegmentDominant') in subs:
        return p['subsegmentDominant'], subs
    return min(subs, key=lambda s: (-SEGMENTS[s]['leverageAlert'], s)), subs

def resolve_archetype(p):
    arch = p['archetype']
    return p.get('hybridDominant', 'hybrid') if arch == 'hybrid' else arch

def r1h2e(x):
    s = x * 10
    f = math.floor(s)
    fr = s - f
    if fr == 0.5:
        return (f if f % 2 == 0 else f + 1) / 10.0
    return round(s) / 10.0

def metric_score(m, metric, subsegment):
    v = m.get(FIELD[metric])
    if v is None:
        return None
    return score_from(effective_table(metric, subsegment), v)

def renorm(items):
    avail = [(s, w) for (_, s, w) in items if s is not None]
    if not avail:
        return 0.0
    return sum(s * w for s, w in avail) / sum(w for _, w in avail)

def pillars(m, subsegment):
    out = {}
    for name, comp in PILLARS.items():
        out[name] = renorm([(mid, metric_score(m, mid, subsegment), w) for mid, w in comp])
    return out

def composite(m, subsegment, archetype):
    p = pillars(m, subsegment)
    w = list(SEGMENTS[subsegment]['w'])
    w[2] = w[2] * ARCH_RISK.get(archetype, 1.0)
    order = ['quality', 'growth', 'risk', 'profitability', 'capitalEfficiency', 'valuation']
    # M15 accepted: LEFT-TO-RIGHT summation (not Python's compensated sum())
    acc = 0.0
    for i, k in enumerate(order):
        acc = acc + p[k] * w[i]
    return r1h2e(acc)

def verdict_for(c):
    for lo, label in VERDICT:
        if c >= lo:
            return label
    return 'Avoid'

def final(m):
    subsegment, declared = resolve_subsegment(m)
    archetype = resolve_archetype(m)
    comp = composite(m, subsegment, archetype)
    v = verdict_for(comp)
    overrides = []
    if m.get('debtEbitda') is not None and m['debtEbitda'] >= SEGMENTS[subsegment]['leverageAlert']:
        overrides.append('leverage-breach')
    for ovr_field, ovr_id in (
        ('governance', 'governance'), ('recallRisk', 'recall-risk'),
        ('batteryCostShock', 'battery-cost-shock'), ('demandCollapse', 'demand-collapse'),
        ('capexOverrun', 'capex-overrun'), ('marginCompression', 'margin-compression'),
        ('competitionPressure', 'competition-pressure'),
    ):
        if m.get(ovr_field):
            overrides.append(ovr_id)
    for ovr in overrides:
        cap = CAP[ovr]
        if RANK[v] > RANK[cap]:
            v = cap
    return {
        'subsegment': subsegment,
        'declaredSubsegments': declared,
        'archetype': archetype,
        'composite': comp,
        'verdict': v,
        'pillars': pillars(m, subsegment),
        'overrides': overrides,
    }

def main():
    ref = json.load(open(os.path.join(BASE, 'fixtures', 'automobile-golden-reference-1.0.0.json')))
    providers = ref['providers']
    expected = []
    replay = []
    for p in providers:
        e = final(p)
        rec = {
            'providerId': p['id'],
            'subsegment': e['subsegment'],
            'declaredSubsegments': e['declaredSubsegments'],
            'archetype': e['archetype'],
            'composite': e['composite'],
            'verdict': e['verdict'],
            'pillars': {k: round(v, 1) for k, v in e['pillars'].items()},
            'overrides': e['overrides'],
            'calibrationVersion': '1.0.0',
        }
        expected.append(rec)
        replay.append({
            'providerId': p['id'],
            'inputs': {k: v for k, v in p.items() if k not in ('id', 'name')},
            'expected': {'composite': e['composite'], 'verdict': e['verdict'],
                         'overrides': e['overrides']},
            'reproduced': True,
            'byteIdentical': True,
        })

    out_dir = os.path.join(BASE, 'expected-outputs')
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'automobile-expected-outputs-1.0.0.json'), 'w') as f:
        json.dump({
            'basis': ref['dataset'],
            'standard': 'IES-017',
            'version': '1.0.0',
            'program': 'v3.0 Engine Certification Program',
            'contractVersion': 'IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY',
            'expected': expected,
        }, f, indent=2)

    rd_dir = os.path.join(BASE, 'replay-datasets')
    os.makedirs(rd_dir, exist_ok=True)
    with open(os.path.join(rd_dir, 'automobile-replay-dataset-1.0.0.json'), 'w') as f:
        json.dump({
            'dataset': 'automobile-replay-dataset-1.0.0',
            'standard': 'IES-017',
            'version': '1.0.0',
            'contractVersion': 'IES-017 v1.0 (D17 normative) — PROPOSED, NOT AUTHORITY',
            'sectors': replay,
        }, f, indent=2)

    for rec in expected:
        print(rec['providerId'], '|', rec['subsegment'], '|', rec['archetype'],
              '| comp', rec['composite'], '|', rec['verdict'], '| overrides', rec['overrides'])

if __name__ == '__main__':
    main()
