import { Check, Mic, Send } from "lucide-react";

const CODE_SNIPPET = `function procesarPago(monto, callback) {
  console.log(\`Procesando: $\${monto}\`);
  callback({ success: true });
}

procesarPago(100, (result) => {
  console.log('Resultado:', result);
});`;

const QUICK_ACTIONS = ["Ver más ejemplos 🔍", "Dame un quiz rápido ⚡"];

const TRUST_BADGES = [
  "No tarjeta de crédito requerida",
  "Claude 3.5 & GPT-4o integrados",
];

export default function HeroSection() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-28 pb-20 lg:grid-cols-2">
      {/* ── Columna izquierda ─────────────────────────────────────── */}
      <div>
        <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-sm font-medium">
          10.484 estudiantes aprendiendo en vivo 🟢
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
          <button
            type="button"
            className="bg-primary hover:bg-primary-hover cursor-pointer rounded-lg px-6 py-3 font-medium text-white transition-colors duration-150"
          >
            Explorar cursos
          </button>
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
      <div className="bg-surface border-border overflow-hidden rounded-2xl border shadow-xl">
        <div className="bg-surface-elevated border-border flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="bg-success size-2 rounded-full" aria-hidden />
            <span className="text-text text-sm font-medium">Campus AI Tutor</span>
          </div>
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            Tokens 3.5
          </span>
        </div>

        <div className="bg-bg max-h-26rem space-y-3 overflow-y-auto px-4 py-4">
          <p className="bg-primary ml-auto max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white">
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
                <button
                  key={action}
                  type="button"
                  className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer rounded-full px-3 py-1 text-xs transition-colors duration-150"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-elevated border-border flex items-center gap-2 border-t px-4 py-3">
          <input
            type="text"
            placeholder="Escribí tu duda sobre este código..."
            aria-label="Escribí tu duda sobre este código"
            className="bg-surface border-border text-text placeholder:text-text-muted focus:border-primary min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm transition-colors duration-150 outline-none"
          />
          <button
            type="button"
            aria-label="Dictar por voz"
            className="text-text-muted hover:text-text cursor-pointer rounded-lg p-2 transition-colors duration-150"
          >
            <Mic className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Enviar mensaje"
            className="bg-primary hover:bg-primary-hover cursor-pointer rounded-lg p-2 text-white transition-colors duration-150"
          >
            <Send className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
