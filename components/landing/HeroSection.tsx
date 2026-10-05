import Link from "next/link";
import { Check } from "lucide-react";
import TutorDemo from "./TutorDemo";

/* El widget de la derecha (TutorDemo) es una ilustración animada, no el
   tutor real: ver el comentario en ese componente. */

/* Sin cifras ni modelos de IA inventados: antes decía "10.484 estudiantes"
   y "Claude 3.5 & GPT-4o integrados". Sólo lo que la plataforma cumple hoy. */
const TRUST_BADGES = [
  "Sin tarjeta de crédito",
  "Cursos gratis para empezar hoy",
];

export default function HeroSection() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-28 pb-20 lg:grid-cols-2">
      {/* ── Columna izquierda ─────────────────────────────────────── */}
      <div>
        <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-sm font-medium">
          Un tutor de IA en cada lección ✨
        </span>

        <h1 className="text-text mt-6 text-3xl leading-tight font-bold md:text-4xl lg:text-5xl">
          Aprendé con un tutor de IA a tu lado
        </h1>

        <p className="text-text-secondary mt-5 max-w-prose text-lg">
          Cursos estructurados con proyectos del mundo real + un tutor inteligente
          que te acompaña, desbloquea tus dudas y optimiza tu código en tiempo
          real.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/courses"
            className="bg-primary-solid hover:bg-primary-solid-hover cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors duration-150"
          >
            Explorar cursos
          </Link>
          <a
            href="#como-funciona"
            className="text-text-secondary hover:text-text cursor-pointer px-4 py-3 font-medium transition-colors duration-150"
          >
            Cómo funciona →
          </a>
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          {TRUST_BADGES.map((badge) => (
            <li
              key={badge}
              className="text-text-muted flex items-center gap-1 text-sm"
            >
              <Check className="text-success size-4 shrink-0" aria-hidden />
              {badge}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Columna derecha — Demo animada del AI Tutor ─────────── */}
      <TutorDemo />
    </section>
  );
}
