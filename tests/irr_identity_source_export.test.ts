/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: W04 — export of the governed P04 security master into IRR identity sources (IIX-*)
 *
 * Covers generation, validation, missing data, conflicting mappings and incomplete coverage of
 * `src/identity/irr_identity_source_export.ts`.
 *
 * TEST INPUTS. The primary input is the tracked P04 master itself. To exercise missing and
 * conflicting data, which the tracked master does not contain, a test takes real master records
 * and alters one field in memory. Those altered records exist only inside the test: they are never
 * written to a file and are not provisioning data.
 *
 * A passing run shows that the exporter behaves as specified. It is not evidence that IRR accepts
 * the files: that is established by running IRR's own loader on them
 * (`scripts/provision-irr-identity-sources.mjs validate`).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  D05_AUTHENTICATED_UNIVERSE_ENTITIES,
  D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION,
  type GovernedSourceRevision,
  type SecurityMasterEntity,
} from '../src/identity/index.js';
import {
  EXPORT_LIMITATIONS,
  IRR_IDENTITY_EXPORT_MAPPING_VERSION,
  IRR_IDENTITY_FILE_NAMES,
  IRR_IDENTITY_SCHEMA,
  ISSUER_KEY_SUPPLEMENT_SCHEMA,
  SERIES_EQ_UNIVERSE_BATCHES,
  buildIrrIdentitySources,
  checkIrrIdentityFiles,
  computeSecurityMasterChecksum,
  isStructurallyValidCin,
  isValidIsin,
  serialiseExportReport,
  type IrrIdentityExportResult,
  type P7CorroborationInput,
} from '../src/identity/irr_identity_source_export.js';

const ROOT = process.cwd();
const MASTER = D05_AUTHENTICATED_UNIVERSE_ENTITIES;
const REVISION = D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION;
const P7_BYTES = readFileSync(join(ROOT, 'evidence/dhan-p7/qualification-manifest.json'));
const P7_JSON = JSON.parse(P7_BYTES.toString('utf8')) as { generatedAtUtc: string; records: P7CorroborationInput['records'] };
const P7: P7CorroborationInput = {
  sha256: createHash('sha256').update(P7_BYTES).digest('hex'),
  generatedAtUtc: P7_JSON.generatedAtUtc,
  records: P7_JSON.records,
};

/** Records of the tracked master withheld by mapping 1: one issuer with two equity ISINs. */
const WITHHELD_IN_TRACKED_MASTER = 2;

/** Pins of the export of the tracked master. A change here is a change of mapping. */
const PINNED = Object.freeze({
  roster: '078e89cc1896d0f59e09e2ad05a12378e248cd81b97775ee7667b5f1e750e937',
  listingMap: '6a330123a2fea31e9e1dd54f01e5adbe13f9721f077a5a82a34ee7cd60bcf458',
  corporateActions: 'd6bc14d1b676260bb0f1c2280e62956d3f6a7e07b9b9265a73b49f821185ffcd',
});

function revisionFor(entities: ReadonlyArray<SecurityMasterEntity>): GovernedSourceRevision {
  return { ...REVISION, recordCount: entities.length, fileChecksumSha256: computeSecurityMasterChecksum(entities) };
}

function clone(entity: SecurityMasterEntity): SecurityMasterEntity {
  return JSON.parse(JSON.stringify(entity)) as SecurityMasterEntity;
}

/** The first five tracked master records, none of which is withheld. */
function fiveRecords(): SecurityMasterEntity[] {
  return MASTER.slice(0, 5).map(clone);
}

function exportOf(entities: ReadonlyArray<SecurityMasterEntity>, extra: Partial<Parameters<typeof buildIrrIdentitySources>[0]> = {}): IrrIdentityExportResult {
  return buildIrrIdentitySources({ masterEntities: entities, masterRevision: revisionFor(entities), ...extra });
}

