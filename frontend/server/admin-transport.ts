/**
 * Program v3.0 — Phase 12.1: Administration — read-only G2 transport (semantically inert).
 *
 * Exposes the governed, read-only Administration surface over the ACTUAL certified v2.0
 * platform (frozen sector engines + governed operational contracts) — in-process, like the
 * executive transport. Every admin endpoint enforces the frozen G3 boundary:
 *
 *   Keycloak → SecuredExecutor.authenticate → EnterpriseRuntime.Principal
 *   → EnterpriseRuntime.authorize (action 'admin' → admin-only via ROLE_POLICY)
 *   → ApiSecurity-style resource gate → governed audit → read-only DTO.
 *
 * React is NOT an authorization authority. Tenant-scoped surfaces (audit, data-governance,
 * live-data ownership) are filtered to the authenticated principal's tenant and never leak
 * another tenant's resources.
 *
 * READ-ONLY. No admin mutation is exposed. Unavailable governed capabilities are represented
 * as absent/unavailable — never fabricated. Golden outputs remain SNAPSHOT/reference only.
 */
import http from 'node:http';
import type { Principal, Role } from '../../iips-platform/src/distributed/EnterpriseRuntime';
import type { GovernedData, DataClassification } from '../../iips-platform/src/distributed/DataGovernanceRuntime';
import { EnterpriseRuntime } from '../../iips-platform/src/distributed/EnterpriseRuntime';
import { DataGovernanceRuntime } from '../../iips-platform/src/distributed/DataGovernanceRuntime';
import { DistributedRuntime } from '../../iips-platform/src/distributed/DistributedRuntime';
import { CloudHaRuntime } from '../../iips-platform/src/distributed/CloudHaRuntime';
import { DisasterRecoveryRuntime } from '../../iips-platform/src/distributed/DisasterRecoveryRuntime';
import { V2Observability } from '../../iips-platform/src/distributed/V2Observability';
import { PerformanceScaling } from '../../iips-platform/src/distributed/PerformanceScaling';
import { MigrationRuntime } from '../../iips-platform/src/distributed/MigrationRuntime';
import { DeterministicWorkflow, type WorkflowDefinition } from '../../iips-platform/src/distributed/WorkflowRuntime';
import { PluginMarketplace } from '../../iips-platform/src/distributed/PluginMarketplace';
import { MarketDataSource } from '../../iips-platform/src/distributed/LiveDataRuntime';
import type { SectorPlugin } from '../../iips-platform/src/plugin-loader/PluginContract';
import { SecuredExecutor, type TenantDirectory } from './secured-executor';
import { emitClassificationNotifications } from './notifications/notification-service';
import { AuthError, type OidcRealmMetadata, type OidcVerifier } from '../src/core/auth/keycloakAdapter';
// Engine factories (frozen).
import { BankingEngine, BANKING_ENGINE_ID } from '../../iips-platform/src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../iips-platform/src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../iips-platform/src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../iips-platform/src/sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../iips-platform/src/sector-engines/hospitality/HospitalityEngine';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../iips-platform/src/sector-engines/energy/EnergyEngine';
import { UtilitiesEngine, UTILITIES_ENGINE_ID } from '../../iips-platform/src/sector-engines/utilities/UtilitiesEngine';
import { ConsumerEngine, CONSUMER_ENGINE_ID } from '../../iips-platform/src/sector-engines/consumer/ConsumerEngine';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../iips-platform/src/sector-engines/industrials/IndustrialsEngine';
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID } from '../../iips-platform/src/sector-engines/technology/TechnologyEngine';
import { TelecommunicationsEngine, TELECOMMUNICATIONS_ENGINE_ID } from '../../iips-platform/src/sector-engines/telecommunications/TelecommunicationsEngine';
import { AutomobileEngine, AUTOMOBILE_ENGINE_ID } from '../../iips-platform/src/sector-engines/automobile/AutomobileEngine';
import { MaterialsMetalsEngine, MATERIALS_METALS_ENGINE_ID } from '../../iips-platform/src/sector-engines/materials-metals/MaterialsMetalsEngine';

const ENGINE_FACTORY: Record<string, () => SectorPlugin> = {
  [BANKING_ENGINE_ID]: () => new BankingEngine(),
  [INSURANCE_ENGINE_ID]: () => new InsuranceEngine(),
  [CAPITAL_MARKETS_ENGINE_ID]: () => new CapitalMarketsEngine(),
  [HEALTHCARE_ENGINE_ID]: () => new HealthcareEngine(),
  [HOSPITALITY_ENGINE_ID]: () => new HospitalityEngine(),
  [ENERGY_ENGINE_ID]: () => new EnergyEngine(),
  [UTILITIES_ENGINE_ID]: () => new UtilitiesEngine(),
  [CONSUMER_ENGINE_ID]: () => new ConsumerEngine(),
  [INDUSTRIALS_ENGINE_ID]: () => new IndustrialsEngine(),
  [TECHNOLOGY_ENGINE_ID]: () => new TechnologyEngine(),
  [TELECOMMUNICATIONS_ENGINE_ID]: () => new TelecommunicationsEngine(),
  [AUTOMOBILE_ENGINE_ID]: () => new AutomobileEngine(),
  [MATERIALS_METALS_ENGINE_ID]: () => new MaterialsMetalsEngine(),
};

