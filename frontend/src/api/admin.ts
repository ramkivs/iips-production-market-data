/**
 * Program v3.0 — Phase 12.1: Typed API client for the Administration (read-only) surface.
 *
 * Mirrors the certified v2.0 transport DTOs. Semantically inert: the client maps governed
 * platform state to the UI. It never computes scores, health metrics, counts, or classifications,
 * and never fabricates a value. Missing governed fields render 'unavailable', never 0.
 * React is NOT an authorization authority; every admin endpoint is enforced server-side.
 */
import type { Role } from '../core/session/session';
import { authFetch, ApiError } from './authFetch';

export type Freshness = 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY';

export interface AdminProvenance {
  readonly dataSource: string;
  readonly freshness: Freshness;
  readonly authority: string;
  readonly transportSemantics: string;
}

// --- Overview ---
export interface AdminOverview {
  readonly platform: {
    readonly state: 'OPERATIONAL' | 'DEGRADED' | 'UNAVAILABLE';
    readonly nodesHealthy: number;
    readonly nodesTotal: number;
    readonly enginesRegistered: number;
    readonly enginesCertified: number;
    readonly liveDataQuality: string | null;
    readonly recentAuditCount: number;
  };
  readonly provenance: AdminProvenance;
}

// --- Identity & Access ---
export interface PermissionRef {
  readonly action: string;
  readonly resource: string;
}
export interface RoleRef {
  readonly role: Role;
  readonly permissions: readonly PermissionRef[];
}
export interface AdminIdentity {
  readonly principal: { readonly userId: string; readonly tenantId: string; readonly roles: readonly Role[] };
  readonly roles: readonly RoleRef[];
  readonly identityAuthority: string; // Keycloak
  readonly authzAuthority: string;    // EnterpriseRuntime / ApiSecurity
  readonly provenance: AdminProvenance;
}

// --- Tenants ---
export interface TenantIsolation {
  readonly principalTenant: string;
  readonly resourceTenant: string;
  readonly allowed: boolean;
}
export interface AdminTenancy {
  readonly principal: { readonly userId: string; readonly tenantId: string; readonly roles: readonly Role[] };
  readonly tenantIsolation: readonly TenantIsolation[];
  readonly tenantAuthority: string;
  readonly provenance: AdminProvenance;
}

// --- Engines & Certification ---
export interface EngineRef {
  readonly engineId: string;
  readonly sectorFamily: string;
  readonly engineVersion: string;
  readonly secVersion: string;
  readonly semcVersion: string;
  readonly capabilities: readonly string[];
}
export interface AdminEngines {
  readonly engines: readonly EngineRef[];
  readonly provenance: AdminProvenance;
}

export interface CertificationRef {
  readonly pluginId: string;
  readonly trustState: string;
  readonly certified: boolean;
  readonly blacklisted: boolean;
  readonly determinismVerified: boolean;
  readonly manifestHash: string;
  readonly signer: string;
}
export interface AdminCertification {
  readonly records: readonly CertificationRef[];
  readonly provenance: AdminProvenance;
}

// --- Platform Operations ---
export interface NodeHealthRef {
  readonly nodeId: string;
  readonly health: string;
}
export interface DrStatusRef {
  readonly backupId: string;
  readonly lineage: string;
  readonly snapshotCount: number;
}
export interface AdminPlatform {
  readonly nodes: readonly NodeHealthRef[];
  readonly ha: { readonly coordinator: string | null; readonly nodeCount: number };
  readonly dr: readonly DrStatusRef[];
  readonly telemetry: readonly { readonly traceId: string; readonly event: string; readonly nodeId?: string }[];
  readonly performance: { readonly nodes: number; readonly executions: number; readonly throughputPerSec: number; readonly p50Ms: number; readonly p95Ms: number } | null;
  readonly provenance: AdminProvenance;
}

// --- Audit ---
export interface AuditRef {
  readonly auditId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly action: string;
  readonly resource: string;
  readonly allowed: boolean;
  readonly at: string;
}
export interface AdminAudit {
  readonly records: readonly AuditRef[];
  readonly scope: string; // in-memory governed auditLog
  readonly provenance: AdminProvenance;
}

