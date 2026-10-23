/**
 * Institutional Investment Platform System (IIPS)
 * CAP-02 U7 — IPD provider/UI outcome conformance.
 *
 * Governing authority: IPD act
 * `IIPS-V3-CAP02-U7-IPD-PROVIDER-OUTCOME-ACT-2026-10-23-01`
 * (`evidence/cross-repository/IIPS_V3_CAP02_U7_IPD_PROVIDER_OUTCOME_ACT_EFFECTIVE_2026-10-23.md`),
 * rendered under the standing Program Authority grant and informed read-only by IRR's effective
 * `IIPS-V3-CAP02-U7-READ-RESULT-CONTRACT-DECISION-EFFECTIVE-2026-10-23-01` §5.
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED.
 *
 * WHAT THIS SUITE PROVES (and what it does not)
 *   It proves the provider-side outcome semantics the exported CAP-02 surface now guarantees:
 *     T-U7-1  a success consumer needs ONLY the minimal v1 receipt `{disposition, revision,
 *             durability, durable}` — no portfolio record, count, total, digest or timestamp;
 *     T-U7-2  a refusal fabricates nothing: no record, no `savedAt`, no zero metrics, no empty
 *             provenance, no durability claim, and no per-holding detail that was not reported;
 *     T-U7-3  outcome-unknown is a DISTINCT third state — no receipt, no refusal wording, no
 *             rollback claim, no automatic retry;
 *     T-U7-4  displayed durability is receipt-driven, never the static store capability;
 *     T-U7-5  the committed panel never substitutes preview totals/counts/digests;
 *     T-U7-6  `getAnalytics` is optional, so a host whose analytics operation is reserved can
 *             satisfy the port;
 *     T-U7-7  write denial and the shipped `SESSION_ONLY` / `durable:false` capability are intact.
 *
 *   It does NOT mount the modal in a browser, does NOT compose a host, does NOT perform a durable
 *   write, and is NOT Gate 4 qualification, result acceptance, Gate 5 admission, operational write
 *   authorization or end-to-end integration evidence.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PortfolioStore } from '../frontend/src/features/portfolio/index.js';
import {
  SessionPortfolioStorePort,
  evaluatePortSaveGuard,
  type PortfolioCommitReceipt,
  type PortfolioPortSaveOutcome,
  type PortfolioPortSaveRequest,
  type PortfolioStorePort,
} from '../frontend/src/features/portfolio/portfolioStorePort.js';
import { PortfolioBrokerImportController } from '../frontend/src/features/portfolio/import/ui-broker-import-view-model.js';
import { SecurityMaster } from '../src/identity/security_master.js';

/* ------------------------------------------------------------------ *
 * Fixtures — a governed master and a fully resolved broker file
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

function readyController(): PortfolioBrokerImportController {
  const sm = createGovernedSecurityMaster();
  const controller = new PortfolioBrokerImportController(sm);
  const preview = controller.selectAndProcessFile({
    content: ZERODHA_RESOLVED_CSV,
    fileName: 'zerodha_holdings.csv',
    viewportWidth: 1280,
    securityMaster: sm,
  });
  assert.strictEqual(preview.state, 'READY_TO_SAVE');
  assert.strictEqual(preview.portSaveGuard.saveable, true);
  return controller;
}

/**
 * Reads a repository source file. Compiled runs execute from `dist/tests/`, so
 * the file is resolved from the repository working directory (both the guarded
 * runner and direct `node --test` invocations run from the repo root) with a
 * URL-relative fallback for source-mode runs.
 */
function readRepoSource(relativePath: string): string | undefined {
  const candidates = [resolve(process.cwd(), relativePath)];
  const text = candidates.find((candidate) => existsSync(candidate));
  return text ? readFileSync(text, 'utf8') : undefined;
}

/** A governed v1 adapter: it holds ONLY the minimal receipt — no legacy result. */
class ReceiptOnlyPort implements PortfolioStorePort {
  public readonly durability: 'SESSION_ONLY' | 'DURABLE';
  public readonly durable: boolean;
  public calls = 0;
  constructor(
    private readonly receipt: PortfolioCommitReceipt,
    declared: { durability: 'SESSION_ONLY' | 'DURABLE'; durable: boolean } = {
      durability: 'SESSION_ONLY',
      durable: false,
    },
  ) {
    this.durability = declared.durability;
    this.durable = declared.durable;
  }
  public async getPortfolio(): Promise<undefined> {
    return undefined;
  }
  // NOTE: no `getAnalytics` — it is optional on the port (T-U7-6).
  public async getRevision(): Promise<number> {
    return this.receipt.revision;
  }
  public async saveHoldings(_request: PortfolioPortSaveRequest): Promise<PortfolioPortSaveOutcome> {
    this.calls += 1;
    return {
      ok: true,
      receipt: this.receipt,
      durability: this.receipt.durability,
      durable: this.receipt.durable,
      revision: this.receipt.revision,
    };
  }
}

