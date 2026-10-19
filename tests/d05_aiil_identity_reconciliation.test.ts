/**
 * Evidence-backed AIIL / BSE scrip identity reconciliation.
 *
 * Source deposition is intentionally preserved; these guards exercise the corrected runtime
 * projection and fail-closed behavior. Evidence references are recorded in the linked follow-up
 * dossier under evidence/cross-repository/.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import {
  D05_BROAD_UNIVERSE_ENTITIES,
  getGovernedBroadSecurityMaster,
} from '../src/identity/index.js';
import { IdentityAmbiguityError } from '../src/identity/quarantine.js';

const CORPUS_PATH = join(process.cwd(), 'evidence/operator_drop/d05_security_master_broad_universe.json');
const MANIFEST_PATH = join(process.cwd(), 'evidence/operator_drop/d05_security_master_manifest.json');

function assertUnmapped(action: () => unknown, context: string): void {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof IdentityAmbiguityError, `${context}: expected fail-closed identity error`);
    assert.equal(error.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER', context);
    return true;
  });
}

describe('D05 AIIL identity reconciliation', () => {
  it('preserves the deposited source artifact while correcting only the runtime mapping', () => {
    const sourceBytes = readFileSync(CORPUS_PATH);
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as {
      fileChecksumSha256: string;
      recordCount: number;
      aiilRuling: string;
    };
    const sourceAiil = D05_BROAD_UNIVERSE_ENTITIES.find((entity) => entity.companyId === 'EQ_AIIL_IN');

    assert.ok(sourceAiil);
    assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), manifest.fileChecksumSha256);
    assert.equal(manifest.recordCount, 2250);
    assert.equal(manifest.aiilRuling, 'RULING_3_DUAL_EFFECTIVE_DATED_MAPPING');
    assert.equal(sourceAiil.bseScripCode, '543989', 'as-deposited source evidence is retained unchanged');
    assert.deepEqual(
      sourceAiil.listings.filter((listing) => listing.exchange === 'BSE').map((listing) => listing.scripCode),
      ['543989', '539177'],
      'as-deposited listing rows remain available for historical traceability'
    );
    assert.equal(sourceAiil.effectiveTo, undefined, 'no unsupported effectiveTo is added to the corpus');

    const master = getGovernedBroadSecurityMaster();
    const runtimeAiil = master.getEntity('EQ_AIIL_IN');
    assert.ok(runtimeAiil);
    assert.equal(runtimeAiil.bseScripCode, '539177');
    assert.deepEqual(
      runtimeAiil.listings.filter((listing) => listing.exchange === 'BSE').map((listing) => listing.scripCode),
      ['539177'],
      'the runtime projection excludes the confirmed wrong-issuer code only'
    );
    assert.equal(runtimeAiil.effectiveFrom, sourceAiil.effectiveFrom, 'no new effectiveFrom is introduced');
    assert.equal(runtimeAiil.effectiveTo, undefined, 'no listing end date is manufactured');
  });

  it('keeps Authum identity tied to ISIN INE206F01022 and BSE 539177, never BSE 543989', () => {
    const master = getGovernedBroadSecurityMaster();
    const authum = master.getEntity('EQ_AIIL_IN');

    assert.ok(authum);
    assert.equal(authum.companyName, 'Authum Investment & Infrastructure Limited');
    assert.equal(authum.isin, 'INE206F01022');
    assert.equal(master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE206F01022' }), 'EQ_AIIL_IN');
    assert.equal(master.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:539177' }), 'EQ_AIIL_IN');
    assert.equal(
      master.resolveCompanyId({
        identifierType: 'COMPOSITE_TICKER',
        identifierValue: 'BSE:539177',
        asOf: '2026-10-19T00:00:00.000Z',
      }),
      'EQ_AIIL_IN'
    );
    assertUnmapped(
      () => master.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:543989' }),
      'Sai Silks scrip 543989 must not resolve to Authum'
    );
    assertUnmapped(
      () => master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE438K01021' }),
      'Sai Silks ISIN must not resolve to Authum or an invented D05 entity'
    );
    assertUnmapped(
      () => master.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'KALAMANDIR' }),
      'Sai Silks symbol must remain unmapped because D05 is not expanded'
    );
  });
});
