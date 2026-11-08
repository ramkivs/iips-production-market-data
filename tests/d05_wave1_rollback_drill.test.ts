/**
 * Evidence-only rollback drill — Wave-1 governed deposition (2026-11-08, post-merge P8).
 *
 * Governing act: AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001
 * (PA directive 2026-11-08, FINAL-RECONCILIATION-AND-GOVERNED-REPLACEMENT, executed in #139).
 *
 * This suite is the P8 "rollback drill": it proves the as-deposited Wave-1 evidence and its
 * legacy hydration path remain intact and byte-identical to their deposited pins. It is
 * EVIDENCE-ONLY — it flips nothing, routes nothing and is not a runtime toggle. Production
 * hydration remains getGovernedBroadSecurityMaster() → the 2026-11-08 authenticated universe.
 *
 * Wave-1 as-deposited pins (never mutated by the replacement):
 *   corpus    evidence/operator_drop/d05_security_master_broad_universe.json
 *   sha256    7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5
 *   batch     BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001 (recordCount 2250)
 *   runtime   src/identity/d05_broad_universe_data.ts 6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  getGovernedLegacyWave1SecurityMaster,
  getGovernedBroadSecurityMaster,
  D05_BROAD_UNIVERSE_ENTITIES,
} from '../src/identity/index.js';
import { IdentityAmbiguityError } from '../src/identity/quarantine.js';
import { ObjectResolverService } from '../src/transports/object_resolver.js';

const ROOT = process.cwd();
const CORPUS_PATH = join(ROOT, 'evidence/operator_drop/d05_security_master_broad_universe.json');
const RUNTIME_ASSET_PATH = join(ROOT, 'src/identity/d05_broad_universe_data.ts');

describe('D05 Wave-1 rollback drill (evidence-only, P8, 2026-11-08)', () => {
  it('RB-01: as-deposited Wave-1 bytes are identical to their pins (corpus + runtime asset)', () => {
    const corpus = createHash('sha256').update(readFileSync(CORPUS_PATH)).digest('hex');
    assert.strictEqual(corpus, '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5');
    const asset = createHash('sha256').update(readFileSync(RUNTIME_ASSET_PATH)).digest('hex');
    assert.strictEqual(asset, '6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5');
    assert.strictEqual(D05_BROAD_UNIVERSE_ENTITIES.length, 2250);
  });

  it('RB-02: the legacy hydration loads and binds the Wave-1 pinned revision', () => {
    const legacy = getGovernedLegacyWave1SecurityMaster();
    assert.strictEqual(D05_BROAD_UNIVERSE_ENTITIES.length, 2250);
    assert.strictEqual(legacy.listAllCompanyIds().length, 2250);
    assert.strictEqual(legacy.sourceRevision!.batchId, 'BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001');
    assert.strictEqual(legacy.sourceRevision!.fileChecksumSha256, '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5');
    assert.strictEqual(legacy.sourceRevision!.recordCount, 2250);
    assert.strictEqual(legacy.sourceRevision!.authorizationRef, 'AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001');
  });

  it('RB-03: a pinned legacy ISIN resolves through the legacy master (EQ_AIIL_IN)', () => {
    const legacy = getGovernedLegacyWave1SecurityMaster();
    assert.strictEqual(legacy.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE206F01022' }), 'EQ_AIIL_IN');
    assert.strictEqual(legacy.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:539177' }), 'EQ_AIIL_IN');
    // The runtime projection carries 539177 only; the deposited corpus stays untouched (as-deposited [543989, 539177] both remain in the JSON).
    assert.deepStrictEqual(
      legacy.getEntity('EQ_AIIL_IN')!.listings.filter((l) => l.exchange === 'BSE').map((l) => l.scripCode),
      ['539177']
    );
  });

  it('RB-04: quarantine paths are intact — BSE:543989 (Sai Silks) fails closed in the legacy universe, as does any unmapped identifier', () => {
    const legacy = getGovernedLegacyWave1SecurityMaster();
    assert.throws(
      () => legacy.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:543989' }),
      (err: unknown) => {
        assert.ok(err instanceof IdentityAmbiguityError);
        assert.strictEqual(err.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
        return true;
      },
    );
    assert.throws(
      () => legacy.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'THIS_TICKER_DOES_NOT_EXIST' }),
      IdentityAmbiguityError,
    );
    // The authenticated provider MUST NOT contain Sai Silks resolving to Authum; the Kalamandir listing exists there only.
    const current = getGovernedBroadSecurityMaster();
    assert.strictEqual(current.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE438K01021' }), 'EQ_KALAMANDIR_IN');
  });

  it('RB-05: the drill is evidence-only — it changes no runtime binding', () => {
    const current = getGovernedBroadSecurityMaster();
    assert.strictEqual(current.sourceRevision!.batchId, 'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001');
    assert.strictEqual(current.sourceRevision!.recordCount, 2390);
    // Rollback remains an act-bound decision; this drill encodes the drill, not a toggle.
    const legacy = getGovernedLegacyWave1SecurityMaster();
    assert.notStrictEqual(legacy, current);
  });
});
