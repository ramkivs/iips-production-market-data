/**
 * Institutional Investment Platform System (IIPS)
 * CAP-02 public package boundary — the IPD-owned broker-import surface.
 *
 * WHAT THIS FILE IS
 *   The single public entry point behind the `./portfolio-ui` package subpath. It re-exports the
 *   IPD-authored broker-import component set and the identity/contract symbols that component set
 *   actually imports, so that a separately governed host (IRR) can mount the component and supply a
 *   `PortfolioStorePort` implementation without copying, relocating or re-implementing any part of
 *   it (CAP-02 U0 decision, item 4: "reuse by governed package export, never by copy").
 *
 * WHAT THIS FILE IS NOT
 *   - It defines NO behaviour, NO store, NO identity resolution, NO parsing/mapping and NO digest of
 *     its own. Every symbol below is re-exported from its authoritative module untouched, so the
 *     exported object and the in-repo object are the same object (test `T-PKG-2`).
 *   - It is NOT a second product host and NOT an application shell. The IPD `frontend/src/app/**`
 *     shell and `PortfolioWorkspace` are deliberately NOT exported (CAP-02 U0 decision, item 2).
 *   - It carries NO owner, tenant, principal, credential or authorization-scope parameter, and it
 *     exposes nothing from `src/ipc/**` or `src/persistence/**`. Durable persistence, SQLite, binding
 *     resolution, the IPC wire contract and the write gate stay IPD-internal and server-side, out of
 *     every browser-facing import graph (verified by `tests/portfolio_ui_package.test.ts`).
 *   - It grants no write and claims no durability. The only shipped port implementation declares
 *     `SESSION_ONLY` / `durable: false`, and `describePersistenceStatus` cannot render a durable
 *     commit for a non-durable port.
 *
 * DELIBERATELY NOT EXPORTED (and why)
 *   `src/ipc/**`, `src/persistence/**`          privileged Node-only internals; no browser path may
 *                                               reach the IPC, the store, migrations or the gate.
 *   `src/identity/mapping_store.ts`             IPD resolves raw observations to canonical identity
 *                                               server-side. A consumer must not perform its own
 *                                               resolution (CAP-02: identity direction is IPD -> caller).
 *   `src/contracts/provenance.ts`               digest/lineage computation stays IPD-owned; the host
 *                                               propagates IPD's provenance, it never recomputes it.
 *   `frontend/src/features/portfolio/PortfolioWorkspace.tsx`, `frontend/src/app/**`
 *                                               application-surface composition, not the import
 *                                               component set.
 *   `src/identity/d05_broad_universe_data.ts`   corpus data; reached only through the governed master
 *                                               factory exported below.
 *
 * Authority: `IIPS-V3-CAP02-IPD-EXPORT-IMPLEMENTATION-ACT-2026-10-23-01`
 * (IPD `evidence/cross-repository/IIPS_V3_CAP02_INCREMENT_A_PACKAGE_EXPORT_IMPLEMENTATION_ACT_2026-10-23.md`),
 * rendered under CAP-02 U0 item 4 and the standing Program Authority grant. Exact file set and
 * exclusions are fixed there; this file adds export plumbing only.
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED.
 */

/* ---------------------------------------------------------------- *
 * The broker-import UI component (the mountable surface)
 * ---------------------------------------------------------------- */

export { BrokerImportModal, DEFAULT_ALLOW_NON_PRODUCTION_BYPASS } from '../../frontend/src/features/portfolio/BrokerImportModal.js';
export type { BrokerImportModalProps } from '../../frontend/src/features/portfolio/BrokerImportModal.js';

/* ---------------------------------------------------------------- *
 * The port seam the host implements (session-only by default)
 * ---------------------------------------------------------------- */

export {
  CALLER_SUPPLIED_IDENTITY_KEYS,
  SessionPortfolioStorePort,
  describePersistenceStatus,
  evaluatePortSaveGuard,
  findCallerSuppliedIdentityKeys,
  getDefaultPortfolioStorePort,
  resetDefaultPortfolioStorePort,
} from '../../frontend/src/features/portfolio/portfolioStorePort.js';
export type {
  PersistenceState,
  PersistenceStatusDescriptor,
  PortfolioDurability,
  PortfolioPortRefusalCode,
  PortfolioPortRefusedHolding,
  PortfolioPortSaveGuard,
  PortfolioPortSaveOutcome,
  PortfolioPortSaveRefusal,
  PortfolioPortSaveRequest,
  PortfolioPortSaveSuccess,
  PortfolioStorePort,
} from '../../frontend/src/features/portfolio/portfolioStorePort.js';

/* ---------------------------------------------------------------- *
 * Portfolio domain the component requires (ownership stays IPD)
 * ---------------------------------------------------------------- */

export {
  PortfolioStore,
  getDefaultPortfolioStore,
  resetDefaultPortfolioStore,
} from '../../frontend/src/features/portfolio/portfolio-store.js';
export type {
  BrokerContributionRecord,
  PortfolioAnalyticsSummary,
  PortfolioRecord,
  PortfolioSaveOptions,
  PortfolioSaveResult,
} from '../../frontend/src/features/portfolio/portfolio-store.js';

/* ---------------------------------------------------------------- *
 * The import pipeline: detection, parsing, mapping, ingress, view model
 * ---------------------------------------------------------------- */

export { BrokerImportIngressOrchestrator } from '../../frontend/src/features/portfolio/import/broker-import-ingress.js';
export { mapBrokerOutputToUserHoldings } from '../../frontend/src/features/portfolio/import/broker-holdings-mapper.js';
export { BrokerFormatDetector } from '../../frontend/src/features/portfolio/import/broker-format-detector.js';
export {
  DhanHoldingsAdapter,
  GrowwHoldingsAdapter,
  ZerodhaHoldingsAdapter,
} from '../../frontend/src/features/portfolio/import/adapters/index.js';
export { PortfolioBrokerImportController } from '../../frontend/src/features/portfolio/import/ui-broker-import-view-model.js';
export type {
  AcceptedHoldingPreviewItem,
  BrokerImportSaveGuard,
  BrokerImportUIState,
  PortfolioBrokerImportViewModel,
  RejectedRowPreviewItem,
} from '../../frontend/src/features/portfolio/import/ui-broker-import-view-model.js';

/* ---------------------------------------------------------------- *
 * Broker-observation and mapping contracts (the shared vocabulary)
 * ---------------------------------------------------------------- */

export type {
  BrokerAdapterParseOptions,
  BrokerDetectionResult,
  BrokerFileFormat,
  BrokerIngressRejection,
  BrokerIngressRejectionReason,
  BrokerIngressRequest,
  BrokerIngressResult,
  BrokerMappingOptions,
  BrokerMappingResult,
  DhanFormatVariant,
  FinappBrokerAdapter,
  FinappBrokerParseResult,
  FinappBrokerType,
  FinappHolding,
  IngressDisposition,
  IngressStage,
  UserHoldingInput,
} from '../../frontend/src/features/portfolio/import/types.js';

/* ---------------------------------------------------------------- *
 * Identity authority (canonical resolution stays IPD-owned)
 * ---------------------------------------------------------------- */

export { SecurityMaster } from '../../src/identity/security_master.js';
export type {
  ExchangeListing,
  GovernedSourceRevision,
  SecurityMasterEntity,
} from '../../src/identity/security_master.js';
export { getGovernedBroadSecurityMaster } from '../../src/identity/governed_fixture_master.js';
export { IdentityAmbiguityError } from '../../src/identity/quarantine.js';
export type { IdentityQuarantineRecord } from '../../src/identity/quarantine.js';
