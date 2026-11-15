# Dhan quote retry policy — implementation and remaining limitations

The owner reversed the W-12 single-attempt product restriction. The local candidate restores bounded quote retries: `IIPS_DHAN_QUOTE_MAX_ATTEMPTS` is an integer from 1 to 10, default 3 total attempts. Transient transport errors, timeouts, rate limits and HTTP 500/502/503/504 are retried with exponential backoff and jitter; other failures stop. Exhaustion is explicit. Valid Retry-After on 429/503 is honored; if the requested delay exceeds 30 seconds, the failure is returned instead of retrying early. Quote attempts share a per-orchestrator serialized gate with at least one second after the preceding fetch completes, and each attempt consumes the existing rate budget. Concurrent same-identity refreshes coalesce. Recent sanitized attempt events are available through the service diagnostics accessor; they contain no body, credentials, headers or instrument identity.

## Remaining limitations

- This does **not** implement portfolio batching: the API client can serialize multiple instruments, but the service and HTTP quote route currently fetch one resolved identity per request. Large portfolios would incur one provider call per holding and may hit the bounded queue or request timeouts. Batch quote support remains open.
- The HTTP handler has a 10-second timeout and does not cancel service work. Queued work and retries can continue after the caller receives 504. Coalescing and pacing are process-local, not shared across daemon instances; the historical-data path has its existing independent controls. A timeout can occur after the provider received a read-only request.
- Diagnostics are in-memory through the service accessor, not exposed by an HTTP diagnostics route or persisted. The 30-second limit is per retry delay, not an overall deadline.
- Offline tests do not prove live provider behavior. W-12 and M2 qualification remain open. W-06 remains COMPLETE — OWNER ATTESTED; the Friday closing snapshot and its UNAVAILABLE freshness remain unchanged.

No live Dhan request, credential change, Windows deployment or service restart was performed.
