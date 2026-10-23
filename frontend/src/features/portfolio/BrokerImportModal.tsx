/**
 * Institutional Investment Platform System (IIPS)
 * Broker Import React Modal Component (BI-07 React DOM Host Integration & Visual Parity)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / P13-CERT / P14-CERT / BI-07-VISUAL
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  PortfolioStore,
  PortfolioSaveResult,
  PortfolioBrokerImportController,
  PortfolioBrokerImportViewModel,
} from './index.js';
import {
  PortfolioCommitReceipt,
  PortfolioStorePort,
  SessionPortfolioStorePort,
} from './portfolioStorePort.js';
import { SecurityMaster } from '../../../../src/identity/security_master.js';

/**
 * Default for the non-production unresolved-holdings operator bypass.
 *
 * OFF by act `np04-g2-portfolio-ui-store-port-2026-10-16-001`: with the bypass
 * disabled, holdings without a single canonical P04 identity are previewed and
 * explained as rejected rows and cannot be persisted (DP-2 Option 2F). The
 * historical bypass default (`true`) is deliberately not restored on this path.
 */
export const DEFAULT_ALLOW_NON_PRODUCTION_BYPASS = false;

export interface BrokerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Invoked ONLY when the save outcome carries an authoritative
   * `PortfolioSaveResult`. A governed v1 adapter that reports only the minimal
   * commit receipt does not supply one, so this callback is optional.
   */
  onSaveSuccess?: (result: PortfolioSaveResult) => void;
  /**
   * Invoked with the authoritative post-commit receipt (CAP-02 U7). This is the
   * only committed-result signal a host needs; it is never derived from preview
   * data or from the port's declared capability.
   */
  onCommitReceipt?: (receipt: PortfolioCommitReceipt) => void;
  /**
   * Invoked when the commit outcome could not be established. Distinct from a
   * refusal: no retry is performed by this component.
   */
  onOutcomeUnknown?: (info: { message: string; portfolioId: string; reconciliationRequired: true }) => void;
  portfolioStore: PortfolioStore;
  /** Optional store port; defaults to the session-only port over `portfolioStore`. */
  storePort?: PortfolioStorePort;
  /** Optional optimistic-concurrency token forwarded to the port save. */
  expectedRevision?: number;
  /** Invoked when a port save is refused with a revision conflict. */
  onRevisionConflict?: (message: string) => void;
  securityMaster?: SecurityMaster;
  allowNonProductionBypass?: boolean;
  executionEnvironment?: 'PRODUCTION' | 'NON_PRODUCTION';
}

