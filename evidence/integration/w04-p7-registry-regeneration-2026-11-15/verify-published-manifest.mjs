#!/usr/bin/env node
/**
 * W04 P7 registry publication check, route (b). READ-ONLY. RUN AFTER THE MERGE.
 *
 * Proves, without touching any checkout, that the publication reached `main`:
 * it downloads the qualification manifest from the main ref over HTTPS into
 * memory, computes its SHA-256 and requires the digest recorded when the
 * manifest was regenerated (see the record:
 * docs/integration/IIPS-W04-P7-REGISTRY-REGENERATION-2026-11-15.md).
 *
 * It writes no file, changes no checkout and contacts no provider. The only
 * network request is the GET of the manifest on the main ref (or --url).
 *
 * Usage: node verify-published-manifest.mjs [--url <url>]
 *   --url   where to download the manifest from. Default: the raw file on the
 *           main ref of ramkivs/iips-production-market-data.
 *
 * Exit: 0 the downloaded bytes are the regenerated manifest; 1 they are not;
 *       2 the request or the arguments failed.
 */
import { createHash } from 'node:crypto';

/** SHA-256 of evidence/dhan-p7/qualification-manifest.json as regenerated at
 *  pipeline commit 325266d and committed in 371bf3b, 2026-11-15. */
const REGENERATED_MANIFEST_SHA256 = '69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769';
const DEFAULT_URL =
  'https://raw.githubusercontent.com/ramkivs/iips-production-market-data/main/evidence/dhan-p7/qualification-manifest.json';

function parseArguments(argv) {
  const options = { url: DEFAULT_URL, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--url') options.url = argv[(i += 1)] ?? options.url;
    else {
      process.stderr.write(`unknown argument: ${arg}\nusage: node verify-published-manifest.mjs [--url <url>]\n`);
      process.exit(2);
    }
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write('usage: node verify-published-manifest.mjs [--url <url>]\n');
    return 0;
  }

  process.stdout.write(`url: ${options.url}\n`);
  process.stdout.write(`required sha256: ${REGENERATED_MANIFEST_SHA256}\n`);

  let response;
  try {
    response = await fetch(options.url, { redirect: 'follow' });
  } catch (error) {
    process.stdout.write(`[STOP] download failed: ${error instanceof Error ? error.message : String(error)}\nRESULT: INCONCLUSIVE\n`);
    return 2;
  }
  if (!response.ok) {
    process.stdout.write(`[STOP] download failed: HTTP ${response.status}\nRESULT: INCONCLUSIVE\n`);
    return 2;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  process.stdout.write(`bytes: ${bytes.length}\n`);
  process.stdout.write(`sha256: ${sha256}\n`);

  if (sha256 !== REGENERATED_MANIFEST_SHA256) {
    process.stdout.write('[FAIL] publication: the bytes on the main ref are not the regenerated manifest\n');
    process.stdout.write('RESULT: NOT_PUBLISHED\n');
    return 1;
  }

  let manifest;
  try {
    manifest = JSON.parse(bytes.toString('utf8'));
  } catch {
    process.stdout.write('[FAIL] publication: the required digest matched but the bytes are not JSON\n');
    process.stdout.write('RESULT: NOT_PUBLISHED\n');
    return 1;
  }
  process.stdout.write(`[PASS] publication: the downloaded bytes are the regenerated manifest (pipelineCommit=${manifest.pipelineCommit ?? 'NONE'} qualified=${manifest.totals?.qualified ?? 'NONE'})\n`);
  process.stdout.write('RESULT: PUBLISHED\n');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    process.stdout.write(`[STOP] ${error instanceof Error ? error.message : String(error)}\nRESULT: INCONCLUSIVE\n`);
    process.exit(2);
  });
