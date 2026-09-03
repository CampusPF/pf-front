import { Check, Sparkles } from "lucide-react";

const FREE_FEATURES = [
  "Acceso a 10 cursos introductorios",
  "Tutor IA con 20 consultas diarias",
  "Comunidad en Discord para soporte",
  "Proyectos guiados básicos",
];

const PREMIUM_FEATURES = [
  "Acceso ilimitado a los +50 cursos técnicos",
  "Tutor IA sin restricciones 24/7 (GPT-4o & Sonnet)",
  "Certificados verificados con QR oficial",
  "Revisiones de código personalizadas por expertos",
  "Workshops en vivo mensuales con mentores",
];

export default function PricingSection() {
  return (
    <section id="precios" className="mx-auto max-w-6xl px-6 py-20 text-center">
      <p className="text-primary text-xs font-semibold tracking-wider uppercase">
        Tarifas claras
      </p>
      <h2 className="text-text mt-2 text-2xl font-bold md:text-3xl">
        Planes transparentes, sin sorpresas
      </h2>
      <p className="text-text-secondary mx-auto mt-3 max-w-2xl">
        Empezá gratis y migrá a Premium cuando estés listo para acelerar tu
        aprendizaje profesional.
      </p>

      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 text-left md:grid-cols-2">
        {/* ── Plan Free ─────────────────────────────────────────────── */}
        <div className="bg-surface border-border flex h-full flex-col rounded-2xl border-2 p-8">
          <h3 className="text-text font-semibold">Free</h3>
          <p className="mt-3">
            <span className="text-text text-4xl font-bold">$0</span>
            <span className="text-text-muted ml-2 text-sm">siempre</span>
          </p>
          <p className="text-text-secondary mt-3 text-sm">
            Para siempre, sin necesidad de ingresar tarjeta de crédito.
          </p>

          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="text-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>

          {/* mt-auto en el wrapper (no en el botón) para que ambas cards
              igualen altura con el CTA anclado abajo. */}
          <div className="mt-auto pt-8">
            <button
              type="button"
              className="border-border text-text hover:bg-surface-elevated w-full cursor-pointer rounded-lg border-2 py-3 font-medium transition-colors duration-150"
            >
              Empezar gratis
            </button>
          </div>
        </div>

        {/* ── Plan Premium ──────────────────────────────────────────── */}
        <div className="bg-surface border-primary relative flex h-full flex-col rounded-2xl border-2 p-8 shadow-lg">
          <span className="bg-primary absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="size-3" aria-hidden />
            Recomendado
          </span>

          <h3 className="text-primary font-semibold">Premium</h3>
          <p className="mt-3">
            <span className="text-primary text-4xl font-bold">$19</span>
            <span className="text-text-muted ml-2 text-sm">/mes</span>
          </p>
          <p className="text-text-muted mt-1 text-xs">o $150/año (ahorrá 34%)</p>
          <p className="text-text-secondary mt-3 text-sm">
            Acceso total e ilimitado a todo el ecosistema de contenidos y
            herramientas.
          </p>

          <ul className="mt-6 space-y-3">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="text-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-8">
            <button
              type="button"
              className="bg-primary hover:bg-primary-hover w-full cursor-pointer rounded-lg py-3 font-medium text-white transition-colors duration-150"
            >
              Hacerme Premium
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
