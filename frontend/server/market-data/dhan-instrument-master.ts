/**
 * DhanHQ v2 Instrument Master & Scrip Resolver.
 *
 * Responsibilities:
 * - Deterministically maps NSE equity symbols (e.g. 'TCS', 'INFY', 'RELIANCE') to Dhan integer securityIds.
 * - Parses and caches Dhan's daily scrip master CSV.
 * - Rejects unknown/unmapped symbols without fuzzy guessing or silent substitution.
 */

export interface DhanScripRecord {
  readonly exchangeId: 'NSE' | 'BSE' | string;
  readonly securityId: string;
  readonly tradingSymbol: string;
  readonly customSymbol?: string;
  readonly instrumentType?: string;
}

export class DhanInstrumentMasterResolver {
  private symbolToSecurityId: Map<string, string> = new Map();
  private securityIdToSymbol: Map<string, string> = new Map();

  constructor(seedMappings?: Record<string, string>) {
    if (seedMappings) {
      for (const [sym, secId] of Object.entries(seedMappings)) {
        const cleanSym = sym.trim().toUpperCase();
        this.symbolToSecurityId.set(cleanSym, secId);
        this.securityIdToSymbol.set(secId, cleanSym);
      }
    } else {
      // Default seed mappings for representative NSE Capital Market equities
      this.registerSeedDefaults();
    }
  }

  private registerSeedDefaults(): void {
    const defaults: Record<string, string> = {
      TCS: '11536',
      INFY: '1594',
      RELIANCE: '2885',
      HDFCBANK: '1333',
      ICICIBANK: '4963',
      SBIN: '3045',
      BHARTIARTL: '10604',
      ITC: '1660',
      KOTAKBANK: '1922',
      LT: '11483',
    };
    for (const [sym, secId] of Object.entries(defaults)) {
      this.symbolToSecurityId.set(sym, secId);
      this.securityIdToSymbol.set(secId, sym);
    }
  }

  /**
   * Ingests and parses Dhan's official scrip master CSV.
   * Header format: SEM_EXM_EXCH_ID,SEM_SMST_SECURITY_ID,SEM_TRADING_SYMBOL,...
   */
  public ingestScripMasterCsv(csvContent: string): number {
    const lines = csvContent.split(/\r?\n/);
    if (lines.length < 2) return 0;

    let loaded = 0;
    const header = lines[0].split(',').map((h) => h.trim().toUpperCase());
    const exchIdx = header.indexOf('SEM_EXM_EXCH_ID');
    const secIdIdx = header.indexOf('SEM_SMST_SECURITY_ID');
    const symbolIdx = header.indexOf('SEM_TRADING_SYMBOL');
    const seriesIdx = header.indexOf('SEM_SERIES');

    if (exchIdx === -1 || secIdIdx === -1 || symbolIdx === -1) {
      throw new Error('MALFORMED_SCRIP_MASTER_CSV: Missing required header columns');
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.trim());
      const exch = cols[exchIdx];
      const secId = cols[secIdIdx];
      const symbol = cols[symbolIdx];
      const series = seriesIdx !== -1 ? cols[seriesIdx] : 'EQ';

      // Strictly NSE Capital Market equities (EQ series)
      if (exch === 'NSE' && (series === 'EQ' || series === 'BE' || series === 'SM') && symbol && secId) {
        const cleanSym = symbol.toUpperCase();
        this.symbolToSecurityId.set(cleanSym, secId);
        this.securityIdToSymbol.set(secId, cleanSym);
        loaded++;
      }
    }

    return loaded;
  }

  public resolveSecurityId(symbol: string, exchange: string = 'NSE'): string | null {
    if (exchange !== 'NSE') return null;
    const clean = symbol.trim().toUpperCase();
    return this.symbolToSecurityId.get(clean) ?? null;
  }

  public resolveSymbol(securityId: string): string | null {
    return this.securityIdToSymbol.get(securityId.trim()) ?? null;
  }

  public getKnownSymbolCount(): number {
    return this.symbolToSecurityId.size;
  }
}
