import { test } from "node:test";
import assert from "node:assert/strict";

// In-memory DB; set before db/client.ts is imported (see coordination.flow.test.ts).
process.env.HOS_DB_PATH = ":memory:";

const { appendEvent, latestEventByEntity } = await import("./events.ts");
const { resetAllTablesForTests } = await import("../db/testing.ts");

await resetAllTablesForTests();

test("latestEventByEntity returns the most recent event of a type per entity", async () => {
  // Two sites, each confirmed more than once; a different event type mixed in.
  await appendEvent({ entityType: "site", entityId: "SITE-A", type: "site.confirmed", actor: "org:A", payload: { trust: "honor" } });
  await appendEvent({ entityType: "site", entityId: "SITE-A", type: "site.capacity_updated", actor: "org:A", payload: {} });
  await appendEvent({ entityType: "site", entityId: "SITE-A", type: "site.confirmed", actor: "org:A", payload: { trust: "verified" } });
  await appendEvent({ entityType: "site", entityId: "SITE-B", type: "site.confirmed", actor: "org:B", payload: { trust: "honor" } });

  const latest = await latestEventByEntity("site", "site.confirmed");

  // SITE-A: the SECOND confirm (verified) wins, not the first and not the
  // interleaved capacity_updated.
  assert.equal((latest.get("SITE-A")!.payload as { trust?: string }).trust, "verified");
  assert.equal(latest.get("SITE-B")!.payload.trust, "honor");
  assert.equal(latest.size, 2);
});

test("latestEventByEntity ignores other entity types and returns an empty map when nothing matches", async () => {
  const none = await latestEventByEntity("need", "site.confirmed");
  assert.equal(none.size, 0);
});
