import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureMigrations } from "../src/persistence/migration_ledger.js";
import { GATE3_MIGRATIONS } from "../src/ipc/entrypoint.js";
import { DurablePortfolioStore } from "../src/persistence/portfolio_store.js";
import { freshnessStatus } from "../src/providers/dhan/dhan_freshness_status.js";
import type { CanonicalEnvelope } from "../src/contracts/envelope.js";
import type { MarketQuotePayload } from "../src/contracts/d01_quotes.js";
const a = { canonicalOwnerId: "owner-a", tenantId: "tenant-a" },
  b = { canonicalOwnerId: "owner-b", tenantId: "tenant-b" };
const req = (n: number) => ({
  holdings: [
    {
      symbol: "TEST",
      companyId: "COMP-TEST",
      quantity: 1,
      averageBuyPrice: 10,
      currentPrice: n,
      marketValue: n,
      weightPercentage: 100,
      active: true,
      sourceBroker: "GENERIC",
      lineageDigest: `line-${n}`,
      identityStatus: "RESOLVED",
      resolutionDisposition: "CANONICAL_P04",
    },
  ],
  provenanceDigest: `prov-${n}`,
});
function fixture(mode: "WAL" | "DELETE" = "WAL") {
  const dir = mkdtempSync(join(tmpdir(), "ipd-stage2-race-"));
  const path = join(dir, "data.db");
  const r = new DatabaseSync(path);
  r.exec(`PRAGMA journal_mode=${mode}`);
  ensureMigrations(r, GATE3_MIGRATIONS);
  const w = new DatabaseSync(path);
  const writer = new DurablePortfolioStore(w);
  return {
    r,
    w,
    writer,
    close: () => {
      w.close();
      r.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
function readerWithBarrier(
  db: DatabaseSync,
  needle: string,
  after: () => void,
) {
  let fired = false;
  const dbProxy = new Proxy(db, {
    get(target, prop) {
      if (prop === "prepare")
        return (sql: string) => {
          const stmt = target.prepare(sql);
          return new Proxy(stmt, {
            get(st, p) {
              const value = Reflect.get(st, p, st);
              if ((p === "get" || p === "all") && sql.includes(needle))
                return (...args: any[]) => {
                  const result = (value as Function).apply(st, args);
                  if (!fired) {
                    fired = true;
                    after();
                  }
                  return result;
                };
              return typeof value === "function" ? value.bind(st) : value;
            },
          });
        };
      const v = Reflect.get(target, prop, target);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return {
    store: new DurablePortfolioStore(dbProxy as DatabaseSync),
    fired: () => fired,
  };
}
test("list then competing save: detail and history show new revision, list remains older", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const first = new DurablePortfolioStore(f.r).list(a);
    f.writer.save(a, "P", req(20), 1);
    const d = new DurablePortfolioStore(f.r).get(a, "P");
    const history = new DurablePortfolioStore(f.r).revisions(a, "P");
    assert.equal(first[0].revision, 1);
    assert.equal(d.revision, 2);
    assert.equal(d.holdings[0].currentPrice, 20);
    assert.equal(history.length, 2);
  } finally {
    f.close();
  }
});
test("commit between revision resolution and later reads preserves captured revision holdings", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const r = readerWithBarrier(
      f.r,
      "SELECT portfolio_id, current_revision, status",
      () => f.writer.save(a, "P", req(20), 1),
    );
    const d = r.store.get(a, "P");
    assert.equal(r.fired(), true);
    assert.equal(d.revision, 1);
    assert.equal(d.holdings[0].currentPrice, 10);
    assert.equal(f.writer.get(a, "P").revision, 2);
  } finally {
    f.close();
  }
});
test("commit reset before contribution query: detail retains the captured ledger snapshot", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const r = readerWithBarrier(f.r, "FROM portfolio_holdings", () =>
      f.writer.reset(a, "P", req(20), 1),
    );
    const d = r.store.get(a, "P");
    assert.equal(r.fired(), true);
    assert.equal(d.revision, 1);
    assert.equal(d.holdings[0].currentPrice, 10);
    assert.equal(d.contributions.length, 1);
    assert.equal(d.contributions[0].amount, 10);
    assert.equal(f.writer.get(a, "P").revision, 2);
  } finally {
    f.close();
  }
});
test("tombstone after resolution: in-flight pre-delete read then subsequent refusal", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const r = readerWithBarrier(
      f.r,
      "SELECT portfolio_id, current_revision, status",
      () => f.writer.delete(a, "P", 1),
    );
    const d = r.store.get(a, "P");
    assert.equal(r.fired(), true);
    assert.equal(d.revision, 1);
    assert.throws(() => r.store.get(a, "P"));
    assert.throws(() => r.store.get(b, "P"));
    assert.equal(r.store.list(a).length, 0);
  } finally {
    f.close();
  }
});
test("multiple owners, reset retention and revision cap", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    f.writer.create(b, "Q", req(30));
    const r = new DurablePortfolioStore(f.r, undefined, { revisionCap: 2 });
    const list = r.list(a);
    f.writer.reset(a, "P", req(20), 1);
    assert.equal(list[0].revision, 1);
    assert.equal(r.get(a, "P").revision, 2);
    assert.equal(r.revisions(a, "P").length, 2);
    assert.equal(r.holdingsForRevision(a, "P", 1)[0].currentPrice, 10);
    assert.equal(r.list(b).length, 1);
    assert.throws(() => r.get(b, "P"));
    assert.throws(() => r.save(a, "P", req(40), 2));
  } finally {
    f.close();
  }
});
test("v2 revalidation stays on the same snapshot as holdings", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const r = readerWithBarrier(f.r, "FROM portfolio_holdings", () =>
      f.writer.reset(a, "P", req(20), 1),
    );
    const d = r.store.getV2(a, "P");
    assert.equal(r.fired(), true);
    assert.equal(d.revision, 1);
    assert.equal(d.holdings[0].currentPrice, 10);
    assert.equal(d.contributions[0].amount, 10);
    assert.equal(f.writer.get(a, "P").revision, 2);
  } finally {
    f.close();
  }
});
test("history availability and revision rows use one snapshot during commit", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const r = readerWithBarrier(
      f.r,
      "SELECT portfolio_id, current_revision, status",
      () => f.writer.save(a, "P", req(20), 1),
    );
    const history = r.store.revisions(a, "P");
    assert.equal(r.fired(), true);
    assert.equal(history.length, 1);
    assert.equal(history[0].revision, 1);
    assert.equal(f.writer.revisions(a, "P").length, 2);
  } finally {
    f.close();
  }
});
test("existing caller transaction stays open after successful and refused reads", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const s = new DurablePortfolioStore(f.r);
    f.r.exec("BEGIN");
    assert.equal(s.get(a, "P").revision, 1);
    assert.equal(f.r.isTransaction, true);
    assert.throws(() => s.get(b, "P"));
    assert.equal(f.r.isTransaction, true);
    f.r.exec("ROLLBACK");
    assert.equal(f.r.isTransaction, false);
  } finally {
    f.close();
  }
});
test("refused owned-snapshot reads release their transaction", () => {
  const f = fixture();
  try {
    const s = new DurablePortfolioStore(f.r);
    assert.throws(() => s.get(a, "ABSENT"));
    assert.equal(f.r.isTransaction, false);
    assert.throws(() => s.revisions(a, "ABSENT"));
    assert.equal(f.r.isTransaction, false);
  } finally {
    f.close();
  }
});
test("default rollback journal does not mix a concurrent reset into a detail read", () => {
  const f = fixture("DELETE");
  try {
    f.writer.create(a, "P", req(10));
    let writerError: unknown;
    const r = readerWithBarrier(f.r, "FROM portfolio_holdings", () => {
      try {
        f.writer.reset(a, "P", req(20), 1);
      } catch (error) {
        writerError = error;
      }
    });
    const d = r.store.get(a, "P");
    assert.equal(r.fired(), true);
    assert.equal(d.revision, 1);
    assert.equal(d.contributions[0].amount, 10);
    assert.ok(
      writerError,
      "conflicting writer must not commit through a rollback-journal read",
    );
    assert.equal(f.writer.get(a, "P").revision, 1);
  } finally {
    f.close();
  }
});