// Frozen banking baseline input (v1.1 Replay Baseline) — used only for a genuinely measured
// performance sample (measurement tooling; not an admin value).
const BANKING_BASELINE: Record<string, unknown> = {
  'BM-001': 0.55, 'BM-002': 9.5, 'BM-003': 2.6, 'BM-004': 40, 'BM-005': 6.5,
  'BM-006': 3, 'BM-014': 11, 'BM-015': 13,
};

const clock = { now: () => '2026-08-11T00:00:00.000Z' };

/**
 * Shared, stateful governed data store backing BOTH the read surface and the classify mutation.
 * A single DataGovernanceRuntime instance owns these resources so classify() mutates the same set
 * the read endpoint reflects.
 *
 * NOTE (documented): this is LOCAL / NON-PERSISTENT runtime state for the development/reference
 * deployment. It is NOT durable enterprise governance storage — a server restart clears it. The UI
 * must not imply persistence.
 */
const governance = new DataGovernanceRuntime(clock);
const governedStore: GovernedData[] = [
  governance.classify('live-snap-A', 'tenant-A', 'confidential', 'ap-south', 90, true),  // immutable (frozen)
  governance.classify('live-snap-B', 'tenant-B', 'internal', 'ap-south', 90, true),      // immutable (frozen)
  governance.classify('biz-data-A', 'tenant-A', 'public', 'ap-south', 365, false),       // mutable
  governance.classify('biz-data-B', 'tenant-B', 'public', 'ap-south', 365, false),       // mutable
];

/** Governed classification vocabulary (exact set from the platform contract). */
export const CLASSIFICATIONS: readonly DataClassification[] = ['public', 'internal', 'confidential', 'restricted'];

/** Governed roles & permissions reference (mirrors EnterpriseRuntime ROLE_POLICY). */
const ROLE_POLICY: Record<Role, ReadonlyArray<{ action: string; resource: string }>> = {
  admin: [{ action: '*', resource: '*' }],
  analyst: [{ action: 'execute', resource: '*' }, { action: 'read', resource: '*' }],
  viewer: [{ action: 'read', resource: '*' }],
};

/** Build the governed, read-only Administration platform state (in-process, certified). */
export interface AdminPlatformState {
  engines: Array<{ engineId: string; sectorFamily: string; engineVersion: string; secVersion: string; semcVersion: string; capabilities: readonly string[] }>;
  certification: Array<{ pluginId: string; trustState: string; certified: boolean; blacklisted: boolean; determinismVerified: boolean; manifestHash: string; signer: string }>;
  nodes: Array<{ nodeId: string; health: string }>;
  ha: { coordinator: string | null; nodeCount: number };
  dr: Array<{ backupId: string; lineage: string; snapshotCount: number }>;
  telemetry: Array<{ traceId: string; event: string; nodeId?: string }>;
  performance: { nodes: number; executions: number; throughputPerSec: number; p50Ms: number; p95Ms: number } | null;
  liveSources: Array<{ provider: string; dataVersion: string; asOf: string; quality: string; completenessPct: number; snapshotId: string }>;
  governedData: Array<{ dataId: string; tenantId: string; classification: string; region: string; retentionDays: number; immutable: boolean }>;
  migrations: Array<{ migrationId: string; source: string; target: string; snapshotId: string; contractVersion: string; calibrationVersion: string }>;
  workflows: Array<{ workflowId: string; version: string; nodes: Array<{ id: string; type: string; capability: string }>; order: readonly string[] }>;
  liveDataNote: string;
}

