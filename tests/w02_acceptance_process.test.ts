/**
 * Institutional Investment Platform System (IIPS)
 * W-02 — Repository-Owned Windows Acceptance Infrastructure
 *
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), W-02
 *
 * WHY THIS SUITE EXISTS (two confirmed Windows-host failures):
 *  1. Toolchain discovery HUNG at `[01-preconditions]`. The old resolver started every probe with
 *     `Start-Process -Wait` (waits for the ENTIRE process tree, no timeout) and discovered the npm
 *     node through `npm exec`. There was nothing to interrupt either one.
 *  2. The acceptance launcher crashed because it passed `-ForegroundColor` to `Write-IipsInfo`,
 *     which declares a single `-Message` parameter.
 *
 * WHAT IS PROVEN HERE:
 *  - the repository-owned helper (`windows-setup/Iips-Common.ps1`) carries the bounded runner and
 *    the deterministic resolver, with no `npm exec`, no `Start-Process -Wait`, no machine-specific
 *    Node path and no personal helper path;
 *  - the acceptance launcher delivers the throwaway values on stdin through that runner, keeps no
 *    stderr file, and calls the helper only with parameters it declares;
 *  - WHEN POWERSHELL IS PRESENT, the real `Invoke-IipsProcess` is executed: bounded timeout with a
 *    killed child, non-zero exit, both streams captured, a payload larger than a pipe buffer on
 *    both streams at once, stdin delivery that provably does not appear on the child's command
 *    line, and the resolver's sanitized failure.
 *
 * WHAT IS NOT PROVEN HERE:
 *  - PowerShell 5.1 execution. The runner is written to 5.1-compatible API surface and is checked
 *    structurally, but the Windows acceptance run remains the authority for Windows behaviour.
 *  - Windows DPAPI and Windows ACL behaviour. Never simulated, never claimed.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const COMMON = path.resolve('windows-setup/Iips-Common.ps1');
const LAUNCHER = path.resolve('windows-acceptance/Invoke-W02DpapiAcceptance.ps1');
const VALIDATOR = path.resolve('windows-setup/.validate-scripts.py');

function readText(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

/** Remove `#` line comments and `<# ... #>` blocks, keeping string literals visible. */
function stripComments(source: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < source.length) {
    if (source.startsWith('<#', i)) {
      const end = source.indexOf('#>', i);
      if (end < 0) break;
      out.push(source.slice(i, end + 2).replace(/[^\n]/g, ''));
      i = end + 2;
      continue;
    }
    const ch = source[i] as string;
    if (ch === '#') {
      const end = source.indexOf('\n', i);
      if (end < 0) break;
      i = end;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === '`') {
          j += 2;
          continue;
        }
        if (source[j] === quote) {
          if (source[j + 1] === quote) {
            j += 2;
            continue;
          }
          break;
        }
        j += 1;
      }
      out.push(source.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    out.push(ch);
    i += 1;
  }
  return out.join('');
}

/**
 * Absolute path to a PowerShell executable, or null.
 *
 * The bounded runner deliberately refuses a bare command name — it requires an existing file — so
 * the runtime cases need the resolved path, not the name that PATH happens to understand.
 */
function whichPowerShell(): string | null {
  for (const candidate of ['pwsh', 'powershell']) {
    const probe = spawnSync(
      candidate,
      ['-NoProfile', '-NonInteractive', '-Command', '[Console]::Out.Write((Get-Process -Id $PID).Path)'],
      { encoding: 'utf8', timeout: 20_000 }
    );
    if (probe.status !== 0) continue;
    const absolute = String(probe.stdout ?? '').trim();
    if (absolute.length > 0 && fs.existsSync(absolute)) return absolute;
  }
  return null;
}

/**
 * Executes a PowerShell script file and returns its stdout. The script is written by the caller;
 * the repository helper is dot-sourced from its real location, so the code under test is the
 * shipped one.
 */
