/**
 * Institutional Investment Platform System (IIPS)
 * UI: Portfolio Broker Import View Model Builder & Ingress Controller (BI-07)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { SecurityMaster } from '../../../../../src/identity/security_master.js';
import { AccessibilityEngine } from '../../../../../src/ui/accessibility_engine.js';
import { ResponsiveEngine } from '../../../../../src/ui/responsive_engine.js';
import { ResponsiveTier, UIQualityIndicator } from '../../../../../src/ui/types.js';
import {
  BrokerIngressRequest,
  BrokerIngressResult,
  BrokerIngressRejection,
  UserHoldingInput,
  FinappBrokerType,
} from './types.js';
import { BrokerImportIngressOrchestrator } from './broker-import-ingress.js';
import { PortfolioStore, PortfolioSaveResult } from '../portfolio-store.js';
import {
  evaluatePortSaveGuard,
  PortfolioCommitReceipt,
  PortfolioDurability,
  PortfolioPortRefusedHolding,
  PortfolioPortRefusalCode,
  PortfolioPortSaveGuard,
  PortfolioStorePort,
} from '../portfolioStorePort.js';

export type BrokerImportUIState =
  | 'IDLE'
  | 'FILE_SELECTED'
  | 'PROCESSING'
  | 'PREVIEW_READY'
  | 'PARTIAL_REJECTIONS'
  | 'READY_TO_SAVE'
  | 'SAVE_SUCCESS'
  | 'OUTCOME_UNKNOWN'
  | 'REJECTED'
  | 'BLOCKED';

export interface AcceptedHoldingPreviewItem {
  symbol: string;
  isin?: string;
  companyId: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  weightPercentage: number;
  lineageDigest: string;
  identityStatus?: 'RESOLVED' | 'UNRESOLVED';
  resolutionDisposition?: 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS';
}

export interface RejectedRowPreviewItem {
  row?: number;
  identifier?: string;
  reason: string;
  details: string;
}

export interface BrokerImportSaveGuard {
  isSaveEnabled: boolean;
  disabledReason?: string;
  allHoldingsHaveCompanyId: boolean;
  isExact100Weight: boolean;
  hasValidHoldings: boolean;
  isReadyDisposition: boolean;
}

export interface PortfolioBrokerImportViewModel {
  surfaceId: 'UI15_PORTFOLIO_BROKER_IMPORT';
  state: BrokerImportUIState;
  brokerName: string;
  sourceBroker: FinappBrokerType;
  fileName: string;
  asOf: string;
  acceptedHoldingsCount: number;
  rejectedRowsCount: number;
  totalMarketValue: number;
  totalNormalizedWeight: number;
  identityResolutionStatus: string;
  contentDigest: string;
  lineageDigest: string;
  acceptedHoldings: AcceptedHoldingPreviewItem[];
  rejectedRows: RejectedRowPreviewItem[];
  saveGuard: BrokerImportSaveGuard;
  qualityIndicator: UIQualityIndicator;
  warnings: string[];
  errors: string[];
  accessibility: {
    ariaLive: 'polite' | 'assertive' | 'off';
    ariaRole: string;
    focusElementId: string;
    tableCaption: string;
    liveRegionText: string;
  };
  responsiveLayout: {
    tier: ResponsiveTier;
    columns: number;
    containerClass: string;
    pinnedColumn?: string;
  };
  /**
   * The legacy result shape, present ONLY when the save outcome actually carried
   * one. It is never synthesized from preview data and never used as the
   * authority for a committed display.
   */
  saveResult?: PortfolioSaveResult;
  /**
   * Authoritative post-commit receipt (CAP-02 U7). Present ONLY when the port
   * returned a success outcome. This — not any preview field and not the port's
   * static capability declaration — is the sole source of committed facts and
   * durability wording.
   */
  commitReceipt?: PortfolioCommitReceipt;
  /** Which provider outcome the last port save produced. */
  portOutcome: 'NONE' | 'SUCCESS' | 'REFUSED' | 'OUTCOME_UNKNOWN';
  /**
   * Present only for a distinct outcome-unknown state: the commit result could
   * not be established. No receipt exists, no retry is performed, and
   * reconciliation requires a separately authorised read.
   */
  outcomeUnknown?: {
    message: string;
    portfolioId: string;
    reconciliationRequired: true;
  };
  /**
   * Durability: `commitReceipt`-derived when a commit is known, otherwise the
   * save path's DECLARED capability. A declaration is not commit evidence.
   */
  durability: PortfolioDurability;
  /**
   * True ONLY when an authoritative receipt says `durable: true`. Never derived
   * from the store's static capability.
   */
  durable: boolean;
  /**
   * Port-path save guard with DP-2 Option 2F applied (unresolved/ambiguous
   * holdings are preview-only). Distinct from the legacy synchronous `saveGuard`,
   * which is preserved unchanged for existing callers.
   */
  portSaveGuard: PortfolioPortSaveGuard;
  /** Present when a port-path save was refused. */
  portRefusal?: {
    code: PortfolioPortRefusalCode;
    message: string;
    refusedHoldings: PortfolioPortRefusedHolding[];
  };
}

