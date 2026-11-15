# Dhan quote retry policy — groundwork and blockers

**Status: INCOMPLETE.** The owner has directed restoration of bounded configurable quote retries. The previous W-12 one-attempt policy is not a permanent product requirement. This change prepares a safe `Retry-After` boundary but does **not** restore retries in quote orchestration. Do not interpret it as an implementation or verification of the requested retry policy.

The HTTPS transport carries the `Retry-After` header to the API client; the client converts valid integer delta-seconds or strict HTTP-date values on HTTP 429/503 to a numeric delay. Invalid values are not echoed. No vendor body, credential, or raw header is included in the sanitized failure. This numeric field is groundwork only: it does not currently schedule a retry or enforce a throttle.

## Blocking engineering work

- `DhanRefreshOrchestrator` currently performs one fetch. Restore `withBoundedRetry`, expose and validate a bounded maximum-attempt setting (default three), distinguish transient and permanent outcomes and record bounded, sanitized per-attempt and final outcomes.
- The service's existing default `DhanRateLimiter` uses a 60-per-minute fixed window. It permits bursts and is **not** sufficient to enforce one quote request per second. A shared, concurrency-safe attempt-level limiter must apply to first attempts and retries, including direct/batch quote paths, with a clear account/process scope. Respect Retry-After without retrying earlier than requested; if it exceeds the operation deadline, fail without retry rather than shorten the delay. Invalid or unusable Retry-After must be handled conservatively.
- The HTTP server races service work against a 10-second timeout without cancelling it. Restoring delayed retries without cancellation/deadline propagation could send another vendor request after the client has received a timeout. Propagate cancellation/deadlines through queueing, backoff and outbound transport, including coalesced callers; define behavior for unknown vendor receipt after timeout.
- Verify retry policies do not repeat permanent authorization, subscription, invalid-instrument or validation failures; 429 and safe transient 5xx must remain distinct from HTTP 401/403/other permanent failures. Test success, exhaustion, 429, timeout ambiguity, shared concurrent pacing, cancellation, redaction, final result, cache/lineage integrity and batching.
- Update the historical W-12 attempt-budget note only when the replacement policy is implemented and tested; do not tell the operator that bounded retries are currently active. A single invocation remains the currently implemented behavior.

No live Dhan request, credential change, Windows deployment or service restart was performed for this groundwork.