/** A refusal-only adapter that models a Class A refusal: no record, no durability. */
class ClassARefusalPort implements PortfolioStorePort {
  public readonly durability = 'SESSION_ONLY' as const;
  public readonly durable = false as const;
  public calls = 0;
  public async getPortfolio(): Promise<undefined> {
    return undefined;
  }
  public async getRevision(): Promise<number> {
    return 0;
  }
  public async saveHoldings(): Promise<PortfolioPortSaveOutcome> {
    this.calls += 1;
    return {
      ok: false,
      code: 'REVISION_CONFLICT',
      message: 'authoritative conflict: expected revision 0 but the portfolio is at revision 3',
      refusedHoldings: [],
      actualRevision: 3,
      // Deliberately NO `portfolio` and NO durability claim.
    };
  }
}

/** An adapter whose transport fault leaves the commit result unknown. */
class UnknownOutcomePort implements PortfolioStorePort {
  public readonly durability = 'SESSION_ONLY' as const;
  public readonly durable = false as const;
  public calls = 0;
  public async getPortfolio(): Promise<undefined> {
    return undefined;
  }
  public async getRevision(): Promise<number> {
    return 0;
  }
  public async saveHoldings(): Promise<PortfolioPortSaveOutcome> {
    this.calls += 1;
    return {
      ok: 'unknown',
      code: 'OUTCOME_UNKNOWN',
      message: 'The commit acknowledgement was lost; the outcome cannot be established.',
      portfolioId: 'DEFAULT_PORTFOLIO',
      reconciliationRequired: true,
    };
  }
}

/* ------------------------------------------------------------------ *
 * Suite
 * ------------------------------------------------------------------ */