function sha(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function parsed(result: IrrIdentityExportResult) {
  assert.ok(result.artifacts !== null, 'the export produced files');
  const files = result.artifacts.files;
  return {
    roster: JSON.parse(files[IRR_IDENTITY_FILE_NAMES.roster]) as {
      schemaVersion: string;
      rosterLabel: string;
      issuers: Array<Record<string, unknown>>;
      securities: Array<Record<string, unknown>>;
    },
    listingMap: JSON.parse(files[IRR_IDENTITY_FILE_NAMES.listingMap]) as { schemaVersion: string; entries: Array<Record<string, unknown>> },
    corporateActions: JSON.parse(files[IRR_IDENTITY_FILE_NAMES.corporateActions]) as { schemaVersion: string; actions: unknown[] },
  };
}

function withheldReasons(result: IrrIdentityExportResult, isin: string): ReadonlyArray<string> {
  return result.report.withheld.filter((record) => record.isin === isin).flatMap((record) => record.reasons);
}

describe('W04 IRR identity export — generation from the tracked P04 master', () => {
  const result = buildIrrIdentitySources({
    masterEntities: MASTER,
    masterRevision: REVISION,
    p7: P7,
    acceptedWithheld: WITHHELD_IN_TRACKED_MASTER,
  });

  it('IIX-01 exports the tracked master and reconciles every record', () => {
    const { report } = result;
    assert.equal(report.result, 'PASS');
    assert.equal(report.identityFilesProduced, true);
    assert.deepEqual(report.refusals, []);
    assert.deepEqual(report.incomplete, []);
    assert.equal(report.mappingVersion, IRR_IDENTITY_EXPORT_MAPPING_VERSION);
    assert.equal(report.inputs.p04SecurityMaster.checksumVerified, true);
    assert.equal(report.inputs.p04SecurityMaster.observedChecksumSha256, REVISION.fileChecksumSha256);
    assert.equal(report.coverage.master.records, 2390);
    assert.equal(report.coverage.master.exported, 2388);
    assert.equal(report.coverage.master.withheld, 2);
    assert.equal(report.coverage.master.exported + report.coverage.master.withheld, report.coverage.master.records);
    assert.deepEqual(report.coverage.master.withheldByReason, { ISSUER_SHARED_ACROSS_ISINS: 2 });
    assert.deepEqual(report.coverage.issuers, { exported: 2388, keyedByCin: 0, keyedByEquityIsin: 2388 });
    assert.deepEqual(report.coverage.listings, { nse: { inMaster: 2390, exported: 2388 }, bse: { inMaster: 2290, exported: 0 } });
    assert.deepEqual(report.coverage.corporateActions, { exported: 0 });
  });

  it('IIX-02 writes one issuer, one security and one NSE EQ listing per exported record, in the IRR schema', () => {
    const { roster, listingMap, corporateActions } = parsed(result);
    assert.equal(roster.schemaVersion, IRR_IDENTITY_SCHEMA);
    assert.equal(listingMap.schemaVersion, IRR_IDENTITY_SCHEMA);
    assert.equal(corporateActions.schemaVersion, IRR_IDENTITY_SCHEMA);
    assert.equal(roster.issuers.length, 2388);
    assert.equal(roster.securities.length, 2388);
    assert.equal(listingMap.entries.length, 2388);
    assert.deepEqual(corporateActions.actions, []);

    const master = new Map(MASTER.map((entity) => [entity.isin, entity]));
    for (const entry of listingMap.entries) {
      const isin = String(entry.securityId).slice('IN:ISIN:'.length);
      const entity = master.get(isin);
      assert.ok(entity !== undefined, 'every listing names a master ISIN');
      assert.equal(entry.listingId, `IN:NSE:${entity.nseSymbol}:EQ:EQUITY`);
      assert.equal(entry.symbol, entity.nseSymbol);
      assert.equal(entry.issuerId, `IN:EQISIN:${isin}`);
      assert.equal(entry.effectiveFrom, entity.effectiveFrom.slice(0, 10));
      assert.equal(entry.effectiveTo, null);
    }
    for (const issuer of roster.issuers) {
      const entity = master.get(String(issuer.equityIsin));
      assert.ok(entity !== undefined);
      assert.equal(issuer.issuerId, `IN:EQISIN:${entity.isin}`);
      assert.equal(issuer.legalName, entity.companyName);
      assert.equal(issuer.issuerKeyBasis, 'EQUITY_ISIN');
      assert.equal(issuer.status, 'ELIGIBLE');
      assert.equal(issuer.foreignIssuer, false);
    }
  });

  it('IIX-03 does not export the P04 fields it does not treat as authoritative', () => {
    const { roster, listingMap } = parsed(result);
    assert.ok(roster.issuers.every((issuer) => issuer.cin === null), 'no P04 CIN is exported');
    assert.ok(roster.issuers.every((issuer) => issuer.sector === 'UNCLASSIFIED' && issuer.subSegment === null));
    assert.ok(listingMap.entries.every((entry) => entry.exchange === 'NSE' && entry.series === 'EQ'), 'no BSE listing is exported');
    const text = Object.values(result.artifacts!.files).join('\n');
    const masterCins = MASTER.map((entity) => entity.cin).filter((cin): cin is string => typeof cin === 'string' && isStructurallyValidCin(cin));
    assert.ok(masterCins.length > 2000);
    assert.ok(!masterCins.some((cin) => text.includes(cin)), 'no P04 CIN value occurs anywhere in the files');
    assert.deepEqual(result.report.coverage.masterFieldsNotExported, {
      cinPresent: 2332,
      cinStructurallyValid: 2298,
      cinDistinct: 2332,
      sectorPresent: 2390,
    });
    assert.deepEqual(
      result.report.limitations.map((limitation) => limitation.code),
      [
        'CIN_NOT_EXPORTED',
        'SECTOR_UNCLASSIFIED',
        'BSE_LISTINGS_NOT_EXPORTED',
        'CORPORATE_ACTIONS_EMPTY',
        'NO_SYMBOL_HISTORY',
        'ELIGIBLE_MEANS_ACTIVE_NSE_LISTING',
        'SERIES_FROM_UNIVERSE_DEFINITION',
        'SOURCE_AUTHORITY_CONDITIONAL',
      ],
    );
    assert.equal(result.report.inputs.p04SecurityMaster.operatingMode, 'OFFLINE_BOOTSTRAP');
    assert.equal(result.report.inputs.p04SecurityMaster.authorizationRef, REVISION.authorizationRef);
    assert.equal(result.report.limitations, EXPORT_LIMITATIONS);
    assert.deepEqual(result.report.inputs.corporateActions, { supplied: false, reason: 'NO_APPROVED_SOURCE' });
  });

  it('IIX-04 is deterministic: byte-identical on repetition and pinned', () => {
    const again = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION, p7: P7, acceptedWithheld: WITHHELD_IN_TRACKED_MASTER });
    assert.deepEqual(again.artifacts!.files, result.artifacts!.files);
    assert.equal(serialiseExportReport(again.report), serialiseExportReport(result.report));
    const files = result.artifacts!.files;
    assert.equal(sha(files[IRR_IDENTITY_FILE_NAMES.roster]), PINNED.roster);
    assert.equal(sha(files[IRR_IDENTITY_FILE_NAMES.listingMap]), PINNED.listingMap);
    assert.equal(sha(files[IRR_IDENTITY_FILE_NAMES.corporateActions]), PINNED.corporateActions);
    assert.equal(result.report.outputs!.files[IRR_IDENTITY_FILE_NAMES.roster].sha256, PINNED.roster);
    for (const text of Object.values(files)) {
      assert.ok(text.endsWith('\n') && !text.includes('\r'), 'LF line endings and a final newline');
    }
    assert.ok(!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(serialiseExportReport(result.report).replace(P7.generatedAtUtc ?? '', '')), 'the report carries no clock value of its own');
  });

  it('IIX-05 does not depend on the order of the master records', () => {
    const reversed = [...MASTER].reverse();
    const other = exportOf(reversed, { acceptedWithheld: WITHHELD_IN_TRACKED_MASTER });
    assert.equal(other.report.result, 'PASS');
    // The roster label names the checksum of the record array, which depends on its order. The
    // listing map carries no such value and must be identical.
    assert.equal(other.artifacts!.files[IRR_IDENTITY_FILE_NAMES.listingMap], result.artifacts!.files[IRR_IDENTITY_FILE_NAMES.listingMap]);
    assert.deepEqual(parsed(other).roster.issuers, parsed(result).roster.issuers);
    assert.deepEqual(parsed(other).roster.securities, parsed(result).roster.securities);
  });

  it('IIX-06 passes its own check of the produced files, and labels the roster as an operator export', () => {
    assert.deepEqual(checkIrrIdentityFiles(result.artifacts!.files), []);
    const { roster } = parsed(result);
    assert.ok(roster.rosterLabel.includes(REVISION.batchId));
    assert.ok(roster.rosterLabel.includes(REVISION.fileChecksumSha256));
    assert.ok(roster.rosterLabel.includes(IRR_IDENTITY_EXPORT_MAPPING_VERSION));
    assert.ok(!/synthetic/i.test(roster.rosterLabel), 'IRR classes a roster labelled synthetic as a fixture');
  });

  it('IIX-07 uses P7 as corroboration only: the files are the same with and without it', () => {
    assert.deepEqual(result.report.p7Corroboration, {
      qualifiedRecords: 96,
      distinctIsins: 48,
      isinsInMaster: 48,
      isinsNotInMaster: 0,
      nseSeriesEq: 48,
      nseSeriesOther: 0,
      bseScripCodeAgrees: 48,
      bseScripCodeDiffers: 0,
      companyIdDiffers: 3,
    });
    const without = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION, acceptedWithheld: WITHHELD_IN_TRACKED_MASTER });
    assert.deepEqual(without.report.inputs.p7QualificationManifest, { supplied: false });
    assert.equal(without.report.p7Corroboration, null);
    assert.deepEqual(without.artifacts!.files, result.artifacts!.files);
  });
});

