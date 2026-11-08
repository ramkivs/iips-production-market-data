/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: D05 Security Master — Wave-2 disposition (PA-authorized, bounded)
 *
 * Governing authorization: AUTH-D05-WAVE2-BROAD-UNIVERSE-EXPANSION-2026-11-06-01
 *   Scope: the exact 67 NSE ISINs recorded in the B-04 assessment
 *   (IRR publication: ramkivs/iips-review-recovered PR #496, merge 0a0aac2bba517be933dae7a91a89af2943996b51,
 *    path evidence/integration/b04-dhan-isin-nse-2026-11-06/).
 *
 * This suite binds, WITHOUT CHANGING, the Wave-1 governed corpus
 * (BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001; SHA-256 7f53540b...74b5; 2,250 records)
 * to the Wave-2 disposition revision
 * (BATCH-D05-TIER2-BROAD-UNIVERSE-WAVE2-DISPOSITION-2026-11-06-001), which deposited
 * NOTHING: disposition-only, corpus byte-identical, all 67 ISINs retained as UNRESOLVED.
 *
 * ISIN check-digit validity is asserted as a syntax property of the source rows only;
 * it is NOT a substitute for an authoritative record and NOT an origin discriminator.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import {
  getGovernedBroadSecurityMaster,
  getGovernedLegacyWave1SecurityMaster,
  getGovernedAuthenticatedSecurityMaster,
  IdentityAmbiguityError,
  D05_BROAD_UNIVERSE_ENTITIES,
  D05_AUTHENTICATED_UNIVERSE_ENTITIES,
} from '../src/identity/index.js';

const ROOT = process.cwd();
const WAVE2_DIR = path.join(ROOT, 'evidence/operator_drop/wave2-2026-11-06');
const CORPUS_PATH = path.join(ROOT, 'evidence/operator_drop/d05_security_master_broad_universe.json');
const PRIOR_MANIFEST_PATH = path.join(ROOT, 'evidence/operator_drop/d05_security_master_manifest.json');
const WAVE2_MANIFEST_PATH = path.join(ROOT, 'evidence/operator_drop/d05_security_master_wave2_disposition_manifest.json');
const SOURCE_CSV_PATH = path.join(WAVE2_DIR, 'source.csv');
const ASSESSMENT_COPY_PATH = path.join(WAVE2_DIR, 'assessment.json');
const DISPOSITION_JSON_PATH = path.join(WAVE2_DIR, 'disposition-2026-11-06.json');
const DISPOSITION_MD_PATH = path.join(WAVE2_DIR, 'disposition-2026-11-06.md');

const PRIOR_CHECKSUM = '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5';
const SOURCE_SHA256 = '2dc1d1fba6e183cfa657652d0dab98daac570df6e3ef3adbbc8f2a397fcabd0d';
const ASSESSMENT_SHA256 = '3211fbc607b29632e77ffbb9ef88eb9c9e594ea392a48cac813ad74f155d23e4';
const PRIOR_BATCH = 'BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001';
const WAVE2_BATCH = 'BATCH-D05-TIER2-BROAD-UNIVERSE-WAVE2-DISPOSITION-2026-11-06-001';
const WAVE2_ACT = 'AUTH-D05-WAVE2-BROAD-UNIVERSE-EXPANSION-2026-11-06-01';

const sha256 = (p: string): string => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function isinCheckDigitValid(isin: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
  const digits = isin.replace(/./g, (c) => {
    const n = c.charCodeAt(0);
    return n >= 65 && n <= 90 ? String(n - 65 + 10) : c;
  });
  let total = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0;
}

interface DispositionRow {
  row: number;
  scripName: string;
  isin: string;
  exchange: string;
  presentInGovernedCorpus: boolean;
  b04NewQuarantineId: string;
  b04ResolutionStatus: string;
  disposition: string;
  incorporated: boolean;
  missingAuthoritativeEvidence: string[];
}

