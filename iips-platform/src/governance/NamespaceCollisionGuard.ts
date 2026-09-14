/**
 * ADR-01 C1–C6 Namespace Collision Guard
 * 
 * Authority: D41 External Remediation Work Request (Workstream A, R-A5)
 * 
 * Purpose: Prevent unguarded merge of market-data snapshot fields with company inputs.
 * High-risk collision keys (peRatio, evEbitda, evRevenue, fcfYield, etc.) MUST be
 * namespaced when sourced from market data. Fail-closed on any violation.
 * 
 * Rules:
 *   C1: Market-data fields MUST carry MD: namespace prefix
 *   C2: Fail-closed on collision between snapshot fields and company inputs
 *   C3: No silent overwrite — explicit error on collision
 *   C4: High-risk keys detected and rejected if bare (un-namespaced)
 *   C5: Contributing snapshot IDs must be unique (no duplicates)
 *   C6: Company inputs must NOT carry MD: namespace (reserved for market data)
 */

/** MD: namespace token (OI-10 resolved). */
export const NAMESPACE_TOKEN = 'MD:';

/** High-risk collision surface — keys that appear in both market-data and engine inputs. */
export const HIGH_RISK_COLLISION_KEYS = Object.freeze([
  'peRatio', 'evEbitda', 'evRevenue', 'fcfYield',
  'roic', 'roce', 'ebitdaMargin', 'debtEbitda',
  'revenueGrowth', 'segment', 'id',
  'archetype', 'subsegment', 'businessModel',
]);

/** Namespace collision violation error. */
export class NamespaceCollisionViolation extends Error {
  constructor(
    public readonly rule: string,
    message: string,
    public readonly detail: Record<string, unknown> = {}
  ) {
    super(`[${rule}] ${message}`);
    this.name = 'NamespaceCollisionViolation';
  }
}

/**
 * Check if a key carries the MD: namespace prefix (C1).
 */
export function isNamespaced(key: string): boolean {
  return typeof key === 'string' && key.startsWith(NAMESPACE_TOKEN);
}

/**
 * C1: Assert all market-data field keys carry MD: namespace.
 */
export function assertC1(fieldKeys: readonly string[]): void {
  for (const key of fieldKeys) {
    if (!isNamespaced(key)) {
      throw new NamespaceCollisionViolation('C1',
        `Market-data field '${key}' missing mandatory namespace prefix '${NAMESPACE_TOKEN}'`,
        { offendingKey: key });
    }
  }
}

/**
 * C2/C3: Detect collision between snapshot fields (after stripping MD: prefix) and company inputs.
 * Fail-closed: any collision aborts the merge.
 */
export function assertC2C3(
  fieldKeys: readonly string[],
  companyInputKeys: readonly string[]
): void {
  const fieldBareNames = fieldKeys.map(k => {
    const stripped = k.startsWith(NAMESPACE_TOKEN) ? k.slice(NAMESPACE_TOKEN.length) : k;
    const dotIdx = stripped.indexOf('.');
    return dotIdx > 0 ? stripped.slice(dotIdx + 1) : stripped;
  });
  
  const fieldSet = new Set(fieldBareNames);
  const collisions = companyInputKeys.filter(k => fieldSet.has(k));
  
  if (collisions.length > 0) {
    throw new NamespaceCollisionViolation('C2',
      `Collision detected between market-data fields and company inputs: [${collisions.join(', ')}]`,
      { collisions, fieldCount: fieldKeys.length, companyInputCount: companyInputKeys.length });
  }
}

/**
 * C4: Detect bare (un-namespaced) high-risk collision keys in market-data fields.
 */
export function assertC4(fieldKeys: readonly string[]): void {
  const bareHighRisk = fieldKeys.filter(k => {
    if (isNamespaced(k)) return false;
    return HIGH_RISK_COLLISION_KEYS.includes(k);
  });
  
  if (bareHighRisk.length > 0) {
    throw new NamespaceCollisionViolation('C4',
      `High-risk collision keys found without namespace: [${bareHighRisk.join(', ')}]`,
      { offendingKeys: bareHighRisk });
  }
}

/**
 * C5: Assert contributing snapshot IDs are unique (no duplicates).
 */
export function assertC5(contributingIds: readonly string[]): void {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  
  for (const id of contributingIds) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }
  
  if (duplicates.length > 0) {
    throw new NamespaceCollisionViolation('C5',
      `Duplicate contributing snapshot IDs: [${duplicates.join(', ')}]`,
      { duplicates });
  }
}

/**
 * C6: Assert company input keys do NOT carry MD: namespace (reserved for market data).
 */
export function assertC6(companyInputKeys: readonly string[]): void {
  const namespaced = companyInputKeys.filter(k => isNamespaced(k));
  
  if (namespaced.length > 0) {
    throw new NamespaceCollisionViolation('C6',
      `Company input keys must NOT carry '${NAMESPACE_TOKEN}' namespace: [${namespaced.join(', ')}]`,
      { offendingKeys: namespaced });
  }
}

/**
 * Full C1–C6 collision guard assertion.
 * Call this before merging market-data snapshot fields with company inputs.
 * 
 * @throws NamespaceCollisionViolation if any C1–C6 rule is violated
 */
export function assertCollisionGuard(args: {
  fieldKeys: readonly string[];
  companyInputKeys?: readonly string[];
  contributingIds?: readonly string[];
}): void {
  const { fieldKeys, companyInputKeys = [], contributingIds = [] } = args;
  
  assertC1(fieldKeys);
  assertC4(fieldKeys);
  assertC6(companyInputKeys);
  assertC2C3(fieldKeys, companyInputKeys);
  assertC5(contributingIds);
}

/**
 * Guarded merge: merge market-data snapshot fields with company inputs AFTER
 * asserting C1–C6 collision guard. Fail-closed on any violation.
 * 
 * Market-data fields are stripped of their MD:<domain>. prefix before merge,
 * so the engine receives plain field names. The guard ensures no collision
 * occurred during this stripping.
 */
export function guardedMerge(
  snapshotFields: Record<string, unknown>,
  companyInputs: Record<string, unknown>,
  contributingIds: readonly string[] = []
): Record<string, unknown> {
  const fieldKeys = Object.keys(snapshotFields);
  const companyInputKeys = Object.keys(companyInputs);
  
  // Assert C1–C6 before merge
  assertCollisionGuard({ fieldKeys, companyInputKeys, contributingIds });
  
  // Strip MD: prefix from snapshot fields for engine consumption
  const strippedFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(snapshotFields)) {
    let bareKey = key;
    if (key.startsWith(NAMESPACE_TOKEN)) {
      const body = key.slice(NAMESPACE_TOKEN.length);
      const dotIdx = body.indexOf('.');
      bareKey = dotIdx > 0 ? body.slice(dotIdx + 1) : body;
    }
    strippedFields[bareKey] = value;
  }
  
  // Safe merge: company inputs take precedence (engine-specific overrides)
  return { ...strippedFields, ...companyInputs };
}
