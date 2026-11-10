/** Read-only identity API over the existing P04 master and P7 registry. */
import { buildD114SecurityIdentity, isD114SecurityId } from '../../contracts/types.js';
import type { SecurityMaster } from '../../identity/security_master.js';
import type { DhanInstrumentRegistry } from './dhan_instrument_map.js';
import { qualifyHoldingSecurityIdentity, type HoldingIdentityInput, type SecurityIdentityQualificationResult } from './dhan_security_identity_service.js';

export type IdentityApiResult = SecurityIdentityQualificationResult | {
  readonly status: 'AMBIGUOUS';
  readonly reason: 'AMBIGUOUS_PROVIDER_MAPPING' | 'CONFLICTING_SERIES';
  readonly details: string;
};
export interface ExactIdentityRequest { readonly companyId: string; readonly exchange: 'NSE' | 'BSE'; readonly securityId: string }
export interface InstrumentSearchResult { readonly symbol: string; readonly exchange: 'NSE' | 'BSE'; readonly result: IdentityApiResult }

export class DhanIdentityApiService {
  constructor(private readonly master: SecurityMaster, private readonly registry: DhanInstrumentRegistry) {}

  qualify(input: HoldingIdentityInput): IdentityApiResult {
    const result = qualifyHoldingSecurityIdentity(input, this.master, this.registry);
    if (result.status === 'UNRESOLVED' && result.reason === 'AMBIGUOUS_PROVIDER_MAPPING') {
      return { status: 'AMBIGUOUS', reason: result.reason, details: result.details };
    }
    return result;
  }

  resolve(input: ExactIdentityRequest): IdentityApiResult {
    const parts = input.securityId.split(':');
    const identity = isD114SecurityId(input.securityId) ? buildD114SecurityIdentity(parts[1], parts[2]) : null;
    if (!identity) return { status: 'UNRESOLVED', reason: 'MISSING_SERIES_EVIDENCE', details: 'A complete canonical security identity is required.' };
    const segment = input.exchange === 'NSE' ? 'NSE_EQ' : 'BSE_EQ';
    const exact = this.registry.resolveExactIdentity(input.companyId, segment, identity);
    if (exact.status === 'UNRESOLVED') {
      if (exact.reason === 'AMBIGUOUS_MAPPING') return { status: 'AMBIGUOUS', reason: 'CONFLICTING_SERIES', details: exact.details };
      const security = this.registry.resolveSecurity(input.companyId, segment, identity.isin);
      if (security.status === 'RESOLVED' || (security.status === 'UNRESOLVED' && security.reason === 'AMBIGUOUS_MAPPING')) {
        return { status: 'AMBIGUOUS', reason: 'CONFLICTING_SERIES', details: 'The supplied series conflicts with registered evidence.' };
      }
      return { status: 'UNRESOLVED', reason: exact.reason === 'INSTRUMENT_INACTIVE' ? 'INACTIVE_OR_MISSING_LISTING' : 'MISSING_P7_MAPPING', details: exact.details };
    }
    const qualified = this.qualify({ isin: identity.isin, exchange: input.exchange });
    if (qualified.status !== 'QUALIFIED') return qualified;
    if (qualified.companyId.trim().toUpperCase() !== input.companyId.trim().toUpperCase()) return { status: 'UNRESOLVED', reason: 'MISSING_P04_CORRESPONDENCE', details: 'Company does not match P04 correspondence.' };
    if (qualified.securityIdentity.securityId !== identity.securityId) return { status: 'AMBIGUOUS', reason: 'CONFLICTING_SERIES', details: 'Series disagrees with qualified evidence.' };
    return qualified;
  }

  search(query: string): readonly InstrumentSearchResult[] {
    const term = query.trim().toUpperCase();
    return this.registry.list().filter(m => {
      if (m.symbol.toUpperCase().includes(term) || (m.isin?.toUpperCase().includes(term) ?? false)) return true;
      // A P7 display name need not be the exchange ticker. Use the existing P04
      // listing symbol for discovery only, and only when company, ISIN and
      // exchange evidence agree. Qualification below remains unchanged.
      if (!m.isin) return false;
      const entity = this.master.getEntity(m.companyId);
      if (!entity || entity.isin.trim().toUpperCase() !== m.isin.trim().toUpperCase()) return false;
      return entity.listings.some(listing => listing.exchange === m.exchange && listing.symbol.toUpperCase().includes(term));
    }).slice(0, 100).map(m => ({ symbol: m.symbol, exchange: m.exchange, result: this.qualify({ isin: m.isin ?? '', exchange: m.exchange }) }));
  }
}