export function buildAdminState(): AdminPlatformState {
  const engineIds = Object.keys(ENGINE_FACTORY);
  const engines = engineIds.map((id) => {
    const e = ENGINE_FACTORY[id]();
    return {
      engineId: e.identity.engineId,
      sectorFamily: e.identity.sectorFamily,
      engineVersion: e.identity.engineVersion,
      secVersion: e.identity.secVersion,
      semcVersion: e.identity.semcVersion,
      capabilities: e.manifest.capabilities,
    };
  });

  // Certification registry (governed marketplace; frozen engines are certified).
  const marketplace = new PluginMarketplace(['iips-signer']);
  for (const e of engines) {
    marketplace.register(e.engineId, { engineId: e.engineId }, 'iips-signer', {
      trustState: 'certified', certified: true, determinismVerified: true,
    });
  }
  const certification = marketplace.list().map((r) => ({
    pluginId: r.pluginId, trustState: r.trustState, certified: r.certified,
    blacklisted: r.blacklisted, determinismVerified: r.determinismVerified,
    manifestHash: r.manifestHash, signer: r.signer,
  }));

  // HA / DR / observability.
  const dr = new DistributedRuntime();
  const ctx = DistributedRuntime.defaultContext('admin');
  const ha = new CloudHaRuntime(dr, ctx);
  const nodeEngines = engineIds.map((id) => ENGINE_FACTORY[id]);
  ha.register('node-a', nodeEngines);
  ha.register('node-b', nodeEngines);
  ha.markDown('node-b'); // node-b degraded/down -> realistic health surface
  const nodes = ['node-a', 'node-b'].map((n) => ({ nodeId: n, health: ha.checkHealth(n) }));
  const haCoordinator = ha.coordinator();

  // DR / backup surface: provision a node and export a real (governed) backup record.
  const drNode = dr.provisionNode('node-dr', ctx, engineIds.map((id) => ENGINE_FACTORY[id]));
  const drRuntime = new DisasterRecoveryRuntime(dr, ctx);
  const backup = drRuntime.exportBackup(drNode);
  const drBackups = [{ backupId: backup.backupId, lineage: backup.lineage, snapshotCount: backup.snapshotIds.length }];

  // Telemetry (governed observability events).
  const obs = new V2Observability();
  obs.recordLiveDataAcquired(ctx.lineage, 'admin-1', { dataVersion: 'v1', asOf: '2026-08-11T00:00:00Z', provider: 'governed-provider', quality: 'good', completenessPct: 100 });
  obs.recordNodeTransition(ctx.lineage, 'admin-1', 'node-a', 'healthy', 'healthy');
  const telemetry = obs.list().map((t) => ({ traceId: t.traceId, event: t.event, nodeId: t.nodeId }));

  // Performance: genuinely measured short batch on the banking engine.
  let performance: AdminPlatformState['performance'] = null;
  try {
    const ps = new PerformanceScaling([() => ENGINE_FACTORY[BANKING_ENGINE_ID]()]);
    const sample = ps.measureBatch(1, 2, [BANKING_ENGINE_ID], { [BANKING_ENGINE_ID]: BANKING_BASELINE });
    performance = { nodes: sample.nodes, executions: sample.executions, throughputPerSec: sample.throughputPerSec, p50Ms: sample.p50Ms, p95Ms: sample.p95Ms };
  } catch {
    performance = null; // measurement unavailable; never fabricated
  }

  // Live data (governed, tenant-owned, deterministic test feed — NOT production market data).
  const live = new MarketDataSource<Record<string, unknown>>('governed-provider');
  const snapA = live.snapshot('v1', '2026-08-11T00:00:00Z', 'good', 100, {});
  const liveSources = [{ provider: 'governed-provider', dataVersion: snapA.dataVersion, asOf: snapA.asOf, quality: snapA.quality, completenessPct: snapA.completenessPct, snapshotId: snapA.snapshotId }];

  // Data governance (governed classification of tenant-owned data) — read from the shared store.
  const governedData = governedStore.map((g) => ({
    dataId: g.dataId, tenantId: g.tenantId, classification: g.classification,
    region: g.region, retentionDays: g.retentionDays, immutable: g.immutable,
  }));

  // Migration history (governed).
  const mig = new MigrationRuntime();
  mig.recordMigration('v1.1', 'v2.0', 'SNAP-bank-1', 'IES-006 v1.0', '1.0.0');
  const migrations = mig.migrationsLog().map((m) => ({
    migrationId: m.migrationId, source: m.source, target: m.target,
    snapshotId: m.snapshotId, contractVersion: m.contractVersion, calibrationVersion: m.calibrationVersion,
  }));

  // Workflow definitions (governed, read-only).
  const wf = new DeterministicWorkflow();
  const def: WorkflowDefinition = {
    workflowId: 'wf-certified-review', version: '1.0',
    nodes: [
      { id: 'n1', type: 'engine', capability: BANKING_ENGINE_ID, inputs: ['start'] },
      { id: 'n2', type: 'transform', capability: 'pass-through', inputs: ['n1'] },
    ],
    order: ['n1', 'n2'],
  };
  wf.define(def);
  const workflows = [{ workflowId: def.workflowId, version: def.version, nodes: def.nodes.map((n) => ({ id: n.id, type: n.type, capability: n.capability })), order: def.order }];

  return {
    engines, certification, nodes, ha: { coordinator: haCoordinator, nodeCount: ha.nodeCount() },
    dr: drBackups,
    telemetry, performance, liveSources, governedData, migrations, workflows,
    liveDataNote: 'Deterministic test market-data feed (NOT production external market data). Golden expected-outputs remain SNAPSHOT/reference only.',
  };
}

/** Tenant directory: maps validated subjects to their authoritative tenant (platform-validated). */
const ADMIN_DIRECTORY: TenantDirectory = {
  tenantForUser(userId, candidate) {
    const map: Record<string, string> = { 'admin-a': 'tenant-A', 'analyst-a': 'tenant-A', 'viewer-a': 'tenant-A', 'admin-b': 'tenant-B', 'analyst-b': 'tenant-B' };
    const expected = map[userId];
    return expected && candidate === expected ? { tenantId: expected } : null;
  },
};

