/**
 * Institutional Investment Platform System (IIPS)
 * W-02 Windows acceptance artefacts — structure and fail-closed behaviour
 *
 * Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11 (v1.1), W-02
 * Record : docs/integration/DHAN-W02-WINDOWS-DPAPI-BACKEND-2026-11-12.md §11
 *
 * SCOPE OF PROOF (nothing here is a Windows DPAPI result):
 *  - the acceptance script and harness exist and still obey the project's PowerShell rules and
 *    the secret-handling design (stdin-only values, no value on argv, cleanup, evidence log);
 *  - the harness FAILS CLOSED and emits valid, secret-free JSON when it is not on Windows.
 *
 * The real DPAPI round trip is executed only on the operator's Windows machine and is recorded
 * there; this file deliberately does not simulate it and never claims it.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PS_SCRIPT = path.resolve('windows-acceptance/Invoke-W02DpapiAcceptance.ps1');
const HARNESS = path.resolve('windows-acceptance/w02_dpapi_acceptance.mjs');
const README = path.resolve('windows-acceptance/README.md');

function readText(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

describe('W-02 / Windows acceptance artefacts', () => {
  it('W-02-A01: the acceptance files exist and are documented', () => {
    for (const file of [PS_SCRIPT, HARNESS, README]) {
      assert.ok(fs.existsSync(file), `${path.basename(file)} must exist`);
    }
    const readme = readText(README);
    assert.match(readme, /Invoke-W02DpapiAcceptance\.ps1/);
    assert.match(readme, /W02-DPAPI-ACCEPTANCE-EVIDENCE\.md/);
    assert.match(readme, /What it does not prove/);
  });

  it('W-02-A02: the PowerShell wrapper obeys the project rules and the secret-handling design', () => {
    const text = readText(PS_SCRIPT);
    const code = text
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');

    // Project PowerShell rules (also enforced by windows-setup/.validate-scripts.py).
    assert.ok(text.includes('#Requires -Version 5.1'));
    assert.ok(code.includes('[CmdletBinding()]'));
    assert.ok(code.includes('Set-StrictMode -Version Latest'));
    assert.ok(code.includes("$ErrorActionPreference = 'Stop'"));
    assert.ok(code.includes('[switch] $NoPause'));
    assert.ok(code.includes('Write-IipsFinalStatus'));
    assert.ok(code.includes('Resolve-IipsNodeToolchain'), 'must use the shared toolchain resolution');
    assert.ok(!/\belse\b/.test(code), 'no else anywhere');
    assert.ok(!/\belseif\b/.test(code), 'no elseif anywhere');
    assert.ok(!/\bfinally\b/.test(code), 'no finally anywhere');
    assert.ok(!code.includes('[Environment]::Exit'), 'must never force-close the session');

    const tryCount = (code.match(/\btry\b/g) ?? []).length;
    const catchCount = (code.match(/\bcatch\b/g) ?? []).length;
    assert.strictEqual(tryCount, catchCount, 'every try must have a catch');

    // No bare node/npm/npx command invocation.
    const commandLines = code
      .split('\n')
      .filter((line) => /\bnode\b|\bnpm\b|\bnpx\b/.test(line))
      .filter((line) => !line.includes('node.exe') && !line.includes('Node.js') && !line.includes('NodeExecutable'));
    for (const line of commandLines) {
      assert.ok(!/^\s*(node|npm|npx)\s/.test(line), `bare tool invocation: ${line.trim()}`);
    }

    // Secrets travel on stdin, never on a command line and never into a log.
    assert.ok(code.includes('| & $nodeExe $harnessPath'), 'the harness call must pipe stdin');
    assert.ok(code.includes('$stdinJson'), 'the values must be serialised for stdin');
    assert.ok(code.includes('2> $stderrPath'), 'native stderr must be redirected away from the pipeline');
    assert.ok(!/Write-(Host|IipsInfo|IipsOk)[^\n]*\$(clientIdValue|accessTokenValue)/.test(code), 'never print a value');
    assert.ok(!/Set-Content[^\n]*\$(clientIdValue|accessTokenValue)/.test(code), 'never write a value');
    assert.ok(!code.includes('$stderrBytes = Get-Content'), 'stderr content must never be read');

    // Evidence, cleanup and the acceptance test identifiers.
    assert.ok(text.includes('W02-DPAPI-ACCEPTANCE-EVIDENCE.md'), 'the evidence log name must be fixed');
    assert.ok(code.includes('Remove-Item -LiteralPath $acceptanceRoot -Recurse -Force'), 'cleanup is mandatory');
    for (const id of ['W02-WIN-01', 'W02-WIN-11', 'W02-WIN-12']) {
      assert.ok(text.includes(id), `missing acceptance identifier ${id}`);
    }
    assert.ok(text.includes('runtime\\w02-acceptance-'), 'the acceptance directory must be outside Git, under the runtime root');
  });

  it('W-02-A03: the harness drives the production modules and cannot print a value', () => {
    const text = readText(HARNESS);

    // It must exercise the production implementation, not a re-implementation.
    assert.match(text, /\.\.\/dist\/src\/providers\/dhan\/dhan_dpapi_carrier\.js/);
    assert.match(text, /\.\.\/dist\/src\/providers\/dhan\/dhan_dpapi_process\.js/);
    assert.match(text, /\.\.\/dist\/src\/providers\/dhan\/dhan_dpapi_vault_backend\.js/);
    assert.ok(text.includes('writeDpapiCarrierAtomically'), 'must use the production atomic writer');
    assert.ok(text.includes('WindowsDpapiHostVaultBackend'), 'must read through the production backend');
    assert.ok(text.includes('probeReadiness'), 'must exercise readiness gating');

    // Real DPAPI, user scope, static program, stdin/stdout only.
    assert.ok(text.includes('DataProtectionScope]::CurrentUser'), 'must use DPAPI user scope');
    assert.ok(text.includes('ProtectedData]::Protect'));
    assert.ok(text.includes('-EncodedCommand'), 'the child program must be static and encoded');
    assert.ok(text.includes('[Console]::In.ReadToEnd()'), 'the child must read its request on stdin');
    assert.ok(!text.includes('plaintextB64: JSON.stringify'), 'no plaintext interpolation into a command');

    // Value handling: read from stdin, guarded before printing, never surfaced.
    assert.ok(text.includes('await readStdin()'), 'the values must arrive on stdin');
    assert.ok(text.includes('guardOutput'), 'an output guard must exist');
    assert.ok(text.includes('REDACTED'));
    const stdoutWrites = (text.match(/process\.stdout\.write\([^)]*\)/g) ?? []).join('\n');
    assert.ok(!/clientIdValue|accessTokenValue/.test(stdoutWrites), 'values must never be written to stdout');

    // It may never touch the product tree.
    assert.ok(!text.includes("from '../src/"), 'the harness must not import TypeScript sources');
  });

  it('W-02-A04: off Windows the harness fails closed and emits secret-free JSON', async (t) => {
    if (process.platform === 'win32') {
      t.skip('on Windows this harness would perform the real DPAPI acceptance run, which is operator-driven');
      return;
    }

    const canaryClient = 'CANARY-CLIENT-VALUE-DO-NOT-ECHO-0001';
    const canaryToken = 'CANARY-TOKEN-VALUE-DO-NOT-ECHO-0002';
    const result = spawnSync(process.execPath, [HARNESS], {
      input: JSON.stringify({
        clientIdValue: canaryClient,
        accessTokenValue: canaryToken,
        carrierRoot: path.join(path.sep, 'tmp', 'w02-arena-should-not-be-used'),
      }),
      encoding: 'utf8',
      timeout: 30_000,
    });

    assert.strictEqual(result.status, 1, 'the harness must exit non-zero off Windows');
    assert.ok(!result.stdout.includes(canaryClient), 'no value may be emitted');
    assert.ok(!result.stdout.includes(canaryToken), 'no value may be emitted');

    const parsed = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      tests: Array<{ id: string; status: string; output: string }>;
    };
    assert.strictEqual(parsed.ok, false);
    assert.ok(parsed.tests.length > 0);
    assert.strictEqual(parsed.tests[0].id, 'W02-WIN-01');
    assert.strictEqual(parsed.tests[0].status, 'FAIL');
    assert.match(parsed.tests[0].output, /platform is (linux|darwin)/);

    // Nothing was created anywhere: the harness refuses before touching the filesystem.
    assert.ok(!fs.existsSync(path.join(path.sep, 'tmp', 'w02-arena-should-not-be-used')));
  });

  it('W-02-A05: the acceptance artefacts are outside the product and package surfaces', () => {
    // No production module may import the acceptance harness.
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.name.endsWith('.ts')) continue;
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('windows-acceptance') || text.includes('w02_dpapi_acceptance')) {
          offenders.push(full);
        }
      }
    };
    walk(path.resolve('src'));
    assert.deepStrictEqual(offenders, [], 'src/ must not reference the acceptance harness');
  });
});
