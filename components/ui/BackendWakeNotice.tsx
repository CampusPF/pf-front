"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { subscribeBackendWaking, wakeBackend } from "@/lib/backend-wakeup";

/* Aviso global mientras el back (Render free) se despierta. Vive en el root
   layout: al montar dispara el ping para despertarlo cuanto antes, y sólo se
   ve si algo tarda más de unos segundos — con el back despierto no aparece
   nunca. No bloquea la pantalla: es una píldora arriba al centro. */
export default function BackendWakeNotice() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeBackendWaking(setWaking);
    void wakeBackend();
    return unsubscribe;
  }, []);

  if (!waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4"
    >
      <p className="bg-surface border-border text-text flex max-w-md items-center gap-3 rounded-full border px-4 py-2.5 text-sm shadow-xl">
        <Loader2 className="text-primary size-4 shrink-0 animate-spin" aria-hidden />
        <span>
          Despertando el servidor…{" "}
          <span className="text-text-muted">la primera carga puede tardar hasta un minuto.</span>
        </span>
      </p>
    </div>
  );
}
