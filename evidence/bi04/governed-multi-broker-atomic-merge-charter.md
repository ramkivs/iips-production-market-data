# Governed Multi-Broker Atomic Merge & Portfolio Accumulation Charter

- **Specification Identifier**: `GOVERNED_MULTI_BROKER_ATOMIC_MERGE`
- **Governing Charters**: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-03-AUTH-2026-01 / BI-04-AUTH-2026-01 / BI-05-AUTH-2026-01 / BI-07-AUTH-2026-01
- **Effective Date**: 2026-09-21
- **Execution Mode**: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
- **Status**: AUTHORIZED_INSTITUTIONAL_CONTRACT

---

## 1. Executive Summary & Objective

The Institutional Flagship Portfolio (`DEFAULT_PORTFOLIO`) represents the consolidated holdings of an institution across multiple broker accounts (e.g. Zerodha Kite, Dhan, Groww).

Previous test implementations performed full batch replacement upon secondary broker import. This charter formally establishes **Governed Multi-Broker Atomic Merge**:
- Sequential imports accumulate into a unified canonical portfolio.
- Overlapping securities across brokers are consolidated deterministically by P04/P12 `companyId`.
- Disjoint securities are appended.
- Portfolio allocation weights are recalculated and normalized to exact `100.0000%` across the combined constituent vector.
- Provenance tracking preserves cryptographic lineage across contributing brokers.

---

## 2. Canonical Merge Semantics

### 2.1 Consolidation Key
The authoritative consolidation key is the P04/P12 Security Master `companyId` (e.g. `INFOSYS_LTD`, `TATA_CONSULTANCY`, `EQ_RELIANCE_IN`).
Unmapped or ambiguous securities are NEVER merged; they fail closed at the ingress stage.

### 2.2 Mathematical Consolidation Rules
For any position existing in prior broker saves ($H_{existing}$) and an incoming broker batch ($H_{incoming}$):

1. **Quantity Aggregation**:
   $$Q_{merged} = Q_{existing} + Q_{incoming}$$

2. **Total Cost Basis Aggregation**:
   $$\text{Cost}_{existing} = Q_{existing} \times \text{AvgBuyPrice}_{existing}$$
   $$\text{Cost}_{incoming} = Q_{incoming} \times \text{AvgBuyPrice}_{incoming}$$
   $$\text{Cost}_{merged} = \text{Cost}_{existing} + \text{Cost}_{incoming}$$

3. **Volume-Weighted Average Buy Price**:
   $$\text{AvgBuyPrice}_{merged} = \frac{\text{Cost}_{merged}}{Q_{merged}}$$

4. **Current Market Price**:
   $$\text{CurrentPrice}_{merged} = \text{CurrentPrice}_{incoming} > 0 \; ? \; \text{CurrentPrice}_{incoming} : \text{CurrentPrice}_{existing}$$

5. **Consolidated Market Value**:
   $$V_{merged} = Q_{merged} \times \text{CurrentPrice}_{merged}$$

---

## 3. Weight Normalization & Invariant Preservation

Weights are NEVER combined by simple addition of broker-level percentages. Weights are derived strictly after the full merged canonical vector is formed:

1. Total portfolio valuation: $V_{total} = \sum_{i=1}^N V_i$
2. Constituent raw weight: $W_i = \left(\frac{V_i}{V_{total}}\right) \times 100$
3. Rounding to 4 decimal places ($10^{-4}$): $W_i^{rounded} = \text{round}(W_i \times 10000) / 10000$
4. Residual reconciliation applied to the largest constituent: $\Delta = 100.0000 - \sum W_i^{rounded}$
5. Guarantee: $\sum_{i=1}^N W_i \equiv 100.0000\%$

---

## 4. Transactional Atomicity & Error Isolation

- **Transaction Isolation**: Merge operations are transactional. If an incoming broker statement fails at DETECT, QUALIFICATION_CHECK, PARSE, NORMALIZE, or VALIDATE stage, the existing portfolio in `PortfolioStore` is preserved 100% untouched.
- **Fail-Closed Identity**: If any constituent in the incoming file cannot be resolved to an unambiguous P04/P12 entity, ingress is halted with `REJECTED` disposition (`UNMAPPED_IDENTITY` or `IDENTITY_AMBIGUITY`).
- **Zero Partial Writes**: `PortfolioStore.saveHoldings()` performs an atomic update in a single operation.

---

## 5. Provenance & Multi-Broker Lineage Tracking

- **Holding-Level Digest**: Each merged holding receives a deterministic SHA-256 lineage digest covering its consolidated quantities, volume-weighted prices, and contributing prior digests.
- **Portfolio-Level Digest**: The updated portfolio receives a new deterministic SHA-256 provenance digest computed from the merged holding vector and source contribution metadata.
- **Audit Contributions**: The portfolio maintains a `contributions` ledger recording source broker types, file names, timestamps, and raw content SHA-256 digests.

---

## 6. Workspace Controls & Lifecycle Guarantees

1. **Refresh (`#btn-refresh-portfolio`)**:
   Reads current state from `PortfolioStore.getPortfolio()`, creates a new observable reference in React state, and updates constituent tables and analytics summaries.
2. **Import Holdings (`#btn-open-import`)**:
   Re-opens the broker import dialog in clean `IDLE` state, clears previous selection and save state, and allows new file ingress without lifecycle blocking.
3. **Toast Notification Safety**:
   Toast notifications are positioned in the bottom-right viewport (`fixed bottom-6 right-6 z-40`) to prevent physical overlap or pointer-event interception on top-right header controls.
