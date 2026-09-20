"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Loader2 } from "lucide-react";

import { ApiError } from "@/services/api-client";
import {
  getMyCertificates,
  issueCertificate,
  type Certificate,
} from "@/services/certificates/certificates.service";

/* Botón de certificado para un curso ya completado (MyCoursesView).

   Es un componente aislado con su propio fetch, mismo criterio que
   StreakCard/StudiedTimeCard: si algo falla acá, no se lleva puesta la
   tarjeta del curso ni el resto del dashboard.

   Vive DENTRO de la card pero FUERA del <Link> que navega al curso (ver
   MyCoursesView) — un <button> anidado en un <a> igual dispara la
   navegación del padre si no se llama preventDefault(), así que el handler
   de emitir lo hace explícitamente por las dudas de que algún día se mueva
   adentro. */

type State =
  | { status: "loading" }
  | { status: "none" }
  | { status: "issuing" }
  | { status: "ready"; certificate: Certificate }
  | { status: "error"; message: string };

const BUTTON_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg bg-warning-subtle px-3 py-1.5 text-xs font-medium text-warning transition-colors duration-150 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

export default function CertificateButton({ courseId }: { courseId: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  // ¿Ya tengo certificado de este curso? Se resuelve una vez al montar.
  useEffect(() => {
    const controller = new AbortController();

    getMyCertificates(controller.signal)
      .then((certificates) => {
        if (controller.signal.aborted) return;
        const mine = certificates.find((c) => c.courseId === courseId);
        setState(mine ? { status: "ready", certificate: mine } : { status: "none" });
      })
      .catch(() => {
        // Degrada en silencio: sin esto, un fallo de red dejaría a un curso
        // completado sin botón. Se ofrece "Emitir" igual; si ya existía, el
        // back responde 409 y se muestra ese mensaje.
        if (!controller.signal.aborted) setState({ status: "none" });
      });

    return () => controller.abort();
  }, [courseId]);

  async function handleIssue(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    setState({ status: "issuing" });
    try {
      const certificate = await issueCertificate(courseId);
      setState({ status: "ready", certificate });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "No pudimos emitir el certificado. Probá de nuevo.",
      });
    }
  }

  if (state.status === "loading") return null;

  // Lleva a la pantalla del certificado (vista previa, descarga y link de
  // verificación), no directo al PDF.
  if (state.status === "ready") {
    return (
      <Link href={`/dashboard/certificados/${encodeURIComponent(state.certificate.code)}`} className={BUTTON_CLASS}>
        <Award className="size-3.5" aria-hidden />
        Ver certificado
      </Link>
    );
  }

  if (state.status === "error") {
    return (
      <p className="text-danger text-xs leading-snug" role="alert">
        {state.message}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleIssue}
      disabled={state.status === "issuing"}
      className={BUTTON_CLASS}
    >
      {state.status === "issuing" ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Award className="size-3.5" aria-hidden />
      )}
      {state.status === "issuing" ? "Emitiendo…" : "Emitir certificado"}
    </button>
  );
}
