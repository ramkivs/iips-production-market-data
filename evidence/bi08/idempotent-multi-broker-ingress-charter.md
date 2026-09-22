# Institutional Investment Platform System (IIPS)
# Workstream BI-08 — Idempotent Multi-Broker Ingress & Content-Hash Deduplication Charter

**Charter Identifier:** `BI-08-IDEMPOTENT-MULTI-BROKER-INGRESS-CHARTER`  
**Authority Decision:** **OPTION A — CONTENT-HASH IDEMPOTENCY (SELECTED)**  
**Governing Authority & Charters:** `AD-01..AD-18` / `AD-CHARTER-2026-01` / `BI-08-AUTH-2026-01`  
**Execution Mode:** `NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV`  
**Effective Date:** 2026-09-22  
**Target Release:** `v1.0.0-rc2` / `v1.0.0-rc1-post-bi08`  

---

## 1. Authority Decision & Problem Formulation

### 1.1 Forensic Gate Finding
Following Windows visual acceptance, forensic investigation (`GATE-DUPLICATE-CSV-INGESTION-FORENSIC`) established that re-uploading the exact same broker CSV file caused `PortfolioStore.saveHoldings()` to execute the default `GOVERNED_MULTI_BROKER_ATOMIC_MERGE` consolidation loop additively. This doubled position quantities and total portfolio market value ($₹5,10,144.92 \to ₹10,20,289.84$) while keeping relative constituent counts and weights invariant.

### 1.2 Program Authority Selection
Program Authority has formally reviewed the three architectural remediation candidates and selected:

$$\mathbf{SELECTED\ REMEDIATION:\ OPTION\ A\ —\ CONTENT-HASH\ IDEMPOTENCY}$$

### 1.3 Strategic Rationale for Option A
1. **Surgical Root-Cause Remediation:** Directly prevents identical file re-ingestion by leveraging the deterministic SHA-256 `contentDigest` already computed at Stage 0 of the ingress pipeline.
2. **Preservation of Governed Multi-Broker Merge:** Preserves the certified multi-broker consolidation mechanics across distinct broker files (`Zerodha` + `Dhan` + `Groww`).
3. **Zero UI Disruption:** Does not require modal workflow complexity or operator mode disambiguation for standard institutional workflows.
4. **Cryptographic Durability:** Guarantees strict mathematical idempotency ($f(f(x)) \equiv f(x)$) for repeated file uploads.

---

## 2. Invariants & Mathematical Mechanics

### 2.1 Content-Hash Deduplication Rule
For any incoming save request to `PortfolioStore.saveHoldings(portfolioId, holdings, options)`:

1. **Content Digest Inspection:**
   The incoming `options.contentDigest` (SHA-256 of raw CSV payload) is checked against existing contribution records in `portfolio.contributions[]`:
   $$\exists \, c \in \text{portfolio.contributions} \quad \text{s.t.} \quad c.\text{contentDigest} == \text{options.contentDigest}$$

2. **Deduplication Execution (No-Op / Idempotent Return):**
   If a matching `contentDigest` is detected:
   - **Zero State Mutation:** No quantities, cost bases, market values, or allocation weights are modified.
   - **Zero Duplicate Contribution:** The incoming contribution is **not** appended to `portfolio.contributions[]`.
   - **Lineage Preservation:** The existing `portfolio.provenanceDigest` is preserved 100% untouched.
   - **Disposition & Feedback:** The store returns a successful idempotent result:
     - `success: true`
     - `isDuplicate: true`
     - `disposition: 'ALREADY_IMPORTED_NO_OP'`
     - `message: 'Source file already committed to this portfolio. State preserved without duplication.'`

3. **Distinct File Ingress (Multi-Broker Merge Path):**
   If `options.contentDigest` is unique (not found in `portfolio.contributions[]`):
   - The incoming statement proceeds to standard `GOVERNED_MULTI_BROKER_ATOMIC_MERGE`.
   - The new contribution record is appended to `portfolio.contributions[]`.
   - A new deterministic `provenanceDigest` is derived.

---

