// Short, plain-Spanish explanations for uncommon or technical words shown in the
// UI. Rendered as hover/tap tooltips by <Term k="...">. The audience is
// non-technical and mobile-first, so every definition uses simple, short words
// (Venezuela-first). Keep each under ~120 characters. Add a key here when a new
// term needs explaining; <Term> falls back to plain text for unknown keys.

export const GLOSSARY: Record<string, string> = {
  coincidencia: "Dos reportes que podrían ser la misma persona. Siempre hay que confirmarla.",
  candidato: "Un reporte que podría coincidir con otro. Todavía sin confirmar.",
  puntuacion: "Qué tan parecidos son dos reportes, de 0 a 100. Más alto, más probable.",
  verificacion: "Revisar pruebas para confirmar que dos reportes son la misma persona.",
  metadatos: "Datos sobre el reporte: quién lo hizo, cuándo y de dónde viene.",
  "capa-confianza": "Muestra de dónde viene cada dato y si es de fiar.",
  triaje: "Ordenar los casos por urgencia para atender primero los más graves.",
  capacidad: "Cuántas camas o cupos libres tiene un sitio.",
  "sin-conexion": "Funciona sin internet; se sincroniza cuando vuelve la señal.",
  distrito: "Zona o municipio donde ocurre el caso.",
  ia: "Inteligencia artificial: el sistema sugiere; una persona decide.",
  pii: "Datos personales que identifican a alguien: nombre, teléfono o foto.",
  coordinador: "Persona de una organización autorizada que gestiona los casos.",
  necesidad: "Algo que hace falta en un sitio: agua, comida, medicinas.",
  suministro: "Algo que una organización ofrece para cubrir una necesidad.",
  sitio: "Refugio, hospital o punto de atención con una ubicación.",
  reclamar: "Una organización se compromete a cubrir una necesidad.",
  recibido: "Confirmado por el sitio que pidió la ayuda. Nunca automático.",
  urgencia: "Qué tan pronto se necesita: crítica, alta, normal o baja.",
  "reporte-encontrado": "Aviso de que se halló a una persona, con o sin vida.",
  "reporte-desaparecido": "Aviso de que se busca a una persona.",
};
