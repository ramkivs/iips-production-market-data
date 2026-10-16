# IIPS v3.0 — G-2: **IPD GATE B BASELINE-DESIGNATION AND REF-CREATION — AUTHORITY ACT (RENDERED)**

> ## STATUS: **RENDERED IPD AUTHORITY ACT — D-1 = ACCEPT · D-2 = ACCEPT · FORM = ACCEPT**
> This artifact durably records the **Program Authority's rendered decision**, supplied in the G-2
> task channel on 2026-10-17, in its **exact wording** (§1). It designates the **IPD Gate B baseline**
> and authorizes the creation of **exactly one** IPD ref at that exact commit. **It grants no
> implementation authority** (D-4 is untouched) and opens no other gate (§6–§7). Per its own FORM
> term it is a **separate prior act**, published **additively** in the existing IPD **PR #8**
> workstream — no competing PR, no `main` change, no unrelated file.
>
> **The ref is created only after this act is durably published and verified**, by **one non-forced
> push**, exactly as §4 authorizes. The creation and its independent verification are recorded in the
> accompanying ref-creation record; **this file is not amended afterwards.**

| Field | Value |
|---|---|
| **Act identifier** | `IIPS-V3-G2-IPD-GATE-B-BASELINE-DESIGNATION-AND-REF-CREATION-2026-10-17-01` |
| **Artifact type** | **Rendered authority act** (records the Authority's decision; the decision is the Authority's, the recording is the Recording Agent's) |
| **Authority** | **RAMKI — Program Authority**, acting as the **IPD** security-contract/implementation authority for `ramkivs/iips-production-market-data` |
| **Rendered** | 2026-10-17 (Asia/Calcutta) · recorded and published `2026-10-16T20:29:01Z` (authoritative GitHub API HTTP `Date`) |
| **Channel** | the **G-2 task channel** for this workstream; recorded here as such. **This artifact does not create, replace, extend, or construe the act**; it reproduces it. |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream) |
| **Precedent consolidated (byte-intact, not modified)** | authority-basis determination blob `604757bc0747c5bd0a3ef3a8b2f18448c0f0674d`; baseline/ref authority disposition blob `e9e9e0d61ee357886b2b96d4e66aea39e03d8d8b`; baseline-designation clarification blob `320ddf1e977a50e05911549634e403736133b44c`; Gate B decision record blob `e640f61bbf3078c8ec23f21c30308c7bde08a7a9` |
| **Production status** | NON_PRODUCTION — one user, one personal laptop, H-18 scope |

---

## 1. THE RENDERED DECISION — RECORDED VERBATIM

> ### D-1 — ACCEPT.
> I designate commit
> 2ded0e981407b38c73bdea164153f53856aa7217,
> with parent
> 6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4
> and tree
> 9069045d3daf22156020188696fc2f9c2f32bf27,
> as the IPD Gate B baseline.
>
> ### D-2 — ACCEPT.
> I authorize creation of exactly
> refs/heads/gate-b/local-principal-ipc-implementation
> at that exact commit, non-forced, without moving any other ref and without
> opening a PR from it under this act.
>
> ### FORM — ACCEPT.
> Record this as a separate prior IPD Gate B baseline-designation and
> ref-creation authority act, published additively in the existing IPD PR #8
> workstream.
>
> ### LIMITS
> This act grants no Gate B implementation authority, Gate C qualification,
> Gate D route admission, Gate E write policy, P-6/P-8, production eligibility,
> G24 promotion, or PR merge. All existing safeguards and exclusions remain
> in force.

**Every bracketed/placeholder option the prepared records left open is now closed by this rendering:**
the **exact ref name**, the **exact commit object at object level** (not a tree-identical descendant),
and the **form** (separate prior act) are all named by the Authority. This satisfies §3 items 1–7 of
the baseline-designation clarification and closes the outstanding decision identified by the
authority-basis determination (§4) and the baseline/ref disposition (§6).

---

## 2. THE AUTHORIZED OPERATION (exactly one)

```
repository        ramkivs/iips-production-market-data
operation         create ONE new ref, non-forced  (git push origin <sha>:<ref>)
ref               refs/heads/gate-b/local-principal-ipc-implementation
commit           2ded0e981407b38c73bdea164153f53856aa7217
parent           6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4
tree             9069045d3daf22156020188696fc2f9c2f32bf27
```

**Verification performed at recording (pre-push, live remote, read-only):**

