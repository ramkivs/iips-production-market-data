/**
 * W04 — the committed P7 qualification manifest is bound to the P04 master of today.
 *
 * Two checks against `evidence/dhan-p7/qualification-manifest.json` as tracked:
 *
 *  1. the manifest's `p04SourceRevision` equals the `sourceRevision` of the compiled
 *     `getGovernedBroadSecurityMaster()` in its three members (batchId,
 *     fileChecksumSha256, recordCount), so a registry generated against another
 *     revision cannot pass as current;
 *  2. every ACTIVE listing pair of that master qualifies at runtime through
 *     `loadGovernedP7InstrumentRegistry()` and `qualifyHoldingSecurityIdentity`,
 *     and the loaded registry's size equals the number of those pairs.
 *
 * Read-only: nothing is written and no provider is contacted. Both checks fail on
 * a manifest generated against an earlier master, and check 2 fails when a single
 * mapping is removed from the manifest.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getGovernedBroadSecurityMaster } from '../src/identity/index.js';
import {
  loadGovernedP7InstrumentRegistry,
  qualifyHoldingSecurityIdentity,
} from '../src/providers/dhan/index.js';

const MANIFEST_PATH = join(process.cwd(), 'evidence/dhan-p7/qualification-manifest.json');

interface ManifestRevision {
  p04SourceRevision?: {
    batchId?: unknown;
    fileChecksumSha256?: unknown;
    recordCount?: unknown;
  };
}

describe('W04 P7 registry regeneration — committed manifest vs the master of today', () => {
  it('P7-REG-01 the manifest states the P04 source revision of the compiled master, in all three members', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as ManifestRevision;
    const revision = getGovernedBroadSecurityMaster().sourceRevision;

    assert.ok(revision, 'the governed P04 master carries a source revision');
    assert.ok(
      manifest.p04SourceRevision,
      'the committed manifest records p04SourceRevision (a manifest generated before the revision was recorded cannot pass)'
    );
    assert.equal(manifest.p04SourceRevision.batchId, revision.batchId, 'batchId');
    assert.equal(
      manifest.p04SourceRevision.fileChecksumSha256,
      revision.fileChecksumSha256,
      'fileChecksumSha256'
    );
    assert.equal(manifest.p04SourceRevision.recordCount, revision.recordCount, 'recordCount');
  });

  it('P7-REG-02 every ACTIVE listing pair qualifies through the loaded registry, and the registry covers them all', () => {
    const master = getGovernedBroadSecurityMaster();
    const registry = loadGovernedP7InstrumentRegistry();

    let pairs = 0;
    const unresolved: string[] = [];
    for (const companyId of master.listAllCompanyIds()) {
      const entity = master.getEntity(companyId);
      assert.ok(entity, `master lists companyId ${companyId} but getEntity cannot return it`);
      for (const listing of entity.listings) {
        if (listing.status !== 'ACTIVE') continue;
        pairs += 1;
        const result = qualifyHoldingSecurityIdentity(
          { isin: entity.isin, exchange: listing.exchange, symbol: listing.symbol },
          master,
          registry
        );
        if (result.status !== 'QUALIFIED') {
          unresolved.push(`${companyId}/${listing.exchange}: ${result.reason}`);
        }
      }
    }

    assert.deepEqual(unresolved, [], 'every ACTIVE listing pair of the master qualifies at runtime');
    assert.equal(
      registry.list().length,
      pairs,
      'the loaded registry size equals the number of ACTIVE listing pairs (a missing mapping fails here)'
    );
  });
});