describe('Wave-2 D05 disposition — bounded, fail-closed, zero deposition', () => {
  const disposition = JSON.parse(fs.readFileSync(DISPOSITION_JSON_PATH, 'utf8'));
  const priorManifest = JSON.parse(fs.readFileSync(PRIOR_MANIFEST_PATH, 'utf8'));
  const wave2Manifest = JSON.parse(fs.readFileSync(WAVE2_MANIFEST_PATH, 'utf8'));
  const assessmentCopy = JSON.parse(fs.readFileSync(ASSESSMENT_COPY_PATH, 'utf8'));

  it('W2-D-01: the Wave-1 governed corpus is byte-identical to its deposited checksum (no mutation, no "wave-2 edit")', () => {
    assert.strictEqual(sha256(CORPUS_PATH), PRIOR_CHECKSUM);
    assert.strictEqual(wave2Manifest.fileChecksumSha256, PRIOR_CHECKSUM);
    assert.strictEqual(wave2Manifest.corpusByteIdentical, true);
    assert.strictEqual(wave2Manifest.priorRevisionBatchId, PRIOR_BATCH);
  });

  it('W2-D-02: runtime master is the authenticated universe (one-time replacement); Wave-1 legacy hydration retained under explicit name', () => {
    const legacy = getGovernedLegacyWave1SecurityMaster();
    assert.ok(legacy.sourceRevision, 'legacy hydration must carry a source revision');
    assert.strictEqual(legacy.sourceRevision!.batchId, PRIOR_BATCH);
    assert.strictEqual(legacy.sourceRevision!.fileChecksumSha256, PRIOR_CHECKSUM);
    assert.strictEqual(legacy.sourceRevision!.recordCount, 2250);
    const current = getGovernedBroadSecurityMaster();
    assert.strictEqual(current.sourceRevision!.batchId, 'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001');
    assert.strictEqual(current.sourceRevision!.recordCount, 2390);
    assert.strictEqual(current.sourceRevision!.authorizationRef, 'AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001');
    assert.strictEqual(D05_AUTHENTICATED_UNIVERSE_ENTITIES.length, 2390);
  });

  it('W2-D-03: prior manifest is intact and Wave-1 act reference unchanged', () => {
    assert.strictEqual(priorManifest.batchId, PRIOR_BATCH);
    assert.strictEqual(priorManifest.fileChecksumSha256, PRIOR_CHECKSUM);
    assert.strictEqual(priorManifest.recordCount, 2250);
    assert.strictEqual(priorManifest.authorizationRef, 'AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001');
  });

  it('W2-D-04: B-04 source copies remain the exact bytes assessed (sha256 pins)', () => {
    assert.strictEqual(sha256(SOURCE_CSV_PATH), SOURCE_SHA256);
    assert.strictEqual(sha256(ASSESSMENT_COPY_PATH), ASSESSMENT_SHA256);
    assert.strictEqual(assessmentCopy.sourceSha256, SOURCE_SHA256);
    assert.strictEqual(assessmentCopy.masterRevision.batchId, PRIOR_BATCH);
  });

  it('W2-D-05: disposition covers exactly the 67 UNRESOLVED rows of B-04, with quarantine evidence carried verbatim', () => {
    const aUnres = (assessmentCopy.rows as Array<Record<string, any>>).filter((r) => r.resolutionStatus === 'UNRESOLVED');
    assert.strictEqual(aUnres.length, 67);
    const aByIsin = new Map(aUnres.map((r) => [r.source['ISIN Code'], r]));
    const dRows = disposition.rows as DispositionRow[];
    assert.strictEqual(dRows.length, 67);
    assert.strictEqual(new Set(dRows.map((r) => r.isin)).size, 67, 'distinct ISINs');
    for (const row of dRows) {
      assert.strictEqual(row.exchange, 'NSE');
      assert.ok(isinCheckDigitValid(row.isin), `ISIN syntax must hold for ${row.isin}`);
      assert.strictEqual(row.presentInGovernedCorpus, false);
      assert.strictEqual(row.disposition, 'UNRESOLVED');
      assert.strictEqual(row.incorporated, false);
      assert.ok(Array.isArray(row.missingAuthoritativeEvidence) && row.missingAuthoritativeEvidence.length > 0);
      const a = aByIsin.get(row.isin);
      assert.ok(a, `ISIN ${row.isin} must exist in B-04 UNRESOLVED rows`);
      assert.strictEqual(row.b04NewQuarantineId, a.newQuarantineId, `quarantine id carried verbatim for ${row.isin}`);
      assert.strictEqual(row.b04ResolutionStatus, 'UNRESOLVED');
    }
    assert.deepStrictEqual(
      disposition.summary.excludedScopeResolvedRows,
      ['INE415A01038'],
      'the single RESOLVED row (AGI Greenpac) stays out of the 67-row scope',
    );
  });

  it('W2-D-06: disposition summary is honest — zero incorporated, 67 unresolved', () => {
    assert.deepStrictEqual(disposition.summary, {
      total: 67,
      ADDED: 0,
      ALREADY_PRESENT: 0,
      INELIGIBLE: 0,
      UNRESOLVED: 67,
      excludedScopeResolvedRows: ['INE415A01038'],
    });
  });

  it('W2-D-07: Wave-2 manifest is disposition-only, binds the same corpus checksum, and claims nothing extra', () => {
    assert.strictEqual(wave2Manifest.batchId, WAVE2_BATCH);
    assert.strictEqual(wave2Manifest.kind, 'DISPOSITION_ONLY__NO_DEPOSITION__CORPUS_BYTE_IDENTICAL');
    assert.strictEqual(wave2Manifest.authorizationRef, WAVE2_ACT);
    assert.strictEqual(wave2Manifest.recordCount, 2250);
    assert.strictEqual(wave2Manifest.incorporated, 0);
    assert.strictEqual(wave2Manifest.unresolved, 67);
    assert.strictEqual(wave2Manifest.corpusPath, 'evidence/operator_drop/d05_security_master_broad_universe.json');
    assert.strictEqual(wave2Manifest.source.sourceSha256, SOURCE_SHA256);
    assert.strictEqual(wave2Manifest.source.assessmentSha256, ASSESSMENT_SHA256);
    assert.strictEqual(sha256(DISPOSITION_JSON_PATH), wave2Manifest.dispositionReportSha256);
    assert.strictEqual(sha256(DISPOSITION_MD_PATH), wave2Manifest.dispositionTableSha256);
    const boundaries = wave2Manifest.claimBoundaries as string[];
    assert.ok(boundaries.some((b) => b.startsWith('DEPOSITION_DID_NOT_OCCUR')));
    assert.ok(boundaries.some((b) => b.startsWith('CORPUS_BYTE_IDENTICAL')));
    assert.ok(boundaries.some((b) => b.startsWith('NO_SYMBOL_ASSERTION')));
    assert.ok(boundaries.some((b) => b.startsWith('NO_OPERATIONAL_WRITE')));
    assert.ok(wave2Manifest.authorizationRef !== priorManifest.authorizationRef, 'Wave-2 revision must cite its own act, not Wave-1');
  });

  it('W2-D-08: governed resolution refuses exactly the still-unsupported ISINs; the other 64 are authenticated-universe listings (never Wave-2-incorporated)', () => {
    const authenticated = getGovernedAuthenticatedSecurityMaster();
    const stillUnsupported = ['INE562X01013', 'INE583V01021', 'INE721I01024'];
    for (const row of disposition.rows as DispositionRow[]) {
      if (stillUnsupported.includes(row.isin)) {
        assert.strictEqual(authenticated.getEntity(row.isin), undefined, `${row.isin} must remain unsupported`);
        assert.throws(
          () => authenticated.resolveCompanyId({ identifierType: 'ISIN', identifierValue: row.isin }),
          (err: unknown) => {
            assert.ok(err instanceof IdentityAmbiguityError, 'must fail closed with the identity quarantine error');
            assert.strictEqual((err as IdentityAmbiguityError).quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
            assert.strictEqual((err as IdentityAmbiguityError).quarantineRecord.rawIdentifier, row.isin);
            return true;
          },
        );
      } else {
        const resolved = authenticated.resolveCompanyId({ identifierType: 'ISIN', identifierValue: row.isin });
        assert.ok(typeof resolved === 'string' && resolved.startsWith('EQ_'), `${row.isin} resolves through the authenticated universe (reconstruction, not incorporation)`);
      }
    }
  });

  it('W2-D-09: disposition file cites the exact authorized scope and boundaries; no claim of completion of the 67', () => {
    assert.strictEqual(disposition.authorizationRef, WAVE2_ACT);
    assert.strictEqual(disposition.scope.isinsAuthorized, 67);
    assert.match(disposition.decision, /Zero records are incorporated/);
    assert.match(disposition.decision, /All 67 remain UNRESOLVED/);
    const boundaries = disposition.claimBoundaries as string[];
    assert.ok(boundaries.some((b) => b.includes('No NSE or BSE symbol')));
    assert.ok(boundaries.some((b) => b.includes('operational database')));
    assert.ok(boundaries.some((b) => b.includes('byte-identical')));
  });
});