describe('W04 IRR identity export — incomplete coverage fails closed', () => {
  it('IIX-10 produces no file while withheld records are not acknowledged', () => {
    const unacknowledged = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION });
    assert.equal(unacknowledged.report.result, 'INCOMPLETE');
    assert.equal(unacknowledged.artifacts, null);
    assert.equal(unacknowledged.report.outputs, null);
    assert.equal(unacknowledged.report.identityFilesProduced, false);
    assert.deepEqual(unacknowledged.report.incomplete.map((item) => item.code), ['WITHHELD_NOT_ACKNOWLEDGED']);
    assert.equal(unacknowledged.report.coverage.master.exported, 0);
    assert.equal(unacknowledged.report.coverage.master.withheld, 2);
    assert.equal(unacknowledged.report.withheld.length, 2);
    assert.ok(unacknowledged.report.withheld.every((record) => record.reasons.join() === 'ISSUER_SHARED_ACROSS_ISINS'));
  });

  it('IIX-11 requires the acknowledged number to be exact, not a ceiling', () => {
    for (const accepted of [1, 3, 100]) {
      const result = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION, acceptedWithheld: accepted });
      assert.equal(result.report.result, 'INCOMPLETE', `accepted ${accepted}`);
      assert.equal(result.artifacts, null);
    }
    for (const accepted of [-1, 1.5, Number.NaN]) {
      const result = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION, acceptedWithheld: accepted });
      assert.equal(result.report.result, 'REFUSED', `accepted ${accepted}`);
      assert.ok(result.report.refusals.some((refusal) => refusal.code === 'ACKNOWLEDGEMENT_INVALID'));
      assert.equal(result.artifacts, null);
    }
  });

  it('IIX-12 reports required ISINs that the roster does not cover, by count only', () => {
    const covered = MASTER[0]!.isin;
    const withheld = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION }).report.withheld[0]!.isin;
    const outside = 'US0378331005';
    assert.ok(isValidIsin(outside) && !MASTER.some((entity) => entity.isin === outside));

    const all = buildIrrIdentitySources({
      masterEntities: MASTER,
      masterRevision: REVISION,
      acceptedWithheld: WITHHELD_IN_TRACKED_MASTER,
      requiredIsins: [covered, covered],
    });
    assert.equal(all.report.result, 'PASS');
    assert.deepEqual(all.report.coverage.requiredIsins, { requested: 1, covered: 1, uncovered: 0 });

    const gap = buildIrrIdentitySources({
      masterEntities: MASTER,
      masterRevision: REVISION,
      acceptedWithheld: WITHHELD_IN_TRACKED_MASTER,
      requiredIsins: [covered, withheld, outside],
    });
    assert.equal(gap.report.result, 'INCOMPLETE');
    assert.equal(gap.artifacts, null);
    assert.deepEqual(gap.report.incomplete.map((item) => item.code), ['REQUIRED_ISINS_NOT_COVERED']);
    assert.deepEqual(gap.report.coverage.requiredIsins, { requested: 3, covered: 1, uncovered: 2 });
    assert.deepEqual([...gap.uncoveredRequiredIsins].sort(), [withheld, outside].sort());
    // A required ISIN is host data. The report must not carry it, covered or not.
    const reportText = serialiseExportReport(gap.report);
    assert.ok(!reportText.includes(outside) && !reportText.includes(covered));

    const acknowledged = buildIrrIdentitySources({
      masterEntities: MASTER,
      masterRevision: REVISION,
      acceptedWithheld: WITHHELD_IN_TRACKED_MASTER,
      requiredIsins: [covered, withheld, outside],
      acceptedUncovered: 2,
    });
    assert.equal(acknowledged.report.result, 'PASS');
    assert.deepEqual(acknowledged.report.acknowledgements, { acceptedWithheld: 2, acceptedUncovered: 2 });
    assert.ok(!Object.values(acknowledged.artifacts!.files).join('').includes(outside), 'an uncovered ISIN is never added to the roster');

    const malformed = buildIrrIdentitySources({
      masterEntities: MASTER,
      masterRevision: REVISION,
      acceptedWithheld: WITHHELD_IN_TRACKED_MASTER,
      requiredIsins: [covered, 'INE009A01020'],
    });
    assert.equal(malformed.report.result, 'REFUSED');
    assert.ok(malformed.report.refusals.some((refusal) => refusal.code === 'REQUIRED_ISIN_INVALID'));
  });
});

