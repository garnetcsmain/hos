// Seed scenario: HOS Response Kit — Venezuela 2026 (La Guaira / Caracas
// corridor). Realistic missing + found reports that exercise the matcher,
// including the thesis showcase (Carlos Perez, ~strong match across a shelter
// move) and a nickname case (Pepe -> José) and two unidentified-person matches.
//
// Idempotent: only seeds when the database is empty.

import { insertMissing, countMissing } from "../repositories/missingReports.ts";
import { insertFound, countFound } from "../repositories/foundReports.ts";
import { appendEvent } from "../repositories/events.ts";
import { transaction } from "../db/client.ts";
import { newFoundId, newMissingId, deriveGivenName } from "../domain/ids.ts";
import { nowIso } from "../domain/time.ts";
import { recomputeAll } from "../services/matcher.ts";
import type { Condition, FoundReport, MissingReport, Sex } from "@/app/lib/domain/types";

interface MissingSeed {
  fullName: string;
  age: number | null;
  sex: Sex;
  lastSeenLocation: string;
  city: string;
  lastSeenAt: string;
  description: string;
  sensitiveNotes: string;
  reporterName: string;
  reporterRelationship: string;
  reporterContact: string;
}

interface FoundSeed {
  fullName: string;
  age: number | null;
  sex: Sex;
  foundLocation: string;
  city: string;
  foundAt: string;
  condition: Condition;
  description: string;
  reporterOrg: string;
  reporterName: string;
}

const MISSING: MissingSeed[] = [
  {
    fullName: "Carlos Perez",
    age: 34,
    sex: "M",
    lastSeenLocation: "cerca de la plaza, La Guaira",
    city: "La Guaira",
    lastSeenAt: "2026-06-24",
    description: "hombre alto, chaqueta verde, cicatriz en la mano derecha, habla espanol",
    sensitiveNotes: "Toma medicacion para la presion arterial.",
    reporterName: "Ana Perez",
    reporterRelationship: "hermana",
    reporterContact: "+58 412 555 1942",
  },
  {
    fullName: "Maria Alejandra Rodriguez",
    age: 29,
    sex: "F",
    lastSeenLocation: "terminal de La Guaira",
    city: "La Guaira",
    lastSeenAt: "2026-06-25",
    description: "morral verde, cicatriz pequena sobre la ceja izquierda, habla espanol y warao",
    sensitiveNotes: "Posible necesidad de inhalador para asma.",
    reporterName: "Rosa Rodriguez",
    reporterRelationship: "madre",
    reporterContact: "+1 416 555 2210",
  },
  {
    fullName: "Ana Rosa Mendoza",
    age: 64,
    sex: "F",
    lastSeenLocation: "parada de autobus, Caracas Oeste",
    city: "Caracas",
    lastSeenAt: "2026-06-25",
    description: "mujer mayor, diabetica, vestido azul",
    sensitiveNotes: "Diabetica, requiere insulina.",
    reporterName: "Luis Mendoza",
    reporterRelationship: "hijo",
    reporterContact: "+58 414 555 7781",
  },
  {
    fullName: "Diego Fernando Martinez",
    age: 12,
    sex: "M",
    lastSeenLocation: "fila del refugio, Maiquetia",
    city: "Maiquetia",
    lastSeenAt: "2026-06-26",
    description: "nino, morral rojo, camisa azul",
    sensitiveNotes: "",
    reporterName: "Luis Martinez",
    reporterRelationship: "padre",
    reporterContact: "+58 412 555 4420",
  },
  {
    fullName: "Pepe Silva",
    age: 40,
    sex: "M",
    lastSeenLocation: "Catia",
    city: "Caracas",
    lastSeenAt: "2026-06-24",
    description: "barba, trabaja como taxista",
    sensitiveNotes: "",
    reporterName: "Jose Silva",
    reporterRelationship: "hermano",
    reporterContact: "+58 426 555 9003",
  },
  {
    fullName: "Luisa Carmen Padron",
    age: 70,
    sex: "F",
    lastSeenLocation: "Petare",
    city: "Caracas",
    lastSeenAt: "2026-06-23",
    description: "usa baston, cabello canoso",
    sensitiveNotes: "",
    reporterName: "Carmen Padron",
    reporterRelationship: "hija",
    reporterContact: "+58 412 555 1188",
  },
];

