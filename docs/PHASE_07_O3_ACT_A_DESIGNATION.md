# O-3 Act A — Provider-Selection A-Role Designation

## Identity

| Field | Value |
|---|---|
| **Record type** | A-role designation |
| **Open item** | O-3 — Provider selection |
| **Act** | Act A — A-role designation for provider selection |
| **Date** | 2026-09-12 |
| **Designating authority** | Program Authority |
| **Designated A-role** | **Program Authority** |
| **Scope** | Authority to make the P07-03 provider-selection decision (O-3 Act B) |

## Designation

The **Program Authority** is hereby designated as the A-role authorized to perform the
provider-selection decision for O-3 (P07-03 entry criterion *"Providers selected"*).

This designation satisfies **DEP-P02-07**: *"Selection is an authority act; no A-role is assigned
to it"* — the A-role is now assigned to the **Program Authority**.

## Explicit scope boundaries

1. ✅ The **Program Authority** is authorized to perform the provider-selection decision for O-3.
2. ⛔ This designation does **NOT** itself select any provider.
3. ⛔ This designation does **NOT** constitute P07-03 implementation.
4. ⛔ This designation does **NOT** constitute P07 acceptance.
5. ⛔ This designation does **NOT** resolve O-2 (reconciliation resolution policy).
6. ⛔ OI-09 (identifier standard) remains an independent prerequisite for provider selection
   unless separately resolved.
7. ⛔ This designation is independent of existing P01/P05/P06/P07 authority roles. No prior
   A-role is silently reused or inferred.

## Non-inference rule satisfied

The Program Authority explicitly chose "Program Authority" as the designated A-role in a
direct interactive decision on 2026-09-12. No name was inferred from prior work, prior
acceptance authority, or prior A3 designations.

## Authoritative state after this act

| Item | State |
|---|---|
| O-3 A-role | ✅ **DESIGNATED — Program Authority** (this act) |
| O-3 provider selection | 🔴 **OPEN** — pending Act B (provider selection by Program Authority) |
| O-2 resolution policy | 🔴 **OPEN** — independent Act C required |
| OI-09 identifier standard | 🔴 **OPEN** — independent prerequisite for Act B |
| P07-03 implementation | ⛔ **NOT IMPLEMENTED** |
| P07 overall acceptance | ⛔ **NOT ESTABLISHED** |
| P07 certification | ⛔ **NONE GRANTED** |
| Production activation | ⛔ **NOT AUTHORIZED** |
| Act 6 | 🔴 **OPEN — NO OWNER ASSIGNED** |
| P01 | unchanged, MUST NOT be modified |

## Next act

The next act in the O-3 sequence is **Act B — Provider Selection**, to be performed by the
Program Authority using the P02-03 rubric (`P02_PROVIDER_CAPABILITY_MODEL.md` §7). Act B
must not proceed as though OI-09 were resolved unless there is authoritative evidence that
it has been resolved.

O-2 Act C (reconciliation resolution policy) remains a separate, independent authority act.

## Preserved records

All prior authority records preserved byte-for-byte:
- P01 GATE: `cf23f0eda0ee917626d90270e883073c5d52d62c`
- P07 implementation authorization (`c91690b`)
- A3 P07 gate acceptor designation (Sai, `a55e29f7`)
- P07-01 acceptance (`17f6bc25`)
- P07-02 acceptance (`2dc14c1c`)
- P07-04 acceptance (`cb53d8d`)
- Decision log §1–§30

## Validation

- Tests: 492/492 PASS
- diff --check: CLEAN
- P01 GATE: `cf23f0eda0ee917626d90270e883073c5d52d62c` ✅
- P07-01/02/04 acceptance: unchanged ✅
- O-2: OPEN ✅
- O-3: OPEN (pending Act B) ✅
- Act 6: OPEN — NO OWNER ASSIGNED ✅
- P07-03: NOT IMPLEMENTED ✅
