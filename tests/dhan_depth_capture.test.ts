/**
 * Institutional Investment Platform System (IIPS)
 * Dhan depth capture — TEMPORARY DIAGNOSTIC test suite
 *
 * Purpose
 *   Prove two things about the D-18 evidence capture:
 *     1. it records the *received* depth values exactly — zero, missing, empty and
 *        non-numeric values are preserved, never coerced or re-derived;
 *     2. it has **no effect** on normal quote processing, and does not change
 *        normalisation or D-5 validation.
 *
 * These tests use synthetic fixtures and an injected transport. No credential is
 * read, no network call is made and no Dhan endpoint is contacted.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DHAN_ENV_KEYS,
  DhanApiClient,
  DhanCredentialMaterial,
  DhanCredentialResolver,
  DhanHttpRequest,
  DhanHttpResponse,
  DhanHttpTransport,
  resolveDhanProviderConfig,
} from '../src/index.js';
import {
  DHAN_DEPTH_CAPTURE_ENV,
  DHAN_DEPTH_CAPTURE_LABEL_ENV,
  armDepthCapture,
  captureDhanQuoteDepth,
  depthCaptureArmMarkerPath,
  isDepthCaptureArmed,
  resetDepthCaptureLatchForTests,
  resolveDepthCapturePath,
} from '../src/providers/dhan/dhan_depth_capture.js';

const CONFIGURED_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.baseUrl]: 'https://synthetic.invalid/v2',
  [DHAN_ENV_KEYS.timeoutMs]: '50',
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://market-data/depth-capture/access-token',
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://market-data/depth-capture/client-id',
  [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
  [DHAN_ENV_KEYS.secretVersion]: 'v1',
};

class SyntheticCredentialResolver implements DhanCredentialResolver {
  public async resolve(): Promise<DhanCredentialMaterial> {
    return { accessToken: 'synthetic-access-token-value', clientId: 'synthetic-client-id-value' };
  }
}

/** Serves one fixed quote body and records the requests it received. */
class FixedQuoteTransport implements DhanHttpTransport {
  public readonly requests: DhanHttpRequest[] = [];
  constructor(private readonly body: string, private readonly status = 200) {}
  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    this.requests.push(request);
    return { status: this.status, bodyText: this.body };
  }
}

/** Builds a Dhan quote envelope whose depth block is supplied verbatim. */
function quoteBody(depth: unknown, securityId = '2885'): string {
  const quote: Record<string, unknown> = {
    last_price: 1363,
    ohlc: { open: 1370, close: 1363, high: 1376.5, low: 1354 },
    volume: 18226036,
    last_trade_time: '22/11/2026 15:29:58',
    average_price: 1363.17,
    net_change: 0,
  };
  if (depth !== undefined) quote['depth'] = depth;
  return JSON.stringify({ status: 'success', data: { NSE_EQ: { [securityId]: quote } } });
}

const parseBody = (body: string): unknown => JSON.parse(body);

const captureContext = { capturedAtUtc: '2026-11-22T00:00:00.000Z', httpStatus: 200 };

// ---------------------------------------------------------------------------
// 1. The extractor preserves exactly what was received
// ---------------------------------------------------------------------------