const FOUND: FoundSeed[] = [
  {
    fullName: "Carlos Perez",
    age: 35,
    sex: "M",
    foundLocation: "Refugio 17, Maiquetia",
    city: "Maiquetia",
    foundAt: "2026-06-26",
    condition: "alive",
    description: "hombre alto chaqueta verde cicatriz en la mano",
    reporterOrg: "Cruz Roja",
    reporterName: "Voluntario CR-21",
  },
  {
    fullName: "",
    age: 66,
    sex: "F",
    foundLocation: "Hospital Vargas, Caracas",
    city: "Caracas",
    foundAt: "2026-06-26",
    condition: "hospitalized",
    description: "mujer mayor sin identificar, vestido azul, confundida, diabetica",
    reporterOrg: "Hospital Vargas",
    reporterName: "Enfermeria",
  },
  {
    fullName: "Maria Rodriguez",
    age: 28,
    sex: "F",
    foundLocation: "Refugio La Guaira",
    city: "La Guaira",
    foundAt: "2026-06-26",
    condition: "alive",
    description: "morral verde, cicatriz sobre la ceja, habla warao",
    reporterOrg: "Bomberos",
    reporterName: "Unidad 4",
  },
  {
    fullName: "Jose Silva",
    age: 41,
    sex: "M",
    foundLocation: "Albergue Catia",
    city: "Caracas",
    foundAt: "2026-06-25",
    condition: "alive",
    description: "barba, taxista",
    reporterOrg: "Voluntarios Caracas",
    reporterName: "Coord. Albergue",
  },
  {
    fullName: "",
    age: 11,
    sex: "M",
    foundLocation: "Hospital Naval, Maiquetia",
    city: "Maiquetia",
    foundAt: "2026-06-27",
    condition: "hospitalized",
    description: "nino sin identificar, morral rojo, camisa azul",
    reporterOrg: "Hospital Naval",
    reporterName: "Pediatria",
  },
  {
    fullName: "Pedro Gomez",
    age: 55,
    sex: "M",
    foundLocation: "Refugio Valencia",
    city: "Valencia",
    foundAt: "2026-06-26",
    condition: "alive",
    description: "ninguna senal distintiva registrada",
    reporterOrg: "Proteccion Civil",
    reporterName: "Equipo 9",
  },
];

function buildMissing(seed: MissingSeed): MissingReport {
  const now = nowIso();
  return {
    id: newMissingId(),
    createdAt: now,
    updatedAt: now,
    givenName: deriveGivenName(seed.fullName),
    consent: true,
    status: "open",
    source: "seed",
    photoUrl: null,
    ...seed,
  };
}

function buildFound(seed: FoundSeed): FoundReport {
  const now = nowIso();
  return {
    id: newFoundId(),
    createdAt: now,
    updatedAt: now,
    givenName: deriveGivenName(seed.fullName),
    reporterContact: "",
    status: "open",
    source: "seed",
    photoUrl: null,
    ...seed,
  };
}

/** Insert the scenario and run the matcher. Assumes an empty database. */
export function seedDatabase(): { missing: number; found: number; newCandidates: number } {
  transaction(() => {
    for (const seed of MISSING) {
      const report = buildMissing(seed);
      insertMissing(report);
      appendEvent({
        entityType: "missing_report",
        entityId: report.id,
        type: "report.created",
        actor: "family",
        payload: { city: report.city, source: "seed" },
      });
    }
    for (const seed of FOUND) {
      const report = buildFound(seed);
      insertFound(report);
      appendEvent({
        entityType: "found_report",
        entityId: report.id,
        type: "report.created",
        actor: `org:${report.reporterOrg}`,
        payload: { city: report.city, condition: report.condition, source: "seed" },
      });
    }
  });

  const { newCandidates } = recomputeAll();
  return { missing: MISSING.length, found: FOUND.length, newCandidates };
}

export function seedIfEmpty(): boolean {
  if (countMissing() > 0 || countFound() > 0) return false;
  seedDatabase();
  return true;
}

let ensured = false;
/** Cheap guard used by routes so the app is populated on first run in dev. */
export function ensureSeeded(): void {
  if (ensured) return;
  ensured = true;
  try {
    seedIfEmpty();
  } catch (error) {
    console.error("[hos] seed failed:", error);
  }
}
