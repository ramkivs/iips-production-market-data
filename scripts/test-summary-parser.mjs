/**
 * Pure, fail-closed parser for Node's TAP and spec test summaries.
 *
 * The runner invokes this after the child process exits. It intentionally
 * accepts only the two anchored summary lines and never infers a count from
 * arbitrary output.
 */
const TESTS_SUMMARY = /^(?:# tests|ℹ tests) ([0-9]+)$/m;
const PASS_SUMMARY = /^(?:# pass|ℹ pass) ([0-9]+)$/m;

export function parseTestSummary(output) {
  const normalized = String(output).replace(/\r\n?/g, '\n');
  const tests = normalized.match(TESTS_SUMMARY);
  const passed = normalized.match(PASS_SUMMARY);
  return {
    executed: tests ? Number(tests[1]) : null,
    passed: passed ? Number(passed[1]) : null,
  };
}