// These are independently observed facts, not an atomic portfolio/quote snapshot.
test("portfolio revision and independent freshness evaluations retain separate observation times", () => {
  const f = fixture();
  try {
    f.writer.create(a, "P", req(10));
    const oldRevision = new DurablePortfolioStore(f.r).get(a, "P").revision;
    const entry = {
      provenance: {
        asOf: "2026-01-01T00:00:00.000Z",
        receivedAt: "2026-01-01T00:00:01.000Z",
        evaluatedAt: "2026-01-01T00:00:02.000Z",
      },
    } as CanonicalEnvelope<MarketQuotePayload>;
    const refresh = { outcome: "UNKNOWN" as const, lastFailure: null };
    const first = freshnessStatus(
      "D01_QUOTES",
      { state: "CURRENT", entry },
      "2026-01-01T00:01:00.000Z",
      refresh,
    );
    f.writer.save(a, "P", req(20), 1);
    const second = freshnessStatus(
      "D01_QUOTES",
      { state: "CURRENT", entry },
      "2026-01-01T00:16:00.000Z",
      refresh,
    );
    assert.equal(oldRevision, 1);
    assert.equal(f.writer.get(a, "P").revision, 2);
    assert.equal(first.verdict, "GOOD");
    assert.equal(second.verdict, "STALE");
    assert.notEqual(first.evaluatedAt, second.evaluatedAt);
    assert.equal(first.asOf, second.asOf);
  } finally {
    f.close();
  }
});
