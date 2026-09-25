/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-D2 Synthetic Fixture Development Harness (DEVELOPMENT ONLY)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS — UI demonstration
 * Execution Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * ══ WHAT THIS MODULE IS ══════════════════════════════════════════════════════════════════
 * A development-only wiring module that feeds the ALREADY-EXISTING deterministic DHAN-D2
 * synthetic fixtures (`tests/fixtures/dhan_d2_fixtures.json`) through the ALREADY-EXISTING
 * provider-neutral path:
 *
 *   fixture JSON → in-memory transport → DhanApiClient → DhanMarketDataSource
 *                → ProviderMarketDataRoute → CanonicalEnvelope → MarketDataDTO
 *                → buildProviderRouteDataStateView (UI data-state)
 *                → revaluePortfolioHoldings (portfolio revaluation)
 *
 * No contract, adapter, validator or view model is re-implemented here; this module only
 * constructs the existing objects with the existing fixtures.
 *
 * ══ WHAT THIS MODULE IS NOT ══════════════════════════════════════════════════════════════
 *  • NOT live Dhan data. No Dhan endpoint is ever contacted: the transport is a pure
 *    in-memory fixture responder and `externalRequestCount` is always 0 by construction.
 *  • NOT credentialed. The credential resolver returns the same OBVIOUSLY SYNTHETIC
 *    placeholder strings already used by the D1/D2 test suites. They are not tokens, are
 *    not accepted by any provider, and no secret material exists in this file.
 *  • NOT production behaviour. The only route that mounts this module is registered
 *    exclusively under `import.meta.env.DEV` (see `frontend/src/app/App.tsx`).
 *  • NOT provider-coupled downstream. Vendor identity stops at the route/operator boundary
 *    (NFR-06); the canonical envelope, MarketDataDTO and portfolio output stay neutral.
 */

import fixturesJson from '../../../../tests/fixtures/dhan_d2_fixtures.json' with { type: 'json' };

import {
  ProviderMarketDataRoute,
  buildProviderRouteDataStateView,
  PRE_ACCESS_ROUTE_DISCLOSURE,
  type ProviderRouteDataStateView,
} from '../../../../src/providers/index.js';
import {
  DHAN_ENV_KEYS,
  DhanApiClient,
  DhanMarketDataSource,
  loadDhanInstrumentMappings,
  resolveDhanProviderConfig,
  type DhanCredentialMaterial,
  type DhanCredentialResolver,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
  type DhanInstrumentRegistry,
} from '../../../../src/providers/dhan/index.js';
import type { MarketDataDTO } from '../../../../src/transports/market_data_dto.js';

import {
  revaluePortfolioHoldings,
  type PortfolioRevaluationResult,
  type UserHoldingInput,
} from '../portfolio/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture bundle (deterministic, committed, synthetic)
// ─────────────────────────────────────────────────────────────────────────────

export const DHAN_D2_FIXTURE_PATH = 'tests/fixtures/dhan_d2_fixtures.json';

interface FixtureQuoteScenario {
  description?: string;
  httpStatus?: number;
  body?: unknown;
  bodyTextOverride?: string;
  transportMode?: string;
}

interface DhanD2FixtureBundle {
  label: string;
  gate: string;
  notice: string;
  evaluationInstant: string;
  mappingRows: { valid: unknown[] };
  holdings: UserHoldingInput[];
  quoteScenarios: Record<string, FixtureQuoteScenario>;
}

const FIXTURES = fixturesJson as unknown as DhanD2FixtureBundle;

/**
 * Synthetic placeholders — identical to the values already present in the governed D1/D2
 * fixtures and test suites. These are deliberately non-credential literals.
 */
const SYNTHETIC_ACCESS_VALUE = 'SYNTHETIC-PRE-ACCESS-PLACEHOLDER-VALUE-0000';
const SYNTHETIC_CLIENT_VALUE = 'SYNTHETIC-CLIENT-PLACEHOLDER-0000';

/** Non-routable synthetic base URL. The in-memory transport never dispatches it. */
const SYNTHETIC_BASE_URL = 'https://synthetic.invalid/v2';

const CONFIGURED_ENV: Record<string, string> = {
  [DHAN_ENV_KEYS.baseUrl]: SYNTHETIC_BASE_URL,
  [DHAN_ENV_KEYS.timeoutMs]: '50',
  [DHAN_ENV_KEYS.accessTokenSecretPath]: 'vault://market-data/alternate-route/access-token',
  [DHAN_ENV_KEYS.clientIdSecretPath]: 'vault://market-data/alternate-route/client-id',
  [DHAN_ENV_KEYS.secretVaultProvider]: 'LOCAL_MOCK_VAULT',
  [DHAN_ENV_KEYS.secretVersion]: 'v1',
};

// ─────────────────────────────────────────────────────────────────────────────
// Scenarios exposed to the development surface
// ─────────────────────────────────────────────────────────────────────────────

export type DhanD2DevScenarioId = 'current' | 'stale' | 'unavailable';

export interface DhanD2DevScenarioDescriptor {
  id: DhanD2DevScenarioId;
  /** Key inside `quoteScenarios` of the committed D2 fixture file. */
  fixtureScenarioKey: string;
  label: string;
  expectation: string;
}

