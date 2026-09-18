import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EnterpriseRuntime } from '../../../iips-platform/src/distributed/EnterpriseRuntime';
import { AuthError, type OidcVerifier } from '../../src/core/auth/keycloakAdapter';
import { SecuredExecutor, type TenantDirectory } from '../secured-executor';
import { AggregateMutationError } from './aggregate-persistence';
import { PersistenceService } from './persistence-service';
import { createAggregateBootstrapFromAuthorizedPrincipal } from './secured-aggregate-composition';

type Value = { state: string };
const metadata = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };
function makeExecutor() {
  const verifier: OidcVerifier = { verify: vi.fn().mockResolvedValue({ subject: 'user-A', claims: { iss: metadata.issuer, aud: metadata.clientId, realm_access: { roles: ['iips-admin'] }, tenant: 'tenant-A' }, expiry: Date.now() / 1000 + 3600 }) };
  const directory: TenantDirectory = { tenantForUser: (userId, candidate) => userId === 'user-A' && candidate === 'tenant-A' ? { tenantId: 'tenant-A' } : null };
  return new SecuredExecutor(new EnterpriseRuntime({ now: () => '2026-09-16T00:00:00.000Z' }), directory, () => true, metadata, verifier);
}
const mutation = (expectedVersion = 0, key = 'k1', tenantId = 'tenant-A', ownerUserId = 'user-A') => ({ tenantId, ownerUserId, aggregateId: 'a1', expectedVersion, idempotencyKey: key, mutate: () => ({ state: 'ready' }) });

describe('secured aggregate composition', () => {
  it('uses only the authorized Principal to create trusted persistence context', async () => {
    const executor = makeExecutor();
    const principal = await executor.authenticate('token');
    const granted = executor.authorize(principal, 'execute', 'sector.technology', 0, 100);
    const dir = mkdtempSync(join(tmpdir(), 'iips-secured-compose-'));
    try {
      const bootstrap = createAggregateBootstrapFromAuthorizedPrincipal<Value>(granted, new PersistenceService({ dataDir: dir }), () => '2026-09-16T00:00:00.000Z', () => 'h-1');
      expect(bootstrap.context).toEqual({ tenantId: 'tenant-A', userId: 'user-A' });
      expect(bootstrap.mutate(mutation()).record.version).toBe(1);
      expect(() => bootstrap.mutate(mutation(0, 'cross', 'tenant-B', 'user-A'))).toThrowError(AggregateMutationError);
      const source = readFileSync(join(__dirname, 'secured-aggregate-composition.ts'), 'utf8');
      expect(source).not.toContain('JournalAggregateStore');
      expect(source).not.toContain('AggregateMutationStore');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('does not permit missing or unauthorized Principal context to reach bootstrap', async () => {
    const executor = makeExecutor();
    await expect(executor.authenticate('')).rejects.toMatchObject({ status: 401 });
    const viewerVerifier: OidcVerifier = { verify: vi.fn().mockResolvedValue({ subject: 'user-A', claims: { iss: metadata.issuer, aud: metadata.clientId, realm_access: { roles: ['iips-viewer'] }, tenant: 'tenant-A' }, expiry: Date.now() / 1000 + 3600 }) };
    const viewer = new SecuredExecutor(new EnterpriseRuntime({ now: () => '2026-09-16T00:00:00.000Z' }), { tenantForUser: () => ({ tenantId: 'tenant-A' }) }, () => true, metadata, viewerVerifier);
    const p = await viewer.authenticate('token');
    expect(() => viewer.authorize(p, 'execute', 'sector.technology', 0, 100)).toThrowError(AuthError);
  });
});
