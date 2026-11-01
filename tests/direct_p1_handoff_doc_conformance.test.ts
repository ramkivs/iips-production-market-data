/**
 * Direct P1 — handoff documentation conformance (2026-11-01).
 *
 * The first-draft IRR handoff record published the wrong wire shapes for all
 * three read operations: it named five `portfolio.list` fields that do not exist
 * (`currentRevision`, `status`, `createdAt`, `updatedAt`, `deletedAt`), typed
 * `portfolio.get` as a nullable `PortfolioRecord` when the provider never
 * returns null, and described `portfolio.revisions` as `PortfolioRevisionSummary`
 * with a `portfolioId` and a `weightSumPercentage` it does not carry.
 *
 * `tests/q1_ipc_read_contract_conformance.test.ts` already pins the runtime
 * shapes over the real endpoint. What nothing pinned was the agreement between
 * the *published documentation* and the implementation, which is exactly what
 * drifted. This suite closes that gap: it parses the TypeScript contracts and the
 * exported setting constants from source and requires the operator-facing
 * documents to state them exactly.
 *
 * Documentation-only guard. It opens no database, starts no server and mutates
 * nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DATABASE_PATH_SETTING } from '../src/ipc/entrypoint.js';
import { IPC_ENDPOINT_SETTING, IPC_STATE_DIR_SETTING } from '../src/ipc/endpoint.js';
import { MINIMUM_NODE_MAJOR, MINIMUM_NODE_MINOR, MINIMUM_NODE_PATCH } from '../src/persistence/connection.js';

const HANDOFF = 'docs/integration/IIPS_V3_DIRECT_P1_PROVISIONING_AND_IRR_HANDOFF_2026-11-01.md';
const OPERATOR = 'docs/DIRECT_P1_PROVISIONING.md';
const STORE = 'src/persistence/portfolio_store.ts';

function repo(relativePath: string): string {
  const full = resolve(process.cwd(), relativePath);
  assert.ok(existsSync(full), `expected ${relativePath} in the repository root`);
  return readFileSync(full, 'utf8');
}

/** Declared `readonly` member names of one exported interface. */
function interfaceFields(source: string, name: string): string[] {
  const start = source.indexOf(`export interface ${name} `);
  assert.notEqual(start, -1, `interface ${name} must exist in ${STORE}`);
  const open = source.indexOf('{', start);
  const body = source.slice(open + 1, source.indexOf('\n}', open));
  return [...body.matchAll(/^\s*readonly\s+([A-Za-z0-9_]+)\??\s*:/gm)].map((m) => m[1] as string);
}

/** The §3.3 row for one operation, so assertions cannot leak across rows. */
function section33Row(doc: string, op: string): string {
  const section = doc.slice(doc.indexOf('### 3.3 Operations'));
  const row = section.split('\n').find((line) => line.startsWith(`| \`${op}\``));
  assert.ok(row, `§3.3 must document \`${op}\``);
  return row as string;
}

/** Names the document presents as backticked identifiers. */
function backticked(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
}

