import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { SecurityMasterEntry, SecurityMasterRegistry } from './security-master-contract.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SECTOR_DIR_FAMILIES = [
  'Banking',
  'Insurance',
  'Capital Markets',
  'Healthcare',
  'Hospitality',
  'Energy',
  'Utilities',
  'Consumer',
  'Industrials',
  'Technology',
  'Telecommunications',
  'Automobile',
  'Materials & Metals',
] as const;

export class SecurityMasterService {
  private readonly entriesByCanonicalId = new Map<string, SecurityMasterEntry>();
  private readonly entriesByTicker = new Map<string, SecurityMasterEntry>();
  private readonly entriesByIsin = new Map<string, SecurityMasterEntry>();
  private readonly registry: SecurityMasterRegistry;

  constructor(registryOrPath?: SecurityMasterRegistry | string) {
    if (!registryOrPath) {
      const defaultPath = path.resolve(__dirname, 'security-master-1.0.0.json');
      const raw = fs.readFileSync(defaultPath, 'utf8');
      this.registry = JSON.parse(raw) as SecurityMasterRegistry;
    } else if (typeof registryOrPath === 'string') {
      const raw = fs.readFileSync(registryOrPath, 'utf8');
      this.registry = JSON.parse(raw) as SecurityMasterRegistry;
    } else {
      this.registry = registryOrPath;
    }

    this.validateAndIndex();
  }

  private validateAndIndex(): void {
    const isinRegex = /^IN[A-Z0-9]{9}[0-9]$/;

    for (const entry of this.registry.entries) {
      // 1. Invariant: Valid ISO 6166 ISIN
      if (!isinRegex.test(entry.isin)) {
        throw new Error(`SECURITY_MASTER_VALIDATION_ERROR: Malformed ISIN ${entry.isin} for ${entry.tickerSymbol}`);
      }

      // 2. Invariant: Sector Conformance
      if (!SECTOR_DIR_FAMILIES.includes(entry.sector as (typeof SECTOR_DIR_FAMILIES)[number])) {
        throw new Error(`SECURITY_MASTER_VALIDATION_ERROR: Sector ${entry.sector} does not match certified SECTOR_DIR families`);
      }

      // 3. Invariant: Permitted Series
      const validSeries = ['EQ', 'BE', 'SM', 'ST'];
      if (!validSeries.includes(entry.series)) {
        throw new Error(`SECURITY_MASTER_VALIDATION_ERROR: Invalid series ${entry.series} for ${entry.tickerSymbol}`);
      }

      // 4. Invariant: Canonical ID Uniqueness
      if (this.entriesByCanonicalId.has(entry.canonicalSecurityId)) {
        throw new Error(`SECURITY_MASTER_COLLISION_ERROR: Duplicate canonicalSecurityId ${entry.canonicalSecurityId}`);
      }

      // 5. Invariant: (Exchange, Ticker) Uniqueness
      const exchangeTickerKey = `${entry.exchange}:${entry.tickerSymbol.toUpperCase()}`;
      if (this.entriesByTicker.has(exchangeTickerKey)) {
        throw new Error(`SECURITY_MASTER_COLLISION_ERROR: Duplicate ticker ${entry.tickerSymbol} on ${entry.exchange}`);
      }

      // 6. Invariant: ISIN Uniqueness
      if (this.entriesByIsin.has(entry.isin.toUpperCase())) {
        throw new Error(`SECURITY_MASTER_COLLISION_ERROR: Duplicate ISIN ${entry.isin}`);
      }

      // Store in indexes
      this.entriesByCanonicalId.set(entry.canonicalSecurityId, entry);
      this.entriesByTicker.set(exchangeTickerKey, entry);
      this.entriesByIsin.set(entry.isin.toUpperCase(), entry);
    }
  }

  /**
   * Resolves an NSE Ticker to a canonical SecurityMasterEntry.
   * Enforces temporal validity (effectiveFrom / effectiveTo) and listingStatus.
   * Returns null if unmapped or inactive on the given date (fail-closed).
   */
  public resolveByTicker(ticker: string, asOfDate?: string, exchange: string = 'NSE'): SecurityMasterEntry | null {
    if (!ticker || exchange !== 'NSE') return null;
    const cleanTicker = ticker.trim().toUpperCase();
    const entry = this.entriesByTicker.get(`NSE:${cleanTicker}`);
    if (!entry) return null;

    if (!this.isTemporallyActive(entry, asOfDate)) {
      return null;
    }

    return entry;
  }

  /**
   * Resolves an ISIN to a canonical SecurityMasterEntry.
   * Enforces temporal validity (effectiveFrom / effectiveTo) and listingStatus.
   * Returns null if unmapped or inactive on the given date (fail-closed).
   */
  public resolveByIsin(isin: string, asOfDate?: string): SecurityMasterEntry | null {
    if (!isin) return null;
    const cleanIsin = isin.trim().toUpperCase();
    const entry = this.entriesByIsin.get(cleanIsin);
    if (!entry) return null;

    if (!this.isTemporallyActive(entry, asOfDate)) {
      return null;
    }

    return entry;
  }

  /**
   * Resolves a canonicalSecurityId (e.g. 'ENERGY-H1') back to its SecurityMasterEntry.
   */
  public resolveByCanonicalId(canonicalId: string): SecurityMasterEntry | null {
    if (!canonicalId) return null;
    return this.entriesByCanonicalId.get(canonicalId.trim()) ?? null;
  }

  /**
   * Temporal and lifecycle validation.
   */
  private isTemporallyActive(entry: SecurityMasterEntry, asOfDate?: string): boolean {
    if (entry.listingStatus !== 'ACTIVE') {
      return false; // Delisted or suspended securities fail closed
    }

    if (asOfDate) {
      if (asOfDate < entry.effectiveFrom) {
        return false; // Inactive prior to listing
      }
      if (entry.effectiveTo && asOfDate > entry.effectiveTo) {
        return false; // Inactive after retirement/supersession
      }
    }

    return true;
  }

  public getEntryCount(): number {
    return this.entriesByCanonicalId.size;
  }

  public getAllEntries(): readonly SecurityMasterEntry[] {
    return Array.from(this.entriesByCanonicalId.values());
  }
}