## 3. Acceptance Criteria (AC-01 through AC-08)

| Criterion | Requirement | Verification Invariant |
| :--- | :--- | :--- |
| **AC-01** | **Exact-File Idempotency** | Uploading the exact same CSV twice leaves `totalMarketValue`, constituent quantities, and `totalHoldingsCount` identical between Import 1 and Import 2 ($B - A = 0$). |
| **AC-02** | **Provenance Digest Stability** | On duplicate file upload, `portfolio.provenanceDigest` remains identical to Import 1's digest ($D_B \equiv D_A$). |
| **AC-03** | **Contribution Ledger Uniqueness** | `portfolio.contributions.length` remains 1 after two uploads of the same file (zero duplicate audit entries). |
| **AC-04** | **Distinct File Multi-Broker Ingress** | Importing File 1 (`Zerodha`) followed by File 2 (`Dhan`) with distinct content digests successfully executes multi-broker merge, updates market values, and derives exact 100.0000% weights. |
| **AC-05** | **UI View-Model Feedback** | The UI view-model reports `state: 'SAVE_SUCCESS'` or `state: 'ALREADY_IMPORTED'` with informative feedback without triggering an additive double-save. |
| **AC-06** | **Explicit Replacement Override** | If `mode: 'REPLACE'` is explicitly passed, content-hash deduplication is bypassed, and the portfolio is re-initialized with the incoming batch. |
| **AC-07** | **Zero-Fabrication & Non-Production Safety** | Unmapped securities continue to follow `NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS` with empty `companyId` and zero fabricated IDs. |
| **AC-08** | **Production Boundary Fail-Closed** | Strict production mode (`executionEnvironment: 'PRODUCTION'`) remains fail-closed against unmapped securities and non-production bypass. |

---

## 4. Test Matrix & Regression Cases

```
+---------------------------------------------------------------------------------------------------------------+
|                                      BI-08 TEST MATRIX SPECIFICATION                                          |
+---------+---------------------------------------------+-------------------------------------------------------+
| Test ID | Test Category & Description                 | Expected Invariant Behavior                           |
+---------+---------------------------------------------+-------------------------------------------------------+
| BI08-01 | Re-uploading identical Zerodha CSV twice    | Total value unchanged ($1.0x); contributions.length=1 |
| BI08-02 | Re-uploading identical Dhan Web UI CSV twice| Total value unchanged ($1.0x); weights=100.0000%      |
| BI08-03 | Re-uploading identical Groww CSV twice      | Total value unchanged ($1.0x); provenanceDigest stable|
| BI08-04 | Re-uploading after intervening 2nd broker   | File 1 -> File 2 -> File 1 re-upload rejected/no-oped |
| BI08-05 | Ingesting distinct broker files sequentially| Zerodha + Dhan + Groww merges cleanly into 148+ items |
| BI08-06 | Same security in different broker files     | Quantity and cost basis consolidate via VWAP          |
| BI08-07 | Explicit mode: 'REPLACE' overrides dedup    | Portfolio replaces cleanly on explicit request        |
| BI08-08 | UI controller & view-model live region text | Informative live region announcement on duplicate     |
+---------+---------------------------------------------+-------------------------------------------------------+
```

---

## 5. Migration & Data Integrity Recovery Strategy

If an operator or test instance has already incurred duplicate ingestion (e.g. state with doubled market value):
1. **Clean Reset Method:** `portfolioStore.resetPortfolio('DEFAULT_PORTFOLIO')` clears the accumulated state.
2. **Deterministic Re-Ingress:** Re-importing the source broker files sequentially once under BI-08 deduplication reconstructs the pristine canonical portfolio ($148$ constituents, $₹9,82,769.63$).

---

## 6. Implementation Gate Declaration

```text
================================================================================
NEXT EXECUTABLE GATE: GATE-BI08-IMPLEMENTATION-AND-VERIFICATION
Program Authority authorizes implementation of Option A (Content-Hash Idempotency)
in PortfolioStore, PortfolioBrokerImportController, and UI view-models.
================================================================================
```