describe('Direct P1 handoff — §3.3 read shapes match the TypeScript contracts', () => {
  const store = repo(STORE);
  const doc = repo(HANDOFF);

  const summary = interfaceFields(store, 'PortfolioSummary');
  const detail = interfaceFields(store, 'PortfolioDetail');
  const revision = interfaceFields(store, 'RevisionEntry');

  it('documents every real PortfolioSummary field and no invented one', () => {
    assert.equal(summary.length, 9, 'the summary projection carries nine fields');
    const row = section33Row(doc, 'portfolio.list');
    for (const field of summary) {
      assert.ok(row.includes(`\`${field}\``), `§3.3 must name the real field \`${field}\``);
    }
    assert.match(row, /exactly 9 fields/, '§3.3 must state the nine-field count');
  });

  it('does not reintroduce the five superseded portfolio.list field names', () => {
    const row = section33Row(doc, 'portfolio.list');
    for (const phantom of ['currentRevision', 'status', 'createdAt', 'updatedAt', 'deletedAt']) {
      assert.equal(summary.includes(phantom), false, `${phantom} is not a real field`);
      assert.equal(row.includes(`\`${phantom}\``), false, `§3.3 must not present \`${phantom}\` as a field`);
    }
  });

  it('types portfolio.get as the non-nullable PortfolioDetail it actually returns', () => {
    const row = section33Row(doc, 'portfolio.get');
    assert.ok(row.includes('`PortfolioDetail`'), '§3.3 must name the real type');
    assert.match(row, /Never `null`/, '§3.3 must state that the result is never null');
    assert.ok(row.includes('`holdings: HoldingInput[]`'), 'the holdings element type is HoldingInput');
    assert.ok(
      row.includes('`contributions: PortfolioContribution[]`'),
      'the contributions element type is PortfolioContribution',
    );
    // `PortfolioDetail extends PortfolioSummary`, so it declares only the two
    // collections; the wire shape is therefore the 9 summary fields plus these 2.
    assert.match(store, /export interface PortfolioDetail extends PortfolioSummary/);
    assert.deepEqual(detail, ['holdings', 'contributions']);
    assert.equal(summary.length + detail.length, 11, 'the detail shape carries eleven fields');
    assert.match(row, /11 fields/, '§3.3 must state the eleven-field count');
  });

  it('documents the seven real RevisionEntry fields, including committedAt', () => {
    assert.equal(revision.length, 7, 'the revision entry carries seven fields');
    const row = section33Row(doc, 'portfolio.revisions');
    for (const field of revision) {
      assert.ok(row.includes(field), `§3.3 must name the real field \`${field}\``);
    }
    assert.ok(row.includes('`RevisionEntry[]`'), '§3.3 must name the real type');
    assert.match(row, /exactly 7 fields/, '§3.3 must state the seven-field count');
    assert.equal(revision.includes('portfolioId'), false);
    assert.equal(revision.includes('weightSumPercentage'), false);
    assert.equal(revision.includes('createdAt'), false, 'the wire name is committedAt');
  });

  it('states that portfolioId is optional and names the DEFAULT_PORTFOLIO fallback', () => {
    const dispatch = repo('src/ipc/dispatch.ts');
    assert.match(dispatch, /payload\.portfolioId \?\? 'DEFAULT_PORTFOLIO'/);
    for (const op of ['portfolio.get', 'portfolio.revisions']) {
      const row = section33Row(doc, op);
      assert.ok(row.includes('portfolioId?'), `§3.3 must mark portfolioId optional on ${op}`);
      assert.ok(row.includes('DEFAULT_PORTFOLIO'), `§3.3 must document the ${op} default`);
    }
  });

  it('documents the RESOURCE_UNAVAILABLE refusal instead of a null result', () => {
    const dispatch = repo('src/ipc/dispatch.ts');
    assert.match(dispatch, /'RESOURCE_UNAVAILABLE'/);
    assert.match(doc, /RESOURCE_UNAVAILABLE/);
    assert.match(doc, /missing, foreign and tombstoned are deliberately indistinguishable/i);
  });

  it('records the two IRR-boundary renames as IRR-side, not IPD wire names', () => {
    assert.match(doc, /holdingsCount` to `totalHoldingsCount/);
    assert.match(doc, /committedAt` to `createdAt/);
    assert.match(doc, /only\*\* in the IRR adapter, never in IPD/);
  });

  it('keeps the write row aligned with the frozen closed write-operation set', () => {
    const protocol = repo('src/ipc/protocol.ts');
    for (const op of ['portfolio.create', 'portfolio.save', 'portfolio.reset', 'portfolio.delete']) {
      assert.ok(protocol.includes(`'${op}'`), `${op} must be in the protocol's operation set`);
    }
    const row = section33Row(doc, 'portfolio.create');
    assert.ok(row.includes('WRITE_NOT_AUTHORIZED'));
  });
});

