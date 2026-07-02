// Boundary validation for the coordination epic (HOS-2026-007). Every payload is
// validated here before it reaches the service layer.

import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => v ?? "");

const category = z.enum([
  "rescue",
  "water",
  "food",
  "formula",
  "medical",
  "shelter",
  "hygiene",
  "clothing",
  "other",
]);

const siteCategory = z
  .enum(["acopio", "refugio", "medico", "internet", "mascotas", "otro"])
  .default("otro");

// Only for publicly-listed aid points (already on a public map); needs never
// carry coordinates.
const coordinate = (min: number, max: number) =>
  z.number().min(min).max(max).nullish().transform((v) => v ?? null);

const urgency = z.enum(["low", "normal", "high", "critical"]).default("normal");

const quantity = z.number().int().min(1).max(1_000_000).optional().transform((v) => v ?? 1);

export const orgCreateSchema = z.object({
  name: z.string().trim().min(1, "org name is required").max(160),
  kind: z
    .enum(["shelter", "responder", "ngo", "government", "hospital", "other"])
    .default("other"),
});

export const siteCreateSchema = z.object({
  name: z.string().trim().min(1, "site name is required").max(160),
  orgId: z.string().trim().min(1, "org is required").max(40),
  district: z.string().trim().min(1, "district is required").max(120),
  category: siteCategory,
  lat: coordinate(-90, 90),
  lng: coordinate(-180, 180),
  bedsTotal: z.number().int().min(0).max(1_000_000).optional().transform((v) => v ?? 0),
  bedsFree: z.number().int().min(0).max(1_000_000).optional().transform((v) => v ?? 0),
  notes: optionalText(2000),
});

export const siteUpdateSchema = z.object({
  siteId: z.string().trim().min(1).max(40),
  bedsTotal: z.number().int().min(0).max(1_000_000),
  bedsFree: z.number().int().min(0).max(1_000_000),
  status: z.enum(["active", "closed"]).default("active"),
  notes: optionalText(2000),
});

export const needCreateSchema = z.object({
  orgId: z.string().trim().min(1, "requesting org is required").max(40),
  siteId: z.string().trim().max(40).optional().transform((v) => (v ? v : null)),
  district: z.string().trim().min(1, "district is required").max(120),
  category,
  quantity,
  unit: optionalText(40),
  urgency,
  notes: optionalText(2000),
});

// Status transitions. "claim" needs the committing org; "receive" is the
// requesting site confirming real receipt (never the claimer); "cancel" retires
// a need honestly.
export const needTransitionSchema = z.object({
  needId: z.string().trim().min(1).max(40),
  action: z.enum(["claim", "receive", "cancel"]),
  byOrgId: z.string().trim().max(40).optional().transform((v) => (v ? v : null)),
  note: optionalText(2000),
});

export const offerCreateSchema = z.object({
  orgId: z.string().trim().min(1, "offering org is required").max(40),
  district: z.string().trim().min(1, "district is required").max(120),
  category,
  quantity,
  unit: optionalText(40),
  notes: optionalText(2000),
});

export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
export type NeedCreateInput = z.infer<typeof needCreateSchema>;
export type NeedTransitionInput = z.infer<typeof needTransitionSchema>;
export type OfferCreateInput = z.infer<typeof offerCreateSchema>;
