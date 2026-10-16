/**
 * Institutional Investment Platform System (IIPS)
 * BI-07 Portfolio Store Port Suite — conformance, DP-2 Option 2F refusal, and
 * durability honesty.
 *
 * Governed under: act `np04-g2-portfolio-ui-store-port-2026-10-16-001` (APPROVED 2026-10-16)
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
 *
 * This suite proves: (a) the asynchronous port behaves identically to the existing
 * synchronous store for reads, analytics, saves and idempotency; (b) unresolved or
 * ambiguous holdings are refused at the port/save boundary before any mutation;
 * (c) caller-supplied identity/authorization scope is refused; (d) nothing claims
 * durability without a real durable commit; (e) the legacy synchronous API is
 * unchanged for existing callers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  BrokerImportIngressOrchestrator,
  DEFAULT_ALLOW_NON_PRODUCTION_BYPASS,
  PortfolioBrokerImportController,
  PortfolioSaveOptions,
  PortfolioStore,
  UserHoldingInput,
} from '../frontend/src/features/portfolio/index.js';
import {
  PortfolioDurability,
  PortfolioPortSaveRequest,
  SessionPortfolioStorePort,
  describePersistenceStatus,
  evaluatePortSaveGuard,
} from '../frontend/src/features/portfolio/portfolioStorePort.js';
import { SecurityMaster } from '../src/identity/security_master.js';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

function createGovernedSecurityMaster(): SecurityMaster {
  const sm = new SecurityMaster();

  sm.registerEntity({
    companyId: 'EQ_RELIANCE_IN',
    companyName: 'Reliance Industries Limited',
    isin: 'INE002A01018',
    industry: 'Oil & Gas',
    sector: 'ENERGY',
    listings: [{ exchange: 'NSE', symbol: 'RELIANCE', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
    effectiveFrom: '2020-01-01T00:00:00.000Z',
  });

  sm.registerEntity({
    companyId: 'EQ_INFY_IN',
    companyName: 'Infosys Limited',
    isin: 'INE009A01021',
    industry: 'IT Services',
    sector: 'IT',
    listings: [{ exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
    effectiveFrom: '2020-01-01T00:00:00.000Z',
  });

  sm.registerEntity({
    companyId: 'EQ_TCS_IN',
    companyName: 'Tata Consultancy Services Limited',
    isin: 'INE467B01029',
    industry: 'IT Services',
    sector: 'IT',
    listings: [{ exchange: 'NSE', symbol: 'TCS', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
    effectiveFrom: '2020-01-01T00:00:00.000Z',
  });

  return sm;
}

const ZERODHA_RESOLVED_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25
TCS,15,3400.00,3500.00,52500.00,1500.00,2.94,1.10`;

const ZERODHA_WITH_UNMAPPED_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
ASK AUTOMOTIVE,100,300.00,350.00,35000.00,5000.00,16.67,1.20
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25
TCS,15,3400.00,3500.00,52500.00,1500.00,2.94,1.10`;

/** Resolved holding vector with weights summing to exactly 100.0000%. */
function resolvedHoldings(): UserHoldingInput[] {
  return [
    {
      symbol: 'RELIANCE',
      companyId: 'EQ_RELIANCE_IN',
      isin: 'INE002A01018',
      exchange: 'NSE',
      quantity: 10,
      averageBuyPrice: 2500,
      currentPrice: 2600,
      marketValue: 26000,
      weightPercentage: 24.0,
      active: true,
      sourceBroker: 'ZERODHA',
      lineageDigest: 'digest-reliance',
      identityStatus: 'RESOLVED',
      resolutionDisposition: 'CANONICAL_P04',
    },
    {
      symbol: 'INFY',
      companyId: 'EQ_INFY_IN',
      isin: 'INE009A01021',
      exchange: 'NSE',
      quantity: 20,
      averageBuyPrice: 1500,
      currentPrice: 1600,
      marketValue: 32000,
      weightPercentage: 29.5,
      active: true,
      sourceBroker: 'ZERODHA',
      lineageDigest: 'digest-infy',
      identityStatus: 'RESOLVED',
      resolutionDisposition: 'CANONICAL_P04',
    },
    {
      symbol: 'TCS',
      companyId: 'EQ_TCS_IN',
      isin: 'INE467B01029',
      exchange: 'NSE',
      quantity: 15,
      averageBuyPrice: 3400,
      currentPrice: 3500,
      marketValue: 52500,
      weightPercentage: 46.5,
      active: true,
      sourceBroker: 'ZERODHA',
      lineageDigest: 'digest-tcs',
      identityStatus: 'RESOLVED',
      resolutionDisposition: 'CANONICAL_P04',
    },
  ];
}

