import { BookOpen, Clock, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Sabe qué estás estudiando",
    description:
      "Lee tu código en tiempo real y comprende el contexto exacto de tu ejercicio. No tenés que copiar y pegar prompts genéricos ni dar contexto.",
  },
  {
    icon: Zap,
    title: "Se adapta a tu nivel",
    description:
      "Respuestas simples con analogías si recién empezás, y directas a patrones avanzados si ya tenés experiencia.",
  },
  {
    icon: Clock,
    title: "Disponible 24/7 sin esperas",
    description:
      "Olvidate de esperar 3 días en un foro de preguntas para continuar aprendiendo.",
  },
];

const REDUCE_SNIPPET = `const nums = [1, 2, 3];

const dobles = nums.reduce((acc, n) => {
  acc.push(n * 2);
  return acc;
}, []);

console.log(dobles); // [2, 4, 6]`;

 const AiTutorFeature = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="bg-surface-elevated grid grid-cols-1 items-center gap-12 rounded-3xl p-10 lg:grid-cols-2 lg:p-16">
        {/* ── Columna izquierda ───────────────────────────────────── */}
        <div>
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            Tu copiloto de aprendizaje
          </p>
          <h2 className="text-text mt-2 text-2xl font-bold md:text-3xl">
            Un tutor que te conoce y nunca se cansa
          </h2>
          <p className="text-text-secondary mt-3">
            A diferencia de las plataformas tradicionales con videos genéricos,
            Campus te desafía y escribe código con un motor de inteligencia
            artificial construido a tu ritmo.
          </p>

          <ul className="mt-8 space-y-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-text font-semibold">{title}</h3>
                  <p className="text-text-secondary mt-1 text-sm">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Columna derecha — Chat UI secundario ────────────────── */}
        <div className="bg-surface border-border overflow-hidden rounded-xl border shadow-lg">
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            <p className="text-text truncate text-sm font-medium">
              Funciones de orden superior
            </p>
            <span className="bg-accent/10 text-accent rounded-full px-2 py-0.5 text-xs font-medium">
              JavaScript
            </span>
          </div>

          <div className="space-y-3 px-4 py-4">
            <p className="bg-primary ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white">
              ¿Cómo uso .reduce() para devolver el doble de cada elemento?
            </p>

            <div className="bg-surface-elevated border-border max-w-[92%] space-y-3 rounded-2xl rounded-tl-sm border px-3 py-2">
              <p className="text-text-secondary text-sm">
                Reservá la variable{" "}
                <code className="text-primary font-mono text-xs">acc</code> en la
                línea 14, empujá el doble y devolvela en cada vuelta:
              </p>

              <pre className="bg-surface border-border text-text-secondary overflow-x-auto rounded-lg border p-3 font-mono text-xs">
                <code>{REDUCE_SNIPPET}</code>
              </pre>
            </div>

            <p className="bg-primary ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white">
              ¡Genial! Funcionó a la primera 🎉
            </p>
          </div>

          <div className="border-border bg-surface-elevated flex items-center justify-between gap-3 border-t px-4 py-3">
            <span className="bg-success/10 text-success rounded-full px-3 py-1 text-xs font-medium">
              ¡Ejercicio resuelto!
            </span>
            <span className="bg-warning/10 text-warning rounded-full px-3 py-1 text-xs font-semibold">
              +20 XP
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiTutorFeature;