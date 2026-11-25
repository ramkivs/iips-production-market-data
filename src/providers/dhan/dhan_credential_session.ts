/**
 * Institutional Investment Platform System (IIPS)
 * D-2 / W-05 — Dhan credential session holder, bounded re-read policy and authentication latch
 *
 * Governed under: DHAN-LIVE-ROADMAP-2026-11-11 (v1.1) **D-2** and **W-05**, and
 * AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext).
 *
 * AUTHORITATIVE SOURCE. D-2 is an IRR decision and is not re-decided here. Its scope text
 * (`docs/integration/DHAN-LIVE-INTEGRATION-IMPLEMENTATION-ROADMAP-2026-11-11.md`, D-2) fixes
 * the posture and the triggers verbatim:
 *
 *   "A DPAPI read costs a process spawn (~200–500 ms), which is unacceptable per quote.
 *    POSTURE. Resolve at daemon start after config validation; hold the material only in IPD
 *    process memory; clear on shutdown.
 *    PERMITTED RE-READ TRIGGERS (EXHAUSTIVE): (a) daemon start; (b) crossing the token
 *    `expiresAt` boundary; (c) exactly ONE bounded re-read following an HTTP 401/403 on a
 *    request; (d) explicit operator restart.
 *    PROHIBITED: re-read on any other event; any loop; any re-read keyed on a transient
 *    failure code."
 *
 * This module implements exactly that and nothing wider.
 *
 * DELIBERATE DEVIATION FROM STRICT PER-REQUEST RESOLUTION (required to be documented by W-05).
 * Before W-05, `DhanApiClient` re-resolved credentials on every request, paying a vault read —
 * on Windows, a DPAPI process spawn — per quote. W-05 replaces that with this session holder:
 * one read at start, then reuse from bounded in-process memory. The deviation is bounded by
 * construction: the only events that may cause another read are the four D-2 triggers, and
 * trigger (c) can fire at most once per authenticated rejection, never in a loop.
 *
 * HOW EACH TRIGGER IS REALISED
 *
 *   (a) daemon start            → the first credentialed request reads. Nothing is read at
 *                                 construction time, so building the holder never touches the
 *                                 vault and a daemon that never serves a quote never reads one.
 *   (b) `expiresAt` boundary    → the access token lifetime is capped by `expiresAt`. The
 *                                 session is considered crossed once the effective instant is
 *                                 at or past that boundary; the next request re-reads. If the
 *                                 re-read returns material that is still expired, that is a
 *                                 LOCAL failure (`CREDENTIALS_EXPIRED`) and produces **no
 *                                 vendor call** — D-2 expired-vs-invalid, and W-05's
 *                                 "expired pre-flight issues no vendor call".
 *   (c) one bounded 401/403     → see below.
 *   (d) operator restart        → automatic; a new process is a new session. Nothing to
 *                                 implement beyond (a), which is why the holder has no
 *                                 "reopen" method. There is deliberately no API that discards
 *                                 cached material on demand, because that would create a fifth
 *                                 trigger.
 *
 * TRIGGER (c) — THE BOUNDED RE-READ
 *   On an HTTP 401/403 the client asks this holder for replacement material exactly once. If
 *   the replacement is accepted, the session continues with the new material. If the
 *   replacement is also rejected, the session LATCHES a failed-auth state: no further
 *   re-reads, no further vendor calls, no automatic recovery. Only a process restart after
 *   re-provisioning clears it (D-2; D-7 §2.2–§2.3).
 *
 * WHY RETRY IS BOUNDED HERE AND NOT IN THE CLIENT
 *   The budget lives with the material, not with the request. A per-request retry flag could be
 *   handed out again by a caller, or by a second endpoint, and the budget would be unbounded in
 *   aggregate. Keyed to the session it is consumed once, and the latch is the terminal state.
 *   `consumeAuthRejectionBudget()` is the ONLY mutator, and it returns `false` for every
 *   request after the first rejection, so no code path can loop (D-2 "no code path can loop").
 *
 * ZERO-PLAINTEXT DISCIPLINE (AD-17)
 *   - Material is held in a module-private field and never exposed by reference through any
 *     public accessor, snapshot, diagnostic or serialized form.
 *   - No method returns, logs or throws credential material. `describe()` returns counters,
 *     booleans and enumerated codes only.
 *   - Nothing is written to disk, no timers are created, and no vendor I/O happens here.
 *   - `clear()` drops the reference for shutdown (D-2 posture: "clear on shutdown").
 */

