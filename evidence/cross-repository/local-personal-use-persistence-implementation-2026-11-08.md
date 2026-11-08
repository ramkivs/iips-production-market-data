# Local personal-use persistence — implementation evidence (2026-11-08)

**Authority.** Program Authority's 2026-11-08 authorization to complete IIPS
personal portfolio persistence on this local single-user, non-production
application. Not a production authority. No other repository surface is
affected by this note.

**Changes (this repository only).**

- `src/ipc/localPersonalUse.ts` (new) — server-owned `IIPS_LOCAL_PERSONAL_USE=1`
  gate and the personal-use revision cap (1000; governed default of 4 unchanged).
- `src/persistence/portfolio_store.ts` — optional constructor `revisionCap`
  (positive integer, clamped to 1000); two revision-cap sites now read the
  per-instance cap; added read-only `deletedAtOf()` for the delete receipt
  (throws `ResourceUnavailableError` otherwise — never a default).
- `src/persistence/manualPersonalPortfolio.ts` (new) — server-side wire→store
  mapper for manual holdings (arithmetic, weights summing to exactly 100,
  manual sentinel identity, digests); refuses duplicate symbols/invalid input.
- `src/ipc/dispatch.ts` — under the gate only, v1 `portfolio.create/save/reset/
  delete` execute (typed `INVALID_REQUEST` / `REVISION_CONFLICT` /
  `RESOURCE_UNAVAILABLE`; Class P zero-byte refusals and C7 envelope scan
  unchanged); `portfolio.get` projects `contributions: []` under the gate (the
  ledger is still written — see doc §3). With the gate unset, behavior is the
  historical refusal, byte-for-byte.
- `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md` (new) — the authoritative scope note.
- `tests/personal_portfolio_local_path.test.ts` (new) — UDS end-to-end suite.

**Verified on Linux (2026-11-08).**

- `npx tsc -p .` — clean.
- `npm test` — `[test-guard] OK — 1199 test(s) executed, 1198 passed`, exit 0.
  (Pinned governance tests asserting the write-gate refusal position,
  T-PKG-6 and q1 dispatch-unreachable boundary, pass unmodified; test count
  delta vs. baseline is +1 suite, +16 assertions.)
- The new suite covers: gate-off refusal with zero store effect; create; read
  after a full close/reopen restart over the same database file; update with
  exact weight-sum-100 arithmetic; idempotent re-save (BI-08,
  `ALREADY_IMPORTED_NO_OP`); holding removal; invalid-payload rollback with
  revision unchanged; stale `expectedRevision` → `REVISION_CONFLICT`;
  foreign/unknown portfolio → byte-stable `RESOURCE_UNAVAILABLE`; C7 identity
  keys → zero-byte Class P; revision history; audit-chain verification;
  delete + post-delete read indistinguishability.

**Not verified here (Windows designated host).** Named-pipe transport, the
flush-guard settlement policy and the Windows-specific startup path are Windows
runtime behavior and cannot be executed on this Linux build agent. The UDS
suite is host-adaptive but was run on Linux only.

**Out of scope, unchanged:** v2 snapshot contract/cap, D05, four pinned
migrations (no migration was added — this authorization did not include one),
broker/Dhan whole-import re-admission, production/hosted/multi-user behaviour,
the IRR repository (implemented separately there).
