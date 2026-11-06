#!/usr/bin/env node
/**
 * DHAN-P7 evidence runner: retrieve the official Dhan instrument master,
 * snapshot it, qualify records against authoritative P04 identity data and
 * emit a machine-readable manifest + human-readable report under
 * evidence/dhan-p7/. Deterministic for a fixed snapshot (`--snapshot <file>`).
 *
 * No credentials are used or requested. No live quote request is made.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  retrieveInstrumentMaster,
  parseInstrumentMasterCsv,
  qualifyInstrumentMaster,
  DHAN_INSTRUMENT_MASTER_DETAILED_URL,
  DHAN_INSTRUMENT_MASTER_COMPACT_URL,
} from '../dist/src/providers/dhan/index.js';
import { getGovernedBroadSecurityMaster } from '../dist/src/identity/governed_fixture_master.js';

const outDir = resolve(process.cwd(), 'evidence/dhan-p7');
mkdirSync(outDir, { recursive: true });

const snapshotArg = process.argv.indexOf('--snapshot');
const snapshotPath = snapshotArg >= 0 ? process.argv[snapshotArg + 1] : null;

let source;
let body;
if (snapshotPath) {
  body = readFileSync(snapshotPath, 'utf8');
  const bytes = Buffer.from(body, 'utf8');
  source = {
    url: `file://${resolve(snapshotPath)} (retained snapshot of ${DHAN_INSTRUMENT_MASTER_DETAILED_URL})`,
    retrievedAtUtc: new Date().toISOString(),
    httpStatus: null,
    contentType: 'text/csv',
    contentLength: bytes.length,
    rawSha256: createHash('sha256').update(bytes).digest('hex'),
    byteSize: bytes.length,
    ok: true,
  };
  writeFileSync(join(outDir, 'api-scrip-master-detailed.snapshot.csv'), body);
} else {
  const snap = await retrieveInstrumentMaster(DHAN_INSTRUMENT_MASTER_DETAILED_URL);
  source = snap.evidence;
  body = snap.body;
  if (snap.evidence.ok) {
    writeFileSync(join(outDir, 'api-scrip-master-detailed.csv'), body);
  }
  // Compact master is used only for a security-ID cross-check when reachable.
  const compact = await retrieveInstrumentMaster(DHAN_INSTRUMENT_MASTER_COMPACT_URL);
  writeFileSync(
    join(outDir, 'retrieval-log.json'),
    JSON.stringify({ detailed: source, compact: compact.evidence }, null, 2) + '\n',
  );
}

const parsed = parseInstrumentMasterCsv(body);
const { manifest, registry } = qualifyInstrumentMaster(parsed, getGovernedBroadSecurityMaster(), source);

const manifestJson = {
  task: 'DHAN-P7',
  generatedAtUtc: new Date().toISOString(),
  source: manifest.source,
  parserSchemaError: manifest.parserSchemaError,
  observedHeaders: manifest.observedHeaders,
  totalRows: manifest.totalRows,
  equityCandidates: manifest.equityCandidates,
  qualified: manifest.qualified,
  counts: manifest.counts,
  coverageByExchangeSeries: manifest.coverageByExchangeSeries,
  registryEntries: manifest.registryEntries,
  records: manifest.records,
};
writeFileSync(join(outDir, 'qualification-manifest.json'), JSON.stringify(manifestJson, null, 2) + '\n');

const lines = [
  '# DHAN-P7 Instrument-Master Qualification Report',
  '',
  `- Source: ${source.url}`,
  `- Retrieved (UTC): ${source.retrievedAtUtc} — not claimed current beyond this timestamp`,
  `- HTTP status: ${source.httpStatus ?? 'unreachable'}`,
  `- Raw SHA-256: ${source.rawSha256 ?? 'n/a'}`,
  `- Bytes: ${source.byteSize ?? 'n/a'}`,
  `- Total rows: ${manifest.totalRows}, equity candidates: ${manifest.equityCandidates}, qualified: ${manifest.qualified}`,
  `- Counts: ${JSON.stringify(manifest.counts)}`,
  `- Coverage by exchange:series: ${JSON.stringify(manifest.coverageByExchangeSeries)}`,
  `- Registry entries populated: ${manifest.registryEntries.length}`,
  '',
  'A record in Dhan\'s master does NOT prove live quote qualification or current tradability.',
].join('\n');
writeFileSync(join(outDir, 'qualification-report.md'), lines + '\n');

console.log(JSON.stringify({
  ok: source.ok,
  url: source.url,
  httpStatus: source.httpStatus,
  rawSha256: source.rawSha256,
  totalRows: manifest.totalRows,
  qualified: manifest.qualified,
  registrySize: registry.size,
  evidenceDir: outDir,
}, null, 2));
