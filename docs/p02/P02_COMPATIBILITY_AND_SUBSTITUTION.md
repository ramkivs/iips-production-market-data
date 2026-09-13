# P02 — ADAPTER COMPATIBILITY, VERSIONING AND PROVIDER SUBSTITUTION

**SPECIFICATION ONLY.**

---

## 1. The six version axes in play

| # | Axis | Owner | Introduced |
|---|---|---|---|
| 1 | `schemaVersion` — canonical P01 schema | P01 | P01 |
| 2 | `dataVersion` — provider content vintage | Provider | P01 |
| 3 | `namespaceVersion` — namespace scheme | ADR-01 (⚠ OI-10) | P01 |
| 4 | `identityMappingVersion` — AD-1 adapter mapping | **P04** | P01 |
| 5 | **`adapterVersion`** — the adapter code | This program | **P02** |
| 6 | **`providerSchemaVersion`** — provider wire schema | Provider | **P02** |

**None may be substituted for, derived from, or conflated with another.**

---

## 2. Compatibility triple

An adapter is usable only when all three hold simultaneously:

| # | Condition |
|---|---|
| CT-1 | `providerSchemaVersion` the adapter targets is **compatible with what the provider actually serves** |
| CT-2 | `schemaVersion` the adapter emits is **within the range the consumer accepts** |
| CT-3 | `namespaceVersion` the adapter applies is **the one in force** |

| # | Rule |
|---|---|
| CR-1 | All three are **declared**, never negotiated at runtime by inference |
| CR-2 | All three are **recorded on every snapshot** |
| CR-3 | Failure of any is a **rejection**, never a best-effort degradation |

---

## 3. Incompatibility behaviour — fail closed

| Situation | Behaviour |
|---|---|
| Provider serves a **newer** wire schema, additive only | Adapter may proceed **only if** its declaration says it tolerates additive change; unknown elements are ignored **and recorded as ignored** |
| Provider serves a newer wire schema with **breaking** change | **Reject** — `MALFORMED_RESPONSE` (E5). No guessing |
| Provider serves an **older** wire schema than targeted | **Reject** unless explicitly declared as supported |
| Consumer requires a canonical `schemaVersion` the adapter does not emit | **Reject** before acquisition — `UNSUPPORTED_CAPABILITY` (E6) |
| `namespaceVersion` mismatch | **Reject.** Namespace discipline is fail-closed (ADR-01 C5) |
| Adapter cannot map a required canonical slot under the current versions | **Reject** — `CONTRACT_MAPPING_FAILURE` (E8) |

| # | Rule |
|---|---|
| IC-1 | **Never** infer a mapping across an incompatible version |
| IC-2 | **Never** emit a partially mapped snapshot to "get something through" |
| IC-3 | **Never** silently downgrade the requested canonical `schemaVersion` |
| IC-4 | An unknown element that is **ignored** must be recorded as ignored — silent discard is prohibited (inherits P01 FC-1) |
| IC-5 | An unknown **required** element is a rejection (P01 FC-2) |

---

## 4. Adapter version change classification

| Change | Class |
|---|---|
| Add support for a new canonical field | MINOR |
| Add a domain, granularity or mode to the declaration | MINOR |
| Extend a historical range | MINOR |
| Add a `knownLimitation` (disclosure of an existing truth) | MINOR |
| Any change altering the canonical value produced from an identical payload | **MAJOR** |
| Change a unit, currency, scale, precision or rounding rule | **MAJOR** |
| Change a timestamp slot assignment | **MAJOR** |
| Change an `availability` mapping (e.g. sentinel handling) | **MAJOR** |
| Change error classification for a given condition | **MAJOR** |
| Remove a declared capability | **MAJOR** |
| Change the emitted canonical `schemaVersion` range (narrowing) | **MAJOR** |
| Track an additive provider wire-schema change with no canonical effect | MINOR |