describe('CAP-02 U7 — IPD provider/UI outcome semantics', () => {
  it('T-U7-1: a receipt-only adapter can report a committed result with no legacy payload', async () => {
    const port = new ReceiptOnlyPort({
      disposition: 'SAVED_NEW_BATCH',
      revision: 1,
      durability: 'SESSION_ONLY',
      durable: false,
    });
    const vm = await readyController().confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });

    assert.strictEqual(vm.state, 'SAVE_SUCCESS');
    assert.strictEqual(vm.portOutcome, 'SUCCESS');
    assert.deepStrictEqual(vm.commitReceipt, {
      disposition: 'SAVED_NEW_BATCH',
      revision: 1,
      durability: 'SESSION_ONLY',
      durable: false,
    });
    // Nothing was invented to fill the legacy shape.
    assert.strictEqual(vm.saveResult, undefined, 'a receipt-only success fabricates no PortfolioSaveResult');
    assert.strictEqual(vm.portRefusal, undefined);
    assert.strictEqual(vm.outcomeUnknown, undefined);
    assert.strictEqual(vm.durable, false);
    assert.strictEqual(vm.durability, 'SESSION_ONLY');
    assert.strictEqual(port.calls, 1, 'exactly one save attempt');
  });

  it('T-U7-1b: a duplicate is derived only from ALREADY_IMPORTED_NO_OP in the receipt', async () => {
    const port = new ReceiptOnlyPort({
      disposition: 'ALREADY_IMPORTED_NO_OP',
      revision: 4,
      durability: 'SESSION_ONLY',
      durable: false,
    });
    const vm = await readyController().confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });
    assert.strictEqual(vm.commitReceipt?.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.strictEqual(vm.commitReceipt?.revision, 4);
    assert.strictEqual(vm.saveResult?.isDuplicate, undefined, 'the provider does not synthesize a duplicate flag');
  });

  it('T-U7-2: a Class A refusal fabricates no record, timestamp, zero metric or durability claim', async () => {
    const port = new ClassARefusalPort();
    const vm = await readyController().confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });

    assert.strictEqual(vm.state, 'REJECTED');
    assert.strictEqual(vm.portOutcome, 'REFUSED');
    assert.strictEqual(vm.portRefusal?.code, 'REVISION_CONFLICT');
    assert.strictEqual(vm.portRefusal?.refusedHoldings.length, 0);
    assert.strictEqual(vm.saveResult, undefined, 'no fabricated PortfolioSaveResult (no savedAt, no zero totals)');
    assert.strictEqual(vm.commitReceipt, undefined, 'a refusal is not a commit');
    assert.strictEqual(vm.durable, false);
    assert.strictEqual(vm.outcomeUnknown, undefined);
    // Preview data still exists for display, but it is preview-only.
    assert.ok(vm.acceptedHoldingsCount > 0);
    assert.strictEqual(port.calls, 1);
  });

  it('T-U7-2b: a guard-block is a refusal with no synthesized timestamp or placeholder record', async () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);
    const port = new ClassARefusalPort();
    const vm = await controller.confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });
    assert.strictEqual(vm.state, 'REJECTED');
    assert.strictEqual(vm.portOutcome, 'REFUSED');
    assert.match(vm.portRefusal?.message || '', /Save Guard Block/);
    assert.strictEqual(vm.saveResult, undefined);
    assert.strictEqual(port.calls, 0, 'no save was attempted before the guard');
  });

  it('T-U7-3: outcome-unknown is distinct — no receipt, no refusal wording, no retry', async () => {
    const port = new UnknownOutcomePort();
    const vm = await readyController().confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });

    assert.strictEqual(vm.state, 'OUTCOME_UNKNOWN');
    assert.strictEqual(vm.portOutcome, 'OUTCOME_UNKNOWN');
    assert.deepStrictEqual(vm.outcomeUnknown, {
      message: 'The commit acknowledgement was lost; the outcome cannot be established.',
      portfolioId: 'DEFAULT_PORTFOLIO',
      reconciliationRequired: true,
    });
    assert.strictEqual(vm.commitReceipt, undefined, 'an unknown outcome proves no commit');
    assert.strictEqual(vm.portRefusal, undefined, 'unknown is not an ordinary refusal');
    assert.strictEqual(vm.saveResult, undefined);
    assert.strictEqual(vm.durable, false, 'no durability claim is made for an unknown outcome');
    assert.strictEqual(vm.portSaveGuard.saveable, false, 'no retry is offered while the outcome is unknown');
    assert.match(vm.portSaveGuard.disabledReason || '', /unknown/i);
    assert.strictEqual(port.calls, 1, 'exactly one attempt — never an automatic retry');
    assert.match(vm.accessibility.liveRegionText, /Outcome Unknown/);
    assert.strictEqual(vm.accessibility.ariaLive, 'assertive');
  });

  it('T-U7-4: displayed durability is receipt-driven, not the declared store capability', async () => {
    // Declared capability says DURABLE/true, but the authoritative receipt says otherwise.
    const overstatedCapability = new ReceiptOnlyPort(
      { disposition: 'MERGED_INTO_EXISTING', revision: 2, durability: 'SESSION_ONLY', durable: false },
      { durability: 'DURABLE', durable: true },
    );
    const vm1 = await readyController().confirmAndSaveViaPort({
      storePort: overstatedCapability,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });
    assert.strictEqual(vm1.durable, false, 'a capability declaration is never commit evidence');
    assert.strictEqual(vm1.durability, 'SESSION_ONLY');

    // Declared capability says SESSION_ONLY/false, but the receipt is authoritative.
    const understatedCapability = new ReceiptOnlyPort(
      { disposition: 'SAVED_NEW_BATCH', revision: 1, durability: 'DURABLE', durable: true },
      { durability: 'SESSION_ONLY', durable: false },
    );
    const vm2 = await readyController().confirmAndSaveViaPort({
      storePort: understatedCapability,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });
    assert.strictEqual(vm2.durable, true, 'the receipt is the authority for a durable commit');
    assert.strictEqual(vm2.durability, 'DURABLE');
  });

  it('T-U7-4b: the shipped adapter still declares SESSION_ONLY / durable:false and emits a matching receipt', async () => {
    const store = new PortfolioStore();
    const port = new SessionPortfolioStorePort(store);
    assert.strictEqual(port.durability, 'SESSION_ONLY');
    assert.strictEqual(port.durable, false);

    const vm = await readyController().confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });
    assert.strictEqual(vm.state, 'SAVE_SUCCESS');
    assert.strictEqual(vm.commitReceipt?.durability, 'SESSION_ONLY');
    assert.strictEqual(vm.commitReceipt?.durable, false);
    assert.strictEqual(vm.durable, false, 'no durable commit is claimed for a session save');
  });

  it('T-U7-5: the committed panel substitutes no preview total, count or digest', () => {
    const source = readRepoSource('frontend/src/features/portfolio/BrokerImportModal.tsx');
    assert.ok(source, 'the exported modal source must be readable');

    assert.ok(
      !/\?\?\s*viewModel\.totalMarketValue/.test(source),
      'the committed panel must not fall back to the preview total market value',
    );
    assert.ok(
      !/\?\?\s*viewModel\.acceptedHoldingsCount/.test(source),
      'the committed panel must not fall back to the preview accepted-holdings count',
    );
    assert.ok(
      !/\|\|\s*viewModel\.lineageDigest/.test(source),
      'the committed panel must not fall back to the preview lineage digest',
    );
    assert.ok(
      !/\?\?\s*viewModel\.totalNormalizedWeight/.test(source),
      'the committed panel must not fall back to the preview normalized weight',
    );
    // The receipt, and only the receipt, drives the committed headline.
    assert.match(source, /viewModel\.commitReceipt\?\.disposition/);
    assert.match(source, /viewModel\.commitReceipt\.revision|viewModel\.commitReceipt\?\.revision/);
    // A distinct unknown panel exists and offers no retry control.
    assert.match(source, /viewModel\.state === 'OUTCOME_UNKNOWN'/);
    assert.match(source, /Reconcile|reconcil/);
  });

  it('T-U7-6: getAnalytics is optional on the port, and the workspace does not invent analytics', async () => {
    const port: PortfolioStorePort = new ReceiptOnlyPort({
      disposition: 'SAVED_NEW_BATCH',
      revision: 1,
      durability: 'SESSION_ONLY',
      durable: false,
    });
    assert.strictEqual(typeof port.getAnalytics, 'undefined', 'a reserved analytics operation may be omitted');
    assert.strictEqual(await port.getPortfolio('DEFAULT_PORTFOLIO'), undefined);
    assert.strictEqual(await port.getRevision('DEFAULT_PORTFOLIO'), 1);

    const source = readRepoSource('frontend/src/features/portfolio/PortfolioWorkspace.tsx');
    assert.ok(source, 'the workspace source must be readable');
    assert.match(
      source,
      /storePort\.getAnalytics\s*\?/,
      'the workspace must guard the optional analytics call instead of requiring it',
    );
  });

  it('T-U7-7: write denial and session-only capability are intact', async () => {
    // The provider refusal vocabulary keeps the denial code.
    const port = new SessionPortfolioStorePort(new PortfolioStore());
    const guard = evaluatePortSaveGuard([
      {
        symbol: 'UNRESOLVED',
        companyId: '',
        quantity: 1,
        averageBuyPrice: 1,
        currentPrice: 1,
        marketValue: 1,
        weightPercentage: 100,
        active: true,
        sourceBroker: 'ZERODHA',
        lineageDigest: 'd',
        identityStatus: 'UNRESOLVED',
      } as never,
    ]);
    assert.strictEqual(guard.saveable, false, 'DP-2 Option 2F refusal is unchanged');
    assert.strictEqual(port.durability, 'SESSION_ONLY');
    assert.strictEqual(port.durable, false);

    // `durable:true` is unreachable from the shipped adapter's receipt.
    const vm = await readyController().confirmAndSaveViaPort({
      storePort: port,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });
    assert.strictEqual(vm.commitReceipt?.durable, false);

    // The port source still carries the denial vocabulary and no durable capability.
    const portSource = readRepoSource('frontend/src/features/portfolio/portfolioStorePort.ts');
    assert.ok(portSource, 'the port source must be readable');
    assert.ok(portSource.includes('REFUSED_UNRESOLVED_IDENTITY'));
    assert.ok(portSource.includes('OUTCOME_UNKNOWN'));
    assert.ok(
      portSource.includes('public readonly durable: boolean = false'),
      'the only shipped adapter must declare durable:false',
    );
    assert.ok(
      !portSource.includes('public readonly durability: PortfolioDurability = \'DURABLE\''),
      'the only shipped adapter must not declare a durable capability',
    );
  });
});
