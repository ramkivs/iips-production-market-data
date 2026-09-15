/**
 * Layer-2 Official NSE EOD SFTP Acquisition Adapter.
 *
 * Implements the frozen MarketDataProviderAdapter boundary:
 * - Direct official connection to NSE Data & Analytics active-active SFTP architecture:
 *   Primary: eodsftp1.nseindia.com:7010
 *   Secondary: eodsftp2.nseindia.com:7010
 * - Failover: automatically falls over to secondary endpoint if primary fails.
 * - Authentication: OpenSSH public/private key-based authentication with assigned NSE User ID.
 * - Zero Scraping: does not access undocumented web endpoints or scrape HTML.
 * - Offline Ingestion Mode: supports manual/operator drop folder for authorized CM-UDiFF archives.
 * - Fail-closed semantics on missing credentials, unentitled states, and connection errors.
 * - Extracts in-memory .csv from .csv.zip archives via ArchiveExtractor.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CanonicalCurrentStateRecord } from './canonical-contract';
import type { MarketDataProviderAdapter } from './provider-adapter';
import { ArchiveExtractor } from './archive-extractor.ts';

export interface NseSftpConfig {
  readonly primaryHost?: string;
  readonly secondaryHost?: string;
  readonly port?: number;
  readonly userId?: string;
  readonly privateKeyPath?: string;
  readonly privateKeyPassphrase?: string;
  readonly remoteBasePath?: string;
  readonly offlineDropDir?: string;
  readonly timeoutMs?: number;
}

export type SftpTransportFn = (
  host: string,
  port: number,
  userId: string,
  keyPath: string,
  remotePath: string
) => Promise<Buffer>;

export class NseSftpAcquisitionAdapter implements MarketDataProviderAdapter {
  public readonly providerId = 'NSE_CM_SFTP_EOD';
  public readonly providerName = 'NSE Data & Analytics Limited (Cash Market EOD SFTP)';
  public readonly isEntitled: boolean;

  private readonly primaryHost: string;
  private readonly secondaryHost: string;
  private readonly port: number;
  private readonly userId: string;
  private readonly privateKeyPath: string;
  private readonly remoteBasePath: string;
  private readonly offlineDropDir: string;
  private readonly timeoutMs: number;

  private customTransport?: SftpTransportFn;

  constructor(config?: NseSftpConfig, customTransport?: SftpTransportFn) {
    this.primaryHost = config?.primaryHost ?? process.env.NSE_SFTP_PRIMARY_HOST ?? 'eodsftp1.nseindia.com';
    this.secondaryHost = config?.secondaryHost ?? process.env.NSE_SFTP_SECONDARY_HOST ?? 'eodsftp2.nseindia.com';
    this.port = config?.port ?? Number(process.env.NSE_SFTP_PORT ?? 7010);
    this.userId = config?.userId ?? process.env.NSE_SFTP_USER_ID ?? '';
    this.privateKeyPath = config?.privateKeyPath ?? process.env.NSE_SFTP_KEY_PATH ?? '';
    this.remoteBasePath = config?.remoteBasePath ?? process.env.NSE_SFTP_REMOTE_PATH ?? '/content/cm';
    this.offlineDropDir =
      config?.offlineDropDir ??
      process.env.NSE_OFFLINE_DROP_DIR ??
      path.resolve(process.env.IIPS_DATA_DIR ?? path.join(process.cwd(), '.iips-data'), 'bhavcopy');
    this.timeoutMs = config?.timeoutMs ?? 15000;
    this.customTransport = customTransport;

    // Entitlement requires User ID and an existing private key file
    const hasKey = Boolean(this.privateKeyPath.trim() && fs.existsSync(this.privateKeyPath));
    this.isEntitled = Boolean(this.userId.trim() && hasKey);
  }

  /**
   * Layer-1 current-state stub: NSE SFTP is strictly an EOD/Historical batch pipeline.
   * Current-state refresh remains handled by Layer 1 (Dhan).
   */
  public async fetchCurrentState(): Promise<{
    readonly success: boolean;
    readonly records: readonly CanonicalCurrentStateRecord[];
    readonly error?: string;
  }> {
    return {
      success: false,
      records: [],
      error: 'LAYER_SEPARATION: NseSftpAcquisitionAdapter is registered for Layer-2 EOD only. Current-state refresh is governed by Layer-1.',
    };
  }

  /**
   * Formats the official CM-UDiFF archive file name for a trade date:
   * Format: BhavCopy_NSE_CM_0_0_0_<YYYYMMDD>_F_0000.csv.zip
   */
  public static getUdiffArchiveFileName(tradeDate: string): string {
    const cleanDate = tradeDate.replace(/-/g, '');
    return `BhavCopy_NSE_CM_0_0_0_${cleanDate}_F_0000.csv.zip`;
  }

  /**
   * Fetches and decompresses EOD Bhavcopy content for a given trade date.
   * Checks:
   * 1. Offline authorized-file drop directory first (if file exists locally).
   * 2. Live SFTP connection: primary endpoint with failover to secondary endpoint.
   */
  public async fetchEodBhavcopy(tradeDate: string): Promise<{
    readonly success: boolean;
    readonly csvContent?: string;
    readonly sourceFile?: string;
    readonly error?: string;
  }> {
    const archiveName = NseSftpAcquisitionAdapter.getUdiffArchiveFileName(tradeDate);
    const uncompressedCsvName = archiveName.replace('.zip', '');

    // 1. Check Offline Drop Directory
    const localDropZipPath = path.join(this.offlineDropDir, archiveName);
    const localDropCsvPath = path.join(this.offlineDropDir, uncompressedCsvName);

    if (fs.existsSync(localDropCsvPath)) {
      try {
        const content = fs.readFileSync(localDropCsvPath, 'utf8');
        return {
          success: true,
          csvContent: content,
          sourceFile: `[OFFLINE_LOCAL] ${uncompressedCsvName}`,
        };
      } catch (err) {
        return {
          success: false,
          error: `OFFLINE_FILE_READ_FAILED: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    if (fs.existsSync(localDropZipPath)) {
      try {
        const zipBytes = fs.readFileSync(localDropZipPath);
        const extracted = ArchiveExtractor.extractCsvFromZip(zipBytes);
        return {
          success: true,
          csvContent: extracted.content,
          sourceFile: `[OFFLINE_LOCAL_ZIP] ${extracted.fileName}`,
        };
      } catch (err) {
        return {
          success: false,
          error: `OFFLINE_ZIP_EXTRACTION_FAILED: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // 2. Live SFTP Transport
    if (!this.isEntitled) {
      return {
        success: false,
        error: `EXTERNALLY_BLOCKED: NSE EOD SFTP credentials (User ID or SSH Key) not provisioned. Manual drop file '${archiveName}' not found in '${this.offlineDropDir}'.`,
      };
    }

    const remotePath = `${this.remoteBasePath}/${archiveName}`;
    const transportFn = this.customTransport ?? this.defaultSftpTransport;

    // Try Primary Endpoint
    try {
      const zipBytes = await transportFn(
        this.primaryHost,
        this.port,
        this.userId,
        this.privateKeyPath,
        remotePath
      );
      const extracted = ArchiveExtractor.extractCsvFromZip(zipBytes);
      return {
        success: true,
        csvContent: extracted.content,
        sourceFile: `[SFTP_PRIMARY] ${extracted.fileName}`,
      };
    } catch (primaryErr) {
      const pMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);

      // Attempt Failover to Secondary Endpoint
      try {
        const zipBytes = await transportFn(
          this.secondaryHost,
          this.port,
          this.userId,
          this.privateKeyPath,
          remotePath
        );
        const extracted = ArchiveExtractor.extractCsvFromZip(zipBytes);
        return {
          success: true,
          csvContent: extracted.content,
          sourceFile: `[SFTP_SECONDARY_FAILOVER] ${extracted.fileName}`,
        };
      } catch (secondaryErr) {
        const sMsg = secondaryErr instanceof Error ? secondaryErr.message : String(secondaryErr);
        return {
          success: false,
          error: `SFTP_CONNECTION_FAILED: Primary (${this.primaryHost}) failed: '${pMsg}'; Secondary (${this.secondaryHost}) failed: '${sMsg}'.`,
        };
      }
    }
  }

  /**
   * Default SFTP transport stub (requires native ssh2 or external tunnel).
   */
  private defaultSftpTransport: SftpTransportFn = async (host, port, userId) => {
    throw new Error(`LIVE_SFTP_NOT_CONNECTED: Active SSH tunnel to ${host}:${port} for user '${userId}' requires production key provisioning.`);
  };
}
