/**
 * Institutional Investment Platform System (IIPS)
 * DPAPI Child-Process Boundary (W-02 / D-1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Roadmap: DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11 (v1.1), W-02
 *
 * D-1 rejects a native DPAPI addon (new binary dependency), so the OS call is made by a
 * child process. W-02's communication rules are enforced here:
 *
 *  - the PowerShell script is STATIC and carries no data; it is passed with
 *    `-EncodedCommand` and never assembled from values;
 *  - request data travels on **stdin** only; the result is read from **stdout** only;
 *  - no temporary file is written, nothing is passed on argv, nothing is put in a shell
 *    string that could land in shell history (no shell is involved: `spawn` without one);
 *  - the script never echoes its input and reports a coarse failure category only, never
 *    the underlying exception text;
 *  - stderr is captured as a **byte count only** so it can classify a failure but can
 *    never be surfaced verbatim.
 *
 * Server-side only: never imported from browser code and never exported on
 * `iips-production-market-data/dhan-server`.
 */

import { spawn } from 'node:child_process';

export type DpapiProcessOperation = 'describe-acl' | 'unprotect';

export interface DpapiProcessRequest {
  readonly operation: DpapiProcessOperation;
  /** Serialised to JSON on stdin. Never secret plaintext for `describe-acl`. */
  readonly payload: Readonly<Record<string, unknown>>;
}

export type DpapiProcessOutcomeKind =
  | 'ok'
  | 'spawn-failed'
  | 'timeout'
  | 'non-zero-exit'
  | 'empty-output'
  | 'output-overflow';

/**
 * Process-level outcome. Deliberately carries no stderr TEXT: only its byte length, so a
 * caller can classify a failure and still has no way to surface the child's error output.
 */
export interface DpapiProcessOutcome {
  readonly kind: DpapiProcessOutcomeKind;
  readonly stdout: string;
  readonly stderrByteLength: number;
}

export type DpapiProcessRunner = (request: DpapiProcessRequest) => Promise<DpapiProcessOutcome>;

export const DEFAULT_DPAPI_PROCESS_TIMEOUT_MS = 15_000;
export const DEFAULT_DPAPI_MAX_STDOUT_BYTES = 2 * 1024 * 1024;

/**
 * ACL probe. Accepts `{ paths: string[] }` and returns per-path:
 * `{ exists, protected, onlyOwnerAndSystem, ownerIsCurrentUser }`.
 * Reports a coarse failure category only.
 */
const ACL_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  'try {',
  '  $raw = [Console]::In.ReadToEnd()',
  '  $req = $raw | ConvertFrom-Json',
  '  $current = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value',
  '  $items = @()',
  '  foreach ($p in @($req.paths)) {',
  '    if (-not (Test-Path -LiteralPath ([string]$p))) {',
  '      $items += @{ path = [string]$p; exists = $false; protected = $false; onlyOwnerAndSystem = $false; ownerIsCurrentUser = $false }',
  '      continue',
  '    }',
  '    $acl = Get-Acl -LiteralPath ([string]$p)',
  '    $ownerSid = $null',
  '    try { $ownerSid = (New-Object System.Security.Principal.NTAccount($acl.Owner)).Translate([System.Security.Principal.SecurityIdentifier]).Value } catch { $ownerSid = [string]$acl.Owner }',
  '    $onlyOwnerAndSystem = $true',
  '    foreach ($rule in $acl.Access) {',
  "      if ($rule.AccessControlType -ne 'Allow') { continue }",
  '      $sid = $null',
  '      try { $sid = $rule.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value } catch { $sid = $null }',
  "      if (($null -eq $sid) -or (($sid -ne $current) -and ($sid -ne 'S-1-5-18'))) { $onlyOwnerAndSystem = $false }",
  '    }',
  '    $items += @{ path = [string]$p; exists = $true; protected = [bool]$acl.AreAccessRulesProtected; onlyOwnerAndSystem = $onlyOwnerAndSystem; ownerIsCurrentUser = ($ownerSid -eq $current) }',
  '  }',
  "  @{ ok = $true; items = @($items) } | ConvertTo-Json -Compress -Depth 4",
  '} catch {',
  "  @{ ok = $false; kind = 'ACL_READ_FAILED' } | ConvertTo-Json -Compress",
  '}',
].join('\n');

/**
 * DPAPI unprotect (user scope). Accepts `{ ciphertextB64 }` and returns
 * `{ ok: true, plaintextB64 }` — or `{ ok: false, kind: 'DPAPI_UNPROTECT_FAILED' }`
 * with no exception text, because a failure message can carry local detail.
 */
