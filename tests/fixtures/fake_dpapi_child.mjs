#!/usr/bin/env node
/**
 * W-02 test fixture: a stand-in child process that speaks the DPAPI runner protocol
 * (request JSON on stdin, result JSON on stdout).
 *
 * It exists ONLY to exercise the real spawn/stdin/stdout plumbing of
 * `createPowerShellDpapiProcessRunner` on a host without Windows PowerShell. It performs
 * no cryptography and holds no credential. Its "modes" let a test drive each classified
 * failure without a Windows host.
 */
let raw = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let payload = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {};
  }

  const mode = typeof payload.mode === 'string' ? payload.mode : 'ok';

  if (mode === 'exit') {
    process.stderr.write('child-failure-detail-that-must-not-surface');
    process.exit(3);
    return;
  }
  if (mode === 'empty') {
    process.exit(0);
    return;
  }
  if (mode === 'sleep') {
    setTimeout(() => process.exit(0), 60_000);
    return;
  }
  if (mode === 'flood') {
    process.stdout.write('x'.repeat(4 * 1024 * 1024));
    return;
  }
  if (mode === 'stderr-with-material') {
    process.stderr.write('stderr-with-material 0000');
    process.stdout.write(JSON.stringify({ ok: true, kind: 'stderr-probe' }));
    return;
  }

  process.stdout.write(JSON.stringify({ ok: true, receivedBytes: raw.length }));
});
