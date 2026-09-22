/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-G / Package P16 & P17 Extension: Operational Qualification Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W6-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  RuntimeReadinessManager,
  MockEnterpriseVaultDriver,
  SecretResolutionError,
  EmpiricalKillSwitchBenchmark,
  SyntheticFailoverCircuits,
  OQSuiteRunner,
  ReleaseCandidateManifestBuilder,
  SecretRef,
} from '../src/index.js';

describe('WS-G Package P16 & P17-Ext: Operational Qualification & Release Evidence', () => {
  describe('P16-01: Runtime Readiness & Health Probes', () => {
    it('evaluates startup, liveness, and readiness probes in local fixture mode', () => {
      const report = RuntimeReadinessManager.getReadinessReport();

      assert.strictEqual(report.isReady, true);
      assert.strictEqual(report.operatingMode, 'SNAPSHOT');
      assert.strictEqual(report.networkSocketsBound, 0);
      assert.strictEqual(report.liveProvidersActive, 0);
      assert.strictEqual(report.safetyBoundaryPreserved, true);
      assert.strictEqual(report.probes.startup.status, 'HEALTHY');
      assert.strictEqual(report.probes.liveness.status, 'HEALTHY');
      assert.strictEqual(report.probes.readiness.status, 'HEALTHY');
    });
  });

  describe('P16-02: SecretRef Enterprise Vault Driver Simulation', () => {
    it('resolves valid SecretRefs and rotates credentials safely', () => {
      const vault = new MockEnterpriseVaultDriver();
      const ref: SecretRef = {
        secretId: 'sec-prim',
        vaultProvider: 'LOCAL_MOCK_VAULT',
        keyPath: 'vault://market-data/primary-feed',
        version: 'v1',
        status: 'ACTIVE',
      };

      const token1 = vault.resolveSecret(ref);
      assert.ok(token1.length > 0);

      vault.rotateCredential('market-data/primary-feed', 'sim_tok_prim_rotated_5544332211');
      const token2 = vault.resolveSecret(ref);
      assert.strictEqual(token2, 'sim_tok_prim_rotated_5544332211');
      assert.notStrictEqual(token1, token2);
    });

    it('enforces fail-closed resolution on expired, revoked, and unmapped SecretRefs', () => {
      const vault = new MockEnterpriseVaultDriver();

      const expiredRef: SecretRef = {
        secretId: 'sec-exp',
        vaultProvider: 'LOCAL_MOCK_VAULT',
        keyPath: 'vault://market-data/expired-feed',
        version: 'v1',
        status: 'EXPIRED',
      };
      assert.throws(
        () => vault.resolveSecret(expiredRef),
        (err: any) => err instanceof SecretResolutionError && err.reason === 'EXPIRED'
      );

      const revokedRef: SecretRef = {
        secretId: 'sec-rev',
        vaultProvider: 'LOCAL_MOCK_VAULT',
        keyPath: 'vault://market-data/revoked-feed',
        version: 'v1',
        status: 'REVOKED',
      };
      assert.throws(
        () => vault.resolveSecret(revokedRef),
        (err: any) => err instanceof SecretResolutionError && err.reason === 'REVOKED'
      );

      const unmappedRef: SecretRef = {
        secretId: 'sec-unmapped',
        vaultProvider: 'LOCAL_MOCK_VAULT',
        keyPath: 'vault://market-data/non-existent-feed',
        version: 'v1',
        status: 'ACTIVE',
      };
      assert.throws(
        () => vault.resolveSecret(unmappedRef),
        (err: any) => err instanceof SecretResolutionError && err.reason === 'UNRESOLVED'
      );
    });
  });

  describe('P16-03: Empirical Kill-Switch Benchmark (<250ms)', () => {
    it('empirically demonstrates kill-switch response and cutoff across N=100 trials', () => {
      const report = EmpiricalKillSwitchBenchmark.runBenchmark(100);

      assert.strictEqual(report.totalTrials, 100);
      assert.strictEqual(report.allTrialsPassed, true);
      assert.ok(report.maxLatencyMs < 250.0);
      assert.ok(report.medianLatencyMs < 250.0);
      assert.ok(report.p99LatencyMs < 250.0);
      assert.ok(report.evidenceDigest.length === 64);
    });
  });

  describe('P16-04: Synthetic Failover & Provider Isolation Circuits', () => {
    it('executes provider isolation and rollback simulation', () => {
      const isoReport = SyntheticFailoverCircuits.isolateProvider('ISOLATED_PROV_X');
      assert.strictEqual(isoReport.isolationVerified, true);
      assert.strictEqual(isoReport.fallbackQualityState, 'UNAVAILABLE');

      const rollbackReport = SyntheticFailoverCircuits.simulateRollback();
      assert.strictEqual(rollbackReport.isolationVerified, true);
      assert.strictEqual(rollbackReport.isFailClosedPreserved, true);
    });
  });

  describe('P16-05: 20-Point Deterministic OQ Suite Runner', () => {
    it('executes the full 20-point OQ evaluation with 100% pass rate', () => {
      const report = OQSuiteRunner.runFullQualification();

      assert.strictEqual(report.totalChecks, 20);
      assert.strictEqual(report.passedChecks, 20);
      assert.strictEqual(report.failedChecks, 0);
      assert.strictEqual(report.allPassed, true);
      assert.strictEqual(report.oqDisposition, 'QUALIFIED');
      assert.ok(report.evidenceDigest.length === 64);
    });
  });

  describe('P17 Extension: Non-Production Release Candidate Manifest (v1.0.0-rc1)', () => {
    it('generates a complete non-production release candidate manifest with all required fields', () => {
      const manifest = ReleaseCandidateManifestBuilder.generateCandidateManifest(
        '48cd30a5879c32a119e62424f0b852fbed8fd919'
      );

      assert.strictEqual(manifest.releaseVersion, 'v1.0.0-rc1');
      assert.strictEqual(manifest.releaseType, 'NON_PRODUCTION_QUALIFIED_CANDIDATE');
      assert.strictEqual(manifest.sourceGitSha, '48cd30a5879c32a119e62424f0b852fbed8fd919');
      assert.strictEqual(manifest.operationalQualification.oqDisposition, 'QUALIFIED');
      assert.strictEqual(manifest.empiricalKillSwitch.cutoffMet, true);
      assert.strictEqual(manifest.securityAudit.plaintextSecretsDetected, 0);
      assert.strictEqual(manifest.methodologyIntegrity.methodologyDriftPct, 0.0);
      assert.strictEqual(manifest.masterProgramGate.status, 'OPEN_PRESERVED_WAVE6_HARD_DEPENDENCY');
      assert.strictEqual(manifest.operationalBoundaries.productionAuthorization, 'STRICTLY_PROHIBITED');
      assert.strictEqual(manifest.operationalBoundaries.commercialProviderActivation, 'STRICTLY_PROHIBITED');
      assert.ok(manifest.manifestIntegrityDigest.length === 64);
    });
  });
});
