/**
 * W-06 — Local transport authentication recovery: what the Windows-host evidence can and cannot claim.
 *
 * Record: docs/integration/DHAN-W06-LOCAL-TRANSPORT-RECOVERY-EVIDENCE-2026-11-12.md
 * Procedure it records a run of: docs/integration/DHAN-W06-TRANSPORT-AUTH-RECOVERY-2026-11-12.md
 * Roadmap: docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md (v1.1), W-06
 *
 * WHY THIS SUITE EXISTS
 * The recovery record says something narrow — the operator's shell and the loopback daemon finally
 * agreed on one transport secret — and it sits next to a much louder piece of evidence: a captured
 * vendor rejection. The two are easy to conflate in both directions. Someone will eventually read a
 * local `200` as "Dhan authentication is fixed", or read the vendor `502` as "the transport is still
 * broken". This suite pins the boundary in both directions, pins the recorded observations so they
 * cannot drift, and pins the redaction of the record itself.
 *
 * It also guards one subtle honesty requirement: the health response was TRUNCATED in the operator's
 * capture. The record must say so, must reproduce only the visible prefix, and must be explicit that
 * the completed tail is a contract literal rather than an observation.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

import {
  DHAN_DEFAULT_BASE_URL,
  type DhanCredentialMaterial,
} from '../src/providers/dhan/dhan_config.js';
import {
  DhanApiClient,
  type DhanHttpRequest,
  type DhanHttpResponse,
  type DhanHttpTransport,
} from '../src/providers/dhan/dhan_api_client.js';
import {
  createMarketDataHttpServer,
  MARKET_DATA_ROUTES,
} from '../src/providers/dhan/dhan_market_data_http.js';
import { DhanMarketDataService } from '../src/providers/dhan/dhan_market_data_service.js';
import { DhanIdentityApiService } from '../src/providers/dhan/dhan_identity_api.js';
import { loadGovernedP7InstrumentRegistry } from '../src/providers/dhan/dhan_local_daemon.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

const RECORD = 'docs/integration/DHAN-W06-LOCAL-TRANSPORT-RECOVERY-EVIDENCE-2026-11-12.md';
const PROCEDURE = 'docs/integration/DHAN-W06-TRANSPORT-AUTH-RECOVERY-2026-11-12.md';
const VENDOR_RECORD = 'docs/integration/DHAN-W06-FIRST-AUTHENTICATED-REQUEST-EVIDENCE-2026-11-12.md';

/** The synthetic transport credential used by this suite. Never a real secret. */
const TOKEN = 'w06-recovery-synthetic-transport-token';