describe('W04 IRR identity export — input integrity', () => {
  it('IIX-20 refuses a master that does not match its declared revision', () => {
    const short = MASTER.slice(1);
    const dropped = buildIrrIdentitySources({ masterEntities: short, masterRevision: REVISION, acceptedWithheld: 2 });
    assert.equal(dropped.report.result, 'REFUSED');
    assert.deepEqual(dropped.report.refusals.map((refusal) => refusal.code).sort(), ['MASTER_CHECKSUM_MISMATCH', 'MASTER_RECORD_COUNT_MISMATCH']);
    assert.equal(dropped.artifacts, null);

    const altered = MASTER.map((entity, index) => (index === 7 ? { ...entity, nseSymbol: `${entity.nseSymbol}X` } : entity));
    const changed = buildIrrIdentitySources({ masterEntities: altered, masterRevision: REVISION, acceptedWithheld: 2 });
    assert.equal(changed.report.result, 'REFUSED');
    assert.ok(changed.report.refusals.some((refusal) => refusal.code === 'MASTER_CHECKSUM_MISMATCH'));
    assert.equal(changed.report.inputs.p04SecurityMaster.checksumVerified, false);
    assert.equal(changed.artifacts, null);

    const empty = buildIrrIdentitySources({ masterEntities: [], masterRevision: revisionFor([]) });
    assert.equal(empty.report.result, 'REFUSED');
    assert.ok(empty.report.refusals.some((refusal) => refusal.code === 'MASTER_EMPTY'));
  });

  it('IIX-22 refuses a batch whose universe is not established as NSE series EQ', () => {
    // P04 records carry no series. The series comes from the manifest of the deposited batch.
    const manifest = JSON.parse(
      readFileSync(join(ROOT, SERIES_EQ_UNIVERSE_BATCHES[REVISION.batchId]!.manifest), 'utf8'),
    ) as { batchId: string; selectedTier: string; fileChecksumSha256: string; recordCount: number; universeSource: { source: string } };
    assert.equal(manifest.batchId, REVISION.batchId);
    assert.equal(manifest.selectedTier, SERIES_EQ_UNIVERSE_BATCHES[REVISION.batchId]!.selectedTier);
    assert.equal(manifest.fileChecksumSha256, REVISION.fileChecksumSha256);
    assert.equal(manifest.recordCount, MASTER.length);
    assert.match(manifest.universeSource.source, /series=EQ/);

    const records = fiveRecords();
    const other = buildIrrIdentitySources({
      masterEntities: records,
      masterRevision: { ...revisionFor(records), batchId: 'BATCH-SOME-OTHER-DEPOSITION' },
    });
    assert.equal(other.report.result, 'REFUSED');
    assert.deepEqual(other.report.refusals.map((refusal) => refusal.code), ['MASTER_UNIVERSE_BASIS_UNKNOWN']);
    assert.equal(other.artifacts, null);
  });

  it('IIX-21 refuses a malformed P7 manifest instead of ignoring it', () => {
    const noRecords = buildIrrIdentitySources({
      masterEntities: MASTER,
      masterRevision: REVISION,
      acceptedWithheld: 2,
      p7: { sha256: P7.sha256, generatedAtUtc: null, records: undefined as unknown as [] },
    });
    assert.equal(noRecords.report.result, 'REFUSED');
    assert.ok(noRecords.report.refusals.some((refusal) => refusal.code === 'P7_MANIFEST_MALFORMED'));

    const badRecord = buildIrrIdentitySources({
      masterEntities: MASTER,
      masterRevision: REVISION,
      acceptedWithheld: 2,
      p7: { ...P7, records: [{ disposition: 'QUALIFIED', isin: MASTER[0]!.isin, exchange: 'NSE' }] },
    });
    assert.equal(badRecord.report.result, 'REFUSED');
    assert.equal(badRecord.artifacts, null);
  });
});

