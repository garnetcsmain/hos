// Small dialect helpers shared by the backends. The repositories write one SQL
// string per statement in a deliberately dialect-neutral subset (SELECT/INSERT/
// UPDATE/DELETE, `ON CONFLICT ... DO UPDATE SET x = excluded.x`, `LIMIT ?`,
// `IN (?, ?)`), so the only per-dialect concerns are (a) the placeholder style
// and (b) whether a statement returns rows.

/** True for statements that change data and return no rows — so the sqlite
 *  backend uses `.run()` instead of `.all()`. Postgres runs everything through
 *  the same `query()` path and ignores this. */
export function isWrite(sql: string): boolean {
  return /^\s*(insert|update|delete|replace|create|drop|alter|truncate)\b/i.test(sql);
}

/** Rewrite SQLite-style `?` placeholders to Postgres `$1..$n`, skipping any `?`
 *  that appears inside a single-quoted string literal. The repository SQL never
 *  contains `?` inside a literal, so this is belt-and-suspenders. */
export function toPgPlaceholders(sql: string): string {
  let out = "";
  let n = 0;
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      inString = !inString;
      out += ch;
    } else if (ch === "?" && !inString) {
      out += "$" + ++n;
    } else {
      out += ch;
    }
  }
  return out;
}

/** Drivers reject `undefined` bind values; normalize to SQL NULL. Domain params
 *  are already string | number | null, so this only guards accidental holes. */
export function coerceParams(params: readonly unknown[]): unknown[] {
  return params.map((p) => (p === undefined ? null : p));
}