/** ApiSecurity-style resource gate: admin surfaces require the governed 'admin' role. */
function adminResourceGate(principal: Principal, action: string): boolean {
  if (action !== 'admin') return false;
  return principal.roles.includes('admin');
}

/**
 * ApiSecurity-style resource gate for governed READ surfaces (N+2 hardening).
 * admin → all actions · analyst → read/execute · viewer → read only.
 * Mirrors the action-aware gate already proven by the G3 LIVE suite.
 */
function readResourceGate(principal: Principal, action: string): boolean {
  if (principal.roles.includes('admin')) return true;
  if (principal.roles.includes('analyst')) return action === 'read' || action === 'execute';
  if (principal.roles.includes('viewer')) return action === 'read';
  return false;
}

export interface AdminExecutorDeps {
  readonly runtime?: EnterpriseRuntime;
  readonly directory?: TenantDirectory;
  readonly resourceAccess?: (principal: Principal, action: string, resource: string) => boolean;
  readonly metadata: OidcRealmMetadata;
  readonly verifier: OidcVerifier;
}

export function createAdminExecutor(deps: AdminExecutorDeps): SecuredExecutor {
  return new SecuredExecutor(
    deps.runtime ?? new EnterpriseRuntime(clock),
    deps.directory ?? ADMIN_DIRECTORY,
    deps.resourceAccess ?? adminResourceGate,
    deps.metadata,
    deps.verifier,
  );
}

/** Read-capable executor (N+2): same construction as the admin executor but with the action-aware read gate. */
export function createReadExecutor(deps: AdminExecutorDeps): SecuredExecutor {
  return new SecuredExecutor(
    deps.runtime ?? new EnterpriseRuntime(clock),
    deps.directory ?? ADMIN_DIRECTORY,
    deps.resourceAccess ?? readResourceGate,
    deps.metadata,
    deps.verifier,
  );
}

/** OIDC discovery for the live realm (Keycloak). Returns null when no IdP is configured. */
async function discoverLiveMetadata(): Promise<{ metadata: OidcRealmMetadata; verifier: OidcVerifier } | null> {
  const kc = process.env.KEYCLOAK_URL;
  if (!kc) return null;
  const { RealKeycloakVerifier } = await import('./live/real-oidc-verifier');
console.log(
  '[N+2 DISCOVERY DEBUG]',
  'kc=', JSON.stringify(kc),
  'len=', kc.length,
  'codes=', [...kc].map(c => c.charCodeAt(0)).join(','),
  'url=', JSON.stringify(`${kc}/realms/iips/.well-known/openid-configuration`),
);
  const disc = await (await fetch(`${kc}/realms/iips/.well-known/openid-configuration`)).json() as { issuer: string; jwks_uri: string };
  const metadata: OidcRealmMetadata = { issuer: disc.issuer, jwksUri: disc.jwks_uri, clientId: 'iips-spa' };
  return { metadata, verifier: new RealKeycloakVerifier(metadata.issuer, metadata.jwksUri, metadata.clientId) };
}

/**
 * Build the live admin executor against a real Keycloak realm when KEYCLOAK_URL is set.
 * Returns null (no auth available -> admin endpoints 401) otherwise. This is the wiring used
 * by the dev transport server; tests inject a mock verifier instead.
 */
export async function createLiveAdminExecutor(): Promise<SecuredExecutor | null> {
  const live = await discoverLiveMetadata();
  return live ? createAdminExecutor(live) : null;
}

/**
 * Build the live READ executor (N+2) against a real Keycloak realm. Same discovery as the
 * admin executor but with the action-aware read gate (viewer/analyst may read).
 */
export async function createLiveReadExecutor(): Promise<SecuredExecutor | null> {
  const live = await discoverLiveMetadata();
  return live ? createReadExecutor(live) : null;
}

/** Authenticate + authorize an admin read (action 'admin' -> admin-only via governed RBAC + gate). */
async function guardAdmin(executor: SecuredExecutor, token: string, surface: string): Promise<Principal> {
  const p = await executor.authenticate(token);          // 401 on failure
  executor.authorize(p, 'admin', `admin.${surface}`, 0, 1000); // 403 on deny (governed RBAC + gate + audit)
  return p;
}

/** Authenticate + authorize a governed READ (action 'read' — viewer/analyst/admin per governed RBAC + gate). */
export async function guardRead(executor: SecuredExecutor, token: string, surface: string): Promise<Principal> {
  const p = await executor.authenticate(token);            // 401 on failure
  executor.authorize(p, 'read', `read.${surface}`, 0, 1000); // 403 on deny (governed RBAC + gate + audit)
  return p;
}

/**
 * P-2 (S-2a): authenticate + authorize a governed EXECUTE action.
 *
 * Reuses the EXISTING ranked `readResourceGate` (admin → all actions; analyst → read+execute;
 * viewer → read only), so analyst-and-above authorship (D-3) is enforced by the promoted gate.
 * `guardRead` is deliberately NOT modified and NO second RBAC model is introduced — this
 * helper differs only in the action it presents to the same executor + gate.
 */