export const BrokerImportModal: React.FC<BrokerImportModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  onCommitReceipt,
  onOutcomeUnknown,
  portfolioStore,
  storePort: optionalStorePort,
  expectedRevision,
  onRevisionConflict,
  securityMaster,
  allowNonProductionBypass = DEFAULT_ALLOW_NON_PRODUCTION_BYPASS,
  executionEnvironment = 'NON_PRODUCTION',
}) => {
  // Initialize governed controller
  const controller = useMemo(() => new PortfolioBrokerImportController(securityMaster), [securityMaster]);

  // Store port: this modal's save path. Session-only and non-durable until a
  // durable adapter is separately authorized (act np04-g2-portfolio-ui-store-port-2026-10-16-001).
  const storePort = useMemo(
    () => optionalStorePort || new SessionPortfolioStorePort(portfolioStore),
    [optionalStorePort, portfolioStore]
  );

  // Imperative DOM ref for native file dialog invocation
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View-model binding state
  const [viewModel, setViewModel] = useState<PortfolioBrokerImportViewModel>(() =>
    controller.buildViewModel(typeof window !== 'undefined' ? window.innerWidth : 1280, securityMaster)
  );
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Reset helper that synchronizes controller, input ref, and view-model back to IDLE
  const resetToIdle = useCallback(() => {
    controller.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    setViewModel(controller.buildViewModel(viewportWidth, securityMaster));
    setIsProcessingFile(false);
    setIsDragging(false);
    setIsSaving(false);
  }, [controller, securityMaster]);

  // Synchronize and reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      resetToIdle();
    }
  }, [isOpen, resetToIdle]);

  // File selection handler
  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessingFile(true);
      try {
        const content = await file.text();
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vm = controller.selectAndProcessFile({
          content,
          fileName: file.name,
          viewportWidth,
          securityMaster,
          allowNonProductionBypass,
          executionEnvironment,
        });
        setViewModel(vm);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
        const vm = controller.buildViewModel(viewportWidth, securityMaster);
        vm.errors.push(`File read failure: ${errorMsg}`);
        setViewModel({ ...vm, state: 'REJECTED' });
      } finally {
        setIsProcessingFile(false);
      }
    },
    [controller, securityMaster]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      // Reset input value to allow re-selecting the same file if user retries
      e.target.value = '';
      handleFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Confirm and save handler — persists through the asynchronous store port.
  // Pending state is explicit; a refusal (including DP-2 Option 2F and revision
  // conflicts) is surfaced without any store mutation.
  const handleConfirmSave = useCallback(async () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    setIsSaving(true);
    try {
      const vm = await controller.confirmAndSaveViaPort({
        storePort,
        portfolioId: 'DEFAULT_PORTFOLIO',
        viewportWidth,
        expectedRevision,
      });
      setViewModel(vm);

      // Only an authoritative receipt may announce a commit. A legacy result is
      // forwarded only when the outcome actually carried one.
      if (vm.state === 'SAVE_SUCCESS' && vm.commitReceipt) {
        onCommitReceipt?.(vm.commitReceipt);
        if (vm.saveResult) onSaveSuccess?.(vm.saveResult);
      } else if (vm.state === 'OUTCOME_UNKNOWN' && vm.outcomeUnknown) {
        onOutcomeUnknown?.(vm.outcomeUnknown);
      } else if (vm.portRefusal?.code === 'REVISION_CONFLICT' && onRevisionConflict) {
        onRevisionConflict(vm.portRefusal.message);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const vm = controller.buildViewModel(viewportWidth, securityMaster);
      vm.errors.push(`Port save failure: ${errorMsg}`);
      setViewModel({ ...vm, state: 'REJECTED' });
    } finally {
      setIsSaving(false);
    }
  }, [
    controller,
    storePort,
    expectedRevision,
    onRevisionConflict,
    securityMaster,
    onSaveSuccess,
    onCommitReceipt,
    onOutcomeUnknown,
  ]);

  // Clean close handler
  const handleClose = useCallback(() => {
    resetToIdle();
    onClose();
  }, [resetToIdle, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="iips-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ui15-modal-title"
      aria-describedby="ui15-modal-description"
      aria-live={viewModel.accessibility.ariaLive}
      onClick={handleClose}
    >
      <div
        className={`iips-modal-container relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl cursor-default ${viewModel.responsiveLayout.containerClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Live Region for Screen Readers */}
        <div aria-live={viewModel.accessibility.ariaLive} className="sr-only">
          {viewModel.accessibility.liveRegionText}
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-950 text-teal-300 font-bold border border-teal-700 shadow-sm">
              UI15
            </div>
            <div>
              <h2 id="ui15-modal-title" className="text-xl font-bold tracking-tight text-white">
                Import Broker Holdings
              </h2>
              <p id="ui15-modal-description" className="text-xs text-slate-400 mt-0.5">
                Institutional Broker Ingress &amp; Atomic Portfolio Persistence Boundary (BI-07)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* WCAG Dual-Coded Quality Badge */}
            <span
              className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
              style={{
                backgroundColor: `${viewModel.qualityIndicator.colorHex}22`,
                color: viewModel.qualityIndicator.colorHex,
                border: `1px solid ${viewModel.qualityIndicator.colorHex}`,
              }}
              title={viewModel.qualityIndicator.ariaText}
            >
              <span>{viewModel.qualityIndicator.icon}</span>
              <span>{viewModel.qualityIndicator.label}</span>
            </span>

            <button
              type="button"
              id="ui15-btn-modal-header-close"
              onClick={handleClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* IDLE / Initial File Selection State */}
          {viewModel.state === 'IDLE' && (
            <div className="space-y-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                  isDragging
                    ? 'border-teal-400 bg-teal-950/30'
                    : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'
                }`}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 text-teal-400 text-3xl border border-slate-700 shadow-sm">
                  📁
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Select Broker Holdings Export File</h3>
                <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                  Drag and drop your broker holding statement CSV here, or click to browse. Supported formats: Zerodha
                  Kite, Dhan (Detailed &amp; Web UI), and Groww Stocks.
                </p>

                {/* Semantic Button with Programmatic Click Dispatch to Ref */}
                <button
                  type="button"
                  id="ui15-btn-file-select"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer inline-flex items-center space-x-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors pointer-events-auto"
                >
                  <span>Select Broker CSV</span>
                </button>

                {/* Hidden File Input attached to Ref */}
                <input
                  ref={fileInputRef}
                  id="ui15-file-input"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleFileInputChange}
                  aria-hidden="true"
                />

                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
                  <span className="rounded-md bg-slate-800/80 px-2.5 py-1 border border-slate-700 text-slate-300">
                    ✓ Zerodha Kite (.csv)
                  </span>
                  <span className="rounded-md bg-slate-800/80 px-2.5 py-1 border border-slate-700 text-slate-300">
                    ✓ Dhan Detailed (.csv)
                  </span>
                  <span className="rounded-md bg-slate-800/80 px-2.5 py-1 border border-slate-700 text-slate-300">
                    ✓ Dhan Web UI (.csv)
                  </span>
                  <span className="rounded-md bg-slate-800/80 px-2.5 py-1 border border-slate-700 text-slate-300">
                    ✓ Groww Stocks (.csv)
                  </span>
                  <span className="rounded-md bg-slate-900 px-2.5 py-1 border border-amber-800 text-amber-400">
                    ⚠ XLSX Blocked (BI-06)
                  </span>
                </div>
              </div>

              {/* Governed Ingress Pipeline Rules Panel */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-400 space-y-2 shadow-sm">
                <div className="font-semibold text-slate-200 flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400"></span>
                  <span>Governed Ingress &amp; Multi-Broker Consolidation Rules:</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
                  <li>Automated schema format detection without guessing or ISIN fabrication.</li>
                  <li>P04/P12 Security Master canonical identity resolution with fail-closed quarantine.</li>
                  <li>Multi-broker atomic merge consolidates duplicate securities by volume-weighted buy price.</li>
                  <li>Exact 100.0000% weight sum invariance across the complete combined portfolio vector.</li>
                  <li>Full FIPS 180-4 SHA-256 cryptographic provenance digest attached on commit.</li>
                </ul>
              </div>
            </div>
          )}

          {/* PROCESSING State */}
          {(viewModel.state === 'PROCESSING' || isProcessingFile) && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
              <div className="text-lg font-semibold text-white">Ingesting Broker Holdings...</div>
              <p className="text-sm text-slate-400 max-w-md">
                Parsing records, resolving P04 security master identities, and normalizing weights to 100.0000%.
              </p>
            </div>
          )}

          {/* PREVIEW_READY / PARTIAL_REJECTIONS / READY_TO_SAVE States */}
          {(viewModel.state === 'PREVIEW_READY' ||
            viewModel.state === 'PARTIAL_REJECTIONS' ||
            viewModel.state === 'READY_TO_SAVE') && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Detected Broker</div>
                  <div className="text-base font-bold text-teal-400 mt-1">{viewModel.brokerName}</div>
                  <div className="text-xs text-slate-400 truncate mt-0.5" title={viewModel.fileName}>
                    {viewModel.fileName}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Market Value</div>
                  <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                    ₹{viewModel.totalMarketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{viewModel.acceptedHoldingsCount} valid holdings</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Normalized Weight Sum</div>
                  <div className="text-base font-bold text-teal-300 font-mono tabular-nums mt-1">
                    {viewModel.totalNormalizedWeight.toFixed(4)}%
                  </div>
                  <div className="text-xs text-emerald-400 mt-0.5">Exact 100.0000% Invariant</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Excluded Records</div>
                  <div
                    className={`text-base font-bold mt-1 ${
                      viewModel.rejectedRowsCount > 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {viewModel.rejectedRowsCount} records
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {viewModel.rejectedRowsCount > 0 ? 'Filtered / Quarantined' : '0 exclusions'}
                  </div>
                </div>
              </div>

              {/* Save Guard Checklist */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Persistence Pre-Condition Checks</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${viewModel.saveGuard.hasValidHoldings ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className={viewModel.saveGuard.hasValidHoldings ? 'text-slate-300' : 'text-slate-500'}>
                      Holdings Present ({viewModel.acceptedHoldingsCount})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${viewModel.saveGuard.isExact100Weight ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className={viewModel.saveGuard.isExact100Weight ? 'text-slate-300' : 'text-slate-500'}>
                      Weights Sum to 100.0000%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`h-2 w-2 rounded-full ${viewModel.saveGuard.allHoldingsHaveCompanyId ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className={viewModel.saveGuard.allHoldingsHaveCompanyId ? 'text-slate-300' : 'text-slate-500'}>
                      P04 Identity Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Accepted Holdings Preview Table with Bounded Scrolling & Sticky Header */}
              <div className="space-y-2">
                {viewModel.identityResolutionStatus === 'NON_PRODUCTION_OPERATOR_BYPASS_ACTIVE' && (
                  <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3.5 py-2 text-xs text-amber-200 flex items-center space-x-2">
                    <span className="text-sm">⚠️</span>
                    <span>
                      <strong>Non-Production Operator Mode (preview only):</strong> unresolved holdings are displayed for
                      explanation and cannot be persisted - saves containing them are refused under DP-2 Option 2F. Zero
                      fabricated company IDs.
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200">
                    Parsed Constituent Holdings ({viewModel.acceptedHoldingsCount})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Consolidated &amp; Normalized Ingress Preview
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400">#</th>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400">Symbol</th>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400">Company Name</th>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400">Company ID (P04)</th>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400 text-right">Quantity</th>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400 text-right">Avg Price (₹)</th>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400 text-right">Market Value (₹)</th>
                        <th className="px-3 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-slate-400 text-right">Weight (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {viewModel.acceptedHoldings.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold">
                            {h.identityStatus === 'UNRESOLVED' ? (
                              <span className="text-amber-400">{h.symbol}</span>
                            ) : (
                              <span className="text-teal-400">{h.symbol}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-300">{h.companyName}</td>
                          <td className="px-3 py-2 font-mono">
                            {h.identityStatus === 'UNRESOLVED' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700">
                                UNRESOLVED (Bypass)
                              </span>
                            ) : (
                              <span className="text-slate-400">{h.companyId}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-right text-slate-200">
                            {h.quantity.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2 font-mono text-right text-slate-200">
                            ₹{h.averageBuyPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-mono text-right text-white font-semibold">
                            ₹{h.marketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 font-mono text-right font-bold text-teal-300">
                            {h.weightPercentage.toFixed(4)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rejected / Excluded Rows (if any) with Bounded Scrolling */}
              {viewModel.rejectedRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-400">
                    Excluded / Rejected Records ({viewModel.rejectedRows.length})
                  </h4>
                  <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-xl border border-amber-900/50 bg-amber-950/20">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-amber-950/60 text-amber-300 border-b border-amber-900/50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 font-semibold text-[11px] uppercase tracking-wider text-amber-400">Record #</th>
                          <th className="px-3 py-2 font-semibold text-[11px] uppercase tracking-wider text-amber-400">Raw Identifier</th>
                          <th className="px-3 py-2 font-semibold text-[11px] uppercase tracking-wider text-amber-400">Rejection Reason</th>
                          <th className="px-3 py-2 font-semibold text-[11px] uppercase tracking-wider text-amber-400">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-900/30 text-slate-300">
                        {viewModel.rejectedRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-amber-950/40 transition-colors">
                            <td className="px-3 py-2 font-mono text-amber-400">{r.row ?? idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-slate-300">{r.identifier || 'N/A'}</td>
                            <td className="px-3 py-2 text-rose-300 font-medium">{r.reason}</td>
                            <td className="px-3 py-2 text-slate-400">{r.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REJECTED / BLOCKED States */}
          {(viewModel.state === 'REJECTED' || viewModel.state === 'BLOCKED') && (
            <div className="rounded-xl border border-rose-900/70 bg-rose-950/30 p-6 space-y-4 text-center">
              {viewModel.portRefusal && (
                <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 text-left text-xs text-amber-100 space-y-2">
                  <div className="font-semibold text-amber-200">
                    Persistence refused - {viewModel.portRefusal.code}
                  </div>
                  <p>{viewModel.portRefusal.message}</p>
                  {viewModel.portRefusal.refusedHoldings.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                      {viewModel.portRefusal.refusedHoldings.map((h, idx) => (
                        <li key={idx}>
                          <span className="font-mono">{h.symbol}</span>: {h.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-900/50 text-rose-400 text-2xl font-bold border border-rose-700">
                ✗
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-200">
                  {viewModel.state === 'BLOCKED' ? 'Broker Ingress Blocked' : 'Broker Ingress Rejected'}
                </h3>
                <p className="text-xs text-rose-300/80 mt-1">
                  Ingress failed closed in accordance with institutional data quality governance.
                </p>
              </div>

              {viewModel.errors.length > 0 && (
                <div className="rounded-lg border border-rose-900/50 bg-slate-950/80 p-4 text-left text-xs font-mono text-rose-300 space-y-1">
                  <div className="font-semibold text-rose-400">Error Diagnostics:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {viewModel.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewModel.state === 'BLOCKED' && (
                <p className="text-xs text-amber-400">
                  Binary XLSX exports are deferred under milestone BI-06. Please export holdings as CSV from your broker
                  portal.
                </p>
              )}
            </div>
          )}

          {/* SAVE_SUCCESS State — receipt-driven, no preview fallbacks */}
          {viewModel.state === 'SAVE_SUCCESS' && (
            <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-8 space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900/50 text-emerald-300 text-3xl font-bold border border-emerald-500 shadow-sm">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-200">
                  {viewModel.durable ? 'Holdings Committed Durably' : 'Holdings Saved (Session-Scoped)'}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  {viewModel.commitReceipt?.disposition === 'ALREADY_IMPORTED_NO_OP'
                    ? 'This broker file was already imported. State was preserved without duplication.'
                    : 'The save was acknowledged by the store port.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 text-left text-xs space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium">Commit Outcome:</span>
                  <span className="text-white font-mono text-[11px]">
                    {viewModel.commitReceipt?.disposition ?? 'UNREPORTED'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium">Revision:</span>
                  <span className="text-white font-mono text-[11px]">
                    {viewModel.commitReceipt ? String(viewModel.commitReceipt.revision) : 'UNREPORTED'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium">Persistence Mode:</span>
                  <span
                    className={`font-semibold px-2.5 py-1 rounded border ${
                      viewModel.durable
                        ? 'text-emerald-400 bg-emerald-950/80 border-emerald-700'
                        : 'text-amber-300 bg-amber-950/60 border-amber-700'
                    }`}
                  >
                    {viewModel.durable ? 'COMMITTED (Durable)' : 'SAVED (SESSION ONLY - NOT DURABLE)'}
                  </span>
                </div>
                {!viewModel.durable && (
                  <p className="text-[11px] text-amber-300/80">
                    Durability is taken from the commit receipt, not from a store capability declaration. No durable
                    commit is available in this build; this state is held in memory and is lost on reload or restart.
                  </p>
                )}
                {/* Detail rows render ONLY from an authoritative store result. A
                    preview total, preview count or preview digest is never
                    substituted into a committed panel. */}
                {viewModel.saveResult && (
                  <>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-medium">Holdings Saved:</span>
                      <span className="text-white font-mono text-sm font-bold">
                        {viewModel.saveResult.holdingsSavedCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-medium">Total Portfolio Value:</span>
                      <span className="text-white font-mono text-sm font-bold">
                        ₹
                        {viewModel.saveResult.totalMarketValue.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="font-medium">Total Allocation Weight:</span>
                      <span className="text-teal-300 font-mono text-sm font-bold">
                        {viewModel.saveResult.weightSumPercentage.toFixed(4)}%
                      </span>
                    </div>
                    {viewModel.saveResult.provenanceDigest && (
                      <div className="flex flex-col text-slate-400 pt-2 border-t border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Cryptographic Provenance Digest (FIPS 180-4 SHA-256):
                        </span>
                        <span className="font-mono text-[11px] text-teal-400 break-all select-all bg-slate-900 p-2 rounded border border-slate-800">
                          {viewModel.saveResult.provenanceDigest}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {!viewModel.saveResult && (
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    This save path reported only the minimal commit receipt. No portfolio totals, holding counts or
                    provenance digest are claimed, because none were authoritatively returned.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* OUTCOME_UNKNOWN State — distinct from success and from refusal */}
          {viewModel.state === 'OUTCOME_UNKNOWN' && (
            <div className="rounded-xl border border-amber-800/70 bg-amber-950/30 p-6 space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-900/50 text-amber-300 text-2xl font-bold border border-amber-700">
                ?
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-200">Import Outcome Unknown</h3>
                <p className="text-xs text-amber-200/90 mt-1">
                  The commit result could not be established. This is not a refusal and not a success: no rollback is
                  claimed, no durable commit is claimed, and no automatic retry was attempted.
                </p>
              </div>
              {viewModel.outcomeUnknown && (
                <div className="rounded-lg border border-amber-800/60 bg-slate-950/80 p-4 text-left text-xs text-amber-100 space-y-1">
                  <div className="font-semibold text-amber-200">{viewModel.outcomeUnknown.message}</div>
                  <p>
                    Portfolio <span className="font-mono">{viewModel.outcomeUnknown.portfolioId}</span> must be
                    reconciled by an authorised read before any user-initiated retry.
                  </p>
                </div>
              )}
              {viewModel.errors.length > 0 && (
                <div className="rounded-lg border border-amber-900/50 bg-slate-950/80 p-4 text-left text-xs font-mono text-amber-300 space-y-1">
                  {viewModel.errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/80">
          <div>
            {/* Select another file when previewing or rejected */}
            {viewModel.state !== 'IDLE' && viewModel.state !== 'SAVE_SUCCESS' && (
              <button
                type="button"
                id="ui15-btn-select-another"
                onClick={resetToIdle}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition-colors shadow-sm"
              >
                Select Another File
              </button>
            )}

            {/* Quick re-import button directly from SAVE_SUCCESS screen */}
            {viewModel.state === 'SAVE_SUCCESS' && (
              <button
                type="button"
                id="ui15-btn-import-another"
                onClick={resetToIdle}
                className="inline-flex items-center space-x-1.5 rounded-lg border border-teal-700 bg-teal-950/80 px-4 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-900 hover:text-white cursor-pointer transition-colors shadow-sm pointer-events-auto"
              >
                <span>+ Import Another Statement</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              id="ui15-btn-modal-close"
              onClick={handleClose}
              className={`rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm ${
                viewModel.state === 'SAVE_SUCCESS'
                  ? 'bg-teal-600 text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400'
                  : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {viewModel.state === 'SAVE_SUCCESS' ? 'Done & Close' : 'Cancel'}
            </button>

            {viewModel.state !== 'SAVE_SUCCESS' && (
              <button
                type="button"
                id="ui15-btn-confirm-save"
                disabled={!viewModel.portSaveGuard.saveable || isSaving}
                onClick={handleConfirmSave}
                title={
                  viewModel.portSaveGuard.disabledReason ||
                  'Save the holding vector through the portfolio store port'
                }
                className={`inline-flex items-center space-x-2 rounded-lg px-5 py-2 text-xs font-bold text-white shadow transition-all ${
                  viewModel.portSaveGuard.saveable && !isSaving
                    ? 'bg-teal-600 hover:bg-teal-500 cursor-pointer focus:ring-2 focus:ring-teal-400 pointer-events-auto'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {isSaving ? (
                  <span className="inline-flex items-center space-x-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span>Confirm &amp; Save Holdings</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
