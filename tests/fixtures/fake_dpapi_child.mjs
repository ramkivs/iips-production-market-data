#!/usr/bin/env node
/**
 * W-02 test fixture: a stand-in child process that speaks the DPAPI runner protocol
 * (request JSON on stdin, result JSON on stdout).
 *
 * It exists ONLY to exercise the real spawn/stdin/stdout plumbing of
 * `createPowerShellDpapiProcessRunner` on a host without Windows PowerShell. It performs
 * no cryptography and holds no credential. Its "modes" let a test drive each classified
 * failure without a Windows host. The synthetic protect/unprotect modes intentionally use a
 * reversible test marker, never real encryption; they are only for contract tests.
 */
import { existsSync } from 'node:fs';

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

  // These modes drive the real provision/rotate/verify path through the child-process runner.
  // The marker deliberately makes the fixture reversible: it is NOT a substitute for DPAPI.
  if (mode === 'synthetic-protect' && typeof payload.plaintextB64 === 'string') {
    const marked = `FAKE-DPAPI-ONLY:${payload.plaintextB64}`;
    process.stdout.write(JSON.stringify({
      ok: true,
      ciphertextB64: Buffer.from(marked, 'utf8').toString('base64'),
    }));
    return;
  }
  if ((mode === 'synthetic-unprotect' || mode === 'synthetic-mismatch') &&
      typeof payload.ciphertextB64 === 'string') {
    const marked = Buffer.from(payload.ciphertextB64, 'base64').toString('utf8');
    if (!marked.startsWith('FAKE-DPAPI-ONLY:')) {
      process.stdout.write(JSON.stringify({ ok: false, kind: 'DPAPI_UNPROTECT_FAILED' }));
      return;
    }
    const plaintextB64 = mode === 'synthetic-mismatch'
      ? Buffer.from('SYNTHETIC-MISMATCH', 'utf8').toString('base64')
      : marked.slice('FAKE-DPAPI-ONLY:'.length);
    process.stdout.write(JSON.stringify({ ok: true, plaintextB64 }));
    return;
  }
  if (mode === 'synthetic-acl' && Array.isArray(payload.paths)) {
    const items = payload.paths.map((path) => ({
      path,
      exists: typeof path === 'string' && existsSync(path),
      protected: true,
      onlyOwnerAndSystem: true,
      ownerIsCurrentUser: true,
    }));
    process.stdout.write(JSON.stringify({ ok: true, items }));
    return;
  }

  process.stdout.write(JSON.stringify({ ok: true, receivedBytes: raw.length }));
});
