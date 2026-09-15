/**
 * Provider-neutral Market Data Adapter Interface & Reference/Mock Implementations.
 *
 * Keeps the real authorized NSE acquisition adapter behind an explicit configuration/entitlement gate.
 */

import type { CanonicalCurrentStateRecord } from './canonical-contract';

export interface MarketDataProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly isEntitled: boolean;

  /**
   * Fetches the latest market snapshot (approximately 15-minute delayed).
   */
  fetchCurrentState(): Promise<{
    readonly success: boolean;
    readonly records: readonly CanonicalCurrentStateRecord[];
    readonly error?: string;
  }>;

  /**
   * Fetches EOD Bhavcopy content for a given trade date.
   */
  fetchEodBhavcopy(tradeDate: string): Promise<{
    readonly success: boolean;
    readonly csvContent?: string;
    readonly sourceFile?: string;
    readonly error?: string;
  }>;
}

/**
 * Production NSE Acquisition Adapter (Gate Protected).
 * Strictly enforces that unless credentials, licensing, and exchange entitlements are provisioned,
 * live calls fail safely and visibly rather than attempting unauthorized access or scraping.
 */
export class NseProductionAcquisitionAdapter implements MarketDataProviderAdapter {
  public readonly providerId = 'NSE_CM_PRODUCTION';
  public readonly providerName = 'National Stock Exchange of India (Capital Market)';
  public readonly isEntitled: boolean;
  public readonly credentialsConfig?: { apiKey?: string; apiSecret?: string; licensingId?: string };

  constructor(config?: { apiKey?: string; apiSecret?: string; licensingId?: string }) {
    this.credentialsConfig = config;
    this.isEntitled = Boolean(config?.apiKey && config?.apiSecret && config?.licensingId);
  }

  public async fetchCurrentState(): Promise<{
    readonly success: boolean;
    readonly records: readonly CanonicalCurrentStateRecord[];
    readonly error?: string;
  }> {
    if (!this.isEntitled) {
      return {
        success: false,
        records: [],
        error:
          'EXTERNALLY_BLOCKED: Production NSE credentials and licensing agreement not provisioned (OI-P04-04 gate active).',
      };
    }

    // In a fully provisioned environment with real authorized API access, this calls the approved endpoint.
    return {
      success: false,
      records: [],
      error: 'PRODUCTION_ENDPOINT_NOT_CONNECTED: Awaiting final connectivity verification with NSE.',
    };
  }

  public async fetchEodBhavcopy(tradeDate: string): Promise<{
    readonly success: boolean;
    readonly csvContent?: string;
    readonly sourceFile?: string;
    readonly error?: string;
  }> {
    if (!this.isEntitled) {
      return {
        success: false,
        error:
          `EXTERNALLY_BLOCKED: Production NSE CM-UDiFF entitlement not provisioned for trade date ${tradeDate}. Manual/authorized download required.`,
      };
    }

    return {
      success: false,
      error: 'PRODUCTION_SFTP_NOT_CONNECTED',
    };
  }
}

/**
 * Reference/Mock File-Based Provider Adapter for Deterministic Automated Verification.
 */
export class ReferenceFileBasedAdapter implements MarketDataProviderAdapter {
  public readonly providerId = 'NSE_REFERENCE_MOCK';
  public readonly providerName = 'NSE Reference / Synthetic Test Adapter';
  public readonly isEntitled = true;

  private mockCurrentState: CanonicalCurrentStateRecord[] = [];
  private mockBhavcopies: Map<string, { csvContent: string; sourceFile: string }> = new Map();
  private shouldFail: boolean = false;
  private failReason: string = 'SIMULATED_PROVIDER_ERROR';

  public setMockCurrentState(records: CanonicalCurrentStateRecord[]): void {
    this.mockCurrentState = [...records];
  }

  public registerMockBhavcopy(tradeDate: string, csvContent: string, sourceFile: string): void {
    this.mockBhavcopies.set(tradeDate, { csvContent, sourceFile });
  }

  public setFailureMode(fail: boolean, reason?: string): void {
    this.shouldFail = fail;
    if (reason) this.failReason = reason;
  }

  public async fetchCurrentState(): Promise<{
    readonly success: boolean;
    readonly records: readonly CanonicalCurrentStateRecord[];
    readonly error?: string;
  }> {
    if (this.shouldFail) {
      return {
        success: false,
        records: [],
        error: this.failReason,
      };
    }
    return {
      success: true,
      records: this.mockCurrentState,
    };
  }

  public async fetchEodBhavcopy(tradeDate: string): Promise<{
    readonly success: boolean;
    readonly csvContent?: string;
    readonly sourceFile?: string;
    readonly error?: string;
  }> {
    if (this.shouldFail) {
      return {
        success: false,
        error: this.failReason,
      };
    }

    const found = this.mockBhavcopies.get(tradeDate);
    if (!found) {
      return {
        success: false,
        error: `No Bhavcopy fixture registered for date ${tradeDate}`,
      };
    }

    return {
      success: true,
      csvContent: found.csvContent,
      sourceFile: found.sourceFile,
    };
  }
}