function runPowerShellScript(shell: string, scriptPath: string, timeoutMs = 120_000) {
  return spawnSync(shell, ['-NoProfile', '-NonInteractive', '-File', scriptPath], {
    encoding: 'utf8',
    timeout: timeoutMs,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('W-02 / repository-owned process runner and toolchain resolver', () => {
  it('W-02-INF-01: the helper declares the bounded runner with the required properties', () => {
    const plain = stripComments(readText(COMMON));

    assert.ok(plain.includes('function Invoke-IipsProcess'), 'the runner must exist in the helper');
    assert.ok(plain.includes('System.Diagnostics.Process'), 'must use .NET Process, not Start-Process');
    assert.ok(plain.includes('UseShellExecute = $false'));
    assert.ok(plain.includes('RedirectStandardOutput = $true'));
    assert.ok(plain.includes('RedirectStandardError = $true'));
    assert.ok(plain.includes('RedirectStandardInput = $wantsStdin'));

    // Both reads begin before the wait: draining one pipe while the other fills deadlocks.
    const firstRead = plain.indexOf('ReadToEndAsync');
    const lastRead = plain.lastIndexOf('ReadToEndAsync');
    const firstWait = plain.indexOf('WaitForExit($TimeoutMilliseconds)');
    assert.ok(firstRead >= 0 && lastRead > firstRead, 'both streams must be read asynchronously');
    assert.ok(firstWait > lastRead, 'both async reads must start before the bounded wait');

    assert.ok(plain.includes('$process.WaitForExit($TimeoutMilliseconds)'), 'explicit timeout');
    assert.ok(plain.includes('$stdoutTask.Wait(5000)'), 'the async reads must be bounded after exit');
    assert.ok(plain.includes('PROCESS_OUTPUT_INCOMPLETE'), 'an inherited pipe must fail, not hang');
    assert.ok(plain.includes('$process.Kill()'), 'a timed-out child must be killed');
    assert.ok(plain.includes('$process.Dispose()'), 'the process must be disposed');
    assert.ok(plain.includes('PROCESS_TIMEOUT'), 'timeout must be a distinct, sanitized failure');
    assert.ok(plain.includes('PROCESS_START_FAILED'), 'start failure must be distinct');

    // No file-based capture and no shell in the middle.
    assert.ok(!plain.includes('-Wait '), 'no Start-Process -Wait (whole process tree, unbounded)');
    assert.ok(!plain.includes('Wait-Process'), 'no unbounded Wait-Process');
  });

  it('W-02-INF-02: the resolver is deterministic and uses no npm discovery', () => {
    const plain = stripComments(readText(COMMON));

    assert.ok(plain.includes('Get-Command node.exe -All'), 'candidates come from PATH enumeration');
    assert.ok(!/npm\s+exec/.test(plain), '`npm exec` must never be used for discovery');
    assert.ok(!plain.includes('IipsPreferredNodePath'), 'no preferred installation variable');
    assert.ok(!plain.includes("C:\\Node22"), 'no machine-specific installation path');
    assert.ok(!plain.includes('C:\\Users\\'), 'no personal absolute path');

    assert.ok(plain.includes("'npm.cmd'") && plain.includes("'npx.cmd'"), 'shims required beside node.exe');
    assert.ok(plain.includes('NODE_TOOLCHAIN_NOT_RESOLVED'), 'sanitized failure code');
    assert.ok(plain.includes('Test-IipsNodeVersionAtOrAboveFloor'), 'floor check retained');
    assert.ok(plain.includes("System32\\cmd.exe"), 'shims are started through cmd.exe by absolute path');
    assert.ok(plain.includes('/d /s /c'), 'cmd.exe /d /s /c quoting');
    assert.ok(plain.includes('Invoke-IipsCmdShim'), 'one place starts .cmd shims');
  });

  it('W-02-INF-03: the acceptance launcher uses the helper correctly and resolves it locally', () => {
    const plain = stripComments(readText(LAUNCHER));

    assert.ok(
      plain.includes("Join-Path (Join-Path $repoRoot 'windows-setup') 'Iips-Common.ps1'"),
      'the helper path must be repository-relative'
    );
    assert.ok(!plain.includes('C:\\Users\\'), 'no personal helper path');
    assert.ok(!plain.includes('Documents\\IIPS-checkout-startup'), 'no personal checkout path');

    // The reported crash: parameters the helper does not declare.
    for (const verb of ['Write-IipsInfo', 'Write-IipsOk', 'Write-IipsWarn']) {
      for (const line of plain.split('\n')) {
        if (line.includes(verb)) {
          assert.ok(!line.includes('-ForegroundColor'), `${verb} must not be given -ForegroundColor`);
        }
      }
    }

    // Bounded harness execution with stdin-only delivery and no stderr file.
    assert.ok(plain.includes('Invoke-IipsProcess'), 'the harness runs through the bounded runner');
    assert.ok(plain.includes('-StandardInput $stdinJson'), 'the values travel on stdin');
    assert.ok(plain.includes('StdErrByteLength'), 'stderr is reduced to a byte count');
    assert.ok(!plain.includes('| & $nodeExe'), 'no pipeline (unbounded) invocation');
    assert.ok(!plain.includes('harness.stderr.tmp'), 'no stderr temporary file');
    assert.ok(!plain.includes('$LASTEXITCODE'), 'no reliance on a pipeline exit code');
    assert.ok(plain.includes('PROCESS_TIMEOUT'), 'a timeout is reported as a failure, not a pass');
  });

  it('W-02-INF-04: the structural validator enforces the same contracts and can fail', (t) => {
    const python = spawnSync('python3', ['--version'], { encoding: 'utf8' });
    if (python.status !== 0) {
      t.skip('python3 is not available, so the repository structural validator cannot run here');
      return;
    }

    const validator = readText(VALIDATOR);
    assert.ok(validator.includes('no hardcoded Node.js installation path'));
    assert.ok(validator.includes('starts both async reads BEFORE the bounded wait'));
    assert.ok(validator.includes('helper call sites match the declared signatures'));

    for (const dir of ['windows-setup', 'windows-acceptance']) {
      const result = spawnSync('python3', [VALIDATOR, dir], { encoding: 'utf8', timeout: 120_000 });
      assert.strictEqual(
        result.status,
        0,
        `validator must pass for ${dir}:\n${result.stdout}\n${result.stderr}`
      );
      assert.match(result.stdout, /0 fail/);
    }
  });

  it('W-02-INF-05: the real runner is bounded, non-deadlocking and stdin-only (executed on request)', (t) => {
    // WHY THIS ONE IS OPT-IN.
    // It executes the actual PowerShell runner, so it needs PowerShell AND an interpreter that can
    // be resolved to an absolute path (the runner refuses a bare command name by design). Whether a
    // given CI image ships `pwsh` is not this repository's contract, and a suite that fails because
    // an image changed is not evidence of anything. The default run therefore stays deterministic
    // and this case is executed explicitly, on a host that actually has PowerShell:
    //
    //     IIPS_POWERSHELL_RUNTIME_TESTS=1 npm test            (bash / pwsh)
    //     $env:IIPS_POWERSHELL_RUNTIME_TESTS='1'; npm test    (Windows PowerShell 5.1)
    //
    // On the Windows host that second form is the authoritative PowerShell 5.1 evidence for this
    // runner. Nothing here is ever simulated: if the runner is not executed, this case skips.
    if (process.env.IIPS_POWERSHELL_RUNTIME_TESTS !== '1') {
      t.skip('set IIPS_POWERSHELL_RUNTIME_TESTS=1 on a host with PowerShell to execute the real runner');
      return;
    }
    const shell = whichPowerShell();
    if (shell === null) {
      t.skip('IIPS_POWERSHELL_RUNTIME_TESTS=1 was set but no PowerShell executable could be resolved');
      return;
    }

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'w02proc-'));
    const resultFile = path.join(dir, 'result.json');
    const payload = 'stdin-payload-W02-INF-05-6c1f2a';
    const pidFile = path.join(dir, 'child.pid');

    const q = (value: string): string => `'${value.replace(/'/g, "''")}'`;

    const childStdin = path.join(dir, 'child-stdin.ps1');
    fs.writeFileSync(
      childStdin,
      [
        '$value = [Console]::In.ReadToEnd()',
        '[Console]::Out.Write($value)',
        "$commandLine = ''",
        'try { $commandLine = [string][Environment]::CommandLine } catch { $commandLine = "" }',
        '[Console]::Error.Write($commandLine)',
      ].join('\n'),
      'utf8'
    );

    const childStreams = path.join(dir, 'child-streams.ps1');
    fs.writeFileSync(
      childStreams,
      [
        "$chunk = 'x' * 1024",
        'for ($i = 0; $i -lt 200; $i++) {',
        '    [Console]::Out.Write($chunk)',
        '    [Console]::Error.Write($chunk)',
        '}',
      ].join('\n'),
      'utf8'
    );

    const childSleep = path.join(dir, 'child-sleep.ps1');
    fs.writeFileSync(
      childSleep,
      [`[System.IO.File]::WriteAllText(${q(pidFile)}, [string]$PID)`, 'Start-Sleep -Seconds 30'].join('\n'),
      'utf8'
    );

    const suite = path.join(dir, 'suite.ps1');
    fs.writeFileSync(
      suite,
      [
        "$ErrorActionPreference = 'Stop'",
        `. ${q(COMMON)}`,
        '$results = @{}',
        // Each case is isolated: a failure is recorded (sanitized) and the rest still run, so one
        // problem cannot hide the others behind an opaque non-zero exit.
        'function Invoke-Case {',
        '    param([string] $Name, [scriptblock] $Body)',
        '    try {',
        '        $results[$Name] = & $Body',
        '    }',
        '    catch {',
        "        $results[$Name] = ('CASE_ERROR: ' + [string]$_.Exception.Message)",
        '    }',
        '}',
        // (10) non-zero exit is data
        `Invoke-Case 'nonZeroExit' { (Invoke-IipsProcess -FilePath ${q(shell)} -Arguments '-NoProfile -NonInteractive -Command "exit 3"' -TimeoutMilliseconds 60000).ExitCode }`,
        // (9) separate streams
        `Invoke-Case 'streams' { $r = Invoke-IipsProcess -FilePath ${q(shell)} -Arguments '-NoProfile -NonInteractive -Command "[Console]::Out.Write(''OUT''); [Console]::Error.Write(''ERR''); exit 0"' -TimeoutMilliseconds 60000; @{ out = $r.StdOut; err = $r.StdErr; errBytes = $r.StdErrByteLength } }`,
        // (9) both streams past a pipe buffer at the same time: only concurrent draining survives
        `Invoke-Case 'large' { $r = Invoke-IipsProcess -FilePath ${q(shell)} -Arguments '-NoProfile -NonInteractive -File ${q(childStreams)}' -TimeoutMilliseconds 120000; @{ out = $r.StdOut.Length; err = $r.StdErr.Length } }`,
        // (11) stdin delivery; the payload must not appear on the child's command line
        `Invoke-Case 'stdin' { $r = Invoke-IipsProcess -FilePath ${q(shell)} -Arguments '-NoProfile -NonInteractive -File ${q(childStdin)}' -TimeoutMilliseconds 60000 -StandardInput ${q(payload)}; @{ echo = $r.StdOut; commandLine = $r.StdErr } }`,
        // (7)(8) bounded timeout with a killed child
        'Invoke-Case "timeout" {',
        '    $started = [DateTime]::UtcNow',
        '    $timedOut = $false',
        '    try {',
        `        $null = Invoke-IipsProcess -FilePath ${q(shell)} -Arguments '-NoProfile -NonInteractive -File ${q(childSleep)}' -TimeoutMilliseconds 1500`,
        '    }',
        '    catch {',
        "        $timedOut = ([string]$_.Exception.Message).StartsWith('PROCESS_TIMEOUT')",
        '    }',
        '    @{ timedOut = $timedOut; elapsedMs = [int](([DateTime]::UtcNow - $started).TotalMilliseconds) }',
        '}',
        // (1)(3)(5) sanitized resolver failure where no node.exe/npm.cmd pair exists
        'Invoke-Case "resolver" {',
        '    try {',
        '        $null = Resolve-IipsNodeToolchain',
        '        "RESOLVED_UNEXPECTEDLY"',
        '    }',
        '    catch {',
        '        [string]$_.Exception.Message',
        '    }',
        '}',
        `$results | ConvertTo-Json -Compress -Depth 5 | Set-Content -LiteralPath ${q(resultFile)} -Encoding UTF8`,
        'exit 0',
      ].join('\n'),
      'utf8'
    );

    const run = runPowerShellScript(shell, suite, 240_000);
    const detail = `suite exit ${String(run.status)}\n${run.stdout}\n${run.stderr}`;
    assert.strictEqual(run.status, 0, `the PowerShell suite did not complete:\n${detail}`);
    assert.ok(fs.existsSync(resultFile), `the suite produced no result file:\n${detail}`);

    const results = JSON.parse(readText(resultFile).replace(/^\uFEFF/, '')) as Record<string, unknown>;
    const caseOf = (name: string): Record<string, unknown> => {
      const value = results[name];
      assert.ok(value !== undefined, `case '${name}' produced nothing:\n${detail}`);
      assert.strictEqual(
        typeof value,
        'object',
        `case '${name}' failed: ${String(value)}\n${detail}`
      );
      return value as Record<string, unknown>;
    };

    // (10) non-zero exit is data, not a crash
    assert.strictEqual(results.nonZeroExit, 3, `non-zero exit:\n${detail}`);

    // (9) stdout and stderr captured separately
    const streams = caseOf('streams');
    assert.strictEqual(streams.out, 'OUT');
    assert.strictEqual(streams.err, 'ERR');
    assert.strictEqual(streams.errBytes, 3);

    // (9) both streams past a pipe buffer concurrently
    const large = caseOf('large');
    assert.strictEqual(large.out, 200 * 1024, `large stdout:\n${detail}`);
    assert.strictEqual(large.err, 200 * 1024, `large stderr:\n${detail}`);

    // (11) stdin reaches the child and is absent from its command line
    const stdin = caseOf('stdin');
    assert.strictEqual(stdin.echo, payload, `stdin delivery:\n${detail}`);
    assert.ok(!String(stdin.commandLine).includes(payload), 'the payload must not be on argv');

    // (7)(8) the timeout fires and the child is terminated
    const timeout = caseOf('timeout');
    assert.strictEqual(timeout.timedOut, true, `a hung child must be PROCESS_TIMEOUT:\n${detail}`);
    assert.ok(Number(timeout.elapsedMs) < 30_000, 'the bounded wait must return, not hang');
    const pid = Number(readText(pidFile).trim());
    assert.ok(pid > 0, 'the child must have reported its pid before sleeping');
    let alive = true;
    try {
      process.kill(pid, 0);
    } catch {
      alive = false;
    }
    assert.strictEqual(alive, false, 'the timed-out child must be killed, not orphaned');

    // (1)(3)(5) the resolver fails sanitized: no node.exe/npm.cmd pair on this host
    const resolverMessage = String(caseOf('resolver'));
    assert.ok(resolverMessage.includes('NODE_TOOLCHAIN_NOT_RESOLVED'), `resolver:\n${detail}`);
    assert.ok(!resolverMessage.includes(os.homedir()), 'the failure must not leak a personal path');

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
