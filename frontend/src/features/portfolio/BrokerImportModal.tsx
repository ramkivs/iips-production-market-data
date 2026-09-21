/**
 * Institutional Investment Platform System (IIPS)
 * Broker Import React Modal Component (BI-07 React DOM Host Integration)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  PortfolioStore,
  PortfolioSaveResult,
  PortfolioBrokerImportController,
  PortfolioBrokerImportViewModel,
} from './index.js';
import { SecurityMaster } from '../../../../src/identity/security_master.js';

export interface BrokerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (result: PortfolioSaveResult) => void;
  portfolioStore: PortfolioStore;
  securityMaster?: SecurityMaster;
}

export const BrokerImportModal: React.FC<BrokerImportModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  portfolioStore,
  securityMaster,
}) => {
  // Initialize governed controller
  const controller = useMemo(() => new PortfolioBrokerImportController(securityMaster), [securityMaster]);

  // View-model binding state
  const [viewModel, setViewModel] = useState<PortfolioBrokerImportViewModel>(() =>
    controller.buildViewModel(typeof window !== 'undefined' ? window.innerWidth : 1280, securityMaster)
  );
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

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
      handleFile(files[0]);
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

  // Confirm and save handler
  const handleConfirmSave = useCallback(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vm = controller.confirmAndSave({
      portfolioStore,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth,
    });
    setViewModel(vm);

    if (vm.state === 'SAVE_SUCCESS' && vm.saveResult?.success) {
      onSaveSuccess(vm.saveResult);
    }
  }, [controller, portfolioStore, onSaveSuccess]);

  // Reset handler
  const handleReset = useCallback(() => {
    controller.reset();
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    setViewModel(controller.buildViewModel(viewportWidth, securityMaster));
  }, [controller, securityMaster]);

  if (!isOpen) return null;

  return (
    <div
      className="iips-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ui15-modal-title"
      aria-describedby="ui15-modal-description"
      aria-live={viewModel.accessibility.ariaLive}
    >
      <div
        className={`iips-modal-container relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl ${viewModel.responsiveLayout.containerClass}`}
      >
        {/* Live Region for Screen Readers */}
        <div aria-live={viewModel.accessibility.ariaLive} className="sr-only">
          {viewModel.accessibility.liveRegionText}
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-900/50 text-teal-400 font-bold border border-teal-700">
              UI15
            </div>
            <div>
              <h2 id="ui15-modal-title" className="text-xl font-bold tracking-tight text-white">
                Import Broker Holdings
              </h2>
              <p id="ui15-modal-description" className="text-xs text-slate-400">
                Institutional Broker Ingress & Atomic Portfolio Persistence Boundary (BI-07)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* WCAG Dual-Coded Quality Badge */}
            <span
              className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold"
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
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                  isDragging
                    ? 'border-teal-500 bg-teal-950/20'
                    : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'
                }`}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-teal-400 text-3xl">
                  📁
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Select Broker Holdings Export File</h3>
                <p className="text-sm text-slate-400 max-w-md mb-6">
                  Drag and drop your broker holding statement CSV here, or click to browse. Supported formats: Zerodha
                  Kite, Dhan, Groww.
                </p>

                <label
                  htmlFor="ui15-file-input"
                  id="ui15-btn-file-select"
                  className="cursor-pointer inline-flex items-center space-x-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  tabIndex={0}
                >
                  <span>Select Broker CSV</span>
                  <input
                    id="ui15-file-input"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileInputChange}
                  />
                </label>

                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-1 border border-slate-700">✓ Zerodha Kite (.csv)</span>
                  <span className="rounded bg-slate-800 px-2 py-1 border border-slate-700">✓ Dhan Holdings (.csv)</span>
                  <span className="rounded bg-slate-800 px-2 py-1 border border-slate-700">✓ Groww Stocks (.csv)</span>
                  <span className="rounded bg-slate-900 px-2 py-1 border border-amber-800 text-amber-400">
                    ⚠ XLSX Blocked (BI-06)
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-300">Governed Ingress Pipeline Rules:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Automated schema format detection without guessing or fabrication.</li>
                  <li>Security Master (P04) canonical identity resolution with strict fail-closed enforcement.</li>
                  <li>Volume-weighted average buy cost calculation across duplicate security lots.</li>
                  <li>Exact 100.0000% weight sum invariance across all accepted portfolio constituents.</li>
                  <li>Cryptographic lineage digest computed over ingress and persistence payload.</li>
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
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-xs font-medium text-slate-400">Detected Broker</div>
                  <div className="text-base font-bold text-teal-400">{viewModel.brokerName}</div>
                  <div className="text-xs text-slate-400 truncate" title={viewModel.fileName}>
                    {viewModel.fileName}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-xs font-medium text-slate-400">Total Market Value</div>
                  <div className="text-base font-bold text-white">
                    ₹{viewModel.totalMarketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400">{viewModel.acceptedHoldingsCount} valid holdings</div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-xs font-medium text-slate-400">Normalized Weight Sum</div>
                  <div className="text-base font-bold text-teal-300">
                    {viewModel.totalNormalizedWeight.toFixed(4)}%
                  </div>
                  <div className="text-xs text-emerald-400">Exact 100.0000% Invariant</div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-xs font-medium text-slate-400">Excluded Records</div>
                  <div
                    className={`text-base font-bold ${
                      viewModel.rejectedRowsCount > 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {viewModel.rejectedRowsCount} rows
                  </div>
                  <div className="text-xs text-slate-400">
                    {viewModel.rejectedRowsCount > 0 ? 'Filtered per governance' : 'All records valid'}
                  </div>
                </div>
              </div>

              {/* Save Guard Status Banner */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Save Guard Verification Checklist (BI-07):</span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      viewModel.saveGuard.isSaveEnabled
                        ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                        : 'bg-amber-950 border border-amber-700 text-amber-300'
                    }`}
                  >
                    {viewModel.saveGuard.isSaveEnabled ? 'PASSED — READY TO SAVE' : 'GUARD BLOCKED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className={viewModel.saveGuard.isReadyDisposition ? 'text-emerald-400' : 'text-rose-400'}>
                      {viewModel.saveGuard.isReadyDisposition ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-300">Ingress Ready</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={viewModel.saveGuard.hasValidHoldings ? 'text-emerald-400' : 'text-rose-400'}>
                      {viewModel.saveGuard.hasValidHoldings ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-300">&gt; 0 Valid Holdings</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={viewModel.saveGuard.isExact100Weight ? 'text-emerald-400' : 'text-rose-400'}>
                      {viewModel.saveGuard.isExact100Weight ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-300">100.0000% Weight</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={viewModel.saveGuard.allHoldingsHaveCompanyId ? 'text-emerald-400' : 'text-rose-400'}>
                      {viewModel.saveGuard.allHoldingsHaveCompanyId ? '✓' : '✗'}
                    </span>
                    <span className="text-slate-300">P04 Identities</span>
                  </div>
                </div>

                {viewModel.saveGuard.disabledReason && (
                  <div className="text-xs text-amber-400 pt-1 font-mono">
                    ⚠ {viewModel.saveGuard.disabledReason}
                  </div>
                )}
              </div>

              {/* Warnings Banner */}
              {viewModel.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300 space-y-1">
                  <div className="font-semibold">Ingress Warnings:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {viewModel.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Accepted Holdings Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200">
                    Accepted Holdings ({viewModel.acceptedHoldings.length})
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    Digest: {viewModel.lineageDigest.slice(0, 16)}...
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">{viewModel.accessibility.tableCaption}</caption>
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2 font-medium">Symbol</th>
                        <th className="px-3 py-2 font-medium">Company Name</th>
                        <th className="px-3 py-2 font-medium">Company ID (P04)</th>
                        <th className="px-3 py-2 font-medium text-right">Quantity</th>
                        <th className="px-3 py-2 font-medium text-right">Avg Buy Price</th>
                        <th className="px-3 py-2 font-medium text-right">Market Value (₹)</th>
                        <th className="px-3 py-2 font-medium text-right">Weight (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                      {viewModel.acceptedHoldings.map((h, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-mono font-bold text-teal-400">{h.symbol}</td>
                          <td className="px-3 py-2 text-slate-300">{h.companyName}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">{h.companyId}</td>
                          <td className="px-3 py-2 font-mono text-right text-slate-200">
                            {h.quantity.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2 font-mono text-right text-slate-200">
                            ₹{h.averageBuyPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-mono text-right text-white">
                            ₹{h.marketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 font-mono text-right font-semibold text-teal-300">
                            {h.weightPercentage.toFixed(4)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rejected / Excluded Rows (if any) */}
              {viewModel.rejectedRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-400">
                    Excluded / Rejected Records ({viewModel.rejectedRows.length})
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-amber-900/50 bg-amber-950/20">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-amber-950/40 text-amber-300 border-b border-amber-900/50">
                        <tr>
                          <th className="px-3 py-2 font-medium">Record #</th>
                          <th className="px-3 py-2 font-medium">Raw Identifier</th>
                          <th className="px-3 py-2 font-medium">Rejection Reason</th>
                          <th className="px-3 py-2 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-900/30 text-slate-300">
                        {viewModel.rejectedRows.map((r, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono text-amber-400">{r.row ?? idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-slate-300">{r.identifier || 'N/A'}</td>
                            <td className="px-3 py-2 text-rose-300">{r.reason}</td>
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-900/50 text-rose-400 text-2xl font-bold border border-rose-700">
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
                <div className="rounded-lg border border-rose-900/50 bg-slate-950/60 p-4 text-left text-xs font-mono text-rose-300 space-y-1">
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

          {/* SAVE_SUCCESS State */}
          {viewModel.state === 'SAVE_SUCCESS' && (
            <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-8 space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/50 text-emerald-300 text-3xl font-bold border border-emerald-600">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-200">Holdings Successfully Persisted</h3>
                <p className="text-sm text-slate-300 mt-1">
                  {viewModel.acceptedHoldingsCount} holdings committed atomically to{' '}
                  <span className="font-semibold text-white">
                    {viewModel.saveResult?.portfolio.portfolioName || 'Institutional Flagship Portfolio'}
                  </span>
                  .
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Persistence Status:</span>
                  <span className="text-emerald-400 font-semibold">COMMITTED (Atomic Batch)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Market Value:</span>
                  <span className="text-white font-mono">
                    ₹{viewModel.totalMarketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Allocation Weight:</span>
                  <span className="text-teal-300 font-mono">{viewModel.totalNormalizedWeight.toFixed(4)}%</span>
                </div>
                <div className="flex flex-col text-slate-400 pt-1 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400">Cryptographic Provenance Digest (SHA-256):</span>
                  <span className="font-mono text-[11px] text-teal-400 break-all select-all">
                    {viewModel.saveResult?.provenanceDigest || viewModel.lineageDigest}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/40">
          <div>
            {viewModel.state !== 'IDLE' && viewModel.state !== 'SAVE_SUCCESS' && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Select Another File
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              {viewModel.state === 'SAVE_SUCCESS' ? 'Close' : 'Cancel'}
            </button>

            {viewModel.state !== 'SAVE_SUCCESS' && (
              <button
                type="button"
                id="ui15-btn-confirm-save"
                disabled={!viewModel.saveGuard.isSaveEnabled}
                onClick={handleConfirmSave}
                title={viewModel.saveGuard.disabledReason || 'Commit atomic holding vector to portfolio store'}
                className={`inline-flex items-center space-x-2 rounded-lg px-5 py-2 text-xs font-bold text-white shadow transition-all ${
                  viewModel.saveGuard.isSaveEnabled
                    ? 'bg-teal-600 hover:bg-teal-500 cursor-pointer focus:ring-2 focus:ring-teal-400'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <span>Confirm &amp; Save Holdings</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
