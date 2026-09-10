"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

/* Diálogo de confirmación genérico. Es el primer modal real del proyecto: los
   drawers que ya existen (tutor IA, sidebar del dashboard) son paneles
   laterales sin semántica de diálogo ni trampa de foco, y no conviene copiar
   ese patrón para algo que interrumpe al usuario para pedirle una decisión.

   Lo que hace y ellos no:
     - role="dialog" + aria-modal, con título y descripción referenciados.
     - Atrapa el Tab adentro del diálogo mientras está abierto (si no, se
       tabula hacia el formulario de atrás, que está tapado por el backdrop).
     - Devuelve el foco al elemento que lo abrió al cerrarse.
     - Bloquea el scroll del body.

   No se desmonta el contenido al cerrar: se devuelve `null`. Es un diálogo
   efímero, no hay estado interno que preservar. */

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para acciones destructivas (cancelar suscripción, borrar cuenta). */
  variant?: "default" | "danger";
  /** Deshabilita los botones y muestra el spinner mientras se resuelve. */
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  // Quién tenía el foco antes de abrir, para devolvérselo al cerrar.
  const openerRef = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const descriptionId = useId();

  // Foco inicial en el botón de confirmar + restitución al cerrar.
  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    return () => openerRef.current?.focus?.();
  }, [open]);

  // El scroll del fondo se congela: si no, la rueda del mouse mueve la página
  // de atrás mientras el diálogo queda flotando.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ESC cierra; Tab queda encerrado adentro del panel.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      /* ESC cierra SIEMPRE, incluso con isPending. No cancela la operación en
         curso (el fetch ya salió), pero es la salida de emergencia: si algo
         queda colgado y el diálogo no se puede cerrar, el usuario queda
         atrapado sin poder hacer nada en la página. El resultado igual se
         muestra en el banner del formulario, que está fuera del diálogo.

         El backdrop, en cambio, sí respeta isPending: es un clic fácil de
         disparar sin querer. */
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isPending, onCancel]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-danger hover:brightness-110 text-white"
      : "bg-primary-solid hover:bg-primary-solid-hover text-white";

  return (
    <>
      {/* Backdrop. Es un <button> y no un <div onClick> para que cerrar con
          clic afuera también exista para quien navega con teclado o lector. */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => !isPending && onCancel()}
        className="fixed inset-0 z-300 cursor-default bg-black/50 backdrop-blur-sm"
      />

      <div className="pointer-events-none fixed inset-0 z-400 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="bg-surface border-border pointer-events-auto w-full max-w-md rounded-2xl border p-6 shadow-xl"
        >
          <h2 id={titleId} className="text-text text-lg font-semibold">
            {title}
          </h2>
          <div id={descriptionId} className="text-text-secondary mt-2 text-sm">
            {description}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="border-border text-text hover:bg-surface-elevated cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
