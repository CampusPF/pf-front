import Link from "next/link";
import { Check, Mic, Send } from "lucide-react";

/* El widget de la derecha es una ILUSTRACIÓN, no el tutor: no hay sesión ni
   lección en la landing, así que nada de acá puede responder. Por eso ningún
   elemento es focusable ni clickeable (nada de <input>/<button>: escribir una
   pregunta que nunca se envía es una promesa falsa) y todo el bloque va con
   role="img" para que un lector de pantalla anuncie el ejemplo una vez en vez
   de leer una conversación que no existe. */

const CODE_SNIPPET = `function procesarPago(monto, callback) {
  console.log(\`Procesando: $\${monto}\`);
  callback({ success: true });
}

procesarPago(100, (result) => {
  console.log('Resultado:', result);
});`;

const QUICK_ACTIONS = ["Ver más ejemplos 🔍", "Dame un quiz rápido ⚡"];

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

      {/* ── Columna derecha — Widget del AI Tutor ─────────────────── */}
      <div
        role="img"
        aria-label="Ejemplo de una conversación con el tutor de IA: un alumno pregunta qué es un callback en JavaScript y el tutor responde con una explicación y un fragmento de código."
        className="bg-surface border-border overflow-hidden rounded-2xl border shadow-xl"
      >
        <div className="bg-surface-elevated border-border flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="bg-success size-2 rounded-full" aria-hidden />
            <span className="text-text text-sm font-medium">Campus AI Tutor</span>
          </div>
          {/* Antes decía "Tokens 3.5": una métrica inventada que no significa
              nada para quien entra. Ahora se aclara que es un ejemplo. */}
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            Ejemplo
          </span>
        </div>

        <div className="bg-bg max-h-26rem space-y-3 overflow-y-auto px-4 py-4">
          <p className="bg-primary-solid ml-auto max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white">
            ¿Qué es un callback en JavaScript y cuándo debería usarlo?
          </p>

          <div className="bg-surface border-border max-w-[92%] space-y-3 rounded-2xl rounded-tl-sm border px-3 py-2">
            <p className="text-text-secondary text-sm">
              ¡Gran pregunta! Un <strong className="text-text">callback</strong> es
              una función que se pasa como argumento a otra función para que se
              ejecute luego de que ocurra un evento o una tarea asincrónica.
            </p>

            <pre className="bg-surface-elevated border-border text-text-secondary overflow-x-auto rounded-lg border p-3 font-mono text-xs">
              <code>{CODE_SNIPPET}</code>
            </pre>

            <p className="text-text-secondary text-sm">
              Se usa constantemente en eventos, respuestas de API HTTP y lectores
              de eventos del navegador.
            </p>

            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <span
                  key={action}
                  className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Composer dibujado, no funcional: mismo aspecto que el real del
            reproductor, pero sin campo ni botones (ver el comentario de
            arriba). */}
        <div className="bg-surface-elevated border-border flex items-center gap-2 border-t px-4 py-3">
          <p className="bg-surface border-border text-text-muted min-w-0 flex-1 truncate rounded-lg border px-3 py-2 text-sm">
            Escribí tu duda sobre este código...
          </p>
          <span className="text-text-muted rounded-lg p-2" aria-hidden>
            <Mic className="size-4" />
          </span>
          <span className="bg-primary-solid rounded-lg p-2 text-white" aria-hidden>
            <Send className="size-4" />
          </span>
        </div>
      </div>
    </section>
  );
}
