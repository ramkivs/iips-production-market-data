import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const operatingModel = readFileSync('docs/IPD-OPERATING-MODEL.md', 'utf8');
const roadmap = readFileSync('docs/integration/IIPS-CURRENT-PORTFOLIO-EXECUTION-ROADMAP.md', 'utf8');
const phase1History = readFileSync('docs/PHASE1_AUTHORIZATION_PREPARATION.md', 'utf8');
const stage4cHistory = readFileSync(
  'docs/integration/STAGE-4C-SECURITY-IDENTITY-GOVERNANCE-AND-INTEGRATION-BOUNDARY-2026-11-09.md',
  'utf8',
);

describe('IPD personal local operating model documentation', () => {
  it('states the complete personal single-user local non-production scope', () => {
    for (const term of ['Personal use', 'single user', 'local Windows', 'non-production', 'owner-directed']) {
      assert.ok(operatingModel.toLowerCase().includes(term.toLowerCase()), `missing scope term: ${term}`);
    }
    for (const excluded of ['Production deployment', 'SaaS/hosted service', 'multi-user', 'commercial distribution']) {
      assert.ok(operatingModel.includes(excluded), `missing explicit scope exclusion: ${excluded}`);
    }
  });

  it('makes the owner the sole authority for routine local work without repeated approval ceremonies', () => {
    assert.match(operatingModel, /sole operational\s+authority/i);
    for (const activity of ['implementation', 'configuration', 'testing', 'local data operations', 'verification']) {
      assert.ok(operatingModel.includes(activity), `missing routine activity: ${activity}`);
    }
    for (const ceremony of ['repeated approval', 'committee', 'second approver', 'change-control board']) {
      assert.match(operatingModel, new RegExp(ceremony, 'i'), `missing removal of ${ceremony}`);
    }
  });

  it('retains proportionate data, integrity, testing, verification and recovery controls', () => {
    for (const safeguard of ['verified recoverable backup', 'integrity checks', 'targeted tests', 'post-change verification', 'rollback/recovery']) {
      assert.ok(operatingModel.includes(safeguard), `missing safeguard: ${safeguard}`);
    }
    for (const boundary of ['repository ownership', 'identity and owner isolation', 'security boundaries', 'portfolio-data integrity']) {
      assert.ok(operatingModel.includes(boundary), `missing protected boundary: ${boundary}`);
    }
  });

  it('is linked as current authority by the roadmap and preserves evidence as history', () => {
    assert.ok(roadmap.includes('../IPD-OPERATING-MODEL.md'));
    assert.match(phase1History, /Historical record — not current operating authority/);
    assert.match(phase1History, /superseded as current requirements/);
    assert.match(phase1History, /No historical decision or result below is retroactively changed/);
    assert.match(stage4cHistory, /historical classification above is not rewritten/);
    assert.match(stage4cHistory, /not\*\* a current requirement for repeated approvals or a committee/);
  });
});
