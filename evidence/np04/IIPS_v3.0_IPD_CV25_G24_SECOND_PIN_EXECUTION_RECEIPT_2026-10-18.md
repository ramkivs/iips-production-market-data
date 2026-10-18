# IIPS v3.0 — IPD `CV-25` — G24 SECOND-PIN EXECUTION RECEIPT

> ## STATUS: **EXECUTED — REMOTELY VERIFIED — BOTH CV-25 PINS PRESENT BY TAG (2 OF 2)**
> This receipt records the one exact tag authorized by
> `IIPS-V3-IPD-CV25-G24-SECOND-PIN-RECONCILIATION-ACT-2026-10-18-01`. The remote tag object,
> peeled target, type, annotation, protected branch, original first tag, and complete advertised-ref
> inventory were independently read back. No existing G24 ref was moved or rewritten.

| Field | Value |
|---|---|
| **Receipt ID** | `IIPS-V3-IPD-CV25-G24-SECOND-PIN-EXECUTION-RECEIPT-2026-10-18-01` |
| **Authorized act** | `IIPS-V3-IPD-CV25-G24-SECOND-PIN-RECONCILIATION-ACT-2026-10-18-01` |
| **Repository** | `ramkivs/iips-production-market-data` (IPD) only |
| **Execution date** | 2026-10-18 (UTC) |
| **Production status** | `NON_PRODUCTION` |
| **Raw ref inventory evidence** | [`IIPS_v3.0_IPD_CV25_REMOTE_REF_INVENTORY_2026-10-18.txt`](IIPS_v3.0_IPD_CV25_REMOTE_REF_INVENTORY_2026-10-18.txt) |

---

## 1. ACT PUBLICATION — BEFORE EXECUTION

The rendered act was committed and pushed before the tag was created:

| Check | Verified value |
|---|---|
| Publication ref | `refs/heads/arena/fb46926b-iips-production-market-data` |
| Published commit | `bbf4263db3b58a93ce7d601932f9a2f8b895a28f` (parent `467eb529f52820032b17ea0212c92362a96dfe18`) |
| Act blob | `bced1243fb89e69fc7345b7b4379d39ebb3cb36a` |
| Remote branch read-back | `bbf4263db3b58a93ce7d601932f9a2f8b895a28f` |
| Remote content read-back | GitHub Contents API blob = `bced1243fb89e69fc7345b7b4379d39ebb3cb36a`, equal to the local act blob |
| Scope | One additive governance artifact; no PR opened and no merge performed |

The act's exact exception and all continuing G24 restrictions are in its §2–§5. The tag push took
place only after the remote branch tip and act blob were verified.

---

## 2. EXACT TAG CREATED

| Field | Verified value |
|---|---|
| **Tag ref** | `refs/tags/iips-pin-g24-6828155e` |
| **Tag object SHA** | **`dcdaaa94e8e050ba132a19813d2f22f214dca7d3`** |
| **Tag object type** | **`tag`** — annotated, not lightweight |
| **Peeled target SHA** | **`6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`** |
| **Peeled target type** | **`commit`** |
| **Annotation** | `IIPS v3.0 G24 AD-03 designated-reference pin — 6828155e — CV-25 durable reference` |
| **Tagger** | `ramkivs <302525469+ramkivs@users.noreply.github.com>` |
| **Tagger date** | `2026-10-18T05:52:40Z` |
| **Signing** | Unsigned; signing was not required and is not implied |
| **Creation/push method** | Local `git tag -a` at the exact target, followed by one non-forced push of only `refs/tags/iips-pin-g24-6828155e` |

No replacement tag, branch, or other ref was created by this tag operation.

---

## 3. INDEPENDENT REMOTE VERIFICATION

### 3.1 `git ls-remote` read-back

A post-push read of the remote returned these exact lines:

```text
dcdaaa94e8e050ba132a19813d2f22f214dca7d3	refs/tags/iips-pin-g24-6828155e
6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4	refs/tags/iips-pin-g24-6828155e^{}
```

The remote tag-object SHA equals the created tag object; the peeled line equals the required target.

### 3.2 GitHub Git Data API read-back

`GET /repos/ramkivs/iips-production-market-data/git/ref/tags/iips-pin-g24-6828155e` returned
`refs/tags/iips-pin-g24-6828155e` with object `{type: tag, sha: dcdaaa94e8e050ba132a19813d2f22f214dca7d3}`.

`GET /repos/ramkivs/iips-production-market-data/git/tags/dcdaaa94e8e050ba132a19813d2f22f214dca7d3`
returned:

- tag name `iips-pin-g24-6828155e`;
- object SHA `dcdaaa94e8e050ba132a19813d2f22f214dca7d3`;
- target `{type: commit, sha: 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4}`;
- the exact annotation in §2; and
- tagger `ramkivs <302525469+ramkivs@users.noreply.github.com>`, date `2026-10-18T05:52:40Z`.

### 3.3 Fresh-clone resolution and reachability

An independent fresh clone was created from the public IPD remote with no local object reuse, then
fetched the exact remote tag and the protected branch. In that clone:

