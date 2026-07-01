import { test } from "node:test";
import assert from "node:assert/strict";

import {
  checkCoordinatorBootConfig,
  assertCoordinatorBootConfig,
} from "./bootGuard.ts";

test("boot guard: refuses a non-local deploy with no token and no dev-open", () => {
  const r = checkCoordinatorBootConfig({ NODE_ENV: "production" });
  assert.equal(r.ok, false);
});

test("boot guard: a token configured allows start in production", () => {
  const r = checkCoordinatorBootConfig({
    NODE_ENV: "production",
    HOS_COORDINATOR_TOKEN: "s3cret",
  });
  assert.equal(r.ok, true);
});

test("boot guard: explicit HOS_DEV_OPEN=1 allows start (open is human-typed)", () => {
  const r = checkCoordinatorBootConfig({
    NODE_ENV: "production",
    HOS_DEV_OPEN: "1",
  });
  assert.equal(r.ok, true);
});

test("boot guard: local dev/test/unset start fine (per-request gate still fails closed)", () => {
  assert.equal(checkCoordinatorBootConfig({ NODE_ENV: "development" }).ok, true);
  assert.equal(checkCoordinatorBootConfig({ NODE_ENV: "test" }).ok, true);
  assert.equal(checkCoordinatorBootConfig({ NODE_ENV: undefined }).ok, true);
});

test("boot guard: a custom non-local NODE_ENV (staging) is not a free pass", () => {
  assert.equal(checkCoordinatorBootConfig({ NODE_ENV: "staging" }).ok, false);
});

test("boot guard: invite-only Supabase auth (url+key+allowlist) allows start in production", () => {
  const r = checkCoordinatorBootConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    HOS_COORDINATOR_EMAILS: "coord@example.org",
  });
  assert.equal(r.ok, true);
});

test("boot guard: Supabase url+key but an EMPTY allowlist still refuses (admits nobody)", () => {
  // The regression behind the /coordination 500's sibling failure: turning on
  // Supabase auth without naming any coordinator must not count as configured.
  assert.equal(
    checkCoordinatorBootConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    }).ok,
    false,
  );
  assert.equal(
    checkCoordinatorBootConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      HOS_COORDINATOR_EMAILS: "   ",
    }).ok,
    false,
  );
});

test("boot guard: Supabase URL without an anon key does not count as configured", () => {
  assert.equal(
    checkCoordinatorBootConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
      HOS_COORDINATOR_EMAILS: "coord@example.org",
    }).ok,
    false,
  );
});

test("boot guard: HOS_DEV_OPEN must be exactly '1', not any truthy string", () => {
  assert.equal(
    checkCoordinatorBootConfig({ NODE_ENV: "production", HOS_DEV_OPEN: "true" }).ok,
    false,
  );
});

test("assertCoordinatorBootConfig throws when misconfigured, is silent when ok", () => {
  assert.throws(() => assertCoordinatorBootConfig({ NODE_ENV: "production" }));
  assert.doesNotThrow(() =>
    assertCoordinatorBootConfig({
      NODE_ENV: "production",
      HOS_COORDINATOR_TOKEN: "s3cret",
    }),
  );
});
