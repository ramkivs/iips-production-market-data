# Dhan W-06 — final owner attestation and disposition

**W-06 final status: COMPLETE — OWNER ATTESTED**

**Acceptance authority:** The system owner is the single accountable owner, Program Authority (PA) and Product Owner (PO), and personally performed and verified the execution. The owner explicitly accepts the successful outcome as final. This record is the owner's authoritative acceptance basis; it does not assert independent observation by the author of this record.

## Final execution attestation

The owner attests that, after approximately 22 hours of execution and troubleshooting:

1. Dhan credential configuration and resolution were successfully established. The Windows DPAPI-backed credential path reached **READY**, credential readiness was **CONFIGURED**, and live credential resolution succeeded.
2. The IPD market-data daemon started successfully with the intended configuration.
3. The integrated Dhan quote request completed successfully with **HTTP 200**, and the response was successfully normalized into a canonical **D01_QUOTES** envelope.
4. The request used company ID `EQ_RELIANCE_IN`, canonical security ID `ISIN:INE002A01018:EQ`, and exchange segment `NSE_EQ`.
5. The canonical response contained the expected identity, quote fields, source classification, vendor tier, data version and lineage information. The owner personally verified the successful outcome.

The reported quote observation was on **13 November 2026** and receipt was on **15 November 2026**, when the market was closed. The earlier IRR assessment records the operator-reported observation as `2026-11-13T10:29:51.000Z` and receipt as `2026-11-15T13:35:10.151Z`. These are historical, owner-reported observation and receipt instants, not a current-price assertion. Under the existing time-based policy, **UNAVAILABLE** is an honest freshness and downstream-use classification. It does not invalidate the successful authentication, provider execution or canonical quote delivery.

## Acceptance and evidence boundary

The owner confirms the successful execution and accepts it as final. **No further owner evidence, repeat execution, credential action, rebuild, service restart or additional vendor request is required for W-06 closure.** This record does not claim that a separately retained disclosure-scan report exists or that a scan was performed or had a particular result. Additional raw captures and such a report are not the basis of this disposition; the final owner attestation above is. No credential values, transport tokens, secret references, carrier details, raw output or sensitive local locations are recorded here.

The successful quote supports the distinction between **M1** (successful real authentication) and **M2a** (first real quote response normalized to D01): both events are included in the owner's attestation. This IPD record does not purport to amend the IRR-owned roadmap or independently certify its formal milestone status. **M2 is not automatically complete**: qualified live quote acceptance remains governed by the roadmap's separate qualification criteria. Freshness eligibility and live qualification are distinct from successful quote delivery.

## Cross-repository reconciliation

The earlier IRR roadmap progression assessment is preserved as the historical position **before this final owner attestation**:

- Repository: `ramkivs/iips-review-recovered`
- Branch: `arena/f7a6af20-iips-review-recovered`
- Commit: `eea3a93e9a3ce3a8ab2a1b2909cfcec3292d9e3f`
- Assessment: [`docs/integration/DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT-2026-11-15.md`](https://github.com/ramkivs/iips-review-recovered/blob/eea3a93e9a3ce3a8ab2a1b2909cfcec3292d9e3f/docs/integration/DHAN-W06-ROADMAP-PROGRESSION-ASSESSMENT-2026-11-15.md)
- Roadmap: [`docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`](https://github.com/ramkivs/iips-review-recovered/blob/eea3a93e9a3ce3a8ab2a1b2909cfcec3292d9e3f/docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md)

That assessment recorded W-06 as partially complete pending a disclosure-evidence disposition. This IPD record supplies the **subsequent final owner attestation and disposition** needed to reconcile it: W-06 is **COMPLETE — OWNER ATTESTED**, with no further owner evidence required. It does not rewrite the earlier assessment or retrospectively assert that its requested scan was performed. IRR owns any subsequent update to its roadmap and assessment references.

## Forward work

Proceed under the existing roadmap and its dependencies, without repeating W-06. For the quote branch, **W-12 qualification** follows W-06; evaluate already available information against its separate criteria and sequence W-13 after the relevant decision and W-12 normalizer work. W-14 mapping qualification remains distinct. W-07 and W-27 preparation and IRR-owned W-11 can progress according to their own dependencies. M2, history, health, freshness, mapping expansion and later product milestones remain governed work; this W-06 attestation does not automatically complete them or authorize new vendor requests.
