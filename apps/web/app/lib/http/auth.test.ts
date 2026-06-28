import { test } from "node:test";
import assert from "node:assert/strict";

import { assertCoordinator } from "./auth.ts";

function req(token?: string): Request {
  const headers = new Headers();
  if (token !== undefined) headers.set("x-hos-coordinator-token", token);
  return new Request("http://local/api", { headers });
}

const hasStatus = (status: number) => (e: unknown) =>
  typeof e === "object" && e !== null && (e as { status?: number }).status === status;

test("fails CLOSED with 503 when no token and no dev-open flag", () => {
  delete process.env.HOS_COORDINATOR_TOKEN;
  delete process.env.HOS_DEV_OPEN;
  assert.throws(() => assertCoordinator(req()), hasStatus(503));
});

test("HOS_DEV_OPEN=1 opens the gate for local dev", () => {
  delete process.env.HOS_COORDINATOR_TOKEN;
  process.env.HOS_DEV_OPEN = "1";
  assert.doesNotThrow(() => assertCoordinator(req()));
  delete process.env.HOS_DEV_OPEN;
});

test("with a token set, a wrong or missing token is rejected 401", () => {
  process.env.HOS_COORDINATOR_TOKEN = "s3cret-token-value";
  assert.throws(() => assertCoordinator(req("wrong")), hasStatus(401));
  assert.throws(() => assertCoordinator(req()), hasStatus(401));
  assert.doesNotThrow(() => assertCoordinator(req("s3cret-token-value")));
  delete process.env.HOS_COORDINATOR_TOKEN;
});
