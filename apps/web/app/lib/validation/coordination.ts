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

// Precise coordinates are permitted on coordinator-gated records (human D1
// answer 2026-07-03); district remains the required coarse key everywhere.
const coordinate = (min: number, max: number) =>
  z.number().min(min).max(max).nullish().transform((v) => v ?? null);

const urgency = z.enum(["low", "normal", "high", "critical"]).default("normal");

const quantity = z.number().int().min(1).max(1_000_000).optional().transform((v) => v ?? 1);

export const orgCreateSchema = z.object({
  name: z.string().trim().min(1, "org name is required").max(160),
  kind: z
    .enum([
      "shelter",
      "responder",
      "ngo",
      "government",
      "hospital",
      "church",
      "community",
      "volunteers",
      "school",
      "business",
      "other",
    ])
    .default("other"),
});

// Coverage radius: up to 20 km (a whole zone). 0/absent = a point. Lets several
// groups share an address by covering different areas. Kept optional (not
// transformed to a default) so the service's parsed input type stays lenient.
const radius = z.number().int().min(0).max(20_000).nullish();

// When category is "otro", the free-text the person typed so recurring answers
// can become real categories later (tallied via the audit event).
const otherLabel = z.string().trim().max(80).optional();

export const siteCreateSchema = z.object({
  name: z.string().trim().min(1, "site name is required").max(160),
  orgId: z.string().trim().min(1, "org is required").max(40),
  category: siteCategory,
  district: z.string().trim().min(1, "district is required").max(120),
  lat: coordinate(-90, 90),
  lng: coordinate(-180, 180),
  radiusM: radius,
  bedsTotal: z.number().int().min(0).max(1_000_000).optional().transform((v) => v ?? 0),
  bedsFree: z.number().int().min(0).max(1_000_000).optional().transform((v) => v ?? 0),
  notes: optionalText(2000),
  otherLabel,
});

export const siteUpdateSchema = z.object({
  siteId: z.string().trim().min(1).max(40),
  bedsTotal: z.number().int().min(0).max(1_000_000),
  bedsFree: z.number().int().min(0).max(1_000_000),
  status: z.enum(["active", "closed"]).default("active"),
  notes: optionalText(2000),
});

// One-tap "operativo" confirmation (HOS-2026-014-01). Just the site — the tier is
// server-set ('honor' under interim auth), never client-supplied, so a caller
// cannot claim a 'verified' confirmation.
export const siteConfirmSchema = z.object({
  siteId: z.string().trim().min(1).max(40),
});

// Site broadcast ("hoy entregan comida 2-5pm"). Empty message clears it.
// hoursValid bounds how long it stays visible (max one week — a standing
// notice belongs in the site notes, not a broadcast).
export const siteAnnouncementSchema = z.object({
  siteId: z.string().trim().min(1).max(40),
  message: z.string().trim().max(200).optional().transform((v) => v ?? ""),
  hoursValid: z.number().int().min(1).max(168).optional().transform((v) => v ?? 24),
});

export const needCreateSchema = z.object({
  orgId: z.string().trim().min(1, "requesting org is required").max(40),
  siteId: z.string().trim().max(40).optional().transform((v) => (v ? v : null)),
  district: z.string().trim().min(1, "district is required").max(120),
  lat: coordinate(-90, 90),
  lng: coordinate(-180, 180),
  category,
  quantity,
  unit: optionalText(40),
  urgency,
  notes: optionalText(2000),
  otherLabel,
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
  otherLabel,
});

export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
export type SiteConfirmInput = z.infer<typeof siteConfirmSchema>;
export type SiteAnnouncementInput = z.infer<typeof siteAnnouncementSchema>;
export type NeedCreateInput = z.infer<typeof needCreateSchema>;
export type NeedTransitionInput = z.infer<typeof needTransitionSchema>;
export type OfferCreateInput = z.infer<typeof offerCreateSchema>;
