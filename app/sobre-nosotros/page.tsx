import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, Sparkles, Unlock, type LucideIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { TEACHERS } from "@/data/team";

export const metadata: Metadata = {
  title: "Sobre nosotros — Campus",
  description: "Qué es Campus, cómo funciona y quiénes enseñan en la plataforma.",
};

/* Sólo lo que la plataforma hace hoy: nada de métricas ni promesas que no
   estén implementadas. */
const PILLARS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: BookOpen,
    title: "Cursos con estructura",
    text: "Módulos y lecciones en orden, con tu progreso guardado para retomar donde lo dejaste.",
  },
  {
    icon: Sparkles,
    title: "Un tutor de IA en cada lección",
    text: "Le preguntás sobre lo que estás viendo sin salir de la lección.",
  },
  {
    icon: Unlock,
    title: "Empezá gratis",
    text: "Hay cursos gratuitos para arrancar sin pagar nada, y con Premium accedés a todo el catálogo.",
  },
  {
    icon: Award,
    title: "Certificado al terminar",
    text: "Completá todas las lecciones de un curso y llevate el certificado.",
  },
];

export default function SobreNosotrosPage() {
  return (
    <>
      <Navbar />
      <main className="bg-bg min-h-screen pt-16">
        {/* Encabezado */}
        <section className="border-border relative overflow-hidden border-b">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-40 left-1/2 size-144 -translate-x-1/2 rounded-full blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center md:px-6 md:py-24">
            <span className="bg-primary-subtle text-primary inline-block rounded-full px-3 py-1 text-sm font-medium">
              Sobre nosotros
            </span>
            <h1 className="text-text mt-5 text-4xl font-extrabold tracking-tight text-balance md:text-5xl">
              Aprender no debería sentirse solitario
            </h1>
            <p className="text-text-secondary mx-auto mt-5 max-w-2xl text-lg leading-relaxed">
              Campus junta cursos armados por docentes con un tutor de IA que te
              acompaña lección a lección, para que siempre tengas a quién
              preguntarle cuando algo no cierra.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          {/* Cómo funciona: un solo panel dividido, no tarjetas sueltas */}
          <section aria-labelledby="pilares">
            <h2 id="pilares" className="text-text text-2xl font-bold md:text-3xl">
              Qué vas a encontrar
            </h2>
            <div className="border-border bg-border mt-8 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-surface p-6">
                  <span className="bg-primary-subtle text-primary flex size-10 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="text-text mt-4 font-semibold">{title}</h3>
                  <p className="text-text-secondary mt-2 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Docentes */}
          <section aria-labelledby="docentes" className="mt-20">
            <h2 id="docentes" className="text-text text-2xl font-bold md:text-3xl">
              Quiénes enseñan
            </h2>
            <p className="text-text-secondary mt-2">
              Cada curso lo arma y lo mantiene un docente de su área.
            </p>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2">
              {TEACHERS.map((teacher) => (
                <li key={teacher.name} className="flex gap-4">
                  <span
                    aria-hidden
                    className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${teacher.avatarClass}`}
                  >
                    {teacher.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-text font-semibold">{teacher.name}</p>
                    <p className="text-primary text-sm font-medium">{teacher.course}</p>
                    <p className="text-text-secondary mt-2 text-sm leading-relaxed">{teacher.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Llamado a la acción */}
          <section className="bg-primary-solid mt-20 flex flex-col items-start gap-6 rounded-2xl px-6 py-10 text-white md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <h2 className="text-2xl font-bold">Empezá a aprender hoy</h2>
              <p className="mt-2 text-white/80">No hace falta tarjeta para empezar.</p>
            </div>
            <Link
              href="/courses"
              className="text-primary flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold transition-opacity duration-150 hover:opacity-90"
            >
              Explorar cursos
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
