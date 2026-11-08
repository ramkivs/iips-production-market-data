/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-P7 — official Dhan instrument-master source retrieval & evidence.
 *
 * Official documented public sources (no credentials required):
 *   detailed: https://images.dhan.co/api-data/api-scrip-master-detailed.csv
 *   compact:  https://images.dhan.co/api-data/api-scrip-master.csv
 *
 * The detailed master is the primary qualification source: it documents
 * EXCH_ID, SEGMENT, SEM_SMST_SECURITY_ID, ISIN, INSTRUMENT, SERIES, ...
 * The compact master lacks ISIN/SEGMENT detail and is used only for a
 * security-ID cross-check.
 *
 * Every retrieval is recorded as immutable evidence: URL, UTC timestamp, HTTP
 * status, response metadata, raw SHA-256, byte size. A snapshot is only ever
 * claimed current as of its actual retrieval timestamp.
 */

import { createHash } from 'node:crypto';

export const DHAN_INSTRUMENT_MASTER_DETAILED_URL =
  'https://images.dhan.co/api-data/api-scrip-master-detailed.csv';
export const DHAN_INSTRUMENT_MASTER_COMPACT_URL = 'https://images.dhan.co/api-data/api-scrip-master.csv';

export interface SourceRetrievalEvidence {
  readonly url: string;
  readonly retrievedAtUtc: string;
  readonly httpStatus: number | null;
  readonly contentType: string | null;
  readonly contentLength: number | null;
  readonly rawSha256: string | null;
  readonly byteSize: number | null;
  readonly ok: boolean;
  readonly error?: string;
}

export interface SourceSnapshot {
  readonly evidence: SourceRetrievalEvidence;
  readonly body: string;
}

/** Fetches the official master, capturing full retrieval evidence. Never throws for network failure. */
export async function retrieveInstrumentMaster(
  url: string = DHAN_INSTRUMENT_MASTER_DETAILED_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<SourceSnapshot> {
  const retrievedAtUtc = new Date().toISOString();
  try {
    const response = await fetchImpl(url, { method: 'GET' });
    const body = await response.text();
    const bytes = Buffer.from(body, 'utf8');
    const evidence: SourceRetrievalEvidence = {
      url,
      retrievedAtUtc,
      httpStatus: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length') ? Number(response.headers.get('content-length')) : null,
      rawSha256: response.ok ? sha256Hex(bytes) : null,
      byteSize: bytes.length,
      ok: response.ok,
      ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
    };
    return { evidence, body };
  } catch (error) {
    const evidence: SourceRetrievalEvidence = {
      url,
      retrievedAtUtc,
      httpStatus: null,
      contentType: null,
      contentLength: null,
      rawSha256: null,
      byteSize: null,
      ok: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
    return { evidence, body: '' };
  }
}

export function sha256Hex(data: Buffer | string): string {
  // Local import indirection keeps this module free of node:crypto in browser bundles.
  return createHash('sha256').update(data).digest('hex');
}
