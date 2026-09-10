"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

import { ApiError } from "@/services/api-client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  cancelSubscription,
  findActiveSubscription,
  getMySubscriptions,
  type Subscription,
} from "@/services/subscriptions/subscriptions.service";

/* Estado del plan. `GET /subscriptions/me` devuelve el historial completo
   (activas, canceladas y vencidas), así que la vigente hay que buscarla. */

const PLAN_LABEL: Record<Subscription["plan"], string> = {
  free: "Gratis",
  premium: "Premium",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SubscriptionSection() {
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getMySubscriptions(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setSubscriptions(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          err instanceof Error ? err.message : "No pudimos cargar tu plan.",
        );
      });

    return () => controller.abort();
  }, []);

  const active = subscriptions ? findActiveSubscription(subscriptions) : null;

  async function handleCancel() {
    if (!active) return;

    setActionError(null);
    setIsCancelling(true);

    try {
      const cancelled = await cancelSubscription(active.id);
      setSubscriptions((prev) =>
        (prev ?? []).map((item) => (item.id === cancelled.id ? cancelled : item)),
      );
      setConfirmOpen(false);
      setSuccessMessage(
        "Cancelamos tu suscripción. Vas a mantener el acceso hasta que termine el período pago.",
      );
    } catch (caught) {
      setConfirmOpen(false);
      setActionError(
        caught instanceof ApiError
          ? caught.message
          : "No pudimos cancelar la suscripción. Probá de nuevo.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <section
      aria-labelledby="subscription-title"
      aria-busy={subscriptions === null && !loadError}
      className="bg-surface border-border rounded-xl border p-6 shadow-sm"
    >
      <h2 id="subscription-title" className="text-text text-lg font-semibold">
        Tu plan
      </h2>

      {subscriptions === null && !loadError ? (
        <div className="mt-4 flex items-center gap-2">
          <Loader2 className="text-primary size-4 animate-spin" aria-hidden />
          <span className="text-text-muted text-sm">Cargando tu plan…</span>
        </div>
      ) : loadError ? (
        <p
          role="alert"
          className="bg-danger-subtle text-danger border-danger/30 mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{loadError}</span>
        </p>
      ) : (
        <>
          {successMessage && (
            <p
              role="status"
              className="bg-success-subtle text-success border-success/30 mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{successMessage}</span>
            </p>
          )}

          {actionError && (
            <p
              role="alert"
              className="bg-danger-subtle text-danger border-danger/30 mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{actionError}</span>
            </p>
          )}

          {active ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-accent-subtle text-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold">
                  <Sparkles className="size-4" aria-hidden />
                  {PLAN_LABEL[active.plan]}
                </span>
                <span className="text-text-muted text-sm">
                  Renueva el {formatDate(active.endDate)}
                </span>
              </div>

              <p className="text-text-secondary mt-3 text-sm">
                Tenés acceso completo al catálogo y al tutor de IA sin límite diario.
              </p>

              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="border-danger/40 text-danger hover:bg-danger-subtle mt-4 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-150"
              >
                Cancelar suscripción
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <span className="bg-surface-elevated text-text-secondary inline-flex rounded-full px-3 py-1 text-sm font-medium">
                {PLAN_LABEL.free}
              </span>
              <p className="text-text-secondary mt-3 text-sm">
                Estás en el plan gratuito: acceso a los cursos gratis y un límite
                diario de mensajes con el tutor de IA.
              </p>
              <Link
                href="/#planes"
                className="bg-primary-solid hover:bg-primary-solid-hover mt-4 inline-flex cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150"
              >
                Ver planes
              </Link>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        variant="danger"
        title="¿Cancelar tu suscripción?"
        description={
          active
            ? `Vas a mantener el acceso Premium hasta el ${formatDate(active.endDate)}. Después vuelve al plan gratuito.`
            : ""
        }
        confirmLabel="Sí, cancelar"
        cancelLabel="Seguir con Premium"
        isPending={isCancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
