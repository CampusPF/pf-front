import { BookOpen, Clock, Code2, Sparkles } from "lucide-react";

import { PREMIUM_PLAN } from "@/data/plans";
import { formatPrice } from "@/types/checkout";

/* Antes eran cifras inventadas ("+500 lecciones", "+20 casos", "100%
   certificados verificados") que no coincidían con el catálogo real. Ahora
   son hechos del producto; el precio sale del plan, no escrito a mano. */
const STATS = [
  { icon: BookOpen, value: "Gratis", label: "Cursos para empezar hoy" },
  { icon: Code2, value: "Proyectos", label: "Prácticos en cada curso" },
  { icon: Clock, value: "24/7", label: "Tutor IA disponible" },
  {
    icon: Sparkles,
    value: formatPrice(PREMIUM_PLAN.priceInCents, PREMIUM_PLAN.currency),
    label: "Premium: todo el catálogo",
  },
];

export default function StatsBar() {
  return (
    <section className="border-border bg-surface border-y py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 lg:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-text text-2xl font-bold">{value}</p>
              <p className="text-text-muted text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