export class PortfolioBrokerImportController {
  private currentState: BrokerImportUIState = 'IDLE';
  private lastIngressResult?: BrokerIngressResult;
  private lastSaveResult?: PortfolioSaveResult;
  private selectedFileName: string = '';
  private securityMaster?: SecurityMaster;
  private durability: PortfolioDurability = 'SESSION_ONLY';
  private durable: boolean = false;
  private commitReceipt?: PortfolioCommitReceipt;
  private portOutcome: 'NONE' | 'SUCCESS' | 'REFUSED' | 'OUTCOME_UNKNOWN' = 'NONE';
  private outcomeUnknown?: PortfolioBrokerImportViewModel['outcomeUnknown'];
  private portRefusal?: PortfolioBrokerImportViewModel['portRefusal'];

  constructor(securityMaster?: SecurityMaster) {
    this.securityMaster = securityMaster;
  }

  public getState(): BrokerImportUIState {
    return this.currentState;
  }

  public getIngressResult(): BrokerIngressResult | undefined {
    return this.lastIngressResult;
  }

  public getSaveResult(): PortfolioSaveResult | undefined {
    return this.lastSaveResult;
  }

  /**
   * Resets import state to IDLE and clears previous ingress and save results.
   */
  public reset(): void {
    this.currentState = 'IDLE';
    this.lastIngressResult = undefined;
    this.lastSaveResult = undefined;
    this.portRefusal = undefined;
    this.outcomeUnknown = undefined;
    this.portOutcome = 'NONE';
    this.commitReceipt = undefined;
    this.durable = false;
    this.selectedFileName = '';
  }

  /**
   * Processes an uploaded broker file through the governed BI-05 ingress orchestrator.
   * Clears any previous save results so new file processing begins in clean state.
   */
  public selectAndProcessFile(params: {
    content: string | Uint8Array | ArrayBuffer | any;
    fileName: string;
    asOf?: string;
    viewportWidth?: number;
    securityMaster?: SecurityMaster;
    failOnUnmappedIdentity?: boolean;
    minHoldingValueThreshold?: number;
    allowNonProductionBypass?: boolean;
    executionEnvironment?: 'PRODUCTION' | 'NON_PRODUCTION';
  }): PortfolioBrokerImportViewModel {
    this.selectedFileName = params.fileName;
    this.currentState = 'PROCESSING';
    this.lastSaveResult = undefined; // Clear previous save result
    const sm = params.securityMaster || this.securityMaster;

    const request: BrokerIngressRequest = {
      content: params.content,
      fileName: params.fileName,
      asOf: params.asOf,
      securityMaster: sm,
      failOnUnmappedIdentity: params.failOnUnmappedIdentity ?? true,
      minHoldingValueThreshold: params.minHoldingValueThreshold ?? 0,
      allowNonProductionBypass: params.allowNonProductionBypass ?? false, // Default false ensures strict fail-closed governance unless explicitly opted in
      executionEnvironment: params.executionEnvironment ?? 'NON_PRODUCTION',
    };

    const ingressResult = BrokerImportIngressOrchestrator.executeIngress(request);
    this.lastIngressResult = ingressResult;

    // Determine state transition
    if (ingressResult.disposition === 'BLOCKED') {
      this.currentState = 'BLOCKED';
    } else if (ingressResult.disposition === 'REJECTED') {
      this.currentState = 'REJECTED';
    } else if (ingressResult.disposition === 'READY_FOR_PORTFOLIO_SAVE') {
      if (ingressResult.rejectedCount > 0) {
        this.currentState = 'PARTIAL_REJECTIONS';
      } else {
        this.currentState = 'READY_TO_SAVE';
      }
    }

    return this.buildViewModel(params.viewportWidth ?? 1280, sm);
  }