| # | Rule |
|---|---|
| AC-1 | **Silent behavioural change is prohibited.** Every behavioural change is a version change |
| AC-2 | An adapter version, once released, is **immutable** |
| AC-3 | A MAJOR adapter change requires re-demonstration of determinism against retained fixtures (**deferred — DEP-P02-09**) |
| AC-4 | An adapter version change **never** changes `provider`, and never changes historical `snapshotId` values |

---

## 5. Provider substitution (§10 of the work order)

**Goal:** substitute a provider without changing the canonical or product contract.

| # | Rule |
|---|---|
| PS-1 | **Substitution is invisible to the canonical contract.** Consumers depend on the canonical schema, never on which provider produced it |
| PS-2 | **Substitution is invisible to product DTOs and UI** — provider identity is never exposed anyway (NFR-06) |
| PS-3 | **Substitution is NOT invisible to lineage, and must not be.** A different source is a **different `provider` identity**, and every affected snapshot records it |
| PS-4 | Historical snapshots are **never** rewritten to the new provider. They retain their original `provider`, `dataVersion`, `asOf`, `snapshotId` and lineage **permanently** |
| PS-5 | Substitution therefore **changes future snapshot identities**, because `provider` is embedded in `snapshotId`. This is correct and intended |
| PS-6 | Consequently, substitution **changes effective replay identity** for future executions (ADR-02) — and must, since the data vintage genuinely came from elsewhere |
| PS-7 | Substitution is valid only when the replacement's **declared capability covers** the required domains, fields, modes, granularities, ranges and PIT/revision needs. A capability shortfall is a **scope reduction**, not a substitution |
| PS-8 | Substitution requires its own **entitlement**; entitlements do not transfer between providers |
| PS-9 | **Values may legitimately differ** between providers. Substitution is not a guarantee of numerical equivalence, and any such claim would require reconciliation evidence — **P07**, not here |
| PS-10 | **Silent substitution is prohibited.** A substitution is a governed, recorded change, never an adapter-internal fallback |

### 5.1 Substitution vs failover

| | Substitution | Failover |
|---|---|---|
| Nature | Governed, deliberate, durable | Runtime, reactive |
| Owner | Program governance | **P07 / P17** — **not P02** |
| Lineage | New `provider` on future snapshots | Each snapshot still records its actual `provider` |
| Permitted inside an adapter | **No** | **No** — orchestration sits above the adapter |

**Both are prohibited as adapter-internal behaviour** (E-taxonomy PR-6). Failover *policy* is
outside P02 entirely.

### 5.2 What substitution must NOT require

| # | Must not require |
|---|---|
| SN-1 | Any change to the canonical P01 contract |
| SN-2 | Any change to product DTOs, UI or engine inputs |
| SN-3 | Any rewriting of historical data or identities |
| SN-4 | Any change to `MarketDataSource<T>` / `DataSnapshot<T>` shapes |
| SN-5 | Any engine, scoring, calibration or taxonomy change |

**This is the operative test of the abstraction:** if substituting a provider would force a
change above the adapter boundary, the abstraction has been violated.

---

## 6. Determinism obligations under versioning

| # | Rule |
|---|---|
| DT-1 | `(payload, adapterVersion, schemaVersion, namespaceVersion)` ⇒ **one** canonical snapshot, byte-stable |
| DT-2 | Replaying a retained payload against the **same** adapter version must reproduce the snapshot exactly |
| DT-3 | Replaying against a **different** adapter version may differ — and the difference must be **explicable from the version change**, never mysterious |
| DT-4 | Determinism evidence is a **retained-payload** exercise; it does **not** require contacting a provider |
| DT-5 | ⚠ Producing that evidence is **deferred — DEP-P02-09** (implementation prohibition) |
| DT-6 | This is **provider-payload replay for adapter determinism** — it is **not** engine replay, does **not** touch `ReplayService`, and does **not** resolve **AD-17** |
