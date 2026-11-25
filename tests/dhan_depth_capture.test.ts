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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
  DHAN_DEPTH_CAPTURE_ALLOWED_SEGMENTS,
  DHAN_DEPTH_CAPTURE_ENV,
  DHAN_DEPTH_CAPTURE_LABEL_ENV,
  DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV,
  DHAN_DEPTH_CAPTURE_SEGMENT_ENV,
  armDepthCapture,
  captureDhanQuoteDepth,
  depthCaptureArmMarkerPath,
  isDepthCaptureArmed,
  isSelectedDepthCaptureRequest,
  readQuoteRequestInstruments,
  resetDepthCaptureLatchForTests,
  resolveDepthCapturePath,
  resolveDepthCaptureTarget,
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
  private readonly body: string;
  private readonly status: number;
  constructor(body: string, status = 200) {
    this.body = body;
    this.status = status;
  }
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

const isDirectory = (path: string): boolean => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

const captureContext = { capturedAtUtc: '2026-11-22T00:00:00.000Z', httpStatus: 200 };

const RELIANCE_TARGET = { segment: 'NSE_EQ', securityId: '2885' } as const;
const AGI_TARGET = { segment: 'NSE_EQ', securityId: '1412' } as const;

function setCaptureTarget(target: { segment: string; securityId: string }): void {
  process.env[DHAN_DEPTH_CAPTURE_SEGMENT_ENV] = target.segment;
  process.env[DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV] = target.securityId;
}

function clearCaptureEnv(): void {
  delete process.env[DHAN_DEPTH_CAPTURE_ENV];
  delete process.env[DHAN_DEPTH_CAPTURE_LABEL_ENV];
  delete process.env[DHAN_DEPTH_CAPTURE_SEGMENT_ENV];
  delete process.env[DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV];
}

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
    clearCaptureEnv();
  });

  afterEach(() => {
    clearCaptureEnv();
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
    setCaptureTarget(RELIANCE_TARGET);

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
    setCaptureTarget(RELIANCE_TARGET);
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
    // The target path IS a directory, so writeDepthCapture fails deterministically
    // (EISDIR / EPERM on Windows) AFTER the slot has been claimed. This is the real
    // fail-safe path: the diagnostic breaks, the quote does not.
    const target = join(dir, 'target-is-a-directory');
    mkdirSync(target);
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
    assert.strictEqual(armDepthCapture(target), true, 'arming writes a sibling marker, which is valid');

    const body = quoteBody({ buy: [{ quantity: 1, orders: 1, price: 10 }], sell: [{ quantity: 1, orders: 1, price: 11 }] });
    const result = await buildClient(new FixedQuoteTransport(body)).fetchMarketQuotes(INSTRUMENT);

    assert.strictEqual(result.ok, true, 'a diagnostic write failure must not affect the quote request');
    assert.strictEqual(isDirectory(target), true, 'nothing was written over the directory');
    // The write failed, so the capture never completed and the marker was not consumed:
    // the operator can fix the path and capture without re-arming the slot.
    assert.strictEqual(isDepthCaptureArmed(target), true, 'a failed write leaves the arm marker in place');
  });

  it('CAP-17: captures even when the response body would fail normalisation (market-closed shape)', async () => {
    const target = join(dir, 'closed.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
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
    setCaptureTarget(RELIANCE_TARGET);
    // ARMED: without this the test would pass for the wrong reason (the arm gate
    // alone would suppress the capture) and would not prove the endpoint filter.
    assert.strictEqual(armDepthCapture(target), true);
    const client = buildClient(new FixedQuoteTransport(JSON.stringify({ ok: true })));

    await client.executeJsonPost('/marketfeed/ohlc', '{}');

    assert.strictEqual(existsSync(target), false, 'only the quote endpoint is captured');
    assert.strictEqual(isDepthCaptureArmed(target), true, 'the slot is untouched by a non-quote endpoint');
  });
});