import type {
  DhanCredentialMaterial,
  DhanCredentialResolver,
  DhanProviderConfig,
} from './dhan_config.js';
import { parseStrictUtcTimestamp } from './dhan_utc_timestamp.js';

/**
 * Why the holder read the vault on a given occasion.
 *
 * Exactly the four D-2 triggers. There is no `RETRY`, `RECOVERY` or `REFRESH` member: an
 * enumerated reason set that admits a fifth cause would be a fifth trigger by another name.
 */
export type DhanCredentialReadReason =
  /** (a) daemon start — the first credentialed request in this process. */
  | 'SESSION_START'
  /** (b) the access token reached or passed its `expiresAt` boundary. */
  | 'EXPIRES_AT_BOUNDARY'
  /** (c) exactly one bounded re-read following an HTTP 401/403 on a request. */
  | 'AUTH_REJECTION_REREAD';

/** Enumerated, disclosure-safe session outcome. No secret material may appear here. */
export type DhanCredentialSessionState =
  /** Nothing read yet in this process. */
  | 'EMPTY'
  /** Material is held in memory and may be used without reading the vault. */
  | 'HELD'
  /** A 401/403 consumed the single re-read budget; material may still be held. */
  | 'AUTH_REJECTION_OBSERVED'
  /** The replacement material was also rejected. Terminal until restart. */
  | 'AUTH_LATCHED';

/**
 * Outcome of asking the holder for credentials on one request.
 *
 * `reused` is the W-05 latency assertion in enumerated form: it is `true` exactly when the
 * caller was served from in-process memory without touching the vault, so repeated quotes pay
 * no vault read and no DPAPI process spawn.
 */
export interface DhanCredentialSessionDecision {
  /** Why this request had to read the vault, or `null` when it was served from memory. */
  readonly readReason: DhanCredentialReadReason | null;
  /** True when no vault read happened for this request (the steady-state case). */
  readonly reused: boolean;
  /** Governed session state after the decision was taken. */
  readonly state: DhanCredentialSessionState;
  /** True when the caller must fail closed without a vendor call (latched, or not readable). */
  readonly failClosed: boolean;
}

/** Disclosure-safe session counters for diagnostics. Never carries material. */
export interface DhanCredentialSessionDescriptor {
  readonly state: DhanCredentialSessionState;
  readonly vaultReadCount: number;
  readonly authRejectionCount: number;
  readonly authLatched: boolean;
  readonly authRejectionBudgetRemaining: boolean;
  readonly holdsMaterial: boolean;
  readonly expiresAt: string | null;
}

export interface DhanCredentialSessionHolderOptions {
  /** The underlying vault-backed resolver (W-01/W-02 backend lives behind this). */
  readonly resolver: DhanCredentialResolver;
  /** Injected clock; must return epoch ms. Defaults to `Date.now`. */
  readonly now?: () => number;
}

/** Internal record of held material. Never leaves this module by reference. */
interface HeldSession {
  readonly material: DhanCredentialMaterial;
  /** Epoch ms at or after which trigger (b) applies, or `null` when the token has no expiry. */
  readonly expiresAtMs: number | null;
  /** The exact `expiresAt` string as resolved, so a caller can publish it without re-deriving. */
  readonly expiresAt: string | null;
}

/**
 * Thrown when a caller asks for replacement material without a live rejection budget.
 *
 * A programming error rather than a runtime condition: `executeJsonPost` consults
 * `decideForRequest()` and `consumeAuthRejectionBudget()` in order. It exists so an unbounded
 * re-read cannot be introduced silently by a future caller.
 */
export class DhanCredentialRereadNotPermittedError extends Error {
  constructor() {
    super('D-2 permits exactly one bounded credential re-read per authenticated rejection');
    this.name = 'DhanCredentialRereadNotPermittedError';
  }
}

