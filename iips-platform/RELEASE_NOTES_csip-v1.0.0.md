# Release Notes — CSIP v1.0.0 (Cross-Sector Intelligence Platform)

**Tag:** `csip-v1.0.0`
**Release date:** 2026-08-08
**Status:** Production release (promoted from `csip-rc-1.0.0` after independent verification)
**Program:** v1.1 Track 5 — first platform capability released on top of the four immutable sector engines

---

## Major capabilities

- **Cross-Sector Intelligence Platform** (`platform.cross-sector`): a platform plugin consuming the **published outputs** of Banking, Insurance, Capital Markets, and Healthcare engines via the Universal Investment Ontology.
- **7 core services:** Ontology Mapping, Portfolio Intelligence, Cross-Sector Ranking, Capital Allocation, Diversification Analysis, Opportunity Detection, Correlation Analysis, Reporting, plus Cross-Sector Evidence.
- **Black-box contract:** consumes only normalized engine outputs; never recomputes sector scores or reads engine internals.
- **Deterministic + replay-identical** across the entire pipeline.
- **Future-proof:** new sectors (Hospitality, Energy, etc.) register via ontology metadata with **no CSIP logic change**.

## Frozen specification version

- CSIP v1.0.0 (frozen) + Universal Investment Ontology 1.0.0
- Consumes the four released engines v1.0 (immutable): Banking, Insurance, Capital Markets, Healthcare

## Compatibility

- Platform reused unchanged — **0 platform modifications**
- **0 engine modifications** (four engines immutable and authoritative)
- Five-plugin coexistence: 4 sector engines + CSIP

## Verification

- `tsc --noEmit` clean
- **102/102 tests pass**
- All 6 frozen portfolio expected outputs reproduced exactly (clean clone)
- Replay byte-identical (5/5 assertions)
- 8 allocation fixtures + 5 diversification fixtures verified
- Independent clean-clone verification passed

## Known limitations

- Correlation is platform-metadata-only (no price-based correlation, per governance)
- No performance optimization (replay-first, per governance)

## Roadmap

- CSIP v1.1/v2.0 via versioned methodology changes
- Program v1.1: Track 6 new sectors (Hospitality IES-010 next)
