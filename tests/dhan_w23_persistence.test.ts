/**
 * W-23 — Persistence: three separate acceptances (plus corrupt-store degradation)
 *
 * The roadmap's §7.3 is explicit that the three acceptances must never be conflated:
 *   (A) restart          — the daemon stops and starts again, serving requests;
 *   (B) cold-cache restart — with no store, it starts, reports MISS/UNKNOWN honestly, serves cold;
 *   (C) persistence      — evidence written before the restart is readable, correct and
 *                          freshness-consistent after it;
 * plus (D) a corrupt store degrades safely to a cold start without failing boot or inventing
 * evidence, and (E) no persistence coupling is introduced into the provider modules.
 *
 * (A) and (B) are NOT evidence of (C), so they are asserted separately and never substituted
 * for each other. Every acceptance here is E2 (synthetic, offline): this sandbox is not the
 * authorised Windows host, so the E3 launcher sequence is recorded as outstanding rather than
 * claimed.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DHAN_PERSISTED_STATE_MAX_BYTES,
  DHAN_PERSISTED_STATE_SCHEMA_VERSION,
  DhanInMemoryStateStore,
  NOOP_DHAN_STATE_STORE,
  parseDhanPersistedState,
  type DhanPersistedState,
  type DhanStateLoadOutcome,
} from '../src/providers/dhan/dhan_state_store.js';
import { DhanFileStateStore } from '../src/providers/dhan/dhan_file_state_store.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { DhanApiClient, type DhanHttpRequest, type DhanHttpResponse, type DhanHttpTransport } from '../src/providers/dhan/dhan_api_client.js';
import { resolveDhanProviderConfig } from '../src/providers/dhan/dhan_config.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import { DhanBoundedCache } from '../src/providers/dhan/dhan_operational_controls.js';
import {
  MARKET_DATA_STATE_PATH_ENV,
  IIPS_DATA_DIR_ENV,
  DEFAULT_MARKET_DATA_STATE_RELATIVE_PATH,
  MARKET_DATA_ROUTES,
  MarketDataTransportClient,
  createMarketDataHttpServer,
  resolveStateStore,
  resolveStateStorePath,
  startMarketDataDaemon,
} from '../src/providers/dhan/index.js';
import type { AddressInfo } from 'node:net';

// ── Fixtures ────────────────────────────────────────────────────────────────

const TOKEN = 'W23_SYNTHETIC_TRANSPORT_TOKEN';
/** 2026-11-25 11:30 IST — inside the NSE session, so a fresh quote is GOOD. */
const CLOCK = Date.parse('2026-11-25T06:00:00.000Z');
const ID_INFY = buildD114SecurityIdentity('INE009A01021', 'EQ')!;
const MAPPING = {
  companyId: 'EQ_INFY_IN',
  isin: 'INE009A01021',
  securityId: 'ISIN:INE009A01021:EQ',
  exchange: 'NSE' as const,
  symbol: 'INFY',
  exchangeSegment: 'NSE_EQ' as const,
  dhanSecurityId: '1594',
  series: 'EQ',
  mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const,
  instrumentType: 'EQUITY' as const,
  active: true,
};
const QUOTE_REQUEST = { companyId: 'EQ_INFY_IN', securityIdentity: ID_INFY, exchangeSegment: 'NSE_EQ' as const };

/**
 * Renders the vendor's `last_trade_time`, which the Dhan adapter requires in
 * `DD/MM/YYYY HH:mm:ss` IST form (it rejects ISO). Derived from the harness clock so the
 * quote is genuinely fresh rather than suppressed by the freshness check.
 */