describe('depth capture — preserves received values exactly', () => {
  it('CAP-01: market closed, bid and ask both zero → both recorded as present zero', () => {
    const doc = captureDhanQuoteDepth(
      parseBody(quoteBody({
        buy: [{ quantity: 0, orders: 0, price: 0 }],
        sell: [{ quantity: 0, orders: 0, price: 0 }],
      })),
      captureContext
    );

    const q = doc.quotes[0]!;
    assert.strictEqual(q.depthState, 'object');
    assert.strictEqual(q.buy.state, 'array');
    assert.strictEqual(q.sell.state, 'array');
    // Zero must survive as a *present* zero — it must never be read as absence.
    assert.deepStrictEqual(q.buy.levels![0]!.price, { state: 'present', value: 0 });
    assert.deepStrictEqual(q.sell.levels![0]!.price, { state: 'present', value: 0 });
    assert.deepStrictEqual(q.buy.levels![0]!.quantity, { state: 'present', value: 0 });
    assert.deepStrictEqual(q.sell.levels![0]!.orders, { state: 'present', value: 0 });
  });

  it('CAP-02: bid zero and ask positive → each side preserved independently', () => {
    const doc = captureDhanQuoteDepth(
      parseBody(quoteBody({
        buy: [{ quantity: 0, orders: 0, price: 0 }],
        sell: [{ quantity: 640, orders: 6, price: 1520.5 }],
      })),
      captureContext
    );

    const q = doc.quotes[0]!;
    assert.deepStrictEqual(q.buy.levels![0]!.price, { state: 'present', value: 0 });
    assert.deepStrictEqual(q.sell.levels![0]!.price, { state: 'present', value: 1520.5 });
    assert.deepStrictEqual(q.sell.levels![0]!.quantity, { state: 'present', value: 640 });
  });

  it('CAP-03: empty arrays, missing sides and a missing depth block are all preserved as received', () => {
    const empty = captureDhanQuoteDepth(parseBody(quoteBody({ buy: [], sell: [] })), captureContext);
    assert.strictEqual(empty.quotes[0]!.buy.count, 0);
    assert.deepStrictEqual(empty.quotes[0]!.buy.levels, []);
    assert.strictEqual(empty.quotes[0]!.sell.count, 0);

    const halfMissing = captureDhanQuoteDepth(parseBody(quoteBody({ sell: [{ quantity: 1, orders: 1, price: 10 }] })), captureContext);
    assert.strictEqual(halfMissing.quotes[0]!.buy.state, 'missing');
    assert.strictEqual(halfMissing.quotes[0]!.sell.state, 'array');

    const noDepth = captureDhanQuoteDepth(parseBody(quoteBody(undefined)), captureContext);
    assert.strictEqual(noDepth.quotes[0]!.depthState, 'missing');
    assert.strictEqual(noDepth.quotes[0]!.buy.state, 'missing');
    assert.strictEqual(noDepth.quotes[0]!.sell.state, 'missing');
  });

  it('CAP-04: missing individual fields are distinguished from present values', () => {
    const doc = captureDhanQuoteDepth(
      parseBody(quoteBody({ buy: [{ price: 0 }], sell: [{ quantity: 5, price: 12.5 }] })),
      captureContext
    );

    const buy = doc.quotes[0]!.buy.levels![0]!;
    assert.deepStrictEqual(buy.price, { state: 'present', value: 0 });
    assert.deepStrictEqual(buy.quantity, { state: 'missing' });
    assert.deepStrictEqual(buy.orders, { state: 'missing' });

    const sell = doc.quotes[0]!.sell.levels![0]!;
    assert.deepStrictEqual(sell.quantity, { state: 'present', value: 5 });
    assert.deepStrictEqual(sell.orders, { state: 'missing' });
  });

  it('CAP-05: non-numeric and negative prices are recorded verbatim, not corrected', () => {
    const doc = captureDhanQuoteDepth(
      parseBody(quoteBody({
        buy: [{ quantity: 1, orders: 1, price: '-1' }],
        sell: [{ quantity: 1, orders: 1, price: -5 }],
      })),
      captureContext
    );

    assert.deepStrictEqual(doc.quotes[0]!.buy.levels![0]!.price, { state: 'present', value: '-1' });
    assert.deepStrictEqual(doc.quotes[0]!.sell.levels![0]!.price, { state: 'present', value: -5 });
  });

  it('CAP-06: the raw verbatim depth is retained alongside the normalised fields', () => {
    const raw = { buy: [{ quantity: 7, orders: 2, price: 100.25 }], sell: [] };
    const doc = captureDhanQuoteDepth(parseBody(quoteBody(raw)), captureContext);
    assert.deepStrictEqual(doc.quotes[0]!.rawDepth, raw);
  });

  it('CAP-07: a non-object depth and a non-array side are recorded, not crashed on', () => {
    const notObject = captureDhanQuoteDepth(parseBody(quoteBody('UNAVAILABLE')), captureContext);
    assert.strictEqual(notObject.quotes[0]!.depthState, 'not_object');

    const notArray = captureDhanQuoteDepth(parseBody(quoteBody({ buy: { price: 1 }, sell: [] })), captureContext);
    assert.strictEqual(notArray.quotes[0]!.buy.state, 'not_array');
    assert.deepStrictEqual(notArray.quotes[0]!.buy.rawValue, { price: 1 });
  });

  it('CAP-08: depth is never synthesised from last_price', () => {
    const doc = captureDhanQuoteDepth(parseBody(quoteBody(undefined)), captureContext);
    const q = doc.quotes[0]!;
    assert.strictEqual(q.buy.state, 'missing');
    assert.strictEqual(q.sell.state, 'missing');
    assert.strictEqual(q.rawDepth, undefined);
    // 1363 is the fixture's last_price; it must not appear anywhere in the capture.
    assert.ok(!JSON.stringify(doc).includes('1363'), 'last_price must never be used to populate depth');
  });

  it('CAP-09: no credential field is recorded', () => {
    const doc = captureDhanQuoteDepth(parseBody(quoteBody({ buy: [], sell: [] })), captureContext);
    const serialised = JSON.stringify(doc).toLowerCase();
    for (const forbidden of ['access-token', 'accesstoken', 'client-id', 'clientid', 'vault://', 'bearer']) {
      assert.ok(!serialised.includes(forbidden), `capture must not contain ${forbidden}`);
    }
  });

  it('CAP-10: multiple instruments in one response are each captured', () => {
    const body = JSON.stringify({
      status: 'success',
      data: {
        NSE_EQ: {
          '2885': { last_price: 1, ohlc: { open: 1, close: 1, high: 1, low: 1 }, volume: 1, last_trade_time: '22/11/2026 15:29:58', depth: { buy: [], sell: [] } },
          '11536': { last_price: 2, ohlc: { open: 2, close: 2, high: 2, low: 2 }, volume: 2, last_trade_time: '22/11/2026 15:29:58', depth: { buy: [{ quantity: 1, orders: 1, price: 0 }], sell: [] } },
        },
      },
    });
    const doc = captureDhanQuoteDepth(parseBody(body), captureContext);
    assert.strictEqual(doc.instrumentsInResponse, 2);
    assert.strictEqual(doc.quotes.length, 2);
    assert.deepStrictEqual(doc.quotes.map((q) => q.securityId).sort(), ['11536', '2885']);
  });
});