const UNPROTECT_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  'try {',
  '  Add-Type -AssemblyName System.Security',
  '  $raw = [Console]::In.ReadToEnd()',
  '  $req = $raw | ConvertFrom-Json',
  '  $blob = [Convert]::FromBase64String([string]$req.ciphertextB64)',
  '  $bytes = [System.Security.Cryptography.ProtectedData]::Unprotect($blob, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)',
  '  @{ ok = $true; plaintextB64 = [Convert]::ToBase64String($bytes) } | ConvertTo-Json -Compress',
  '} catch {',
  "  @{ ok = $false; kind = 'DPAPI_UNPROTECT_FAILED' } | ConvertTo-Json -Compress",
  '}',
].join('\n');

const SCRIPT_BY_OPERATION: Readonly<Record<DpapiProcessOperation, string>> = Object.freeze({
  'describe-acl': ACL_SCRIPT,
  unprotect: UNPROTECT_SCRIPT,
});

/**
 * The static script for an operation, encoded for `-EncodedCommand`.
 * Contains no data and no secret: only the fixed program text.
 */
export function encodeDpapiScript(operation: DpapiProcessOperation): string {
  return Buffer.from(SCRIPT_BY_OPERATION[operation], 'utf16le').toString('base64');
}

/** The exact argument vector used to invoke PowerShell. No data, no paths, no secrets. */
export function dpapiPowerShellArgs(operation: DpapiProcessOperation): readonly string[] {
  return [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-EncodedCommand',
    encodeDpapiScript(operation),
  ];
}

export interface PowerShellDpapiRunnerOptions {
  /** Defaults to `powershell.exe` (Windows PowerShell 5.1, present on every Windows host). */
  readonly powershellExecutable?: string;
  readonly timeoutMs?: number;
  readonly maxStdoutBytes?: number;
}

/**
 * Default runner: spawns a static PowerShell program, writes the request JSON to stdin,
 * reads the result JSON from stdout, and returns a classified outcome.
 *
 * Failures are classified, never explained: no text from the child reaches the caller.
 */
export function createPowerShellDpapiProcessRunner(
  options: PowerShellDpapiRunnerOptions = {}
): DpapiProcessRunner {
  const executable = options.powershellExecutable ?? 'powershell.exe';
  const timeoutMs = options.timeoutMs ?? DEFAULT_DPAPI_PROCESS_TIMEOUT_MS;
  const maxStdoutBytes = options.maxStdoutBytes ?? DEFAULT_DPAPI_MAX_STDOUT_BYTES;

  return (request: DpapiProcessRequest): Promise<DpapiProcessOutcome> => {
    return new Promise<DpapiProcessOutcome>((resolve) => {
      let settled = false;
      const finish = (outcome: DpapiProcessOutcome): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(outcome);
      };

      let child;
      try {
        child = spawn(executable, [...dpapiPowerShellArgs(request.operation)], {
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
          shell: false,
        });
      } catch {
        resolve({ kind: 'spawn-failed', stdout: '', stderrByteLength: 0 });
        return;
      }

      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch {
          /* already gone */
        }
        finish({ kind: 'timeout', stdout: '', stderrByteLength: 0 });
      }, timeoutMs);

      let stdout = '';
      let stdoutBytes = 0;
      let stderrBytes = 0;

      child.stdout?.setEncoding('utf8');
      child.stdout?.on('data', (chunk: string) => {
        if (settled) return;
        stdoutBytes += Buffer.byteLength(chunk);
        if (stdoutBytes > maxStdoutBytes) {
          try {
            child.kill('SIGKILL');
          } catch {
            /* already gone */
          }
          finish({ kind: 'output-overflow', stdout: '', stderrByteLength: stderrBytes });
          return;
        }
        stdout += chunk;
      });

      child.stderr?.on('data', (chunk: Buffer | string) => {
        // Count only. The text is deliberately discarded so it can never be surfaced.
        stderrBytes += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
      });

      child.on('error', () => {
        finish({ kind: 'spawn-failed', stdout: '', stderrByteLength: stderrBytes });
      });

      child.on('close', (code: number | null) => {
        if (code !== 0) {
          finish({ kind: 'non-zero-exit', stdout: '', stderrByteLength: stderrBytes });
          return;
        }
        if (stdout.trim().length === 0) {
          finish({ kind: 'empty-output', stdout: '', stderrByteLength: stderrBytes });
          return;
        }
        finish({ kind: 'ok', stdout, stderrByteLength: stderrBytes });
      });

      try {
        child.stdin?.end(JSON.stringify(request.payload), 'utf8');
      } catch {
        try {
          child.kill('SIGKILL');
        } catch {
          /* already gone */
        }
        finish({ kind: 'spawn-failed', stdout: '', stderrByteLength: stderrBytes });
      }
    });
  };
}