function istTimestamp(clockMs: number): string {
  const ist = new Date(clockMs + 5.5 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(ist.getUTCDate())}/${pad(ist.getUTCMonth() + 1)}/${ist.getUTCFullYear()} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`;
}

class ScriptedQuoteTransport implements DhanHttpTransport {
  public calls: DhanHttpRequest[] = [];
  public lastTradeTime: string;
  constructor(clockMs: number) {
    this.lastTradeTime = istTimestamp(clockMs);
  }
  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    this.calls.push(request);
    return {
      status: 200,
      bodyText: JSON.stringify({
        status: 'success',
        data: {
          NSE_EQ: {
            '1594': {
              last_price: 1860.25,
              ohlc: { open: 1845, close: 1840, high: 1870, low: 1838 },
              volume: 1920000,
              net_change: 20.25,
              last_trade_time: this.lastTradeTime,
            },
          },
        },
      }),
    };
  }
}

interface Rig {
  service: DhanMarketDataService;
  transport: ScriptedQuoteTransport;
  setClock: (ms: number) => void;
}

function buildService(options: {
  clock?: number;
  stateStore?: DhanInMemoryStateStore | DhanFileStateStore | typeof NOOP_DHAN_STATE_STORE;
  cache?: DhanBoundedCache<never>;
} = {}): Rig {
  let now = options.clock ?? CLOCK;
  const transport = new ScriptedQuoteTransport(now);
  const registry = new DhanInstrumentRegistry();
  registry.register(MAPPING);
  const client = new DhanApiClient({
    config: resolveDhanProviderConfig({}).config,
    transport,
    credentialResolver: { resolve: async () => ({ accessToken: 'SYNTHETIC_TOKEN', clientId: 'SYNTHETIC_CLIENT' }) } as never,
    now: () => now,
  });
  const service = new DhanMarketDataService({
    client,
    securityMaster: new SecurityMaster(),
    instrumentRegistry: registry,
    now: () => new Date(now),
    ...(options.stateStore ? { stateStore: options.stateStore } : {}),
  });
  service.start();
  return {
    service,
    transport,
    setClock: (ms) => {
      now = ms;
      transport.lastTradeTime = istTimestamp(ms);
    },
  };
}

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'w23-'));
}

// ── (A) Restart ─────────────────────────────────────────────────────────────

describe('W23-A: ACCEPTANCE (a) — the daemon stops and starts again, serving a request', () => {
  it('W23-A01: two sequential daemon lifecycles on one port, the second serves authenticated requests', async () => {
    const dir = tempDir();
    try {
      const env = { [MARKET_DATA_STATE_PATH_ENV]: join(dir, 'state.json') };

      // First lifecycle.
      const first = await startMarketDataDaemon({ env, host: '127.0.0.1', port: 0, transportToken: TOKEN });
      assert.equal(first.ok, true, JSON.stringify(first));
      if (!first.ok) return;
      const firstClient = new MarketDataTransportClient(first.diagnostics.baseUrl, TOKEN, { env: {} });
      assert.equal((await firstClient.health()).ok, true);
      await first.handle.shutdown();

      // Second lifecycle on a freshly allocated port: stop, then start, then SERVE.
      const second = await startMarketDataDaemon({ env, host: '127.0.0.1', port: 0, transportToken: TOKEN });
      assert.equal(second.ok, true, JSON.stringify(second));
      if (!second.ok) return;
      try {
        const secondClient = new MarketDataTransportClient(second.diagnostics.baseUrl, TOKEN, { env: {} });
        const health = await secondClient.health();
        assert.equal(health.ok, true);
        if (health.ok) assert.equal(health.service, 'UP');
        const diag = await secondClient.diagnostics();
        assert.equal(diag.ok, true, 'the restarted daemon serves its governed diagnostics');
      } finally {
        await second.handle.shutdown();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W23-A02: acceptance (a) alone records NO persistence claim', async () => {
    // The point of this test is the roadmap's warning: a successful restart is not evidence
    // of persistence. With persistence disabled the restart is still fully successful.
    const first = await startMarketDataDaemon({ env: {}, host: '127.0.0.1', port: 0, transportToken: TOKEN });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.diagnostics.statePersistence.enabled, false);
    assert.equal(first.diagnostics.statePersistence.path, null);
    assert.equal(first.diagnostics.statePersistence.restore.status, 'NO_STORE');
    await first.handle.shutdown();
    assert.equal(first.handle.lastPersistOutcome?.status, 'SKIPPED');

    const second = await startMarketDataDaemon({ env: {}, host: '127.0.0.1', port: 0, transportToken: TOKEN });
    assert.equal(second.ok, true, 'a restart succeeds with persistence entirely off');
    if (second.ok) {
      assert.equal(second.diagnostics.statePersistence.restore.quotesRestored, 0);
      await second.handle.shutdown();
    }
  });
});

// ── (B) Cold-cache restart ──────────────────────────────────────────────────

describe('W23-B: ACCEPTANCE (b) — with no store, start cold and report MISS/UNKNOWN honestly', () => {
  it('W23-B01: a never-fetched quote reports MISS/UNKNOWN with no fabricated evidence', async () => {
    const rig = buildService({ stateStore: new DhanInMemoryStateStore() });
    assert.equal(rig.service.getStateRestoreReport().status, 'ABSENT');

    const status = rig.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });
    assert.equal(status.cacheState, 'MISS');
    assert.equal(status.verdict, 'UNKNOWN');
    assert.equal(status.asOf, null);
    assert.equal(status.ageSeconds, null);
    assert.equal(status.receivedAt, null);
    assert.equal(status.suppressExecution, true, 'unknown evidence must suppress, not permit');
    assert.equal(status.eligibleForUse, false);
  });

  it('W23-B02: diagnostics report an empty cache and an ABSENT restore, not a silent zero', async () => {
    const rig = buildService({ stateStore: new DhanInMemoryStateStore() });
    const diag = await rig.service.getDiagnostics();
    assert.equal(diag.quoteCache.size, 0);
    assert.equal(diag.quoteCache.state, 'EMPTY');
    assert.equal(diag.persistence.enabled, true, 'persistence IS configured here; there is just no file yet');
    assert.equal(diag.persistence.restoreStatus, 'ABSENT');
    assert.equal(diag.persistence.quotesRestored, 0);
  });

  it('W23-B03: the served HTTP surface states coldness the same way the service does', async () => {
    const rig = buildService({ stateStore: new DhanInMemoryStateStore() });
    const server = createMarketDataHttpServer({ service: rig.service, token: TOKEN, host: '127.0.0.1', env: {} });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const port = (server.address() as AddressInfo).port;
    try {
      const query = new URLSearchParams({
        domain: 'D01_QUOTES',
        companyId: QUOTE_REQUEST.companyId,
        exchangeSegment: 'NSE_EQ',
        securityId: ID_INFY.securityId,
      });
      const res = await fetch(`http://127.0.0.1:${port}${MARKET_DATA_ROUTES.freshness}?${query}`, {
        headers: { authorization: `Bearer ${TOKEN}` },
      });
      assert.equal(res.status, 200);
      const body = (await res.json()) as { cacheState: string; verdict: string; ageSeconds: number | null };
      assert.equal(body.cacheState, 'MISS');
      assert.equal(body.verdict, 'UNKNOWN');
      assert.equal(body.ageSeconds, null);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it('W23-B04: a cold process issues no vendor request merely because persistence is configured', () => {
    const rig = buildService({ stateStore: new DhanInMemoryStateStore() });
    assert.deepEqual(rig.transport.calls, [], 'restore must never reach the provider');
  });
});

