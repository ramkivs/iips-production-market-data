/**
 * Institutional Investment Platform System (IIPS)
 * Financial Statement Restatement Tracker & PIT Lineage (P09 / D03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { StandardizedFinancialStatement, StatementScope, FiscalQuarter } from './types.js';

export interface FinancialConflictRecord {
  conflictId: string;
  companyId: string;
  scope: StatementScope;
  fiscalYear: number;
  quarter?: FiscalQuarter;
  existingStatementId: string;
  conflictingStatementId: string;
  field: string;
  existingValue: number;
  conflictingValue: number;
  divergencePct: number;
  quarantinedAt: string;
  reason: 'MATERIAL_FINANCIAL_CONFLICT_EXCEEDS_0_5_PERCENT';
}

export class FinancialConflictError extends Error {
  public readonly conflictRecord: FinancialConflictRecord;

  constructor(record: FinancialConflictRecord) {
    super(
      `Material financial conflict (>0.5%) detected for ${record.companyId} (FY${record.fiscalYear} ${record.quarter || 'FY'}): ` +
        `Field '${record.field}' divergence ${record.divergencePct.toFixed(2)}% between filings`
    );
    this.name = 'FinancialConflictError';
    this.conflictRecord = record;
  }
}

export class RestatementTracker {
  // Key: `${companyId}:${scope}:${fiscalYear}:${quarter || 'ANNUAL'}` -> Array of statements sorted by restatementIndex
  private statements: Map<string, StandardizedFinancialStatement[]> = new Map();
  private conflictSink: FinancialConflictRecord[] = [];

  private buildKey(companyId: string, scope: StatementScope, fiscalYear: number, quarter?: FiscalQuarter): string {
    return `${companyId}:${scope}:${fiscalYear}:${quarter || 'ANNUAL'}`;
  }

  public getQuarantinedConflicts(): ReadonlyArray<FinancialConflictRecord> {
    return this.conflictSink;
  }

  /**
   * Registers a standardized statement.
   * Checks for material divergence (>0.5%) if filed with same restatementIndex from different sources.
   * Increments and appends cleanly if official restatement.
   */
  public registerStatement(statement: StandardizedFinancialStatement): void {
    const key = this.buildKey(statement.companyId, statement.scope, statement.fiscalYear, statement.quarter);
    let list = this.statements.get(key);

    if (!list) {
      list = [];
      this.statements.set(key, list);
    }

    // Check for conflicting duplicate filing at same restatement index
    const existingSameIndex = list.find((s) => s.restatementIndex === statement.restatementIndex);
    if (existingSameIndex && existingSameIndex.statementId !== statement.statementId) {
      // Compare revenue, pat, totalAssets
      this.checkMaterialConflict(existingSameIndex, statement);
    }

    // Check restatement ordering
    const maxIndex = list.length > 0 ? Math.max(...list.map((s) => s.restatementIndex)) : -1;
    if (statement.restatementIndex < maxIndex) {
      // Cannot insert an older restatement index than what's already known unless it's backfill
      // In backfill, insert in sorted order
    }

    // Freeze statement for immutability
    const frozen = Object.freeze(JSON.parse(JSON.stringify(statement))) as StandardizedFinancialStatement;
    list.push(frozen);
    list.sort((a, b) => a.restatementIndex - b.restatementIndex);
  }

  /**
   * Point-in-Time Statement Retrieval:
   * Returns the highest knowable restatement sequence for the given period where filingDate <= asOf.
   */
  public queryAsOf(
    companyId: string,
    fiscalYear: number,
    quarter: FiscalQuarter | undefined,
    asOf: string,
    preferredScope: StatementScope = 'CONSOLIDATED'
  ): StandardizedFinancialStatement | undefined {
    const asOfMs = Date.parse(asOf);

    // Try primary consolidated first
    const primaryKey = this.buildKey(companyId, preferredScope, fiscalYear, quarter);
    const primaryMatch = this.findHighestKnownAt(this.statements.get(primaryKey), asOfMs);
    if (primaryMatch) {
      return primaryMatch;
    }

    // If consolidated not found and requested consolidated, fallback to standalone as secondary
    if (preferredScope === 'CONSOLIDATED') {
      const secondaryKey = this.buildKey(companyId, 'STANDALONE', fiscalYear, quarter);
      return this.findHighestKnownAt(this.statements.get(secondaryKey), asOfMs);
    }

    return undefined;
  }

  private findHighestKnownAt(
    list: StandardizedFinancialStatement[] | undefined,
    asOfMs: number
  ): StandardizedFinancialStatement | undefined {
    if (!list || list.length === 0) return undefined;

    // Filter statements filed on or before asOf
    const eligible = list.filter((s) => Date.parse(s.filingDate) <= asOfMs);
    if (eligible.length === 0) return undefined;

    // Return the one with highest restatementIndex
    return eligible.reduce((prev, curr) => (curr.restatementIndex > prev.restatementIndex ? curr : prev));
  }

  private checkMaterialConflict(
    existing: StandardizedFinancialStatement,
    incoming: StandardizedFinancialStatement
  ): void {
    const checkField = (fieldName: string, val1?: number, val2?: number) => {
      if (val1 !== undefined && val2 !== undefined && val1 !== 0) {
        const divergence = Math.abs(val1 - val2) / Math.abs(val1);
        if (divergence > 0.005) {
          // > 0.5% divergence
          const record: FinancialConflictRecord = {
            conflictId: `fin-conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            companyId: existing.companyId,
            scope: existing.scope,
            fiscalYear: existing.fiscalYear,
            quarter: existing.quarter,
            existingStatementId: existing.statementId,
            conflictingStatementId: incoming.statementId,
            field: fieldName,
            existingValue: val1,
            conflictingValue: val2,
            divergencePct: divergence * 100,
            quarantinedAt: new Date().toISOString(),
            reason: 'MATERIAL_FINANCIAL_CONFLICT_EXCEEDS_0_5_PERCENT',
          };
          this.conflictSink.push(record);
          throw new FinancialConflictError(record);
        }
      }
    };

    if (existing.incomeStatement && incoming.incomeStatement) {
      checkField('incomeStatement.revenue', existing.incomeStatement.revenue, incoming.incomeStatement.revenue);
      checkField('incomeStatement.pat', existing.incomeStatement.pat, incoming.incomeStatement.pat);
    }
    if (existing.balanceSheet && incoming.balanceSheet) {
      checkField('balanceSheet.totalAssets', existing.balanceSheet.totalAssets, incoming.balanceSheet.totalAssets);
    }
  }
}
