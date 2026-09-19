/**
 * Institutional Investment Platform System (IIPS)
 * Dead-Letter Quarantine & Audit Sink (P05 / P07)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { DataDomain, SourceClassification } from '../contracts/types.js';

export interface DeadLetterRecord {
  quarantineId: string;
  domain: DataDomain;
  failureStage: 'STAGE_1_INGRESS' | 'STAGE_2_STRUCTURAL' | 'STAGE_3_CANONICAL' | 'STAGE_4_INVARIANT';
  rawPayload: unknown;
  anomalyCodes: string[];
  errors: string[];
  receivedAt: string;
  sourceClassification: SourceClassification;
}

export class DeadLetterQueue {
  private records: DeadLetterRecord[] = [];

  public push(record: DeadLetterRecord): void {
    this.records.push(record);
  }

  public getAll(): ReadonlyArray<DeadLetterRecord> {
    return this.records;
  }

  public getCount(): number {
    return this.records.length;
  }

  public getByDomain(domain: DataDomain): DeadLetterRecord[] {
    return this.records.filter((r) => r.domain === domain);
  }

  public clear(): void {
    this.records = [];
  }
}