/**
 * Parse the effective expiry of resolved material.
 *
 * A malformed or zone-less `expiresAt` is treated as ALREADY EXPIRED rather than as "no
 * expiry": trusting an unparseable deadline would silently extend a token's life, and D-2's
 * expired-vs-invalid rule says the safe direction for a locally unverifiable credential is to
 * make no vendor call. `parseStrictUtcTimestamp` is the shared strict UTC parser used by the
 * resolver and the API client for exactly this reason.
 */
function resolveExpiryBoundary(expiresAt: string | undefined): {
  readonly expiresAtMs: number | null;
  readonly expiresAt: string | null;
} {
  if (expiresAt === undefined) {
    return { expiresAtMs: null, expiresAt: null };
  }
  const parsed = parseStrictUtcTimestamp(expiresAt);
  if (!parsed.ok) {
    return { expiresAtMs: Number.NEGATIVE_INFINITY, expiresAt };
  }
  return { expiresAtMs: parsed.epochMs, expiresAt };
}

/**
 * D-2 session holder. Owns the only copy of resolved credential material in the request path.
 *
 * Not thread-shared across processes and deliberately not a singleton: one daemon composes one
 * holder. Every state transition is synchronous after the awaited vault read, so two requests
 * that arrive together cannot both consume the single re-read budget.
 */
export class DhanCredentialSessionHolder {
  private readonly resolver: DhanCredentialResolver;
  private readonly now: () => number;

  private session: HeldSession | null = null;
  private readInFlight: Promise<void> | null = null;

  private vaultReadCount = 0;
  private authRejectionCount = 0;
  private authRejectedOnce = false;
  /**
   * Outstanding permission for ONE `AUTH_REJECTION_REREAD` read.
   *
   * Separate from the budget flag because the two are not the same fact: the budget records that
   * the single D-2 re-read has been SPENT (so no second one is ever granted), while this grant
   * records that the read it authorised has not yet been PERFORMED. Collapsing them would make
   * spending the budget block the read it exists to permit.
   */
  private rereadGranted = false;
  private authLatched = false;

  constructor(options: DhanCredentialSessionHolderOptions) {
    this.resolver = options.resolver;
    this.now = options.now ?? (() => Date.now());
  }

  /** True once the replacement material has also been rejected (terminal until restart). */
  public isAuthLatched(): boolean {
    return this.authLatched;
  }

  /** Disclosure-safe descriptor. Never returns material, a path or a `vault://` reference. */
  public describe(): DhanCredentialSessionDescriptor {
    return Object.freeze({
      state: this.currentState(),
      vaultReadCount: this.vaultReadCount,
      authRejectionCount: this.authRejectionCount,
      authLatched: this.authLatched,
      authRejectionBudgetRemaining: !this.authRejectedOnce,
      holdsMaterial: this.session !== null,
      expiresAt: this.session?.expiresAt ?? null,
    });
  }

  private currentState(): DhanCredentialSessionState {
    if (this.authLatched) return 'AUTH_LATCHED';
    if (this.authRejectedOnce) return 'AUTH_REJECTION_OBSERVED';
    return this.session === null ? 'EMPTY' : 'HELD';
  }

  /**
   * Decides, for one request, whether the vault must be read.
   *
   * Returns the D-2 trigger that applies, or `reused: true` when memory already holds usable
   * material. This is the only path by which cached material is handed to a request, and it
   * never returns material itself — see `currentMaterial()`.
   *
   * Latching is terminal: a latched holder reports `failClosed` and performs no read, so a
   * post-latch request costs neither a vault read nor a vendor call.
   */
  public decideForRequest(): DhanCredentialSessionDecision {
    if (this.authLatched) {
      return {
        readReason: null,
        reused: false,
        state: 'AUTH_LATCHED',
        failClosed: true,
      };
    }

    if (this.session === null) {
      return {
        readReason: 'SESSION_START',
        reused: false,
        state: 'EMPTY',
        failClosed: false,
      };
    }

    const boundary = this.session.expiresAtMs;
    if (boundary !== null && this.now() >= boundary) {
      return {
        readReason: 'EXPIRES_AT_BOUNDARY',
        reused: false,
        state: this.currentState(),
        failClosed: false,
      };
    }

    return {
      readReason: null,
      reused: true,
      state: this.currentState(),
      failClosed: false,
    };
  }