  /**
   * Confirms and persists the validated holding vector into the governed PortfolioStore.
   * Supports governed multi-broker atomic merge (default) or explicit replacement.
   */
  public confirmAndSave(params: {
    portfolioStore: PortfolioStore;
    portfolioId?: string;
    viewportWidth?: number;
    mode?: 'MERGE' | 'REPLACE';
  }): PortfolioBrokerImportViewModel {
    const portfolioId = params.portfolioId || 'DEFAULT_PORTFOLIO';
    const mode = params.mode || 'MERGE';

    if (!this.lastIngressResult || this.lastIngressResult.disposition !== 'READY_FOR_PORTFOLIO_SAVE') {
      this.currentState = 'REJECTED';
      this.lastSaveResult = {
        success: false,
        portfolio: params.portfolioStore.getPortfolio(portfolioId)!,
        holdingsSavedCount: 0,
        totalMarketValue: 0,
        weightSumPercentage: 0,
        savedAt: new Date().toISOString(),
        provenanceDigest: '',
        error: 'Save Guard Block: Ingress disposition is not READY_FOR_PORTFOLIO_SAVE.',
      };
      return this.buildViewModel(params.viewportWidth ?? 1280);
    }

    // Execute atomic batch save (merge or replace)
    const saveRes = params.portfolioStore.saveHoldings(
      portfolioId,
      this.lastIngressResult.userHoldings,
      {
        mode,
        sourceBroker: this.lastIngressResult.provenance.sourceBroker,
        fileName: this.lastIngressResult.provenance.fileName,
        contentDigest: this.lastIngressResult.provenance.contentDigest,
        lineageDigest: this.lastIngressResult.provenance.lineageDigest,
      }
    );

    this.lastSaveResult = saveRes;

    if (saveRes.success) {
      this.currentState = 'SAVE_SUCCESS';
    } else {
      this.currentState = 'REJECTED';
    }

    return this.buildViewModel(params.viewportWidth ?? 1280);
  }

