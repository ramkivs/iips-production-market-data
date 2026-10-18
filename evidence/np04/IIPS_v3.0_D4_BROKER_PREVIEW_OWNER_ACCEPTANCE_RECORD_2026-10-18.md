# IIPS v3.0 — `D4` BROKER-PREVIEW OWNER ACCEPTANCE RECORD

> ## STATUS: **`ACCEPT` — OWNER (PA) DECISION RECORDED · EVIDENCE PARTIAL · IRR PUBLICATION BLOCKED BY INTEGRATION SCOPE · MERGE AUTHORITY NOT ESTABLISHED · NO MERGE PERFORMED**
> The Program Authority, who is also the owner and sole user, has **explicitly accepted** the bounded
> browser-only Broker Holdings preview (`D4`, IRR PR #114). That acceptance is **his decision**,
> recorded and published here. It is **not** an independent approval by Arena, **not** a browser
> observation made by Arena, **not** a merge, promotion or production act — and, because the session's
> GitHub integration cannot write to the IRR repository, **the IRR-side record and tracker entry are
> not published and remain outstanding** (§0.1).

| Field | Value |
|---|---|
| **Record identifier** | `IIPS-V3.0-D4-BROKER-PREVIEW-OWNER-ACCEPTANCE-01` |
| **Artifact type** | Acceptance record — records the owner's decision; renders no new implementation or merge authority |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` — additive documentation only |
| **Intended IRR location (not published — §0.1)** | `ramkivs/iips-review-recovered` → `docs/integration/IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md`, plus tracker §16.49 |
| **Governing register item** | `D4` — owner's broker-preview acceptance (IRR master tracker §16.39, §16.39.2, §16.48.3 row 9) |
| **Subject of acceptance** | The browser-only broker CSV preview on IRR PR [#114](https://github.com/ramkivs/iips-review-recovered/pull/114), tested head `e331995a94b704e078b27a70a36cbc161311fd09` |
| **Acceptance authority** | **Ramki** — Program Authority, owner and sole user (one person in three capacities); explicit direction of **2026-10-18** |
| **Evidence supplied** | Owner-supplied browser capture of **2026-10-17** (findings in §2; the image itself is **not** republished) |
| **Disposition** | **`ACCEPT`** (owner decision) |
| **Evidence status** | **PARTIAL** — the capture supports the parse/row/UNRESOLVED/digest-and-read-time findings; three runtime-observation elements are **NOT INDEPENDENTLY EVIDENCED** and are **NOT WAIVED** (§3) |
| **PR #114 merge authority** | **NOT ESTABLISHED** — unchanged by this record (§5) |
| **Production status** | NON_PRODUCTION — personal use, one user, one personal laptop |

---

## 0. Naming, and the exact publication restriction

### 0.1 Why this record is in IPD, and what is still missing on the IRR side

`D4` is an **IRR register item** whose evidence lives in the IRR master tracker. This session's
authorized repository is IPD, and its GitHub integration is **installation-scoped to IPD**. Both
write routes to IRR were attempted and both were refused by GitHub, not by any governance rule:

| Route attempted | Exact result |
|---|---|
| `git push origin arena/21c63aef-iips-review-recovered` (IRR) | `remote: Permission to ramkivs/iips-review-recovered.git denied to ramkivs.` — `403` |
| The same push through the `gh` credential helper | identical `403` |
| `gh api repos/ramkivs/iips-review-recovered/git/blobs -f content=…` | `{"message":"Resource not accessible by integration"}` — `403` |

IRR **reads** succeed only because `iips-review-recovered` is a public repository. The controlling
restriction is therefore the **GitHub App installation scope for this session** — covering
`ramkivs/iips-production-market-data` only — and **not** a missing approval, a missing delegation or
an unmade decision. The owner's acceptance decision **has been made**; recording it in the IRR
tracker requires a session whose integration can write to IRR.

**Consequences, stated so nothing is overstated:**

- This IPD record **is** the durable record of the owner's acceptance decision.
- **No IRR file was created, changed, pushed or merged**; IRR `main` remains
  `fadc395d7bd95041829981ca542b03188b17e727`. The prepared IRR document text and tracker §16.49 are
  supplied in **Appendix A** for adoption by an IRR-write-enabled session.
- **§16.48.3 row 9 of the IRR tracker still reads `OUTSTANDING — NOT VERIFIED`.** That row is
  **stale as of 2026-10-18** and must be reconciled by the adopting session; this record does not
  pretend it has been.

### 0.2 `D4` is not `D-4`

| Identifier | Meaning | State |
|---|---|---|
| **`D4`** (this record) | The **external owner acceptance** item for the broker preview (IRR register row 9 / §16.39) | **`ACCEPT` recorded 2026-10-18** |
| `D-4` | The **IRR Gate B implementation-authority act** of 2026-10-17 (blob `ee6122e8…`) | Rendered and published at IRR §16.43; **unchanged, not reopened, not authority here** |

Nothing in this record reopens, transfers or interprets `D-4`, Gate B, Gate C, Gate D/E or any
`CV-*` item.

---

## 1. Authority and provenance of the acceptance

| Element | Recorded value |
|---|---|
| Decision-maker | **Ramki**, in his own capacity as Program Authority **and** owner **and** sole user — the three roles are the same person; no separate acceptor was sought, and none is invented |
| Operative words | *"I'm confirming to go ahead and D4 acceptance."* |
| Date supplied | **2026-10-18** (Asia/Calcutta), operating channel for this act |
| What the decision is | An **acceptance decision** by the party whose acceptance `D4` requires |
| What the decision is not | Not an Arena approval, not a third-party sign-off, not merge authorization, not qualification, not admission, not production authorization |
| Execution role of this session | Record, publish (as far as the integration permits, §0.1) and independently verify the owner's decision; **no** acceptance was originated, inferred or fabricated by Arena |
| Authority chain | `D4` names an **external (owner)** disposition (IRR §16.48.3 row 9). The owner has supplied that disposition. Recording it requires no further approval, and none was requested |

---

## 2. Evidence actually available, and its character

### 2.1 The owner-supplied capture (2026-10-17)

Findings recorded as **supported by that capture**, and limited to them:

| # | Supported finding | Character |
|---|---|---|
| 1 | Broker/format: **Zerodha** CSV export recognised and parsed | Owner-supplied capture; broker/format is expressly namable under §16.39.2 step 4 |
| 2 | Displayed status **`PARSED_UNRESOLVED`** | Owner-supplied capture |
| 3 | **82 native rows** | Owner-supplied capture; a **row count**, not a holdings value |
| 4 | **Every row unresolved** | Owner-supplied capture |
| 5 | A **read timestamp** and a **content digest** were **displayed** | Owner-supplied capture; **values not reproduced** |

**Redaction compliance (§16.39.2 step 4).** This record does **not** reproduce the digest, the
filename, any symbol, quantity or monetary value, and does **not** publish the image. The read
timestamp is described but not transcribed, under the same discipline. The capture remains with the
owner and is not copied into any repository or remote service.

### 2.2 Honest statement about the capture's handling in this act

This session **did not independently view the capture** and makes **no browser observation** of its
own. The findings in §2.1 are recorded **as the owner's supplied evidence**, exactly as instructed,
and are not presented as Arena's observation. Two forms of **independent, non-browser** corroboration
were performed and are recorded because they strengthen — but do not replace — the capture:

| Corroboration | Result |
|---|---|
| Structural correspondence with the rendering code at the tested head | The strings and layout described correspond to IRR `frontend/src/features/broker-holdings/BrokerHoldingsPreview.tsx` at `e331995a` (blob **`3492967db629f78ddc738d1b8784be647b793ebb`**, 3,961 B): heading `{broker} — {status}`, the sentence `{n} native rows. Every row remains UNRESOLVED…`, and `Read at: {asOf}. Content digest: {contentDigest}`. Structural corroboration, **not** an observation of the capture's pixels |
| Status vocabulary at the tested head | `PARSED_UNRESOLVED` is produced by `frontend/src/api/brokerHoldingsPreview.ts` (blob **`bf079a1b587cebf582c03a7aa2c99b87cf890f73`**, 2,395 B) on a successful parse with ≥1 holding; the alternative terminal state is `REJECTED` |
| PR #114 head unchanged | Remote read at the time of this act: head **`e331995a94b704e078b27a70a36cbc161311fd09`**, 11 commits, 34 files, `OPEN`, `mergedAt: null` — the same head the capture was taken against |

---

## 3. Criteria — `§16.39.2` step by step

| # | §16.39.2 requirement | Recorded state | Basis and character |
|---|---|---|---|
| **1** | Use PR #114's tested head (`e331995a…` or a later identified exact head); run the preview locally and open `/broker-holdings` | The owner exercised the preview at the tested head `e331995a…` | **Owner-supplied capture**; head identity corroborated by the remote read and the code in §2.2 |
| **2** | Use one actual supported broker `.csv` export from the owner's machine; do not paste, upload, commit or send the file, its values or a screenshot containing holdings | A **Zerodha** export was used; the file, its values and the image were **not** supplied to this repository or to Arena | **Owner-supplied capture** + the owner's decision; redaction compliance in §2.1 |
| **3a** | Supported parse showing the **expected broker/format** | **Zerodha**; `PARSED_UNRESOLVED` | **Capture-supported** |
| **3b** | **Row count** | **82 native rows** | **Capture-supported** |
| **3c** | **Every row labelled `UNRESOLVED`** | Every row unresolved | **Capture-supported**; consistent with the tested head, where every projected holding carries an unresolved identity status and no `companyId` is assigned |
| **3d** | A **digest / read time** displayed | Read timestamp and content digest displayed (values not reproduced) | **Capture-supported** |
| **3e** | **No Save control** | The preview view exposes **no save control and no store call**; the only action control is **`Clear preview`**, and the view states *"Preview only — not saved."* | **Source-verified at the tested head** (blob `3492967d…`), reused — **not** a browser observation by Arena. The capture is not claimed to prove absence of a control |
| **3f** | **Clear the preview and confirm it disappears** | **NOT ESTABLISHED as a runtime observation.** The behaviour exists in source — `clear()` resets preview, error, busy state and the file input, and is covered by the component suite — but no evidence in this act records the owner clearing the preview and seeing it disappear | **NOT EVIDENCED · NOT WAIVED.** Source/test evidence is recorded as what it is, not as a browser observation |
| **3g** | **Confirm no network upload/save occurs** | **NOT ESTABLISHED as a runtime network observation.** Source-verified: the file is read with `file.text()` in the browser and passed to an in-browser parser; the preview path performs **no** network request, no upload and no browser storage write; no save endpoint is called | **NOT EVIDENCED as an observation · NOT WAIVED.** The code-level finding is reused; it is not restated as a packet capture or devtools observation |
| **4** | Return only a redacted pass/fail statement; **acceptance requires the observed result and confirmation that the file remained local** | The owner's acceptance decision is recorded; the redacted findings are recorded; **a distinct owner statement that the file remained local is not separately recorded** — locality is supported only by the source-level no-upload behaviour in 3g | **Owner decision + capture + source evidence**; the missing distinct statement is recorded, **not invented** |

**The distinction, stated once and unambiguously.** `D4` is satisfied **as an owner acceptance
decision** (§4). It is **not** recorded as `§16.39.2` fully *verified*, because requirements **3f**,
**3g** (as an observation) and the distinct **file-locality statement** in **4** have no runtime
evidence in this act. Those three elements are **open observations**, not waived requirements, and no
future reader may cite this record as proof that they were witnessed.

**No PASS is manufactured.** If the fully observed form of `§16.39.2` is ever needed, the remaining
action is: on the same tested head, clear the preview after a successful parse and observe it
disappear; state that the file remained local; and record it as an owner attestation. That action is
**not** a precondition to the acceptance recorded here, which the owner has already given.

---

## 4. Disposition

**`D4` — `ACCEPT`.**

The owner has accepted the bounded browser-only Broker Holdings preview at tested head
`e331995a94b704e078b27a70a36cbc161311fd09`, on the basis of:

1. his own browser exercise of **2026-10-17**, whose supported findings are recorded in §2.1;
2. his **explicit acceptance decision** of 2026-10-18, quoted verbatim in §1;
3. the existing, reused repository evidence at that immutable head — the preview's source, its
   focused tests (16/16 as recorded in the validation record), and exact-head hosted CI
   (run `38870910721`, job `116874506478`, `head_sha=e331995a…`, `SUCCESS`).

**Status of the three unevidenced elements:** recorded as **NOT ESTABLISHED**, deliberately **not**
converted into findings, and **not** waived.

**Scope of what was accepted.** The behaviour of the preview as implemented and tested at
`e331995a…` — local CSV parse, all identities unresolved, read time and digest displayed, no save,
explicitly separate from the certified reference portfolio. The acceptance is **bound to that
implementation**. If PR #114 is later reconciled onto current `main`, the reconciliation must not
change the preview's product behaviour; if it does, this acceptance does not silently transfer to the
new head and a re-statement would be required.

---

## 5. What this record does **not** do — conditions kept separate

| Item | State after this record |
|---|---|
| **PR #114 merge authority** | **NOT ESTABLISHED** — unchanged. Acceptance is not merge authorization, and none is inferred from CI, from this record, or from the separately admitted NP-18 increment |
| **PR #114 conflict** | **UNRESOLVED** — remotely verified `OPEN`, `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`, head `e331995a…`, 34 files, `mergedAt: null`. Nothing here resolves it, rebases it or pushes to it |
| **PR #114 merge / close** | **NOT PERFORMED**, not authorized, not implied |
| **Competing PR** | **NONE CREATED** — this is an additive documentation record; it does not carry or restate the preview's product changes |
| **NP-18 increment** | Unaffected — separately qualified and admitted through PR #115; the broker delta remains branch-only and is **not** admitted by this record |
| **`D-4` (Gate B), Gate C, Gate D, Gate E** | Untouched, unexecuted, not reopened; the Windows Gate C host run and its separate result-acceptance act remain outstanding |
| **`CV-25` (IPD pin/tag), `D2b` (IPD PR #8 merge authority)** | Unchanged — `CV-25` remains `DECISION REQUIRED`; no tag was created; no IPD ref moved |
| **`CV-*` register** | **Zero movement** — no `CV-*` item is opened, closed, reclassified or renumbered |
| **Durable save / identity resolution / live Dhan API / release / production** | **NOT AUTHORIZED / NOT CLAIMED** — unchanged |
| **`503 owner-context-unavailable` fence, G-2, DP-2 2F, C11, H-18, L-IPC-1** | **All in force**, unchanged |
| **Group 1** | **NOT complete** — `D4` is satisfied as a decision, but `CV-25`, `D2b` and the Windows Gate C host run with its separate result-acceptance act remain outstanding |
| **IRR-side recording (§0.1)** | **OUTSTANDING** — an IRR-write-enabled session must adopt Appendix A and reconcile IRR §16.48.3 row 9 |

---

## 6. Register effect

| Field | Before | After |
|---|---|---|
| `D4` (IRR §16.48.3 row 9) | `OUTSTANDING — NOT VERIFIED` | **`ACCEPT` — owner decision recorded 2026-10-18; evidence PARTIAL (§3); merge authority and conflict integration remain outstanding. IRR row not yet reconciled (§0.1)** |
| IRR/`CV-*` counts / statuses | unchanged | **unchanged** |
| IRR §16.43–§16.48 | published | **unchanged** — no IRR write occurred |
| Repository product, tests, configuration, dependencies, pins, fences | unchanged | **unchanged** — IPD documentation only |

---

## 7. Publication and remote verification

To be appended by a **subsequent** commit after publication, so this record's own identity is not
self-referential.

---

## Appendix A — prepared IRR adoption package (prepared, **not published**)

An IRR-write-enabled session must:

1. copy this record to
   `docs/integration/IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md`,
   replacing §0.1 with a note recording the IPD origin of the decision record and its coordinates;
2. insert the tracker section below as **§16.49**, and
3. update the tracker front-matter `Last Updated` cell with the `CV-CORR-32` line, and the §16.48.3
   row 9 status cell.

### A.1 Prepared tracker section (insert as §16.49)

> ## 16.49 `D4` — owner's broker-preview acceptance rendered `ACCEPT` (`2026-10-18`)
>
> **Disposition. `ACCEPT` rendered by the owner/Program Authority, recorded and published here.**
> `D4` (§16.39.3, §16.48.3 row 9) is an **external owner** disposition. The Program Authority — also
> the owner and sole user, one person in three capacities — supplied it explicitly: *"I'm confirming
> to go ahead and D4 acceptance."* (2026-10-18). The decision is his; no separate acceptor was
> sought, no delegation invented, no further approval requested. **`D4` is distinct from `D-4`** (the
> IRR Gate B implementation-authority act), which is untouched.
>
> **Evidence (owner-supplied capture, 2026-10-17, against tested head `e331995a…`), limited to what
> the capture supports:** Zerodha · `PARSED_UNRESOLVED` · **82 native rows** · every row unresolved ·
> a read timestamp and content digest displayed (values not reproduced). The digest, filename,
> symbols, quantities, values and image are **not** republished (§16.39.2 step 4). This session did
> not view the capture independently and claims no browser observation.
>
> **Decision versus evidence — recorded, not waived.** Supported by the capture: the parse,
> broker/format, row count, all-rows-unresolved, and digest/read-time display. **Source-verified, not
> browser-observed:** no Save control and no store call (view blob `3492967d…`, parser blob
> `bf079a1b…`). **NOT ESTABLISHED and NOT WAIVED:** clear-the-preview-and-confirm-it-disappears, a
> no-network runtime observation, and a distinct owner statement that the file remained local. No
> PASS is manufactured, and no reader may cite this section as proof that those three were witnessed.
>
> **Effect, kept separate.** `D4` is satisfied **as an owner decision**. **PR #114 merge authority
> remains NOT ESTABLISHED**; the branch remains `OPEN`, `CONFLICTING`/`DIRTY`, 34 files,
> `mergedAt: null`, and was not rebased, pushed, merged or closed. No competing PR. NP-18 is separate
> and unaffected. `D-4`, Gate C/D/E, the Windows Gate C host run and its result-acceptance act,
> `CV-25`, `D2b` and all `CV-*` statuses are unchanged; the `503` fence, G-2, DP-2 2F, C11, H-18 and
> L-IPC-1 remain in force; durable save, identity resolution, live Dhan API, release and production
> remain NOT AUTHORIZED. **Group 1 is not complete.**
>
> **Publication.** The decision record and this section publish together as one additive
> documentation PR into `refs/heads/main`; the commit, blob and SHA-256 read-back are recorded by a
> subsequent commit and in the PR verification comment.
>
> *End of §16.49.*

### A.2 Prepared `Last Updated` prefix (front matter)

`2026-10-18` — **CV-CORR-32 (§16.49): `D4` RENDERED `ACCEPT` by the owner/PA — the 2026-10-17
owner-supplied broker-preview capture is recorded with its supported findings (Zerodha,
`PARSED_UNRESOLVED`, 82 native rows, every row unresolved, read time and digest displayed); the three
runtime-observation elements (clear-and-disappear, a no-network observation, a distinct file-locality
statement) are **NOT ESTABLISHED and NOT WAIVED**; no Arena browser observation is claimed; **PR #114
merge authority remains NOT ESTABLISHED** and the branch is still `CONFLICTING`; documentation only,
zero `CV-*` movement; Group 1 remains NOT complete.**

### A.3 Prepared §16.48.3 row 9 status cell

`ACCEPT` — owner decision recorded 2026-10-18 (evidence PARTIAL: capture-supported parse/row/
UNRESOLVED/digest elements only; clear-and-disappear, network observation and file-locality statement
**NOT ESTABLISHED, NOT WAIVED**); **PR #114 merge authority NOT ESTABLISHED**; conflict and
current-base integration outstanding.

---

*End of acceptance record `IIPS-V3.0-D4-BROKER-PREVIEW-OWNER-ACCEPTANCE-01` — **`ACCEPT` BY THE
OWNER/PA · EVIDENCE PARTIAL · IRR PUBLICATION BLOCKED BY INTEGRATION SCOPE · MERGE AUTHORITY NOT
ESTABLISHED · NO MERGE PERFORMED · NON_PRODUCTION**.*