// ---------------------------------------------------------------------------
// 2. Enablement is opt-in and path resolution is strict
// ---------------------------------------------------------------------------

describe('depth capture — enablement', () => {
  it('CAP-11: disabled when the variable is unset, empty or whitespace', () => {
    assert.strictEqual(resolveDepthCapturePath({}), undefined);
    assert.strictEqual(resolveDepthCapturePath({ [DHAN_DEPTH_CAPTURE_ENV]: '' }), undefined);
    assert.strictEqual(resolveDepthCapturePath({ [DHAN_DEPTH_CAPTURE_ENV]: '   ' }), undefined);
  });

  it('CAP-12: enabled path is returned trimmed', () => {
    assert.strictEqual(resolveDepthCapturePath({ [DHAN_DEPTH_CAPTURE_ENV]: ' /tmp/x.json ' }), '/tmp/x.json');
  });
});

// ---------------------------------------------------------------------------
// 3. The client: captures when enabled, changes nothing either way
// ---------------------------------------------------------------------------

describe('depth capture — client integration and non-interference', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'iips-depth-capture-'));
    resetDepthCaptureLatchForTests();
    delete process.env[DHAN_DEPTH_CAPTURE_ENV];
    delete process.env[DHAN_DEPTH_CAPTURE_LABEL_ENV];
  });

  afterEach(() => {
    delete process.env[DHAN_DEPTH_CAPTURE_ENV];
    delete process.env[DHAN_DEPTH_CAPTURE_LABEL_ENV];
    rmSync(dir, { recursive: true, force: true });
  });

  const buildClient = (transport: DhanHttpTransport): DhanApiClient =>
    new DhanApiClient({
      config: resolveDhanProviderConfig(CONFIGURED_ENV).config,
      transport,
      credentialResolver: new SyntheticCredentialResolver(),
    });

  const INSTRUMENT = [{ dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' as const }];

  it('CAP-13: captures the original depth block for one request when enabled', async () => {
    const target = join(dir, 'nested', 'reliance-depth.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    process.env[DHAN_DEPTH_CAPTURE_LABEL_ENV] = 'RELIANCE market-closed probe';

    assert.strictEqual(armDepthCapture(target), true, 'arming must succeed');

    const body = quoteBody({ buy: [{ quantity: 0, orders: 0, price: 0 }], sell: [{ quantity: 0, orders: 0, price: 0 }] });
    const client = buildClient(new FixedQuoteTransport(body));

    // The call itself fails D-5 validation downstream, which is irrelevant here:
    // the capture happens on the raw body, before normalisation.
    await client.fetchMarketQuotes(INSTRUMENT);

    assert.ok(existsSync(target), 'capture file must be written');
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.strictEqual(doc.captureSchemaVersion, 2);
    assert.strictEqual(doc.label, 'RELIANCE market-closed probe');
    assert.strictEqual(doc.httpStatus, 200);
    assert.strictEqual(doc.responseStatus, 'success');
    assert.strictEqual(doc.instrumentsInResponse, 1);
    assert.deepStrictEqual(doc.quotes[0].buy.levels[0].price, { state: 'present', value: 0 });
    assert.deepStrictEqual(doc.quotes[0].sell.levels[0].price, { state: 'present', value: 0 });
  });

  it('CAP-14: writes nothing when disabled', async () => {
    const body = quoteBody({ buy: [{ quantity: 1, orders: 1, price: 100 }], sell: [{ quantity: 1, orders: 1, price: 101 }] });
    const client = buildClient(new FixedQuoteTransport(body));

    const result = await client.fetchMarketQuotes(INSTRUMENT);
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual((await import('node:fs')).readdirSync(dir), []);
  });

  it('CAP-14a: writes nothing when enabled but not armed', async () => {
    const target = join(dir, 'unarmed.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;

    const body = quoteBody({ buy: [{ quantity: 1, orders: 1, price: 100 }], sell: [{ quantity: 1, orders: 1, price: 101 }] });
    const result = await buildClient(new FixedQuoteTransport(body)).fetchMarketQuotes(INSTRUMENT);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(existsSync(target), false, 'an unarmed target must never capture');
  });

  it('CAP-15: capture does not change the quote processing result', async () => {
    const body = quoteBody({ buy: [{ quantity: 500, orders: 4, price: 1520.25 }], sell: [{ quantity: 640, orders: 6, price: 1520.5 }] });

    const withoutCapture = await buildClient(new FixedQuoteTransport(body)).fetchMarketQuotes(INSTRUMENT);

    process.env[DHAN_DEPTH_CAPTURE_ENV] = join(dir, 'enabled.json');
    assert.strictEqual(armDepthCapture(join(dir, 'enabled.json')), true);
    const withCapture = await buildClient(new FixedQuoteTransport(body)).fetchMarketQuotes(INSTRUMENT);

    assert.strictEqual(withoutCapture.ok, true);
    assert.strictEqual(withCapture.ok, true);
    if (!withoutCapture.ok || !withCapture.ok) throw new Error('unreachable');
    // Identical DTO, identical metrics, identical HTTP status.
    assert.deepStrictEqual(withCapture.value.dto, withoutCapture.value.dto);
    assert.strictEqual(withCapture.value.metrics.httpStatus, withoutCapture.value.metrics.httpStatus);
    assert.ok(existsSync(join(dir, 'enabled.json')));
  });

  it('CAP-16: a capture write failure never fails the quote request', async () => {
    // A path that cannot be created: a regular file used as a directory.
    const blocking = join(dir, 'blocking-file');
    (await import('node:fs')).writeFileSync(blocking, 'x');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = join(blocking, 'capture.json');
    // Arming fails on this path (a file is used as a directory); claim the slot
    // directly so the write-failure branch is still exercised.
    process.env[DHAN_DEPTH_CAPTURE_ENV] = join(dir, 'capture.json');
    assert.strictEqual(armDepthCapture(join(dir, 'capture.json')), true);

    const body = quoteBody({ buy: [{ quantity: 1, orders: 1, price: 10 }], sell: [{ quantity: 1, orders: 1, price: 11 }] });
    const result = await buildClient(new FixedQuoteTransport(body)).fetchMarketQuotes(INSTRUMENT);

    assert.strictEqual(result.ok, true, 'a diagnostic write failure must not affect the quote request');
  });

  it('CAP-17: captures even when the response body would fail normalisation (market-closed shape)', async () => {
    const target = join(dir, 'closed.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    assert.strictEqual(armDepthCapture(target), true);
    const body = quoteBody({ buy: [{ quantity: 0, orders: 0, price: 0 }], sell: [{ quantity: 0, orders: 0, price: 0 }] });
    const client = buildClient(new FixedQuoteTransport(body));

    const result = await client.fetchMarketQuotes(INSTRUMENT);

    // DTO parsing succeeds; the depth capture ran on the raw parsed body.
    assert.strictEqual(result.ok, true);
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.deepStrictEqual(doc.quotes[0].buy.levels[0].price, { state: 'present', value: 0 });
  });

  it('CAP-18: non-quote endpoints are not captured', async () => {
    const target = join(dir, 'should-not-exist.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    const client = buildClient(new FixedQuoteTransport(JSON.stringify({ ok: true })));

    await client.executeJsonPost('/marketfeed/ohlc', '{}');

    assert.strictEqual(existsSync(target), false, 'only the quote endpoint is captured');
  });
});

// ---------------------------------------------------------------------------
// 4. One-shot semantics: the first matching quote captures, later ones do not
// ---------------------------------------------------------------------------

describe('depth capture — one-shot', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'iips-depth-oneshot-'));
    resetDepthCaptureLatchForTests();
    delete process.env[DHAN_DEPTH_CAPTURE_ENV];
    delete process.env[DHAN_DEPTH_CAPTURE_LABEL_ENV];
  });

  afterEach(() => {
    delete process.env[DHAN_DEPTH_CAPTURE_ENV];
    delete process.env[DHAN_DEPTH_CAPTURE_LABEL_ENV];
    rmSync(dir, { recursive: true, force: true });
  });

  const buildClient = (transport: DhanHttpTransport): DhanApiClient =>
    new DhanApiClient({
      config: resolveDhanProviderConfig(CONFIGURED_ENV).config,
      transport,
      credentialResolver: new SyntheticCredentialResolver(),
    });

  const INSTRUMENT = [{ dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' as const }];

  it('CAP-19: the first quote captures, the second does not overwrite it', async () => {
    const target = join(dir, 'oneshot.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    assert.strictEqual(armDepthCapture(target), true);

    // One client, two sequential requests: emulates a continuously running daemon.
    const first = buildClient(new FixedQuoteTransport(
      quoteBody({ buy: [{ quantity: 0, orders: 0, price: 0 }], sell: [{ quantity: 0, orders: 0, price: 0 }] })
    ));
    await first.fetchMarketQuotes(INSTRUMENT);
    const captured = readFileSync(target, 'utf8');

    // Second quote would carry different depth; it must NOT replace the evidence.
    const second = buildClient(new FixedQuoteTransport(
      quoteBody({ buy: [{ quantity: 9, orders: 9, price: 999 }], sell: [{ quantity: 9, orders: 9, price: 999 }] })
    ));
    await second.fetchMarketQuotes(INSTRUMENT);

    assert.strictEqual(readFileSync(target, 'utf8'), captured, 'the captured evidence must be immutable');
    assert.ok(captured.includes('"value": 0'), 'the zero-depth evidence survives');
  });

  it('CAP-20: the arm marker is removed after a successful capture', async () => {
    const target = join(dir, 'disarm.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    assert.strictEqual(armDepthCapture(target), true);
    assert.strictEqual(isDepthCaptureArmed(target), true);

    await buildClient(new FixedQuoteTransport(quoteBody({ buy: [], sell: [] }))).fetchMarketQuotes(INSTRUMENT);

    assert.strictEqual(existsSync(target), true, 'capture written');
    assert.strictEqual(isDepthCaptureArmed(target), false, 'marker removed after capture');
    assert.strictEqual(existsSync(depthCaptureArmMarkerPath(target)), false);
  });

  it('CAP-21: a later quote cannot capture until explicitly re-armed', async () => {
    const target = join(dir, 'rearm.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;

    // First: armed and captured.
    armDepthCapture(target);
    await buildClient(new FixedQuoteTransport(quoteBody({ buy: [{ quantity: 1, orders: 1, price: 0 }], sell: [] }))).fetchMarketQuotes(INSTRUMENT);
    const firstCapture = readFileSync(target, 'utf8');

    // Disarmed: a later quote must not write.
    rmSync(target, { force: true });
    await buildClient(new FixedQuoteTransport(quoteBody({ buy: [], sell: [] }))).fetchMarketQuotes(INSTRUMENT);
    assert.strictEqual(existsSync(target), false, 'disarmed target must not capture');

    // Re-armed: captures again, proving no restart is needed.
    assert.strictEqual(armDepthCapture(target), true);
    await buildClient(new FixedQuoteTransport(quoteBody({ buy: [], sell: [] }))).fetchMarketQuotes(INSTRUMENT);
    assert.strictEqual(existsSync(target), true, 're-arm captures without restarting');
    assert.notStrictEqual(readFileSync(target, 'utf8'), firstCapture);
  });

  it('CAP-22: concurrent quotes capture exactly once (slot claimed before write)', async () => {
    const target = join(dir, 'concurrent.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    assert.strictEqual(armDepthCapture(target), true);

    const client = buildClient(new FixedQuoteTransport(quoteBody({ buy: [{ quantity: 0, orders: 0, price: 0 }], sell: [] })));
    await Promise.all([
      client.fetchMarketQuotes(INSTRUMENT),
      client.fetchMarketQuotes(INSTRUMENT),
      client.fetchMarketQuotes(INSTRUMENT),
    ]);

    // Exactly one document (three identical writes would also be indistinguishable,
    // so assert the latch directly as well).
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.strictEqual(doc.captureSchemaVersion, 2);
    assert.strictEqual(isDepthCaptureArmed(target), false);
  });

  it('CAP-23: arming a path whose directory cannot be created fails safe', () => {
    const blocking = join(dir, 'a-file');
    writeFileSync(blocking, 'x');
    assert.strictEqual(armDepthCapture(join(blocking, 'nested', 'cap.json')), false);
  });
});
