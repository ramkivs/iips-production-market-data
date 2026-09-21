/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-H / Package D114: Module Index — GOVERNED PORT (D-PIT-WIRE-01 §1.6)
 *
 * Ported under D-PIT-WIRE-01 authorization:
 *   • frozen parsers/adapter/contracts from origin/d114-windows-evidence @ 1d57d0b;
 *   • latest governed handoff/runner/reconciler + frozen suite from
 *     origin/d114-legacy-windows-evidence @ 4a95cd9 (handoff reconciliation 9a6f4c1).
 * Governing scope: docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md @ 79d05d7.
 *
 * TREE-LAYOUT RECONCILIATION (recorded, disclosed):
 *   The D114 lineage tree exposes these modules through a ROOT-level src/index.ts that
 *   re-exports the ENTIRE wave4 surface (contracts, security, identity, spi, …, e2e, oq).
 *   This port carries ONLY the dependency-closed D114 set (src/d114 + the contracts and
 *   normalization modules they import). The upstream test suite imports the D114 symbols
 *   from '../src/index.js'; this index preserves that import surface exactly while
 *   exporting ONLY the D114 package. The 1d57d0b parser/adapter baseline is preserved except for
 *   the explicitly authorized D-PIT-WIRE-01 ISIN/SERIES source-identity correction; acquisition,
 *   archive, OHLCV, volume, time, and era behavior remain unchanged.
 *
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV.
 * NON_PRODUCTION_HOLD — OI-HIST-01 OPEN, G-004 OPEN, production eligibility NOT AUTHORIZED.
 */

export * from './d114/index.js';
