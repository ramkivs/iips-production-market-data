# IIPS v3.0 — G-2 — **IPD GATE B BASELINE: DETERMINATION AND CLARIFICATION OF THE IMPLEMENTATION-BASIS DESIGNATION**

> ## STATUS: **CLARIFICATION — NO AUTHORITY RENDERED — NO REF CREATED — GATE B STILL NOT GRANTED**
> This artifact **resolves one wording gap** in the prepared IPD Gate B act (its §3 and §14 left the
> basis-ref question to the Program Authority without stating the *form* the authorization must
> take). It **renders nothing**, creates no ref, and changes no scope. It is **additive**: the
> published Gate B act and all prior Gate A evidence are **left byte-intact**.

| Field | Value |
|---|---|
| **Artifact identifier** | `IIPS-V3-G2-IPD-GATE-B-BASELINE-DESIGNATION-CLARIFICATION-2026-10-16-01` |
| **Artifact type** | **Additive clarification of a prepared act** (recording only; not a decision) |
| **Repository / branch (this record)** | `ramkivs/iips-production-market-data` / `arena/21c63aef-iips-production-market-data` (existing **PR #8** workstream; no competing PR) |
| **Clarifies (by reference, unmodified)** | `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01` — `evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_REQUEST_2026-10-16.md`, blob `8f29036846590209c79c410c555b259a3f70ed9f` (commit `16c0e645af68211b2184988ac5b113a7b7a8d89a`) — **§3 and §14 only, as clarified below** |
| **Authority capacity that must render the decision** | **RAMKI — Program Authority** (IPD capacity, and where applicable the IRR capacity for the paired act) |
| **Subject of the clarification** | whether creating/designating the proposed Gate B implementation-basis ref requires its own authority act, and what that act must contain |
| **Production status** | NON_PRODUCTION |

---

## 1. THE GAP BEING CLOSED

The prepared IPD Gate B act states the proposed basis (a new ref
`refs/heads/gate-b/local-principal-ipc-implementation` created at the published Gate A derivative
commit `2ded0e981407b38c73bdea164153f53856aa7217`) and correctly refuses to perform it — but it
leaves open *by whom and in what form* the basis is to be authorized, offering the Authority a
choice between "an explicit element of this Gate B act" and "a separate, prior act". That choice is
an unresolved **wording** gap: as written, a Gate B disposition that simply says `APPROVE` could be
read as authorizing ref creation **by implication**. This record closes that gap. It does not
decide the *substance* — whether the basis is granted — which remains entirely the Authority's.

---

## 2. DETERMINATION (explicit)

> **Creating or designating the Gate B implementation-basis ref requires an explicit authority act
> that names the ref and its starting commit object. It is never authorized by implication, and it
> is not authorized by this clarification, by the Gate B act's mere existence, by the Gate A
> execution, by the derivative's publication, by PR #8, or by the acceptance of `L-IPC-1`.**

**Basis for the determination (evidence, not preference):**

1. **Precedent in this lineage — ref creation has always required its own rendered authorization.**
   The publication of the Gate A derivative ref was expressly left by the executed record as
   *"Publication status of the derivative ref — **STATED, NOT DECIDED** … pushing the derivative ref
   to the IPD remote is an **outstanding step** for the Program Authority, if required"*, with the
   raw evidence capturing the invariant `no derivative ref pushed: 0 (must be 0 …)`. It was only
   after the Program Authority rendered a **dedicated, narrow ref-publication authorization** that
   the ref was created. The same pattern is applied here.
2. **The rendered Gate A decision expressly limits ref operations** (§6): the act does *"not …
   promote, merge, cherry-pick, re-pin, or admit any G24 lineage ref, **or move any ref at all**."*
   **No rendered act of record names any `gate-b/…` ref**, so no existing authority reaches it.
3. **Lineage rule — designation ≠ acceptance; no automatic promotion; do not infer authority from
   the existence of a branch, commit, PR, or published artifact.** A published commit is not a
   designated basis; the prepared act itself states the derivative is *"a **publication**, not an
   implementation basis or an admission"*.
4. **Ref creation alters the authoritative remote's ref inventory**, an operation this lineage has
   consistently treated as requiring explicit naming (and one the reconciliation recorded as a
   discrete, visible change: `34 → 35` heads for the derivative).

---

## 3. WHAT THE REQUIRED ACT MUST CONTAIN (minimum content)

Any act authorizing the basis must state, in its own words:

1. **the exact ref name** — proposed: `refs/heads/gate-b/local-principal-ipc-implementation`;
2. **the exact starting commit object** — proposed: `2ded0e981407b38c73bdea164153f53856aa7217`
   (parent `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`, tree `9069045d3daf22156020188696fc2f9c2f32bf27`),
   named at object level, with no substitution of a tree-identical descendant;
3. **that the act creates a new ref** at that commit and **does not** promote, merge, cherry-pick,
   re-pin, or admit the off-main G24 lineage, the Gate A derivative ref, or any other ref;
4. **that no other ref is created, moved, or deleted**, and that `main`, the accepted basis, the
   designated target, the governance branch, the NP-04 pin and the Gate A derivative ref are
   untouched;
5. **that no pull request is opened from the basis ref**, and PR #8 remains unmerged;
6. **that the basis ref is NON_PRODUCTION**, is not an admission or promotion of any lineage, and
   confers no Gate C/D/E, P-6, P-8, route-admission, or write authority;
7. **that publication of the derivative ref is not, and does not constitute, this designation.**

---

## 4. THE TWO ADMISSIBLE FORMS — AND WHY THE CHOICE IS NOT OPEN-ENDED

The prepared act's §3 offered the Authority two forms. This clarification confines that choice to
two **explicit** forms; it removes the possibility of an implicit third:

| Form | Content | Effect |
|---|---|---|
| **(i) DEFAULT — separate, prior act** | A rendered **"Gate B baseline designation"** act (`IIPS-V3-G2-IPD-GATE-B-BASELINE-DESIGNATION-…`) containing §3 items 1–7, rendered **before or together with** the Gate B implementation act | The Gate B act then implements *on* an already-designated basis |
| **(ii) Explicit element of the Gate B act** | The rendered Gate B act itself contains §3 items 1–7 verbatim | The single act does both jobs — but **only because it names them** |
| **(iii) Implicit / silent** | *Not admissible.* A Gate B disposition that does not name the ref and the commit **does not authorize creating it**, and the recording agent must stop rather than create it | — |

**Recommended for the Authority's convenience:** form (i), which keeps the basis designation, the
implementation scope, and the paired IRR act as three separately inspectable decisions — consistent
with how the Gate A derivative publication was handled.

---

## 5. EXACT PROPOSED DECISION TEXT FOR THE BASELINE DESIGNATION (form (i), for the Authority to render)

> **IPD Gate B — baseline designation.** I designate, as the Gate B implementation basis for
> `ramkivs/iips-production-market-data`, a **new ref**
> `refs/heads/gate-b/local-principal-ipc-implementation`, created at the **exact** commit
> `2ded0e981407b38c73bdea164153f53856aa7217` (parent `6828155ec6e882bbb4cabcd96b5a841d8c8a6bc4`,
> tree `9069045d3daf22156020188696fc2f9c2f32bf27`) — the published Gate A derivative. This
> designation **creates one new ref and nothing else**: it does **not** promote, merge, cherry-pick,
> re-pin, or admit the off-main G24 lineage or the Gate A derivative ref; it creates, moves, or
> deletes **no other ref**; it leaves `main`, the accepted basis, the designated target, the
> governance branch, the NP-04 pin and the Gate A derivative ref **untouched**; it opens **no pull
> request** and does not merge PR #8. The basis ref is **NON_PRODUCTION**, is **not** an admission
> or promotion of any lineage, and confers **no** Gate C/D/E, P-6, P-8, route-admission, or write
> authority. **Publication of the derivative ref is not, and does not constitute, this
> designation.** Implementation on this basis additionally requires the rendered IPD Gate B act
> (`IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-16-01`) and the rendered paired IRR act;
> none is inferred here. **Disposition:** `APPROVE` / `APPROVE WITH CHANGES` / `REJECT` / `DEFER`.

---

## 6. EFFECT ON THE PREPARED GATE B ACT

By reference only — **the act's published bytes are unchanged** (§3 and §14 remain as published,
including their offer of two forms):

