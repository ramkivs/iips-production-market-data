# Local personal-use persistence — explicitly authorized local single-user path

**Status:** implemented (this repository, 2026-11-08), **extended to
broker-observed holdings 2026-11-09**. Authority: the Program Authority's
authorization of 2026-11-08 to complete IIPS personal portfolio persistence, and
the Program Authority standing decision of 2026-11-09 extending that local
personal-use carve-out to broker CSV imports. It is valid **only** for this
local single-user, non-production application owned by its operator, under the
PERSONAL APPLICATION PRINCIPAL. It is not a production, hosted, institutional or
multi-user capability and confers no such authority. Gate E W-1 conditions (3)
Gate 4 qualification and (4) Gate 5 admission remain **NOT MET** on the governed
path; see §7.

## 1. What it enables

Under `IIPS_LOCAL_PERSONAL_USE=1` (server process environment only — never a
request header, request body or flag file), the v1 IPC write operations execute
against the ordinary durable store instead of returning the historical
`WRITE_NOT_AUTHORIZED`:

| Operation | Behaviour under the switch |
|---|---|
| `portfolio.create` | Creates the portfolio; portfolio name is optional (≤ 100 chars); id defaults to `DEFAULT_PORTFOLIO`; holdings required, non-empty. Revision 1. |
| `portfolio.save` | Saves with `expectedRevision` required (integer ≥ 0). Duplicate content (same server-computed content digest) is an idempotent no-op: revision unchanged, `ALREADY_IMPORTED_NO_OP`, zero holdings reported saved. Otherwise `MERGED_INTO_EXISTING` and revision increments. |
| `portfolio.reset` | Same shape as save; operation is recorded as `reset` in the revision ledger. (Present for contract completeness; the personal UI surfaces ordinary saves.) |
| `portfolio.delete` | Tombstones the portfolio (`expectedRevision` required). A subsequent read is byte-indistinguishable from a foreign portfolio (`RESOURCE_UNAVAILABLE`). |
| `portfolio.get` | Read unchanged, **except** the governed `contributions` array is projected to `[]` and replaced by a projected `importEvidence[]` (see §3). |
| `portfolio.list` / `portfolio.revisions` | Unchanged. |

Everything else about the governed semantics is unchanged: local binding
resolution happens afresh per request, the store re-checks ownership inside a
`BEGIN IMMEDIATE` transaction, invalid input rolls the whole operation back,
the audit chain (append-only event log + checksum chain) and the contribution
ledger are still written, the duplicate/no-op rule (BI-08) still holds, and the
two-phase delete still tombstones rather than erases.

With the switch absent or set to anything other than `1`, every write is
refused exactly as before: `WRITE_NOT_AUTHORIZED`, zero bytes beyond the typed
envelope, zero store effect. Pinned governance tests (e.g. T-PKG-6, the q1
dispatch-unreachable boundary) assert this and pass unchanged.

**There is no second persistence architecture.** One store, one schema, one
binding model, one audit chain — the switch only admits the existing v1 write
path. Nothing on this path speaks to a network; it is the same UDS/named-pipe
service the read path uses.

## 2. Revision cap for the personal path

The governed cap of 4 immutable revisions (D03, asserted by pinned tests) is
the default everywhere. Under the personal-use switch the store is constructed
with `revisionCap: 1000` (still finite; the D03 cap is untouched on the
governed path). Non-personal construction is byte-for-byte unchanged.

## 3. Deliberate projection scope: `contributions` vs `importEvidence`

The v1 `get` detail previously carried `contributions[]` rows. The frozen
consumer contract (IRR `G2Contribution`) requires, for every row, a
per-batch `holdingsCount`; the v1 contribution rows do not store it (adding it
means a schema migration, which this authorization does not include) and the
broker-import `content_digest` never equals the revision digest, so a join
cannot fabricate it either. Shipping governed-shaped rows would force the
consumer to fail closed on every read after a save.

Therefore, under the personal-use switch only, `portfolio.get` projects
`contributions: []` — and, since the 2026-11-09 extension, ALSO projects the
same durable ledger as `importEvidence[]`, one entry per committed import:

| Field | Source | Meaning |
|---|---|---|
| `contentDigest` | `portfolio_contributions.content_digest` | SHA-256 of the uploaded file's bytes — the file's own evidence identity |
| `lineageDigest` | `...lineage_digest` | SHA-256 over the normalised committed holdings |
| `fileName` | `...file_name` | the operator's file name, as supplied |
| `sourceBroker` | `...source_broker` | the detected broker |
| `importedAt` | `...imported_at` | the broker statement's import instant |
| `contributedAt` | `...contributed_at` | when the revision was committed |
| `semantics` | `...contribution_semantics` | `SAVED_NEW_BATCH` / `MERGED_INTO_EXISTING` / `RESET` / `REPLACE` |

Every value is read from the stored row. A fact that was never recorded stays
`null`; nothing is defaulted, inferred or synthesized. So the operator can
answer "which broker file produced this portfolio, and when" from the normal UI
read path.

This is an honest projection scope-out, not a silent omission:

