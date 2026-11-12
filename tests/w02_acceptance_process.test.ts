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

function whichPowerShell(): string | null {
  for (const candidate of ['pwsh', 'powershell']) {
    const probe = spawnSync(candidate, ['-NoProfile', '-NonInteractive', '-Command', 'exit 0'], {
      encoding: 'utf8',
      timeout: 20_000,
    });
    if (probe.status === 0) return candidate;
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

  it('W-02-INF-05: the real runner is bounded, non-deadlocking and stdin-only (needs PowerShell)', (t) => {
    const shell = whichPowerShell();
    if (shell === null) {
      t.skip('no PowerShell on this host; the runner is verified structurally and on the Windows acceptance run');
      return;
    }
    if (process.platform === 'win32') {
      // The runner requires an absolute executable path (that is the point). Driving Windows
      // PowerShell from here would exercise the Windows boundary, which belongs to the acceptance
      // run, not to this suite.
      t.skip('the runtime cases run on a POSIX host with PowerShell; Windows behaviour is acceptance-run territory');
      return;
    }

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'w02proc-'));
    const resultFile = path.join(dir, 'result.json');
    const payload = 'stdin-payload-W02-INF-05-6c1f2a';
    const pidFile = path.join(dir, 'child.pid');

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
      [`[System.IO.File]::WriteAllText('${pidFile.replace(/'/g, "''")}', [string]$PID)`, 'Start-Sleep -Seconds 30'].join(
        '\n'
      ),
      'utf8'
    );

    const suite = path.join(dir, 'suite.ps1');
    fs.writeFileSync(
      suite,
      [
        "$ErrorActionPreference = 'Stop'",
        `$common = '${COMMON.replace(/'/g, "''")}'`,
        `. $common`,
        '$results = @{}',
        // non-zero exit and separate streams
        `$r = Invoke-IipsProcess -FilePath '${shell}' -Arguments '-NoProfile -NonInteractive -Command "exit 3"' -TimeoutMilliseconds 60000`,
        '$results.nonZeroExit = $r.ExitCode',
        `$r = Invoke-IipsProcess -FilePath '${shell}' -Arguments '-NoProfile -NonInteractive -Command "[Console]::Out.Write(''OUT''); [Console]::Error.Write(''ERR''); exit 0"' -TimeoutMilliseconds 60000`,
        '$results.streamsOut = $r.StdOut',
        '$results.streamsErr = $r.StdErr',
        '$results.streamsErrBytes = $r.StdErrByteLength',
        // both streams well past a pipe buffer, captured concurrently
        `$r = Invoke-IipsProcess -FilePath '${shell}' -Arguments '-NoProfile -NonInteractive -File "${childStreams}"' -TimeoutMilliseconds 120000`,
        '$results.largeOut = $r.StdOut.Length',
        '$results.largeErr = $r.StdErr.Length',
        // stdin delivery, and the payload must not be on the child command line
        `$r = Invoke-IipsProcess -FilePath '${shell}' -Arguments '-NoProfile -NonInteractive -File "${childStdin}"' -TimeoutMilliseconds 60000 -StandardInput '${payload}'`,
        '$results.stdinEcho = $r.StdOut',
        '$results.stdinCommandLine = $r.StdErr',
        // bounded timeout, child killed
        '$started = [DateTime]::UtcNow',
        '$timedOut = $false',
        'try {',
        `    $null = Invoke-IipsProcess -FilePath '${shell}' -Arguments '-NoProfile -NonInteractive -File "${childSleep}"' -TimeoutMilliseconds 1500`,
        '}',
        'catch {',
        "    $timedOut = ([string]$_.Exception.Message).StartsWith('PROCESS_TIMEOUT')",
        '}',
        '$results.timedOut = $timedOut',
        '$results.elapsedMs = [int](([DateTime]::UtcNow - $started).TotalMilliseconds)',
        // sanitized resolver failure (no node.exe/npm.cmd on this host)
        '$resolverMessage = ""',
        'try {',
        '    $null = Resolve-IipsNodeToolchain',
        '}',
        'catch {',
        '    $resolverMessage = [string]$_.Exception.Message',
        '}',
        '$results.resolverMessage = $resolverMessage',
        `$results | ConvertTo-Json -Compress | Set-Content -LiteralPath '${resultFile.replace(/'/g, "''")}' -Encoding UTF8`,
      ].join('\n'),
      'utf8'
    );

    const run = runPowerShellScript(shell, suite, 240_000);
    assert.strictEqual(run.status, 0, `suite failed:\n${run.stdout}\n${run.stderr}`);

    const results = JSON.parse(readText(resultFile).replace(/^\uFEFF/, '')) as Record<string, unknown>;

    // (10) non-zero exit is data, not a crash
    assert.strictEqual(results.nonZeroExit, 3);

    // (9) stdout and stderr captured separately
    assert.strictEqual(results.streamsOut, 'OUT');
    assert.strictEqual(results.streamsErr, 'ERR');
    assert.strictEqual(results.streamsErrBytes, 3);

    // (9) both streams past a pipe buffer at the same time: only async draining survives this
    assert.strictEqual(results.largeOut, 200 * 1024);
    assert.strictEqual(results.largeErr, 200 * 1024);

    // (11) stdin reaches the child and is absent from its command line
    assert.strictEqual(results.stdinEcho, payload);
    assert.ok(!String(results.stdinCommandLine).includes(payload), 'the payload must not be on argv');

    // (7)(8) the timeout fires and the child is terminated
    assert.strictEqual(results.timedOut, true, 'a hung child must be reported as PROCESS_TIMEOUT');
    assert.ok(Number(results.elapsedMs) < 30_000, 'the bounded wait must return, not hang');
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
    const resolverMessage = String(results.resolverMessage);
    assert.ok(resolverMessage.includes('NODE_TOOLCHAIN_NOT_RESOLVED'));
    assert.ok(!resolverMessage.includes(os.homedir()), 'the failure must not leak a personal path');

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
