// CLI entry: `npm run seed:coordination`. Clears ALL coordination data (needs,
// offers, sites, orgs) and reseeds it from the caracasayuda.com import. The
// reunification tables (missing/found reports) and the audit event log are NOT
// touched. Dev/ops utility — the destructive step is scoped and announced.

import { db, closeDatabase, transaction } from "./client.ts";
import { appendEvent } from "../repositories/events.ts";
import { seedCoordinationIfEmpty } from "./coordinationSeed.ts";

await transaction(async () => {
  // FK-safe order: children before parents.
  for (const table of ["needs", "offers", "sites", "orgs"]) {
    await db.prepare(`DELETE FROM ${table}`).run();
  }
  await appendEvent({
    entityType: "coordination",
    entityId: "caracasayuda-import",
    type: "coordination.cleared",
    actor: "system:import",
    payload: { reason: "reseed from caracasayuda.com" },
  });
});

const seeded = await seedCoordinationIfEmpty();
console.log(
  seeded
    ? "HOS: coordination data cleared and reseeded from caracasayuda.com."
    : "HOS: coordination data cleared but reseed did not run (orgs not empty?).",
);
await closeDatabase();
