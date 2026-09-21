/**
 * D-PIT-WIRE-01 — transport wiring pins for /api/company/:id (the ONE in-scope route).
 *
 * Source-level pins (the D89 macro-exemption test pattern) prove:
 *   • the company block validates asOf via the governed seam contract and binds the PIT
 *     hook ONLY there;
 *   • every OUT-OF-SCOPE mode-aware route still dispatches WITHOUT a PIT binding — their
 *     PIT behaviour is unchanged (PIT_UNAVAILABLE);
 *   • the Macro exemption block is untouched;
 *   • SNAPSHOT/LIVE certified computations are invoked unchanged.
 * Plus a composed request-contract test that exercises EXACTLY the handler's logic
 * (resolveModeForPrincipal → validateAsOfRequest → forMode with the fixture corpus).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  forMode,
  resolveModeForPrincipal,
  validateAsOfRequest,
  buildDegradedResponse,
} from '../data-mode/data-mode';
import { createPitVintageProvider, loadCorpusIntoProvider } from './pitVintageProvider';

const TRANSPORT = fs.readFileSync(
  path.join(process.cwd(), 'server', 'executive-transport.ts'),
  'utf8',
);

function companyBlock(): string {
  const start = TRANSPORT.indexOf("req.url?.startsWith('/api/company/')");
  const next = TRANSPORT.indexOf("req.url?.startsWith('/api/evidence/')", start);
  return TRANSPORT.slice(start, next);
}

describe('Wiring — /api/company/:id is the ONLY PIT-bound route', () => {
  it('the company block uses the governed asOf contract and the PIT binding', () => {
    const block = companyBlock();
    expect(block).toMatch(/resolveModeForPrincipal/);
    expect(block).toMatch(/validateAsOfRequest/);
    expect(block).toMatch(/buildCompanyPitBinding/);
    expect(block).toMatch(/forMode\('Company', companyMode/);
  });

  it('asOf is data selection only: the transport never reads a mode from the request', () => {
    const block = companyBlock();
    expect(block).not.toMatch(/dataMode.*=.*asOf|asOf.*as\s+DataMode|mode\s*=\s*rawAsOf/);
    expect(block).toMatch(/asOf is DATA SELECTION, never a mode authority/);
  });

  it('out-of-scope routes keep dispatching WITHOUT the PIT binding', () => {
    for (const surface of ['Executive', 'Decision Matrix', 'Cross-Sector', 'Evidence', 'Replay']) {
      const re = new RegExp(`dispatchForPrincipal\\('${surface.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}', modePrincipal, [^)]*\\)`);
      expect(TRANSPORT).toMatch(re);
    }
    // Portfolio keeps the D85 seam; neither gains a PIT binding.
    expect(TRANSPORT).toMatch(/dispatchForPrincipal\('Portfolio'|portfolioForMode\(/);
    const pitBoundCalls = TRANSPORT.match(/forMode\('[^']*',\s*\w+,\s*[^,]+,\s*pitBinding\)/g) ?? [];
    expect(pitBoundCalls).toHaveLength(1);
    expect(pitBoundCalls[0]).toContain("'Company'");
  });

  it('the Macro exemption block is untouched (D89 pin preserved)', () => {
    const macroBlock = TRANSPORT.slice(TRANSPORT.indexOf("surface === 'macro'"), TRANSPORT.indexOf("surface === 'macro'") + 400);
    expect(macroBlock).toMatch(/handleMacroReadRequest/);
    expect(macroBlock).not.toMatch(/dispatchForPrincipal/);
  });

  it('the shared PIT provider is fail-closed: unbound → no binding object at all', () => {
    expect(TRANSPORT).toMatch(/getSharedPitVintageProvider\(\)/);
    expect(TRANSPORT).toMatch(/if \(provider === null \|\| !provider\.isBound\(\)\) return undefined;/);
  });
});

describe('Wiring — composed request contract (exactly the handler logic, fixture corpus)', () => {
  const p = createPitVintageProvider();
  const loaded = loadCorpusIntoProvider(p, path.join(process.cwd(), 'server', 'pit', 'fixtures', 'corpus'));
  expect(loaded.ok).toBe(true);

  function handle(companyId: string, rawAsOf: string | undefined, mode: 'SNAPSHOT' | 'PIT' | 'LIVE'): { status: number; body: unknown } {
    const asOfCheck = validateAsOfRequest(mode, rawAsOf);
    if (!asOfCheck.ok) return { status: asOfCheck.status, body: { error: asOfCheck.error } };
    const provider = p.isBound() ? p : null;
    const pitBinding = asOfCheck.asOf !== undefined && provider !== null
      ? {
          asOf: asOfCheck.asOf,
          domain: 'D02',
          securityId: companyId,
          queryPit: (a: string) => provider.query('D02', companyId, a),
        }
      : undefined;
    let payload: unknown;
    try {
      payload = forMode('Company', mode, () => ({ certified: true, companyId }), pitBinding);
    } catch (e) {
      return { status: 404, body: { error: String(e) } };
    }
    return { status: 200, body: payload };
  }

  it('PIT + symbol + in-corpus date (LEGACY side) → vintage, era disclosed', () => {
    const r = handle('RELIANCE', '2024-07-07T00:00:00.000Z', 'PIT');
    expect(r.status).toBe(200);
    expect((r.body as { vintage?: { era?: string } }).vintage?.era).toBe('LEGACY_BHAVCOPY');
  });

  it('PIT + symbol + in-corpus date (CM-UDiFF side) → vintage, era disclosed', () => {
    const r = handle('RELIANCE', '2024-07-09T00:00:00.000Z', 'PIT');
    expect(r.status).toBe(200);
    expect((r.body as { vintage?: { era?: string } }).vintage?.era).toBe('CM_UDIFF');
  });

  it('PIT + pre-corpus instant (no vintage ≤ asOf) → PIT_UNAVAILABLE byte-identical', () => {
    const r = handle('RELIANCE', '2016-09-19T00:00:00.000Z', 'PIT');
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).toBe(JSON.stringify(buildDegradedResponse('Company', 'PIT')));
  });

  it('PIT + gap date resolves BACKWARD under PS-9 with the resolved instant disclosed', () => {
    const r = handle('RELIANCE', '2024-07-10T00:00:00.000Z', 'PIT');
    expect(r.status).toBe(200);
    const vintage = (r.body as { vintage?: { requestedAsOf?: string; resolvedAsOf?: string } }).vintage;
    expect(vintage?.requestedAsOf).toBe('2024-07-10T00:00:00.000Z');
    expect(vintage?.resolvedAsOf).toBe('2024-07-08T09:15:00.000Z');
  });

  it('PIT + absent asOf → 400; PIT + malformed asOf → 400', () => {
    expect(handle('RELIANCE', undefined, 'PIT').status).toBe(400);
    expect(handle('RELIANCE', '2024-07-10', 'PIT').status).toBe(400);
  });

  it('SNAPSHOT + asOf → 400; SNAPSHOT without asOf → certified payload verbatim (unchanged)', () => {
    expect(handle('RELIANCE', '2024-07-08T00:00:00.000Z', 'SNAPSHOT').status).toBe(400);
    const r = handle('RELIANCE', undefined, 'SNAPSHOT');
    expect(r.body).toEqual({ certified: true, companyId: 'RELIANCE' });
  });

  it('mode resolution stays server-derived: no owner → SNAPSHOT (no PIT binding possible)', () => {
    expect(resolveModeForPrincipal({ tenantId: 't', ownerUserId: undefined })).toBe('SNAPSHOT');
  });
});