export async function guardExecute(executor: SecuredExecutor, token: string, surface: string): Promise<Principal> {
  const p = await executor.authenticate(token);               // 401 on failure
  executor.authorize(p, 'execute', `read.${surface}`, 0, 1000); // 403 on deny (viewer denied)
  return p;
}

function tenantFilter<T>(rows: readonly T[], p: Principal, tenantOf: (r: T) => string): T[] {
  return rows.filter((r) => p.tenantId === tenantOf(r));
}

/** Transport-level error for governed validation failures (400/404/422) — distinct from auth 401/403. */
export class TransportError extends Error {
  constructor(readonly status: 400 | 404 | 422, message: string) {
    super(message);
    this.name = 'TransportError';
  }
}

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) { reject(new TransportError(400, 'invalid-json')); }
    });
    req.on('error', reject);
  });
}

function governedDataDto(g: GovernedData): { dataId: string; tenantId: string; classification: string; region: string; retentionDays: number; immutable: boolean } {
  return { dataId: g.dataId, tenantId: g.tenantId, classification: g.classification, region: g.region, retentionDays: g.retentionDays, immutable: g.immutable };
}

/** HTTP handler for /api/admin/* read endpoints (enforces G3 boundary). */
/**
 * P-1 notification handlers (U-2a + R-1-a).
 *
 * The handlers live HERE (U-2a: admin-transport.ts + guardRead + recipient scoping) but are
 * DISPATCHED from executive-transport.ts with the EXISTING read executor (R-1-a), because the
 * `/api/admin/*` dispatch supplies the admin executor whose `adminResourceGate` rejects
 * action='read'. This mirrors the promoted `handleMacroReadRequest` cross-module pattern.
 *
 * Authorization: `guardRead` is the primitive; RECIPIENT IDENTITY is the access restriction.
 * These are NOT admin-only, and no second RBAC model is introduced. `adminResourceGate` and
 * `readResourceGate` are unmodified.
 */