- **§3** is clarified: the proposed basis, its starting commit, and the effects on existing refs
  stand as written; the sentence offering the Authority a choice now means **form (i) or form (ii)**
  of §4 above, **never** authorization by implication.
- **§14** is clarified: the bracketed placeholders *"**[the PA designates …]**"* and *"**[as an
  element of this act | as a separate prior act]**"* are to be filled **only** by one of the two
  explicit forms, with §3 items 1–7 present in the rendered text.
- **Nothing else in the act changes**: scope (§4), the IPC mechanism and trust boundary (§5), the
  C1–C12 obligations (§6), the C12 treatment (§7), refusal/fail-closed behavior (§8), the preserved
  controls (§9), exclusions (§10), the Gate B/Gate C test separation (§11), stop conditions (§12),
  and the publication constraint note (§15) all stand.

---

## 7. WHAT THIS CLARIFICATION DOES NOT DO

It **renders no authority**; **creates no ref** (`gate-b/*` on the IPD remote = **0 refs**, verified);
**does not touch** the derivative ref, `main`, the accepted basis, the target, the governance branch,
or the NP-04 pin; **does not implement Gate B**; **does not modify the Gate A store** (sha256
`7794e281…ab99e3`, unopened); **does not modify or rewrite** the prepared Gate B act or any Gate A
evidence; **does not merge** PR #8; **does not open a competing PR**; and **does not touch IRR**.

---

## 8. PUBLICATION OF THIS CLARIFICATION

Published additively in the **existing authorized PR #8 workstream** — one added governance
artifact; no competing PR, no implementation file, no schema or database change, no ref created or
moved.

*End of clarification `IIPS-V3-G2-IPD-GATE-B-BASELINE-DESIGNATION-CLARIFICATION-2026-10-16-01` —
**CLARIFICATION ONLY · NO AUTHORITY RENDERED · GATE B NOT GRANTED · NON_PRODUCTION**.*