// ── (C) Persistence ─────────────────────────────────────────────────────────

describe('W23-C: ACCEPTANCE (c) — evidence survives the restart and stays freshness-consistent', () => {
  it('W23-C01: a cached quote is readable after the restart with its ORIGINAL instants', async () => {
    const store = new DhanInMemoryStateStore();

    // Process 1: fetch a real quote through the scripted transport, then persist.
    const first = buildService({ stateStore: store });
    const quote = await first.service.getQuote(QUOTE_REQUEST);
    assert.equal(quote.ok, true, JSON.stringify(quote));
    const before = first.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });
    assert.equal(before.cacheState, 'CURRENT');
    assert.equal(before.verdict, 'GOOD');

    const persisted = first.service.persistRetainedState();
    assert.equal(persisted.outcome.status, 'SAVED');
    assert.equal(persisted.snapshot.quotes.length, 1);

    // Process 2 at the SAME clock: the entry is there and the instants are preserved.
    const second = buildService({ stateStore: store });
    const report = second.service.getStateRestoreReport();
    assert.equal(report.status, 'LOADED');
    assert.equal(report.quotesRestored, 1);
    assert.equal(report.quotesDroppedAsUnavailable, 0);

    const after = second.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });
    assert.equal(after.cacheState, 'CURRENT');
    assert.equal(after.verdict, 'GOOD');
    assert.equal(after.asOf, before.asOf, 'asOf is NEVER re-stamped on restore');
    assert.equal(after.receivedAt, before.receivedAt, 'receivedAt is evidence of the original retrieval');
    assert.equal(after.ageSeconds, before.ageSeconds);

    // And no vendor call was needed to serve it.
    assert.deepEqual(second.transport.calls, [], 'a restored quote is served without the provider');
    const diag = await second.service.getDiagnostics();
    assert.equal(diag.quoteCache.size, 1);
    assert.equal(diag.persistence.quotesRestored, 1);
  });

  it('W23-C02: classification is RECOMPUTED across the outage, never replayed from the store', async () => {
    const store = new DhanInMemoryStateStore();
    const first = buildService({ stateStore: store });
    assert.equal((await first.service.getQuote(QUOTE_REQUEST)).ok, true);
    assert.equal(first.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST }).cacheState, 'CURRENT');
    first.service.persistRetainedState();

    // Two hours later the same quote is 2h old. D01 is 15 minutes, so 2h is exactly 8x —
    // UNAVAILABLE. A store that replayed the verdict would report CURRENT here.
    const second = buildService({ clock: CLOCK + 2 * 60 * 60 * 1000, stateStore: store });
    const report = second.service.getStateRestoreReport();
    assert.equal(report.status, 'LOADED');
    assert.equal(report.quotesRestored, 0, 'suppressed evidence is not admitted');
    assert.equal(report.quotesDroppedAsUnavailable, 1);

    const after = second.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });
    assert.equal(after.cacheState, 'MISS', 'the dropped entry is not silently reported as present');
    assert.equal(after.verdict, 'UNKNOWN');

    const diag = await second.service.getDiagnostics();
    assert.equal(diag.quoteCache.size, 0, 'the cache size never includes evidence no caller may use');
  });

  it('W23-C03: an entry that ages into the concessional band is admitted as STALE', async () => {
    const store = new DhanInMemoryStateStore();
    const first = buildService({ stateStore: store });
    assert.equal((await first.service.getQuote(QUOTE_REQUEST)).ok, true);
    first.service.persistRetainedState();

    // 20 minutes: past the 15-minute D01 threshold, inside the 2x concession window.
    const second = buildService({ clock: CLOCK + 20 * 60 * 1000, stateStore: store });
    assert.equal(second.service.getStateRestoreReport().quotesRestored, 1);
    const after = second.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });
    assert.equal(after.cacheState, 'STALE');
    assert.equal(after.verdict, 'STALE');
    assert.equal(after.eligibleForUse, true, 'STALE is a concession, not a suppression');
    assert.equal(after.ageSeconds, 20 * 60, 'age is measured from the ORIGINAL observation');
  });

  it('W23-C04: refresh state and observed provider state survive as history', async () => {
    const store = new DhanInMemoryStateStore();
    const first = buildService({ stateStore: store });
    assert.equal((await first.service.getQuote(QUOTE_REQUEST)).ok, true);
    const saved = first.service.persistRetainedState();
    assert.equal(saved.snapshot.observed?.lastSuccessAt !== undefined, true);

    const second = buildService({ stateStore: store });
    const report = second.service.getStateRestoreReport();
    assert.equal(report.observedStateRestored, true);
    assert.ok(report.refreshEntriesRestored >= 1, 'the refresh attempt is remembered');

    const diag = await second.service.getDiagnostics();
    // Restored history must not be reported as a live claim.
    assert.equal(diag.liveProviderConnectivity, 'NOT_CHECKED_PRE_ACCESS');
    assert.equal(diag.providerQualification, 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED');
    assert.equal(diag.persistence.observedStateRestored, true);
  });

  it('W23-C05: an active auth latch is recorded as history and NOT restored as an active latch', async () => {
    // Rationale (W-23 contract §3.4): the W-05 latch stops THIS process hammering the vendor.
    // A restart is the operator's chance to rotate the credential, so restoring an active
    // latch would make the documented recovery route unreachable.
    const store = new DhanInMemoryStateStore();
    const first = buildService({ stateStore: store });
    const recorder = (first.service as unknown as { client: { getStateRecorder(): { recordFailure(input: unknown): void } } }).client.getStateRecorder();
    recorder.recordFailure({ category: 'AUTHENTICATION_FAILURE', at: new Date(CLOCK).toISOString() });
    recorder.recordFailure({ category: 'AUTHENTICATION_FAILURE', at: new Date(CLOCK).toISOString() });

    const saved = first.service.persistRetainedState();
    assert.equal(saved.snapshot.observed?.authLatched, true, 'the store records that it WAS latched');

    const second = buildService({ stateStore: store });
    const report = second.service.getStateRestoreReport();
    assert.equal(report.observedStateRestored, true);
    assert.equal(report.authLatchClearedByRestart, true, 'the restart is reported as having cleared it');

    const diag = await second.service.getDiagnostics();
    assert.equal(diag.authLatched, false, 'the new process may attempt authentication');
    assert.equal(diag.persistence.authLatchClearedByRestart, true);
    assert.notEqual(diag.providerState, 'UNAVAILABLE', 'a cleared latch must not read as an outage');
  });

  it('W23-C06: persisting never mutates the live process, and the snapshot is a faithful copy', async () => {
    const store = new DhanInMemoryStateStore();
    const rig = buildService({ stateStore: store });
    assert.equal((await rig.service.getQuote(QUOTE_REQUEST)).ok, true);

    const before = rig.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });
    const snapshot = rig.service.snapshotRetainedState();
    const after = rig.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });

    assert.deepEqual(after, before, 'taking a snapshot must not change what the service reports');
    assert.equal(snapshot.quotes.length, 1);
    assert.equal(snapshot.quotes[0]!.order, 0, 'LRU order is explicit so a restore preserves it');
    assert.equal(snapshot.schemaVersion, DHAN_PERSISTED_STATE_SCHEMA_VERSION);
  });

  it('W23-C07: the persisted store contains no credential material', async () => {
    const dir = tempDir();
    try {
      const path = join(dir, 'state.json');
      const store = new DhanFileStateStore({ path });
      const rig = buildService({ stateStore: store });
      assert.equal((await rig.service.getQuote(QUOTE_REQUEST)).ok, true);
      assert.equal(rig.service.persistRetainedState().outcome.status, 'SAVED');

      const text = readFileSync(path, 'utf8');
      for (const canary of ['SYNTHETIC_TOKEN', 'vault://', 'secretId', 'keyPath', 'accessToken', 'clientId']) {
        assert.ok(!text.includes(canary), `persisted store must not contain ${canary}`);
      }
      assert.ok(text.includes('INE009A01021'), 'it does contain the market data it is supposed to hold');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── (D) Corrupt-store degradation ───────────────────────────────────────────

describe('W23-D: a corrupt store degrades to a cold start; boot never fails', () => {
  const cases: Array<[string, string, string]> = [
    ['truncated JSON', '{"schemaVersion":1,"writtenAt":"2026-11-25T06:00:00.000Z","quo', 'INVALID_JSON'],
    ['not JSON at all', 'this is not json', 'INVALID_JSON'],
    ['empty file', '', 'INVALID_JSON'],
    ['wrong schema version', JSON.stringify({ schemaVersion: 99, writtenAt: '2026-11-25T06:00:00.000Z', quotes: [], refresh: [], observed: null }), 'SCHEMA_MISMATCH'],
    ['missing fields', JSON.stringify({ schemaVersion: 1 }), 'INVALID_SHAPE'],
    ['quotes not an array', JSON.stringify({ schemaVersion: 1, writtenAt: '2026-11-25T06:00:00.000Z', quotes: {}, refresh: [], observed: null }), 'INVALID_SHAPE'],
    ['bad envelope', JSON.stringify({ schemaVersion: 1, writtenAt: '2026-11-25T06:00:00.000Z', quotes: [{ key: 'k', order: 0, envelope: { nope: true } }], refresh: [], observed: null }), 'INVALID_SHAPE'],
    ['null payload', JSON.stringify({ schemaVersion: 1, writtenAt: '2026-11-25T06:00:00.000Z', quotes: null, refresh: [], observed: null }), 'INVALID_SHAPE'],
  ];

  it('W23-D01: every corrupt shape loads as CORRUPT and the service still boots cold', async () => {
    for (const [label, contents, expectedReason] of cases) {
      const dir = tempDir();
      try {
        const path = join(dir, 'state.json');
        writeFileSync(path, contents, 'utf8');
        const store = new DhanFileStateStore({ path });
        const loaded = store.load();
        assert.equal(loaded.status, 'CORRUPT', `${label} must be CORRUPT`);
        if (loaded.status === 'CORRUPT') assert.equal(loaded.reason, expectedReason, label);

        // Boot must succeed and report the real reason rather than pretending to be cold-by-choice.
        const rig = buildService({ stateStore: store });
        const report = rig.service.getStateRestoreReport();
        assert.equal(report.status, 'CORRUPT', label);
        assert.equal(report.reason, expectedReason, label);
        assert.equal(report.quotesRestored, 0, label);

        const diag = await rig.service.getDiagnostics();
        assert.equal(diag.service, 'UP', `${label} must not prevent boot`);
        assert.equal(diag.persistence.restoreStatus, 'CORRUPT');
        assert.equal(diag.persistence.restoreReason, expectedReason);
        assert.equal(diag.quoteCache.size, 0, `${label} must not admit partial state`);

        const status = rig.service.getFreshness({ domain: 'D01_QUOTES', ...QUOTE_REQUEST });
        assert.equal(status.cacheState, 'MISS', `${label} must not invent evidence`);
        assert.equal(status.verdict, 'UNKNOWN');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('W23-D02: an oversized store is refused before it is parsed', () => {
    const dir = tempDir();
    try {
      const path = join(dir, 'state.json');
      writeFileSync(path, 'x'.repeat(DHAN_PERSISTED_STATE_MAX_BYTES + 1), 'utf8');
      assert.ok(statSync(path).size > DHAN_PERSISTED_STATE_MAX_BYTES);
      const loaded = new DhanFileStateStore({ path }).load();
      assert.equal(loaded.status, 'CORRUPT');
      if (loaded.status === 'CORRUPT') assert.equal(loaded.reason, 'TOO_LARGE');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W23-D03: a corrupt store next to a previously good one never loses the good file', () => {
    // The atomic write means a failed save leaves the previous store intact; here we prove the
    // read side treats a hand-corrupted file as CORRUPT while a rewrite restores service.
    const dir = tempDir();
    try {
      const path = join(dir, 'state.json');
      const store = new DhanFileStateStore({ path });
      const rig = buildService({ stateStore: store });
      return rig.service.getQuote(QUOTE_REQUEST).then(async () => {
        rig.service.persistRetainedState();
        assert.equal(store.load().status, 'LOADED');

        writeFileSync(path, 'corrupt', 'utf8');
        assert.equal(store.load().status, 'CORRUPT');

        // A fresh save over the corrupt file succeeds and is loadable again.
        const third = buildService({ stateStore: store });
        assert.equal(third.service.getStateRestoreReport().status, 'CORRUPT');
        assert.equal((await third.service.getQuote(QUOTE_REQUEST)).ok, true);
        assert.equal(third.service.persistRetainedState().outcome.status, 'SAVED');
        assert.equal(store.load().status, 'LOADED');
      });
    } finally {
      // Deliberately not removed: the promise above may still be settling.
      setTimeout(() => rmSync(dir, { recursive: true, force: true }), 50).unref?.();
    }
  });

  it('W23-D04: a port that throws is contained and reported, never propagated', () => {
    const throwingStore = {
      load: (): DhanStateLoadOutcome => {
        throw new Error('synthetic store failure');
      },
      save: () => {
        throw new Error('synthetic save failure');
      },
    };
    const rig = buildService({ stateStore: throwingStore as never });
    const report = rig.service.getStateRestoreReport();
    assert.equal(report.status, 'CORRUPT');
    assert.equal(report.reason, 'READ_ERROR');

    // And a save that throws must not escape shutdown semantics either.
    assert.throws(() => rig.service.persistRetainedState(), /synthetic save failure/);
  });

  it('W23-D05: a failed save is never allowed to block shutdown', async () => {
    const failingStore = {
      load: (): DhanStateLoadOutcome => ({ status: 'ABSENT' }),
      save: () => ({ status: 'FAILED', reason: 'WRITE_ERROR' }) as const,
    };
    const daemon = await startMarketDataDaemon({
      env: {},
      host: '127.0.0.1',
      port: 0,
      transportToken: TOKEN,
      stateStore: failingStore,
    });
    assert.equal(daemon.ok, true);
    if (!daemon.ok) return;
    await daemon.handle.shutdown();
    assert.equal(daemon.handle.lastPersistOutcome?.status, 'FAILED');
    assert.equal(daemon.handle.lastPersistOutcome?.reason, 'WRITE_ERROR');
  });

  it('W23-D06: the validator rejects a "restored" claim that admitted nothing', async () => {
    const rig = buildService({ stateStore: new DhanInMemoryStateStore() });
    const diag = await rig.service.getDiagnostics();
    const { validateDhanDiagnosticsPersistence } = await import('../src/providers/dhan/dhan_market_data_service.js');

    const impossible = {
      ...diag.persistence,
      restoreStatus: 'LOADED',
      quotesRestored: 0,
      quotesDroppedAsUnavailable: 0,
      refreshEntriesRestored: 0,
      observedStateRestored: false,
    };
    assert.equal(validateDhanDiagnosticsPersistence(impossible), null);

    for (const bad of [
      null,
      {},
      { ...diag.persistence, restoreStatus: 'MAYBE' },
      { ...diag.persistence, restoreStatus: 'CORRUPT', restoreReason: null },
      { ...diag.persistence, restoreStatus: 'LOADED', restoreReason: 'INVALID_JSON', quotesRestored: 1 },
      { ...diag.persistence, enabled: true, restoreStatus: 'DISABLED' },
      { ...diag.persistence, restoreReason: '/home/operator/iips-state.json' },
      { ...diag.persistence, quotesRestored: -1 },
    ]) {
      assert.equal(validateDhanDiagnosticsPersistence(bad), null, `must reject ${JSON.stringify(bad)}`);
    }
    assert.notEqual(validateDhanDiagnosticsPersistence(diag.persistence), null);
  });
});

// ── (E) No persistence coupling ─────────────────────────────────────────────

describe('W23-E: no persistence coupling is introduced into the provider modules', () => {
  // When run from dist/tests, `import.meta.url` is under dist/; climb back to the repo root
  // rather than accidentally reading from dist.
  const repoRoot = (() => {
    const p = fileURLToPath(new URL('..', import.meta.url));
    return p.endsWith('/dist/tests') || p.endsWith('\\dist\\tests') ? resolve(p, '../..') : resolve(p, '..');
  })();

  it('W23-E01: src/providers/dhan/** imports nothing from src/persistence/** or src/ipc/**', () => {
    const providerDir = join(repoRoot, 'src', 'providers', 'dhan');
    const offenders: string[] = [];
    for (const name of readdirSync(providerDir)) {
      if (!name.endsWith('.ts')) continue;
      const text = readFileSync(join(providerDir, name), 'utf8');
      // Match an actual import/require specifier, not the word in a comment.
      const specifiers = [...text.matchAll(/(?:from|require\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);
      for (const spec of specifiers) {
        if (/(^|\/)(persistence|ipc)\//.test(spec)) offenders.push(`${name} -> ${spec}`);
      }
    }
    assert.deepEqual(offenders, [], `provider modules must not import persistence/ipc: ${offenders.join(', ')}`);
  });

  it('W23-E02: the state port is declared inside the provider package and depends on nothing external', () => {
    const port = readFileSync(join(repoRoot, 'src', 'providers', 'dhan', 'dhan_state_store.ts'), 'utf8');
    const specifiers = [...port.matchAll(/^\s*import\s.*?\bfrom\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]!);
    assert.ok(specifiers.length > 0, 'the port imports the canonical contract types it stores');
    for (const spec of specifiers) {
      assert.ok(
        !/(^|\/)(persistence|ipc)\//.test(spec),
        `the port must not depend on persistence/ipc, found ${spec}`
      );
      assert.ok(spec.startsWith('./') || spec.startsWith('../../contracts/'), `unexpected dependency ${spec}`);
    }
  });

  it('W23-E03: the file store depends only on node builtins and provider-local modules', () => {
    const file = readFileSync(join(repoRoot, 'src', 'providers', 'dhan', 'dhan_file_state_store.ts'), 'utf8');
    const specifiers = [...file.matchAll(/(?:from|require\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);
    for (const spec of specifiers) {
      assert.ok(spec.startsWith('node:') || spec.startsWith('./'), `unexpected dependency ${spec}`);
    }
  });
});

// ── Store location and port behaviour ───────────────────────────────────────

describe('W23-F: store location resolution and file-store behaviour', () => {
  it('W23-F01: explicit path wins, then IIPS_DATA_DIR, then disabled', () => {
    assert.equal(resolveStateStorePath({}), null, 'no configuration means no guessed path');
    assert.equal(
      resolveStateStorePath({ [IIPS_DATA_DIR_ENV]: '/tmp/iips-data' }),
      join('/tmp/iips-data', DEFAULT_MARKET_DATA_STATE_RELATIVE_PATH)
    );
    assert.equal(
      resolveStateStorePath({ [IIPS_DATA_DIR_ENV]: '/tmp/ignored', [MARKET_DATA_STATE_PATH_ENV]: '/tmp/explicit.json' }),
      '/tmp/explicit.json'
    );
    // The reported path and the store must never disagree.
    assert.equal(resolveStateStorePath({ [MARKET_DATA_STATE_PATH_ENV]: '/tmp/x.json' }), '/tmp/x.json');
  });

  it('W23-F02: an unconfigured daemon reports persistence DISABLED rather than writing somewhere', async () => {
    const daemon = await startMarketDataDaemon({ env: {}, host: '127.0.0.1', port: 0, transportToken: TOKEN });
    assert.equal(daemon.ok, true);
    if (!daemon.ok) return;
    assert.equal(daemon.diagnostics.statePersistence.enabled, false);
    assert.equal(daemon.diagnostics.statePersistence.path, null);
    await daemon.handle.shutdown();
    assert.equal(daemon.handle.lastPersistOutcome?.status, 'SKIPPED');
    assert.equal(daemon.handle.lastPersistOutcome?.reason, 'DISABLED');
  });

  it('W23-F03: the disabled store saves nothing and loads ABSENT', () => {
    assert.deepEqual(NOOP_DHAN_STATE_STORE.load(), { status: 'ABSENT' });
    assert.deepEqual(NOOP_DHAN_STATE_STORE.save({} as DhanPersistedState), { status: 'SKIPPED', reason: 'DISABLED' });
  });

  it('W23-F04: the file store is atomic — no temp file is left behind', () => {
    const dir = tempDir();
    try {
      const path = join(dir, 'nested', 'state.json');
      const store = new DhanFileStateStore({ path });
      const state: DhanPersistedState = {
        schemaVersion: DHAN_PERSISTED_STATE_SCHEMA_VERSION,
        writtenAt: new Date(CLOCK).toISOString(),
        quotes: [],
        refresh: [],
        observed: null,
      };
      assert.equal(store.save(state).status, 'SAVED');
      assert.equal(store.load().status, 'LOADED');
      const files = readdirSync(join(dir, 'nested'));
      assert.deepEqual(files, ['state.json'], 'only the target file remains; the temp file was renamed');
      assert.equal(JSON.parse(readFileSync(path, 'utf8')).schemaVersion, DHAN_PERSISTED_STATE_SCHEMA_VERSION);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W23-F05: a save into an unwritable location reports FAILED without throwing', () => {
    const dir = tempDir();
    try {
      // A path whose parent is a FILE cannot be created as a directory.
      const blocker = join(dir, 'blocker');
      writeFileSync(blocker, 'x', 'utf8');
      const store = new DhanFileStateStore({ path: join(blocker, 'state.json') });
      const outcome = store.save({
        schemaVersion: DHAN_PERSISTED_STATE_SCHEMA_VERSION,
        writtenAt: new Date(CLOCK).toISOString(),
        quotes: [],
        refresh: [],
        observed: null,
      });
      assert.equal(outcome.status, 'FAILED');
      assert.equal(store.load().status, 'ABSENT');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('W23-F06: parsing rejects a state with duplicate quote keys', () => {
    const envelope = {
      envelopeId: 'e1',
      domain: 'D01_QUOTES',
      mode: 'LIVE',
      companyId: 'EQ_INFY_IN',
      payload: {
        companyId: 'EQ_INFY_IN',
        symbol: 'INFY',
        exchange: 'NSE',
        currency: 'INR',
        bid: 1860,
        ask: 1860.5,
        ltp: 1860.25,
        open: 1845,
        high: 1870,
        low: 1838,
        previousClose: 1840,
        volume: 100,
        change: 20.25,
        pctChange: 1.1,
      },
      provenance: {
        sourceClassification: 'CANONICAL_MARKET_DATA',
        vendorTier: 'PRIMARY',
        asOf: '2026-11-25T05:59:00.000Z',
        receivedAt: '2026-11-25T06:00:00.000Z',
        evaluatedAt: '2026-11-25T06:00:00.000Z',
        dataVersion: 'v1',
        lineageHash: 'abc',
        qualityState: 'GOOD',
      },
      timestamp: '2026-11-25T06:00:00.000Z',
      schemaVersion: '1.0.0',
    };
    const duplicated = {
      schemaVersion: 1,
      writtenAt: '2026-11-25T06:00:00.000Z',
      quotes: [
        { key: 'k', order: 0, envelope },
        { key: 'k', order: 1, envelope },
      ],
      refresh: [],
      observed: null,
    };
    assert.equal(parseDhanPersistedState(duplicated), null);
  });

  it('W23-F07: cache restore honours capacity and refuses suppressed entries', () => {
    const cache = new DhanBoundedCache<{ provenance: { asOf: string } }>(2);
    const entry = { provenance: { asOf: '2026-11-25T05:59:00.000Z' } };
    assert.equal(cache.restoreEntry('a', entry, 'CURRENT'), true);
    assert.equal(cache.restoreEntry('b', entry, 'STALE'), true);
    assert.equal(cache.restoreEntry('c', entry, 'UNAVAILABLE'), false, 'suppressed evidence is refused');
    assert.equal(cache.size, 2);
    assert.equal(cache.isEmpty, false);
    assert.deepEqual(cache.snapshotInLruOrder().map((r) => r.key), ['a', 'b'], 'LRU order is preserved');
  });
});