// ---------------------------------------------------------------------------
// 3b. The capture is scoped to ONE instrument: NSE_EQ / Dhan ID 2885
// ---------------------------------------------------------------------------

describe('depth capture — selected-instrument scoping', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'iips-depth-scope-'));
    resetDepthCaptureLatchForTests();
    clearCaptureEnv();
  });

  afterEach(() => {
    clearCaptureEnv();
    rmSync(dir, { recursive: true, force: true });
  });

  const buildClient = (transport: DhanHttpTransport): DhanApiClient =>
    new DhanApiClient({
      config: resolveDhanProviderConfig(CONFIGURED_ENV).config,
      transport,
      credentialResolver: new SyntheticCredentialResolver(),
    });

  const RELIANCE = [{ dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' as const }];
  const OTHER_COMPANY = [{ dhanSecurityId: '11536', exchangeSegment: 'NSE_EQ' as const }];
  const SAME_ID_OTHER_SEGMENT = [{ dhanSecurityId: '2885', exchangeSegment: 'BSE_EQ' as const }];

  /** Serves a body whose only instrument is the one the request named. */
  const bodyFor = (instrument: { dhanSecurityId: string; exchangeSegment: 'NSE_EQ' | 'BSE_EQ' }): string =>
    JSON.stringify({
      status: 'success',
      data: {
        [instrument.exchangeSegment]: {
          [instrument.dhanSecurityId]: {
            last_price: 1363,
            ohlc: { open: 1370, close: 1363, high: 1376.5, low: 1354 },
            volume: 1000,
            last_trade_time: '22/11/2026 15:29:58',
            depth: { buy: [{ quantity: 0, orders: 0, price: 0 }], sell: [{ quantity: 0, orders: 0, price: 0 }] },
          },
        },
      },
    });

  it('CAP-24: the selected instrument is captured', async () => {
    const target = join(dir, 'reliance.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
    assert.strictEqual(armDepthCapture(target), true);

    await buildClient(new FixedQuoteTransport(bodyFor(RELIANCE[0]!))).fetchMarketQuotes(RELIANCE);

    assert.strictEqual(existsSync(target), true, 'the selected request must capture');
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.deepStrictEqual(doc.requestedSecurityIds, ['2885']);
    assert.strictEqual(doc.quotes[0].securityId, '2885');
    assert.strictEqual(isDepthCaptureArmed(target), false, 'the capture consumed the one-shot');
  });

  it('CAP-25: another company\'s quote neither captures nor consumes the slot', async () => {
    const target = join(dir, 'other.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
    assert.strictEqual(armDepthCapture(target), true);

    const result = await buildClient(new FixedQuoteTransport(bodyFor(OTHER_COMPANY[0]!))).fetchMarketQuotes(OTHER_COMPANY);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(existsSync(target), false, 'a different security must not be captured');
    assert.strictEqual(isDepthCaptureArmed(target), true, 'the arm marker must survive, so the one-shot is still available');
  });

  it('CAP-26: Dhan ID 2885 on another exchange segment is not mistaken for Reliance', async () => {
    const target = join(dir, 'other-segment.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
    assert.strictEqual(armDepthCapture(target), true);

    await buildClient(new FixedQuoteTransport(bodyFor(SAME_ID_OTHER_SEGMENT[0]!))).fetchMarketQuotes(SAME_ID_OTHER_SEGMENT);

    assert.strictEqual(existsSync(target), false, 'the segment must match too');
    assert.strictEqual(isDepthCaptureArmed(target), true);
  });

  it('CAP-27: a multi-instrument batch is not captured (ambiguous request)', async () => {
    const target = join(dir, 'batch.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
    assert.strictEqual(armDepthCapture(target), true);

    const batch = [
      { dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' as const },
      { dhanSecurityId: '11536', exchangeSegment: 'NSE_EQ' as const },
    ];
    const body = JSON.stringify({
      status: 'success',
      data: { NSE_EQ: { '2885': { last_price: 1, depth: { buy: [], sell: [] } }, '11536': { last_price: 2, depth: { buy: [], sell: [] } } } },
    });
    await buildClient(new FixedQuoteTransport(body)).fetchMarketQuotes(batch);

    assert.strictEqual(existsSync(target), false, 'only an unambiguous single-instrument request is captured');
    assert.strictEqual(isDepthCaptureArmed(target), true);
  });

  it('CAP-28: a non-Reliance quote does not block a later Reliance capture in the same process', async () => {
    const target = join(dir, 'sequential.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
    assert.strictEqual(armDepthCapture(target), true);

    // Other traffic first — this is the scenario the earlier endpoint-level gate failed.
    await buildClient(new FixedQuoteTransport(bodyFor(OTHER_COMPANY[0]!))).fetchMarketQuotes(OTHER_COMPANY);
    assert.strictEqual(existsSync(target), false);

    // The intended request still captures.
    await buildClient(new FixedQuoteTransport(bodyFor(RELIANCE[0]!))).fetchMarketQuotes(RELIANCE);
    assert.strictEqual(existsSync(target), true, 'the slot was preserved for the selected request');
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.strictEqual(doc.quotes[0].securityId, '2885');
  });

  it('CAP-29: after the selected capture, further selected quotes do not overwrite it', async () => {
    const target = join(dir, 'immutable.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget(RELIANCE_TARGET);
    assert.strictEqual(armDepthCapture(target), true);

    await buildClient(new FixedQuoteTransport(bodyFor(RELIANCE[0]!))).fetchMarketQuotes(RELIANCE);
    const captured = readFileSync(target, 'utf8');

    // Second Reliance quote, different depth: must not replace the evidence.
    const changed = JSON.stringify({
      status: 'success',
      data: { NSE_EQ: { '2885': { last_price: 999, depth: { buy: [{ quantity: 9, orders: 9, price: 999 }], sell: [] } } } },
    });
    await buildClient(new FixedQuoteTransport(changed)).fetchMarketQuotes(RELIANCE);

    assert.strictEqual(readFileSync(target, 'utf8'), captured, 'the captured evidence must be immutable');
  });

  it('CAP-30: the request-body reader and matcher are strict about shape', () => {
    assert.deepStrictEqual(readQuoteRequestInstruments({ NSE_EQ: [2885] }), [{ segment: 'NSE_EQ', securityId: '2885' }]);
    assert.deepStrictEqual(readQuoteRequestInstruments({}), []);
    assert.deepStrictEqual(readQuoteRequestInstruments(undefined), []);
    assert.deepStrictEqual(readQuoteRequestInstruments('not-json'), []);
    assert.deepStrictEqual(readQuoteRequestInstruments({ NSE_EQ: '2885' }), [], 'a non-array segment yields nothing');

    const relianceTarget = { segment: 'NSE_EQ' as const, securityId: '2885' };
    assert.strictEqual(isSelectedDepthCaptureRequest([{ segment: 'NSE_EQ', securityId: '2885' }], relianceTarget), true);
    assert.strictEqual(isSelectedDepthCaptureRequest([{ segment: 'BSE_EQ', securityId: '2885' }], relianceTarget), false);
    assert.strictEqual(isSelectedDepthCaptureRequest([{ segment: 'NSE_EQ', securityId: '2886' }], relianceTarget), false);
    assert.strictEqual(isSelectedDepthCaptureRequest([], relianceTarget), false);
    assert.strictEqual(
      isSelectedDepthCaptureRequest([
        { segment: 'NSE_EQ', securityId: '2885' },
        { segment: 'NSE_EQ', securityId: '11536' },
      ], relianceTarget),
      false
    );
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
    clearCaptureEnv();
  });

  afterEach(() => {
    clearCaptureEnv();
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
    setCaptureTarget(RELIANCE_TARGET);
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
    setCaptureTarget(RELIANCE_TARGET);
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
    setCaptureTarget(RELIANCE_TARGET);

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
    setCaptureTarget(RELIANCE_TARGET);
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

// ---------------------------------------------------------------------------
// 5. Configurable target: required coverage for instrument-generic capture
// ---------------------------------------------------------------------------

describe('depth capture — configurable target selection', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'iips-depth-target-'));
    resetDepthCaptureLatchForTests();
    clearCaptureEnv();
  });

  afterEach(() => {
    clearCaptureEnv();
    rmSync(dir, { recursive: true, force: true });
  });

  const buildClient = (transport: DhanHttpTransport): DhanApiClient =>
    new DhanApiClient({
      config: resolveDhanProviderConfig(CONFIGURED_ENV).config,
      transport,
      credentialResolver: new SyntheticCredentialResolver(),
    });

  const bodyFor = (segment: 'NSE_EQ' | 'BSE_EQ', securityId: string, depth: unknown = { buy: [{ quantity: 0, orders: 0, price: 0 }], sell: [{ quantity: 0, orders: 0, price: 0 }] }): string =>
    JSON.stringify({
      status: 'success',
      data: {
        [segment]: {
          [securityId]: {
            last_price: 1363,
            ohlc: { open: 1370, close: 1363, high: 1376.5, low: 1354 },
            volume: 1000,
            last_trade_time: '22/11/2026 15:29:58',
            depth,
          },
        },
      },
    });

  it('CFG-01: Reliance configured as target is captured', async () => {
    const target = join(dir, 'reliance.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget({ segment: 'NSE_EQ', securityId: '2885' });
    assert.strictEqual(armDepthCapture(target), true);

    const result = await buildClient(new FixedQuoteTransport(bodyFor('NSE_EQ', '2885'))).fetchMarketQuotes([
      { dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' },
    ]);

    assert.strictEqual(result.ok, true);
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.strictEqual(doc.quotes[0].segment, 'NSE_EQ');
    assert.strictEqual(doc.quotes[0].securityId, '2885');
  });

  it('CFG-02: AGI Greenpac configured as target is captured', async () => {
    const target = join(dir, 'agi.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget({ segment: 'NSE_EQ', securityId: '1412' });
    assert.strictEqual(armDepthCapture(target), true);

    const result = await buildClient(new FixedQuoteTransport(bodyFor('NSE_EQ', '1412'))).fetchMarketQuotes([
      { dhanSecurityId: '1412', exchangeSegment: 'NSE_EQ' },
    ]);

    assert.strictEqual(result.ok, true);
    assert.strictEqual(existsSync(target), true);
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.strictEqual(doc.captureSchemaVersion, 2);
    assert.strictEqual(doc.instrumentsInResponse, 1);
    assert.strictEqual(doc.quotes[0].segment, 'NSE_EQ');
    assert.strictEqual(doc.quotes[0].securityId, '1412');
    assert.deepStrictEqual(doc.requestedSecurityIds, ['1412']);
    assert.deepStrictEqual(doc.quotes[0].buy.levels[0].price, { state: 'present', value: 0 });
  });

  it('CFG-03: another valid instrument configured as target is captured', async () => {
    const target = join(dir, 'other-valid.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget({ segment: 'BSE_EQ', securityId: '500325' });
    assert.strictEqual(armDepthCapture(target), true);

    const result = await buildClient(new FixedQuoteTransport(bodyFor('BSE_EQ', '500325'))).fetchMarketQuotes([
      { dhanSecurityId: '500325', exchangeSegment: 'BSE_EQ' },
    ]);

    assert.strictEqual(result.ok, true);
    const doc = JSON.parse(readFileSync(target, 'utf8'));
    assert.strictEqual(doc.quotes[0].segment, 'BSE_EQ');
    assert.strictEqual(doc.quotes[0].securityId, '500325');
  });

  it('CFG-04: wrong security ID request does not capture or consume the slot', async () => {
    const target = join(dir, 'wrong-id.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget({ segment: 'NSE_EQ', securityId: '1412' }); // AGI configured
    assert.strictEqual(armDepthCapture(target), true);

    await buildClient(new FixedQuoteTransport(bodyFor('NSE_EQ', '2885'))).fetchMarketQuotes([
      { dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' },
    ]);

    assert.strictEqual(existsSync(target), false);
    assert.strictEqual(isDepthCaptureArmed(target), true, 'slot must remain armed for the configured target');
  });

  it('CFG-05: wrong exchange segment request does not capture or consume the slot', async () => {
    const target = join(dir, 'wrong-seg.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget({ segment: 'NSE_EQ', securityId: '1412' });
    assert.strictEqual(armDepthCapture(target), true);

    await buildClient(new FixedQuoteTransport(bodyFor('BSE_EQ', '1412'))).fetchMarketQuotes([
      { dhanSecurityId: '1412', exchangeSegment: 'BSE_EQ' },
    ]);

    assert.strictEqual(existsSync(target), false);
    assert.strictEqual(isDepthCaptureArmed(target), true);
  });

  it('CFG-06: multiple instruments in request do not capture or consume the slot', async () => {
    const target = join(dir, 'multi.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget({ segment: 'NSE_EQ', securityId: '1412' });
    assert.strictEqual(armDepthCapture(target), true);

    const body = JSON.stringify({
      status: 'success',
      data: {
        NSE_EQ: {
          '1412': { last_price: 1, ohlc: { open: 1, close: 1, high: 1, low: 1 }, volume: 1, last_trade_time: '22/11/2026 15:29:58', depth: { buy: [], sell: [] } },
          '2885': { last_price: 2, ohlc: { open: 2, close: 2, high: 2, low: 2 }, volume: 2, last_trade_time: '22/11/2026 15:29:58', depth: { buy: [], sell: [] } },
        },
      },
    });
    await buildClient(new FixedQuoteTransport(body)).fetchMarketQuotes([
      { dhanSecurityId: '1412', exchangeSegment: 'NSE_EQ' },
      { dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' },
    ]);

    assert.strictEqual(existsSync(target), false);
    assert.strictEqual(isDepthCaptureArmed(target), true);
  });

  it('CFG-07: missing target config fails safe (no capture, no slot consumption)', async () => {
    const target = join(dir, 'missing-target.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    // No segment, no security ID configured.
    assert.strictEqual(armDepthCapture(target), true);

    const result = await buildClient(new FixedQuoteTransport(bodyFor('NSE_EQ', '2885'))).fetchMarketQuotes([
      { dhanSecurityId: '2885', exchangeSegment: 'NSE_EQ' },
    ]);

    assert.strictEqual(result.ok, true, 'quote processing must be unaffected');
    assert.strictEqual(existsSync(target), false, 'no capture without explicit target');
    assert.strictEqual(isDepthCaptureArmed(target), true, 'arm marker remains for operator to fix config');
  });

  it('CFG-08: partial/invalid target config fails safe', async () => {
    const cases: Array<{ name: string; env: Record<string, string>; request: { segment: 'NSE_EQ'; id: string } }> = [
      { name: 'segment only', env: { [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ' }, request: { segment: 'NSE_EQ', id: '2885' } },
      { name: 'security ID only', env: { [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '2885' }, request: { segment: 'NSE_EQ', id: '2885' } },
      { name: 'invalid segment', env: { [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_FO', [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '2885' }, request: { segment: 'NSE_EQ', id: '2885' } },
      { name: 'invalid security ID (non-numeric)', env: { [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ', [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: 'abc' }, request: { segment: 'NSE_EQ', id: '2885' } },
      { name: 'invalid security ID (empty)', env: { [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ', [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '   ' }, request: { segment: 'NSE_EQ', id: '2885' } },
      { name: 'invalid security ID (zero)', env: { [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ', [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '0' }, request: { segment: 'NSE_EQ', id: '2885' } },
    ];

    for (const c of cases) {
      resetDepthCaptureLatchForTests();
      clearCaptureEnv();
      const target = join(dir, `${c.name.replace(/[^a-z0-9]+/gi, '-')}.json`);
      process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
      for (const [k, v] of Object.entries(c.env)) process.env[k] = v;
      assert.strictEqual(armDepthCapture(target), true, `arm ${c.name}`);

      const result = await buildClient(new FixedQuoteTransport(bodyFor(c.request.segment, c.request.id))).fetchMarketQuotes([
        { dhanSecurityId: c.request.id, exchangeSegment: c.request.segment },
      ]);

      assert.strictEqual(result.ok, true, `quote ok ${c.name}`);
      assert.strictEqual(existsSync(target), false, `no capture ${c.name}`);
      assert.strictEqual(isDepthCaptureArmed(target), true, `arm preserved ${c.name}`);
    }
  });

  it('CFG-09: resolveDepthCaptureTarget reports disabled/invalid/valid explicitly', () => {
    assert.deepStrictEqual(resolveDepthCaptureTarget({}), { state: 'disabled' });
    assert.deepStrictEqual(resolveDepthCaptureTarget({ [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ' }), {
      state: 'invalid',
      reason: `${DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV} must be explicitly configured when depth capture target selection is enabled`,
    });
    assert.deepStrictEqual(resolveDepthCaptureTarget({ [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '1412' }), {
      state: 'invalid',
      reason: `${DHAN_DEPTH_CAPTURE_SEGMENT_ENV} must be explicitly configured when depth capture target selection is enabled`,
    });
    assert.deepStrictEqual(resolveDepthCaptureTarget({ [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NYSE', [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '1412' }), {
      state: 'invalid',
      reason: `${DHAN_DEPTH_CAPTURE_SEGMENT_ENV} must be one of ${DHAN_DEPTH_CAPTURE_ALLOWED_SEGMENTS.join(', ')}`,
    });
    assert.deepStrictEqual(resolveDepthCaptureTarget({ [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: 'NSE_EQ', [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: '-1' }), {
      state: 'invalid',
      reason: `${DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV} must be a positive integer string`,
    });
    assert.deepStrictEqual(resolveDepthCaptureTarget({ [DHAN_DEPTH_CAPTURE_SEGMENT_ENV]: ' NSE_EQ ', [DHAN_DEPTH_CAPTURE_SECURITY_ID_ENV]: ' 1412 ' }), {
      state: 'valid',
      target: { segment: 'NSE_EQ', securityId: '1412' },
    });
  });

  it('CFG-10: AGI capture preserves one-shot and marker consumption', async () => {
    const target = join(dir, 'agi-oneshot.json');
    process.env[DHAN_DEPTH_CAPTURE_ENV] = target;
    setCaptureTarget({ segment: 'NSE_EQ', securityId: '1412' });
    assert.strictEqual(armDepthCapture(target), true);

    const first = buildClient(new FixedQuoteTransport(bodyFor('NSE_EQ', '1412', { buy: [{ quantity: 1, orders: 1, price: 100 }], sell: [] })));
    await first.fetchMarketQuotes([{ dhanSecurityId: '1412', exchangeSegment: 'NSE_EQ' }]);
    const captured = readFileSync(target, 'utf8');
    assert.strictEqual(isDepthCaptureArmed(target), false, 'marker consumed after capture');

    const second = buildClient(new FixedQuoteTransport(bodyFor('NSE_EQ', '1412', { buy: [{ quantity: 9, orders: 9, price: 999 }], sell: [] })));
    await second.fetchMarketQuotes([{ dhanSecurityId: '1412', exchangeSegment: 'NSE_EQ' }]);
    assert.strictEqual(readFileSync(target, 'utf8'), captured, 'one-shot evidence immutable');
  });
});
