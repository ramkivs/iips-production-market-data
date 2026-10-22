# Cross-repository carrier — IRR `CV-CORR-64` Group E reconciliation (transport artifact)

**Date:** 2026-10-22 (UTC)
**Status:** transport artifact for a **blocked IRR publication**. This is **not** an IPD product change, **not** a second tracker, and **not** a governance act.

| Item | Value |
|---|---|
| Artifact | `evidence/cross-repository/irr-cv-corr-64-gov-reconciliation-2026-10-22.patch` |
| Produced from IRR commit | `665102a63e77dc8c6662bde4c38adae382f6a14f` (tree `07cfb21cd812b972ef8eeea2984abbbd47e9797f`), branch `arena/group-e-gov03-04-05-2026-10-22`, based on IRR `main@685a804d2da3f1074af1481ddd86d6a26f04fd75` |
| Patch size / SHA-256 | 115,546 B / `275dba16b3ef882ee679f3a4eede57b9a85f2401d603b7a17d68e17302bad781` |
| Contents | 5 paths, `+419 / −14` — the IRR tracker (`CV-CORR-64`, §16.82, `CHG-2026-10-22-18`, `V314`–`V331`), the new record `docs/integration/IIPS_v3.0_GOV03_MERGE_AND_GOV04_GOV05_RECONCILIATION_2026-10-22.md`, a dated correction appended to `docs/integration/IIPS_v3.0_GOV04_OPERATIONAL_BLOCKERS_AND_GOV05_PREREQUISITES_2026-10-22.md`, and the `V1_TO_G2_ENVELOPE_GAP.renamedInV1` restoration with its three test assertions in `frontend/server/user-portfolio/ipcPortAdapter{.test,}.ts` |
| Why it is here | IRR `contents:write` is **denied** to the publishing installation for this pass: `git push` → `403 Permission to ramkivs/iips-review-recovered.git denied`, `POST /repos/…/git/refs` → `403 Resource not accessible by integration`. IPD `contents:write` is available, so the change is carried here as a self-verifying patch rather than left only in a sandbox. |
| IRR-side record of the boundary | IRR issue **#200** |
| Authoritative tracker | remains **IRR** `IIPS_V3_E2E_MASTER_TRACKER_AND_IRR_IPD_DECISION_REGISTER_2026-10-13.md` on IRR `main`. This file is a carrier, not a register. |

## Reproduce and verify

```bash
git clone https://github.com/ramkivs/iips-review-recovered.git irr && cd irr
git checkout 685a804d2da3f1074af1481ddd86d6a26f04fd75     # IRR main at artifact creation
sha256sum ../irr-cv-corr-64-gov-reconciliation-2026-10-22.patch   # 275dba16…bad781
git am ../irr-cv-corr-64-gov-reconciliation-2026-10-22.patch
# resulting commit tree must equal 07cfb21cd812b972ef8eeea2984abbbd47e9797f
cd frontend && npx tsc --noEmit \
  && npx vitest run server/user-portfolio/ipcPortAdapter.test.ts \
  && npm test
```

Expected IRR results at that tree: `tsc --noEmit` exit 0; adapter suite **46/46**; full suite **87 files / 1,077 passed / 0 failed**; `npm run build` exit 0.

## Boundaries

Nothing in this artifact grants a gate, authorizes a write, admits a lineage, lifts a `503` fence, claims `durable: true`, or renders a Program Authority decision. Its four decision requests (`DR-1` provisioning basis, `DR-2` seven fields + three renames, `DR-3` `durability`/`durable`, `DR-4` contribution schema) are **requests**, not determinations.

If a later installation receives IRR `contents:write`, apply this patch to IRR `main`, drop this carrier file, and record the publication receipt in the tracker as the normal flow requires.