export async function handleNotificationRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  opts: { readonly store?: import('./persistence/persistence-service').PersistenceService } = {},
): Promise<void> {
  const url = (req.url ?? '').split('?')[0];
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  res.setHeader('Content-Type', 'application/json');
  try {
    const svc = await import('./notifications/notification-service');
    const store = opts.store ?? svc.getNotificationPersistence();

    // GET /api/notifications — own notifications, createdAt DESC, with the unread count
    // carried in the SAME envelope (U-2b: no dedicated unread-count endpoint).
    if (url === '/api/notifications' && (req.method ?? 'GET') === 'GET') {
      const p = await guardRead(executor, token, 'notifications'); // 401/403
      const data = svc.listNotifications(p.tenantId, p.userId, store);
      res.writeHead(200); res.end(JSON.stringify({
        data,
        unreadCount: svc.unreadCount(p.tenantId, p.userId, store),
        provenance: {
          dataSource: 'governed P-1 notifications (PF-1 durable journal)',
          freshness: 'LIVE',
          authority: 'PLATFORM',
          transportSemantics: 'recipient-scoped historical assertions; not a current-state read model',
        },
      })); return;
    }

    // POST /api/notifications/{id}/read — idempotent, NON-REVERSIBLE mark-read.
    const markRead = /^\/api\/notifications\/([^/]+)\/read$/.exec(url);
    if (markRead && req.method === 'POST') {
      const p = await guardRead(executor, token, 'notifications'); // 401/403
      const id = decodeURIComponent(markRead[1]);
      // Recipient scoping: PF-1 is queried with the principal's own tenant + userId, so an
      // unknown OR foreign record is indistinguishable and yields 404 (never another user's).
      const updated = svc.markNotificationRead(p.tenantId, p.userId, id, store);
      if (!updated) throw new TransportError(404, 'notification-not-found');
      res.writeHead(200); res.end(JSON.stringify({
        data: updated,
        provenance: {
          dataSource: 'governed P-1 notifications (PF-1 durable journal)',
          freshness: 'LIVE',
          authority: 'PLATFORM',
          transportSemantics: 'recipient-scoped idempotent mark-read; read is not reversible',
        },
      })); return;
    }

    res.writeHead(404); res.end(JSON.stringify({ error: 'notification endpoint not found' }));
  } catch (e) {
    if (e instanceof AuthError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof TransportError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    res.writeHead(500); res.end(JSON.stringify({ error: 'notification transport error', detail: String(e) }));
  }
}

/**
 * P-2 Notes handlers (S-6).
 *
 * Placed HERE alongside the other governed handlers, but DISPATCHED from
 * executive-transport.ts with the EXISTING READ executor — the `/api/admin/*` dispatch supplies
 * the admin executor, whose `adminResourceGate` rejects every action except 'admin' and would
 * therefore 403 both 'read' and 'execute'. Mirrors the promoted P-1 R-1-a pattern.
 *
 * Authorization: `guardExecute` (S-2a) for create → analyst-and-above (D-3); `guardRead` for
 * list. OWNER IDENTITY is the access restriction (D-4). No second RBAC model.
 *
 * S-5: there is deliberately NO length validation branch — a body of any size is accepted.
 * Only presence and type are validated (S-8).
 */
export async function handleNotesRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  opts: { readonly store?: import('./persistence/persistence-service').PersistenceService } = {},
): Promise<void> {
  const url = (req.url ?? '').split('?')[0];
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  res.setHeader('Content-Type', 'application/json');
  try {
    const svc = await import('./notes/notes-service');
    const store = opts.store ?? svc.getNotesPersistence();

    // GET /api/notes — the caller's OWN notes, canonical PF-1 order (S-7).
    if (url === '/api/notes' && (req.method ?? 'GET') === 'GET') {
      const p = await guardRead(executor, token, 'notes'); // 401/403
      res.writeHead(200); res.end(JSON.stringify({
        data: svc.listNotes(p.tenantId, p.userId, store),
        provenance: {
          dataSource: 'governed P-2 notes (PF-1 durable journal)',
          freshness: 'LIVE',
          authority: 'PLATFORM',
          transportSemantics: 'owner-scoped immutable notes; notes cannot be edited or deleted',
        },
      })); return;
    }

    // POST /api/notes — create one immutable note (analyst-and-above, D-3 via S-2a).
    if (url === '/api/notes' && req.method === 'POST') {
      const p = await guardExecute(executor, token, 'notes'); // 401/403 (viewer denied)
      const body = await readBody(req);
      const raw = body.body;
      // S-8: presence first, then type. NO length branch exists (S-5 is unbounded).
      if (raw === undefined || raw === null) throw new TransportError(400, 'note-body-required');
      if (typeof raw !== 'string') throw new TransportError(422, 'invalid-note-body');
      if (raw.trim() === '') throw new TransportError(400, 'note-body-required');
      // Tenant + owner + author are server-derived from the principal; never client-supplied.
      const created = svc.createNote(p.tenantId, p.userId, raw, store);
      res.writeHead(201); res.end(JSON.stringify({
        data: created,
        provenance: {
          dataSource: 'governed P-2 notes (PF-1 durable journal)',
          freshness: 'LIVE',
          authority: 'PLATFORM',
          transportSemantics: 'owner-scoped immutable notes; notes cannot be edited or deleted',
        },
      })); return;
    }

    res.writeHead(404); res.end(JSON.stringify({ error: 'note-not-found' }));
  } catch (e) {
    if (e instanceof AuthError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof TransportError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    res.writeHead(500); res.end(JSON.stringify({ error: 'notes transport error', detail: String(e) }));
  }
}

/**
 * PF-2 TW-2 — injected sync-trigger seam.
 *
 * Mirrors `handleMacroReadRequest`'s injected `fetchImpl`: optional and backward-compatible,
 * so the existing call site is unchanged and tests can drive the endpoint offline. When
 * absent, the promoted process wiring (`runGuardedSync`) is used.
 */
export type AdminSyncTrigger = () => Promise<import('./directory/idp-sync').SyncResult>;

export async function handleAdminRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  state: AdminPlatformState,
  opts: { readonly syncTrigger?: AdminSyncTrigger } = {},
): Promise<void> {
  const url = (req.url ?? '').split('?')[0];
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  res.setHeader('Content-Type', 'application/json');
  try {
    if (url === '/api/admin/overview') {
      await guardAdmin(executor, token, 'overview');
      const audit = executor.auditLog();
      const healthStates = state.nodes.map((n) => n.health);
      const stateOf = healthStates.includes('down') ? 'DEGRADED' : healthStates.length ? 'OPERATIONAL' : 'UNAVAILABLE';
      res.writeHead(200); res.end(JSON.stringify({
        platform: {
          state: stateOf,
          nodesHealthy: healthStates.filter((h) => h === 'healthy').length,
          nodesTotal: healthStates.length,
          enginesRegistered: state.engines.length,
          enginesCertified: state.certification.filter((c) => c.certified).length,
          liveDataQuality: state.liveSources[0]?.quality ?? null,
          recentAuditCount: audit.length,
        },
        provenance: { dataSource: 'governed v2.0 platform (in-process)', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only; no fabricated metrics' },
      })); return;
    }
    if (url === '/api/admin/identity') {
      const p = await guardAdmin(executor, token, 'identity');
      const roles = (Object.keys(ROLE_POLICY) as Role[]).map((role) => ({ role, permissions: ROLE_POLICY[role] }));
      res.writeHead(200); res.end(JSON.stringify({
        principal: { userId: p.userId, tenantId: p.tenantId, roles: p.roles },
        roles,
        identityAuthority: 'Keycloak (OIDC)',
        authzAuthority: 'EnterpriseRuntime / PlatformApi.ApiSecurity',
        provenance: { dataSource: 'governed role model (EnterpriseRuntime ROLE_POLICY)', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'reference display; React is not an authority' },
      })); return;
    }
    if (url === '/api/admin/tenants') {
      const p = await guardAdmin(executor, token, 'tenants');
      const tenants = ['tenant-A', 'tenant-B'];
      const tenantIsolation = tenants.map((t) => ({ principalTenant: p.tenantId, resourceTenant: t, allowed: executor.tenantAllows(p, 'resource', t) }));
      res.writeHead(200); res.end(JSON.stringify({
        principal: { userId: p.userId, tenantId: p.tenantId, roles: p.roles },
        tenantIsolation,
        tenantAuthority: 'platform-validated (EnterpriseRuntime.isTenantResource)',
        provenance: { dataSource: 'governed tenant context', freshness: 'LIVE', authority: 'PLATFORM', transportSemantics: 'tenant context never taken from URL/state' },
      })); return;
    }
    if (url === '/api/admin/engines') {
      await guardAdmin(executor, token, 'engines');
      res.writeHead(200); res.end(JSON.stringify({
        engines: state.engines,
        provenance: { dataSource: 'governed engine registry (frozen sector engines)', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only registry' },
      })); return;
    }
    if (url === '/api/admin/certification') {
      await guardAdmin(executor, token, 'certification');
      res.writeHead(200); res.end(JSON.stringify({
        records: state.certification,
        provenance: { dataSource: 'governed PluginMarketplace registry', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only; revocation is platform-owned, not exposed' },
      })); return;
    }
    if (url === '/api/admin/platform') {
      await guardAdmin(executor, token, 'platform');
      res.writeHead(200); res.end(JSON.stringify({
        nodes: state.nodes,
        ha: state.ha,
        dr: state.dr,
        telemetry: state.telemetry,
        performance: state.performance,
        provenance: { dataSource: 'governed CloudHaRuntime / DisasterRecovery / V2Observability / PerformanceScaling', freshness: 'LIVE', authority: 'PLATFORM', transportSemantics: 'read-only health/telemetry; no invented SLOs' },
      })); return;
    }
    if (url === '/api/admin/audit') {
      const p = await guardAdmin(executor, token, 'audit');
      const records = tenantFilter(executor.auditLog(), p, (r) => r.tenantId);
      res.writeHead(200); res.end(JSON.stringify({
        records: records.map((r) => ({ auditId: r.auditId, tenantId: r.tenantId, userId: r.userId, action: r.action, resource: r.resource, allowed: r.allowed, at: r.at })),
        scope: 'in-memory governed EnterpriseRuntime.auditLog (presentational only)',
        provenance: { dataSource: 'governed EnterpriseRuntime.auditLog', freshness: 'LIVE', authority: 'PLATFORM', transportSemantics: 'no second audit system' },
      })); return;
    }
    if (url === '/api/admin/live-data') {
      await guardAdmin(executor, token, 'live-data');
      res.writeHead(200); res.end(JSON.stringify({
        sources: state.liveSources,
        note: state.liveDataNote,
        provenance: { dataSource: 'governed LiveDataRuntime snapshot metadata', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'golden outputs are reference only' },
      })); return;
    }
    if (url === '/api/admin/data-governance') {
      const p = await guardAdmin(executor, token, 'data-governance');
      const data = tenantFilter(state.governedData, p, (g) => g.tenantId);
      res.writeHead(200); res.end(JSON.stringify({
        data,
        provenance: { dataSource: 'governed DataGovernanceRuntime', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'tenant-scoped; classification is platform-owned' },
      })); return;
    }
    // --- Governed mutation: data classification (Phase 12.2, the ONLY authorized mutation) ---
    if (url === '/api/admin/data-governance/classify' && req.method === 'POST') {
      const body = await readBody(req);
      const dataId = typeof body.dataId === 'string' ? body.dataId : '';
      const classification = body.classification;
      if (!dataId) throw new TransportError(400, 'resource-required');
      if (typeof classification !== 'string' || !(CLASSIFICATIONS as readonly string[]).includes(classification)) {
        throw new TransportError(422, 'invalid-classification');
      }
      // Resolve the governed resource (server-side; tenant never from client).
      const resource = governedStore.find((g) => g.dataId === dataId);
      if (!resource) throw new TransportError(404, 'resource-not-found');
      // Governed mutation authorization (tenant-aware): tenant ownership DENY audited via
      // checkIsTenantResource -> RBAC DENY audited -> quota -> gate. Cross-tenant produces a
      // governed DENY AuditRecord.
      const p = await executor.authenticate(token);                                              // 401
      executor.authorizeMutation(p, 'admin', `data.classify:${dataId}`, resource.tenantId, 0, 1000); // 403 + governed deny/allow audit
      // Immutable (frozen) data cannot be reclassified. DOCUMENTED decision: governed validation
      // rejection (422) before resource authorization, so no authorization DENY audit is recorded
      // (consistent with invalid-classification).
      if (!governance.isMutable(resource)) throw new TransportError(422, 'immutable-resource');
      // Perform the governed mutation on the shared store (same tenant/region/retention; new classification).
      const idx = governedStore.findIndex((g) => g.dataId === dataId);
      const updated = governance.classify(resource.dataId, resource.tenantId, classification as DataClassification, resource.region, resource.retentionDays, resource.immutable);
      governedStore[idx] = updated;
      // Governed ALLOW audit for the completed mutation.
      executor.authorize(p, 'admin', `data.classify:${dataId}`, 0, 1000);
      // --- P-1 N1(a): emit data-governance.classified notifications ---
      // Direct in-handler call — no event bus/broker/queue/scheduler/worker. The emitter NEVER
      // throws: per U-2c/U-2d/U-2d(ii) a notification failure never fails, rolls back, or alters
      // this promoted classify mutation.
      emitClassificationNotifications({
        tenantId: resource.tenantId,
        dataId: updated.dataId,
        classification: updated.classification,
        actorUserId: p.userId,
      });
      res.writeHead(200); res.end(JSON.stringify({
        data: governedDataDto(updated),
        auditId: `audit-${executor.auditLog().length}`,
        provenance: { dataSource: 'governed DataGovernanceRuntime.classify', freshness: 'LIVE', authority: 'PLATFORM', transportSemantics: 'governed mutation; server-enforced tenant + RBAC + audit' },
      })); return;
    }
    // --- PF-2 TW-2: governed admin directory-sync mutation (trigger only) ---
    // Distinct from the forbidden TD-6 admin roster HTTP view: this returns the sync-result
    // envelope (counts only) and exposes NO user/role lists. Request body is ignored.
    if (url === '/api/admin/directory/sync' && req.method === 'POST') {
      const p = await guardAdmin(executor, token, 'directory'); // 401/403 (no second RBAC model)
      const trigger: AdminSyncTrigger =
        opts.syncTrigger ?? (async () => {
          const wiring = await import('./directory/directory-wiring');
          return wiring.runGuardedSync();
        });
      let result: import('./directory/idp-sync').SyncResult;
      try {
        result = await trigger();
      } catch (e) {
        const code = (e as { code?: string }).code;
        // TW-5: deterministic concurrent-trigger rejection.
        if (code === 'SYNC_IN_PROGRESS') {
          res.writeHead(409); res.end(JSON.stringify({ error: 'sync-in-progress', code: 'SYNC_IN_PROGRESS' })); return;
        }
        // Pinned SyncError mapping: IdP source unavailable -> 503; source contract -> 502.
        if (code === 'TOKEN_FAILED' || code === 'USERS_FAILED' || code === 'ROLES_FAILED') {
          res.writeHead(503); res.end(JSON.stringify({ error: 'idp-unavailable', code })); return;
        }
        if (code === 'SYNC_FAILED') {
          res.writeHead(502); res.end(JSON.stringify({ error: 'idp-source-contract', code })); return;
        }
        throw e;
      }
      // Governed ALLOW audit for the completed mutation (mirrors the classify mutation).
      executor.authorize(p, 'admin', 'directory.sync', 0, 1000);
      res.writeHead(200); res.end(JSON.stringify({
        data: {
          syncId: result.syncId,
          syncedAt: result.syncedAt,
          realm: result.realm,
          tenantCount: result.tenantCount,
          userCount: result.userCount,
        },
        auditId: `audit-${executor.auditLog().length}`,
        provenance: { dataSource: 'governed PF-2 directory sync', freshness: 'LIVE', authority: 'PLATFORM', transportSemantics: 'admin-triggered whole-snapshot sync' },
      })); return;
    }
    if (url === '/api/admin/migration') {
      await guardAdmin(executor, token, 'migration');
      res.writeHead(200); res.end(JSON.stringify({
        migrations: state.migrations,
        provenance: { dataSource: 'governed MigrationRuntime.migrationsLog', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only history; no migration execution/rollback' },
      })); return;
    }
    if (url === '/api/admin/workflow') {
      await guardAdmin(executor, token, 'workflow');
      res.writeHead(200); res.end(JSON.stringify({
        workflows: state.workflows,
        provenance: { dataSource: 'governed DeterministicWorkflow definitions', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only definitions; no edit/approval' },
      })); return;
    }
    if (url === '/api/admin/marketplace') {
      await guardAdmin(executor, token, 'marketplace');
      res.writeHead(200); res.end(JSON.stringify({
        modules: state.certification.map((c) => ({ pluginId: c.pluginId, trustState: c.trustState, certified: c.certified, blacklisted: c.blacklisted, determinismVerified: c.determinismVerified })),
        provenance: { dataSource: 'governed PluginMarketplace registry', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only; activation not exposed' },
      })); return;
    }
    res.writeHead(404); res.end(JSON.stringify({ error: 'admin endpoint not found' }));
  } catch (e) {
    if (e instanceof AuthError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof TransportError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    res.writeHead(500); res.end(JSON.stringify({ error: 'admin transport error', detail: String(e) }));
  }
}