function repoText(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function flat(text: string): string {
  return text.replace(/\s+/g, ' ');
}

/** A provider transport that must never be called: `/v1/health` opens no vendor socket. */
function forbiddenTransport(): DhanHttpTransport & { readonly calls: number } {
  let calls = 0;
  return {
    get calls() {
      return calls;
    },
    async send(_request: DhanHttpRequest): Promise<DhanHttpResponse> {
      calls += 1;
      throw new Error('the provider transport must not be reached by /v1/health');
    },
  };
}

function governedService(transport: DhanHttpTransport): DhanMarketDataService {
  const service = new DhanMarketDataService({
    client: new DhanApiClient({
      config: {
        providerId: 'dhan',
        baseUrl: DHAN_DEFAULT_BASE_URL,
        timeoutMs: 1000,
        readiness: 'CREDENTIAL_REFERENCES_CONFIGURED',
        missingKeys: [],
      },
      transport,
      credentialResolver: {
        resolve: async (): Promise<DhanCredentialMaterial> => ({
          clientId: 'W06-RECOVERY-SYNTHETIC-CLIENT-ID',
          accessToken: 'W06-RECOVERY-SYNTHETIC-ACCESS-TOKEN',
          expiresAt: '2099-01-01T00:00:00.000Z',
        }),
      },
    }),
    securityMaster: getGovernedBroadSecurityMaster(),
    instrumentRegistry: loadGovernedP7InstrumentRegistry(),
    now: () => new Date('2026-11-12T20:00:00.000Z'),
  });
  service.start();
  return service;
}

async function withServer(
  transport: DhanHttpTransport,
  fn: (port: number) => Promise<void>
): Promise<void> {
  const server: Server = createMarketDataHttpServer({
    service: governedService(transport),
    identityService: new DhanIdentityApiService(
      getGovernedBroadSecurityMaster(),
      loadGovernedP7InstrumentRegistry()
    ),
    token: TOKEN,
    env: {},
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    await fn(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('W-06 local transport recovery evidence (synthetic)', () => {
  it('W06-R01: the record states the local-only verdict and refuses every vendor claim', () => {
    const record = repoText(RECORD);
    const text = flat(record);

    // The verdict it does support.
    assert.ok(text.includes('HTTP 200'), 'the recovery result must be stated');
    assert.ok(text.includes('recovered and verified'), 'the local recovery must be stated as verified');
    assert.ok(text.includes('operator-to-daemon transport credential matched'));
    assert.ok(text.includes('local operator-to-daemon transport path only'));

    // The claims it must never make. The "Not proven here" table legitimately NAMES each claim in
    // order to exclude it, so that region is removed before scanning; everything else must be clean.
    const exclusionStart = record.indexOf('| Not proven here | Why not |');
    assert.ok(exclusionStart > 0, 'the exclusion table must exist');
    const exclusionEnd = record.indexOf('## 10.', exclusionStart);
    assert.ok(exclusionEnd > exclusionStart, 'the exclusion table must be a delimited region');
    const assertiveText = flat(record.slice(0, exclusionStart) + record.slice(exclusionEnd));

    for (const forbidden of [
      /Dhan authentication (?:succeeded|is (?:now )?(?:working|fixed|established))/i,
      /vendor authentication (?:succeeded|is (?:now )?(?:working|fixed))/i,
      /\bM1 is (?:satisfied|achieved|met|complete|closed)\b/i,
      // A bare mention in an out-of-scope list is not a claim; a claim needs a verb.
      /production[- ](?:ready|readiness) (?:is|was|has been) (?:established|achieved|proven|demonstrated)/i,
      /(?:is|now) production[- ]ready/i,
      /\bW-06 is (?:now )?closed\b/i,
      /\bW-06 (?:is )?complete\b/i,
      /live market[- ]data (?:was|is) (?:retrieved|obtained|flowing)/i,
      /quotes? (?:is|are) qualified/i,
    ]) {
      const match = assertiveText.match(forbidden);
      assert.strictEqual(match, null, `the record must not claim: ${match?.[0] ?? forbidden.source}`);
    }

    // And it must name the exclusions explicitly rather than merely omit them.
    for (const exclusion of [
      'Dhan vendor authentication succeeded',
      'Live market data was retrieved',
      'M1 achieved',
      'Production qualification or readiness',
      'W-06 closed',
    ]) {
      assert.ok(text.includes(exclusion), `the exclusion table must name: ${exclusion}`);
    }
  });

  it('W06-R02: the local gate and the vendor verdict are kept on separate layers', () => {
    const record = repoText(RECORD);
    const text = flat(record);

    // Two layers, named, with the right evidence state on each.
    assert.ok(text.includes('Layer A — local transport'));
    assert.ok(text.includes('Layer B — Dhan vendor'));

    // The 401 in this record is the LOCAL gate; the vendor verdict is a different code and status.
    assert.ok(text.includes('UNAUTHENTICATED'), 'the local 401 body must be reproduced');
    assert.ok(text.includes('502 AUTHENTICATION_FAILURE'), 'the vendor verdict must be referenced, not rewritten');

    // Never conflate the two in either direction.
    for (const conflation of [
      /transport (?:defect|failure) (?:caused|explains) the (?:vendor|Dhan) rejection/i,
      /the 200 (?:repairs|fixes|resolves) the (?:vendor|Dhan)/i,
      /Dhan rejected the (?:transport|local) (?:token|credential)/i,
    ]) {
      assert.strictEqual(text.match(conflation), null, `must not conflate the layers: ${conflation.source}`);
    }

    // The RATE-limited distinction is already recorded elsewhere; here the key point is that the
    // vendor record is cited as unchanged.
    assert.ok(text.includes('neither confirmed nor contradicted'));
  });

  it('W06-R03: the truncated health capture is recorded honestly, prefix only', () => {
    const record = repoText(RECORD);

    // The truncation must be stated, not glossed.
    assert.ok(flat(record).includes('truncated'), 'the truncation must be recorded');
    assert.ok(flat(record).includes('not reconstructed, completed or guessed'));

    // The visible prefix appears exactly as supplied, ending in the ellipsis.
    const prefix =
      '{"service":"UP","providerConfiguration":"CONFIGURED","liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS","providerQualification":"SYNTHETIC_ONLY_NOT_LIVE...';
    assert.ok(record.includes(prefix), 'the observed prefix must be reproduced verbatim');
    // The ellipsis is load-bearing: the truncated tail must never be silently completed in the
    // observation, or a reader would take a contract literal for something the host observed.
    const hostBlock = record.slice(record.indexOf('**Result: `HTTP 200`.**'), record.indexOf('### 8.1'));
    assert.ok(hostBlock.includes('...'), 'the host-captured block must show the truncation');
    assert.strictEqual(
      hostBlock.match(/SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED/),
      null,
      'the truncated tail must not be completed inside the observation block'
    );

    // The COMPLETE body must not be presented as an observation from the host: the only complete
    // body in the record belongs to the Arena reproduction, and it must say so.
    const complete =
      '{"service":"UP","providerConfiguration":"CONFIGURED","liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS","providerQualification":"SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED"}';
    assert.ok(record.includes(complete), 'the contract-complete body is stated separately');
    const truncatedIndex = record.indexOf(prefix);
    const completeIndex = record.indexOf(complete);
    assert.ok(truncatedIndex < completeIndex, 'the observation must precede the contract completion');

    // The completion must be labelled as a contract literal, with its source.
    assert.ok(flat(record).includes('literal type'));
    assert.ok(flat(record).includes('dhan_market_data_service.ts'));
  });

  it('W06-R04: the recorded observations are reproduced exactly', () => {
    const record = repoText(RECORD);
    const text = flat(record);

    // The P7 tree the recovery was performed on.
    assert.ok(record.includes('a1a3c60f3e20254bc70066b54dca9ddfb0fa8bc8'), 'the P7 commit must be pinned');

    // Fingerprints: supplied, truncated, and kept apart on their own two columns.
    assert.ok(record.includes('b51fd981f1429e1a'));
    assert.ok(record.includes('e2b0c8f08646ee1a'));
    assert.ok(/\|\s*327\s*\|\s*327\s*\|/.test(record), 'both byte lengths must be recorded as 327');
    assert.ok(/\|\s*0\s*\|\s*0\s*\|/.test(record), 'both non-ASCII counts must be recorded as 0');

    // Startup diagnostics, all nine.
    for (const diagnostic of [
      'WINDOWS_DPAPI_USER_SCOPE',
      'windows-dpapi',
      'READY',
      'CREDENTIALS_RESOLVED',
      'IPD_SERVER_HTTPS',
      '96',
      '127.0.0.1:8791',
    ]) {
      assert.ok(record.includes(diagnostic), `the startup state must include: ${diagnostic}`);
    }
    assert.ok(text.includes('liveCredentialResolution') && text.includes('true'));
    assert.ok(text.includes('credentialReadiness') && text.includes('CONFIGURED'));

    // The provider-state ceiling, in the roadmap's own vocabulary (markdown emphasis may sit
    // between the words, so the check is on the flattened text with markers removed).
    assert.ok(
      text.replace(/[*`]/g, '').includes('the ceiling for a process that has not called the vendor'),
      'the D-7 ceiling must be quoted in the roadmap vocabulary'
    );
    assert.ok(
      text.replace(/[*`]/g, '').includes('permitted, not proven'),
      'vendorEgress must be described as permission, not proof'
    );
  });

  it('W06-R05: the fingerprint comparison is read correctly and claims no more than it shows', () => {
    const record = repoText(RECORD);
    const text = flat(record);

    // Equal length + different digest = two genuinely different values.
    assert.ok(text.includes('two genuinely different token values'));
    // non-ASCII excluded BY MEASUREMENT, not merely deprioritised.
    assert.ok(text.includes('excluded by measurement'));
    // Provenance is explicitly not established (emphasis markers stripped before matching).
    assert.ok(text.replace(/[*`]/g, '').includes('does not establish provenance'));
    // No invisible-character cause is asserted for this host.
    assert.strictEqual(
      text.match(/invisible character (?:caused|explains) the/i),
      null,
      'no invisible-character cause may be asserted for this host'
    );
  });

  it('W06-R06: the corrective run used one session for both processes', () => {
    const text = flat(repoText(RECORD));
    assert.ok(text.includes('one entry, two readers'));
    assert.ok(text.includes('restarted in the background from the original PowerShell session'));
    assert.ok(text.includes('inheriting that session’s environment') || text.includes("that session's environment"));
    assert.ok(text.includes('nothing about DPAPI') || text.includes('DPAPI, the `IIPS_DHAN_*` configuration'));
    // The value crossed the boundary by inheritance only.
    assert.ok(text.includes('By **inheritance only**') || text.includes('inheritance only'));
  });

  it('W06-R07: the record carries no secret material and no fingerprint beyond what was supplied', () => {
    const record = repoText(RECORD);

    // The only long hex run may be the pinned commit id. Any OTHER 40+ hex run would be a real
    // digest, which this record must never contain.
    const longHex = record.match(/\b[0-9a-f]{40,}\b/g) ?? [];
    assert.deepStrictEqual(
      longHex.filter((value) => value !== 'a1a3c60f3e20254bc70066b54dca9ddfb0fa8bc8'),
      [],
      'no digest may appear beyond the pinned commit id'
    );
    assert.strictEqual(record.match(/\b[0-9a-f]{64}\b/g), null, 'no full SHA-256 may appear');
    // The only 16-hex strings are the two supplied prefixes.
    const hex16 = record.match(/\b[0-9a-f]{16}\b/g) ?? [];
    assert.deepStrictEqual(
      [...hex16].sort(),
      ['b51fd981f1429e1a', 'e2b0c8f08646ee1a'],
      'only the two supplied fingerprints may appear'
    );
    // No JWT, no vault pointer, no store or carrier location, no credential-bearing env dump.
    assert.ok(!record.includes('eyJ'), 'no JWT may appear');
    assert.strictEqual(record.replace(/`/g, '').match(/vault:\/\/[A-Za-z0-9]/g), null, 'no vault pointer');
    assert.ok(!record.includes('dhan-secrets'), 'no store directory');
    assert.ok(!record.includes('dhan-client-id.carrier') && !record.includes('dhan-access-token.carrier'));
    assert.ok(!/H:\\\\IIPS/.test(record), 'no carrier root path');
    // No table row may LABEL a cell as the token/secret and then carry something in it. The first
    // cell is what makes a row a value row; a `| Field | Value |` header is not one.
    assert.strictEqual(
      record.match(/^\|\s*\*{0,2}(?:Token|Transport token|Secret|Credential)\*{0,2}\s*\|/im),
      null,
      'no table row may label a token/secret cell'
    );
    assert.strictEqual(
      record.match(/^\|\s*\*{0,2}(?:Token|Transport token|Secret|Credential)\*{0,2}\s*\|\s*[^|\s]+/im),
      null,
      'no token or secret value may appear in a table'
    );
    // No "Get-ChildItem Env:" style dump and no assignment of a token value.
    assert.ok(!/Get-ChildItem\s+Env:/i.test(record), 'no environment dump');
    assert.strictEqual(
      record.match(/\$env:IIPS_MARKET_DATA_TRANSPORT_TOKEN\s*=\s*(?!\[)/g),
      null,
      'the record must never assign a token value'
    );
  });

  it('W06-R08: the roadmap status model is preserved exactly', () => {
    const text = flat(repoText(RECORD));
    assert.ok(text.includes('W-06** | **OPEN**') || text.includes('W-06** | **OPEN** — unchanged'));
    assert.ok(text.includes('NOT ACHIEVED'));
    assert.ok(text.includes('operationally verified'));
    assert.ok(text.includes('D-6') && text.includes('complete'));
    assert.ok(text.includes('M2a / M2 / M3a / M3 / M4'));
    assert.ok(text.includes('retain their existing statuses'));
    assert.ok(text.includes('not authorised'));
  });

  it('W06-R09: /v1/health is local — it returns the observed body and reaches no provider', async () => {
    const transport = forbiddenTransport();
    await withServer(transport, async (port) => {
      const response = await fetch(`http://127.0.0.1:${port}${MARKET_DATA_ROUTES.health}`, {
        headers: { authorization: `Bearer ${TOKEN}` },
      });
      assert.strictEqual(response.status, 200);

      // The exact body the operator's capture shows (the record's prefix + the literal tail).
      const body = await response.text();
      assert.strictEqual(
        body,
        '{"service":"UP","providerConfiguration":"CONFIGURED","liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS","providerQualification":"SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED"}'
      );
      assert.ok(
        body.startsWith(
          '{"service":"UP","providerConfiguration":"CONFIGURED","liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS","providerQualification":"SYNTHETIC_ONLY_NOT_LIVE'
        ),
        'the operator-observed prefix must match this build'
      );

      // No vendor egress of any kind: the transport would have thrown.
      assert.strictEqual(transport.calls, 0, '/v1/health must never call the provider');

      // And a 200 here says nothing about the vendor: the two literals say exactly that.
      assert.ok(body.includes('"liveProviderConnectivity":"NOT_CHECKED_PRE_ACCESS"'));
      assert.ok(body.includes('"providerQualification":"SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED"'));
    });
  });

  it('W06-R10: the local 401 and the local 200 are the same gate, differing only in the credential', async () => {
    const transport = forbiddenTransport();
    await withServer(transport, async (port) => {
      const denied = await fetch(`http://127.0.0.1:${port}${MARKET_DATA_ROUTES.health}`, {
        headers: { authorization: 'Bearer w06-recovery-DIFFERENT-token' },
      });
      assert.strictEqual(denied.status, 401);
      assert.deepStrictEqual(await denied.json(), {
        error: { code: 'UNAUTHENTICATED', message: 'missing or invalid transport credential' },
      });

      // Same route, same process, same gate; only the credential differed.
      const allowed = await fetch(`http://127.0.0.1:${port}${MARKET_DATA_ROUTES.health}`, {
        headers: { authorization: `Bearer ${TOKEN}` },
      });
      assert.strictEqual(allowed.status, 200);
      assert.strictEqual(transport.calls, 0);
    });
  });

  it('W06-R11: the record and the procedure it records a run of stay consistent', () => {
    const record = repoText(RECORD);
    const procedure = repoText(PROCEDURE);

    // The record points at the procedure, and the procedure's invariant is the one that was applied.
    assert.ok(record.includes(path.basename(PROCEDURE)), 'the record must cite the procedure it followed');
    assert.ok(procedure.includes('one entry, two readers'), 'the invariant must exist in the procedure');
    assert.ok(record.includes('one entry, two readers'), 'and must be the one the record applies');

    // The procedure's fingerprint step is the one used.
    assert.ok(procedure.includes('sha256x8'));
    assert.ok(record.includes('Non-ASCII byte count') || record.includes('nonAscii'));
  });

  it('W06-R13: the record states that startup READS the carriers, and never claims otherwise', () => {
    const record = repoText(RECORD);
    const text = flat(record).replace(/[*`]/g, '');

    // The correction itself: the record must state the read, and must own the earlier error.
    assert.ok(text.includes('carriers were read'), 'the record must state that the carriers were read');
    assert.ok(text.includes('decrypts both Dhan secrets'), 'the decrypt must be named');
    assert.ok(
      /an earlier revision of this (?:paragraph|record) said (?:they were not|exactly that)/.test(text),
      'the earlier inaccuracy must be acknowledged explicitly, not vaguely'
    );
    assert.ok(text.includes('That was inaccurate'), 'the record must own the error outright');
    // And the removed claim must not survive anywhere.
    assert.ok(
      !record.includes('carriers were not read for evidence'),
      'the retracted "not read" assertion must be gone'
    );
    assert.ok(
      !text.includes('No Dhan Client ID or Access Token was read'),
      'the retracted "was read" phrasing must be gone'
    );

    // The distinction the record exists to keep: read != authenticating, read != rotating.
    assert.ok(text.includes('Resolution is not authentication, and not rotation'));
    assert.ok(text.includes('a local operation, no network'));
    assert.ok(text.includes('no vendor request was made'));

    // The comparison table must answer "no" for authentication and for rotation. Pinning the ROWS,
    // not just the surrounding prose, is what stops a later edit from quietly flipping a verdict
    // while every other sentence still reads correctly.
    const rowFor = (label: string): string | undefined =>
      record.split('\n').find((line) => line.startsWith(`| **${label}**`));
    const resolutionRow = rowFor('Resolution');
    const authenticationRow = rowFor('Authentication');
    const rotationRow = rowFor('Rotation / replacement');
    assert.ok(resolutionRow, 'the Resolution row must exist');
    assert.ok(authenticationRow, 'the Authentication row must exist');
    assert.ok(rotationRow, 'the Rotation row must exist');
    assert.ok(/\*\*yes\*\*/i.test(resolutionRow), 'resolution must be marked as evidenced');
    assert.ok(/\*\*no\*\*/i.test(authenticationRow), 'authentication must be marked as NOT evidenced');
    assert.ok(!/\*\*yes\*\*/i.test(authenticationRow), 'authentication must never be marked evidenced');
    assert.ok(/\*\*no\*\*/i.test(rotationRow), 'rotation must be marked as NOT performed');

    // The trace must cite the load-bearing source line, not just assert.
    assert.ok(record.includes('dhan_dpapi_vault_backend.ts:284-292'), 'the decrypt loop must be cited');
    assert.ok(record.includes('dhan_dpapi_vault_backend.ts:297'), 'the sole true-setter must be cited');
    assert.ok(record.includes('dhan_local_daemon.ts:626'), 'the READY derivation must be cited');
    assert.ok(record.includes('dhan_provider_state.ts:163'), 'the state derivation must be cited');

    // No plaintext retention must be stated as the mitigation that makes the read acceptable.
    assert.ok(text.includes('No plaintext is retained'));
    // And the limitation must be stated rather than glossed.
    assert.ok(text.includes('entailment, not direct observation'));
  });

  it('W06-R14: startup decrypts both carriers — the claim the record now makes is the code\'s', () => {
    // A source-level pin, because the behaviour lives behind DPAPI (Windows-only) and a behavioural
    // test cannot run here. If the readiness probe ever stops decrypting, the record's central new
    // claim becomes false and this fails.
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/providers/dhan/dhan_dpapi_vault_backend.ts'),
      'utf8'
    );

    // The probe loops over the roles and decrypts each one.
    const loop = /for \(const role of probeRoles\)[\s\S]*?const probe = await this\.unprotect\(envelope\.ciphertext\)[\s\S]*?probe\.plaintext\.length === 0[\s\S]*?\n      }/.exec(
      source
    );
    assert.ok(loop, 'the readiness probe must decrypt each probed carrier');

    // With no ref, every role is probed; the daemon passes no ref.
    assert.ok(
      /let probeRoles: DpapiCarrierRole\[\] = roles;/.test(source),
      'an unref\'d probe must cover all roles'
    );
    const daemon = readFileSync(
      path.resolve(process.cwd(), 'src/providers/dhan/dhan_local_daemon.ts'),
      'utf8'
    );
    assert.ok(
      /resolver\.probeBackendReadiness\(\)/.test(daemon),
      'startup must call the probe with no ref, so both carriers are probed'
    );

    // `liveResolutionSupported: true` has exactly one producer, and it sits after the decrypt loop.
    const trueSetters = source.match(/liveResolutionSupported: true/g) ?? [];
    assert.strictEqual(trueSetters.length, 1, 'exactly one place may mark live resolution supported');
    const trueIndex = source.indexOf('liveResolutionSupported: true');
    const loopIndex = source.indexOf('const probe = await this.unprotect(envelope.ciphertext)');
    assert.ok(loopIndex > 0 && loopIndex < trueIndex, 'the decrypt must precede the supported verdict');

    // And `READY` is derived solely from that boolean.
    assert.ok(
      /vaultBackendReadiness: vaultReadiness\.liveResolutionSupported \? 'READY' : 'NOT_READY'/.test(daemon),
      'READY must be entailed by a successful decrypt'
    );

    // The value is used only for the emptiness check: no retention field exists.
    assert.ok(
      !/private\s+(?:readonly\s+)?\w*[Pp]laintext/.test(source),
      'the backend must not declare a field that retains plaintext'
    );
  });

  it('W06-R12: the vendor evidence record is untouched by this recovery', () => {
    const vendor = repoText(VENDOR_RECORD);
    // W-06's status, as recorded there, is still: evidence clause satisfied, M1 not satisfied, open.
    assert.ok(flat(vendor).includes('W-06 remains open'));
    assert.ok(flat(vendor).includes('M1 is NOT satisfied'));
    assert.ok(vendor.includes('AUTHENTICATION_FAILURE'));

    // This recovery must not have edited that record's verdict.
    assert.strictEqual(
      flat(vendor).match(/M1 is satisfied\b/),
      null,
      'the vendor record must not be rewritten by this work'
    );
  });
});