- the contribution ledger rows are **still written** (the store's ordinary
  provenance rule applies) and the audit chain is intact;
- provenance visibility remains available via `portfolio.revisions` (revision
  ledger with operation, counts, totals, digests and timestamps) and the local
  database itself;
- outside the switch, v2 snapshot semantics are untouched.

## 4. Manual entries are not broker observations

Manual holdings are mapped server-side (`src/persistence/manualPersonalPortfolio.ts`):

- wire accepts only `symbol`, `quantity`, `averageBuyPrice`, `currentPrice`, `active`;
- symbol is normalised to upper case; duplicates refused; quantity > 0, prices finite ≥ 0;
- `marketValue`, `weightPercentage` (topped up on the largest holding so the sum
  is exactly 100 for non-zero batches), `lineageDigest`
  (per holding) and `provenanceDigest` (batch) are all computed server-side;
- `companyId` is the self-referential sentinel `MANUAL:<SYMBOL>`;
  `identityStatus` is `UNRESOLVED`; `resolutionDisposition` is
  `MANUAL_PERSONAL_ENTRY`; `sourceBroker` is `manual-personal`;
- caller-supplied identity or resolution keys on the wire were already, and
  remain, zero-byte refused at the envelope scan (C7); nothing here re-admits them.

A manual entry is therefore permanently distinguishable from a broker-imported
or master-resolved holding (`MANUAL:<SYMBOL>` vs `EQ_<NAME>_IN`).

**As of 2026-11-09 the Dhan whole-import refusal is no longer global.** It now
depends on identity qualification, not on the origin of the row: a broker file
whose every row resolves to exactly one governed P04 identity is saveable under
the local path, and a file with ANY unresolved or ambiguous row is still
refused in full (`REFUSED_UNRESOLVED_IDENTITY` / Gate E W-6 / DP-2 2F). Nothing
is auto-approved and no identity is invented. Rows 44 / 51 / 63 of the WS-A
Dhan 68-row evidence set remain unresolved and out of scope until authoritative
evidence and the governance process permit otherwise.

## 5. What this path does not do

- no production/hosted, institutional or multi-user behaviour; no TLS/auth additions;
- no change to the v2 snapshot contract, its cap, or D05 validation;
- no schema migration (migrations remain exactly the five pinned files);
- **no bypass of identity qualification**: broker rows are qualified through the
  existing governed P04 master → P7 registry joint path, and any unresolved or
  ambiguous row refuses the whole import;
- no capability for the browser to reach the IPC service directly — the IRR
  local server remains the only consumer of the IPC endpoint; the broker import
  is composed in the IPD process (§7) and is not an IPC operation.

## 6. Operating it (Windows host)

1. Build normally (`npm run build`).
2. Start the local persistence service with the switch set, e.g.
   `IIPS_LOCAL_PERSONAL_USE=1 npm run start:local` (or the service's standard
   launch command with the variable present in the process environment).
3. Start the IRR local server with the same switch set. Only then does it
   admit the four write routes (see the IRR repository,
   `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md`).
4. Verify durability by saving in the personal portfolio UI, fully closing the
   application, reopening it, and confirming the holdings reappear.

Without the variable in the environment, both sides refuse writes exactly as
they did before this change.

## 7. Broker-observed holdings: the explicit local single-user write path

Authority: Program Authority standing decision, 2026-11-09. The decision
extends the carve-out to broker-observed holdings and requires an **explicit
local single-user authorization path** rather than weakening Gate E W-1
conditions (3) and (4) globally.

### 7.1 Why a change was needed

The durable broker-import port (`src/persistence/durablePortfolioStorePort.ts`)
evaluated `evaluatePortSaveGuard()` with **no context**. The guard's own
context branch already recognized the personal carve-out, but nothing ever
supplied a context on that path, so the guard always took its `if (!context)`
default-deny branch. The composition root therefore refused every import with
`WRITE_NOT_AUTHORIZED` / `storeEffect: 'NONE'` regardless of the process
environment, even with a valid ACTIVE binding and fully qualified identities.
The gap was structural — a missing argument, not a missing policy.

### 7.2 The authorization path

`src/persistence/localSingleUserAuthorization.ts` establishes the identity half
of the carve-out and hands it to the guard. Two independent conditions must
both hold:

1. **`IIPS_LOCAL_PERSONAL_USE=1`** in the SERVER process environment. Read from
   the server-owned env only — never a request frame, payload, header or flag
   file. No other variable is consulted; `IIPS_PORT_SAVE_AUTHORIZED`,
   `IIPS_ALLOW_WRITES`, `IIPS_GATE4_QUALIFIED`, `IIPS_GATE5_ADMITTED`,
   `IIPS_W1_3`, `IIPS_W1_4` and `NODE_ENV` authorize nothing.
2. **An ACTIVE local principal binding** whose single ACTIVE membership
   resolves to exactly the canonical owner AND tenant the write targets. The
   binding is resolved from the database, never taken from the caller, and a
   well-formed binding for a *different* principal is refused.

Either condition alone is insufficient, and the refusal is the same typed
`WriteNotAuthorizedError` in every case. When the binding lives in a connection
already holding `BEGIN IMMEDIATE`, the in-transaction resolution is used, so the
binding read is atomic with the write it authorizes (no nested `BEGIN`).

