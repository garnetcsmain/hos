// CLI entry: `npm run sync:coordination`. Incremental reconcile against the
// caracasayuda.com public source (see coordinationSync.ts). NON-destructive:
// rows created or edited directly in HOS always win over the source.

import { closeDatabase } from "./client.ts";
import { runCoordinationSync } from "./coordinationSync.ts";

try {
  const summary = await runCoordinationSync();
  console.log(
    `HOS: coordination sync ok — ${summary.fetched} source rows; ` +
      `sites +${summary.sitesInserted}/~${summary.sitesUpdated}, ` +
      `needs +${summary.needsInserted}/~${summary.needsUpdated}, ` +
      `${summary.preservedLocalEdits} local edits preserved, ` +
      `${summary.skippedFlaggedOld} flagged old, ${summary.skippedOutOfScope} out of scope.`,
  );
} finally {
  await closeDatabase();
}
