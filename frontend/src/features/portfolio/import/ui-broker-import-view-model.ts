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

export type BrokerImportUIState =
  | 'IDLE'
  | 'FILE_SELECTED'
  | 'PROCESSING'
  | 'PREVIEW_READY'
  | 'PARTIAL_REJECTIONS'
  | 'READY_TO_SAVE'
  | 'SAVE_SUCCESS'
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
  saveResult?: PortfolioSaveResult;
}

export class PortfolioBrokerImportController {
  private currentState: BrokerImportUIState = 'IDLE';
  private lastIngressResult?: BrokerIngressResult;
  private lastSaveResult?: PortfolioSaveResult;
  private selectedFileName: string = '';
  private securityMaster?: SecurityMaster;

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
   * Synthesizes the governed PortfolioBrokerImportViewModel.
   */
  public buildViewModel(viewportWidth: number = 1280, securityMaster?: SecurityMaster): PortfolioBrokerImportViewModel {
    const bp = ResponsiveEngine.resolveTier(viewportWidth);
    const tier = bp.tier;
    const sm = securityMaster || this.securityMaster;

    const res = this.lastIngressResult;
    const isReady = res?.disposition === 'READY_FOR_PORTFOLIO_SAVE' && (res?.userHoldings.length ?? 0) > 0;
    const allHaveCompanyId = (res?.userHoldings ?? []).every((h) => !!h.companyId && h.companyId !== 'UNKNOWN');
    const isExact100 = res ? Math.abs(res.weightSumPercentage - 100.0) < 0.001 : false;

    // Evaluate save guard
    let isSaveEnabled = false;
    let disabledReason: string | undefined = undefined;

    if (this.currentState === 'SAVE_SUCCESS') {
      isSaveEnabled = false;
      disabledReason = 'Holdings already successfully saved to portfolio.';
    } else if (this.currentState === 'BLOCKED') {
      isSaveEnabled = false;
      disabledReason = 'Import blocked: Unsupported binary format (requires BI-06 qualification).';
    } else if (this.currentState === 'REJECTED') {
      isSaveEnabled = false;
      disabledReason = res?.errors[0] || 'Import rejected due to validation or identity errors.';
    } else if (this.currentState === 'IDLE' || this.currentState === 'FILE_SELECTED' || this.currentState === 'PROCESSING') {
      isSaveEnabled = false;
      disabledReason = 'Processing in progress. Preview not ready.';
    } else if (isReady && allHaveCompanyId && isExact100) {
      isSaveEnabled = true;
    } else {
      isSaveEnabled = false;
      disabledReason = 'Save guard requirements not fully met.';
    }

    const saveGuard: BrokerImportSaveGuard = {
      isSaveEnabled,
      disabledReason,
      allHoldingsHaveCompanyId: allHaveCompanyId,
      isExact100Weight: isExact100,
      hasValidHoldings: (res?.validHoldingsCount ?? 0) > 0,
      isReadyDisposition: res?.disposition === 'READY_FOR_PORTFOLIO_SAVE',
    };

    // Build accepted holding items
    const acceptedHoldings: AcceptedHoldingPreviewItem[] = (res?.userHoldings ?? []).map((h) => {
      let companyName = h.symbol;
      if (sm) {
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
    let qualityState: 'GOOD' | 'PARTIAL' | 'UNAVAILABLE' = 'GOOD';
    if (this.currentState === 'BLOCKED' || this.currentState === 'REJECTED') {
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

    // Live region text for screen readers
    let liveRegionText = 'Portfolio Broker Import: Idle.';
    if (this.currentState === 'PROCESSING') liveRegionText = 'Parsing and normalizing broker holdings...';
    else if (this.currentState === 'PREVIEW_READY' || this.currentState === 'READY_TO_SAVE') {
      liveRegionText = `Preview Ready: ${acceptedHoldings.length} holdings normalized (Total Weight: 100.0%). Ready to save.`;
    } else if (this.currentState === 'PARTIAL_REJECTIONS') {
      liveRegionText = `Preview Ready with Warnings: ${acceptedHoldings.length} holdings accepted, ${rejectedRows.length} rows excluded. Ready to save valid subset.`;
    } else if (this.currentState === 'SAVE_SUCCESS') {
      liveRegionText = `Import Success: ${acceptedHoldings.length} holdings saved atomically to portfolio.`;
    } else if (this.currentState === 'BLOCKED') {
      liveRegionText = `Import Blocked: ${res?.errors[0] || 'Unsupported format'}`;
    } else if (this.currentState === 'REJECTED') {
      liveRegionText = `Import Rejected: ${res?.errors[0] || 'Validation failed'}`;
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
      identityResolutionStatus: allHaveCompanyId ? 'ALL_IDENTITIES_RESOLVED_P04' : 'UNMAPPED_IDENTITY_DETECTED',
      contentDigest: res?.provenance.contentDigest || '',
      lineageDigest: res?.provenance.lineageDigest || '',
      acceptedHoldings,
      rejectedRows,
      saveGuard,
      qualityIndicator,
      warnings: res?.warnings || [],
      errors: res?.errors || [],
      accessibility: {
        ariaLive: this.currentState === 'REJECTED' || this.currentState === 'BLOCKED' ? 'assertive' : 'polite',
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
    };
  }
}
