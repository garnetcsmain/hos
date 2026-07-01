import { test } from "node:test";
import assert from "node:assert/strict";

import { requireCoordinator } from "./auth.ts";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://local/api", { headers: new Headers(headers) });
}

const okSession = async () => ({ email: "coord@example.org", userId: "u1" });
const noSession = async () => null;

function clearEnv() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.HOS_COORDINATOR_TOKEN;
  delete process.env.HOS_DEV_OPEN;
}

function configureSupabase() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
}

test("unconfigured: falls back to the token gate — fail closed without a token", async () => {
  clearEnv();
  await assert.rejects(() => requireCoordinator(req(), { sessionFromRequest: noSession }));
});

test("unconfigured: a valid coordinator token passes (unchanged behavior)", async () => {
  clearEnv();
  process.env.HOS_COORDINATOR_TOKEN = "s3cret";
  await assert.doesNotReject(() =>
    requireCoordinator(req({ "x-hos-coordinator-token": "s3cret" }), { sessionFromRequest: noSession }),
  );
  clearEnv();
});

test("configured: an allowlisted Supabase session passes with no token", async () => {
  clearEnv();
  configureSupabase();
  await assert.doesNotReject(() => requireCoordinator(req(), { sessionFromRequest: okSession }));
  clearEnv();
});

test("configured: no session and no token is rejected", async () => {
  clearEnv();
  configureSupabase();
  await assert.rejects(() => requireCoordinator(req(), { sessionFromRequest: noSession }));
  clearEnv();
});

test("configured: no session but a valid break-glass token still passes", async () => {
  clearEnv();
  configureSupabase();
  process.env.HOS_COORDINATOR_TOKEN = "s3cret";
  await assert.doesNotReject(() =>
    requireCoordinator(req({ "x-hos-coordinator-token": "s3cret" }), { sessionFromRequest: noSession }),
  );
  clearEnv();
});
