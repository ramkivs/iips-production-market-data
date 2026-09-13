# P02 — OBSERVABILITY AND AUDIT REQUIREMENTS

**SPECIFICATION ONLY.** Requirements on the provider-abstraction boundary.

> **P17 owns operations:** monitoring stacks, dashboards, alerting, incident handling,
> failover controls and release evidence. **None of that is implemented or designed here.**
> P02 states only what the boundary must **emit** so that P07 and P17 can later do their work.

---

## 1. Auditability requirement

| # | Rule |
|---|---|
| O-1 | Every acquisition attempt — success or failure — emits an **evidence-bearing record** (NFR-07) |
| O-2 | Records are sufficient to reconstruct **what was asked, of whom, under what version, with what outcome** — without contacting the provider |
| O-3 | A silently discarded attempt or failure is itself a **contract violation** |
| O-4 | Records are **append-only in intent**: a correction is a new record, never an edit |

## 2. Required record content

### 2.1 Attempt record

| # | Element |
|---|---|
| R-1 | Internal `provider` identity |
| R-2 | `adapterId` + `adapterVersion` |
| R-3 | `providerSchemaVersion` |
| R-4 | Canonical `schemaVersion` + `namespaceVersion` |
| R-5 | Requested domain, mode, field set, granularity, range |
| R-6 | Identity reference of the request (**no provider-native symbol**) |
| R-7 | `receivedAt` and attempt timestamps |
| R-8 | Capability-gate outcome |
| R-9 | Entitlement-gate outcome + `entitlementRef` (**the requirement, never the credential**) |
| R-10 | Outcome: snapshot produced (with `snapshotId`) or error class E1–E8 |
| R-11 | Attempt count and terminal disposition for E4/E7, including any recorded escalation to E1 |
| R-12 | Resulting `quality` and `completenessPct` where a snapshot was produced |
| R-13 | Count of fields by `availability` marker — in particular `WITHHELD` and `NOT_PROVIDED` |
| R-14 | Transformation-chain reference applied |
| R-15 | Any elements **ignored** under additive forward-compatibility (P01 FC-1) |

### 2.2 Snapshot-linkage record

| # | Element |
|---|---|
| SL-1 | `snapshotId` in the frozen `data-${provider}-${dataVersion}-${asOf}` form |
| SL-2 | Full lineage block as emitted |
| SL-3 | `identityMappingVersion` where identity crossed the AD-1 adapter |
| SL-4 | Sufficient content to populate an ADR-02 `contributingData` entry |

## 3. Metrics the boundary must make derivable

Stated as **derivable quantities**, not as an implemented metrics system.

| # | Quantity |
|---|---|
| M-1 | Attempts, successes and failures by error class E1–E8 |
| M-2 | Capability-gate and entitlement-gate denial counts |
| M-3 | Distribution of `quality` outcomes |
| M-4 | `completenessPct` distribution |
| M-5 | `WITHHELD` counts (entitlement pressure) vs `NOT_PROVIDED` counts (source gaps) — **kept distinct** |
| M-6 | Retry counts and E4/E7 → E1 escalation counts |
| M-7 | Age between `asOf` and `receivedAt` — the **input** to freshness (**thresholds are P07**) |
| M-8 | Adapter-version distribution of produced snapshots |
| M-9 | Rate-limit encounters |

| # | Rule |
|---|---|
| MQ-1 | P02 requires the **inputs** to be present and unambiguous; it sets **no thresholds, no SLOs, no alerts** |
| MQ-2 | Freshness thresholds are **P07**; alerting and incident response are **P17** |

## 4. Redaction — absolute

| # | Prohibition |
|---|---|
| RD-1 | **No credential, API key, token, password or certificate** in any record |
| RD-2 | **No endpoint, hostname, account identifier or tenant secret** |
| RD-3 | **No unredacted provider payload.** Diagnostics reference the offending canonical slot and the rule violated |
| RD-4 | **No provider-native error string** in a contract-level record (the *class* is the contract; native detail may appear only in a redacted internal diagnostic) |
| RD-5 | **No vendor name** where the internal `provider` identity suffices |
| RD-6 | Records may contain licence-restricted content only where entitlement and AD-11 classification permit |

## 5. Product-surface boundary

| # | Rule |
|---|---|
| PB-1 | Observability records are **internal governed artifacts**. They are **not** product DTOs |
| PB-2 | **Provider identity never reaches product DTOs or UI** (NFR-06, INT-004) |
| PB-3 | Product surfaces expose *governed provenance* and honest quality/degradation state, never vendor identity or raw error classes |
| PB-4 | ⚠ **UI17 ReplayExplorer must not present `reproduced`/`byteIdentical` literals as verified reproduction** — inherited constraint; **AD-17 remains UNRESOLVED** |
| PB-5 | What is surfaced in the product is decided by **P12/P13**, not here |

## 6. Retention of records

| # | Rule |
|---|---|
| RT-1 | Retention of observability records is governed by the same classification regime (AD-11) |
| RT-2 | ⚠ **M-6:** `isWithinRetention()` is a stub — **retention is NOT enforced** by existing-IIPS. Recording a retention period is **not** an enforcement claim |
| RT-3 | **M-6 is not repaired here.** Any control depending on retention enforcement must be recorded as currently unenforceable (DEP-P02-03) |