  /**
   * Confirms and persists the validated holding vector through the asynchronous
   * portfolio store port (act `np04-g2-portfolio-ui-store-port-2026-10-16-001`).
   *
   * DP-2 Option 2F: unresolved or ambiguous holdings are refused before any
   * mutation of the store — they may be previewed and explained, never persisted.
   * The legacy synchronous `confirmAndSave({ portfolioStore })` path above is
   * preserved unchanged for existing callers.
   */
  public async confirmAndSaveViaPort(params: {
    storePort: PortfolioStorePort;
    portfolioId?: string;
    viewportWidth?: number;
    mode?: 'MERGE' | 'REPLACE';
    expectedRevision?: number;
  }): Promise<PortfolioBrokerImportViewModel> {
    const portfolioId = params.portfolioId || 'DEFAULT_PORTFOLIO';
    const mode = params.mode || 'MERGE';
    const viewportWidth = params.viewportWidth ?? 1280;

    // Start from a clean outcome. The declared capability of the save path is a
    // DECLARATION only; it is replaced by receipt-derived facts on success and
    // it never authorises a committed display.
    this.durability = params.storePort.durability;
    this.durable = false;
    this.portOutcome = 'NONE';
    this.portRefusal = undefined;
    this.outcomeUnknown = undefined;
    this.commitReceipt = undefined;

    if (!this.lastIngressResult || this.lastIngressResult.disposition !== 'READY_FOR_PORTFOLIO_SAVE') {
      // A guard-block is a refusal. Nothing was saved, so no result, no
      // timestamp and no placeholder record is synthesized.
      this.currentState = 'REJECTED';
      this.portOutcome = 'REFUSED';
      this.portRefusal = {
        code: 'REFUSED_STORE_GUARD',
        message: 'Save Guard Block: Ingress disposition is not READY_FOR_PORTFOLIO_SAVE.',
        refusedHoldings: [],
      };
      return this.buildViewModel(viewportWidth);
    }

    const outcome = await params.storePort.saveHoldings({
      portfolioId,
      holdings: this.lastIngressResult.userHoldings,
      options: {
        mode,
        sourceBroker: this.lastIngressResult.provenance.sourceBroker,
        fileName: this.lastIngressResult.provenance.fileName,
        contentDigest: this.lastIngressResult.provenance.contentDigest,
        lineageDigest: this.lastIngressResult.provenance.lineageDigest,
      },
      expectedRevision: params.expectedRevision,
    });

    if (outcome.ok === true) {
      // Committed: the receipt is the authority. Nothing is inferred from
      // preview data, and the legacy result is used only if actually supplied.
      this.commitReceipt = outcome.receipt;
      this.durability = outcome.receipt.durability;
      this.durable = outcome.receipt.durable === true;
      this.portOutcome = 'SUCCESS';
      this.lastSaveResult = outcome.result;
      this.currentState = 'SAVE_SUCCESS';
      return this.buildViewModel(viewportWidth);
    }

    if (outcome.ok === 'unknown') {
      // Distinct third state: the commit result cannot be known. No receipt is
      // produced, no retry is attempted, and no refusal wording is used.
      this.portOutcome = 'OUTCOME_UNKNOWN';
      this.outcomeUnknown = {
        message: outcome.message,
        portfolioId: outcome.portfolioId,
        reconciliationRequired: true,
      };
      this.lastSaveResult = undefined;
      this.currentState = 'OUTCOME_UNKNOWN';
      return this.buildViewModel(viewportWidth);
    }

    // Ordinary refusal: no record, no timestamp, no zero metrics, no durability
    // claim, and no unmutated portfolio snapshot unless the port supplied one.
    this.portOutcome = 'REFUSED';
    this.portRefusal = {
      code: outcome.code,
      message: outcome.message,
      refusedHoldings: outcome.refusedHoldings ?? [],
    };
    this.lastSaveResult = undefined;
    this.currentState = 'REJECTED';
    return this.buildViewModel(viewportWidth);
  }

