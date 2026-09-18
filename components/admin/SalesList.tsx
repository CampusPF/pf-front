"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ErrorBanner, Loading } from "@/components/admin/admin-ui";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import {
  getTeacherPayments,
  sumAmounts,
  type TeacherPayment,
} from "@/services/payments/payments.service";
import { formatPrice } from "@/types/checkout";

/* Ventas de cursos. El alcance lo decide el BACK según el rol del token: un
   docente ve sólo lo suyo, un admin ve toda la plataforma. Acá no se filtra
   nada — filtrar en el cliente sería confiar en que el back mandó de más.

   El total se calcula sobre las filas que ya vinieron, sin pedirle otro
   endpoint al back sólo para un número.

   Las suscripciones no aparecen: esa plata es de la plataforma, no de un
   curso puntual (ver PaymentsService.getTeacherPayments en pf-back). */

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SalesList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [sales, setSales] = useState<TeacherPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getTeacherPayments(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setSales(data);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(adminErrorMessage(caught));
      });

    return () => controller.abort();
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (sales === null) return <Loading label="Cargando tus ventas…" />;

  if (sales.length === 0) {
    return (
      <div className="border-border rounded-xl border border-dashed px-4 py-12 text-center">
        <Receipt className="text-text-muted mx-auto size-8" aria-hidden />
        <p className="text-text mt-3 font-medium">
          {isAdmin
            ? "Todavía no hay ventas en la plataforma"
            : "Todavía no vendiste ningún curso"}
        </p>
        <p className="text-text-muted mx-auto mt-1 max-w-sm text-sm">
          {isAdmin
            ? "Cuando un alumno compre un curso, la venta aparece acá."
            : "Cuando un alumno compre alguno de tus cursos, la venta aparece acá con su nombre y el monto."}
        </p>
      </div>
    );
  }

  /* Todas las filas comparten moneda en la práctica (el catálogo cobra en
     usd), así que se toma la de la primera para el total. */
  const currency = sales[0].currency;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border-border flex flex-wrap items-center justify-between gap-2 rounded-xl border p-5 shadow-sm">
        <div>
          <p className="text-text-muted text-xs uppercase">
            {isAdmin ? "Total vendido en la plataforma" : "Total vendido"}
          </p>
          <p className="text-text mt-1 text-2xl font-bold tabular-nums">
            {formatPrice(sumAmounts(sales), currency)}
          </p>
        </div>
        <p className="text-text-muted text-sm">
          {sales.length} {sales.length === 1 ? "venta" : "ventas"}
        </p>
      </div>

      <div className="border-border relative overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-surface-elevated text-text-muted text-left text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Curso</th>
              <th className="px-4 py-3 font-semibold">Comprador</th>
              <th className="px-4 py-3 font-semibold">Monto</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-border bg-surface divide-y">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="text-text px-4 py-3 font-medium">{sale.courseName}</td>
                <td className="text-text-secondary px-4 py-3">{sale.buyerName}</td>
                <td className="text-text px-4 py-3 tabular-nums">
                  {formatPrice(sale.amount, sale.currency)}
                </td>
                <td className="text-text-secondary px-4 py-3 whitespace-nowrap">
                  {formatDate(sale.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
