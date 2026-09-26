# Institutional Investment Platform System (IIPS)
# GP-5 — Persistence Tier / Hosting — Decision Record

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-5-persistence-tier-hosting-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority)
**Recording Agent:** Arena (recording only — no tier, provider, or hosting option selected or ranked)
**Act Type:** DECISION RECORD (non-executable; GP-5 NOT ESTABLISHED)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `360e2f7a52b9ecf0d0bcb32de0a83837a565563e`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `360e2f7a52b9ecf0d0bcb32de0a83837a565563e` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote`, remote-tracking ref, GitHub API all agree |
| Worktree | CLEAN |
| Preconditions re-verified | 16/16 |

## 2. DETERMINATION

```text
GP-5 = NOT ESTABLISHED
REASON = HOSTING / TIER AUTHORITY NOT YET DESIGNATED
```

No authoritative record in this repository designates a persistence tier or hosting boundary.
No tier was selected, inferred, or ranked by the recording agent.

## 3. EVIDENCE — CLASSIFIED

| # | Area | Finding | Class |
| --- | --- | --- | --- |
| E-1 | Existing server tier | `server/`, `backend/`, `api/`, `services/`, `worker/`, `frontend/server/`, `frontend/api/`, `src/server/`, `src/api/` — all 9 absent | **NOT FOUND** |
| E-2 | Frontend / backend separation | `frontend/` exists; no backend counterpart; 0 tracked source files contain a server-listen construct | **FACT** |
| E-3 | Deployment records | 16 candidates absent, including `.github`, `.gitlab-ci.yml`, `Dockerfile`, `docker-compose.yml`, `Procfile`, `k8s`, `helm` | **NOT FOUND** |
| E-4 | Hosting declarations | 12 candidates absent, including `vercel.json`, `netlify.toml`, `fly.toml`, `render.yaml`, `app.yaml`, `wrangler.toml` | **NOT FOUND** |
| E-5 | Infrastructure as code | `terraform`, `main.tf`, `infra`, `pulumi`, `cdk`, `cloudformation.yml`, `serverless.yml`, `ansible` — all absent | **NOT FOUND** |
| E-6 | Environment configuration | 0 tracked `.env*` files; the only tracked config is `vite.config.ts` | **NOT FOUND** |
| E-7 | Package / dependency declarations | Single manifest; `dependencies` = `react-router-dom` only; zero database drivers, ORMs, server frameworks, or cloud SDKs | **FACT** |
| E-8 | Persistence runtime boundaries | 0 filesystem write calls and 0 database-driver imports in product source | **FACT** |
| E-9 | Architecture / governance records | GP-1 §6 records `GP-5 — NOT AUTHORIZED BY THIS ACT`; the post-GATE-P packet records GP-5 as `NOT FOUND`; the GATE-P findings record notes no server tier exists to host persistence | **EXISTING AUTHORITY** |
| E-10 | Client-local storage mechanisms | 0 uses of `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, or the Cache API | **NOT FOUND** |
| E-11 | Explicit hosting / tier designation | Every tracked occurrence of a hosting/tier token is a denial, a dependency statement, or a gap note — none is a designation | **NOT FOUND** |
| E-12 | M-1 designated class vs available structures | M-1 designates a DURABLE / TRANSACTIONAL / APPLICATION-OWNED RELATIONAL target; no structure in the repository can host such a target today | **EXTERNAL DEPENDENCY** |

### 3.1 Near-misses examined and rejected as authority

| Item | Examination | Outcome |
| --- | --- | --- |
| `vite.config.ts` `server:` block | Configures the local dev server only (`port`, `host`, `allowedHosts`), carries an in-file annotation that it is LOCAL DEV ONLY and not a production setting, introduces no provider, socket, or credential, and leaves `npm run build` output unaffected | **NOT hosting authority** — development tooling is not a production tier |
| `build.outDir: 'dist-frontend'` | Names a local build output directory | **NOT hosting authority** — a build path is not a deployment target |
| Tier-A / Tier-B model | `useMemo` and module-level singletons in `App.tsx`, `portfolio-store.ts`, `PortfolioWorkspace.tsx` providing **session-lifetime continuity** in the browser process | **NOT persistence hosting** — in-process session state, lost on reload |
| Provider-name scan of the tracked `.docx` | A case-insensitive scan over the raw blob matched, but text extraction from the document XML yields **0** provider tokens; the match was binary container noise | **NOT FOUND** — no provider is named |
| `windows-acceptance-evidence/` | A single visual acceptance record | **NOT a hosting declaration** |