describe('W04 IRR identity export — missing data is withheld, never repaired', () => {
  const cases: ReadonlyArray<readonly [string, (entity: SecurityMasterEntity) => void, string]> = [
    ['no NSE listing row', (entity) => { entity.listings = entity.listings.filter((listing) => listing.exchange !== 'NSE'); }, 'NSE_LISTING_MISSING'],
    ['no NSE symbol', (entity) => { delete entity.nseSymbol; }, 'NSE_LISTING_MISSING'],
    ['listing date absent', (entity) => { entity.effectiveFrom = ''; }, 'LISTING_DATE_INVALID'],
    ['listing date not a calendar date', (entity) => { entity.effectiveFrom = '2024-02-30T00:00:00.000Z'; }, 'LISTING_DATE_INVALID'],
    ['listing date not at midnight UTC', (entity) => { entity.effectiveFrom = '2024-02-20T05:30:00.000Z'; }, 'LISTING_DATE_INVALID'],
    ['blank company name', (entity) => { entity.companyName = '   '; }, 'LEGAL_NAME_MISSING'],
    ['ISIN with a wrong check digit', (entity) => { entity.isin = `${entity.isin.slice(0, 11)}${(Number(entity.isin[11]) + 1) % 10}`; }, 'ISIN_INVALID'],
    ['record not ACTIVE', (entity) => { entity.listingStatus = 'SUSPENDED'; }, 'ENTITY_NOT_ACTIVE'],
    ['record with an end date', (entity) => { entity.effectiveTo = '2026-01-01T00:00:00.000Z'; }, 'ENTITY_NOT_ACTIVE'],
    ['NSE listing not ACTIVE', (entity) => { entity.listings.find((listing) => listing.exchange === 'NSE')!.status = 'DELISTED'; }, 'NSE_LISTING_NOT_ACTIVE'],
    [
      'symbol outside the IRR listing grammar',
      (entity) => { entity.nseSymbol = 'ab cd'; entity.listings.find((listing) => listing.exchange === 'NSE')!.symbol = 'ab cd'; },
      'NSE_SYMBOL_NOT_REPRESENTABLE',
    ],
  ];

  for (const [name, mutate, reason] of cases) {
    it(`IIX-30 ${name} → ${reason}`, () => {
      const records = fiveRecords();
      const target = records[2]!;
      mutate(target);
      const unacknowledged = exportOf(records);
      assert.equal(unacknowledged.report.result, 'INCOMPLETE');
      assert.equal(unacknowledged.artifacts, null);
      assert.deepEqual(withheldReasons(unacknowledged, target.isin), [reason]);
      assert.equal(unacknowledged.report.coverage.master.withheld, 1);

      const acknowledged = exportOf(records, { acceptedWithheld: 1 });
      assert.equal(acknowledged.report.result, 'PASS');
      assert.equal(acknowledged.report.coverage.master.exported, 4);
      const { roster, listingMap } = parsed(acknowledged);
      assert.equal(roster.issuers.length, 4);
      assert.equal(listingMap.entries.length, 4);
      const text = Object.values(acknowledged.artifacts!.files).join('\n');
      assert.ok(!text.includes(`IN:ISIN:${target.isin}"`), 'the withheld record is not in the files');
      assert.deepEqual(checkIrrIdentityFiles(acknowledged.artifacts!.files), []);
    });
  }

  it('IIX-31 a record with several defects lists every reason', () => {
    const records = fiveRecords();
    const target = records[1]!;
    target.companyName = '';
    target.effectiveFrom = 'not a date';
    target.listingStatus = 'DELISTED';
    const result = exportOf(records, { acceptedWithheld: 1 });
    assert.deepEqual(withheldReasons(result, target.isin), ['ENTITY_NOT_ACTIVE', 'LEGAL_NAME_MISSING', 'LISTING_DATE_INVALID']);
    assert.deepEqual(result.report.coverage.master.withheldByReason, { ENTITY_NOT_ACTIVE: 1, LEGAL_NAME_MISSING: 1, LISTING_DATE_INVALID: 1 });
  });
});

