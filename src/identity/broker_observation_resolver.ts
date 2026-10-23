import { getGovernedBroadSecurityMaster } from './governed_fixture_master.js';
import { IdentityAmbiguityError } from './quarantine.js';
import type { IdentityQuarantineRecord } from './quarantine.js';
import type { SecurityMaster } from './security_master.js';

export interface BrokerObservation {
  readonly symbol: string;
  readonly isin?: string;
  readonly exchange?: 'NSE' | 'BSE';
}

export type BrokerObservationResolution =
  | { readonly status: 'RESOLVED'; readonly companyId: string; readonly sourceRevision: string }
  | {
      readonly status: 'UNMAPPED' | 'AMBIGUOUS';
      readonly reason: string;
      readonly sourceRevision: string;
      readonly quarantineRecord?: IdentityQuarantineRecord;
    };

export interface BrokerObservationResolver {
  resolve(observation: BrokerObservation, asOf: string): BrokerObservationResolution;
}

/**
 * Resolves broker-observed identifiers against the existing governed D05
 * SecurityMaster. Every supplied identifier must resolve and agree; this
 * deliberately fails closed rather than allowing a valid ISIN to mask a
 * conflicting or unknown supplied symbol.
 */
export function createGovernedBrokerObservationResolver(
  master: SecurityMaster = getGovernedBroadSecurityMaster(),
): BrokerObservationResolver {
  const revision = master.sourceRevision;
  if (
    !revision ||
    revision.recordCount !== 2250 ||
    !/^[a-f0-9]{64}$/i.test(revision.fileChecksumSha256) ||
    revision.authorizationRef !== 'AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001'
  ) {
    throw new Error('the broker identity source is not the governed D05 master revision');
  }
  const sourceRevision = `${revision.batchId}:${revision.fileChecksumSha256}`;

  return {
    resolve(observation, asOf) {
      const identifiers: Array<{ type: 'ISIN' | 'NSE_SYMBOL' | 'BSE_SYMBOL'; value: string }> = [];
      if (typeof observation.isin === 'string' && observation.isin.trim()) {
        identifiers.push({ type: 'ISIN', value: observation.isin });
      }
      if (typeof observation.symbol === 'string' && observation.symbol.trim()) {
        if (!observation.exchange) {
          return { status: 'AMBIGUOUS', reason: 'MISSING_EXCHANGE: a broker symbol requires an explicit exchange.', sourceRevision };
        }
        identifiers.push({ type: observation.exchange === 'NSE' ? 'NSE_SYMBOL' : 'BSE_SYMBOL', value: observation.symbol });
      }
      if (identifiers.length === 0) return { status: 'UNMAPPED', reason: 'UNMAPPED_IDENTIFIER: no broker identifier was supplied.', sourceRevision };

      const matches: string[] = [];
      for (const identifier of identifiers) {
        try {
          matches.push(master.resolveCompanyId({ identifierType: identifier.type, identifierValue: identifier.value, asOf }));
        } catch (error) {
          if (error instanceof IdentityAmbiguityError) {
            return {
              status: error.quarantineRecord.reason === 'AMBIGUOUS_COLLISION' ? 'AMBIGUOUS' : 'UNMAPPED',
              reason: `${error.quarantineRecord.reason}: ${identifier.type} did not resolve uniquely in the governed source.`,
              sourceRevision,
              quarantineRecord: error.quarantineRecord,
            };
          }
          return { status: 'UNMAPPED', reason: 'UNMAPPED_IDENTIFIER: governed identity resolution failed closed.', sourceRevision };
        }
      }
      const unique = [...new Set(matches)];
      if (unique.length !== 1) {
        return { status: 'AMBIGUOUS', reason: 'AMBIGUOUS_COLLISION: supplied broker identifiers resolve to different canonical identities.', sourceRevision };
      }
      return { status: 'RESOLVED', companyId: unique[0], sourceRevision };
    },
  };
}
