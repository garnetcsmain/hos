"use client";

// First-run guided tour for the coordination board (onboarding). A short,
// plain-Spanish walkthrough of the board so a first-time coordinator isn't
// dropped into a dense tool with no guidance. Runs once automatically, then is
// available on demand from the "¿Cómo funciona?" button. Uses driver.js (tiny,
// no framework lock-in); steps target elements by their data-tour attribute.

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const SEEN_KEY = "hos_tour_coordination_v1";

const STEPS = [
  {
    popover: {
      title: "Panel de coordinación",
      description:
        "Aquí organiza la ayuda: sitios, necesidades y suministros. Le muestro lo básico en menos de un minuto.",
    },
  },
  {
    element: "[data-tour='metrics']",
    popover: {
      title: "Resumen",
      description: "Necesidades abiertas, críticas, camas libres y sitios, de un vistazo.",
    },
  },
  {
    element: "[data-tour='view-toggle']",
    popover: {
      title: "Lista o mapa",
      description: "Cambie entre la lista y el mapa por distrito para ver dónde hace falta ayuda.",
    },
  },
  {
    element: "[data-tour='new-record']",
    popover: {
      title: "Agregar",
      description: "Cree una necesidad, un suministro, un sitio o una organización.",
    },
  },
  {
    element: "[data-tour='needs']",
    popover: {
      title: "Necesidades",
      description:
        "Cada tarjeta muestra la urgencia y el estado. Asígnela a una organización y márquela recibida solo cuando la ayuda llegue de verdad.",
    },
  },
  {
    element: "[data-tour='refresh']",
    popover: {
      title: "Siempre al día",
      description: "El panel se actualiza solo. También puede actualizarlo aquí cuando quiera.",
    },
  },
];

/** Start the walkthrough now (from the help button). */
export function startCoordinationTour(): void {
  driver({
    showProgress: true,
    progressText: "{{current}}/{{total}}",
    nextBtnText: "Siguiente",
    prevBtnText: "Atrás",
    doneBtnText: "Entendido",
    overlayColor: "#0B1F17",
    overlayOpacity: 0.55,
    steps: STEPS,
  }).drive();
}

/** Run the tour the first time a coordinator opens the board (once it's ready),
 *  then remember it so it never nags again. */
export function useCoordinationTourFirstRun(ready: boolean): void {
  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    if (window.localStorage.getItem(SEEN_KEY)) return;
    window.localStorage.setItem(SEEN_KEY, "1");
    // Small delay so the board has painted before we spotlight its parts.
    const t = setTimeout(() => startCoordinationTour(), 700);
    return () => clearTimeout(t);
  }, [ready]);
}