describe('W04 IRR identity export — conflicting mappings withhold every party', () => {
  it('IIX-40 one ISIN on two master records', () => {
    const records = fiveRecords();
    records[3]!.isin = records[0]!.isin;
    const result = exportOf(records, { acceptedWithheld: 2 });
    assert.equal(result.report.result, 'PASS');
    assert.equal(result.report.withheld.length, 2);
    assert.ok(result.report.withheld.every((record) => record.isin === records[0]!.isin && record.reasons.includes('ISIN_DUPLICATE')));
    assert.equal(parsed(result).roster.securities.length, 3);
    assert.ok(!Object.values(result.artifacts!.files).join('').includes(records[0]!.isin), 'neither side of the conflict is exported');
  });

  it('IIX-41 one NSE symbol on two ISINs', () => {
    const records = fiveRecords();
    const symbol = records[0]!.nseSymbol!;
    records[4]!.nseSymbol = symbol;
    records[4]!.listings.find((listing) => listing.exchange === 'NSE')!.symbol = symbol;
    const result = exportOf(records, { acceptedWithheld: 2 });
    assert.deepEqual(withheldReasons(result, records[0]!.isin), ['NSE_SYMBOL_DUPLICATE']);
    assert.deepEqual(withheldReasons(result, records[4]!.isin), ['NSE_SYMBOL_DUPLICATE']);
    assert.ok(!parsed(result).listingMap.entries.some((entry) => entry.symbol === symbol), 'the contested symbol resolves to nobody');
  });

  it('IIX-42 the NSE symbol and the NSE listing row disagree', () => {
    const records = fiveRecords();
    records[2]!.listings.find((listing) => listing.exchange === 'NSE')!.symbol = 'OTHERSYM';
    const result = exportOf(records, { acceptedWithheld: 1 });
    assert.deepEqual(withheldReasons(result, records[2]!.isin), ['NSE_LISTING_INCONSISTENT']);
  });

  it('IIX-43 the P7 vendor master records another NSE series for the ISIN', () => {
    const records = fiveRecords();
    const isin = records[1]!.isin;
    const p7: P7CorroborationInput = {
      sha256: 'a'.repeat(64),
      generatedAtUtc: null,
      records: [{ disposition: 'QUALIFIED', exchange: 'NSE', isin, series: 'BE', companyId: records[1]!.companyId, dhanSecurityId: '1' }],
    };
    const result = exportOf(records, { p7, acceptedWithheld: 1 });
    assert.equal(result.report.result, 'PASS');
    assert.deepEqual(withheldReasons(result, isin), ['P7_NSE_SERIES_CONFLICT']);
    assert.equal(result.report.p7Corroboration!.nseSeriesOther, 1);
    // A record P7 did not qualify is not evidence of anything.
    const rejected: P7CorroborationInput = { ...p7, records: [{ ...p7.records[0]!, disposition: 'REJECTED_INVALID_FIELD' }] };
    assert.equal(exportOf(records, { p7: rejected }).report.coverage.master.withheld, 0);
  });

  it('IIX-44 one issuer with two equity ISINs, as in the tracked master', () => {
    const tracked = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION, acceptedWithheld: 2 });
    const [first, second] = tracked.report.withheld;
    assert.equal(first!.isin.slice(3, 7), second!.isin.slice(3, 7), 'the two withheld ISINs carry one issuer code');
    assert.notEqual(first!.isin, second!.isin);
    const text = Object.values(tracked.artifacts!.files).join('');
    assert.ok(!text.includes(first!.isin) && !text.includes(second!.isin));
  });
});

