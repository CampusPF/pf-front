import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

/* Piezas chicas compartidas por las pantallas del panel admin. */

export const BUTTON_PRIMARY =
  "bg-primary-solid hover:bg-primary-solid-hover inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60";
export const BUTTON_SECONDARY =
  "border-border text-text hover:bg-surface-elevated inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";
export const BUTTON_GHOST_DANGER =
  "text-text-muted hover:text-danger hover:bg-danger-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors disabled:opacity-60";
export const CARD = "bg-surface border-border rounded-xl border p-5 shadow-sm";
export const LABEL = "text-text mb-1.5 block text-xs font-medium";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="bg-danger-subtle text-danger border-danger/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="bg-success-subtle text-success border-success/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10">
      <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
      <span className="text-text-muted text-sm">{label}</span>
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-success/10 text-success" : "bg-surface-elevated text-text-muted"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