describe('Direct P1 handoff — §3.1 setting names match the exported constants', () => {
  const doc = repo(HANDOFF);

  it('names the database-path setting exactly as the entrypoint exports it', () => {
    assert.equal(DATABASE_PATH_SETTING, 'IIPS_G3_DATABASE_PATH');
    assert.ok(doc.includes(`\`${DATABASE_PATH_SETTING}\``));
  });

  it('names the endpoint setting exactly as the endpoint module exports it', () => {
    assert.equal(IPC_ENDPOINT_SETTING, 'IIPS_G2_IPC_ENDPOINT');
    assert.ok(doc.includes(`\`${IPC_ENDPOINT_SETTING}\``));
  });

  it('no longer claims the state-directory setting is unused on win32', () => {
    assert.equal(IPC_STATE_DIR_SETTING, 'IIPS_G3_LOCAL_STATE_DIR');
    assert.equal(doc.includes('is unused on `win32`'), false, 'the superseded claim must be gone');
    // A bare endpoint name does require the setting on win32; the doc must say so.
    const endpoint = repo('src/ipc/endpoint.ts');
    assert.match(endpoint, /a bare endpoint name requires/);
    assert.ok(doc.includes('a bare endpoint name requires IIPS_G3_LOCAL_STATE_DIR'));
  });

  it('keeps one consistent named-pipe spelling throughout the record', () => {
    const spellings = new Set(
      [...doc.matchAll(/[\\/]+\.?[\\/]*pipe[\\/]+iips-user-portfolio-v1/g)].map((m) => m[0]),
    );
    assert.equal(spellings.size, 1, `inconsistent pipe spellings: ${[...spellings].join(' | ')}`);
  });
});

describe('Direct P1 operator instructions — Windows provider startup', () => {
  const doc = repo(OPERATOR);
  const manifest = JSON.parse(repo('package.json')) as { files?: string[]; scripts?: Record<string, string> };

  it('gives the compiled IPC entrypoint path the build actually emits', () => {
    assert.ok(doc.includes('dist\\src\\ipc\\entrypoint.js'), 'the Windows path must be documented');
    // The CLI guard in the entrypoint only self-starts for that filename.
    const entrypoint = repo('src/ipc/entrypoint.ts');
    assert.match(entrypoint, /endsWith\('entrypoint\.js'\)/);
  });

  it('documents both required provider environment settings', () => {
    assert.ok(doc.includes(`IIPS_G3_DATABASE_PATH = 'C:\\iips-data\\iips\\user-portfolio.sqlite'`));
    assert.ok(doc.includes(`IIPS_G2_IPC_ENDPOINT  = '\\\\.\\pipe\\iips-user-portfolio-v1'`));
  });

  it('states the minimum Node version enforced by the source constants', () => {
    const minimum = `${MINIMUM_NODE_MAJOR}.${MINIMUM_NODE_MINOR}.${MINIMUM_NODE_PATCH}`;
    assert.equal(minimum, '22.13.0');
    assert.ok(doc.includes(`**>= ${minimum}**`), `the operator doc must state >= ${minimum}`);
  });

  it('names a build step that emits the provider entrypoint', () => {
    assert.ok(doc.includes('npm run build:tsc'));
    assert.equal(manifest.scripts?.['build:tsc'], 'tsc');
  });

  it('warns that the provider is not published to npm', () => {
    assert.deepEqual(manifest.files, ['dist/package'], 'only dist/package is published');
    assert.match(doc, /not published to npm/);
    assert.match(doc, /no\*\* `ipc\/` directory/);
  });

  it('records that the 0700 state-directory rule is POSIX-only', () => {
    const endpoint = repo('src/ipc/endpoint.ts');
    assert.match(endpoint, /POSIX-only: never invoked for a/);
    assert.match(doc, /POSIX-only/);
  });

  it('documents the fixed startup order and the stderr diagnostic contract', () => {
    assert.match(doc, /validate → connect → migrate → verify → bind/);
    const entrypoint = repo('src/ipc/entrypoint.ts');
    assert.match(entrypoint, /console\.error\(`\[g3\] startup refused at phase/);
    assert.match(doc, /\[g3\] startup refused at phase <phase>: <error>/);
    assert.match(doc, /stderr/);
  });

  it('states that starting the provider authorizes no durable write', () => {
    assert.match(doc, /does\s+not authorize a durable portfolio write/);
  });
});
