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
  D05_AUTHENTICATED_UNIVERSE_ENTITIES,
  getGovernedBroadSecurityMaster,
  getGovernedLegacyWave1SecurityMaster,
} from '../src/identity/index.js';
import { IdentityAmbiguityError } from '../src/identity/quarantine.js';

const CORPUS_PATH = join(process.cwd(), 'evidence/operator_drop/d05_security_master_broad_universe.json');
const MANIFEST_PATH = join(process.cwd(), 'evidence/operator_drop/d05_security_master_manifest.json');
const AUTHENTICATED_CORPUS_PATH = join(process.cwd(), 'evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.json');
const AUTHENTICATED_MANIFEST_PATH = join(process.cwd(), 'evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json');

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

    /* Legacy Wave-1 runtime projection drill — the Wave-1 hydration remains pinned here so the
       wrong-issuer association can never silently reappear in the legacy path either. */
    const legacyMaster = getGovernedLegacyWave1SecurityMaster();
    const legacyRuntimeAiil = legacyMaster.getEntity('EQ_AIIL_IN');
    assert.ok(legacyRuntimeAiil);
    assert.equal(legacyRuntimeAiil.bseScripCode, '539177');
    assert.deepEqual(
      legacyRuntimeAiil.listings.filter((listing) => listing.exchange === 'BSE').map((listing) => listing.scripCode),
      ['539177'],
      'the legacy runtime projection excludes the confirmed wrong-issuer code only'
    );
    assert.equal(legacyRuntimeAiil.effectiveFrom, sourceAiil.effectiveFrom, 'no new effectiveFrom is introduced to the legacy projection');
    assert.equal(legacyRuntimeAiil.effectiveTo, undefined, 'no listing end date is manufactured');

    /* One-time replacement (2026-11-08): the authenticated activation is the runtime, is recorded
       natively, and is verified byte-identically against its own deposition. */
    const authManifest = JSON.parse(readFileSync(AUTHENTICATED_MANIFEST_PATH, 'utf8')) as { fileChecksumSha256: string; recordCount: number };
    const authSourceBytes = readFileSync(AUTHENTICATED_CORPUS_PATH);
    assert.equal(createHash('sha256').update(authSourceBytes).digest('hex'), authManifest.fileChecksumSha256);
    assert.equal(authManifest.recordCount, 2390);
    const authAiil = D05_AUTHENTICATED_UNIVERSE_ENTITIES.find((entity) => entity.companyId === 'EQ_AIIL_IN');
    assert.ok(authAiil);
    assert.equal(authAiil.bseScripCode, '539177', 'authenticated deposit records Authum natively under 539177');
    assert.deepEqual(
      authAiil.listings.filter((listing) => listing.exchange === 'BSE').map((listing) => listing.scripCode),
      ['539177'],
    );
    assert.equal(JSON.stringify(authAiil).includes('543989'), false, 'the false association is absent from the authenticated deposit');
    assert.equal(authAiil.effectiveTo, undefined);
    const currentMaster = getGovernedBroadSecurityMaster();
    const runtimeAuthAiil = currentMaster.getEntity('EQ_AIIL_IN');
    assert.ok(runtimeAuthAiil);
    assert.equal(runtimeAuthAiil.bseScripCode, '539177');
    assert.equal(runtimeAuthAiil.effectiveFrom, '2024-04-23T00:00:00.000Z');
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
    /* Sai Silks scrip 543989 is a genuine BSE listing and is carried natively — it must (a)
       resolve to Kalamandir's own entity, never Authum, and (b) never resolve to EQ_AIIL_IN. */
    assert.equal(
      master.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:543989' }),
      'EQ_KALAMANDIR_IN'
    );
    assert.notEqual(
      master.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:543989' }),
      'EQ_AIIL_IN'
    );
    /* Sai Silks (Kalamandir) IS a genuine NSE CM EQ listing and is carried natively by the
       authenticated universe — it resolves to ITS OWN entity, never Authum. */
    assert.equal(
      master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE438K01021' }),
      'EQ_KALAMANDIR_IN'
    );
    assert.equal(
      master.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'KALAMANDIR' }),
      'EQ_KALAMANDIR_IN'
    );
    assert.equal(
      master.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'KALAMANDIR' }) !== 'EQ_AIIL_IN',
      true,
      'Sai Silks never resolves to Authum'
    );
  });
});
