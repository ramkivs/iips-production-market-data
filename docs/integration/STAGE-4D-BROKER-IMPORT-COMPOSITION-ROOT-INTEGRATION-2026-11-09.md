# Stage 4D — Broker Import Identity Composition-Root Integration

**Repository:** `ramkivs/iips-production-market-data` (IPD)
**Class:** one composition module, two wired fields on the shipped entrypoint, focused
composition-root tests, and documentation. No identity-master change, no new mapping, no
qualification-rule change, no write-gate change, no portfolio-persistence change, no IRR write,
no Gate 4 / Gate 5 work, no production deployment or acceptance.

---

## 1. Finding addressed

Stage 4C recorded that the normal application composition root invoked

```ts
// src/ipc/entrypoint.ts
const brokerImportConsumer = createBrokerImportConsumer(db);
```

with `securityMaster` and `registry` absent. `createBrokerImportConsumer(db, options = {})` accepts
`MapBrokerImportHoldingsOptions`, so the call was valid TypeScript and threw nothing — it simply
left `mapBrokerImportHoldings` on its `else` branch, which builds a D114 identity directly from
broker-supplied ISIN + series without consulting P04 or P7. The Stage 4 qualification service was
therefore reached only from tests.

Verified against `main` at `709fd13c77e90df05900859d23ba57d1004197a0` before any edit.

## 2. Change

| File | Change |
|---|---|
| `src/ipc/brokerImportComposition.ts` | new — resolves the governed identity dependencies and builds the consumer's own `MapBrokerImportHoldingsOptions` |
| `src/ipc/entrypoint.ts` | `compose` startup phase; consumer composed with the dependencies; `brokerImportIdentity` provenance on the success outcome |
| `docs/DIRECT_P1_PROVISIONING.md` | startup-order table and phase description updated |
| `tests/direct_p1_handoff_doc_conformance.test.ts` | matches the updated startup-order text |
| `tests/stage4_broker_import_composition_root.test.ts` | new — 12 composition-root / integration tests |

The composition module adds no qualification logic. It calls the same governed accessors the
market-data daemon already uses:

- `getGovernedBroadSecurityMaster()` — governed D05 authenticated universe (P04),
  batch `BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001`, 2,390 records;
- `loadGovernedP7InstrumentRegistry()` — the retained `evidence/dhan-p7/qualification-manifest.json`
  reader (P7), 96 qualified mappings.

If the retained P7 manifest is absent the registry is empty, so qualification fails closed with
`MISSING_P7_MAPPING`. No mapping is invented, inferred or backfilled.

## 3. Fail-closed composition

Startup order is now `validate → connect → migrate → verify → compose → bind`. A governed source
that cannot be composed returns `{ ok: false, phase: 'compose', error }` and binds no endpoint.
There is no fallback to an unqualified consumer.

## 4. Executed evidence

`tests/stage4_broker_import_composition_root.test.ts` — 12/12 pass:

1. the composition module resolves the governed D05 master and the retained P7 registry, and the
   fixture holding still qualifies through `qualifyHoldingSecurityIdentity`;
2. an explicit dependency seam is honoured verbatim;
3. **invocation evidence** — a composed consumer is driven with instrumented wrappers around the
   real governed methods, proving `resolveCompanyId` is queried with the holding ISIN at the import
   `asOf`, and `resolveSecurity` is scoped to `(P04-resolved companyId, BSE_EQ, ISIN)`; the outcome
   is still `WRITE_NOT_AUTHORIZED` / `storeEffect: 'NONE'` with zero rows written;
4. an empty registry (P04 correspondence present, no P7 series evidence) fails closed;
5. a conflicting second series for the same `(company, segment, ISIN)` fails closed as ambiguous;
6. the pre-Stage-4 fallback remains reachable only when no dependency is supplied — executable
   contrast, and the shipped entrypoint never takes that path;
7. `startIpcServer` reports `brokerImportIdentity` (`securityMasterRevision`,
   `registryMappingCount > 0`), and its consumer still refuses with zero store effect;
8. a caller-supplied seam is reported honestly (`securityMasterRevision: null`, `0` mappings) and
   still refuses;
9. a governed source that cannot be described refuses startup at phase `compose` with no handle;
10–12. `evaluatePortSaveGuard()` is still `authorized: false` with unchanged reasons; the composition
   module contains no qualification logic, provider client or network call; the consumer still binds
   `DurablePortfolioStorePort`, and `dispatch.ts` still cannot reach the consumer.

Supporting runs:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| `npm test` (guarded) | 1427 executed · 1426 pass · 0 fail · 1 skipped |
| Targeted Stage 4 + consumer wiring + composition (4 files) | 57/57 pass |
| `npm run test:package-consumer` | PASS (`forbiddenHits: []`, strict typecheck) |
| Shipped CLI boot (`dist/src/ipc/entrypoint.js`) | starts, serves the bound endpoint, exits cleanly on SIGTERM |

The fixture holding is Reliance Industries, `INE002A01018`, BSE, series `A` — a governed source fact
in both the D05 master and the retained P7 manifest, so the invocation assertions rest on real
governed evidence rather than a synthetic mapping.

## 5. What this does not claim

- **Not a write authorization.** `evaluatePortSaveGuard()` is unchanged: W-1(3) and W-1(4) remain
  unmet, so every import still returns `WRITE_NOT_AUTHORIZED` with `storeEffect: 'NONE'`. The
  composed path *qualifies* an identity and is then refused by the write gate.
- **Not Gate 4 or Gate 5 work.** Neither gate status, criterion, nor evidence state changes.
- **Not production qualification, acceptance or deployment.** No live Dhan access, no credential
  resolution, no provider connection. `isinAuthority` remains `NON_AUTHORITATIVE`.
- **No identity-master change.** D05 corpora, P7 manifest, `qualifyHoldingSecurityIdentity`,
  `mapBrokerImportHoldings` and `persistBrokerImport` are untouched.
- **No IRR write.** IRR is read-only and unmodified.
- **Coverage boundary.** The suite proves the dependencies are supplied and invoked, and that the
  outcome is typed and refused. Because the write gate refuses before any store transaction, the
  persisted `security_identity` column cannot be observed end-to-end through the shipped path in
  this build; that remains a Gate 4 prerequisite, not a Stage 4D omission.
