// CLI entry: `npm run seed`. Populates an empty database with the Venezuela
// scenario. Safe to re-run — does nothing if data already exists.

import { seedIfEmpty } from "./seed.ts";
import { closeDatabase } from "./client.ts";

const seeded = await seedIfEmpty();
console.log(seeded ? "HOS: database seeded with the Venezuela scenario." : "HOS: database already populated; nothing to do.");
await closeDatabase();
