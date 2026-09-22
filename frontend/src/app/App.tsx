/**
 * Institutional Investment Platform System (IIPS)
 * Root Institutional Application Shell (App.tsx)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import React, { useState, useMemo } from 'react';
import { PortfolioWorkspace } from '../features/portfolio/PortfolioWorkspace.js';
import { PortfolioStore, getDefaultPortfolioStore } from '../features/portfolio/index.js';
import { SecurityMaster, getGovernedOfflineSecurityMaster } from '../../../src/identity/index.js';

export interface AppProps {
  portfolioStore?: PortfolioStore;
  securityMaster?: SecurityMaster;
}

export const App: React.FC<AppProps> = ({
  portfolioStore: initialPortfolioStore,
  securityMaster: initialSecurityMaster,
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'executive' | 'replay' | 'sec_master'>('portfolio');

  // Application-level singletons for session lifetime continuity (Tier-B) and governed offline master data
  const appPortfolioStore = useMemo(() => initialPortfolioStore || getDefaultPortfolioStore(), [initialPortfolioStore]);
  const appSecurityMaster = useMemo(() => initialSecurityMaster || getGovernedOfflineSecurityMaster(), [initialSecurityMaster]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Institutional Global App Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur-md sticky top-0 z-40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-black text-white text-sm tracking-wider shadow">
                IIPS
              </span>
              <span className="font-bold tracking-tight text-white text-base">
                Institutional Investment Platform System
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-2 border-l border-slate-700 pl-4 text-xs text-slate-400">
              <span className="inline-flex items-center space-x-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-300 font-semibold">Governance: Active</span>
              </span>
              <span>•</span>
              <span className="text-slate-400">P04/P12 Lineage Enforced</span>
              <span>•</span>
              <span className="text-amber-400 font-mono">NON_PRODUCTION / OFFLINE_FIXTURE</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav aria-label="Primary Navigation" className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              id="tab-btn-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Portfolio Workspace
            </button>
            <button
              type="button"
              id="tab-btn-executive"
              onClick={() => setActiveTab('executive')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'executive'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Executive Summary
            </button>
            <button
              type="button"
              id="tab-btn-replay"
              onClick={() => setActiveTab('replay')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'replay'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Replay Studio
            </button>
            <button
              type="button"
              id="tab-btn-sec-master"
              onClick={() => setActiveTab('sec_master')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'sec_master'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Security Master
            </button>
          </nav>
        </div>
      </header>

      {/* Surface Body */}
      <main className="flex-1">
        {activeTab === 'portfolio' && (
          <PortfolioWorkspace
            portfolioStore={appPortfolioStore}
            securityMaster={appSecurityMaster}
          />
        )}
        {activeTab === 'executive' && (
          <div className="p-8 text-center text-slate-400">
            <h2 className="text-lg font-bold text-slate-200">Executive Summary Surface (UI02)</h2>
            <p className="text-xs text-slate-400 mt-2">Surface available via IIPS UI View-Model Registry</p>
          </div>
        )}
        {activeTab === 'replay' && (
          <div className="p-8 text-center text-slate-400">
            <h2 className="text-lg font-bold text-slate-200">Replay Studio Surface (UI01)</h2>
            <p className="text-xs text-slate-400 mt-2">Surface available via IIPS UI View-Model Registry</p>
          </div>
        )}
        {activeTab === 'sec_master' && (
          <div className="p-8 text-center text-slate-400">
            <h2 className="text-lg font-bold text-slate-200">Security Master Modal Surface (UI08)</h2>
            <p className="text-xs text-slate-400 mt-2">Surface available via IIPS UI View-Model Registry</p>
          </div>
        )}
      </main>

      {/* Global Status Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 px-6 py-2.5 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          <span>IIPS Production Market Data &amp; Intelligence Pipeline • Program Baseline v1.0.0</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span>Live Providers: 0 (INACTIVE)</span>
          <span>•</span>
          <span>Sockets: 0</span>
          <span>•</span>
          <span className="text-teal-400 font-bold">BI-07 Host Verified</span>
        </div>
      </footer>
    </div>
  );
};
