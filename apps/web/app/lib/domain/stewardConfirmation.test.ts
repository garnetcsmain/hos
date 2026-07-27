import { test } from "node:test";
import assert from "node:assert/strict";

import {
  bandForDayDiff,
  OVER_WEEK_MAX_DAYS,
  publicStewardConfirmation,
  STEWARD_CONFIRMATION_SCHEMA_VERSION,
  WITHIN_WEEK_MAX_DAYS,
} from "./stewardConfirmation.ts";

// A fixed snapshot instant with a deliberately non-midnight time-of-day, so the
// time-of-day-independence tests are meaningful.
const NOW = "2026-07-27T14:32:07.000Z";

test("bands map to the documented day-difference boundaries", () => {
  assert.equal(bandForDayDiff(0), "today");
  assert.equal(bandForDayDiff(1), "yesterday");
  assert.equal(bandForDayDiff(2), "within_week");
  assert.equal(bandForDayDiff(WITHIN_WEEK_MAX_DAYS), "within_week");
  assert.equal(bandForDayDiff(WITHIN_WEEK_MAX_DAYS + 1), "over_week");
  assert.equal(bandForDayDiff(OVER_WEEK_MAX_DAYS), "over_week");
  assert.equal(bandForDayDiff(OVER_WEEK_MAX_DAYS + 1), "stale");
});

test("a future-dated confirmation (clock skew) collapses to today, never a future band", () => {
  assert.equal(bandForDayDiff(-3), "today");
  const r = publicStewardConfirmation("2026-07-28T02:00:00.000Z", NOW);
  assert.equal(r.band, "today");
});

test("null / empty / unparseable last-confirmation reads as never (fail safe, not today)", () => {
  for (const input of [null, undefined, "", "not-a-date"]) {
    const r = publicStewardConfirmation(input as string | null, NOW);
    assert.equal(r.band, "never", `input ${JSON.stringify(input)}`);
    assert.equal(r.label, "sin confirmación registrada");
  }
});

test("an unparseable `now` collapses to never rather than guessing a band", () => {
  const r = publicStewardConfirmation("2026-07-27T09:00:00.000Z", "garbage");
  assert.equal(r.band, "never");
});

// --- The core security property: the band is a whole-UTC-day rollup and never
// betrays the confirmation TIME-OF-DAY. Two confirmations on the same UTC day
// at very different hours must yield an identical projection. If they differed,
// an observer could read the steward's routine off the band. -----------------
test("same UTC day, different hours -> identical band (no cadence leak)", () => {
  const earlyMorning = publicStewardConfirmation("2026-07-27T02:11:00.000Z", NOW);
  const lateEvening = publicStewardConfirmation("2026-07-27T23:47:00.000Z", NOW);
  assert.deepEqual(earlyMorning, lateEvening);
  assert.equal(earlyMorning.band, "today");
});

test("the band transition is anchored to UTC midnight, not to the confirmation hour", () => {
  // A steward who confirmed at 14:00 on the 26th. Observed just before and just
  // after UTC midnight on the 27th->28th boundary, the band flips from
  // "yesterday" to "within_week" at 00:00 — NOT 24 h after 14:00. A rolling-24h
  // window would leak the 14:00 routine here; the day-granular band does not.
  const conf = "2026-07-26T14:00:00.000Z";
  const justBeforeMidnight = publicStewardConfirmation(conf, "2026-07-27T23:59:00.000Z");
  const justAfterMidnight = publicStewardConfirmation(conf, "2026-07-28T00:01:00.000Z");
  assert.equal(justBeforeMidnight.band, "yesterday");
  assert.equal(justAfterMidnight.band, "within_week");
  // The flip happened at 00:01, which is nowhere near 24h-after-14:00 (14:00),
  // so the transition time carries no information about the 14:00 confirmation.
});

test("a steward confirming daily at a fixed hour shows a constant band (no drift signal)", () => {
  // Confirms every day at 08:00; observed every day at the same 14:32 snapshot.
  // Because the most recent confirmation is always "today", the public band is
  // constant across days — differencing snapshots reveals nothing.
  const days = ["2026-07-25", "2026-07-26", "2026-07-27"];
  const bands = days.map((d) =>
    publicStewardConfirmation(`${d}T08:00:00.000Z`, `${d}T14:32:07.000Z`).band,
  );
  assert.deepEqual(bands, ["today", "today", "today"]);
});

test("labels are coarse and carry no time-of-day", () => {
  const cases: Array<[string, string]> = [
    ["2026-07-27T09:00:00.000Z", "confirmado hoy"],
    ["2026-07-26T09:00:00.000Z", "confirmado ayer"],
    ["2026-07-23T09:00:00.000Z", "confirmado en la última semana"],
    ["2026-07-10T09:00:00.000Z", "sin confirmar hace más de una semana"],
    ["2026-05-01T09:00:00.000Z", "sin confirmación reciente"],
  ];
  for (const [when, label] of cases) {
    assert.equal(publicStewardConfirmation(when, NOW).label, label, when);
  }
});

// --- Leak fuzz: feed the projection a confirmation instant carrying a precise
// time and assert none of that precision survives serialization. Mirrors the
// publicFeed.ts serialization-leak test. --------------------------------------
test("no precise instant, hour, name, or contact survives serialization", () => {
  const preciseInstant = "2026-07-27T14:32:07.123Z";
  const r = publicStewardConfirmation(preciseInstant, NOW);
  const wire = JSON.stringify(r);

  // The exact timestamp and its distinctive sub-parts must be absent.
  assert.ok(!wire.includes(preciseInstant), "full instant leaked");
  assert.ok(!wire.includes("14:32"), "time-of-day leaked");
  assert.ok(!wire.includes(":07"), "seconds leaked");
  assert.ok(!wire.includes("123"), "milliseconds leaked");
  // Day/month digits ("27"/"07") may legitimately appear in the schema version
  // (1) but not as a date; assert the only numeric field is the schema version.
  const parsed = JSON.parse(wire);
  assert.deepEqual(Object.keys(parsed).sort(), ["band", "label", "schemaVersion"]);
  assert.equal(parsed.schemaVersion, STEWARD_CONFIRMATION_SCHEMA_VERSION);
  assert.equal(typeof parsed.band, "string");
  assert.equal(typeof parsed.label, "string");
});

test("the DTO shape is exactly {schemaVersion, band, label} for every band", () => {
  const inputs: Array<string | null> = [
    null,
    "2026-07-27T09:00:00.000Z",
    "2026-07-26T09:00:00.000Z",
    "2026-07-22T09:00:00.000Z",
    "2026-07-05T09:00:00.000Z",
    "2026-01-01T09:00:00.000Z",
  ];
  for (const input of inputs) {
    const r = publicStewardConfirmation(input, NOW);
    assert.deepEqual(Object.keys(r).sort(), ["band", "label", "schemaVersion"]);
  }
});
