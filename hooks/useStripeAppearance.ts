"use client";

import { useEffect, useState } from "react";
import type { Appearance } from "@stripe/stripe-js";

/**
 * Stripe Elements se renderiza dentro de un <iframe>, así que no puede leer
 * las variables CSS de tu página directamente (var(--color-primary) no cruza
 * el iframe). Por eso resolvemos los valores reales con getComputedStyle y
 * se los pasamos a Stripe como Appearance API.
 *
 * También escucha cambios en data-theme para que el formulario de tarjeta
 * cambie de light a dark junto con el resto de la app.
 */
function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildAppearance(): Appearance {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  return {
    theme: isDark ? "night" : "stripe",
    variables: {
      colorPrimary: readToken("--color-primary"),
      colorBackground: readToken("--color-surface"),
      colorText: readToken("--color-text"),
      colorDanger: readToken("--color-danger"),
      colorTextSecondary: readToken("--color-text-secondary"),
      fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
      borderRadius: readToken("--radius-md"),
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        border: `1px solid ${readToken("--color-border")}`,
        boxShadow: "none",
      },
      ".Input:focus": {
        border: `1px solid ${readToken("--color-primary")}`,
        boxShadow: `0 0 0 1px ${readToken("--color-primary")}`,
      },
      ".Label": {
        color: readToken("--color-text-secondary"),
        fontSize: readToken("--text-sm") || "14px",
      },
    },
  };
}

export function useStripeAppearance(): Appearance {
  const [appearance, setAppearance] = useState<Appearance>(() =>
    typeof window !== "undefined"
      ? buildAppearance()
      : { theme: "stripe" }
  );

  useEffect(() => {
    // El valor inicial ya lo resuelve bien el inicializador perezoso de
    // useState de arriba (corre en el cliente, con `window` ya disponible) —
    // no hace falta volver a setearlo acá. Este efecto sólo se encarga de
    // reaccionar a cambios de tema DESPUÉS del mount.
    const observer = new MutationObserver(() => setAppearance(buildAppearance()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return appearance;
}