/** Bypass-derived unresolved holding (what the historical operator bypass produced). */
function unresolvedBypassHolding(): UserHoldingInput {
  return {
    symbol: 'ASK AUTOMOTIVE',
    companyId: '',
    isin: undefined,
    exchange: 'NSE',
    quantity: 100,
    averageBuyPrice: 300,
    currentPrice: 350,
    marketValue: 35000,
    weightPercentage: 0,
    active: true,
    sourceBroker: 'ZERODHA',
    lineageDigest: 'digest-ask-automotive',
    identityStatus: 'UNRESOLVED',
    resolutionDisposition: 'NON_PRODUCTION_OPERATOR_BYPASS',
  };
}

function saveOptions(contentDigest: string): PortfolioSaveOptions {
  return {
    mode: 'MERGE',
    sourceBroker: 'ZERODHA',
    fileName: 'zerodha_holdings.csv',
    contentDigest,
    lineageDigest: `lineage-${contentDigest}`,
  };
}

/* ------------------------------------------------------------------ *
 * Suite
 * ------------------------------------------------------------------ */

describe('BI-07 Portfolio Store Port — conformance, 2F refusal, durability honesty', () => {
  it('PORT-01: the session port and the in-memory store declare themselves session-only and non-durable', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);

    assert.strictEqual(port.durability, 'SESSION_ONLY');
    assert.strictEqual(port.durable, false);
    assert.strictEqual(store.durability, 'SESSION_ONLY');
    assert.strictEqual(store.durable, false);
    assert.strictEqual(await port.getRevision('DEFAULT_PORTFOLIO'), 0);
  });

  it('PORT-02: port reads and analytics match the underlying in-memory store', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);
    controller.selectAndProcessFile({
      content: ZERODHA_RESOLVED_CSV,
      fileName: 'zerodha_holdings.csv',
      securityMaster: sm,
    });
    controller.confirmAndSave({ portfolioStore: store });

    const viaStore = store.getPortfolio('DEFAULT_PORTFOLIO');
    const viaPort = await port.getPortfolio('DEFAULT_PORTFOLIO');
    const analyticsViaPort = await port.getAnalytics('DEFAULT_PORTFOLIO');

    assert.ok(viaStore && viaPort);
    assert.strictEqual(viaPort.totalHoldingsCount, viaStore.totalHoldingsCount);
    assert.strictEqual(viaPort.totalMarketValue, viaStore.totalMarketValue);
    assert.strictEqual(viaPort.provenanceDigest, viaStore.provenanceDigest);
    assert.strictEqual(analyticsViaPort.holdingsCount, viaStore.holdings.length);
    assert.strictEqual(analyticsViaPort.totalMarketValue, viaStore.totalMarketValue);
    assert.strictEqual(analyticsViaPort.lineageHash, viaStore.provenanceDigest);
  });

  it('PORT-03: a successful port save is conformant with the synchronous store save', async () => {
    const holdings = resolvedHoldings();

    const directStore = new PortfolioStore();
    const direct = directStore.saveHoldings('DEFAULT_PORTFOLIO', holdings, saveOptions('digest-A'));

    const portStore = new PortfolioStore();
    const port = new SessionPortfolioStorePort(portStore);
    const outcome = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings,
      options: saveOptions('digest-A'),
    });

    assert.strictEqual(direct.success, true);
    assert.strictEqual(outcome.ok, true);
    if (!outcome.ok) return;

    const a = directStore.getPortfolio('DEFAULT_PORTFOLIO');
    const b = portStore.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(a && b);
    assert.strictEqual(b.isSaved, true);
    assert.strictEqual(b.totalMarketValue, a.totalMarketValue);
    assert.strictEqual(b.totalHoldingsCount, a.totalHoldingsCount);
    assert.strictEqual(b.weightSumPercentage, a.weightSumPercentage);
    assert.strictEqual(b.contributions?.length, a.contributions?.length);
    assert.deepStrictEqual(
      b.holdings.map((h) => [h.symbol, h.companyId, h.quantity, h.weightPercentage, h.lineageDigest]),
      a.holdings.map((h) => [h.symbol, h.companyId, h.quantity, h.weightPercentage, h.lineageDigest])
    );
    assert.strictEqual(outcome.result.holdingsSavedCount, direct.holdingsSavedCount);
    assert.strictEqual(outcome.result.portfolio.isSaved, true);
    assert.strictEqual(outcome.durability, 'SESSION_ONLY');
    assert.strictEqual(outcome.durable, false);
    assert.strictEqual(outcome.revision, 1);
  });

  it('PORT-04: re-importing identical content is an idempotent no-op and does not advance the revision', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);

    const first = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: resolvedHoldings(),
      options: saveOptions('digest-B'),
    });
    assert.strictEqual(first.ok, true);
    assert.strictEqual(await port.getRevision('DEFAULT_PORTFOLIO'), 1);

    const second = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: resolvedHoldings(),
      options: saveOptions('digest-B'),
    });
    assert.strictEqual(second.ok, true);
    if (!second.ok) return;
    assert.strictEqual(second.result.isDuplicate, true);
    assert.strictEqual(second.result.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.strictEqual(second.revision, 1, 'Idempotent no-op must not advance the session revision');
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.contributions?.length, 1);
  });

  it('PORT-05: DP-2 Option 2F — bypass-derived unresolved holdings are refused before any mutation', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);
    const vector = [...resolvedHoldings(), unresolvedBypassHolding()];

    const outcome = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: vector,
      options: saveOptions('digest-C'),
    });

    assert.strictEqual(outcome.ok, false);
    if (outcome.ok) return;
    assert.strictEqual(outcome.code, 'REFUSED_UNRESOLVED_IDENTITY');
    assert.strictEqual(outcome.refusedHoldings.length, 1);
    assert.strictEqual(outcome.refusedHoldings[0].symbol, 'ASK AUTOMOTIVE');
    assert.match(outcome.message, /Option 2F/);
    assert.strictEqual(outcome.durable, false);

    const untouched = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(untouched);
    assert.strictEqual(untouched.isSaved, false);
    assert.strictEqual(untouched.holdings.length, 0);
    assert.strictEqual(await port.getRevision('DEFAULT_PORTFOLIO'), 0);

    // The store's own synchronous semantics are preserved (no rewrite of the store,
    // its guards, or the ingress/mapper bypass handling): the refusal is the port's.
    const controlStore = new PortfolioStore();
    const directAccept = controlStore.saveHoldings(
      'DEFAULT_PORTFOLIO',
      [
        { ...resolvedHoldings()[0] },
        { ...resolvedHoldings()[1] },
        { ...resolvedHoldings()[2], weightPercentage: 46.5 },
        { ...unresolvedBypassHolding() },
      ],
      saveOptions('digest-C-control')
    );
    assert.strictEqual(directAccept.success, true, 'Legacy synchronous store behaviour must be unchanged');
  });

  it('PORT-06: holdings the ingress produces under the historical bypass are refused end to end', async () => {
    const sm = createGovernedSecurityMaster();
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);

    const ingress = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_WITH_UNMAPPED_CSV,
      fileName: 'zerodha_holdings.csv',
      securityMaster: sm,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    assert.strictEqual(ingress.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    const unresolved = ingress.userHoldings.filter((h) => h.identityStatus === 'UNRESOLVED');
    assert.ok(unresolved.length > 0, 'Ingress must retain the unresolved holding under explicit bypass');
    assert.strictEqual(unresolved[0].companyId, '');

    const outcome = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: ingress.userHoldings,
      options: {
        mode: 'MERGE',
        sourceBroker: ingress.provenance.sourceBroker,
        fileName: ingress.provenance.fileName,
        contentDigest: ingress.provenance.contentDigest,
        lineageDigest: ingress.provenance.lineageDigest,
      },
    });

    assert.strictEqual(outcome.ok, false);
    if (outcome.ok) return;
    assert.strictEqual(outcome.code, 'REFUSED_UNRESOLVED_IDENTITY');
    assert.ok(outcome.refusedHoldings.some((h) => h.symbol === 'ASK AUTOMOTIVE'));
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.isSaved, false);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.length, 0);
    assert.strictEqual(await port.getRevision('DEFAULT_PORTFOLIO'), 0);
  });

  it('PORT-07: caller-supplied identity or authorization scope is refused (INVALID_REQUEST)', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);

    const withTopLevelIdentity = {
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: resolvedHoldings(),
      options: saveOptions('digest-D'),
      tenantId: 'TENANT_X',
    } as unknown as PortfolioPortSaveRequest;

    const topLevel = await port.saveHoldings(withTopLevelIdentity);
    assert.strictEqual(topLevel.ok, false);
    if (topLevel.ok) return;
    assert.strictEqual(topLevel.code, 'INVALID_REQUEST');
    assert.match(topLevel.message, /tenantId/);

    const withScopedOptions = {
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: resolvedHoldings(),
      options: { ...saveOptions('digest-E'), authorization: 'Bearer forged' } as PortfolioSaveOptions,
    } as PortfolioPortSaveRequest;

    const scoped = await port.saveHoldings(withScopedOptions);
    assert.strictEqual(scoped.ok, false);
    if (scoped.ok) return;
    assert.strictEqual(scoped.code, 'INVALID_REQUEST');
    assert.match(scoped.message, /authorization/);

    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.isSaved, false);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.length, 0);
  });

  it('PORT-08: a revision conflict is refused and leaves the store untouched', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);

    const first = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: resolvedHoldings(),
      options: saveOptions('digest-F'),
    });
    assert.strictEqual(first.ok, true);
    const before = store.getPortfolio('DEFAULT_PORTFOLIO')!;

    const conflict = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: resolvedHoldings(),
      options: saveOptions('digest-G'),
      expectedRevision: 0,
    });

    assert.strictEqual(conflict.ok, false);
    if (conflict.ok) return;
    assert.strictEqual(conflict.code, 'REVISION_CONFLICT');
    assert.strictEqual(conflict.expectedRevision, 0);
    assert.strictEqual(conflict.actualRevision, 1);
    const after = store.getPortfolio('DEFAULT_PORTFOLIO')!;
    assert.strictEqual(after.provenanceDigest, before.provenanceDigest);
    assert.strictEqual(after.contributions?.length, before.contributions?.length);
  });

  it('PORT-09: store-level guard failures surface as refusals without mutation', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);

    const badWeights = resolvedHoldings().map((h) => ({ ...h, weightPercentage: h.weightPercentage / 2 }));
    const outcome = await port.saveHoldings({
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: badWeights,
      options: saveOptions('digest-H'),
    });

    assert.strictEqual(outcome.ok, false);
    if (outcome.ok) return;
    assert.strictEqual(outcome.code, 'REFUSED_STORE_GUARD');
    assert.match(outcome.message, /weights/i);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.isSaved, false);
  });

  it('PORT-10: persistence wording never claims durability without a durable commit', async () => {
    const empty = describePersistenceStatus({ isSaved: false, durable: false });
    const sessionOnly = describePersistenceStatus({ isSaved: true, durable: false, lastUpdated: '2026-10-16T10:00:00.000Z' });
    const durable = describePersistenceStatus({ isSaved: true, durable: true, lastUpdated: '2026-10-16T10:00:00.000Z' });

    assert.strictEqual(empty.state, 'EMPTY');
    assert.strictEqual(empty.isDurable, false);
    assert.match(sessionOnly.label, /SESSION ONLY/);
    assert.match(sessionOnly.label, /NOT DURABLE/);
    assert.ok(!sessionOnly.label.includes('COMMITTED'), 'A session-scoped save must never be labelled COMMITTED');
    assert.strictEqual(sessionOnly.isDurable, false);
    assert.ok(durable.label.includes('COMMITTED'));
    assert.strictEqual(durable.isDurable, true);

    // The UI sources must not hard-code a durability claim for in-memory saves.
    const uiFiles = ['PortfolioWorkspace.tsx', 'BrokerImportModal.tsx'].map((name) =>
      fileURLToPath(new URL(`../frontend/src/features/portfolio/${name}`, import.meta.url))
    );
    for (const file of uiFiles) {
      if (!existsSync(file)) continue; // compiled-run tolerance
      const source = readFileSync(file, 'utf8');
      assert.ok(
        !source.includes('COMMITTED (Atomic)'),
        `${file} must not present an in-memory save as an atomic durable commit`
      );
    }
  });

  it('PORT-11: the view-model port path saves resolved holdings and reports session-only durability', async () => {
    const sm = createGovernedSecurityMaster();
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);
    const controller = new PortfolioBrokerImportController(sm);

    const preview = controller.selectAndProcessFile({
      content: ZERODHA_RESOLVED_CSV,
      fileName: 'zerodha_holdings.csv',
      viewportWidth: 1280,
      securityMaster: sm,
    });
    assert.strictEqual(preview.state, 'READY_TO_SAVE');
    assert.strictEqual(preview.portSaveGuard.saveable, true);
    assert.strictEqual(preview.durable, false);
    assert.strictEqual(preview.durability, 'SESSION_ONLY');

    const vm = await controller.confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });

    assert.strictEqual(vm.state, 'SAVE_SUCCESS');
    assert.strictEqual(vm.saveResult?.success, true);
    assert.strictEqual(vm.durable, false);
    assert.strictEqual(vm.durability, 'SESSION_ONLY');
    assert.strictEqual(vm.portRefusal, undefined);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.isSaved, true);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.length, preview.acceptedHoldingsCount);
  });

  it('PORT-12: the view-model port path refuses bypass holdings while the legacy sync path is unchanged', async () => {
    const sm = createGovernedSecurityMaster();
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);
    const controller = new PortfolioBrokerImportController(sm);

    const preview = controller.selectAndProcessFile({
      content: ZERODHA_WITH_UNMAPPED_CSV,
      fileName: 'zerodha_holdings.csv',
      viewportWidth: 1280,
      securityMaster: sm,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });
    assert.strictEqual(preview.saveGuard.isSaveEnabled, true, 'Legacy synchronous guard is preserved');
    assert.strictEqual(preview.portSaveGuard.saveable, false, 'The port path is preview-only for unresolved holdings');
    assert.ok(preview.portSaveGuard.refusedHoldings.length > 0);
    assert.match(preview.portSaveGuard.disabledReason || '', /Option 2F/);

    const refused = await controller.confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });
    assert.strictEqual(refused.state, 'REJECTED');
    assert.strictEqual(refused.portRefusal?.code, 'REFUSED_UNRESOLVED_IDENTITY');
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.isSaved, false);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.length, 0);

    // Legacy synchronous contract (BI-07 suites) is untouched.
    const legacy = controller.confirmAndSave({ portfolioStore: store, viewportWidth: 1280 });
    assert.strictEqual(legacy.state, 'SAVE_SUCCESS');
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.isSaved, true);
  });

  it('PORT-13: the modal default disables the non-production unresolved-holdings bypass', () => {
    assert.strictEqual(DEFAULT_ALLOW_NON_PRODUCTION_BYPASS, false);
    const durability: PortfolioDurability = 'SESSION_ONLY';
    assert.strictEqual(durability, 'SESSION_ONLY');
  });

  it('PORT-14: the port save guard refuses unresolved and ambiguous identities and accepts resolved ones', () => {
    const resolved = evaluatePortSaveGuard(resolvedHoldings());
    assert.strictEqual(resolved.saveable, true);
    assert.strictEqual(resolved.refusedHoldings.length, 0);

    const mixed = evaluatePortSaveGuard([...resolvedHoldings(), unresolvedBypassHolding()]);
    assert.strictEqual(mixed.saveable, false);
    assert.strictEqual(mixed.refusedHoldings.length, 1);

    const empty = evaluatePortSaveGuard([]);
    assert.strictEqual(empty.saveable, false);
    assert.match(empty.disabledReason || '', /No holdings/);
  });
});
