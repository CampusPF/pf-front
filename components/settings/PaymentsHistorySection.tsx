"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, Receipt, Sparkles } from "lucide-react";

import {
  getMyPayments,
  type MyPayment,
  type PaymentStatus,
} from "@/services/payments/payments.service";
import { formatPrice } from "@/types/checkout";

/* Historial de pagos del alumno. Mismo patrón que SubscriptionSection: fetch
   propio al montar, con sus estados de carga, error y vacío.

   La suscripción se distingue de una compra de curso por el ícono y el color
   del badge: son dos cosas distintas (una es un pago único por un curso, la
   otra el abono mensual) y en una tabla de texto pelado se confunden. */

const STATUS_LABEL: Record<PaymentStatus, string> = {
  succeeded: "Pagado",
  pending: "Pendiente",
  failed: "Rechazado",
};

const STATUS_CLASS: Record<PaymentStatus, string> = {
  succeeded: "bg-success/10 text-success",
  pending: "bg-warning-subtle text-warning",
  failed: "bg-danger-subtle text-danger",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Una suscripción no tiene curso asociado: el back manda este concepto fijo. */
function isSubscription(payment: MyPayment): boolean {
  return payment.concept === "Suscripción Premium";
}

export default function PaymentsHistorySection() {
  const [payments, setPayments] = useState<MyPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getMyPayments(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setPayments(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "No pudimos cargar tus pagos.",
        );
      });

    return () => controller.abort();
  }, []);

  const isLoading = payments === null && !error;

  return (
    <section
      aria-labelledby="payments-title"
      aria-busy={isLoading}
      className="bg-surface border-border rounded-xl border p-6 shadow-sm"
    >
      <h2 id="payments-title" className="text-text text-lg font-semibold">
        Mis pagos
      </h2>
      <p className="text-text-secondary mt-1 text-sm">
        Tus compras de cursos y los cobros de tu suscripción.
      </p>

      {isLoading ? (
        <PaymentsSkeleton />
      ) : error ? (
        <p
          role="alert"
          className="bg-danger-subtle text-danger border-danger/30 mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : payments!.length === 0 ? (
        <div className="border-border mt-4 rounded-xl border border-dashed px-4 py-10 text-center">
          <Receipt className="text-text-muted mx-auto size-8" aria-hidden />
          <p className="text-text mt-3 text-sm font-medium">
            Todavía no hiciste ningún pago
          </p>
          <p className="text-text-muted mt-1 text-xs">
            Cuando compres un curso o actives Premium, el comprobante aparece acá.
          </p>
        </div>
      ) : (
        <div className="border-border relative mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-surface-elevated text-text-muted text-left text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Concepto</th>
                <th className="px-4 py-3 font-semibold">Monto</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-border bg-surface divide-y">
              {payments!.map((payment) => {
                const subscription = isSubscription(payment);
                return (
                  <tr key={payment.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                            subscription
                              ? "bg-accent-subtle text-accent"
                              : "bg-primary-subtle text-primary"
                          }`}
                          aria-hidden
                        >
                          {subscription ? (
                            <Sparkles className="size-3.5" />
                          ) : (
                            <BookOpen className="size-3.5" />
                          )}
                        </span>
                        <span className="text-text font-medium">{payment.concept}</span>
                      </div>
                    </td>
                    <td className="text-text px-4 py-3 tabular-nums">
                      {formatPrice(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[payment.status]}`}
                      >
                        {STATUS_LABEL[payment.status] ?? payment.status}
                      </span>
                    </td>
                    <td className="text-text-secondary px-4 py-3 whitespace-nowrap">
                      {formatDate(payment.date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Tres filas fantasma: la tabla no salta de alto al llegar los datos. */
function PaymentsSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-2" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="bg-surface-elevated h-11 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}
