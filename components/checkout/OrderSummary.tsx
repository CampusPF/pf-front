import { BookOpen, RefreshCw } from "lucide-react";
import type { CheckoutInput, Course, SubscriptionPlan } from "@/types/checkout";
import { formatPrice } from "@/types/checkout";

interface OrderSummaryProps {
  checkout: CheckoutInput;
}

export function OrderSummary({ checkout }: OrderSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-md">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <h2 className="text-base font-semibold text-text">Resumen de tu compra</h2>
        <span className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-medium text-primary">
          {checkout.mode === "course" ? "Curso individual" : "Suscripción"}
        </span>
      </div>

      {checkout.mode === "course" ? (
        <CourseSummary course={checkout.course} />
      ) : (
        <SubscriptionSummary plan={checkout.plan} />
      )}
    </div>
  );
}

function CourseSummary({ course }: { course: Course }) {
  return (
    <>
      <div className="flex gap-4 px-6 py-5">
        <img
          src={course.thumbnailUrl}
          alt=""
          className="h-16 w-24 shrink-0 rounded-xl object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <p className="truncate text-sm font-semibold text-text">{course.title}</p>
          <p className="text-sm text-text-secondary">{course.instructor}</p>
          <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-xs font-medium text-success">
            <BookOpen className="h-3.5 w-3.5" />
            Acceso de por vida
          </span>
        </div>
      </div>
      <TotalRow priceInCents={course.priceInCents} currency={course.currency} />
    </>
  );
}

function SubscriptionSummary({ plan }: { plan: SubscriptionPlan }) {
  const intervalLabel = plan.interval === "month" ? "mes" : "año";

  return (
    <>
      <div className="flex flex-col gap-2 px-6 py-5">
        <p className="text-sm font-semibold text-text">{plan.name}</p>
        <p className="text-sm text-text-secondary">{plan.description}</p>
        <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-1 text-xs font-medium text-primary">
          <RefreshCw className="h-3.5 w-3.5" />
          Se renueva cada {intervalLabel}
        </span>
      </div>
      <TotalRow
        priceInCents={plan.priceInCents}
        currency={plan.currency}
        suffix={` / ${intervalLabel}`}
      />
    </>
  );
}

function TotalRow({
  priceInCents,
  currency,
  suffix = "",
}: {
  priceInCents: number;
  currency: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-b-2xl border-t border-border bg-bg/40 px-6 py-5">
      <span className="text-sm font-semibold text-text">Total</span>
      <span className="text-2xl font-bold tracking-tight text-text">
        {formatPrice(priceInCents, currency)}
        {suffix}
      </span>
    </div>
  );
}
