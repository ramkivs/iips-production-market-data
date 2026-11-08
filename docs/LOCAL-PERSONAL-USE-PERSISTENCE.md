# Local personal-use persistence — explicitly authorized local single-user path

**Status:** implemented (this repository, 2026-11-08). Authority: the Program
Authority's authorization of 2026-11-08 to complete IIPS personal portfolio
persistence. It is valid **only** for this local single-user, non-production
application. It is not a production, hosted or multi-user capability and confers
no such authority.

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
| `portfolio.get` | Read unchanged, **except** the `contributions` array is projected to `[]` (see §3). |
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

## 3. Deliberate projection scope: `contributions` on the wire

The v1 `get` detail previously carried `contributions[]` rows. The frozen
consumer contract (IRR `G2Contribution`) requires, for every row, a
per-batch `holdingsCount`; the v1 contribution rows do not store it (adding it
means a schema migration, which this authorization does not include) and the
broker-import `content_digest` never equals the revision digest, so a join
cannot fabricate it either. Shipping unmappable rows would force the consumer
to fail closed on every read after a save.

Therefore, under the personal-use switch only, `portfolio.get` projects
`contributions: []`. This is an honest scope-out, not a silent omission:

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
or master-resolved holding, and the Dhan whole-import refusal (identity
unresolvable / 2F approval) is untouched and still refused everywhere.

## 5. What this path does not do

- no production/hosted or multi-user behaviour; no TLS/auth additions;
- no change to the v2 snapshot contract, its cap, or D05 validation;
- no schema migration (migrations remain exactly the four pinned files);
- no identity resolution, no broker re-admission; Dhan whole-import stays rejected;
- no capability for the browser to reach the IPC service directly — the IRR
  local server remains the only consumer.

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
