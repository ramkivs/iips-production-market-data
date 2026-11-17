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
/**
 * The host's node.exe, but only when npm.cmd and npx.cmd sit beside it.
 *
 * The resolver's contract is a single installation, so an explicit path is only a valid specimen
 * when the trio exists. On Windows CI that is exactly the operator's situation; on Linux there is
 * no node.exe at all and the case is generated from a temporary directory instead.
 */
export function hostExplicitNodePath(): string | undefined {
  const candidate = path.join(path.dirname(process.execPath), 'node.exe');
  const directory = path.dirname(candidate);
  if (!fs.existsSync(candidate)) return undefined;
  if (!fs.existsSync(path.join(directory, 'npm.cmd'))) return undefined;
  if (!fs.existsSync(path.join(directory, 'npx.cmd'))) return undefined;
  return candidate;
}

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
 * Win32 command-line quoting (CommandLineToArgvW rules): backslashes before a quote are doubled,
 * inner quotes are escaped, and a token containing whitespace is wrapped in quotes.
 *
 * This exists because the previous version of this file built the interpreter's `-Arguments`
 * string with a PowerShell literal inside a PowerShell literal. That produced a nested `'`
 * sequence which PowerShell re-parsed as several arguments, so the child was started with a
 * command line that differed from the one intended — the only construct in this suite that could
 * (and on the Windows host did) fail at process creation.
 */
