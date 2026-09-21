/**
 * D-PIT-WIRE-01 — executable `/api/company/:id` request path (the ONE in-scope route).
 *
 * The HTTP server delegates to this function verbatim, and repository tests invoke the same
 * function with a bounded provider. This avoids a source-only/"similar logic" test: request
 * parsing, 400 rules, mode dispatch, provider binding, fail-closed response and SNAPSHOT compute
 * are exactly the production route path.
 *
 * `mode` is NOT parsed here and can never come from the URL. The caller MUST pass the mode that
 * `resolveModeForPrincipal()` derived from authenticated UI12 preferences. `asOf` is only data
 * selection. No fallback is possible: a null/unbound provider leaves the PIT hook unbound.
 */
import type { DataMode } from '../settings/settings-service';
import {
  forMode,
  validateAsOfRequest,
  type PitRequestBinding,
} from '../data-mode/data-mode';
import type { PitVintageProvider } from './pitVintageProvider';

export interface CompanyTransportResult {
  readonly status: 200 | 400 | 404 | 405;
  readonly body: unknown;
}

function buildBinding(
  provider: PitVintageProvider | null,
  securityId: string,
  asOf: string,
): PitRequestBinding | undefined {
  if (provider === null || !provider.isBound()) return undefined;
  return {
    asOf,
    domain: 'D02',
    securityId,
    queryPit: (requestedAsOf: string) => provider.query('D02', securityId, requestedAsOf),
  };
}

/** Execute exactly one Company route target and return the HTTP status/body to write. */
export function executeCompanyTransportRequest(
  requestUrl: string,
  requestMethod: string | undefined,
  serverDerivedMode: DataMode,
  computeSnapshot: (securityId: string) => unknown,
  provider: PitVintageProvider | null,
): CompanyTransportResult {
  if ((requestMethod ?? 'GET').toUpperCase() !== 'GET') {
    return Object.freeze({
      status: 405 as const,
      body: Object.freeze({ error: 'method-not-allowed', allowed: 'GET' }),
    });
  }
  const prefix = '/api/company/';
  if (!requestUrl.startsWith(prefix)) {
    return Object.freeze({ status: 404 as const, body: Object.freeze({ error: 'not found' }) });
  }
  const rawTarget = requestUrl.slice(prefix.length);
  const qIndex = rawTarget.indexOf('?');
  const rawId = qIndex === -1 ? rawTarget : rawTarget.slice(0, qIndex);
  const params = new URLSearchParams(qIndex === -1 ? '' : rawTarget.slice(qIndex + 1));
  const asOfValues = params.getAll('asOf');
  // Duplicate asOf values are ambiguous data selection. Refuse rather than picking a winner.
  const rawAsOf = asOfValues.length === 0 ? undefined : asOfValues.length === 1 ? asOfValues[0]! : '__AMBIGUOUS__';
  const asOfCheck = validateAsOfRequest(serverDerivedMode, rawAsOf);
  if (!asOfCheck.ok) {
    return Object.freeze({ status: asOfCheck.status, body: Object.freeze({ error: asOfCheck.error }) });
  }

  let securityId: string;
  try {
    securityId = decodeURIComponent(rawId);
  } catch (e) {
    return Object.freeze({ status: 404 as const, body: Object.freeze({ error: String(e) }) });
  }
  if (securityId.length === 0 || securityId.includes('/')) {
    return Object.freeze({ status: 404 as const, body: Object.freeze({ error: 'company securityId is required' }) });
  }

  try {
    const pitBinding = asOfCheck.asOf === undefined
      ? undefined
      : buildBinding(provider, securityId, asOfCheck.asOf);
    const body = forMode(
      'Company',
      serverDerivedMode,
      () => computeSnapshot(securityId),
      pitBinding,
    );
    return Object.freeze({ status: 200 as const, body });
  } catch (e) {
    return Object.freeze({ status: 404 as const, body: Object.freeze({ error: String(e) }) });
  }
}
