# O-2 Act C — Reconciliation Resolution Policy

## Identity

| Field | Value |
|---|---|
| **Record type** | Authority policy decision |
| **Open item** | O-2 — Reconciliation resolution policy |
| **Act** | Act C — Resolution policy establishment |
| **Date** | 2026-09-12 |
| **Decision authority** | Program Authority |
| **Resolves** | **DC-7** (`D15_PHASE_07_POLICY_STATE_CONTRACT.md` §3.5); **R-4** (`D14_PHASE_07_CONTRACT_BASIS.md` §6.4); **DEP-P02-12** reconciliation policy component |
| **O-2 status after this act** | ✅ **RESOLVED** |

## Policy scope

This policy defines **how a classified discrepancy is dispositioned** after detection and
classification (DC-1 through DC-6). It does NOT select providers (O-3), does NOT implement
P07-03, and does NOT modify P07-01, P07-02, or P07-04.

The policy is **provider-neutral** — expressed over abstract provider identities. No provider
is named, evaluated, or implied.

## §1 Disposition types — closed set

| Disposition | Definition | When applied |
|---|---|---|
| **`CLASSIFIED_PRESENTED`** | Discrepancy classified by dimension (CD-1…CD-5), annotation attached, both records presented to consumer with full classification | Normal path: classification succeeds |
| **`UNRESOLVED_PRESENTED`** | Discrepancy cannot be classified (classification failure, malformed input, missing lineage), annotated as unresolved, both records still presented | Fail-closed path: classification fails |

**These are the ONLY two dispositions.** No `RESOLVED`, `MERGED`, `COLLAPSED`, `DROPPED`,
`COERCED`, or `OVERRIDDEN` disposition exists. The closed set is frozen.

### Derivation

- `CLASSIFIED_PRESENTED` derives from DC-1 (*"classified, never silently resolved"*),
  DC-2 (*"names the dimension and records"*), and CR-1 (*"consumers see both records"*).
- `UNRESOLVED_PRESENTED` derives from UR-1 (*"remains visible, annotated as unresolved"*).

## §2 Disposition procedure

For each pair of overlapping canonical snapshots covering the same identifier/scope:

1. **Compare** across the five dimensions (CD-1 through CD-5).
2. **For each detected discrepancy:**
   a. **Classify** the discrepancy by dimension and record identity (DC-2).
   b. **If classification succeeds:** disposition = `CLASSIFIED_PRESENTED`.
   c. **If classification fails:** disposition = `UNRESOLVED_PRESENTED` (fail-closed, C5).
   d. **Attach** the disposition annotation to the discrepancy record.
   e. **Present** both records with the annotation (CR-1).
   f. **Propagate** quality and completeness unchanged (CR-2, INV-7).
3. **Produce** a reconciliation report identifying each compared record, dimension,
   classification, and disposition (§3.7 audit requirements).

## §3 Tolerance policy

| Dimension | Tolerance | Basis |
|---|---|---|
| **CD-1** (field-value) | **EXACT MATCH** — strict equality, no numeric tolerance | Policy decision; domain-specific tolerance may be added by future authority act |
| **CD-2** (asOf alignment) | **EXACT MATCH** — strict ISO-8601 UTC equality | P01 timestamp semantics (T-1…T-4) |
| **CD-3** (completenessPct) | **EXACT MATCH** — strict numeric equality | Q-2 |
| **CD-4** (quality) | **ENUM MATCH** — against the accepted four-state enum `[good, stale, partial, unavailable]` | Q-1 |
| **CD-5** (lineage/version) | **EXACT MATCH** — strict string equality | P01 lineage (RI-6) |

### Rationale

No tolerance value is invented. The policy establishes **exact-match semantics** as the
baseline. This is consistent with D15 §3.4 (*"No tolerance value is defined"*) — the policy
explicitly decides that the answer to "is there tolerance?" is **NO**, while preserving the
ability to add domain-specific tolerance by a future authority act.

### Extensibility

If a future authority act supplies domain-specific tolerance values (e.g., for CD-1
field-value comparison in a specific domain), those values would be incorporated as
**addenda** to this policy. The exact-match baseline remains the default for any dimension
or domain without an explicit tolerance override.

## §4 Tie-breaking policy

**There is no tie-breaking.**

When multiple provider records are candidates for the same identifier/scope:

- **ALL records are presented** (CR-1, PN-5).
- No single record is preferred over another.
- No provider precedence is applied for value selection.
- No "first processed wins" or "last processed wins."
- No silent selection by processing order.

### Rationale

Tie-breaking would require choosing one record over another, which would constitute
value-collapse — prohibited by DC-5, RJ-6, and C5. The policy resolves this by
presenting all records and leaving the choice to the consumer or a downstream authority act.

## §5 Precedence policy

### What IS permitted

**Classification/reporting precedence only:**

Discrepancies are reported in **dimension order**: CD-1 → CD-2 → CD-3 → CD-4 → CD-5.
Within each dimension, discrepancies are reported in **record provenance order** (the
deterministic order of the contributing set per RI-2).

This is **reporting order** — it determines the sequence in which discrepancies appear
in the reconciliation report. It does NOT determine which value "wins."

### What is PROHIBITED

- **Value-collapse precedence** — no provider's value is preferred over another's (DC-5, RJ-6).
- **Error-class gate order repurposing** — the existing `classificationPrecedence`
  (`E6 → E3 → E2 → E1`, LA-4) is the error-class gate order and MUST NOT be repurposed
  as value-reconciliation precedence (D15 §3.1).