export function quoteWin32(value: string): string {
  if (value.length === 0) return '""';
  if (!/[\s"]/.test(value)) return value;
  let out = '"';
  let backslashes = 0;
  for (const character of value) {
    if (character === '\\') {
      backslashes += 1;
      continue;
    }
    if (character === '"') {
      out += '\\'.repeat(backslashes * 2 + 1) + '"';
      backslashes = 0;
      continue;
    }
    if (backslashes > 0) {
      out += '\\'.repeat(backslashes);
      backslashes = 0;
    }
    out += character;
  }
  if (backslashes > 0) out += '\\'.repeat(backslashes * 2);
  return out + '"';
}

/**
 * A PowerShell single-quoted literal, safe to embed in a generated script: the only character
 * that needs doubling is the single quote itself. Used for the payload and for data paths.
 */
export function psLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * A static child program encoded for `-EncodedCommand` (UTF-16LE base64), exactly as the
 * production DPAPI child boundary encodes its programs.
 */
export function encodeCommand(script: string): string {
  return Buffer.from(script, 'utf16le').toString('base64');
}

/**
 * The complete argument string for a child interpreter.
 *
 * No file path and no payload ever appear here: the program is inline and encoded, so
 * `CreateProcess` receives a command line that cannot vary with quoting of paths, and the
 * "nothing on argv" property becomes structural rather than incidental.
 */
export function interpreterArguments(script: string): string {
  return `-NoProfile -NonInteractive -EncodedCommand ${encodeCommand(script)}`;
}

export interface AcceptanceSuiteInputs {
  readonly shellPath: string;
  readonly commonPath: string;
  readonly payload: string;
  readonly pidFile: string;
  readonly resultFile: string;
  /**
   * The host's own node.exe, when one exists beside npm.cmd and npx.cmd. It is supplied to the
   * resolver EXACTLY as the operator supplies -NodeExecutable, so the propagation path is executed
   * rather than inspected. Absent on hosts that have no colocated trio.
   */
  readonly explicitNodePath?: string;
}

/**
 * The PowerShell suite that drives the real runner, as a single string.
 *
 * Kept as a pure builder so its TEXT can be asserted on any platform — the previous inline
 * version embedded a PowerShell literal inside a PowerShell literal, which produced a nested
 * quote sequence and a child command line that differed from the intended one. Every
 * `-Arguments` value here is one single-quoted literal of a complete argument string, and every
 * child program is inline and encoded, so no path and no payload can be re-split by a parser.
 */
export function buildAcceptanceSuite(inputs: AcceptanceSuiteInputs): string {
  const q = (value: string): string => psLiteral(value);

  const stdinProgram = [
    '$value = [Console]::In.ReadToEnd()',
    '[Console]::Out.Write($value)',
    "$commandLine = ''",
    'try { $commandLine = [string][Environment]::CommandLine } catch { $commandLine = "" }',
    '[Console]::Error.Write($commandLine)',
  ].join('\n');

  const streamsProgram = [
    "$chunk = 'x' * 1024",
    'for ($i = 0; $i -lt 200; $i++) {',
    '    [Console]::Out.Write($chunk)',
    '    [Console]::Error.Write($chunk)',
    '}',
  ].join('\n');

  const sleepProgram = [
    `[System.IO.File]::WriteAllText(${q(inputs.pidFile)}, [string]$PID)`,
    'Start-Sleep -Seconds 30',
  ].join('\n');

  return [
    "$ErrorActionPreference = 'Stop'",
    `. ${q(inputs.commonPath)}`,
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
    `Invoke-Case 'nonZeroExit' { (Invoke-IipsProcess -FilePath ${q(inputs.shellPath)} -Arguments ${q(interpreterArguments('exit 3'))} -TimeoutMilliseconds 60000).ExitCode }`,
    // (9) separate streams
    `Invoke-Case 'streams' { $r = Invoke-IipsProcess -FilePath ${q(inputs.shellPath)} -Arguments ${q(interpreterArguments("[Console]::Out.Write('OUT'); [Console]::Error.Write('ERR')"))} -TimeoutMilliseconds 60000; @{ out = $r.StdOut; err = $r.StdErr; errBytes = $r.StdErrByteLength } }`,
    // (9) both streams past a pipe buffer at the same time: only concurrent draining survives
    `Invoke-Case 'large' { $r = Invoke-IipsProcess -FilePath ${q(inputs.shellPath)} -Arguments ${q(interpreterArguments(streamsProgram))} -TimeoutMilliseconds 120000; @{ out = $r.StdOut.Length; err = $r.StdErr.Length } }`,
    // (11) stdin delivery; the payload must not appear on the child's command line
    `Invoke-Case 'stdin' { $r = Invoke-IipsProcess -FilePath ${q(inputs.shellPath)} -Arguments ${q(interpreterArguments(stdinProgram))} -TimeoutMilliseconds 60000 -StandardInput ${q(inputs.payload)}; @{ echo = $r.StdOut; commandLine = $r.StdErr } }`,
    // (7)(8) bounded timeout with a killed child
    'Invoke-Case "timeout" {',
    '    $started = [DateTime]::UtcNow',
    '    $timedOut = $false',
    '    try {',
    `        $null = Invoke-IipsProcess -FilePath ${q(inputs.shellPath)} -Arguments ${q(interpreterArguments(sleepProgram))} -TimeoutMilliseconds 1500`,
    '    }',
    '    catch {',
    "        $timedOut = ([string]$_.Exception.Message).StartsWith('PROCESS_TIMEOUT')",
    '    }',
    '    @{ timedOut = $timedOut; elapsedMs = [int](([DateTime]::UtcNow - $started).TotalMilliseconds) }',
    '}',
    // (1)(3)(5) the resolver on THIS host: either a co-located trio, or a sanitized failure
    'Invoke-Case "resolver" {',
    '    try {',
    '        $toolchain = Resolve-IipsNodeToolchain',
    '        @{ resolved = $true; node = $toolchain.NodeExe; npm = $toolchain.NpmCmd; npx = $toolchain.NpxCmd }',
    '    }',
    '    catch {',
    '        @{ resolved = $false; message = [string]$_.Exception.Message }',
    '    }',
    '}',
    // (5) sanitization is proven deterministically: a path that cannot exist must fail with reason
    // codes only, never with the path that was asked for.
    'Invoke-Case "resolverNoShims" {',
    "    $probeDir = Join-Path ([System.IO.Path]::GetTempPath()) ('iips-noshims-' + [guid]::NewGuid().ToString('N'))",
    '    $null = New-Item -ItemType Directory -Path $probeDir -Force',
    "    $null = Set-Content -LiteralPath (Join-Path $probeDir 'node.exe') -Value 'placeholder' -Encoding ASCII",
    '    try {',
    '        $null = Resolve-IipsNodeToolchain -NodeExecutable (Join-Path $probeDir "node.exe")',
    '        @{ threw = $false; message = ""; dir = $probeDir }',
    '    }',
    '    catch {',
    '        @{ threw = $true; message = [string]$_.Exception.Message; dir = $probeDir }',
    '    }',
    '}',
    // the npx half of the co-location rule: node.exe + npm.cmd but no npx.cmd
    'Invoke-Case "resolverNoNpx" {',
    "    $probeDir = Join-Path ([System.IO.Path]::GetTempPath()) ('iips-nonpx-' + [guid]::NewGuid().ToString('N'))",
    '    $null = New-Item -ItemType Directory -Path $probeDir -Force',
    "    $null = Set-Content -LiteralPath (Join-Path $probeDir 'node.exe') -Value 'placeholder' -Encoding ASCII",
    "    $null = Set-Content -LiteralPath (Join-Path $probeDir 'npm.cmd') -Value '@echo off' -Encoding ASCII",
    '    try {',
    '        $null = Resolve-IipsNodeToolchain -NodeExecutable (Join-Path $probeDir "node.exe")',
    '        @{ threw = $false; message = ""; dir = $probeDir }',
    '    }',
    '    catch {',
    '        @{ threw = $true; message = [string]$_.Exception.Message; dir = $probeDir }',
    '    }',
    '}',
    'Invoke-Case "resolverMissing" {',
    "    $absent = Join-Path ([System.IO.Path]::GetTempPath()) 'iips-absent-toolchain-7d3e'",
    '    try {',
    '        $null = Resolve-IipsNodeToolchain -NodeExecutable (Join-Path $absent \"node.exe\")',
    '        @{ threw = $false; message = \"\"; absent = $absent }',
    '    }',
    '    catch {',
    '        @{ threw = $true; message = [string]$_.Exception.Message; absent = $absent }',
    '    }',
    '}',
    ...(inputs.explicitNodePath === undefined
      ? []
      : [
          // The operator's exact call shape: -NodeExecutable <full path to node.exe>.
          `Invoke-Case 'resolverExplicit' { $toolchain = Resolve-IipsNodeToolchain -NodeExecutable ${q(inputs.explicitNodePath)}; @{ node = $toolchain.NodeExe; npm = $toolchain.NpmCmd; npx = $toolchain.NpxCmd; version = $toolchain.NodeVersion } }`,
        ]),
    `$results | ConvertTo-Json -Compress -Depth 5 | Set-Content -LiteralPath ${q(inputs.resultFile)} -Encoding UTF8`,
    'exit 0',
  ].join('\n');
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
    assert.ok(
      plain.includes('PROCESS_EXECUTABLE_NOT_FOUND'),
      'a missing executable must not be reported as a refused process creation'
    );
    // The native code is the only evidence that distinguishes file-not-found from access-denied
    // from an invalid command line; discarding it leaves an opaque failure.
    assert.ok(plain.includes('Get-IipsStartFailureDetail'), 'the start failure must be classified');
    assert.ok(plain.includes('NativeErrorCode'), 'the Win32 native code must be reported');
    assert.ok(plain.includes('win32='), 'the native code must be visible in the failure message');
    assert.ok(
      !/throw 'PROCESS_START_FAILED'\s*$/.test(plain.split('\n').filter((line) => line.includes("throw 'PROCESS_START_FAILED'")).join('\n')),
      'the bare, evidence-free PROCESS_START_FAILED must not return'
    );

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

  it('W-02-INF-06: the child command lines are built correctly and carry no data', () => {
    // Pure, so it runs everywhere — including the hosts where the runtime case cannot.
    assert.strictEqual(psLiteral("a'b"), "'a''b'");
    assert.strictEqual(psLiteral('plain-value'), "'plain-value'");
    assert.strictEqual(quoteWin32('plain'), 'plain');
    assert.strictEqual(quoteWin32(''), '""');
    assert.strictEqual(quoteWin32('C:\\Program Files\\PowerShell\\7\\pwsh.exe'), '"C:\\Program Files\\PowerShell\\7\\pwsh.exe"');
    assert.strictEqual(quoteWin32('say "hi"'), '"say \\"hi\\""');
    assert.strictEqual(quoteWin32('trailing\\'), 'trailing\\');
    assert.strictEqual(quoteWin32('a b\\'), '"a b\\\\"');

    const script = "Write-Output 'hello'";
    assert.strictEqual(Buffer.from(encodeCommand(script), 'base64').toString('utf16le'), script);

    const args = interpreterArguments(script);
    assert.ok(args.startsWith('-NoProfile -NonInteractive -EncodedCommand '));
    assert.ok(!args.includes('.ps1'), 'no script path may appear on the child command line');
    assert.ok(!/[\s"]/.test(args.split(' ').pop() as string), 'the encoded program is a single token');
    assert.strictEqual(
      Buffer.from(args.split(' ').pop() as string, 'base64').toString('utf16le'),
      script
    );

    // The generated suite text: this is the guard that would have caught the nested-quote defect
    // that failed at process creation on the Windows host.
    const payload = 'stdin-payload-W02-INF-06-9a1c';
    const generated = buildAcceptanceSuite({
      shellPath: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      commonPath: 'C:\\repo\\windows-setup\\Iips-Common.ps1',
      payload,
      pidFile: 'C:\\Temp\\child.pid',
      resultFile: 'C:\\Temp\\result.json',
    });

    assert.ok(!/-File\s/.test(generated), 'no child program may be passed as -File');
    assert.ok(!/-Command\s/.test(generated), 'no child program may be passed as -Command text');

    // Every -Arguments value is ONE single-quoted literal: no nested quotes to re-split.
    const argumentLiterals = generated.match(/-Arguments '[^']*'/g) ?? [];
    assert.strictEqual(argumentLiterals.length, 5, 'each runner call passes one quoted argument string');
    for (const literal of argumentLiterals) {
      assert.ok(
        literal.startsWith("-Arguments '-NoProfile -NonInteractive -EncodedCommand "),
        `unexpected argument literal: ${literal.slice(0, 60)}`
      );
      assert.ok(!/[\\/]/.test(literal), 'no path may appear inside a child command line');
    }

    // An odd number of quotes is a parse error waiting to happen.
    assert.strictEqual((generated.match(/'/g) ?? []).length % 2, 0, 'quotes must be balanced');

    // The payload appears exactly once, as the stdin value — never inside a command line.
    assert.strictEqual(generated.split(payload).length - 1, 1, 'the payload must appear once, on stdin');
    assert.ok(generated.includes(`-StandardInput '${payload}'`), 'the payload must be the stdin argument');
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
    const pidFile = path.join(dir, 'child.pid');
    const payload = 'stdin-payload-W02-INF-05-6c1f2a';

    const suite = path.join(dir, 'suite.ps1');
    fs.writeFileSync(
      suite,
      buildAcceptanceSuite({
        shellPath: shell,
        commonPath: COMMON,
        payload,
        pidFile,
        resultFile,
        explicitNodePath: hostExplicitNodePath(),
      }),
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

    // (10) non-zero exit is data, not a crash — the child reports 3 through the runner.
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

    // (1)(3)(5) a successful resolution is a single installation: node.exe, npm.cmd and npx.cmd
    // in ONE directory. A failure is sanitized: reason codes only, no path, no personal data.
    const resolver = caseOf('resolver');
    if (resolver.resolved === true) {
      const trio = [resolver.node, resolver.npm, resolver.npx].map((value) => String(value));
      for (const member of trio) assert.ok(fs.existsSync(member), `the toolchain must exist: ${member}`);
      const directory = path.dirname(trio[0]);
      assert.strictEqual(path.dirname(trio[1]), directory, 'npm.cmd must sit beside node.exe');
      assert.strictEqual(path.dirname(trio[2]), directory, 'npx.cmd must sit beside node.exe');
    } else {
      const message = String(resolver.message);
      assert.ok(message.startsWith('NODE_TOOLCHAIN_NOT_RESOLVED'), `resolver:\n${detail}`);
      assert.ok(!message.includes(os.homedir()), 'the failure must not leak a personal path');
    }

    // (5) sanitization, deterministically: the path that was asked for must not come back out.
    const missing = caseOf('resolverMissing');
    assert.strictEqual(missing.threw, true, `an absent toolchain must fail:\n${detail}`);
    const missingMessage = String(missing.message);
    assert.ok(missingMessage.startsWith('NODE_TOOLCHAIN_NOT_RESOLVED'), `resolverMissing:\n${detail}`);
    // The explicit path was USED: the candidate was examined and rejected as a non-file, rather
    // than the resolver ignoring it and reporting a PATH problem.
    assert.ok(
      missingMessage.includes('node-not-a-file'),
      `the explicit -NodeExecutable must reach the candidate loop:\n${detail}`
    );
    assert.ok(!missingMessage.includes(String(missing.absent)), 'the failure must not echo the path');
    assert.ok(!missingMessage.includes(os.homedir()), 'the failure must not leak a personal path');

    // (3)(4) co-location is validated beside the SUPPLIED executable, not somewhere else: a
    // directory holding only node.exe has no shims, and each missing half is named.
    const noShims = caseOf('resolverNoShims');
    assert.strictEqual(noShims.threw, true, `node.exe without shims must fail:\n${detail}`);
    const noShimsMessage = String(noShims.message);
    assert.ok(noShimsMessage.includes('npm-missing-beside-node'), `resolverNoShims:\n${detail}`);
    assert.ok(!noShimsMessage.includes(String(noShims.dir)), 'the failure must not echo the directory');

    const noNpx = caseOf('resolverNoNpx');
    assert.strictEqual(noNpx.threw, true, `node.exe + npm.cmd without npx.cmd must fail:\n${detail}`);
    const noNpxMessage = String(noNpx.message);
    assert.ok(noNpxMessage.includes('npx-missing-beside-node'), `resolverNoNpx:\n${detail}`);
    assert.ok(noNpxMessage.includes('npm-missing-beside-node') === false, 'npm.cmd WAS present beside node.exe');
    assert.ok(!noNpxMessage.includes(String(noNpx.dir)), 'the failure must not echo the directory');

    // (1)(2)(3) the operator's exact call shape, executed: -NodeExecutable <full path to node.exe>
    // resolves THAT installation, derives its siblings and reports its version.
    const explicit = hostExplicitNodePath();
    if (explicit !== undefined) {
      const resolved = caseOf('resolverExplicit');
      assert.strictEqual(path.resolve(String(resolved.node)), path.resolve(explicit), `resolverExplicit:\n${detail}`);
      assert.strictEqual(path.dirname(String(resolved.npm)), path.dirname(explicit), 'npm.cmd comes from that directory');
      assert.strictEqual(path.dirname(String(resolved.npx)), path.dirname(explicit), 'npx.cmd comes from that directory');
      assert.match(String(resolved.version), /^v?\d+\.\d+\.\d+/, 'the resolved Node.js version is recorded');
    }

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('W-02-INF-07: an explicitly supplied node.exe is propagated, and every script-scope constant it needs is defined', () => {
    const helper = readText(COMMON);
    const helperCode = stripComments(helper);
    const launcher = readText(LAUNCHER);
    const launcherCode = stripComments(launcher);

    // (1) THE ROOT CAUSE OF THE TWO FAILED ACCEPTANCE RUNS.
    // `$script:IipsVersionProbeTimeoutMilliseconds` was read by the resolver but never assigned.
    // Set-StrictMode -Version Latest throws on that read while the CALL'S ARGUMENTS ARE EVALUATED,
    // i.e. before Invoke-IipsProcess runs, so every candidate - including one passed with
    // -NodeExecutable - was discarded and the resolver reported NODE_TOOLCHAIN_NOT_RESOLVED.
    const probeBound = /^\$script:IipsVersionProbeTimeoutMilliseconds = ([0-9]+)$/m.exec(helperCode);
    assert.ok(probeBound !== null, 'the version-probe bound must be defined at script scope');
    assert.ok(Number(probeBound[1]) > 0, 'the probe bound must be a positive number of milliseconds');
    assert.strictEqual(
      (helperCode.match(/\$script:IipsVersionProbeTimeoutMilliseconds/g) ?? []).length,
      4,
      'one definition and three probe uses (node, npm, npx)'
    );

    const readVariables = new Set(
      Array.from(helperCode.matchAll(/\$script:([A-Za-z_][A-Za-z0-9_]*)/g), (match) => match[1])
    );
    const writtenVariables = new Set(
      Array.from(helperCode.matchAll(/\$script:([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|\+=)/g), (match) => match[1])
    );
    const unset = [...readVariables].filter((name) => !writtenVariables.has(name)).sort();
    assert.deepStrictEqual(unset, [], 'a $script: read with no assignment throws under StrictMode');

    // (2) The explicit executable is the FIRST candidate, and its directory is where the shims are
    // looked for - so the caller's installation is the one that gets verified.
    assert.match(
      helperCode,
      /if \(-not \[string\]::IsNullOrWhiteSpace\(\$NodeExecutable\)\) \{\s*\$nodeCandidates\.Add\(\$NodeExecutable\)/,
      'an explicit -NodeExecutable must be the first candidate'
    );
    assert.ok(
      helperCode.includes("$installDirectory = Split-Path -Parent $nodePath"),
      'npm.cmd and npx.cmd are derived from the supplied executable\'s directory'
    );
    assert.ok(helperCode.includes("$npmPath = Join-Path $installDirectory 'npm.cmd'"), 'npm.cmd is beside node.exe');
    assert.ok(helperCode.includes("$npxPath = Join-Path $installDirectory 'npx.cmd'"), 'npx.cmd is beside node.exe');
    assert.ok(
      helperCode.includes("if (-not (Test-Path -LiteralPath $npmPath -PathType Leaf))") &&
        helperCode.includes("$reasons.Add('npm-missing-beside-node')"),
      'a missing npm.cmd is a named failure, not a silent skip'
    );
    assert.ok(
      helperCode.includes("if (-not (Test-Path -LiteralPath $npxPath -PathType Leaf))") &&
        helperCode.includes("$reasons.Add('npx-missing-beside-node')"),
      'a missing npx.cmd is a named failure, not a silent skip'
    );
    // Deterministic discovery is untouched when nothing is supplied.
    assert.ok(
      helperCode.includes('Get-Command node.exe -All') && helperCode.includes("$reasons.Add('node-not-on-path')"),
      'PATH discovery remains the fallback when no executable is supplied'
    );

    // (3) The launcher declares the parameter, propagates it verbatim, keeps the resolver's own
    // reason when it fails, and records the resolved version.
    assert.ok(launcherCode.includes("[string] $NodeExecutable = ''"), 'the launcher declares -NodeExecutable');
    assert.ok(
      launcherCode.includes('Resolve-IipsNodeToolchain -NodeExecutable $NodeExecutable'),
      'the launcher propagates -NodeExecutable verbatim'
    );
    assert.ok(
      launcherCode.includes('$toolchainError = [string]$_.Exception.Message'),
      'the resolver\'s sanitized reason is recorded, not replaced by a canned line'
    );
    assert.ok(
      /Add-AcceptanceResult[^\n]*-Output \$toolchainFailure/.test(launcherCode),
      'the W02-WIN-01 failure row reports that reason'
    );
    assert.ok(
      launcherCode.includes("$nodeVersion = Get-FieldValue -Object $toolchain -Name 'NodeVersion'"),
      'the resolved Node.js version is captured'
    );
    assert.ok(
      launcherCode.includes("$nodeField = $NodeExe + ' (node ' + $NodeVersion + ')'"),
      'the evidence header records the version, not just the path'
    );
    assert.ok(
      (launcherCode.match(/-NodeVersion \$nodeVersion/g) ?? []).length >= 3,
      'every evidence log written carries the version'
    );
  });
});
