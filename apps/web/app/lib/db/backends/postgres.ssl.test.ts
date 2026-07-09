import { test } from "node:test";
import assert from "node:assert/strict";

import { sslConfig } from "./postgres.ts";

// HOS-2026-015-01 (Judge D3): the Postgres TLS peer-authentication defect.
// The core invariant these tests pin: no hosted connection may silently run TLS
// without verifying the server certificate. rejectUnauthorized:false must only
// ever appear when a human explicitly types HOS_PG_SSL=no-verify.

const HOSTED =
  "postgres://postgres.abcdef:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const HOSTED_DIRECT = "postgres://postgres:pw@db.abcdef.supabase.co:5432/postgres";
const LOCAL = "postgres://postgres:pw@localhost:5432/postgres";
const LOOPBACK = "postgres://postgres:pw@127.0.0.1:5432/postgres";

test("hosted default verifies the peer (rejectUnauthorized:true)", () => {
  const ssl = sslConfig(HOSTED, {});
  assert.deepEqual(ssl, { rejectUnauthorized: true });
});

test("HOS_PG_SSL=require verifies the peer — the regression that must not return", () => {
  // The exact defect: 'require' used to yield rejectUnauthorized:false, so the
  // responsible operator asking for TLS still got no peer authentication.
  const ssl = sslConfig(HOSTED, { HOS_PG_SSL: "require" });
  assert.equal(typeof ssl, "object");
  assert.equal((ssl as { rejectUnauthorized: boolean }).rejectUnauthorized, true);
});

test("NO hosted connection string yields rejectUnauthorized:false by default", () => {
  for (const cs of [HOSTED, HOSTED_DIRECT]) {
    for (const env of [{}, { HOS_PG_SSL: "require" }, { HOS_PG_SSL: "verify-full" }]) {
      const ssl = sslConfig(cs, env);
      assert.notEqual(ssl, false, `${cs} must use TLS`);
      assert.equal(
        (ssl as { rejectUnauthorized: boolean }).rejectUnauthorized,
        true,
        `${cs} with ${JSON.stringify(env)} must verify the peer`,
      );
    }
  }
});

test("HOS_PG_SSL=no-verify is the ONLY path to rejectUnauthorized:false (explicit, human-typed)", () => {
  const ssl = sslConfig(HOSTED, { HOS_PG_SSL: "no-verify" });
  assert.deepEqual(ssl, { rejectUnauthorized: false });
});

test("HOS_PG_SSL=disable turns TLS off entirely", () => {
  assert.equal(sslConfig(HOSTED, { HOS_PG_SSL: "disable" }), false);
});

test("sslmode=disable in the connection string turns TLS off entirely", () => {
  assert.equal(
    sslConfig(HOSTED + "?sslmode=disable", {}),
    false,
  );
});

test("verified localhost/loopback needs no TLS", () => {
  assert.equal(sslConfig(LOCAL, {}), false);
  assert.equal(sslConfig(LOOPBACK, {}), false);
});

test("a pinned CA is attached and still verifies the peer", () => {
  const pem = "-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----";
  const ssl = sslConfig(HOSTED, { HOS_PG_CA_CERT: pem });
  assert.deepEqual(ssl, { rejectUnauthorized: true, ca: pem });
});
