/**
 * IIPS — OPTION A PORTFOLIO RESOLVER
 *
 * Authority: DEC-PORTFOLIO-IDENTITY-01 (APPROVED)
 * Specification: docs/p04/P04_CANONICAL_SECURITY_MODEL.md
 * Contract: p12/src/objectResolutionContract.js (OR-1 to OR-7)
 *
 * Responsibilities:
 *   - Resolve approved identifier types through governed P04/P12 mechanisms.
 *   - Resolve canonicalSecurityId.
 *   - Resolve authoritative sector.
 *   - Fail closed on unresolved securities (OR-2).
 *   - Never infer sector heuristically.
 *   - Never invent identifiers.
 *   - Never perform external network lookups.
 *
 * Identity rules:
 *   - canonicalSecurityId is authoritative internal identity (CS-1).
 *   - FIGI is the authoritative external identifier standard (XI-1).
 *   - ISIN is interoperable / non-authoritative (XI-3).
 *   - symbol/ticker is an accepted resolution input, but is not authoritative identity (LS-2, OR-1).
 *   - Unresolved or ambiguous identity must fail closed.
 */
// @ts-expect-error — certified JS module.
import * as objectResolution from '../../../p12/src/objectResolutionContract.js';

export const AUTHORIZED_SECTORS = Object.freeze([
  'Banking',
  'Insurance',
  'Capital Markets',
  'Healthcare',
  'Hospitality',
  'Energy',
  'Utilities',
  'Consumer',
  'Industrials',
  'Technology',
  'Telecommunications',
  'Automobile',
  'Materials & Metals',
] as const);

export type AuthorizedSector = (typeof AUTHORIZED_SECTORS)[number];

export function isAuthorizedSector(s: string): s is AuthorizedSector {
  return (AUTHORIZED_SECTORS as readonly string[]).includes(s);
}

export interface GovernedSecurityRecord {
  readonly canonicalSecurityId: string;
  readonly symbol: string;
  readonly name: string;
  readonly sector: AuthorizedSector;
  readonly lifecycleState: string;
  readonly identifiers: Readonly<Record<string, string>>;
}

export class PortfolioResolutionError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PortfolioResolutionError';
    this.code = code;
  }
}

/**
 * Governed security master universe for Option A.
 * Sourced directly from certified reference assets and P12 derived universe.
 */
