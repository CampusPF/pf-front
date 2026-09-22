"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, Download, ExternalLink, Link2, Loader2 } from "lucide-react";

import {
  certificateDownloadUrl,
  certificateVerificationPath,
  getMyCertificates,
  type Certificate,
} from "@/services/certificates/certificates.service";

/* Pantalla del certificado propio: vista previa del PDF, descarga y el link de
   verificación pública (el mismo al que apunta el QR impreso en el PDF).

   El certificado se busca en GET /certificates/me por código: no hay un
   endpoint para pedir uno solo con sesión, y el listado es corto. */

type State =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; certificate: Certificate };

type CopyState = "idle" | "copied" | "failed";

const BUTTON =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150";

export default function CertificateView({ code }: { code: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [copy, setCopy] = useState<CopyState>("idle");
  const [verifyUrl, setVerifyUrl] = useState("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getMyCertificates(controller.signal)
      .then((certificates) => {
        if (controller.signal.aborted) return;
        const found = certificates.find((certificate) => certificate.code === code);
        setState(found ? { status: "ready", certificate: found } : { status: "not-found" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "No pudimos cargar tu certificado.",
        });
      });

    return () => controller.abort();
  }, [code]);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function copyVerificationLink() {
    const url = `${window.location.origin}${certificateVerificationPath(code)}`;
    setVerifyUrl(url);

    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
    } catch {
      // Sin permiso de portapapeles (o contexto no seguro): se muestra el
      // link para copiarlo a mano.
      setCopy("failed");
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopy("idle"), 3000);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Link
        href="/dashboard/mis-cursos"
        className="text-text-secondary hover:text-text inline-flex items-center gap-2 text-sm transition-colors duration-150"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mis cursos
      </Link>

      {state.status === "loading" && (
        <div className="flex items-center gap-2 py-20">
          <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
          <span className="text-text-muted text-sm">Cargando tu certificado…</span>
        </div>
      )}

      {(state.status === "not-found" || state.status === "error") && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="text-text-muted size-10" aria-hidden />
          <h1 className="text-text text-xl font-semibold">
            {state.status === "not-found"
              ? "No encontramos este certificado"
              : "No pudimos cargar tu certificado"}
          </h1>
          <p className="text-text-secondary text-sm">
            {state.status === "not-found"
              ? "Revisá que el link sea el correcto y que el certificado sea tuyo."
              : state.message}
          </p>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <header className="mt-4">
            <h1 className="text-text text-2xl font-bold md:text-3xl">Tu certificado</h1>
            <p className="text-text-secondary mt-1">
              {state.certificate.course?.title ?? "Curso completado"} · emitido el{" "}
              {new Date(state.certificate.issuedAt).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </header>

          {/* Vista previa directo desde Cloudinary: el PDF se sirve como
              `application/pdf` inline, así que el <iframe> lo muestra tal
              cual. En celulares el visor de PDF del navegador puede mostrar
              sólo la primera página o nada: por eso el link de abajo. */}
          <div className="border-border bg-surface mt-6 overflow-hidden rounded-xl border shadow-sm">
            <iframe
              src={state.certificate.pdfUrl}
              title={`Certificado de ${state.certificate.course?.title ?? "curso"}`}
              className="h-[60vh] w-full sm:aspect-[1.414/1] sm:h-auto"
            />
          </div>
          <p className="text-text-muted mt-3 text-sm">
            ¿No ves la vista previa? Descargá el PDF o abrilo en una pestaña nueva.
          </p>
          <a
            href={state.certificate.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-1 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Abrir en una pestaña nueva
          </a>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {/* `download` no sirve en un link a otro dominio: la descarga (y
                el nombre del archivo) los fuerza `fl_attachment`. */}
            <a
              href={certificateDownloadUrl(state.certificate.pdfUrl, code)}
              className={`${BUTTON} bg-primary-solid hover:bg-primary-solid-hover text-white`}
            >
              <Download className="size-4" aria-hidden />
              Descargar PDF
            </a>

            <button
              type="button"
              onClick={copyVerificationLink}
              className={`${BUTTON} border-border text-text-secondary hover:bg-surface-elevated hover:text-text border`}
            >
              {copy === "copied" ? (
                <Check className="text-success size-4" aria-hidden />
              ) : (
                <Link2 className="size-4" aria-hidden />
              )}
              {copy === "copied" ? "¡Link copiado!" : "Copiar link de verificación"}
            </button>
          </div>

          <p role="status" className="text-text-muted mt-3 text-sm">
            {copy === "copied" && "Cualquiera con este link puede comprobar que tu certificado es auténtico."}
            {copy === "failed" && "No pudimos copiarlo automáticamente. Copialo desde acá:"}
          </p>
          {copy === "failed" && (
            <input
              readOnly
              value={verifyUrl}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Link de verificación"
              className="bg-surface-elevated border-border text-text mt-2 w-full rounded-lg border px-3 py-2 font-mono text-xs"
            />
          )}
        </>
      )}
    </div>
  );
}