export const DHAN_D2_DEV_SCENARIOS: readonly DhanD2DevScenarioDescriptor[] = [
  {
    id: 'current',
    fixtureScenarioKey: 'twoInstrumentQuote',
    label: 'CURRENT — fresh synthetic quote',
    expectation:
      'Mapped instruments resolve within the freshness floor and present state CURRENT. The unmapped holding stays UNAVAILABLE.',
  },
  {
    id: 'stale',
    fixtureScenarioKey: 'twoInstrumentStaleQuote',
    label: 'STALE — aged synthetic quote',
    expectation:
      'Mapped instruments breach the freshness threshold and present state STALE with the degraded indicator. The unmapped holding stays UNAVAILABLE.',
  },
  {
    id: 'unavailable',
    fixtureScenarioKey: 'invalidPriceQuote',
    label: 'UNAVAILABLE — rejected synthetic quote',
    expectation:
      'The canonical validator rejects the quote, so no price is surfaced at all: every position is UNAVAILABLE with a null price.',
  },
];

export function resolveDhanD2DevScenario(raw: string | null | undefined): DhanD2DevScenarioDescriptor {
  const wanted = (raw ?? '').trim().toLowerCase();
  return DHAN_D2_DEV_SCENARIOS.find((s) => s.id === wanted) ?? DHAN_D2_DEV_SCENARIOS[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Offline fixture transport (no network of any kind)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serves a committed synthetic fixture body from memory.
 *
 * There is no `fetch`, `XMLHttpRequest`, socket or DNS use anywhere in this class: the
 * request is recorded for evidence and answered synchronously from the fixture bundle.
 * `externalRequestCount` therefore remains 0 for every demonstration.
 */
class OfflineFixtureTransport implements DhanHttpTransport {
  public readonly dispatchedRequests: DhanHttpRequest[] = [];
  /** Requests that actually left the process. Structurally always 0. */
  public readonly externalRequestCount = 0;

  constructor(private readonly scenarioKey: string) {}

  public async send(request: DhanHttpRequest): Promise<DhanHttpResponse> {
    this.dispatchedRequests.push(request);
    const scenario = FIXTURES.quoteScenarios[this.scenarioKey];
    if (!scenario) {
      throw new Error(`Unknown DHAN-D2 fixture scenario '${this.scenarioKey}'`);
    }
    return {
      status: scenario.httpStatus ?? 200,
      bodyText: scenario.bodyTextOverride ?? JSON.stringify(scenario.body),
    };
  }
}

class SyntheticPlaceholderCredentialResolver implements DhanCredentialResolver {
  public async resolve(): Promise<DhanCredentialMaterial> {
    return { accessToken: SYNTHETIC_ACCESS_VALUE, clientId: SYNTHETIC_CLIENT_VALUE };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot construction
// ─────────────────────────────────────────────────────────────────────────────

export interface DhanD2DevSnapshot {
  scenario: DhanD2DevScenarioDescriptor;
  /** Mandatory pre-access labelling surfaced by the UI. */
  disclosure: string;
  executionMode: 'PRE_ACCESS / SYNTHETIC / OFFLINE';
  fixturePath: string;
  fixtureLabel: string;
  fixtureNotice: string;
  evaluatedAt: string;
  /** Operator data-state views, one per demonstrated holding. */
  views: ProviderRouteDataStateView[];
  /** Portfolio revaluation produced by the existing BI-08 binding. */
  revaluation: PortfolioRevaluationResult;
  /** Evidence counters: provider calls answered from fixtures, external calls made. */
  fixtureRequestCount: number;
  externalRequestCount: number;
}

function buildRegistry(): DhanInstrumentRegistry {
  return loadDhanInstrumentMappings(FIXTURES.mappingRows.valid).registry;
}

/**
 * Builds a complete demonstration snapshot for one committed fixture scenario.
 * Pure, deterministic and offline: identical inputs always produce identical output.
 */
export async function buildDhanD2DevSnapshot(
  scenario: DhanD2DevScenarioDescriptor
): Promise<DhanD2DevSnapshot> {
  const evaluatedAt = FIXTURES.evaluationInstant;
  const transport = new OfflineFixtureTransport(scenario.fixtureScenarioKey);

  const configResolution = resolveDhanProviderConfig(CONFIGURED_ENV);
  if (!configResolution.ok) {
    throw new Error('DHAN-D2 development harness configuration is invalid');
  }

  const source = new DhanMarketDataSource({
    client: new DhanApiClient({
      config: configResolution.config,
      transport,
      credentialResolver: new SyntheticPlaceholderCredentialResolver(),
    }),
    instrumentRegistry: buildRegistry(),
    now: () => new Date(evaluatedAt),
  });

  const route = new ProviderMarketDataRoute(source);
  const holdings = FIXTURES.holdings;
  const companyIds = holdings.map((h) => h.companyId);

  const results = await route.getQuotes(companyIds);
  const views = results.map((result) => buildProviderRouteDataStateView(result));
  const marketData = results
    .map((r) => r.marketData)
    .filter((dto): dto is MarketDataDTO => dto !== undefined);

  const revaluation = revaluePortfolioHoldings({ holdings, marketData, evaluatedAt });

  return {
    scenario,
    disclosure: PRE_ACCESS_ROUTE_DISCLOSURE,
    executionMode: 'PRE_ACCESS / SYNTHETIC / OFFLINE',
    fixturePath: DHAN_D2_FIXTURE_PATH,
    fixtureLabel: FIXTURES.label,
    fixtureNotice: FIXTURES.notice,
    evaluatedAt,
    views,
    revaluation,
    fixtureRequestCount: transport.dispatchedRequests.length,
    externalRequestCount: transport.externalRequestCount,
  };
}