describe('W04 IRR identity export — issuer-key supplement', () => {
  const records = () => {
    const five = fiveRecords();
    const infosys = MASTER.find((entity) => entity.nseSymbol === 'INFY');
    assert.ok(infosys !== undefined);
    return [...five, clone(infosys)];
  };
  // The CIN Infosys Limited publishes; IRR tracks it in its real-issuer evidence packs.
  const INFY_ISIN = 'INE009A01021';
  const INFY_CIN = 'L85110KA1981PLC013115';
  const supplement = (entries: unknown) => ({
    sha256: 'b'.repeat(64),
    schemaVersion: ISSUER_KEY_SUPPLEMENT_SCHEMA,
    sourceLabel: 'issuer publication',
    entries,
  });

  it('IIX-50 keys the named issuer by CIN and leaves the others keyed by equity ISIN', () => {
    const input = records();
    const result = exportOf(input, { issuerKeySupplement: supplement([{ isin: INFY_ISIN, cin: INFY_CIN, sourceRef: 'issuer annual report' }]) });
    assert.equal(result.report.result, 'PASS');
    assert.deepEqual(result.report.coverage.issuers, { exported: 6, keyedByCin: 1, keyedByEquityIsin: 5 });
    const { roster, listingMap } = parsed(result);
    const issuer = roster.issuers.find((candidate) => candidate.equityIsin === INFY_ISIN)!;
    assert.equal(issuer.issuerId, `IN:CIN:${INFY_CIN}`);
    assert.equal(issuer.cin, INFY_CIN);
    assert.equal(issuer.issuerKeyBasis, 'CIN');
    assert.equal(roster.securities.find((security) => security.isin === INFY_ISIN)!.issuerId, `IN:CIN:${INFY_CIN}`);
    assert.equal(listingMap.entries.find((entry) => entry.symbol === 'INFY')!.issuerId, `IN:CIN:${INFY_CIN}`);
    assert.ok(roster.rosterLabel.includes('b'.repeat(64)), 'the roster label binds the supplement digest');
    assert.deepEqual(checkIrrIdentityFiles(result.artifacts!.files), []);
    // The CIN the P04 master carries for the same ISIN is a different value and is still not exported.
    const masterCin = input.find((entity) => entity.isin === INFY_ISIN)!.cin!;
    assert.notEqual(masterCin, INFY_CIN);
    assert.ok(!Object.values(result.artifacts!.files).join('').includes(masterCin));
  });

  const refused: ReadonlyArray<readonly [string, unknown, string]> = [
    ['a CIN that is not structurally valid', [{ isin: INFY_ISIN, cin: 'EXEMPT-STRUCT-1', sourceRef: 'x' }], 'SUPPLEMENT_ENTRY_INVALID'],
    ['an entry without a source', [{ isin: INFY_ISIN, cin: INFY_CIN, sourceRef: ' ' }], 'SUPPLEMENT_ENTRY_INVALID'],
    ['an invalid ISIN', [{ isin: 'INE009A01020', cin: INFY_CIN, sourceRef: 'x' }], 'SUPPLEMENT_ENTRY_INVALID'],
    [
      'two CINs for one ISIN',
      [{ isin: INFY_ISIN, cin: INFY_CIN, sourceRef: 'x' }, { isin: INFY_ISIN, cin: 'L72200MH2000PLC125319', sourceRef: 'y' }],
      'SUPPLEMENT_DUPLICATE_ISIN',
    ],
    [
      'one CIN for two ISINs',
      [{ isin: INFY_ISIN, cin: INFY_CIN, sourceRef: 'x' }, { isin: MASTER[0]!.isin, cin: INFY_CIN, sourceRef: 'y' }],
      'SUPPLEMENT_CIN_CLAIMED_TWICE',
    ],
    ['an ISIN that is not in the master', [{ isin: 'US0378331005', cin: INFY_CIN, sourceRef: 'x' }], 'SUPPLEMENT_ISIN_NOT_EXPORTED'],
  ];
  for (const [name, entries, code] of refused) {
    it(`IIX-51 refuses a supplement with ${name}`, () => {
      const result = exportOf(records(), { issuerKeySupplement: supplement(entries) });
      assert.equal(result.report.result, 'REFUSED');
      assert.ok(result.report.refusals.some((refusal) => refusal.code === code), `expected ${code}`);
      assert.equal(result.artifacts, null);
    });
  }

  it('IIX-52 refuses a supplement of another schema, and one that names a withheld record', () => {
    const wrongSchema = exportOf(records(), { issuerKeySupplement: { ...supplement([]), schemaVersion: 'OTHER' } });
    assert.ok(wrongSchema.report.refusals.some((refusal) => refusal.code === 'SUPPLEMENT_MALFORMED'));

    const input = records();
    input.find((entity) => entity.isin === INFY_ISIN)!.listingStatus = 'SUSPENDED';
    const withheld = exportOf(input, {
      acceptedWithheld: 1,
      issuerKeySupplement: supplement([{ isin: INFY_ISIN, cin: INFY_CIN, sourceRef: 'x' }]),
    });
    assert.equal(withheld.report.result, 'REFUSED');
    assert.ok(withheld.report.refusals.some((refusal) => refusal.code === 'SUPPLEMENT_ISIN_NOT_EXPORTED'));
  });

  /*
   * DECISION D2 (docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md).
   *
   * The tracked master holds one issuer with two listed equity securities: ordinary shares and
   * differential-voting-rights shares. Both are withheld. The CIN below is the one the issuer
   * itself publishes; it is a test input here, built in memory, and is NOT an approved supplement.
   *
   * These tests pin what mapping 1 does today: no supplement can bring either security into the
   * export. They do not say that this is the desired outcome. Admitting the two securities is a
   * change of mapping, which needs the approval the decision record describes; that change will
   * have to replace these tests deliberately.
   */
  describe('the issuer with two equity securities in the tracked master (decision D2)', () => {
    const ORDINARY_ISIN = 'INE175A01038';
    const DVR_ISIN = 'IN9175A01010';
    const ISSUER_PUBLISHED_CIN = 'L29120MH1986PLC042028';
    const tracked = (entries: unknown) =>
      buildIrrIdentitySources({
        masterEntities: MASTER,
        masterRevision: REVISION,
        acceptedWithheld: WITHHELD_IN_TRACKED_MASTER,
        issuerKeySupplement: supplement(entries),
      });

    it('IIX-53 the two withheld records are exactly these two securities, and the master gives them two different CINs', () => {
      const result = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION, acceptedWithheld: WITHHELD_IN_TRACKED_MASTER });
      assert.deepEqual(result.report.withheld.map((record) => record.isin).sort(), [DVR_ISIN, ORDINARY_ISIN].sort());
      for (const record of result.report.withheld) assert.deepEqual([...record.reasons], ['ISSUER_SHARED_ACROSS_ISINS']);
      const ordinary = MASTER.find((entity) => entity.isin === ORDINARY_ISIN)!;
      const dvr = MASTER.find((entity) => entity.isin === DVR_ISIN)!;
      assert.equal(ordinary.companyName, dvr.companyName, 'one company name');
      assert.notEqual(ordinary.cin, dvr.cin, 'the master assigns the one company two different CINs');
      assert.notEqual(ordinary.cin, ISSUER_PUBLISHED_CIN);
      assert.notEqual(dvr.cin, ISSUER_PUBLISHED_CIN);
    });

    it('IIX-54 a supplement that gives both securities the one CIN is refused: one CIN may key one ISIN only', () => {
      const result = tracked([
        { isin: ORDINARY_ISIN, cin: ISSUER_PUBLISHED_CIN, sourceRef: 'test input' },
        { isin: DVR_ISIN, cin: ISSUER_PUBLISHED_CIN, sourceRef: 'test input' },
      ]);
      assert.equal(result.report.result, 'REFUSED');
      assert.ok(result.report.refusals.some((refusal) => refusal.code === 'SUPPLEMENT_CIN_CLAIMED_TWICE'));
      assert.equal(result.artifacts, null);
    });

    for (const [label, isin] of [['the ordinary share', ORDINARY_ISIN], ['the differential-voting-rights share', DVR_ISIN]] as const) {
      it(`IIX-55 a supplement that names only ${label} is refused: a withheld record cannot be supplemented`, () => {
        const result = tracked([{ isin, cin: ISSUER_PUBLISHED_CIN, sourceRef: 'test input' }]);
        assert.equal(result.report.result, 'REFUSED');
        assert.ok(result.report.refusals.some((refusal) => refusal.code === 'SUPPLEMENT_ISIN_NOT_EXPORTED'));
        assert.equal(result.artifacts, null);
      });
    }

    it('IIX-56 the accepted export contains neither security, neither symbol and not the CIN the issuer publishes', () => {
      const result = buildIrrIdentitySources({ masterEntities: MASTER, masterRevision: REVISION, acceptedWithheld: WITHHELD_IN_TRACKED_MASTER });
      assert.equal(result.report.result, 'PASS');
      const text = Object.values(result.artifacts!.files).join('');
      for (const token of [ORDINARY_ISIN, DVR_ISIN, ISSUER_PUBLISHED_CIN, 'JISLJALEQS', 'JISLDVREQS']) {
        assert.ok(!text.includes(token), `${token} must not be in the export`);
      }
    });
  });
});

