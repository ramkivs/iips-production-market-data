/**
 * Institutional Investment Platform System (IIPS)
 * Portfolio Workspace React Component (BI-07 React DOM Host Integration)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  PortfolioStore,
  PortfolioRecord,
  PortfolioAnalyticsSummary,
  PortfolioSaveResult,
} from './index.js';
import { BrokerImportModal } from './BrokerImportModal.js';
import { SecurityMaster } from '../../../../src/identity/security_master.js';

export interface PortfolioWorkspaceProps {
  portfolioStore?: PortfolioStore;
  securityMaster?: SecurityMaster;
  portfolioId?: string;
}

export const PortfolioWorkspace: React.FC<PortfolioWorkspaceProps> = ({
  portfolioStore: initialPortfolioStore,
  securityMaster,
  portfolioId = 'DEFAULT_PORTFOLIO',
}) => {
  // Store instance (singleton state)
  const store = useMemo(() => initialPortfolioStore || new PortfolioStore(), [initialPortfolioStore]);

  // Reactive state for portfolio data
  const [portfolio, setPortfolio] = useState<PortfolioRecord>(() => {
    return (
      store.getPortfolio(portfolioId) || {
        portfolioId,
        portfolioName: 'Institutional Flagship Portfolio',
        holdings: [],
        totalMarketValue: 0,
        totalHoldingsCount: 0,
        weightSumPercentage: 0.0,
        lastUpdated: new Date().toISOString(),
        provenanceDigest: '',
        isSaved: false,
      }
    );
  });

  const [analytics, setAnalytics] = useState<PortfolioAnalyticsSummary>(() => {
    return store.getAnalytics(portfolioId);
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Authoritative refresh handler reading current state from PortfolioStore
  const refreshPortfolio = useCallback(() => {
    const updated = store.getPortfolio(portfolioId);
    if (updated) {
      setPortfolio({ ...updated, holdings: [...updated.holdings] });
    }
    setAnalytics(store.getAnalytics(portfolioId));
  }, [store, portfolioId]);

  // Handle successful save from modal: updates workspace and displays toast
  const handleSaveSuccess = useCallback(
    (result: PortfolioSaveResult) => {
      refreshPortfolio();
      setSuccessToast(
        `Successfully imported ${result.holdingsSavedCount} holdings into ${result.portfolio.portfolioName}.`
      );
      setTimeout(() => {
        setSuccessToast(null);
      }, 5000);
    },
    [refreshPortfolio]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex items-center space-x-3 rounded-lg border border-emerald-600 bg-emerald-950 px-4 py-3 text-sm text-emerald-200 shadow-xl"
        >
          <span className="text-emerald-400 font-bold text-base">✓</span>
          <span>{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="ml-2 text-emerald-400 hover:text-white cursor-pointer"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Surface Header & Navigation */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Portfolio Workspace</h1>
            <span className="inline-flex items-center rounded-full bg-teal-950 px-2.5 py-0.5 text-xs font-semibold text-teal-400 border border-teal-800">
              P04 / BI-07 Governed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Institutional Flagship Portfolio • Offline Broker Holdings Ingress &amp; Atomic Persistence
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            id="btn-refresh-portfolio"
            onClick={refreshPortfolio}
            aria-label="Refresh portfolio data"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer transition-colors"
          >
            Refresh
          </button>

          <button
            type="button"
            id="btn-open-import"
            onClick={() => setIsImportModalOpen(true)}
            aria-label="Import broker holdings"
            className="inline-flex items-center space-x-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer transition-colors"
          >
            <span>+ Import Holdings</span>
          </button>
        </div>
      </header>

      {/* KPI Overview Cards */}
      <section aria-label="Portfolio Summary Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Total Portfolio Value</div>
          <div className="text-2xl font-bold text-white mt-1">
            ₹{portfolio.totalMarketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {portfolio.totalHoldingsCount} constituent{portfolio.totalHoldingsCount !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Weight Allocation Sum</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">
            {portfolio.weightSumPercentage.toFixed(4)}%
          </div>
          <div className="text-xs text-emerald-400 mt-1">
            {portfolio.totalHoldingsCount > 0 ? 'Exact 100.0000% Invariant' : 'Awaiting Ingress'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Persistence Status</div>
          <div className="text-base font-bold mt-1.5 flex items-center space-x-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                portfolio.isSaved ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
            <span className={portfolio.isSaved ? 'text-emerald-300' : 'text-amber-300'}>
              {portfolio.isSaved ? 'COMMITTED (Atomic)' : 'EMPTY / INITIAL'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {portfolio.isSaved ? `Updated: ${portfolio.lastUpdated.slice(0, 19).replace('T', ' ')}` : 'No writes performed'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Provenance Lineage Digest</div>
          <div className="text-xs font-mono text-teal-400 mt-2 truncate" title={portfolio.provenanceDigest || 'None'}>
            {portfolio.provenanceDigest ? `${portfolio.provenanceDigest.slice(0, 20)}...` : 'Unassigned'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">SHA-256 Canonical Checksum</div>
        </div>
      </section>

      {/* Main Content Area */}
      {portfolio.holdings.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 py-20 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-teal-400 text-3xl mb-4">
            📊
          </div>
          <h2 className="text-lg font-bold text-white mb-1">No Portfolio Holdings Loaded</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Import broker holding export CSV (Zerodha Kite, Dhan, Groww) to populate this institutional portfolio with
            P04-resolved canonical entities and 100.0000% normalized weights.
          </p>
          <button
            type="button"
            id="btn-empty-open-import"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center space-x-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
          >
            <span>+ Import Broker Holdings</span>
          </button>
        </div>
      ) : (
        /* Populated Portfolio View */
        <div className="space-y-6">
          {/* Top Holdings Analytics Preview */}
          {analytics.topHoldings.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-200">Top Constituent Allocations (Analytics Summary)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {analytics.topHoldings.map((top, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-teal-400 text-sm">{top.symbol}</span>
                      <span className="text-xs font-semibold text-teal-300">
                        {top.weightPercentage.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{top.companyId}</div>
                    <div className="text-xs text-white font-mono">
                      ₹{top.marketValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Holdings Vector Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Constituent Holdings Vector</h2>
                <p className="text-xs text-slate-400">
                  Authoritative holdings vector persisted in governed PortfolioStore
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Lineage: {portfolio.provenanceDigest.slice(0, 16)}...
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Constituent Holdings Vector for Flagship Portfolio</caption>
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Symbol</th>
                    <th className="px-4 py-3 font-medium">Company ID (P04)</th>
                    <th className="px-4 py-3 font-medium text-right">Quantity</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Buy Price</th>
                    <th className="px-4 py-3 font-medium text-right">Market Price</th>
                    <th className="px-4 py-3 font-medium text-right">Market Value (₹)</th>
                    <th className="px-4 py-3 font-medium text-right">Weight (%)</th>
                    <th className="px-4 py-3 font-medium">Lineage Digest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
                  {portfolio.holdings.map((holding, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-teal-400">{holding.symbol}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{holding.companyId}</td>
                      <td className="px-4 py-3 font-mono text-right text-slate-200">
                        {holding.quantity.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-slate-200">
                        ₹{holding.averageBuyPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-slate-200">
                        ₹{holding.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-white font-semibold">
                        ₹{holding.marketValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-mono text-right font-bold text-teal-300">
                        {holding.weightPercentage.toFixed(4)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[10px]" title={holding.lineageDigest}>
                        {holding.lineageDigest.slice(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Governed Broker Import Modal */}
      <BrokerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
        portfolioStore={store}
        securityMaster={securityMaster}
      />
    </div>
  );
};
