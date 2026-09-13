# P03 — PROVIDER-ACCESS SECURITY

**SPECIFICATION ONLY.** Defines how the security boundary meets P02's provider abstraction
**without changing it**. P02 is ACCEPTED (`2dd43cd`) and is **not modified** by this package.

---

## 1. Division of responsibility with P02

| Concern | P02 (accepted) | P03 (this package) |
|---|---|---|
| Entitlement **model** — dimensions, matrix structure | **OWNS** | Consumes |
| Entitlement **decision + enforcement** | Requires it happen (EV-1/EV-2) | **OWNS** |
| Capability gate | **OWNS** | Consumes; never overrides |
| Credential handling | Explicitly excluded (SC-1/SC-2) | **OWNS** |
| Caller authentication / tenancy | Out of scope | **OWNS** |
| Error taxonomy E1–E8 | **OWNS** | **Reuses; does not extend** |
| Containment of provider-native detail | **OWNS** (M-1…M-6) | Must not breach |
| Observability redaction | **OWNS** (RD-1…RD-6) | Inherits verbatim |

| # | Rule |
|---|---|
| DR-1 | **P03 adds no new obligation to the adapter contract.** It supplies an already-authorized, tenant-scoped, entitlement-checked request and a resolvable credential reference |
| DR-2 | **Adapters make no security decisions** (P02 A-11 read with P03 EP-3) |
| DR-3 | P03 must not cause any provider-native detail to escape the adapter |
| DR-4 | P03 must not cause any security detail to enter the canonical payload |

## 2. The secured flow

```
caller
  │  ① authenticate  → principal            (G1)  ⚠ M-5 DIRECT
  │  ② resolve tenant → tenant context      (G2)  ⚠ M-5 DIRECT
  │  ③ authorize     → operation permitted  (G3)
  ▼
data-plane enforcement point (server-side, single path)
  │  ④ capability gate                      (G4)  ← P02, principal-independent
  │  ⑤ entitlement gate, in tenant context  (G5)  ← P02 model, P03 enforcement
  │  ⑥ resolve credential by scoped reference (G6) ← P03 secret boundary
  ▼
╔═══════════════════════════════════════════════════════════╗
║ PROVIDER ADAPTER            (P02 boundary — unchanged)    ║
║  · AP-2 authenticate to provider using resolved credential║
║  · provider-native detail contained here                  ║
║  · credential never leaves this scope, never persisted    ║
╚═══════════════════════════════════════════════════════════╝
  │  ⑦ acquisition                          (P05 — not built)
  ▼
P01 CanonicalSnapshot     ← contains NO security element
  │   snapshotId = data-${provider}-${dataVersion}-${asOf}   (unchanged)
  ▼
downstream consumers (P05–P13 — not built)
```

| Step | Status |
|---|---|
| ①–⑥ | **DESIGN ONLY** — specified here, implemented later |
| ⑦ | **P05** — not designed or built here |
| Canonical snapshot | **P01 — ACCEPTED, unchanged** |
| Adapter boundary | **P02 — ACCEPTED, unchanged** |

## 3. Credential delivery to the adapter

| # | Rule |
|---|---|
| CD-1 | The adapter receives a **scoped secret reference**, resolved at call time — never a literal in configuration, code or request payload |
| CD-2 | Resolution is performed by an authorized **service principal**, not by the caller's principal |
| CD-3 | **The caller's credential is never forwarded to a provider** (AP-R2) |
| CD-4 | The credential is **provider-scoped**, and tenant-scoped where the relationship is tenant-specific (IS-1) |
| CD-5 | The credential is used **only** for AP-2 and is never persisted, logged, echoed or returned |
| CD-6 | Unresolvable reference ⇒ `CONFIGURATION_FAILURE`, **before** any provider call |
| CD-7 | Provider rejection of a resolved credential ⇒ **E2** `AUTHENTICATION_FAILURE`, **never retried**, never degraded to E1 |

## 4. Entitlement enforcement at the boundary

| # | Rule |
|---|---|
| EE-1 | The entitlement decision is made **before acquisition**, in the requesting tenant's context (P02 EV-1, IS-4 E-3) |
| EE-2 | **Capability and entitlement remain independent gates** (P02 CD-6/EV-2). P03 does not merge them |
| EE-3 | Whole-request denial ⇒ **E3**, **no snapshot produced** |
| EE-4 | Partial denial ⇒ snapshot produced with affected fields `availability = WITHHELD` + `entitlementRef`, `completenessPct` reduced (P02 §3.1) |
| EE-5 | `WITHHELD` is **never** conflated with `NOT_PROVIDED` — suppression and silence are different facts |
| EE-6 | An entitlement decision is **never inferred from a provider serving the data anyway** (P02 EV-7) |
| EE-7 | The entitlement matrix is **empty** — no provider selected, no licence granted (P02 EM-2/DEP-P02-10). **P03 does not populate it** |

## 5. Environment and activation constraints

| # | Rule |
|---|---|
| EA-1 | Provider access is **environment-scoped**; a development entitlement or credential grants nothing in production |
| EA-2 | ⚠ **No production provider access exists or may be created.** Production activation is `NOT_AUTHORIZED`; provider onboarding, licensing and connectivity are **P16** |
| EA-3 | **No provider is selected, named, contacted or configured** by P03 |
| EA-4 | The first adapter to exercise this path is expected to be the **local deterministic feed** (tracker `P05-01`), which requires no external credential — **P05, not built here** |

## 6. What P03 must not do to P02

| # | Prohibition |
|---|---|
| PN-1 | Must not add, remove or reclassify any P02 error class (E1–E8) |
| PN-2 | Must not weaken P02's fail-closed capability or entitlement gates |
| PN-3 | Must not introduce a second ingress or a bypass path around the adapter (AD-2; **G2 retired**) |
| PN-4 | Must not require an adapter to expose provider-native error detail, endpoints or accounts |
| PN-5 | Must not cause provider identity to reach a product DTO or UI (NFR-06) |
| PN-6 | Must not make caller identity vary the **data** returned other than via the G1–G5 gates (PP-5) |
| PN-7 | Must not alter `snapshotId`, lineage structure or any version axis |
