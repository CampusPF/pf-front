"use client";

import { useEffect, useRef } from "react";

/* No hay dos usuarios "en vivo" en este proyecto (sin WebSockets ni
   polling): si alguien cambia algo mientras tenías la pestaña de fondo, no
   te enterás hasta volver a pedir el dato. Esto cubre el caso más común de
   ese hueco — volver a la pestaña/ventana — sin agregar infraestructura
   nueva, con el mismo espíritu que ya usa AuthProvider en `pageshow`: no
   hay un intervalo corriendo todo el tiempo, sólo reacciona cuando la
   pantalla vuelve a estar activa.

   Dos eventos, no uno solo, porque cubren huecos distintos:
   - `visibilitychange` → volver a esta pestaña DENTRO de la misma ventana.
   - `focus` de window → volver a esta ventana desde OTRA (dos navegadores
     uno al lado del otro, como Brave y Chrome: acá la pestaña nunca deja de
     estar "visible", así que sin esto no se enteraría). */

const MIN_INTERVAL_MS = 500;

export function useRevalidateOnFocus(callback: () => void, enabled = true): void {
  // Ref, no dependencia del efecto de abajo: que `callback` sea una función
  // nueva en cada render (lo normal, no todo el mundo la memoiza con
  // useCallback) no tiene que reenganchar los listeners. Se actualiza en su
  // propio efecto — nunca durante el render, eso rompe las reglas de hooks.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  const lastRunRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    function trigger() {
      // visibilitychange y focus suelen dispararse juntos al volver a una
      // pestaña: sin este piso mínimo, dispararía la recarga dos veces.
      const now = Date.now();
      if (now - lastRunRef.current < MIN_INTERVAL_MS) return;
      lastRunRef.current = now;
      callbackRef.current();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") trigger();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", trigger);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", trigger);
    };
  }, [enabled]);
}