The decision is centralized in `evaluatePortSaveGuard`, and the guard remains
the sole decision-maker. The scope (`MANUAL_PERSONAL_PORTFOLIO` or
`BROKER_OBSERVED_IMPORT`) is a closed union used for the audit record; naming a
scope grants nothing.

### 7.3 What is unchanged

- **Gate 4 / Gate 5 are not weakened for anyone else.** A port constructed with
  no options — every pre-existing caller, and the whole governed path — still
  supplies no context and still receives the byte-identical hard-false
  response: `W-1(3): Gate 4 qualification not accepted` /
  `W-1(4): Gate 5 admission not accepted`.
- **Identity qualification is untouched.** The durable leg still re-resolves
  every holding against the governed D05 authenticated universe through
  `createGovernedBrokerObservationResolver`; caller-supplied `companyId`,
  `identityStatus` and `resolutionDisposition` are structurally dropped by the
  application path and refused by the store. Any unresolved or ambiguous row
  refuses the entire import before any transaction opens.
- **Transaction, audit, revision and idempotency safeguards are untouched.**
  One `BEGIN IMMEDIATE` per import, in-transaction re-validation of the ACTIVE
  binding with `ResourceUnavailableError` on mismatch, append-only audit chain,
  immutable revision ledger, W-8/BI-08 duplicate no-op.
- **No new IPC operation, route or HTTP surface.** The consumer is composed at
  the single existing call site in `entrypoint.ts`.

### 7.4 The application path

`src/ui/brokerImportApplicationPath.ts` composes the shipped pieces; it adds no
qualification or persistence logic of its own:

| Step | Component |
|---|---|
| Upload | `BrokerCsvUpload` — raw content + fileName, unmodified |
| Parse / validate | `BrokerImportIngressOrchestrator.executeIngress` (BI-05: DETECT → PARSE → NORMALIZE → VALIDATE) |
| Identity qualification | governed P04 master (per-row assessment) then `persistBrokerImport`'s independent re-resolution |
| Preview + summary | `brokerImportPreview` — pure projection, writes nothing |
| Durable save | `BrokerImportConsumer` composed by `startIpcServer` → durable port → guard |
| Retrieval | `portfolio.get` over the normal IPC read path, incl. `importEvidence[]` |
| Revisions / idempotency | `portfolio.revisions`; identical re-import is `ALREADY_IMPORTED_NO_OP` |
| Restart durability | reopen the same database path; state and import evidence survive |

### 7.5 Operating it

Set `IIPS_LOCAL_PERSONAL_USE=1` in the IPD service process environment and ensure
exactly one ACTIVE local principal binding with one ACTIVE membership exists.
Upload the broker CSV; the preview shows the per-row identity resolution
summary. A file with any unresolved row cannot be saved — supply authoritative
evidence and follow the governance process. `docs/DIRECT_P1_PROVISIONING.md`
§6.5 records the corresponding provider-side posture.

### 7.6 Non-claims

This is **not** production acceptance, **not** institutional certification,
**not** Gate 4 qualification and **not** Gate 5 admission. `QE-1`…`QE-11` and
B-06 remain open. It is a local, single-user, non-production capability
exercised on the operator's own machine.

## Authenticated tombstone restoration

The v1 IPC write `portfolio.restore` accepts only `{ portfolioId:
"DEFAULT_PORTFOLIO", expectedRevision, idempotencyKey }` (the default ID may
be omitted). It requires the same enabled personal-use path and freshly
resolved ACTIVE local binding/membership as ordinary personal writes. Caller
owner/tenant claims remain forbidden; v2 writes remain unauthorized.

`expectedRevision` is the tombstone's last-active pointer, not the DELETE
revision. A valid tombstone with last active revision 2 and DELETE revision 3
is restored at revision 4, explicitly labeled `RESTORE`. Metadata, deletion
timestamp, all historical rows and all contribution rows are retained. The
new holdings snapshot copies the last active snapshot, including unresolved
identity facts; its prior `isSaved` is retained in a restoration receipt, not
inferred as a new save. Restoration does not contribute capital.

The receipt is `{ portfolioId, revision, restoredAt, isSaved }`. An exact retry
using the same authenticated owner/tenant, idempotency key and expected revision
returns that original receipt, even after subsequent lifecycle changes, with no
additional revision or audit event. A reused key with changed request content
is rejected. A different request against an active portfolio is rejected.
Other IDs cannot use this operation; create still cannot reuse tombstones.

Migration 006 rebuilds the revision CHECK and referencing holdings table in a
single migration transaction with foreign keys enabled, preserving all existing
row values and uniqueness. It appends restoration receipts and leaves migrations
001–005 byte-unchanged. Successful restore appends one chained RESTORE audit
event atomically with its revision and receipt.

The personal-use cap remains **1,000**. Required restore revisions above 1,000
are rejected without changes. Restore at 1,000 succeeds, but subsequent ordinary
saves remain blocked by the existing cap. This implementation does not run a
restore against any actual portfolio; an authenticated caller must request it.