| Check | Fresh-clone result |
|---|---|
| `git cat-file -t refs/tags/iips-pin-g24-6828155e` | `tag` |
| `git rev-parse refs/tags/iips-pin-g24-6828155e` | `dcdaaa94e8e050ba132a19813d2f22f214dca7d3` |
| `git rev-parse refs/tags/iips-pin-g24-6828155e^{commit}` | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| `git cat-file -t refs/tags/iips-pin-g24-6828155e^{commit}` | `commit` |
| `git rev-parse refs/remotes/origin/arena/01a0f308-iips-production-market-data` | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` |
| `git merge-base --is-ancestor 6828155e… refs/remotes/origin/arena/01a0f308-iips-production-market-data` | exit 0 — target is reachable; in fact, it is the exact branch tip |

The fresh clone read the tag annotation and tagger bytes as expected. This verifies a remote-published
annotated tag, not merely a local tag ref.

---

## 4. PRESERVED REFS AND COMPLETE INVENTORY COMPARISON

The raw before/after inventories and machine-checkable comparison are published in the linked
inventory evidence file. They were captured with `git ls-remote origin | sort -k2`:

| Measure | Before tag push | After tag push |
|---|---:|---:|
| All advertised refs | 54 | 56 |
| Branch heads | 38 | 38 |
| Tag refs (distinct tags) | 5 | 6 |
| `ls-remote --tags` lines | 6 | 8 |
| Other advertised refs (including `HEAD`) | 10 | 10 |
| SHA-256 of sorted raw inventory | `56488d6a287c554e97c4496fdbab0e13df40999c50bc6a2a9829da6a40a2a748` | `a7817cc7c79e1d461874f96fee5896d873bf3ed2dfe42b09a1cb067ba8958e4e` |

A ref-name/object-ID comparison found exactly the two expected new lines for the annotated tag and
its peeled target. **Removed refs: none. Changed pre-existing refs: none.** The eight tag lines after
execution represent six distinct tags because each of the two annotated tags has one peeled line.
Thus the distinct-tag count is **5 → 6**, not 6 → 8.

Specific protected values, read back after the push and identical in the pre-push inventory:

| Ref | Remote object after push | Prior value | Result |
|---|---|---|---|
| `refs/heads/arena/01a0f308-iips-production-market-data` | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | same | **PRESERVED** |
| `refs/tags/iips-pin-np04-2e11fa3b` | tag object `8e91cc7029ce14cf353a9f138c826906239b05c6` | same | **PRESERVED** |
| `refs/tags/iips-pin-np04-2e11fa3b^{}` | `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` | same | **PRESERVED** |
| `refs/tags/iips-pin-g24-6828155e` | tag object `dcdaaa94e8e050ba132a19813d2f22f214dca7d3` | absent | **ONE AUTHORIZED CREATION** |
| `refs/tags/iips-pin-g24-6828155e^{}` | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | absent | expected peeled line for annotated tag |
| `refs/heads/main` | `467eb529f52820032b17ea0212c92362a96dfe18` | same | **PRESERVED** |
| `refs/heads/np04-governed-persistence-windows` | `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` | same | **PRESERVED** |

The act-publication branch was created separately before the tag-execution baseline, at
`bbf4263db3b58a93ce7d601932f9a2f8b895a28f`. The tag-execution comparison includes that branch and
shows it unchanged during the tag push. No existing ref was moved, rewritten, deleted, or force-updated.

---

## 5. CV-25 ACCEPTANCE RECONCILIATION

The current authoritative CV-25 register row (§16.4.2 of the IRR master tracker at
`a0a897045880878cbbdd30e3cc17747164b3b3de`, tracker blob
`6c1ad8acf0becaf3e45b0852471dde2d2d0ed799`) specified `PARTIALLY EXECUTED (1 OF 2 TAGS)` and its
acceptance test is that `git ls-remote origin 'refs/tags/*'` shows **both pins by tag**. Its first
limb was independently verified as `iips-pin-np04-2e11fa3b` →
`2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`. The remote read-back now shows both required pin commits
by tag:

| Required pin | Tag ref | Remote verification |
|---|---|---|
| `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` | `refs/tags/iips-pin-np04-2e11fa3b` | annotated object `8e91cc7029ce14cf353a9f138c826906239b05c6`, peeled to exact target |
| `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | `refs/tags/iips-pin-g24-6828155e` | annotated object `dcdaaa94e8e050ba132a19813d2f22f214dca7d3`, peeled to exact target |

The CV-25 pin/tag acceptance criterion is therefore **SATISFIED — 2 OF 2**. The IPD CV-25 record
now records the item complete at the ref-acceptance level. The IRR repository and its tracker were
not changed, as expressly excluded; this receipt does **not** claim the tracker row itself was
reconciled or that any other Group 1 obligation is complete. No D2b, Windows Gate C, IRR, product,
implementation, or unrelated work was performed.

The rendered act's **single named re-pin exception** has been spent by this exact creation only.
Every other G24 §4 prohibition remains in force.

---

*End of execution receipt `IIPS-V3-IPD-CV25-G24-SECOND-PIN-EXECUTION-RECEIPT-2026-10-18-01` — tag object `dcdaaa94…`, peeled to `6828155e…`; both CV-25 pins present by tag; protected refs preserved; `NON_PRODUCTION`.*
