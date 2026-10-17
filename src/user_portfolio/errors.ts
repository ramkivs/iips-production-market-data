/**
 * Institutional Investment Platform System (IIPS)
 * G-2 / Gate B — Owner-Scoped Portfolio Refusal Vocabulary
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Authority: `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-2026-10-17-01` as rendered by
 * `IIPS-V3-G2-IPD-GATE-B-IMPLEMENTATION-AUTHORITY-DECISION-2026-10-17-01` (D-4 = ACCEPT).
 *
 * This vocabulary carries no wire form. The IPC layer maps each code onto its own refusal
 * reason, and every refusal is transmitted as a silent close (L-IPC-1 C6).
 */

export type UserPortfolioRefusalCode =
  | 'RESOURCE_UNAVAILABLE'
  | 'WRITE_NOT_AUTHORIZED'
  | 'MALFORMED_REQUEST'
  | 'CALLER_SUPPLIED_AUTHORITY'
  | 'CANONICAL_IDENTITY_UNRESOLVED';

/**
 * `RESOURCE_UNAVAILABLE` is used for every "no result" outcome — missing, foreign,
 * tenant-mismatched and tombstoned alike — so that existence is never disclosed (C6).
 */
export class UserPortfolioRefusal extends Error {
  public readonly code: UserPortfolioRefusalCode;

  constructor(code: UserPortfolioRefusalCode, message?: string) {
    super(message ?? `Portfolio request refused: ${code}`);
    this.name = 'UserPortfolioRefusal';
    this.code = code;
  }
}

export function isUserPortfolioRefusal(error: unknown): error is UserPortfolioRefusal {
  return error instanceof UserPortfolioRefusal;
}