- **"Last wins" or "first wins"** — prohibited without exception (RJ-6).

## §6 Cross-provider identity handling

| Rule | Basis |
|---|---|
| Provider identities are **preserved** in every discrepancy record | RI-3, PN-5 |
| Each record retains its **provider-attributed provenance** (sourceRef, adapterId, adapterVersion) | P01 lineage |
| `snapshotId` retains the provider component (`data-${provider}-${dataVersion}-${asOf}`) | AD-6, L-2 |
| Two snapshots from different providers are **distinct records**, never one | ID-2, PN-5 |
| Reconciliation **compares across** distinct records; it does **not merge** them | ID-3 |

## §7 Silent-overwrite prohibition

**Silent overwrite is prohibited without exception.**

No provider's value may overwrite another provider's value, whether silently, loudly,
by precedence, by processing order, or by any other mechanism. This prohibition is
non-negotiable and derives from RJ-6, C5, DC-5, and PN-5.

A reconciliation outcome that presents only one provider's value while discarding
another's is a **policy violation** — not a valid disposition.

## §8 Fail-closed behavior

When the reconciliation system cannot safely determine a disposition:

1. The discrepancy is annotated as **`UNRESOLVED_PRESENTED`**.
2. **Both records remain visible** (UR-1).
3. The discrepancy is **NOT** resolved by precedence, coercion, or dropping a record (UR-2).
4. No alert is raised — that is P17 (UR-3, MQ-2).
5. Quality and completeness propagate **unchanged** from each record's own values (CR-2, INV-7).

### Fail-closed triggers

- Malformed input (snapshot does not conform to P01 schema)
- Missing lineage (provenance insufficient to attribute values to a provider)
- Classification failure (dimension comparison cannot complete)
- Unexpected error during reconciliation processing

In all cases: **fail-closed = annotate as unresolved and present both records**.
Never: silent resolution, partial merge, coercion, or warning-and-continue (C5).

## §9 Quality / degraded-state boundary

| Rule | Basis |
|---|---|
| **No fifth quality state** is created by reconciliation | Q-1, CR-3 |
| Quality and completeness **propagate unchanged** through reconciliation | CR-2, INV-7 |
| Reconciliation disposition is **distinct** from the four-state quality vocabulary (`good`, `stale`, `partial`, `unavailable`) | This policy §1 |
| A discrepancy is **not** a contract violation — Q-5 keeps the categories distinct | DC-3 |
| Reconciliation **never** presents a denial as a data-quality problem | CV-4 |
| Reconciliation **never** downgrades a rejection to `quality: 'partial'` | RJ-6 |

## §10 P07-01 / P07-02 / P07-04 boundary

| Accepted artifact | Relationship to this policy |
|---|---|
| **P07-01** quality rule framework | P07-03 may consume P07-01's classification output (category: reconciliation = DELEGATED). P07-03 does NOT redefine P07-01's categories or rules. |
| **P07-02** freshness evaluation | P07-03 may reference P07-02's freshness result for CD-2 comparison. P07-03 does NOT redefine freshness thresholds or evaluation. |
| **P07-04** degraded-state contract | P07-03 may reference P07-04's quality state for CD-4 comparison. P07-03 does NOT redefine data conditions or quality mappings. |

## §11 Unknown handling and remaining inputs

| Input | Status | Prevents O-2 establishment? |
|---|---|---|
| Tolerance values | **NOT REQUIRED** — policy establishes exact-match baseline | **NO** |
| Precedence values | **NOT REQUIRED** — policy establishes reporting order only | **NO** |
| Tie-breaking values | **NOT REQUIRED** — policy establishes "present all" | **NO** |
| Provider identity | **NOT REQUIRED** — policy is provider-neutral | **NO** |
| Domain-specific rules | **OPEN** — may be added as addenda by future authority act | **NO** |

No authority value is required but unsupplied. The policy is self-contained.

## §12 Acceptance status and gate distinction

This act establishes the **O-2 reconciliation resolution policy only**. It does NOT:

- ⛔ Select a provider (O-3 remains OPEN)
- ⛔ Implement P07-03 (remains NOT IMPLEMENTED)
- ⛔ Accept P07 overall (remains NOT ESTABLISHED)
- ⛔ Certify P07 (remains NONE GRANTED)
- ⛔ Authorize production activation (remains NOT AUTHORIZED)
- ⛔ Resolve Act 6 (remains OPEN — NO OWNER ASSIGNED)
- ⛔ Modify P01 (GATE unchanged)
- ⛔ Modify P07-01, P07-02, or P07-04

## §13 Policy version and identity

| Field | Value |
|---|---|
| Policy identity | `P07-03-RECONCILIATION-RESOLUTION-POLICY` |
| Version | `v1.0` |
| Effective | 2026-09-12 |
| Authority | Program Authority |
| Supersedes | Nothing — first version |
| Extensibility | Domain-specific addenda may be appended by future authority acts |

## Summary: O-2 resolution policy in one statement

> **Classify and present, never collapse.**
> Every discrepancy is classified by dimension, annotated, and presented alongside
> both provider records. No value is silently resolved, coerced, overwritten, or
> preferred. Quality propagates unchanged. Fail-closed = unresolved + visible.
