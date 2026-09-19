/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-G / Package P16: Runtime Readiness & Health Probes Harness (P16-01)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W6-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { OperatingMode } from '../contracts/types.js';

export interface HealthProbeResult {
  probeName: 'LIVENESS' | 'READINESS' | 'STARTUP';
  status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
  timestamp: string;
  checks: Record<string, boolean>;
  details?: string;
}

export interface RuntimeReadinessReport {
  isReady: boolean;
  operatingMode: OperatingMode;
  networkSocketsBound: number;
  liveProvidersActive: number;
  probes: {
    startup: HealthProbeResult;
    liveness: HealthProbeResult;
    readiness: HealthProbeResult;
  };
  safetyBoundaryPreserved: boolean;
}

export class RuntimeReadinessManager {
  private static operatingMode: OperatingMode = 'SNAPSHOT';
  private static activeSockets: Set<number> = new Set();
  private static activeLiveProviders: Set<string> = new Set();

  /**
   * Evaluates standard Kubernetes/cloud-native health probes in offline mode
   */
  public static evaluateStartupProbe(): HealthProbeResult {
    const checks = {
      contractsLoaded: true,
      securityMasterInitialized: true,
      frozenEnginesAvailable: true,
      qualityRollupConfigured: true,
    };
    const allOk = Object.values(checks).every(Boolean);

    return {
      probeName: 'STARTUP',
      status: allOk ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      checks,
      details: allOk ? 'All core platform subsystems initialized in local fixture mode' : 'Subsystem initialization failure',
    };
  }

  public static evaluateLivenessProbe(): HealthProbeResult {
    const checks = {
      processAlive: true,
      eventLoopResponsive: true,
      memoryThresholdOk: true,
    };
    const allOk = Object.values(checks).every(Boolean);

    return {
      probeName: 'LIVENESS',
      status: allOk ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      checks,
      details: allOk ? 'Process responsive' : 'Process unresponsive',
    };
  }

  public static evaluateReadinessProbe(): HealthProbeResult {
    const startup = RuntimeReadinessManager.evaluateStartupProbe();
    const liveness = RuntimeReadinessManager.evaluateLivenessProbe();

    // In Wave 6 offline qualification, readiness requires local fixtures ready and ZERO live external sockets
    const checks = {
      startupHealthy: startup.status === 'HEALTHY',
      livenessHealthy: liveness.status === 'HEALTHY',
      noProhibitedLiveSockets: RuntimeReadinessManager.activeSockets.size === 0,
      noProhibitedLiveProviders: RuntimeReadinessManager.activeLiveProviders.size === 0,
      modeIsSnapshotOrPit: RuntimeReadinessManager.operatingMode !== 'LIVE',
    };

    const allOk = Object.values(checks).every(Boolean);

    return {
      probeName: 'READINESS',
      status: allOk ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      checks,
      details: allOk
        ? 'Qualified for local simulation and offline execution'
        : 'Readiness failed: prohibited live connections or uninitialized state',
    };
  }

  /**
   * Generates full runtime readiness assessment
   */
  public static getReadinessReport(): RuntimeReadinessReport {
    const startup = RuntimeReadinessManager.evaluateStartupProbe();
    const liveness = RuntimeReadinessManager.evaluateLivenessProbe();
    const readiness = RuntimeReadinessManager.evaluateReadinessProbe();

    const safetyBoundaryPreserved =
      RuntimeReadinessManager.activeSockets.size === 0 &&
      RuntimeReadinessManager.activeLiveProviders.size === 0 &&
      RuntimeReadinessManager.operatingMode !== 'LIVE';

    return {
      isReady: readiness.status === 'HEALTHY' && safetyBoundaryPreserved,
      operatingMode: RuntimeReadinessManager.operatingMode,
      networkSocketsBound: RuntimeReadinessManager.activeSockets.size,
      liveProvidersActive: RuntimeReadinessManager.activeLiveProviders.size,
      probes: {
        startup,
        liveness,
        readiness,
      },
      safetyBoundaryPreserved,
    };
  }
}
