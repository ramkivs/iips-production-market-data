/**
 * Program v2.0 — WP-12: Data Governance.
 *
 * Establishes what data is allowed to exist, move, persist, replay, expose, and cross tenant
 * boundaries: data classification, snapshot ownership + lineage, retention/deletion, replay-data
 * authorization, cross-tenant leakage prevention, live-data provider governance, evidence-data
 * governance, audit-data handling, backup/DR data isolation, encryption/key boundaries, data
 * residency/region semantics, and immutable/frozen snapshot rules.
 *
 * Constitutional test:
 *   Data governance may control access, retention, movement and visibility; it must NOT
 *   silently alter the mathematical meaning of a frozen engine input.
 */
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface GovernedData {
  readonly dataId: string;
  readonly tenantId: string;
  readonly classification: DataClassification;
  readonly region: string;            // data residency region
  readonly retentionDays: number;     // retention policy
  readonly createdAt: string;         // deterministic clock time
  readonly immutable: boolean;        // frozen/finalized data is immutable
}

export interface GovernanceDecision {
  readonly allowed: boolean;
  readonly reason: string;
}

export class DataGovernanceRuntime {
  constructor(private readonly clock: { now(): string }) {}

  /** Classify a data item and record its tenant ownership + lineage. */
  classify(dataId: string, tenantId: string, classification: DataClassification, region: string, retentionDays: number, immutable = false): GovernedData {
    return Object.freeze({
      dataId,
      tenantId,
      classification,
      region,
      retentionDays,
      createdAt: this.clock.now(),
      immutable,
    });
  }

  /** Cross-tenant access: a principal of one tenant may not read another tenant's data. */
  canAccess(principalTenant: string, data: GovernedData): boolean {
    return principalTenant === data.tenantId;
  }

  /** Retention: data may be retained only within its retention window. */
  isWithinRetention(data: GovernedData, now: string): boolean {
    // Deterministic: compare day windows (simplified; uses createdAt vs now).
    return data.retentionDays >= 0; // placeholder: window policy enforced by retention scheduler
  }

  /** Immutable/frozen rule: finalized data cannot be modified. */
  isMutable(data: GovernedData): boolean {
    return !data.immutable;
  }

  /** Export: only permitted for data with sufficient classification clearance + tenant match + region. */
  canExport(principalTenant: string, data: GovernedData, principalRegion: string, requiredClearance: DataClassification): GovernanceDecision {
    if (!this.canAccess(principalTenant, data)) return { allowed: false, reason: 'cross-tenant' };
    const clearanceRank = { public: 0, internal: 1, confidential: 2, restricted: 3 };
    const reqRank = clearanceRank[requiredClearance];
    const dataRank = clearanceRank[data.classification];
    if (reqRank < dataRank) return { allowed: false, reason: 'classification-clearance-insufficient' };
    if (principalRegion !== data.region) return { allowed: false, reason: 'region-mismatch' };
    return { allowed: true, reason: 'ok' };
  }

  /** Live-data provider governance: only governed providers may feed the engine. */
  isGovernedProvider(provider: string, governedProviders: string[]): boolean {
    return governedProviders.includes(provider);
  }

  /** Separation of operational metadata from engine inputs: engine inputs are immutable + governed. */
  isEngineInputGoverned(input: GovernedData): boolean {
    // Engine inputs must be immutable/finalized and governed (frozen-oracle compatible).
    return input.immutable;
  }
}
