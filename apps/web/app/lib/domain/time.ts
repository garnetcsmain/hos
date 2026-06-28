/** Current timestamp as an ISO-8601 UTC string. Single chokepoint so tests or
 *  a deterministic clock can stub it later if needed. */
export const nowIso = (): string => new Date().toISOString();