// --- Live Data ---
export interface LiveSourceRef {
  readonly provider: string;
  readonly dataVersion: string;
  readonly asOf: string;
  readonly quality: string;
  readonly completenessPct: number;
  readonly snapshotId: string;
}
export interface AdminLiveData {
  readonly sources: readonly LiveSourceRef[];
  readonly note: string;
  readonly provenance: AdminProvenance;
}

// --- Data Governance ---
/** Governed classification vocabulary (exact set from DataGovernanceRuntime.DataClassification). */
export const GOVERNED_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'] as const;
export type GovernedClassification = (typeof GOVERNED_CLASSIFICATIONS)[number];

export interface GovernedDataRef {
  readonly dataId: string;
  readonly tenantId: string;
  readonly classification: string;
  readonly region: string;
  readonly retentionDays: number;
  readonly immutable: boolean;
}
export interface AdminDataGovernance {
  readonly data: readonly GovernedDataRef[];
  readonly provenance: AdminProvenance;
}

/** Classify mutation DTO (POST /api/admin/data-governance/classify). */
export interface ClassifyRequest {
  readonly dataId: string;
  readonly classification: GovernedClassification;
}
export interface ClassifyResult {
  readonly data: GovernedDataRef;
  readonly auditId: string;
  readonly provenance: AdminProvenance;
}

// --- Migration ---
export interface MigrationRef {
  readonly migrationId: string;
  readonly source: string;
  readonly target: string;
  readonly snapshotId: string;
  readonly contractVersion: string;
  readonly calibrationVersion: string;
}
export interface AdminMigration {
  readonly migrations: readonly MigrationRef[];
  readonly provenance: AdminProvenance;
}

// --- Workflow ---
export interface WorkflowNodeRef {
  readonly id: string;
  readonly type: string;
  readonly capability: string;
}
export interface WorkflowRef {
  readonly workflowId: string;
  readonly version: string;
  readonly nodes: readonly WorkflowNodeRef[];
  readonly order: readonly string[];
}
export interface AdminWorkflow {
  readonly workflows: readonly WorkflowRef[];
  readonly provenance: AdminProvenance;
}

// --- Marketplace ---
export interface ModuleRef {
  readonly pluginId: string;
  readonly trustState: string;
  readonly certified: boolean;
  readonly blacklisted: boolean;
  readonly determinismVerified: boolean;
}
export interface AdminMarketplace {
  readonly modules: readonly ModuleRef[];
  readonly provenance: AdminProvenance;
}

const BASE = '/api/admin';

async function get<T>(path: string): Promise<T> {
  const res = await authFetch(`${BASE}${path}`);
  if (res.status === 401) throw new ApiError(401, 'Authentication required (401)');
  if (res.status === 403) throw new ApiError(403, 'Authorization denied (403)');
  if (!res.ok) throw new ApiError(res.status, `admin transport returned ${res.status}`);
  return (await res.json()) as T;
}

/** Narrowly-scoped governed mutation: reclassify an existing tenant-owned governed resource. */
export async function classifyData(req: ClassifyRequest): Promise<ClassifyResult> {
  const res = await authFetch(`${BASE}/data-governance/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (res.status === 401) throw new ApiError(401, 'Authentication required (401)');
  if (res.status === 403) throw new ApiError(403, 'Authorization denied (403)');
  if (res.status === 404) throw new ApiError(404, 'Governed resource not found');
  if (res.status === 422) {
    const e = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(422, e.error ?? 'Invalid classification request');
  }
  if (!res.ok) throw new ApiError(res.status, `admin transport returned ${res.status}`);
  return (await res.json()) as ClassifyResult;
}

export const adminApi = {
  overview: () => get<AdminOverview>('/overview'),
  identity: () => get<AdminIdentity>('/identity'),
  tenancy: () => get<AdminTenancy>('/tenants'),
  engines: () => get<AdminEngines>('/engines'),
  certification: () => get<AdminCertification>('/certification'),
  platform: () => get<AdminPlatform>('/platform'),
  audit: () => get<AdminAudit>('/audit'),
  liveData: () => get<AdminLiveData>('/live-data'),
  dataGovernance: () => get<AdminDataGovernance>('/data-governance'),
  migration: () => get<AdminMigration>('/migration'),
  workflow: () => get<AdminWorkflow>('/workflow'),
  marketplace: () => get<AdminMarketplace>('/marketplace'),
  classify: (req: ClassifyRequest) => classifyData(req),
};
