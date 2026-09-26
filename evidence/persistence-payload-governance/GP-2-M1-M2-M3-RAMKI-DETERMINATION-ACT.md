# Institutional Investment Platform System (IIPS)
# M-1 / M-2 / M-3 — RAMKI Determination Act

**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01
**Authority Act ID:** `gp-2-m1-m2-m3-ramki-determination-2026-09-26-001`
**Governing Authority:** RAMKI (Authorizing Authority — determinations below are RAMKI's, recorded verbatim)
**Recording Agent:** Arena (recording only — no value selected, ranked, or inferred by the agent)
**Act Type:** DETERMINATION ACT (non-executable; governance/design intent only)
**Recorded At (local, Asia/Calcutta):** 2026-09-26
**Antecedent Checkpoint:** `2220c43228606634de1f9515eab2659a167a4b4f`

---

## 1. VERIFIED ANTECEDENT STATE (inspected, not assumed)

| Item | Verified value |
| --- | --- |
| Authoritative remote | `origin` → `https://github.com/ramkivs/iips-production-market-data.git` (sole) |
| Authoritative branch | `refs/heads/main` @ `4d3e1cdca3a33da0ec3be8b336b17128108a502c` (UNCHANGED) |
| Workstream branch | `arena/01a0ddae-iips-production-market-data` |
| HEAD at recording | `2220c43228606634de1f9515eab2659a167a4b4f` |
| LOCAL == REMOTE before mutation | TRUE — `git ls-remote`, remote-tracking ref, GitHub API all agree |
| Worktree | CLEAN |
| Prior state | GP-1 ESTABLISHED · GP-2 NOT ESTABLISHED · M-1/M-2/M-3 UNRESOLVED |

## 2. M-1 — STORAGE TARGET CLASS — **DESIGNATED**

```text
M-1 = DESIGNATED
```

> **DURABLE / TRANSACTIONAL / APPLICATION-OWNED RELATIONAL PERSISTENCE TARGET, PROVIDER-NEUTRAL.**

No specific database vendor, cloud provider, hosting platform, or implementation technology is
selected by this determination.

## 3. M-2 — DOMAIN SCOPE — **DESIGNATED**

```text
M-2 = DESIGNATED
```

> **ALL SIX GATE-P DOMAINS.**

| ID | Domain |
| --- | --- |
| P-A | persistence foundation |
| P-B | Watchlists |
| P-C | Reports |
| P-D | Collaboration |
| P-E | Settings |
| P-F | Governed Screener |

This does **NOT** open GATE-Y and does **NOT** authorize Research/UI03, Intelligence/UI04,
`FundamentalsDTO`, `IntelligenceDTO`, or other Payload Governance scope.

## 4. M-3 — DURABILITY / RETENTION — **DESIGNATED**

```text
M-3 = DESIGNATED
```

> **DURABLE PERSISTENCE** with:
> - transactional consistency;
> - explicit ownership scoping;
> - governed retention;
> - no silent loss of committed application records.

No numeric retention period is designated by this act. Retention-period detail remains a
subsequent governance/design decision.

## 5. DESIGNATION IS NOT AUTHORITY

These determinations establish **governance/design intent only**. The following are recorded
separately and are **not** conferred by this act:

```text
IMPLEMENTATION_AUTHORITY        = NOT GRANTED
STORAGE_PROVISIONING_AUTHORITY  = NOT GRANTED
HOSTING_AUTHORITY               = NOT GRANTED
TRANSPORT_AUTHORITY             = NOT GRANTED
PAYLOAD_DATA_AUTHORITY          = NOT GRANTED
D115_IDENTITY_AUTHORITY         = UNCHANGED
PRODUCTION_AUTHORITY            = UNCHANGED
```

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

## 6. GP-1..GP-6

| Gate | State |
| --- | --- |
| `GP-1` | **ESTABLISHED** — persistence governance authority |
| `GP-2` | **NOT RESTATED BY THIS AUTHORIZATION** — M-1 is DESIGNATED, but RAMKI did not declare GP-2 ESTABLISHED and Arena does not infer it (see §9) |
| `GP-3` | **NOT AUTHORIZED** — no `PHASE5` §3 transport relief |
| `GP-4` | **UNRESOLVED / BLOCKED** — D115 C/D + `runtimeCompanyId` |
| `GP-5` | **NOT AUTHORIZED** — separate hosting/tier decision required |
| `GP-6` | **NOT AUTHORIZED** — persistence contract designation remains separate unless explicitly established by a later act |

## 7. M-SERIES CARRY-FORWARD

| Item | State |
| --- | --- |
| M-4 | **BLOCKED / DEPENDENT ON D115 + runtimeCompanyId** |
| M-5 | **GP-5 — NOT AUTHORIZED** |
| M-6 | **GP-3 — NOT AUTHORIZED** |

## 8. PRESERVATION

No existing record was modified. `A-1`, the GATE-P selection record, the GATE-P findings record,
the post-GATE-P authority packet, `GP-1`, the `GP-2` storage-target decision record, the `GP-2`
M-1/M-2/M-3 decision-pending record, the D8 historical position, and all frozen qualification,
certification, and release records remain byte-identical. No source, test, configuration,
deployment, or runtime file was touched. This act is purely additive.

```text
D8_REPOSITORY_TOKEN               = NOT FOUND
D8_HISTORICAL_GOVERNANCE_REFERENT = AUTHORITY-ASSERTED / EXTERNAL
D8_TRACEABLE_REPOSITORY_EVIDENCE  = NOT ESTABLISHED
D8_IMPLEMENTATION_AUTHORITY       = NOT ESTABLISHED BY A-1
```

## 9. OPEN ITEM — GP-2 FORMAL STATE

The authorization that produced this act supplied determinations for M-1, M-2 and M-3 but did
not state a new formal value for `GP-2`, which the antecedent record carries as NOT ESTABLISHED
for reason AUTHORITY / EVIDENCE INSUFFICIENT. Arena does not promote `GP-2` on the strength of
the M-1 designation, because a designation of intent is not a grant of authority. If `GP-2` is
intended to move, that requires an explicit RAMKI statement of its new value.

## 10. NEXT AUTHORITY ACTION (not authorized by this act)

Explicit RAMKI determination of: the `GP-2` formal state (§9); `GP-5` hosting/tier; `GP-6`
persistence contract designation; `GP-3` transport relief; and resolution of `GP-4` (D115 C/D and
`runtimeCompanyId`). Until those are recorded, no persistence implementation, provisioning,
hosting, deployment, transport, credential, provider-activation, or production step is authorized.

---

**End of Determination Act. Governance/design intent only. No implementation authorized, performed, or implied.**
