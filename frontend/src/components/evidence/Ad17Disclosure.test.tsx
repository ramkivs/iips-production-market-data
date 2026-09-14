/**
 * P13-B-07 — AD-17 / M-2 UI17 GUARD TESTS.
 *
 * ⚠ These are the tests D54 §5.1 requires. They exist to prove that the UI CANNOT
 *   assert verified replay or verified byte identity while AD-17/M-2 is UNRESOLVED.
 *
 * They do NOT resolve AD-17 and do NOT claim replay reproducibility.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Ad17Note, ReplayLiteralDisplay, assertNoVerifiedReplayClaim } from './Ad17Disclosure';

describe('P13-B-07 — AD-17 UI17 guard', () => {
  it('REJECTS a DTO claiming verified reproduction', () => {
    expect(() => assertNoVerifiedReplayClaim({ verifiedReproduction: true })).toThrow(/AD-17 violation/);
  });

  it('REJECTS a DTO claiming verified byte identity', () => {
    expect(() => assertNoVerifiedReplayClaim({ verifiedByteIdentical: true })).toThrow(/AD-17 violation/);
  });

  it('accepts the certified DTO shape, which always reports false', () => {
    expect(assertNoVerifiedReplayClaim({
      verifiedReproduction: false, verifiedByteIdentical: false,
      replayServiceLiterals: { reproduced: true, byteIdentical: true },
    })).toBe(true);
  });

  it('refuses to RENDER a forged verified-replay DTO', () => {
    expect(() => render(<ReplayLiteralDisplay dto={{ verifiedByteIdentical: true }} />)).toThrow(/AD-17 violation/);
  });
});

describe('P13-B-07 — UI17 displays literals without asserting verification', () => {
  const dto = {
    verifiedReproduction: false,
    verifiedByteIdentical: false,
    replayServiceLiterals: { reproduced: true, byteIdentical: true },
  };

  it('shows the raw literals', () => {
    render(<ReplayLiteralDisplay dto={dto} />);
    expect(screen.getByTestId('replay-literal-reproduced')).toHaveTextContent('true');
    expect(screen.getByTestId('replay-literal-byteIdentical')).toHaveTextContent('true');
  });

  it('marks them explicitly as NOT VERIFIED', () => {
    render(<ReplayLiteralDisplay dto={dto} />);
    expect(screen.getByTestId('ad17-replay-literals')).toHaveTextContent('NOT VERIFIED');
  });

  it('never renders a MATCH / byte-identical equivalence claim', () => {
    render(<ReplayLiteralDisplay dto={dto} />);
    // Scope the assertion to the VALUE region. The disclosure paragraph deliberately
    // contains the phrase "verified replay" inside a NEGATING sentence ("must not be read
    // as evidence of verified replay"), which is required wording, not a claim.
    const values = screen.getByTestId('ad17-replay-literals').textContent?.split('AD-17')[0] ?? '';
    expect(values).not.toMatch(/MATCH/);
    expect(values).not.toMatch(/byte-identical/);
    expect(values).toMatch(/NOT VERIFIED/);

    // The disclosure must assert the NEGATIVE, never a bare positive claim.
    const note = screen.getByTestId('ad17-disclosure').textContent ?? '';
    expect(note).toMatch(/have\s+not\s+been verified/);
    expect(note).toMatch(/must not be read as evidence of verified replay/);
  });

  it('does not colour the literals as pass/fail', () => {
    render(<ReplayLiteralDisplay dto={dto} />);
    const el = screen.getByTestId('replay-literal-byteIdentical');
    expect(el.getAttribute('style')).toBeNull();
  });

  it('reports an absent literal as "not reported" rather than false', () => {
    render(<ReplayLiteralDisplay dto={{ replayServiceLiterals: { reproduced: null, byteIdentical: null } }} />);
    expect(screen.getByTestId('replay-literal-reproduced')).toHaveTextContent('not reported');
  });

  it('always carries the AD-17 UNRESOLVED disclosure', () => {
    render(<Ad17Note />);
    const note = screen.getByTestId('ad17-disclosure');
    expect(note).toHaveTextContent('AD-17 / M-2 — UNRESOLVED');
    expect(note).toHaveTextContent('not');

    // D66 (L-7): the disclosure must state the ACCURATE basis. The previous assertion
    // required the word "literals", which encoded the stale claim that ReplayService
    // returns literals. Per D62 it COMPUTES them; the UI-facing values are hardcoded by
    // executive-transport. These assertions are strictly stronger than the one replaced.
    expect(note).toHaveTextContent(/computes/i);
    expect(note).toHaveTextContent(/hardcoded by executive-transport/i);
    expect(note).toHaveTextContent(/not.+been verified by a reproduction procedure/i);
    // Must NOT reinstate the stale characterisation.
    expect(note.textContent ?? '').not.toMatch(/returns\s+reproduced\/byteIdentical\s+as\s+literals/i);
    // Must NOT assert verified replay (AD-17 firewall).
    expect(note).toHaveTextContent(/must not be read as evidence of verified replay/i);
  });
});
