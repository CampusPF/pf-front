import { Award, BookMarked, MessageSquare, UserPlus } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Regístrate",
    description:
      "Creá tu cuenta gratis en menos de 1 minuto y configurá tus intereses técnicos.",
  },
  {
    icon: BookMarked,
    title: "Elegí un curso",
    description:
      "Cursos estructurados con proyectos reales para frontend, backend e inteligencia artificial.",
  },
  {
    icon: MessageSquare,
    title: "Aprendé con el tutor",
    description:
      "Preguntá cualquier duda, desbloqueate en errores y recibí consejos instantáneos sobre tu código.",
  },
  {
    icon: Award,
    title: "Obtenés tu certificado",
    description:
      "Validá tu competencia con credenciales verificables con código QR y sumalo a tu CV.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-20 text-center">
      <p className="text-primary text-xs font-semibold tracking-wider uppercase">
        El camino directo
      </p>
      <h2 className="text-text mt-2 text-2xl font-bold md:text-3xl">
        Cómo funciona Campus
      </h2>
      <p className="text-text-secondary mx-auto mt-3 max-w-2xl">
        Diseñado para que avances sin fricciones, del primer día hasta tu primer
        trabajo en tecnología.
      </p>

      <ol className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, description }, index) => (
          <li
            key={title}
            className="bg-surface border-border rounded-xl border p-6 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg text-2xl font-bold">
                {index + 1}
              </span>
              <Icon className="text-text-muted size-5" aria-hidden />
            </div>
            <h3 className="text-text mt-4 font-semibold">{title}</h3>
            <p className="text-text-secondary mt-2 text-sm">{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
