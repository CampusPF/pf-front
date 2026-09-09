import { Check, Lock, RefreshCw, ShieldCheck, Tag } from "lucide-react";
import type { CheckoutInput, Course, SubscriptionPlan } from "@/types/checkout";
import { formatPrice } from "@/types/checkout";

interface OrderSummaryProps {
  checkout: CheckoutInput;
}

export function OrderSummary({ checkout }: OrderSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#1C1C2E] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Resumen de compra</h2>
          <span className="shrink-0 rounded-full bg-[#6366F1]/15 px-3 py-1 text-[11px] font-semibold text-[#A5B4FC]">
            {checkout.mode === "course" ? "Curso individual" : "Suscripción"}
          </span>
        </div>

        {checkout.mode === "course" ? (
          <CourseSummary course={checkout.course} />
        ) : (
          <SubscriptionSummary plan={checkout.plan} />
        )}
      </div>

      <GuaranteeCard />
    </div>
  );
}

function CourseSummary({ course }: { course: Course }) {
  return (
    <>
      <div className="mt-5 flex items-start justify-between gap-3">
        <p className="text-lg font-bold text-white">{course.title}</p>
        <span className="mt-1 shrink-0 rounded-full bg-[#22C55E]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#22C55E]">
          Acceso de por vida
        </span>
      </div>

      <div className="mt-4 flex gap-4">
        <img
          src={course.thumbnailUrl}
          alt=""
          className="h-16 w-24 shrink-0 rounded-lg object-cover"
        />
        <p className="flex flex-col justify-center text-sm text-[#9A9AAB]">
          {course.instructor}
        </p>
      </div>

      <Divider />

      <TotalBlock
        label="TOTAL"
        priceInCents={course.priceInCents}
        currency={course.currency}
      />

      <SecureNote />
    </>
  );
}

function SubscriptionSummary({ plan }: { plan: SubscriptionPlan }) {
  const intervalLabel = plan.interval === "month" ? "mes" : "año";
  const hasDiscount =
    plan.originalPriceInCents != null &&
    plan.originalPriceInCents > plan.priceInCents;
  const discountInCents = hasDiscount
    ? plan.originalPriceInCents! - plan.priceInCents
    : 0;

  return (
    <>
      <div className="mt-5 flex items-start justify-between gap-3">
        <p className="text-lg font-bold text-white">{plan.name}</p>
        <span className="mt-1 shrink-0 rounded-full bg-[#22C55E]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#22C55E]">
          Acceso total
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-[#9A9AAB]">
        {plan.description}
      </p>

      {plan.features && plan.features.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-[#B4B4C0]"
            >
              <Check
                className="mt-0.5 size-4 shrink-0 text-[#22C55E]"
                aria-hidden
              />
              {feature}
            </li>
          ))}
        </ul>
      )}

      {plan.interval === "month" && (
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[#9A9AAB]">
          <RefreshCw className="size-3.5" aria-hidden />
          Renovación mensual automática
        </span>
      )}

      {hasDiscount && (
        <>
          <Divider />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9A9AAB]">Subtotal regular</span>
              <span className="text-[#8A8A99] line-through">
                {formatPrice(plan.originalPriceInCents!, plan.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-[#22C55E]">
              <span className="flex items-center gap-1.5">
                <Tag className="size-3.5" aria-hidden />
                {plan.discountLabel ?? "Descuento"}
              </span>
              <span>-{formatPrice(discountInCents, plan.currency)}</span>
            </div>
          </div>
        </>
      )}

      <Divider />

      <TotalBlock
        label="TOTAL A FACTURAR HOY"
        priceInCents={plan.priceInCents}
        currency={plan.currency}
        suffix={`/${intervalLabel}`}
      />

      <p className="mt-4 text-center text-xs text-[#8A8A99]">
        Cancelá cuando quieras con un clic sin ningún tipo de penalización.
      </p>

      <SecureNote />
    </>
  );
}

function TotalBlock({
  label,
  priceInCents,
  currency,
  suffix,
}: {
  label: string;
  priceInCents: number;
  currency: string;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#8A8A99]">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-white">
          {formatPrice(priceInCents, currency)}
        </span>
        {suffix && <span className="text-sm text-[#8A8A99]">{suffix}</span>}
      </p>
      <p className="mt-1 text-xs text-[#8A8A99]">Impuestos aplicables incluidos</p>
    </div>
  );
}

function Divider() {
  return <hr className="my-5 border-white/5" />;
}

function SecureNote() {
  return (
    <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#8A8A99]">
      <Lock className="size-3.5" aria-hidden />
      Pago seguro cifrado de 256 bits
    </p>
  );
}

function GuaranteeCard() {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#1C1C2E] p-5">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#22C55E]" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-white">
          Garantía sin riesgo de 14 días
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#9A9AAB]">
          Si no aprendés lo que esperabas, contactanos dentro de las 2 primeras
          semanas y reembolsamos el 100% de tu dinero de inmediato.
        </p>
      </div>
    </div>
  );
}
