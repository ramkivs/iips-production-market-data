/**
 * Local personal-use persistence path — the explicitly authorized switch for
 * this local single-user, non-production application.
 *
 * Authority: the Program Authority's 2026-11-08 instruction to complete IIPS
 * personal portfolio persistence (this repository's owning change). It
 * authorizes exactly this — a narrowly scoped path so the personal application
 * can save, read, update and delete its own portfolio durably. It grants
 * nothing else:
 *
 *   - production, hosted or multi-user use remain out of scope;
 *   - the broker whole-import identity/2F refusal (REFUSED_UNRESOLVED_IDENTITY)
 *     is untouched — manual personal entries are mapped as MANUAL_PERSONAL_ENTRY,
 *     they are never treated as broker observations;
 *   - the v2 snapshot contract (D03/D05) and its cap=4 are untouched; this path
 *     is the v1 exchange only;
 *   - ownership, binding resolution, audit chain, transaction atomicity,
 *     duplicate protection and caller-authority refusal all stay authoritative.
 *
 * The setting is `IIPS_LOCAL_PERSONAL_USE=1`, read from the server process
 * environment only — never from a request, a header or a flag file. When it is
 * absent, the historical refusal behavior of every write operation is
 * byte-for-byte unchanged.
 */
export const LOCAL_PERSONAL_USE_SETTING = 'IIPS_LOCAL_PERSONAL_USE';

/** Per-call read of the switch; tests set/restore it around each scenario. */
export function isLocalPersonalUseEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[LOCAL_PERSONAL_USE_SETTING] === '1';
}

/** The store revision cap for the active mode. */
export function revisionCapFor(env: NodeJS.ProcessEnv = process.env): number {
  return isLocalPersonalUseEnabled(env) ? 1000 : 4;
}
