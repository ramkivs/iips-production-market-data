#!/usr/bin/env node
/**
 * D114: Automated Historical Bhavcopy Batch Ingestion CLI.
 *
 * Usage:
 *   node --experimental-strip-types frontend/server/market-data/cli/batch-ingest.ts --dir <path> [options]
 *
 * Options:
 *   --dir <path>           Input directory containing NSE CM-UDiFF ZIP/CSV archives (required)
 *   --dry-run              Discover and validate archives without persisting to MarketDataStore
 *   --stop-on-error        Halt immediately upon encountering the first corrupt/malformed file
 *   --from-date <YYYY-MM-DD> Filter: process only files on or after this date (inclusive)
 *   --to-date <YYYY-MM-DD>   Filter: process only files on or before this date (inclusive)
 *   --json                 Output complete audit summary in JSON format
 *   --help                 Display usage help
 */

import * as path from 'node:path';
import { BatchIngestionHarness, type BatchIngestionOptions } from '../batch-ingestion-harness';
import { defaultMarketDataStore } from '../market-data-store';

export function parseArgs(args: string[]): BatchIngestionOptions & { json?: boolean; help?: boolean } {
  let inputDir = '';
  let dryRun = false;
  let stopOnError = false;
  let fromDate: string | undefined;
  let toDate: string | undefined;
  let json = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dir') {
      inputDir = args[++i] || '';
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--stop-on-error') {
      stopOnError = true;
    } else if (arg === '--from-date') {
      fromDate = args[++i];
    } else if (arg === '--to-date') {
      toDate = args[++i];
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    }
  }

  return {
    inputDir: inputDir ? path.resolve(inputDir) : '',
    dryRun,
    stopOnError,
    fromDate,
    toDate,
    json,
    help,
  };
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const options = parseArgs(argv);

  if (options.help || !options.inputDir) {
    console.log(`
IIPS D114 — Automated Historical Bhavcopy Batch Ingestion CLI

Usage:
  npx tsx frontend/server/market-data/cli/batch-ingest.ts --dir <path> [options]

Options:
  --dir <path>             Directory with NSE CM-UDiFF archives (required)
  --dry-run                Validate and parse without persisting records
  --stop-on-error          Stop immediately if any archive fails
  --from-date <YYYY-MM-DD> Start date filter (inclusive)
  --to-date <YYYY-MM-DD>   End date filter (inclusive)
  --json                   Emit full machine-readable JSON summary
  --help                   Display this help message

Notes:
  - Supports both .csv.zip (extracted in-memory) and raw .csv files.
  - Files are processed in strict ascending chronological order.
  - Zero web scraping, zero network egress, zero file mutation.
`);
    return options.help ? 0 : 1;
  }

  const harness = new BatchIngestionHarness(defaultMarketDataStore);

  try {
    const summary = await harness.executeBatch({
      inputDir: options.inputDir,
      fromDate: options.fromDate,
      toDate: options.toDate,
      dryRun: options.dryRun,
      stopOnError: options.stopOnError,
    });

    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log('============================================================');
      console.log(`IIPS D114 BATCH INGESTION AUDIT SUMMARY ${summary.dryRun ? '[DRY-RUN]' : ''}`);
      console.log('============================================================');
      console.log(`Target Directory:         ${summary.inputDir}`);
      console.log(`Files Discovered:         ${summary.totalFilesDiscovered}`);
      console.log(`Files Processed:          ${summary.totalFilesProcessed}`);
      console.log(`Files Succeeded:          ${summary.totalFilesSuccessful}`);
      console.log(`Files Failed:             ${summary.totalFilesFailed}`);
      console.log(`Records Accepted:         ${summary.totalRecordsAccepted}`);
      console.log(`Duplicates Suppressed:    ${summary.totalDuplicatesSuppressed}`);
      console.log(`Records Quarantined:      ${summary.totalRecordsQuarantined}`);
      console.log(`Earliest Trade Date:      ${summary.earliestTradeDate ?? 'None'}`);
      console.log(`Latest Trade Date:        ${summary.latestTradeDate ?? 'None'}`);
      console.log(`All Files Immutable:      ${summary.allFilesImmutable ? 'YES (SHA-256 Verified)' : 'FAILED'}`);
      console.log(`Total Elapsed Time:       ${summary.totalElapsedMs} ms`);
      console.log(`Throughput:               ${summary.throughputRecordsPerSec} records/sec`);
      console.log('============================================================');

      if (summary.totalFilesFailed > 0) {
        console.log('\nFailed Archives:');
        for (const f of summary.fileResults.filter((r) => !r.success)) {
          console.log(`  - ${f.fileName} (${f.tradeDate}): ${f.error}`);
        }
      }
    }

    return summary.totalFilesFailed > 0 ? 1 : 0;
  } catch (err) {
    console.error('BATCH INGESTION FATAL ERROR:', err instanceof Error ? err.message : String(err));
    return 1;
  }
}

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  runCli().then((exitCode) => process.exit(exitCode));
}
