// Spanish-first i18n. Venezuela-first means es is the default; en sits
// alongside (AGENTS.md §2). User-facing strings for the new flows live here,
// never inline. This is a deliberately small runtime — a fuller i18n library
// can replace it without touching call sites.

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";

type Dict = Record<string, string>;

const es: Dict = {
  "app.name": "HOS Response Kit",
  "app.tagline": "Reunificación familiar",
  "nav.map": "Mapa",
  "nav.missing": "Desaparecidos",
  "nav.found": "Encontrados",
  "nav.matches": "Coincidencias",
  "nav.verify": "Verificación",
  "nav.messages": "Mensajes",
  "nav.sources": "Fuentes",

  "action.cantReach": "No puedo localizar a mi familia",
  "action.reportMissing": "Reportar persona desaparecida",
  "action.reportMissing.desc": "Sin necesidad de cuenta",
  "action.reportFound": "Reportar persona encontrada",
  "action.reportFound.desc": "Para refugios, hospitales y voluntarios",
  "action.checkMatch": "Consultar una coincidencia",
  "action.checkMatch.desc": "Por número de caso o nombre",

  "form.name": "Nombre de la persona",
  "form.age": "Edad",
  "form.sex": "Sexo",
  "form.sex.F": "Femenino",
  "form.sex.M": "Masculino",
  "form.sex.U": "Sin especificar",
  "form.city": "Ciudad",
  "form.lastSeenLocation": "Último lugar conocido",
  "form.lastSeenAt": "Última fecha conocida",
  "form.foundLocation": "Lugar donde fue encontrada",
  "form.foundAt": "Fecha en que fue encontrada",
  "form.condition": "Condición",
  "form.condition.alive": "Con vida",
  "form.condition.injured": "Herida",
  "form.condition.hospitalized": "Hospitalizada",
  "form.condition.deceased": "Fallecida",
  "form.condition.unknown": "Desconocida",
  "form.description": "Rasgos que la identifican",
  "form.sensitiveNotes": "Notas sensibles (privadas)",
  "form.reporterName": "Su nombre",
  "form.reporterRelationship": "Parentesco",
  "form.reporterContact": "Teléfono o correo de contacto",
  "form.reporterOrg": "Organización que reporta",
  "form.consent": "Autorizo compartir con organizaciones de respuesta",
  "form.optional": "opcional",
  "form.submit.missing": "Crear reporte de desaparecido",
  "form.submit.found": "Crear reporte de encontrado",
  "form.cancel": "Cancelar",
  "form.search": "Buscar",
  "form.searchPlaceholder": "Nombre, ciudad o número de caso",

  "result.caseCreated": "Reporte creado",
  "result.caseNumber": "Número de caso",
  "result.candidatesFound": "Posibles coincidencias encontradas",
  "result.noCandidates": "Aún no hay coincidencias. Seguiremos comparando automáticamente.",
  "result.submitting": "Enviando…",
  "result.error": "No se pudo completar. Intente de nuevo.",
  "result.matchNote": "Una coincidencia siempre es un candidato para verificar, nunca una confirmación automática.",

  "status.open": "Abierto",
  "status.candidate": "Con candidato",
  "status.verifying": "En verificación",
  "status.resolved": "Resuelto",

  "search.noResults": "Sin resultados.",
  "search.missingTitle": "Reportes de desaparecidos",
  "search.foundTitle": "Reportes de encontrados",
};

const en: Dict = {
  "app.name": "HOS Response Kit",
  "app.tagline": "Family reunification",
  "nav.map": "Map",
  "nav.missing": "Missing",
  "nav.found": "Found",
  "nav.matches": "Matches",
  "nav.verify": "Verify",
  "nav.messages": "Messages",
  "nav.sources": "Sources",

  "action.cantReach": "I can't reach my family",
  "action.reportMissing": "Report missing person",
  "action.reportMissing.desc": "No account required",
  "action.reportFound": "Report found person",
  "action.reportFound.desc": "For shelters, hospitals, volunteers",
  "action.checkMatch": "Check a possible match",
  "action.checkMatch.desc": "By case number or name",

  "form.name": "Person's name",
  "form.age": "Age",
  "form.sex": "Sex",
  "form.sex.F": "Female",
  "form.sex.M": "Male",
  "form.sex.U": "Unspecified",
  "form.city": "City",
  "form.lastSeenLocation": "Last known location",
  "form.lastSeenAt": "Last known date",
  "form.foundLocation": "Where they were found",
  "form.foundAt": "Date found",
  "form.condition": "Condition",
  "form.condition.alive": "Alive",
  "form.condition.injured": "Injured",
  "form.condition.hospitalized": "Hospitalized",
  "form.condition.deceased": "Deceased",
  "form.condition.unknown": "Unknown",
  "form.description": "Identifying traits",
  "form.sensitiveNotes": "Sensitive notes (private)",
  "form.reporterName": "Your name",
  "form.reporterRelationship": "Relationship",
  "form.reporterContact": "Contact phone or email",
  "form.reporterOrg": "Reporting organization",
  "form.consent": "I authorize sharing with response organizations",
  "form.optional": "optional",
  "form.submit.missing": "Create missing report",
  "form.submit.found": "Create found report",
  "form.cancel": "Cancel",
  "form.search": "Search",
  "form.searchPlaceholder": "Name, city, or case number",

  "result.caseCreated": "Report created",
  "result.caseNumber": "Case number",
  "result.candidatesFound": "Possible matches found",
  "result.noCandidates": "No matches yet. We'll keep comparing automatically.",
  "result.submitting": "Submitting…",
  "result.error": "Couldn't complete. Please try again.",
  "result.matchNote": "A match is always a candidate to verify, never an automatic confirmation.",

  "status.open": "Open",
  "status.candidate": "Has candidate",
  "status.verifying": "Verifying",
  "status.resolved": "Resolved",

  "search.noResults": "No results.",
  "search.missingTitle": "Missing reports",
  "search.foundTitle": "Found reports",
};

const DICTS: Record<Locale, Dict> = { es, en };

export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return DICTS[locale][key] ?? DICTS.es[key] ?? key;
}