  /**
   * Synthesizes the governed PortfolioBrokerImportViewModel.
   */
  public buildViewModel(viewportWidth: number = 1280, securityMaster?: SecurityMaster): PortfolioBrokerImportViewModel {
    const bp = ResponsiveEngine.resolveTier(viewportWidth);
    const tier = bp.tier;
    const sm = securityMaster || this.securityMaster;

    const res = this.lastIngressResult;
    const isReady = res?.disposition === 'READY_FOR_PORTFOLIO_SAVE' && (res?.userHoldings.length ?? 0) > 0;
    const allHoldingsValid = (res?.userHoldings ?? []).every(
      (h) =>
        (h.identityStatus !== 'UNRESOLVED' && !!h.companyId && h.companyId !== 'UNKNOWN') ||
        (h.identityStatus === 'UNRESOLVED' && h.resolutionDisposition === 'NON_PRODUCTION_OPERATOR_BYPASS')
    );
    const isExact100 = res ? Math.abs(res.weightSumPercentage - 100.0) < 0.001 : false;

    // Evaluate save guard
    let isSaveEnabled = false;
    let disabledReason: string | undefined = undefined;

    if (this.currentState === 'SAVE_SUCCESS') {
      isSaveEnabled = false;
      disabledReason = 'Holdings already successfully saved to portfolio.';
    } else if (this.currentState === 'OUTCOME_UNKNOWN') {
      // No automatic retry: the commit result is unknown, so a second save is
      // withheld until the state is reconciled by a separately authorised read.
      isSaveEnabled = false;
      disabledReason = 'Commit outcome unknown. Reconcile by read before any retry.';
    } else if (this.currentState === 'BLOCKED') {
      isSaveEnabled = false;
      disabledReason = 'Import blocked: Unsupported binary format (requires BI-06 qualification).';
    } else if (this.currentState === 'REJECTED') {
      isSaveEnabled = false;
      disabledReason = res?.errors[0] || 'Import rejected due to validation or identity errors.';
    } else if (this.currentState === 'IDLE' || this.currentState === 'FILE_SELECTED' || this.currentState === 'PROCESSING') {
      isSaveEnabled = false;
      disabledReason = 'Processing in progress. Preview not ready.';
    } else if (isReady && allHoldingsValid && isExact100) {
      isSaveEnabled = true;
    } else {
      isSaveEnabled = false;
      disabledReason = 'Save guard requirements not fully met.';
    }

    const saveGuard: BrokerImportSaveGuard = {
      isSaveEnabled,
      disabledReason,
      allHoldingsHaveCompanyId: allHoldingsValid,
      isExact100Weight: isExact100,
      hasValidHoldings: (res?.validHoldingsCount ?? 0) > 0,
      isReadyDisposition: res?.disposition === 'READY_FOR_PORTFOLIO_SAVE',
    };

    // Port-path save guard: DP-2 Option 2F applied on top of the synchronous guard.
    // Unresolved/ambiguous holdings remain preview-only and cannot be persisted
    // through the port; the legacy synchronous `saveGuard` above is unchanged.
    const identityGuard = evaluatePortSaveGuard(res?.userHoldings);
    const portSaveGuard: PortfolioPortSaveGuard = {
      saveable: saveGuard.isSaveEnabled && identityGuard.saveable,
      disabledReason: !identityGuard.saveable ? identityGuard.disabledReason : saveGuard.disabledReason,
      refusedHoldings: identityGuard.refusedHoldings,
    };

    // Build accepted holding items
    const acceptedHoldings: AcceptedHoldingPreviewItem[] = (res?.userHoldings ?? []).map((h) => {
      let companyName = h.symbol;
      if (h.identityStatus === 'UNRESOLVED') {
        companyName = `${h.symbol} (Unresolved - Operator Bypass)`;
      } else if (sm && h.companyId) {
        const ent = sm.getEntity(h.companyId);
        if (ent) companyName = ent.companyName;
      }
      return {
        symbol: h.symbol,
        isin: h.isin,
        companyId: h.companyId,
        companyName,
        quantity: h.quantity,
        averageBuyPrice: h.averageBuyPrice,
        currentPrice: h.currentPrice,
        marketValue: h.marketValue,
        weightPercentage: h.weightPercentage,
        lineageDigest: h.lineageDigest,
        identityStatus: h.identityStatus,
        resolutionDisposition: h.resolutionDisposition,
      };
    });

    // Build rejected rows
    const rejectedRows: RejectedRowPreviewItem[] = (res?.rejections ?? []).map((r) => ({
      row: r.recordIndex,
      identifier: r.rawIdentifier,
      reason: r.reason,
      details: r.details,
    }));

    // Quality Indicator
    let qualityState: 'GOOD' | 'PARTIAL' | 'UNAVAILABLE' = 'UNAVAILABLE';
    if (
      this.currentState === 'BLOCKED' ||
      this.currentState === 'REJECTED' ||
      this.currentState === 'OUTCOME_UNKNOWN'
    ) {
      qualityState = 'UNAVAILABLE';
    } else if (this.currentState === 'PARTIAL_REJECTIONS') {
      qualityState = 'PARTIAL';
    } else if (this.currentState === 'SAVE_SUCCESS' || this.currentState === 'READY_TO_SAVE' || this.currentState === 'PREVIEW_READY') {
      qualityState = 'GOOD';
    }

    const qualityIndicator = AccessibilityEngine.getQualityIndicator(qualityState);

    // Human readable broker name
    let brokerDisplayName = 'Unknown Broker';
    if (res?.detection.brokerType === 'ZERODHA') brokerDisplayName = 'Zerodha Kite';
    else if (res?.detection.brokerType === 'DHAN') brokerDisplayName = 'Dhan';
    else if (res?.detection.brokerType === 'GROWW') brokerDisplayName = 'Groww';

    const hasUnresolved = (res?.userHoldings ?? []).some((h) => h.identityStatus === 'UNRESOLVED');
    const identityResolutionStatus = hasUnresolved
      ? 'NON_PRODUCTION_OPERATOR_BYPASS_ACTIVE'
      : allHoldingsValid
        ? 'ALL_IDENTITIES_RESOLVED_P04'
        : 'UNMAPPED_IDENTITY_DETECTED';

    // Live region text for screen readers
    let liveRegionText = 'Portfolio Broker Import: Idle.';
    if (this.currentState === 'PROCESSING') liveRegionText = 'Parsing and normalizing broker holdings...';
    else if (this.currentState === 'PREVIEW_READY' || this.currentState === 'READY_TO_SAVE') {
      liveRegionText = `Preview Ready: ${acceptedHoldings.length} holdings normalized (Total Weight: 100.0%). Ready to save.`;
    } else if (this.currentState === 'PARTIAL_REJECTIONS') {
      liveRegionText = `Preview Ready with Warnings: ${acceptedHoldings.length} holdings accepted, ${rejectedRows.length} rows excluded. Ready to save valid subset.`;
    } else if (this.currentState === 'SAVE_SUCCESS') {
      if (this.lastSaveResult?.isDuplicate) {
        liveRegionText = `Duplicate File Ignored: ${this.lastSaveResult.message || 'Source file already committed to this portfolio. State preserved without duplication.'}`;
      } else {
        liveRegionText = `Import Success: ${acceptedHoldings.length} holdings saved atomically to portfolio.`;
      }
    } else if (this.currentState === 'BLOCKED') {
      liveRegionText = `Import Blocked: ${res?.errors[0] || 'Unsupported format'}`;
    } else if (this.currentState === 'OUTCOME_UNKNOWN') {
      liveRegionText = `Import Outcome Unknown: ${this.outcomeUnknown?.message || 'The commit result could not be established.'} Reconcile before retrying; no automatic retry was attempted.`;
    } else if (this.currentState === 'REJECTED') {
      liveRegionText = `Import Rejected: ${this.portRefusal?.message || res?.errors[0] || 'Validation failed'}`;
    }

    return {
      surfaceId: 'UI15_PORTFOLIO_BROKER_IMPORT',
      state: this.currentState,
      brokerName: brokerDisplayName,
      sourceBroker: res?.detection.brokerType || 'UNKNOWN',
      fileName: this.selectedFileName || res?.provenance.fileName || 'No file selected',
      asOf: res?.provenance.asOf || new Date().toISOString(),
      acceptedHoldingsCount: acceptedHoldings.length,
      rejectedRowsCount: rejectedRows.length,
      totalMarketValue: res?.totalMarketValue ?? 0,
      totalNormalizedWeight: res?.weightSumPercentage ?? 0,
      identityResolutionStatus,
      contentDigest: res?.provenance.contentDigest || '',
      lineageDigest: res?.provenance.lineageDigest || '',
      acceptedHoldings,
      rejectedRows,
      saveGuard,
      qualityIndicator,
      warnings: res?.warnings || [],
      errors: res?.errors || [],
      accessibility: {
        ariaLive:
          this.currentState === 'REJECTED' ||
          this.currentState === 'BLOCKED' ||
          this.currentState === 'OUTCOME_UNKNOWN'
            ? 'assertive'
            : 'polite',
        ariaRole: 'dialog',
        focusElementId: isSaveEnabled ? 'ui15-btn-confirm-save' : 'ui15-btn-file-select',
        tableCaption: `Broker Holdings Import Preview for ${brokerDisplayName} (${this.selectedFileName})`,
        liveRegionText,
      },
      responsiveLayout: {
        tier,
        columns: bp.columns,
        containerClass: ResponsiveEngine.getContainerClass(tier),
        pinnedColumn: bp.pinPrimaryColumn ? 'symbol' : undefined,
      },
      saveResult: this.lastSaveResult,
      commitReceipt: this.commitReceipt,
      portOutcome: this.portOutcome,
      outcomeUnknown: this.outcomeUnknown,
      durability: this.durability,
      // Receipt-driven only: a static capability declaration is never a
      // per-operation durability claim.
      durable: this.durable === true && this.durability === 'DURABLE',
      portSaveGuard,
      portRefusal: this.portRefusal,
    };
  }
}