| # | Condition | Verified value | Result |
|---|---|---|---|
| 1 | Designated object exists and is a commit | `git cat-file -t` = **commit** | ✓ |
| 2 | Commit identity | `2ded0e981407b38c73bdea164153f53856aa7217` | ✓ MATCH |
| 3 | Parent | `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4` | ✓ MATCH |
| 4 | Tree | `9069045d3daf22156020188696fc2f9c2f32bf27` | ✓ MATCH |
| 5 | Destination ref does **not** already exist | `refs/heads/gate-b/*` = **0**; direct lookup empty | ✓ ABSENT |
| 6 | IPD `main` | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` | ✓ unmoved |
| 7 | Carrier of the designated object | **exactly 1** ref — `gate-a/local-principal-enablement-2026-10-16` | ✓ recorded |
| 8 | Ref inventory before | `35 heads / 4 tags / 9 pull refs` (49 refs) | ✓ snapshot taken |

**No stop condition is triggered:** object identity, parent, tree and destination-ref state all match
the approved tuple exactly.

---

## 3. EFFECT — WHAT CHANGES, AND WHAT DOES NOT

| Ref | Before | Effect of this act |
|---|---|---|
| `refs/heads/gate-b/local-principal-ipc-implementation` | **does not exist** | **created** at `2ded0e98…` (the only mutation) |
| `main` | `70b24f02…` | **untouched** |
| `gate-a/local-principal-enablement-2026-10-16` | `2ded0e98…` | **untouched** (a new ref is created at the same object; the existing ref is not moved) |
| `arena/01a0f308-…` (accepted basis carrier) | `6828155e…` | **untouched** |
| `arena/01a0e6d9-…` (designated target) | `c1b955b4…` | **untouched** |
| `arena/01a0f839-…` (governance) | `12c480b5…` | **untouched** |
| `np04-governed-persistence-windows` (NP-04 pin) | `2e11fa3b…` | **untouched** |
| `arena/21c63aef-…` (PR #8) | advances only by additive documentation commits | as authorized |

**What D-1 is NOT:** not a promotion, merge, cherry-pick, re-pin, or admission of the off-main G24
lineage; **not** a substitution for the designated Gate A execution basis `6828155…`; **not** an
admission of the derivative ref; **not** an effective-on-`main` capability. The designated baseline is
a **NON_PRODUCTION** implementation basis only. **Publication of the derivative ref is not, and does
not constitute, this designation.**

---

## 4. EXECUTION ORDER CONFIRMED

1. **This act is published and remotely verified** (blob/byte identity) — performed in this round, **before** any ref mutation.
2. **Then** the single authorized ref is created by **one non-forced push** of the exact object.
3. **Then** independent verification: remote ref tip = `2ded0e98…`; parent/tree from the remote object; `main`, the Gate A ref and all unrelated refs unchanged; **no PR opened from the new ref**; PR #8 still OPEN and unmerged.
4. Recorded in the accompanying **ref-creation and verification record** (separate additive artifact; this file is not amended).

**Stop rule:** if the object identity, parent, tree, or destination-ref state had differed from §2, the
push would have been aborted with the exact discrepancy reported; **no substitution and no
stop-and-improvise**.

---

## 5. WHAT THIS ACT DOES **NOT** AUTHORIZE

Consistent with the rendered `LIMITS` above, and with the prepared records it now renders:

1. **Gate B implementation** — no endpoint, resolver, framing, server, entrypoint, canonical-identity
   or operation file may be authored or changed; **D-4 remains ungranted and is not inferred** from
   this designation or from the ref creation.
2. **Gate C qualification** (Q1–Q11, including the **mandatory C5.1/Q9** zero-bytes probe) — deferred
   and **not claimed**.
3. **Gate D route admission** and **Gate E write policy** — not granted; **no durable write**, no
   successful-save claim; the IRR **HTTP 503 `owner-context-unavailable`** fence remains in force.
4. **P-6 / P-8** — not granted.
5. **Production eligibility**, certification, or deployment — not granted.
6. **G24 lineage promotion, merge, cherry-pick, re-pin, or admission**; moving `main` or any other ref.
7. **Merging PR #8** (or any IRR PR).
8. **Opening any PR** from the new ref; **any other ref** created, moved, or deleted.
9. **IRR repository** changes of any kind (this is an IPD-only act; the paired IRR act is separate and
   independently owned).
10. **Gate A store** modification, or any repetition of Gate A provisioning (that act is spent).

---

## 6. PRESERVED SAFEGUARDS AND EXCLUSIONS (unchanged, in force)

`L-IPC-1` **C1–C12** as accepted (blob `cab04b6f94618c9afad1440882ebf63437fdf6f8`) · **DP-2 Option 2F**
(unresolved/ambiguous holdings refused for persistence before serialization/port/persistence) · **C11**
single portfolio store · **H-18** one user / one personal laptop / non-production · the effective
**IRR DP-1 amendment** dependency (IRR `main` `10584439…`) · the **IRR 503 fence** · **all four Gate V
PA waivers** — V-1 ACL/SDDL capture, V-4 pipe collision/re-bind, second-account access, remote-machine
access — **waivers, not technical proof**.

*End of rendered authority act `IIPS-V3-G2-IPD-GATE-B-BASELINE-DESIGNATION-AND-REF-CREATION-2026-10-17-01`
— **D-1 ACCEPT · D-2 ACCEPT · FORM ACCEPT · ONE REF AUTHORIZED · IMPLEMENTATION STILL NOT GRANTED ·
NON_PRODUCTION**.*
