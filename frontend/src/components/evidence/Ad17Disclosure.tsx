/**
 * P13-B-07 — AD-17 / M-2 DISCLOSURE AND CLIENT-SIDE GUARD (UI17).
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 *
 * ⚠⚠ THIS COMPONENT EXISTS TO PREVENT A CLAIM, NOT TO MAKE ONE. ⚠⚠
 *
 * AD-17 / M-2 are UNRESOLVED. The accurate current basis (D62, corrected by addition):
 *
 *   - The platform `ReplayService` COMPUTES `reproduced`/`byteIdentical` from a comparison
 *     (see `ReplayService.ts`, "M-2 REPAIR (D41 Workstream C)"). It does not return literals.
 *   - The values that actually reach this UI come from `executive-transport.ts`
 *     `computeCertifiedReplay()`, which HARDCODES `reproduced: true` and
 *     `byteIdentical: true` and never invokes the `ReplayService` instance it holds.
 *   - Therefore runtime replay verification is NOT ESTABLISHED for the UI-facing values.
 *
 * A surface that renders `byteIdentical: true` as "MATCH — byte-identical" is therefore
 * asserting a verified reproduction that has never been performed.
 *
 * D54 §5.2 requires that UI17 MUST NOT assert verified replay or verified byte identity.
 * This module supplies:
 *   1. `assertNoVerifiedReplayClaim` — a guard mirroring the certified P12
 *      `assertAd17ConstraintPreserved`, applied at the presentation boundary.
 *   2. `ReplayLiteralDisplay` — renders the literals as UNVERIFIED reported values,
 *      with the AD-17 disclosure attached, and no pass/fail styling.
 *
 * P13-B does NOT repair AD-17 and does NOT resolve M-2. Both remain open, by instruction.
 */

/** The AD-17 constraint as carried by the certified P12 evidence/replay linkage module. */
export const AD17_DISCLOSURE = Object.freeze({
  ad17Status: 'UNRESOLVED',
  m2Defect: 'the UI-facing reproduced/byteIdentical values are hardcoded by executive-transport, not produced by a runtime verification',
  constraint: 'These values MUST NOT be presented as verified reproduction',
  resolutionGate: 'P15 (E2E Certification) — external Existing-IIPS authority',
});

/** Shape of a replay linkage DTO as produced by the certified contract. */
export interface ReplayLinkageView {
  readonly replayServiceLiterals?: { readonly reproduced: boolean | null; readonly byteIdentical: boolean | null };
  readonly verifiedReproduction?: boolean;
  readonly verifiedByteIdentical?: boolean;
}

/**
 * P13-B-07 — Presentation-boundary AD-17 guard.
 *
 * Throws if a DTO reaching the UI claims verified reproduction or verified byte identity.
 * This mirrors the server-side `assertAd17ConstraintPreserved` so that the prohibition
 * holds even if a future caller constructs a DTO by another path.
 */
export function assertNoVerifiedReplayClaim(dto: ReplayLinkageView): true {
  if (dto.verifiedReproduction === true) {
    throw new Error(
      'AD-17 violation: replay DTO claims verifiedReproduction=true — prohibited while AD-17/M-2 is UNRESOLVED',
    );
  }
  if (dto.verifiedByteIdentical === true) {
    throw new Error(
      'AD-17 violation: replay DTO claims verifiedByteIdentical=true — prohibited while AD-17/M-2 is UNRESOLVED',
    );
  }
  return true;
}

/** Render a reported literal without any verification semantics or pass/fail colour. */
function Literal({ label, value }: { label: string; value: boolean | null | undefined }) {
  const text = value === null || value === undefined ? 'not reported' : String(value);
  return (
    <li>
      <span style={{ color: 'var(--color-ink-secondary)' }}>{label}: </span>
      {/* ⚠ Deliberately NOT colour-coded. Colour would imply a verified pass/fail. */}
      <code data-testid={`replay-literal-${label}`}>{text}</code>
    </li>
  );
}

/**
 * P13-B-07 — UI17-safe display of the ReplayService literals.
 *
 * Shows the raw reported values plus the AD-17 disclosure. Makes no equivalence claim.
 */
export function ReplayLiteralDisplay({ dto }: { dto: ReplayLinkageView }) {
  assertNoVerifiedReplayClaim(dto);
  const literals = dto.replayServiceLiterals;

  return (
    <div
      data-testid="ad17-replay-literals"
      style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, background: 'var(--color-surface-1)' }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>
        Reported replay values — NOT VERIFIED
      </p>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
        <Literal label="reproduced" value={literals?.reproduced} />
        <Literal label="byteIdentical" value={literals?.byteIdentical} />
      </ul>
      <Ad17Note />
    </div>
  );
}

/** The standing AD-17 disclosure. Required wherever replay literals are displayed. */
export function Ad17Note() {
  return (
    <p data-testid="ad17-disclosure" style={{ fontSize: 11, color: 'var(--color-ink-secondary)', margin: '8px 0 0' }}>
      <strong>AD-17 / M-2 — UNRESOLVED.</strong> The platform replay service computes these
      values, but {AD17_DISCLOSURE.m2Defect}. They have <strong>not</strong> been verified by a
      reproduction procedure at runtime. They must not be read as evidence of verified replay or
      verified byte identity. Resolution gate: {AD17_DISCLOSURE.resolutionGate}.
    </p>
  );
}