  /**
   * Performs one permitted read and replaces the held session.
   *
   * `reason` is the trigger returned by `decideForRequest()`, and a read is refused
   * (`DhanCredentialRereadNotPermittedError`) unless the budget for that trigger is intact.
   * Returns `false` when the vault supplied no usable material — the caller then fails closed
   * with `CREDENTIALS_UNAVAILABLE`, which is a local outcome and makes no vendor call.
   *
   * Credential CONTENT is never inspected here beyond the two fields the guard needs, and never
   * returned. A resolver that throws is allowed to propagate: `DhanApiClient` already maps the
   * governed `DhanVaultResolutionError` codes, and swallowing them here would erase the
   * expired-vs-unavailable distinction D-2 requires.
   */
  public async readForTrigger(
    reason: DhanCredentialReadReason,
    config: DhanProviderConfig
  ): Promise<boolean> {
    if (this.authLatched) {
      return false;
    }

    if (reason === 'AUTH_REJECTION_REREAD') {
      // Requires an outstanding grant. The grant is consumed here so one grant can authorise
      // exactly one read; a second attempt to re-read needs a second grant, which the budget
      // will never issue in this process.
      if (!this.rereadGranted) {
        throw new DhanCredentialRereadNotPermittedError();
      }
      this.rereadGranted = false;
    }

    // Serialise concurrent readers so two requests that both observed a boundary crossing (or
    // arrive during a cold start) do not each pay a vault read. One read serves both.
    if (this.readInFlight !== null) {
      await this.readInFlight;
      return this.session !== null;
    }

    const read: Promise<void> = (async () => {
      const material = await this.resolver.resolve(config);
      this.vaultReadCount += 1;
      if (
        material === null ||
        typeof material.accessToken !== 'string' ||
        material.accessToken.trim() === '' ||
        typeof material.clientId !== 'string' ||
        material.clientId.trim() === ''
      ) {
        this.session = null;
        return;
      }
      const expiry = resolveExpiryBoundary(material.expiresAt);
      this.session = {
        material,
        expiresAtMs: expiry.expiresAtMs,
        expiresAt: expiry.expiresAt,
      };
    })();

    this.readInFlight = read;
    try {
      await read;
    } finally {
      this.readInFlight = null;
    }
    return this.session !== null;
  }

  /**
   * Consumes the single D-2 re-read budget after an HTTP 401/403.
   *
   * Returns `true` exactly once per authenticated rejection — the first `true` is the
   * authorisation to perform the bounded re-read — and `false` thereafter. There is no way to
   * replenish it in this process, which is what makes the path bounded rather than merely
   * unlikely to loop.
   */
  public consumeAuthRejectionBudget(): boolean {
    if (this.authLatched) return false;
    this.authRejectionCount += 1;
    if (this.authRejectedOnce) return false;
    this.authRejectedOnce = true;
    this.rereadGranted = true;
    return true;
  }

  /**
   * Latches the failed-auth state after the replacement material was also rejected.
   *
   * Terminal by construction: every subsequent `decideForRequest()` reports `failClosed` and no
   * method clears the flag. D-2 requires operator intervention plus restart to recover, and a
   * restart is a new process with a new holder.
   */
  public latchAuthFailure(): void {
    this.authLatched = true;
    // A grant that was issued but never spent must not survive the latch, or a post-latch read
    // would be reachable in principle even though `readForTrigger` refuses once latched.
    this.rereadGranted = false;
  }

  /**
   * Drops the held material (D-2 posture: "clear on shutdown").
   *
   * Does not reset counters or the latch: clearing on shutdown must not be usable as a route to
   * recovery. A new process is the only way back from a latched state.
   */
  public clear(): void {
    this.session = null;
  }

  /**
   * Hands the caller a snapshot of the material currently held, or `null`.
   *
   * A copy, so a caller cannot mutate the holder's state, and the holder keeps the only
   * long-lived reference. Used by the API client to build per-request headers, which are
   * discarded with the request.
   */
  public currentMaterial(): DhanCredentialMaterial | null {
    const session = this.session;
    if (session === null) return null;
    const { accessToken, clientId, expiresAt } = session.material;
    return {
      accessToken,
      clientId,
      ...(expiresAt !== undefined ? { expiresAt } : {}),
    };
  }
}
