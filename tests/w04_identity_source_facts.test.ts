/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: W04 — facts about the P04 master that decisions D1 and D4 rest on (IDF-*)
 *
 * Decision record: docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md
 *
 * These tests compare tracked files with each other: the P04 master (the 2026-11-08 deposit) and the
 * derived files of the Wave-3 evidence reassessment (`evidence/D05-Wave3/derived/`). They pin the
 * measured differences so that the decision record cannot drift from the data it describes.
 *
 * A comparison shows that two files differ. It does not show which file is right. No registry
 * master is tracked in this repository, so no test here verifies a CIN against a registry.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { D05_AUTHENTICATED_UNIVERSE_ENTITIES, D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION } from '../src/identity/index.js';
import { buildIrrIdentitySources, isStructurallyValidCin } from '../src/identity/irr_identity_source_export.js';

const ROOT = process.cwd();
const MASTER = D05_AUTHENTICATED_UNIVERSE_ENTITIES;
const DERIVED_DIR = 'evidence/D05-Wave3/derived';

/** Minimal RFC 4180 reader: quoted fields, doubled quotes, commas and line breaks inside quotes. */
function readCsv(relativePath: string): ReadonlyArray<Readonly<Record<string, string>>> {
  const text = readFileSync(join(ROOT, relativePath), 'utf8').replace(/^\uFEFF/, '');
  const table: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      table.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    table.push(row);
  }
  const [header, ...body] = table;
  assert.ok(header !== undefined, `${relativePath} has a header`);
  return body
    .filter((cells) => cells.some((cell) => cell.length > 0))
    .map((cells) => {
      assert.equal(cells.length, header.length, `${relativePath}: every row has ${header.length} fields`);
      return Object.fromEntries(header.map((name, column) => [name, cells[column]!]));
    });
}

const derivedCin = new Map(readCsv(`${DERIVED_DIR}/arena_mca_identity_bridged.derived.csv`).map((row) => [row.isin!, row.cin!.trim()]));
const derivedTaxonomy = readCsv(`${DERIVED_DIR}/arena_taxonomy_submission.derived.csv`);
const derivedBse = new Map(readCsv(`${DERIVED_DIR}/arena_bse_identity_bridged.derived.csv`).map((row) => [row.isin!, row.bseScripCode!.trim()]));

const stateCode = (cin: string): string => cin.slice(6, 8);

describe('W04 decisions D1 and D4 — what the P04 master carries, compared with the reassessment files', () => {
  it('IDF-01 the derived files and the master describe the same 2,390 securities', () => {
    assert.equal(MASTER.length, 2390);
    for (const table of [derivedCin, derivedBse]) {
      assert.equal(table.size, 2390);
      assert.ok(MASTER.every((entity) => table.has(entity.isin)));
    }
    assert.equal(derivedTaxonomy.length, 2390);
  });

  it('IDF-02 the CIN field of the master: 2,298 well-formed values, 2,291 of them with state code MH', () => {
    const wellFormed = MASTER.map((entity) => entity.cin ?? '').filter(isStructurallyValidCin);
    assert.equal(wellFormed.length, 2298);
    assert.equal(wellFormed.filter((cin) => stateCode(cin) === 'MH').length, 2291);
    assert.equal(new Set(wellFormed.map(stateCode)).size, 6);
    assert.equal(new Set(wellFormed).size, 2298, 'no CIN is shared by two master records');
  });

  it('IDF-03 the CIN field of the reassessment file: 2,305 well-formed values across 32 state codes', () => {
    const wellFormed = [...derivedCin.values()].filter(isStructurallyValidCin);
    assert.equal(wellFormed.length, 2305);
    assert.equal(wellFormed.filter((cin) => stateCode(cin) === 'MH').length, 675);
    assert.equal(new Set(wellFormed.map(stateCode)).size, 32);
  });

  it('IDF-04 the master and the reassessment file agree on 9 of the 2,241 CINs both carry', () => {
    let comparable = 0;
    let equal = 0;
    for (const entity of MASTER) {
      const masterCin = entity.cin ?? '';
      const reassessed = derivedCin.get(entity.isin)!;
      if (!isStructurallyValidCin(masterCin) || !isStructurallyValidCin(reassessed)) continue;
      comparable += 1;
      if (masterCin === reassessed) equal += 1;
    }
    assert.deepEqual({ comparable, equal, different: comparable - equal }, { comparable: 2241, equal: 9, different: 2232 });
  });

  it('IDF-05 no CIN of the master reaches the IRR identity files', () => {
    const result = buildIrrIdentitySources({
      masterEntities: MASTER,
      masterRevision: D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION,
      acceptedWithheld: 2,
    });
    assert.equal(result.report.result, 'PASS');
    assert.equal(result.report.coverage.issuers.keyedByCin, 0);
    const text = Object.values(result.artifacts!.files).join('');
    const exportedMasterCins = MASTER.map((entity) => entity.cin ?? '').filter((cin) => isStructurallyValidCin(cin) && text.includes(cin));
    assert.equal(exportedMasterCins.length, 0);
  });

  it('IDF-06 the sector field of the master: 1,496 of 2,390 records in one sector, and no file claims a published source', () => {
    assert.equal(MASTER.filter((entity) => entity.sector === 'Capital Goods').length, 1496);
    assert.equal(new Set(MASTER.map((entity) => entity.sector)).size, 17);
    // The reassessment's own taxonomy file states on every row that it is not a published attribution.
    assert.ok(derivedTaxonomy.every((row) => row.classificationBasis!.includes('not an independently published')));
    // The two generations disagree with each other for most records.
    const bySector = new Map(derivedTaxonomy.map((row) => [row.isin!, row.sector!]));
    assert.equal(MASTER.filter((entity) => bySector.get(entity.isin) === entity.sector).length, 959);
  });

  it('IDF-07 the BSE scrip codes of the master equal the reassessment join for all 2,290 dual-listed records', () => {
    const coded = MASTER.filter((entity) => /^\d{6}$/.test(entity.bseScripCode ?? ''));
    assert.equal(coded.length, 2290);
    assert.ok(coded.every((entity) => derivedBse.get(entity.isin) === entity.bseScripCode));
    const rest = MASTER.filter((entity) => !/^\d{6}$/.test(entity.bseScripCode ?? ''));
    assert.equal(rest.length, 100);
    assert.ok(rest.every((entity) => entity.bseScripCode === 'UNLISTED-BSE' && derivedBse.get(entity.isin) === ''));
  });
});
