// Boundary validation. Every public payload is validated against one of these
// schemas before it reaches domain logic (AGENTS.md §3). Defaults enforce
// data minimization — optional sensitive fields collapse to empty, never undefined.

import { z } from "zod";

const sexSchema = z.enum(["F", "M", "U"]).default("U");
const conditionSchema = z
  .enum(["alive", "injured", "hospitalized", "deceased", "unknown"])
  .default("unknown");

// Accept a date as YYYY-MM-DD or ISO; empty string becomes null.
const optionalDate = z
  .string()
  .trim()
  .max(40)
  .optional()
  .transform((value) => (value ? value : null));

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value ?? "");

const ageSchema = z
  .union([z.number(), z.null()])
  .optional()
  .transform((value) => (value === undefined || value === null ? null : value))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0 && value <= 120), {
    message: "age must be between 0 and 120",
  });

export const missingReportSchema = z.object({
  fullName: z.string().trim().min(1, "name is required").max(160),
  age: ageSchema,
  sex: sexSchema,
  lastSeenLocation: optionalText(160),
  city: optionalText(120),
  lastSeenAt: optionalDate,
  description: optionalText(2000),
  sensitiveNotes: optionalText(2000),
  reporterName: optionalText(160),
  reporterRelationship: optionalText(80),
  reporterContact: optionalText(160),
  consent: z.boolean().optional().transform((value) => value ?? true),
  photoUrl: z.string().trim().url().max(500).optional().transform((value) => value ?? null),
});

export const foundReportSchema = z.object({
  fullName: optionalText(160),
  age: ageSchema,
  sex: sexSchema,
  foundLocation: optionalText(160),
  city: optionalText(120),
  foundAt: optionalDate,
  condition: conditionSchema,
  description: optionalText(2000),
  reporterOrg: z.string().trim().min(1, "reporting organization is required").max(160),
  reporterName: optionalText(160),
  reporterContact: optionalText(160),
  photoUrl: z.string().trim().url().max(500).optional().transform((value) => value ?? null),
});

export const verificationSchema = z.object({
  candidateId: z.string().trim().min(1).max(40),
  decision: z.enum(["confirmed", "rejected", "needs_more"]),
  verifierOrg: z.string().trim().min(1, "verifying organization is required").max(160),
  verifierName: optionalText(160),
  evidence: optionalText(2000),
  confidence: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .transform((value) => (value === undefined ? null : value)),
});

export type MissingReportInput = z.infer<typeof missingReportSchema>;
export type FoundReportInput = z.infer<typeof foundReportSchema>;
export type VerificationInput = z.infer<typeof verificationSchema>;