describe('W04 IRR identity export — check of produced files', () => {
  const good = exportOf(fiveRecords()).artifacts!.files;
  const alter = (name: keyof typeof IRR_IDENTITY_FILE_NAMES, change: (root: Record<string, any>) => void) => {
    const fileName = IRR_IDENTITY_FILE_NAMES[name];
    const root = JSON.parse(good[fileName]) as Record<string, any>;
    change(root);
    return { ...good, [fileName]: `${JSON.stringify(root, null, 2)}\n` };
  };

  it('IIX-60 accepts the untouched export', () => {
    assert.deepEqual(checkIrrIdentityFiles(good), []);
  });

  const defects: ReadonlyArray<readonly [string, () => Record<string, string>]> = [
    ['a duplicated issuer', () => alter('roster', (root) => { root.issuers.push(root.issuers[0]); })],
    ['issuers out of order', () => alter('roster', (root) => { root.issuers.reverse(); })],
    ['a security whose issuer is not in the roster', () => alter('roster', (root) => { root.securities[0].issuerId = 'IN:EQISIN:US0378331005'; })],
    ['a listing that names an unknown security', () => alter('listingMap', (root) => { root.entries[0].securityId = 'IN:ISIN:US0378331005'; })],
    ['a listing identifier that is not canonical', () => alter('listingMap', (root) => { root.entries[0].listingId = 'IN:NSE:XYZ'; })],
    ['a listing on another exchange', () => alter('listingMap', (root) => { root.entries[0].exchange = 'BSE'; })],
    ['a security without a listing', () => alter('listingMap', (root) => { root.entries.pop(); })],
    ['a closed listing window', () => alter('listingMap', (root) => { root.entries[0].effectiveTo = '2026-01-01'; })],
    ['a roster labelled synthetic', () => alter('roster', (root) => { root.rosterLabel = 'Synthetic roster'; })],
    ['another schema version', () => alter('corporateActions', (root) => { root.schemaVersion = 'OTHER'; })],
    ['a corporate action', () => alter('corporateActions', (root) => { root.actions.push({ actionId: 'X' }); })],
    ['a missing actions array', () => alter('corporateActions', (root) => { delete root.actions; })],
    ['CRLF line endings', () => ({ ...good, [IRR_IDENTITY_FILE_NAMES.listingMap]: good[IRR_IDENTITY_FILE_NAMES.listingMap].replace(/\n/g, '\r\n') })],
    ['text that is not JSON', () => ({ ...good, [IRR_IDENTITY_FILE_NAMES.roster]: '{ not json\n' })],
  ];
  for (const [name, make] of defects) {
    it(`IIX-61 reports ${name}`, () => {
      assert.ok(checkIrrIdentityFiles(make() as typeof good).length > 0);
    });
  }
});
