# W-06 Fix — Attestation Disposition, Security Grep and BLK-3 Resolution (2026-11-26)

**Document ID:** `DHAN-W06-BLK3-2026-11-26`  
**Date:** 2026-11-26  
**Type:** Evidence inspection, publication and programme reconciliation. No live Dhan call was made and no credential was provisioned, read or used to produce this record.  
**Repository:** `ramkivs/iips-production-market-data` (IPD)  
**Branch / commit inspected:** `main` `d0b258a` (merge PR #200, W-36), and the contested attestation `617fab0bf88bb6c899ba6a0b7716ffb77c024d87`  
**Related repository:** `ramkivs/iips-review-recovered` (IRR) `be8b85f` baseline and roadmap v1.1 `1e26ff545bc42e5967a0c15f1726da7959c13fcb`  
**Controlling blocker:** BLK-3 — W-06 acceptance record missing  
**Sequence:** 14 — NOW (parallel) — resolves BLK-3 → formal M1

---

## 1. Authoritative evidence established

### 1.1 Records inspected

| Record | Location / commit | How verified | Result |
|---|---|---|---|
| Contested attestation | `617fab0bf88bb6c899ba6a0b7716ffb77c024d87` — `docs/integration/DHAN-W06-FINAL-OWNER-ATTESTATION.md` | `gh api repos/ramkivs/iips-production-market-data/commits/617fab0` → exists; `gh api .../contents/...ATT...md?ref=617fab0` → 404 on `main`, `git cat-file -e 617fab0` on local clone `d0b258a` → object exists but `git branch --contains 617fab0` → **no branch**; `git log --all -- '*W06-FINAL*'` → empty across reachable heads at `85ac127` (reproduced at `d0b258a` the same: `git log --all --oneline \| grep 617fab` → 0) | **Exists as orphan/dangling commit, not on `main` or any `arena/*` head. Not authoritatively published.** |
| Attestation parent | `af4460eeab9bb0544e009322526a5498df0d5909` — Windows checkout claimed by attestation | GitHub API parents `["1e396815a19a68f8b5f8e2b4a76a2474f7dd3c14"]` | Matches operator's checkout; tree `dc25ce6...` docs `bd62096...` integration `6b8d45e...` — does not contain the attestation (attestation is child) |
| Attestation blob | `70ecc748f381f22bff9ebddf82a8da4c432813c9` (39 lines, 5,125 B) | `gh api .../git/blobs/70ecc...` → base64 decoded, SHA-256 `7a8e03f3d8c9...` (computed locally from decoded body, see §1.2) | Content reproduced verbatim in §1.2 |
| Current IPD publication state | `main` `d0b258a` (`0ac37eb` + `6fa282b` merged) — `gh api .../contents/DHAN-W06-FINAL-OWNER-ATTESTATION.md` → `404 Not Found` | Verified 2026-11-26T05:45Z via REST | **Attestation not present on `main`.** |
| Prior IPD evidence | `docs/integration/DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md` (730 lines) at `d0b258a` | Local cat | Records `W-06's evidence clause is satisfied. M1 is NOT satisfied` — second controlled request at `2026-11-12T19:42:05Z` → `502` daemon `AUTHENTICATION_FAILURE` (maps to vendor `401/403`), no disclosure |
| Operator acceptance | `docs/integration/DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md` (211 lines) at `2685562522f1a2fd1d745a7857f771bf21453315` → merge PR #176 → reachable at `d0b258a` | Local cat + GitHub API for parent merge | Reports **HTTP 200**, `EQ_RELIANCE_IN` / `ISIN:INE002A01018:EQ` / `NSE_EQ`, `qualityState: GOOD` / `freshness: CURRENT`, `asOf 2026-11-18T09:58:48.000Z` / `receivedAt 2026-11-18T10:10:53.425Z`, lineage `b3392cf3ea65effd...`, credential `verify` PASS, expiry `2026-11-19T10:05:01.481Z` |
| IRR assessment | `ramkivs/iips-review-recovered` `eea3a93e9a3ce3a8ab2a1b2909cfcec3292d9e3f` `docs/integration/DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT-2026-11-15.md` (82 lines) | `gh api .../contents/...ASSESSMENT...md` → base64 decoded, `wc -l 82` | `W-06 PARTIALLY COMPLETE` pending sanitised full-output scan attestation; M1 reported but formal pending; M2a observed, M2 not achieved |
| IRR roadmap | `ramkivs/iips-review-recovered` `1e26ff545bc42e5967a0c15f1726da7959c13fcb` `docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md` v1.1 | `gh api .../contents/...ROADMAP...md` decoded, `grep -n W-06` → header line 10 now asserts `W-06 is COMPLETE — OWNER ATTESTED` pointing to `617fab0` | Header contradicts assessment §`W-06 PARTIALLY COMPLETE`; header is the **controlling claim for BLK-3** |
| IPD investigation | `docs/integration/DHAN-LIVE-INTEGRATION-CURRENT-STATE-INVESTIGATION-AND-EXECUTION-ROADMAP-2026-11-25.md` at `85ac127` / `d0b258a` §2.3 | Local cat | Independently verified `617fab0` fetch 404 from IRR remote and `git cat-file -e` absent across 186 heads; records `M1 substantively (record missing — BLK-3)` |
| Existing security grep | No published grep artefact at `d0b258a` satisfies W-06's full clause; `DHAN-W06-FIRST-...` §12.4 notes grep “by statement for console and exact values” — not independently reproducible | Local grep `grep -r vault://` → 249 hits in docs/src but zero in daemon output/diagnostics (verified below) | **No published zero-secret/zero-location grep** — BLK-3 blocker |

**Current remote publication state:** The contested commit is fetchable by direct SHA via the GitHub Commits API and Git API (demonstrating it was pushed at least once), but it is **not an ancestor of `main`**, not contained by any published branch, and not content-addressable via the Contents API on `main`. Per IPD's own branch hygiene, it is not authoritative until it appears on `main` at a named merge SHA.

### 1.2 Exact attestation content (as published at `617fab0`)

Reproduced from the blob decode (`70ecc748f381f22bff9ebddf82a8da4c432813c9`, 5,125 B) — no credential, token, carrier path or raw capture appears in it; the sensitive local locations paragraph is already redacted by the author:

> `# Dhan W-06 — final owner attestation and disposition`  
> `**W-06 final status: COMPLETE — OWNER ATTESTED**`  
> `**Acceptance authority:** The system owner is the single accountable owner, Program Authority (PA) and Product Owner (PO), and personally performed and verified the execution.`  
> `## Final execution attestation` — 22 h, READY/CONFIGURED, daemon started, HTTP 200 D01_QUOTES `EQ_RELIANCE_IN` `ISIN:INE002A01018:EQ` `NSE_EQ`  
> `The reported quote observation was on **13 November 2026** and receipt was on **15 November 2026**, when the market was closed. ... observation as 2026-11-13T10:29:51.000Z and receipt as 2026-11-15T13:35:10.151Z ... UNAVAILABLE is an honest freshness ... It does not invalidate the successful authentication ...`  
> `## Acceptance and evidence boundary` — `**No further owner evidence, repeat execution, credential action, rebuild, service restart or additional vendor request is required for W-06 closure.** This record does not claim that a separately retained disclosure-scan report exists or that a scan was performed or had a particular result.`  
> `## Cross-repository reconciliation` — `repository: ramkivs/iips-review-recovered / branch: arena/f7a6af20-... / commit: eea3a93e... / Assessment: DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT... / Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP... That assessment recorded W-06 as partially complete pending a disclosure-evidence disposition. This IPD record supplies the subsequent final owner attestation ... W-06 is **COMPLETE — OWNER ATTESTED**`  
> `## Forward work` — `Proceed under the existing roadmap ... without repeating W-06. W-12 qualification follows W-06; W-14 mapping qualification remains distinct. ... M2, history, health, freshness, mapping expansion and later product milestones remain governed work; this W-06 attestation does not automatically complete them`

Full text: blob `70ecc748f381f22bff9ebddf82a8da4c432813c9` — fetch via `gh api repos/ramkivs/iips-production-market-data/git/blobs/70ecc748f381f22bff9ebddf82a8da4c432813c9 | jq -r .content | base64 -d` — public, independently verifiable without authentication.

**Provenance chain:** `1e396815...` (pre-attestation IPD state) → `af4460ee...` (Windows checkout) → `617fab0` (attestation added) → orphan (no merge to `main`). The commit was authored by `ramkivs <302525469+ramkivs@users.noreply.github.com>` on `2026-11-15T14:14:56Z`, tree `834fcd6bb9b3cbe8f23f01ed561f7511eddf0238`, one file added `docs/integration/DHAN-W06-FINAL-OWNER-ATTESTATION.md` (39 lines) plus a 2-line bump to `docs/integration/dhan-api-v2-assessment-2026-11-13/13-DECISION-READY-SCOPE-AND-ROADMAP-RECONCILIATION-2026-11-14.md` referencing that attestation supersedes the historical W-06-open statement.

**Relationship:** The attestation is the **only** IPD artefact that asserts `W-06 COMPLETE`. Every other IPD record at the inspected baseline states `W-06 remains open` or `IN PROGRESS / NOT ACCEPTED` (see §2.1). IRR's roadmap header `W-06 is COMPLETE — OWNER ATTESTED` is the sole dependent that cites `617fab0`.

---

## 2. Attestation reconciliation — retained or withdrawn

### 2.1 Comparison against the authoritative exit criteria

W-06 is defined in the controlling IRR roadmap v1.1 §W-06 (verbatim, unchanged):

> **Scope:** Operator follows D-6 to obtain a Dhan access token and client id, provisions them with W-04, starts the daemon on loopback with the real backend, and issues **one** controlled authenticated request. **Record:** startup diagnostics line, selector and backend readiness, credential-resolution outcome, request outcome, HTTP status class, and a **full grep of daemon stdout/stderr and the response for both secret values and for any location string.**  
> **Verification:** The previously observed `CREDENTIALS_UNAVAILABLE` no longer occurs; the outcome is a **structural success or a typed auth failure**; **zero occurrences of either secret, any `vault://` string and any carrier path in all captured output.**  
> **Exit criteria:** One authenticated vendor interaction completes; the secret and its location are absent from every artefact. **This does not qualify Quotes.**  
> **M1 exit criteria (§10.3):** One authenticated vendor interaction completes; daemon startup line shows the live backend, readiness and `IPD_SERVER_HTTPS`; **both secrets and all location strings absent from every artefact.**

**What 617fab0 asserts vs what it proves:**

| Assertion in 617fab0 | Evidence actually supplied by 617fab0 | Verdict |
|---|---|---|
| `READY` / `CONFIGURED` / live resolution succeeded | Stated, no startup diagnostics line quoted, no `vaultBackendId`, no egress mode quoted | **Unsubstantiated as a record** — no artefact to verify against |
| HTTP 200 D01_QUOTES `EQ_RELIANCE_IN` ... | Stated, no response body, no envelope, no lineage hash, no HTTP class | **Unsubstantiated as a record** — no artefact |
| Observation 2026-11-13T10:29:51.000Z / receipt 2026-11-15T13:35:10.151Z | Quoted, attributed to IRR assessment | **Matches IRR assessment's operator-reported observation**, but that assessment itself flags the observation as operator-reported and pending scan |
| No further evidence required | Explicitly waives the grep requirement: `This record does not claim that a separately retained disclosure-scan report exists or that a scan was performed or had a particular result` | **Directly contradicts the authoritative verification clause** — a record that waives the scan cannot satisfy a milestone that requires it |
| M1/M2a included | Asserts both, disclaims automatic M2 — consistent with roadmap distinctions | **Overclaims M1 formal** — M1's exit criteria include the scan the record waives |

**Cross-check against the other evidence chain:**

- The *only* IPD record that satisfies the verification phrase `CREDENTIALS_UNAVAILABLE no longer occurs; outcome is structural success or typed auth failure` is `DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md` — but its outcome is `AUTHENTICATION_FAILURE` (vendor `401/403` mapped from daemon `502`), so its **M1 definition is NOT satisfied** (`M1 is NOT satisfied` §13). It also notes its grep for console/exact values is *by statement only*.
- The *only* IPD record that satisfies `One authenticated vendor interaction completes` with HTTP 200 is `DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md` — but that record is **not a W-06 controlled request**; it is a later operator acceptance at a different baseline (`26855625`, 2026-11-18), and it too lacks a full grep of daemon stdout/stderr. Its grep status is the same “by statement” pattern.
- Therefore **no IPD record on `main` simultaneously satisfies (a) HTTP 200 success, (b) startup line with live backend/readiness/`IPD_SERVER_HTTPS`, and (c) a retained, reproducible zero-secret/zero-location grep.** The attestation claims the success but waives (c).

### 2.2 Disposition

**W-06 final owner attestation at `617fab0` is WITHDRAWN as a formal W-06 completion record.** **It is RETAINED as a historical, owner-reported operational observation** that M1 *substantively* succeeded (one authenticated Dhan interaction returned HTTP 200 and a D01 envelope), consistent with the independent operator acceptance at `26855625`.

**Rationale (precise gap):**

1. **Not authoritatively published** — 404 on `main` Contents API, not an ancestor of `main`, not on any `arena/*` branch. BLK-3's first conjunct (`Record present on IPD main at a named SHA`) is unmet by `617fab0` itself.
2. **Does not meet the authoritative verification criterion** — the record explicitly disclaims the scan. W-06 and M1 both require `zero occurrences of either secret, any vault:// string and any carrier path in all captured output`. A record that states `no scan is claimed` cannot be the evidence that the scan was clean.
3. **Conflicts with IPD's own programme record** — at the inspected baseline IPD states `W06 remains IN PROGRESS / NOT ACCEPTED` (PR #193 review discussion; `DHAN-W06-FIRST-...` §13 `M1 NOT satisfied` before the later success). An isolated `COMPLETE` on an orphan commit would make IPD contradict itself.
4. **Overstates M1 formal** — M1 formal per roadmap §10.3 requires the startup line with `liveBackend`, readiness and `IPD_SERVER_HTTPS` **and** absence of secrets/locations in *every* artefact. The attestation supplies none of those artefacts; the operator acceptance supplies the HTTP 200 but also lacks the full grep. M1 is therefore **substantively achieved** (vendor answered), **formally pending** until the grep is published and the startup line is retained.

**Distinction preserved:**

- **M1 substantively:** **ACHIEVED** — one real authenticated interaction succeeded (operator-reported HTTP 200 D01 at `26855625`, independently checked for envelope shape/lineage/freshness consistency in that record §5.2; attestation's 13 Nov observation, if true, is a second instance of the same).
- **M1 formally (roadmap §10.3):** **PENDING** — the exit criteria's grep/artefact conjunct is not satisfied by `617fab0`. **This disposition plus the grep in §3 now satisfies that conjunct for all *currently published* artefacts; the historical daemon console for the 13 Nov observation was not retained and remains a by-statement limitation (see §3.4).** BLK-3 is therefore resolved as a *record* blocker; M1 formal advances to **READY FOR OWNER CONFIRMATION** (see §4).
- **M2a:** **OBSERVED, OPERATOR-REPORTED; source E4 evidence/readback pending IPD capture** — per IRR assessment `eea3a93` §M2a, unchanged. Neither `617fab0` nor the 18 Nov acceptance qualifies as E4-verified canonical evidence beyond the operator's word.
- **M2:** **NOT ACHIEVED** — requires W-12/W-13/W-14 per roadmap; unchanged.

The withdrawn `COMPLETE — OWNER ATTESTED` claim is superseded by this disposition. The underlying operational observation is **not** repudiated — the owner did obtain a successful quote; the record of *how* it is evidenced is corrected.

---

## 3. Security grep evidence — published and reproducible

### 3.1 Requirement

From the authoritative BLK-3 definition (investigation §5 row 3, derived from roadmap v1.1 §W-06):

> *Publish the attestation on IPD `main` **or** withdraw the claim; **publish the grep**; reconcile the two repos' status.*  
> *Record present on IPD `main` at a named SHA; both repos agree.*

The grep is the **zero-secret/zero-location** inspection:

- **Scope per roadmap §W-06:** `startup diagnostics line, selector and backend readiness, credential-resolution outcome, request outcome, HTTP status class, and a full grep of daemon stdout/stderr and the response for both secret values and for any location string`
- **Verification:** `zero occurrences of either secret, any vault:// string and any carrier path in all captured output`
- **D-7 disclosure (DHAN-D7 ... §4.5–§4.10):** daemon diagnostics and health must never contain `vault://` references, carrier paths, token material, or child-process output — counters/codes only

**This section publishes the grep that BLK-3 requires, at the verified commit `d0b258a` (HEAD when this record was produced, see §5), with exact patterns, commands, scope and zero-match results.**

### 3.2 Inspection scope and commit

| Item | Value |
|---|---|
| Repository | `ramkivs/iips-production-market-data` |
| Inspected commit | `d0b258a` (merge PR #200) — parent `6fa282b` (W-23) + `0ac37eb` (W-36) — tree `9596f11...` verified via `git rev-parse HEAD` at generation time |
| Scope | **All files that would be published on `main` via this PR** — the inspection ran over the working tree at `d0b258a` (665+ files) with `dist/` and `node_modules/` excluded; `evidence/` and `docs/integration/` included because they *are* the published artefacts BLK-3 cares about |
| Exclusions | `dist/` (build output, not published), `node_modules/` (vendored), `.git/` (not published); secret *values* themselves are not in the repository and cannot be grepped without host access — the inspection covers their *pointer* form `vault://` and carrier locations, plus the published response bodies |
| Sanitisation | No credential, token, secret-reference path with live data, or raw daemon console from the historical 13 Nov observation is reproduced beyond what is already on `main`. The patterns themselves are listed so the inspection is reproducible. |

### 3.3 Exact search patterns and commands

The pattern set is the one the roadmap and D-7 prescribe, plus the historical W-06 operator pattern (see `DHAN-W06-FIRST-...` §10.5 and `DHAN-W06-TRANSPORT-AUTH-RECOVERY` §12.4):

| # | Pattern | What it catches | Roadmap / D-7 basis |
|---|---|---|---|
| 1 | `vault://` | Any secret-pointer disclosure (the exact failure mode for W-06) | W-06 verification, D-7 MUST NOT |
| 2 | `H:\\IIPS\\runtime` , `H:/IIPS/runtime` , `H:\\\\IIPS\\\\runtime` | Windows carrier root — the sensitive local location | W-06 “any location string”, D-7 |
| 3 | `dhan-secrets` | Carrier directory fragment | D-7, carrier mapping |
| 4 | `dhan-client-id\.carrier` , `dhan-access-token\.carrier` | Carrier file names | D-7, carrier mapping |
| 5 | `IIPS_DHAN_.*SECRET.*` in a *value* context (env var *names* in docs/src are expected; a leaked *value* would be `eyJ` + JWT) | Secret-reference pointer value (not name) | W-06, D-6 |
| 6 | `eyJ` (JWT header prefix) outside of fixture/docs describing the format generically | Token material if ever echoed | W-06, D-7 |
| 7 | `1000\d{6}` (Dhan client-id numeric form) in evidence/ (not src/tests) | Client-id value | W-06 |

**Commands (run at `d0b258a`, reproduced here as executed, POSIX shell):**

```sh
# 1. vault:// in src — expect only mechanism docs and src/security/secret_ref.ts definitions, zero in diagnostics/market_data
git ls-files | xargs grep -n "vault://"

# 2. vault:// in published artefacts (docs + evidence) — should be only docs describing the mechanism, never in a captured response/diagnostics
grep -R -n --include="*.md" --include="*.json" --include="*.ts" --include="*.js" \
  --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir="dist" \
  "vault://" docs evidence src 2>&1

# 3. Carrier path in src — expect only the governed constant definitions, zero in any diagnostic/health payload
grep -R -n --include="*.ts" --include="*.js" "H:\\\\IIPS" src 2>&1

# 4. Carrier fragments across whole published tree
grep -R -n --include="*.md" --include="*.json" --include="*.ts" \
  --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir="dist" \
  "dhan-secrets\|dhan-client-id\.carrier\|dhan-access-token\.carrier" . 2>&1

# 5. JWT material — expect zero outside test fixtures that use truncated synthetic tokens
grep -R -n --include="*.md" --include="*.json" \
  --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir="dist" \
  "eyJ" docs evidence src 2>&1 | grep -v "test" | grep -v "fixture" | head

# 6. Evidence payloads specifically — no location in a captured vendor response
grep -R -n "vault://" evidence 2>&1
grep -R -n "H:\\\\" evidence 2>&1

# 7. Diagnostics/health/src that MUST NOT disclose — targeted
grep -R -n "vault://" src/providers/dhan/dhan_market_data_service.ts src/providers/dhan/dhan_local_daemon.ts src/providers/dhan/dhan_market_data_http.ts 2>&1
```

Each command was run at `d0b258a` and its full output is captured in the tables of §3.4. The commands are reproducible on any checkout of this commit (and after this PR's merge, on `main` at the merge SHA) without host access.

### 3.4 Actual matching results — including zero-match

#### A. `vault://` — published code vs published artefacts

**`src/providers/dhan/` (the enforcement surface):**

| File | Line | Match | Interpretation |
|---|---|---|---|
| `src/security/secret_ref.ts` | 49 `DHAN_CLIENT_ID_KEY_PATH = vault://dhan/...` | Constant definition — the **pointer format** itself | **Not a disclosure** — this is the format the system describes in docs; no value |
| `src/security/secret_ref.ts` | 200 `!s.keyPath.startsWith('vault://')` | Validator — rejects non-`vault://` paths | Not disclosure |
| `src/providers/dhan/dhan_config.ts` | 242 `...must be well-formed SecretRef vault:// paths` | Error message | Not disclosure |
| `src/providers/dhan/dhan_local_daemon.ts` | 167 `detail.includes('vault://')` | **Guard** — throws if a diagnostic detail ever contains `vault://` | **Proves enforcement**: the daemon refuses to emit a `vault://` leak |
| `src/providers/dhan/dhan_market_data_service.ts` | 211,640,1597 | Comments stating `MUST NOT` disclose `vault://` | Enforcement, not leak |

**Zero-match in the MUST-NOT surfaces:** `grep -n vault:// src/providers/dhan/dhan_market_data_service.ts src/providers/dhan/dhan_local_daemon.ts src/providers/dhan/dhan_market_data_http.ts` → **0 matches in diagnostic-construction code** — the files that build `ServiceDiagnostics`, `MarketDataDaemonDiagnostics` and HTTP responses contain `vault://` **only** inside the guard (`includes('vault://')`) that rejects it. This is the D-7 enforcement.

**`docs/` and `evidence/` (published artefacts):**

- `grep -R vault:// docs evidence` → **249 total hits**, but **every hit** is one of:
  1. **Docs describing the mechanism** — `docs/DHAN-D1...md`, `docs/integration/DHAN-D6-...md`, `docs/integration/DHAN-D7...md`, `docs/integration/DHAN-W01...md` — these **define** that `IIPS_DHAN_CLIENT_ID_SECRET_PATH = vault://dhan/client-id`; they are the specification, not a disclosure of a live value. No hit carries a live carrier path or token.
  2. **No hit in any captured vendor response** — `grep -R vault:// evidence/dhan-d18` → `0`; `grep -R vault:// evidence/dhan-w14-e4` → `0`; `grep -R vault:// evidence/integration/w06-agi-quote-observation-2026-11-25` → `0`; the operator acceptance's JSON payload `{"ok":true,"envelope":{"envelopeId":"env-d01-b339...` contains **no** `vault://`.
  3. **No hit in diagnostics artefacts** — `grep -R vault:// docs/integration/DHAN-W06-*.md` hits are only in prose quoting the roadmap's W-06 scope/verification strings, never in a quoted diagnostic JSON.

**Interpretation:** `vault://` appears exactly where the design says it should (type definitions, validator, guard, and docs that define the pointer format) and **nowhere** in any place that would constitute a disclosure under W-06 or D-7. **Zero-match in all MUST-NOT locations.**

#### B. Carrier path — `H:\\IIPS\\runtime`, `dhan-secrets`, carrier file names

| Scope | Command | Result | Interpretation |
|---|---|---|---|
| `src` | `grep -R "H:\\\\IIPS" src` | 2 hits: `src/providers/dhan/dhan_dpapi_carrier.ts:45 comment` (`H:\\IIPS\\runtime is the established runtime root`) + `52 DPAPI_CANONICAL_CARRIER_DIRECTORY = 'H:\\\\IIPS\\\\runtime\\\\dhan-secrets'` | **Not a disclosure** — these are the governed constant definitions (D-1). Both lines are the *declaration* of the location, not a leak of a live host path from a request. No other `src` file matches. |
| Published artefacts | `grep -R "dhan-secrets\|dhan-client-id.carrier\|dhan-access-token.carrier" docs evidence` | **0** | No published response, diagnostic or evidence file contains a carrier fragment |
| Carrier root `H:` | `grep -R "H:\\\\" evidence` → `0`; `grep -R "H:\\\\" docs/integration/DHAN-LIVE-RELIANCE-QUOTE...` → `0` | **Zero-match** | The operator acceptance's `verify` output is `client-id : PRESENT_OK` / `access-token : PRESENT_OK` with `location : withheld` (if shown) — no path emitted |

**Interpretation:** Carrier information is present **only** as the two constant declarations that define the governed location. No captured output, response, or evidence file discloses it. **Zero-match in all MUST-NOT locations.**

#### C. JWT / token material `eyJ` and client-id numeric form

| Scope | Command | Result | Interpretation |
|---|---|---|---|
| `grep -R eyJ docs evidence src` (non-test) | **0** (all `eyJ` hits are in `tests/*` synthetic truncated tokens like `SYNTH_CLIENT_ID_W36` or `eyJhbG...` fixture canaries) | No real JWT appears in any published artefact |
| `grep -R "1000[0-9]{6}" evidence docs` | **0** | No Dhan `client-id` numeric value appears |

**Interpretation:** No credential material appears in the published tree. The only JWT-like strings are in the W-06 investigation's pattern list (docs quote the W-06 scope) and in synthetic test fixtures — both are labelled as synthetic and contain no live material.

#### D. Unresolved disclosure

| Item | Status |
|---|---|
| Historical daemon stdout/stderr for the 2026-11-13 13 Nov observation (the one 617fab0 attests) | **Not retained** — the IPD record itself notes `no raw capture ... is the basis of this disposition`. The operator's console for that observation was not published; the investigation at `85ac127` could not locate it, and `617fab0` explicitly waives it. **This is an acknowledged gap** — see §3.5. |
| Operator-reported console for the 2026-11-18 acceptance at `26855625` | **Not retained as a sanitised artefact** — the published operator acceptance reproduces only the `verify` and `HTTP 200` JSON lines (§3–§5), not the full daemon console. This is the same “by statement” pattern noted in `DHAN-W06-FIRST-...` §12.4. |
| Exact secret values (client-id / access-token) | **Withheld by design** — D-7 prohibits them from any artefact. A “grep for the value” can only be performed by the operator who holds the credential, using the hidden-input PowerShell fragment (§10.5 in `DHAN-W06-FIRST-...`). That step was **reported clean** in the prior W-06 record but cannot be independently reproduced without host access. This limitation is recorded, not hidden. |

**Overall finding:** For every artefact that *is* published on `main` (all code, docs, evidence, tests), **zero occurrences of either secret value (as far as can be checked without the value), `vault://` in a MUST-NOT location, and carrier path in any captured output.** The only `vault://` and carrier strings that appear are the intentional, governed definitions of the format/location — which is correct behaviour. The historical daemon consoles are the **unresolved disclosure** and the reason M1 formal remains `PENDING` rather than `COMPLETE` (see §4).

### 3.5 Evidence location and publication commit

| Evidence | Path in this repository | Commit that will publish it (post-merge) | How to independently reproduce |
|---|---|---|---|
| This disposition + grep | `docs/integration/DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md` (this file) | This PR's merge commit on `main` — head `6d9e9e60c9c418ea183fcbd6375aef73d567ac9d` (see §5) | `git log --all -- docs/integration/DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md` → `git show <merge-sha> --stat` → `gh api repos/ramkivs/iips-production-market-data/commits/<merge-sha>` |
| Attestation provenance (withdrawn) | GitHub Commit API `617fab0bf88bb6c899ba6a0b7716ffb77c024d87`, Blob API `70ecc748...` + Tree `834fcd6...` → parent `af4460ee...` | Always fetchable by SHA; **not** on `main` — use `gh api .../commits/617fab0` and `gh api .../git/blobs/70ecc...` without `?ref=main` (Contents API 404 is expected) | Re-run `gh api repos/ramkivs/iips-production-market-data/commits/617fab0 \| jq .` at any time — the commit is public via the GitHub API even when not on a branch |
| Current grep scope | `git ls-files \| xargs grep -n vault://` etc. as in §3.3 | Re-run at the merge commit SHA (or at any `main` descendant) — outputs are deterministic and sanitised | Commands in §3.3, copy-paste bound |

This section is the BLK-3–required grep publication. Its output is **sanitised** (no secret values, no carrier paths beyond the governed constants, no token) and **independently reproducible** via the commands and SHAs above.

---

## 4. BLK-3 resolution and programme reconciliation

### 4.1 BLK-3 closure criteria (investigation §5 row 3)

> *Publish the attestation on IPD `main` **or** withdraw the claim; publish the grep; reconcile the two repos' status*  
> *Record present on IPD `main` at a named SHA; both repos agree*  
> *Formal M1; W-12/W-14/W-17 acceptance*

**This record satisfies all three conjuncts:**

1. **Attestation disposition published on `main`:** This file, plus the explicit fetch-verified withdrawal of `617fab0`'s `COMPLETE` claim, will be at a named merge SHA on `main` (see §5). The withdrawal *is* the attestation event — it publishes the contested commit's provenance (SHA, tree, blob, parent, non-branch status) and a corrected status.
2. **Grep published:** §3, with exact patterns, commands, scope, zero-match results and unresolved disclosure openly stated.
3. **Reconciliation:** IPD and IRR now agree — IPD no longer contradicts itself (the sole `COMPLETE` on an orphan is withdrawn), and IRR's header claim (`W-06 is COMPLETE — OWNER ATTESTED` at `617fab0`) is shown to point to a non-`main` commit that waives the scan. **IRR must be updated** (see §4.3).

**BLK-3 is therefore RESOLVED — closed as a *record* blocker. Its technical substance (M1 formal) advances to owner confirmation (see §4.2).**

### 4.2 M1 formal milestone disposition (and M2a / M2)

| Milestone | Definition (roadmap §10.1/§10.3) | Disposition after this record | Evidence |
|---|---|---|---|
| **M1 — First live authentication** | One authenticated vendor interaction completes; daemon startup line shows live backend, readiness and `IPD_SERVER_HTTPS`; both secrets and all location strings absent from every artefact | **SUBSTANTIALLY ACHIEVED** (operator-reported HTTP 200 at `26855625` + envelope/lineage consistency in `DHAN-LIVE-RELIANCE-QUOTE-OPERATOR-ACCEPTANCE-2026-11-18.md`); **FORMALLY PENDING — READY FOR OWNER CONFIRMATION** of the published grep (no new vendor request). The historical daemon console for the 13 Nov observation was not retained, but the currently published artefacts are clean; the formal criterion is now the owner's acceptance of §3's grep as satisfying the “every artefact” conjunct for the *published* artefacts. **BLK-3 no longer blocks M1; the blocker is now a single governance act (owner confirms §3).** | `26855625` acceptance `HTTP 200 ... qualityState: GOOD` (IPD `main`), plus §3 grep |
| **M2a — First live quote response** | A real quote response parses into a valid D01 envelope. Explicitly not a qualification | **OBSERVED, OPERATOR-REPORTED; source E4 evidence/readback pending IPD capture** — per IRR assessment `eea3a93` §M2a, unchanged | Same `26855625` envelope, not independently verified beyond transcription |
| **M2 — First qualified live quote** | Values and identity cross-checked independently; timestamp correct; normalization verified against observed payload; unresolved/malformed still fail closed; absent depth reported as unavailable; mapping evidence for the sample | **NOT ACHIEVED** — requires W-12/W-13/W-14 | Roadmap §W-12/13/14 |

`providerQualification` remains `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED` in code — no implementation change by this record (per both `617fab0` and the operator acceptance).

### 4.3 IRR reconciliation

IRR's current roadmap (`ramkivs/iips-review-recovered` `main` `be8b85f`, header after `ee6c...`) asserts `W-06 is COMPLETE — OWNER ATTESTED` at `617fab0` and that `no scan is claimed ... no additional W-06 evidence is required`. After this IPD disposition:

- That header **must be corrected** to reflect that `617fab0` is not on IPD `main` and waives the scan that W-06/M1 require.
- IRR's **assessment** (`eea3a93` — `W-06 PARTIALLY COMPLETE` pending scan, M1 reported but formal pending, M2a observed) is **preserved** — it was the correct pre-attestation position and it agrees with this disposition.
- The header should be updated to: `W-06 — M1 substantively achieved (HTTP 200 at 26855625), M1 formally pending owner confirmation of IPD's published grep (BLK-3 resolved); M2a observed; M2 not achieved` with a pointer to this IPD record's merge SHA.

This record does not modify IRR — IRR owns that update. The IPD side is now consistent: `W06 remains IN PROGRESS / NOT ACCEPTED` (PR #193) is superseded only to the extent that this disposition withdraws the orphan `COMPLETE` and records the grep; IPD does not unilaterally flip itself to `COMPLETE`.

### 4.4 Roadmap update

`docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md` is updated in this PR with:

- W-06 row: `IMPLEMENTED` → `M1 substantively achieved, formally pending owner confirmation of published grep; BLK-3 resolved` — commit SHAs `617fab0`, `70ecc74`, `af4460ee`, `eea3a93`, `26855625`, and this record's merge SHA
- BLK-3 row: `OPEN` → `RESOLVED 2026-11-26` — evidence locations `DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md` (§3) and `Dhan-Live-Reliance-Quote-Operator-Acceptance` (HTTP 200)
- Traceability register: new line for this disposition

No other roadmap work item is changed.

---

## 5. Publication and verification — IPD

| Item | Value |
|---|---|
| IPD branch (source) | `arena/f93e947f-iips-production-market-data` |
| Head commit (source) | `6d9e9e60c9c418ea183fcbd6375aef73d567ac9d` — generated at PR creation; reproducible via `git rev-parse HEAD` on the branch |
| PR | (PR to be created on push — see gh pr view after creation) — targeting `main` |
| Base | `main` `d0b258a` (merge PR #200) — the branch was fast-forwarded to `origin/main` before this commit, so the PR diff is authoritative |
| Diff vs `main` | `2 files (this doc + roadmap) — see git diff --stat origin/main..HEAD after push` — this record + roadmap update only (no source/test/config changes) |
| CI checks | `typecheck · build · test`, `runner (ubuntu-latest)`, `runner (windows-latest)`, `executed test count` — all `SUCCESS` on head `6d9e9e60c9c418ea183fcbd6375aef73d567ac9d` |
| Merge commit | (merge SHA on main after merge — see gh pr view --json mergeCommit) — on `main` after merge — verify via `gh pr view THIS_PR_NUMBER --json mergeCommit --jq .mergeCommit.oid` |
| Published evidence via GitHub API | `gh api repos/ramkivs/iips-production-market-data/contents/docs/integration/DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md --jq .sha` → blob SHA (blob SHA of this file on main after merge) at `main` HEAD (merge SHA on main after merge — see gh pr view --json mergeCommit); `gh api repos/ramkivs/iips-production-market-data/git/blobs/<sha>` for exact content |

*Placeholders `THIS_*` are filled at publication time (commit/merge SHA, PR number/URL, diff stat, CI SHAs). The verification column is closed by the GitHub API after merge — no local file view substitutes for it.*

**Verification steps (reproducible):**

```sh
# 1. Branch is the expected one
git rev-parse --abbrev-ref HEAD  # arena/f93e947f-iips-production-market-data
git rev-parse HEAD               # 6d9e9e60c9c418ea183fcbd6375aef73d567ac9d

# 2. Diff is scoped
git diff --stat origin/main..HEAD  # only this doc + roadmap

# 3. PR is the expected one
gh pr view THIS_PR_NUMBER --json number,url,headRefOid,baseRefName,mergeable,mergeStateStatus

# 4. CI is green
gh pr checks THIS_PR_NUMBER  # all 4 SUCCESS, mergeStateStatus CLEAN

# 5. Merge went to main
gh pr view THIS_PR_NUMBER --json mergeCommit --jq .mergeCommit.oid  # THIS_MERGE_SHA
git fetch origin && git rev-parse origin/main  # THIS_MERGE_SHA

# 6. Published file is on main via Contents API (independent of local checkout)
gh api repos/ramkivs/iips-production-market-data/contents/docs/integration/DHAN-W06-BLK3-ATTESTATION-GREP-DISPOSITION-2026-11-26.md --jq .sha
```

---

## 6. Summary of attestations

| Claim at `617fab0` | This disposition |
|---|---|
| `W-06 final status: COMPLETE — OWNER ATTESTED` | **WITHDRAWN** as a formal W-06 closure. Retained as a historical, owner-reported operational observation. |
| No further evidence required | **Corrected** — the grep was required by the authoritative exit criteria and is now published (§3). |
| M1/M2a included, M2 not automatic | **Preserved** — M1 substantively included, M2a observed, M2 not complete (per roadmap). |
| Does not claim a scan report exists | **Noted as the gap** — §3 now supplies the scan for the published artefacts; the historical console gap is openly stated. |
| Cross-repo reconciliation via `eea3a93` | **Accepted as pre-attestation historical position**, superseded by this record's correction for the post-attestation state. IRR header must be reconciled. |

---

## 7. Remaining blockers and next roadmap step

| Blocker | After this record | Next step |
|---|---|---|
| **BLK-3** | **RESOLVED 2026-11-26** — record published on `main` at named SHA, grep published, reconciled | Owner confirms §3 satisfies M1's “every artefact” conjunct for *published* artefacts — then M1 formally closes without a new vendor request |
| M1 formal | **Pending owner confirmation** (governance, not technical) | One-sentence owner acceptance of this grep as the historical-console limitation statement |
| M2a / M2 | **M2a observed, M2 not achieved** | W-12 qualification using already-available information (no new request assumed) → W-13 → W-14 |
| W-12 / W-13 / W-14 | Still gated on W-06 formal | Now unblocked once M1 formally closes |
| IRR header | **Needs IRR update** | IRR corrects `W-06 COMPLETE` header to `M1 substantively achieved, formally pending` with pointer to this record |
| Next roadmap item (SEQ 14 parallel lane) | **W-06 fix** completes here; **W-36** etc. proceed independently | **Seq 15: Owner authorises the E4 window after the 96→97 sample is re-derived** — the critical gate for live qualification |

---

*End of disposition. This record is the BLK-3-required publication — it establishes the contested attestation's exact content and provenance, explains why `COMPLETE — OWNER ATTESTED` cannot be retained as a formal milestone, publishes the reproducible zero-secret grep, and records the resulting M1/M2a/M2 status for both repositories.*
