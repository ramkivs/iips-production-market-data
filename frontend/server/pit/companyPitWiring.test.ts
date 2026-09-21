/**
 * D-PIT-WIRE-01 — executable transport contract for `/api/company/:id` (ONE in-scope route).
 *
 * Source pins prove only Company delegates to the PIT request function and Macro/out-of-scope
 * routes remain untouched. Behavioral tests invoke THE SAME `executeCompanyTransportRequest`
 * function used by executive-transport — not copied/composed lookalike logic.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as crypto from 'node:crypto';
import { buildDegradedResponse, resolveModeForPrincipal } from '../data-mode/data-mode';
import { createPitVintageProvider, loadCorpusIntoProvider } from './pitVintageProvider';
import { executeCompanyTransportRequest } from './companyPitTransport';
import {
  SWAN_ENERGY_AS_OF,
  SWAN_ENERGY_BL_SECURITY_ID,
  SWAN_ENERGY_EQ_SECURITY_ID,
  SWAN_ENERGY_SAME_ISIN_UDIFF_CSV,
} from './testSupport/swanEnergySameIsinUdiff';

const TRANSPORT = fs.readFileSync(path.join(process.cwd(), 'server', 'executive-transport.ts'), 'utf8');
const COMPANY_HANDLER = fs.readFileSync(path.join(process.cwd(), 'server', 'pit', 'companyPitTransport.ts'), 'utf8');

function companyBlock(): string {
  const start = TRANSPORT.indexOf("req.url?.startsWith('/api/company/')");
  const next = TRANSPORT.indexOf("req.url?.startsWith('/api/evidence/')", start);
  return TRANSPORT.slice(start, next);
}

describe('Wiring — /api/company/:id is the ONLY PIT-bound route', () => {
  it('derives mode from the authenticated principal, then delegates to the executable request path', () => {
    const block = companyBlock();
    expect(block).toMatch(/resolveModeForPrincipal\(modePrincipal\)/);
    expect(block).toMatch(/executeCompanyTransportRequest/);
    expect(block).toMatch(/getSharedPitVintageProvider\(\)/);
    expect(block).not.toMatch(/new URLSearchParams|validateAsOfRequest|rawAsOf/); // parsing lives in the tested helper
  });

  it('asOf is data selection only: neither transport nor helper reads a mode from the request', () => {
    const code = `${companyBlock()}\n${COMPANY_HANDLER}`;
    expect(code).not.toMatch(/dataMode.*=.*asOf|asOf.*as\s+DataMode|mode\s*=\s*rawAsOf|params\.get\(['"]mode/);
    expect(COMPANY_HANDLER).toMatch(/asOf` is only data\s*selection|asOf` is only data/);
    expect(COMPANY_HANDLER).toMatch(/serverDerivedMode/);
  });

  it('out-of-scope routes keep dispatching WITHOUT the PIT binding', () => {
    for (const surface of ['Executive', 'Decision Matrix', 'Cross-Sector', 'Evidence', 'Replay']) {
      const re = new RegExp(`dispatchForPrincipal\\('${surface.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}', modePrincipal, [^)]*\\)`);
      expect(TRANSPORT).toMatch(re);
    }
    expect(TRANSPORT).toMatch(/dispatchForPrincipal\('Portfolio'|portfolioForMode\(/);
    // Exactly one route delegates to the PIT-capable helper.
    expect(TRANSPORT.match(/executeCompanyTransportRequest\(/g)).toHaveLength(1);
  });

  it('the Macro exemption block is untouched (D89 pin preserved)', () => {
    const macroBlock = TRANSPORT.slice(TRANSPORT.indexOf("surface === 'macro'"), TRANSPORT.indexOf("surface === 'macro'") + 400);
    expect(macroBlock).toMatch(/handleMacroReadRequest/);
    expect(macroBlock).not.toMatch(/dispatchForPrincipal|executeCompanyTransportRequest/);
  });

  it('the helper leaves PIT unbound when the shared provider is null/unbound', () => {
    expect(COMPANY_HANDLER).toMatch(/provider === null \|\| !provider\.isBound\(\)/);
    expect(COMPANY_HANDLER).toMatch(/return undefined/);
  });
});

describe('Executable /api/company/:id request path — bounded fixture corpus', () => {
  const provider = createPitVintageProvider();
  const loaded = loadCorpusIntoProvider(provider, path.join(process.cwd(), 'server', 'pit', 'fixtures', 'corpus'));
  expect(loaded.ok).toBe(true);

  function request(companyId: string, rawAsOf: string | undefined, mode: 'SNAPSHOT' | 'PIT' | 'LIVE') {
    const query = rawAsOf === undefined ? '' : `?${new URLSearchParams({ asOf: rawAsOf })}`;
    return executeCompanyTransportRequest(
      `/api/company/${encodeURIComponent(companyId)}${query}`,
      'GET',
      mode,
      (securityId) => ({ certified: true, companyId: securityId }),
      provider,
    );
  }

  it('PIT + exact governed legacy instant → Company vintage with requested/resolved asOf and provenance', () => {
    const requestedAsOf = '2024-07-05T15:30:00.000Z';
    const r = request('RELIANCE', requestedAsOf, 'PIT');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      surface: 'Company',
      dataMode: 'PIT',
      dataAvailable: true,
      query: { asOf: requestedAsOf, domain: 'D02', securityId: 'RELIANCE' },
      vintage: {
        era: 'LEGACY_BHAVCOPY',
        requestedAsOf,
        resolvedAsOf: '2024-07-05T09:15:00.000Z',
        asOf: '2024-07-05T09:15:00.000Z',
        provider: 'NSE_D114',
        dataVersion: 'd114-dualera-v1',
        record: {
          companyId: 'RELIANCE',
          symbol: 'RELIANCE',
          close: 2931.1,
          candleStart: '2024-07-05T09:15:00.000Z',
          securityIdentity: {
            securityId: 'ISIN:INE002A01018:EQ',
            isin: 'INE002A01018',
            isinAuthority: 'NON_AUTHORITATIVE',
            series: 'EQ',
          },
        },
      },
      provenance: {
        freshness: 'PIT',
        mode: 'PIT',
        corpusId: 'pit-fixture-corpus-v1',
        sha256: '806b81032da9b31aaac12c2f9cc785218004b28c3cedaf32334393581e06a626',
      },
    });
    const body = r.body as { vintage: { requestedAsOf: string; resolvedAsOf: string } };
    expect(body.vintage.resolvedAsOf <= body.vintage.requestedAsOf).toBe(true);
  });

  it('PIT + symbol + in-corpus date (LEGACY side) → vintage, era disclosed', () => {
    const r = request('RELIANCE', '2024-07-07T15:30:00.000Z', 'PIT');
    expect(r.status).toBe(200);
    expect((r.body as { vintage?: { era?: string } }).vintage?.era).toBe('LEGACY_BHAVCOPY');
  });

  it('PIT + symbol + in-corpus date (CM-UDiFF side) → vintage, era disclosed', () => {
    const r = request('RELIANCE', '2024-07-08T15:30:00.000Z', 'PIT');
    expect(r.status).toBe(200);
    expect((r.body as { vintage?: { era?: string; asOf?: string } }).vintage).toMatchObject({
      era: 'CM_UDIFF', asOf: '2024-07-08T09:15:00.000Z',
    });
  });

  it('SWANENERGY Company lookup fails closed while direct BL/EQ identities resolve independently', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pit-swanenergy-company-'));
    const file = 'BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv';
    const sha256 = crypto.createHash('sha256').update(SWAN_ENERGY_SAME_ISIN_UDIFF_CSV).digest('hex');
    fs.writeFileSync(path.join(dir, file), SWAN_ENERGY_SAME_ISIN_UDIFF_CSV);
    fs.writeFileSync(path.join(dir, 'pit-corpus-manifest.json'), JSON.stringify({
      corpusId: 'swanenergy-company-same-isin-regression',
      provider: 'NSE_D114',
      dataVersion: 'd114-dualera-v1',
      coverage: { start: '2024-07-08', end: '2024-07-08' },
      entries: [{ file, source: 'CSV', era: 'CM_UDIFF', sha256 }],
    }));

    try {
      const swanProvider = createPitVintageProvider();
      expect(loadCorpusIntoProvider(swanProvider, dir)).toMatchObject({
        ok: true, snapshotsAppended: 2,
      });
      const swanRequest = (securityId: string) => executeCompanyTransportRequest(
        `/api/company/${encodeURIComponent(securityId)}?${new URLSearchParams({ asOf: SWAN_ENERGY_AS_OF })}`,
        'GET',
        'PIT',
        () => ({ shouldNotRun: true }),
        swanProvider,
      );

      const unqualified = swanRequest('SWANENERGY');
      expect(unqualified.status).toBe(200);
      expect(JSON.stringify(unqualified.body)).toBe(
        JSON.stringify(buildDegradedResponse('Company', 'PIT')),
      );
      expect(JSON.stringify(swanRequest('INE665A01038').body)).toBe(
        JSON.stringify(buildDegradedResponse('Company', 'PIT')),
      );

      for (const [securityId, series, close] of [
        [SWAN_ENERGY_BL_SECURITY_ID, 'BL', 668.25],
        [SWAN_ENERGY_EQ_SECURITY_ID, 'EQ', 692.6],
      ] as const) {
        const direct = swanRequest(securityId);
        expect(direct.status).toBe(200);
        expect(direct.body).toMatchObject({
          surface: 'Company',
          dataMode: 'PIT',
          dataAvailable: true,
          query: { asOf: SWAN_ENERGY_AS_OF, domain: 'D02', securityId },
          vintage: {
            requestedAsOf: SWAN_ENERGY_AS_OF,
            resolvedAsOf: SWAN_ENERGY_AS_OF,
            asOf: SWAN_ENERGY_AS_OF,
            era: 'CM_UDIFF',
            record: {
              companyId: 'SWANENERGY',
              symbol: 'SWANENERGY',
              close,
              securityIdentity: {
                securityId,
                isin: 'INE665A01038',
                isinAuthority: 'NON_AUTHORITATIVE',
                series,
              },
            },
          },
        });
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('PIT + pre-corpus instant (no vintage <= asOf) → PIT_UNAVAILABLE byte-identical', () => {
    const r = request('RELIANCE', '2016-09-19T00:00:00.000Z', 'PIT');
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).toBe(JSON.stringify(buildDegradedResponse('Company', 'PIT')));
  });

  it('registered HTTP_404 / holiday / weekend / unloaded bounded date / post-range → PIT_UNAVAILABLE', () => {
    for (const asOf of [
      '2024-07-10T15:30:00.000Z', // HTTP_404 fixture register
      '2024-07-11T15:30:00.000Z', // holiday fixture manifest
      '2024-07-13T15:30:00.000Z', // weekend fixture manifest
      '2024-07-09T15:30:00.000Z', // within range but not loaded in bounded corpus
      '2024-07-16T15:30:00.000Z', // after fixture coverage
    ]) {
      const r = request('RELIANCE', asOf, 'PIT');
      expect(r.status).toBe(200);
      expect(JSON.stringify(r.body)).toBe(JSON.stringify(buildDegradedResponse('Company', 'PIT')));
    }
  });

  it('PIT + absent/malformed/duplicate asOf → 400 (ambiguity never resolved)', () => {
    expect(request('RELIANCE', undefined, 'PIT').status).toBe(400);
    expect(request('RELIANCE', '2024-07-10', 'PIT').status).toBe(400);
    const duplicate = executeCompanyTransportRequest(
      '/api/company/RELIANCE?asOf=2024-07-08T15%3A30%3A00.000Z&asOf=2024-07-05T15%3A30%3A00.000Z',
      'GET',
      'PIT',
      () => ({}),
      provider,
    );
    expect(duplicate.status).toBe(400);
  });

  it('SNAPSHOT + asOf → 400; SNAPSHOT without asOf → certified payload verbatim', () => {
    expect(request('RELIANCE', '2024-07-08T00:00:00.000Z', 'SNAPSHOT').status).toBe(400);
    const r = request('RELIANCE', undefined, 'SNAPSHOT');
    expect(r.body).toEqual({ certified: true, companyId: 'RELIANCE' });
  });

  it('LIVE remains LIVE_UNAVAILABLE and never calls the SNAPSHOT compute', () => {
    let computeCalls = 0;
    const r = executeCompanyTransportRequest(
      '/api/company/RELIANCE',
      'GET',
      'LIVE',
      () => { computeCalls += 1; return {}; },
      provider,
    );
    expect(computeCalls).toBe(0);
    expect(r.body).toMatchObject({ state: 'LIVE_UNAVAILABLE', dataAvailable: false });
  });

  it('unbound provider / unknown security / malformed route fail closed', () => {
    const unbound = executeCompanyTransportRequest(
      '/api/company/RELIANCE?asOf=2024-07-08T15%3A30%3A00.000Z', 'GET', 'PIT', () => ({}), null,
    );
    expect(JSON.stringify(unbound.body)).toBe(JSON.stringify(buildDegradedResponse('Company', 'PIT')));
    expect(request('UNKNOWN', '2024-07-08T15:30:00.000Z', 'PIT').body).toMatchObject({ state: 'PIT_UNAVAILABLE' });
    expect(executeCompanyTransportRequest('/api/portfolio', 'GET', 'PIT', () => ({}), provider).status).toBe(404);
    expect(executeCompanyTransportRequest('/api/company/RELIANCE', 'POST', 'PIT', () => ({}), provider).status).toBe(405);
  });

  it('mode resolution remains server-derived: no owner → SNAPSHOT', () => {
    expect(resolveModeForPrincipal({ tenantId: 't', ownerUserId: undefined })).toBe('SNAPSHOT');
  });
});