export const GOVERNED_SECURITIES: readonly GovernedSecurityRecord[] = Object.freeze([
  // 10 Certified Reference Equities
  Object.freeze({
    canonicalSecurityId: 'sec-tcs-in',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    sector: 'Technology',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BD72Y4', ISIN: 'INE467B01029' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-infy-in',
    symbol: 'INFY',
    name: 'Infosys Limited',
    sector: 'Technology',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000D03Y78', ISIN: 'INE009A01021' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-hdfcbank-in',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank',
    sector: 'Banking',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BMS2D3', ISIN: 'INE040A01034' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-icicibank-in',
    symbol: 'ICICIBANK',
    name: 'ICICI Bank',
    sector: 'Banking',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BD9241', ISIN: 'INE090A01021' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-reliance-in',
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    sector: 'Energy',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BDC0Q5', ISIN: 'INE002A01018' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-lt-in',
    symbol: 'LT',
    name: 'Larsen & Toubro',
    sector: 'Industrials',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BF1BH7', ISIN: 'INE018A01030' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-hindunilvr-in',
    symbol: 'HINDUNILVR',
    name: 'Hindustan Unilever',
    sector: 'Consumer',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BMNF76', ISIN: 'INE030A01027' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-itc-in',
    symbol: 'ITC',
    name: 'ITC Limited',
    sector: 'Consumer',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BDKBL2', ISIN: 'INE154A01025' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-sunpharma-in',
    symbol: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries',
    sector: 'Healthcare',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BM19M1', ISIN: 'INE044A01036' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'sec-titan-in',
    symbol: 'TITAN',
    name: 'Titan Company',
    sector: 'Consumer',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG000BMNVX6', ISIN: 'INE280A01028' }),
  }),

  // 13 Governed Sector Proxy Entities (${sector}-H1)
  Object.freeze({
    canonicalSecurityId: 'Banking-H1',
    symbol: 'Banking-H1',
    name: 'Banking Reference Entity',
    sector: 'Banking',
    lifecycleState: 'active',
    identifiers: Object.freeze({ FIGI: 'BBG00SYNTH01', ISIN: 'XS00SYNTH010' }),
  }),
  Object.freeze({
    canonicalSecurityId: 'Insurance-H1',
    symbol: 'Insurance-H1',
    name: 'Insurance Reference Entity',
    sector: 'Insurance',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Capital Markets-H1',
    symbol: 'Capital Markets-H1',
    name: 'Capital Markets Reference Entity',
    sector: 'Capital Markets',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Healthcare-H1',
    symbol: 'Healthcare-H1',
    name: 'Healthcare Reference Entity',
    sector: 'Healthcare',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Hospitality-H1',
    symbol: 'Hospitality-H1',
    name: 'Hospitality Reference Entity',
    sector: 'Hospitality',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Energy-H1',
    symbol: 'Energy-H1',
    name: 'Energy Reference Entity',
    sector: 'Energy',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Utilities-H1',
    symbol: 'Utilities-H1',
    name: 'Utilities Reference Entity',
    sector: 'Utilities',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Consumer-H1',
    symbol: 'Consumer-H1',
    name: 'Consumer Reference Entity',
    sector: 'Consumer',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Industrials-H1',
    symbol: 'Industrials-H1',
    name: 'Industrials Reference Entity',
    sector: 'Industrials',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Technology-H1',
    symbol: 'Technology-H1',
    name: 'Technology Reference Entity',
    sector: 'Technology',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Telecommunications-H1',
    symbol: 'Telecommunications-H1',
    name: 'Telecommunications Reference Entity',
    sector: 'Telecommunications',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Automobile-H1',
    symbol: 'Automobile-H1',
    name: 'Automobile Reference Entity',
    sector: 'Automobile',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
  Object.freeze({
    canonicalSecurityId: 'Materials & Metals-H1',
    symbol: 'Materials & Metals-H1',
    name: 'Materials & Metals Reference Entity',
    sector: 'Materials & Metals',
    lifecycleState: 'active',
    identifiers: Object.freeze({}),
  }),
]);

export interface SecurityResolutionInput {
  readonly canonicalSecurityId?: string;
  readonly symbol?: string;
  readonly figi?: string;
  readonly isin?: string;
  readonly identifier?: string;
  readonly sector?: string;
}

/**
 * Resolve an input identifier against the governed universe using P04/P12 rules.
 * Fails closed on any unresolved, ambiguous, or unauthorized input.
 */
export function resolveSecurity(
  input: SecurityResolutionInput,
  tenantId: string,
  asOf: string = '2026-08-09T00:00:00.000Z',
  securities: readonly GovernedSecurityRecord[] = GOVERNED_SECURITIES,
): GovernedSecurityRecord {
  if (!tenantId || tenantId.trim() === '') {
    throw new PortfolioResolutionError('tenantId required for resolution — fail closed', 'MISSING_TENANT');
  }

  // Determine inputType and inputValue based on precedence: canonicalSecurityId -> figi -> isin -> identifier -> symbol
  let inputType: string | null = null;
  let inputValue: string | null = null;

  if (typeof input.canonicalSecurityId === 'string' && input.canonicalSecurityId.trim() !== '') {
    inputType = 'canonicalSecurityId';
    inputValue = input.canonicalSecurityId.trim();
  } else if (typeof input.figi === 'string' && input.figi.trim() !== '') {
    inputType = 'identifier';
    inputValue = input.figi.trim();
  } else if (typeof input.isin === 'string' && input.isin.trim() !== '') {
    inputType = 'identifier';
    inputValue = input.isin.trim();
  } else if (typeof input.identifier === 'string' && input.identifier.trim() !== '') {
    inputType = 'identifier';
    inputValue = input.identifier.trim();
  } else if (typeof input.symbol === 'string' && input.symbol.trim() !== '') {
    inputType = 'symbol';
    inputValue = input.symbol.trim();
  }

  if (!inputType || !inputValue) {
    throw new PortfolioResolutionError('No valid security identifier provided for resolution', 'MISSING_IDENTIFIER');
  }

  // Execute P12 resolution request contract
  let p12Request: ReturnType<typeof objectResolution.buildResolutionRequest>;
  try {
    p12Request = objectResolution.buildResolutionRequest({
      inputType,
      inputValue,
      asOf,
      tenantId,
    });
  } catch (e) {
    throw new PortfolioResolutionError(`Invalid resolution request: ${(e as Error).message}`, 'INVALID_REQUEST');
  }

  // Resolve object through P04/P12 mechanism
  let resolvedObj: Record<string, unknown>;
  try {
    resolvedObj = objectResolution.resolveObject({
      request: p12Request,
      securities: securities as unknown as object[],
    }) as Record<string, unknown>;
  } catch (e) {
    // OR-2: Fail closed on unresolved security
    throw new PortfolioResolutionError(
      `Unresolved security '${inputValue}' (type: ${inputType}) as of ${asOf} — fail-closed; no speculative classification`,
      'UNRESOLVED_SECURITY',
    );
  }

  // Find the full governed record matching the canonical ID
  const matched = securities.find((s) => s.canonicalSecurityId === resolvedObj.canonicalSecurityId);
  if (!matched) {
    throw new PortfolioResolutionError(
      `Internal resolution invariant violated: security '${resolvedObj.canonicalSecurityId}' not found in registry`,
      'UNRESOLVED_SECURITY',
    );
  }

  // Cross-check: If user provided BOTH symbol and canonicalSecurityId, ensure they do not conflict
  if (
    typeof input.symbol === 'string' &&
    input.symbol.trim() !== '' &&
    matched.symbol.toUpperCase() !== input.symbol.trim().toUpperCase()
  ) {
    throw new PortfolioResolutionError(
      `Ambiguous security: symbol '${input.symbol}' does not match canonical security symbol '${matched.symbol}'`,
      'AMBIGUOUS_SECURITY',
    );
  }

  // Cross-check: If user explicitly provided a sector, verify it matches the authoritative sector
  if (typeof input.sector === 'string' && input.sector.trim() !== '') {
    if (input.sector.trim() !== matched.sector) {
      throw new PortfolioResolutionError(
        `Sector mismatch: input sector '${input.sector}' does not match authoritative sector '${matched.sector}'`,
        'SECTOR_MISMATCH',
      );
    }
  }

  // Verify authoritative sector belongs to the closed 13-sector taxonomy
  if (!isAuthorizedSector(matched.sector)) {
    throw new PortfolioResolutionError(
      `Authoritative sector '${matched.sector}' is outside the authorized 13-sector taxonomy`,
      'UNAUTHORIZED_SECTOR',
    );
  }

  return matched;
}