Technical presence is not authority, and absence of a tier is not permission to create one.

## 4. DECISION BOUNDARY — WHAT ONLY RAMKI CAN SUPPLY

GP-5 requires an explicit RAMKI designation of the persistence tier / hosting boundary. The
following remain undetermined. They are recorded as an undetermined space, **not** as a
recommendation, **not** ranked, and **not** an implementation plan. No provider is named.

| # | Undetermined dimension |
| --- | --- |
| H-1 | Execution location class for the persistence tier |
| H-2 | Operating ownership of that tier |
| H-3 | Network boundary and reachability |
| H-4 | Environment separation between development, test, and production |
| H-5 | Provider — reserved entirely to RAMKI; not selectable by the recording agent |

## 5. AUTHORITY STATES — PRESERVED

| Gate | State |
| --- | --- |
| `GP-1` | **ESTABLISHED** |
| `GP-2` | **ESTABLISHED** |
| `GP-3` | **NOT AUTHORIZED** |
| `GP-4` | **UNRESOLVED / BLOCKED** |
| `GP-5` | **NOT ESTABLISHED** |
| `GP-6` | **NOT AUTHORIZED** |

| Authority | State |
| --- | --- |
| `IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `PERSISTENCE_IMPLEMENTATION_AUTHORITY` | **NOT GRANTED** |
| `STORAGE_PROVISIONING_AUTHORITY` | **NOT GRANTED** |
| `HOSTING_AUTHORITY` | **NOT GRANTED** |
| `DEPLOYMENT_AUTHORITY` | **NOT GRANTED** |
| `TRANSPORT_AUTHORITY` | **NOT GRANTED** |
| `PAYLOAD_DATA_AUTHORITY` | **NOT GRANTED** |
| `CREDENTIAL_AUTHORITY` | **NOT GRANTED** |
| `PROVIDER_ACTIVATION` | **NOT GRANTED** |
| `D115_IDENTITY_AUTHORITY` | **UNCHANGED** — WITHHELD / UNRESOLVED / NOT AUTHORIZED |
| `PRODUCTION_AUTHORITY` | **UNCHANGED** — `productionEligible: false` |

| Item | State |
| --- | --- |
| M-1 | **DESIGNATED** — durable / transactional / application-owned relational, provider-neutral |
| M-2 | **DESIGNATED** — P-A through P-F |
| M-3 | **DESIGNATED** — durable, transactional, owned, governed retention |
| M-4 | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** |
| M-5 | **GP-5 — NOT ESTABLISHED** (this record) |
| M-6 | **GP-3 — NOT AUTHORIZED** |
| `GATE-Y` | **NOT SELECTED / NOT OPENED** |

## 6. PRESERVATION

No existing record was modified. `A-1`, the GATE-P selection record, the GATE-P findings record,
the post-GATE-P authority packet, `GP-1`, all three `GP-2` records, the RAMKI Determination Act,
the D8 historical position, and all frozen qualification, certification, and release records
remain byte-identical. No source, test, configuration, deployment, or runtime file was touched.
No dependency was added. This act is purely additive.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 7. NEXT AUTHORITY ACTION (not authorized by this act)

An explicit RAMKI designation of the persistence tier / hosting boundary, addressing H-1..H-5.
Until that is recorded, GP-5 remains NOT ESTABLISHED and no persistence implementation,
provisioning, hosting, deployment, transport, credential, provider-activation, or production
step is authorized.

---

**End of Decision Record. GP-5 NOT ESTABLISHED. No implementation authorized, performed, or implied.**
