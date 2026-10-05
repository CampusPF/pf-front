"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, Mic, Send, X } from "lucide-react";

/* Demo animada del tutor (reemplaza al ejemplo estático de callbacks): un
   tema accesible para cualquiera —inglés de negocios— contado en tres pasos:
   preguntar, recibir la explicación y practicar con un quiz.

   Sigue siendo una ILUSTRACIÓN: nada es focusable ni clickeable y el bloque
   va con role="img" (ver HeroSection). Toda la animación sale de un único
   reloj `t` (ms dentro del ciclo); cada pieza se muestra según el instante.
   Con prefers-reduced-motion se muestra directamente el estado final. */

const QUESTION = "¿Cómo pido una reunión en inglés de forma profesional?";
const QUIZ_REQUEST = "Dame un quiz rápido ⚡";
const QUICK_ACTIONS = ["Ver más ejemplos 🔍", QUIZ_REQUEST];

const TYPE_SPEED = 45;
const T_SENT = QUESTION.length * TYPE_SPEED + 500;
const T_ANSWER = T_SENT + 1300;
const T_CHIP_PRESS = T_ANSWER + 3600;
const T_QUIZ_REQUEST = T_CHIP_PRESS + 1100;
const T_QUIZ = T_QUIZ_REQUEST + 1300;
const T_CORRECT = T_QUIZ + 2200;
const T_LOOP = T_CORRECT + 4200;
const TICK = 50;

const STEPS = ["Preguntá", "Aprendé", "Practicá"];

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function TypingDots() {
  return (
    <div className="bg-surface border-border flex w-fit gap-1 rounded-2xl rounded-tl-sm border px-3 py-3">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="bg-text-muted size-1.5 animate-bounce rounded-full"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export default function TutorDemo() {
  const reduced = useReducedMotion();
  const [clock, setClock] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(
      () => setClock((c) => (c + TICK) % T_LOOP),
      TICK,
    );
    return () => clearInterval(id);
  }, [reduced]);

  const t = reduced ? T_LOOP - 1 : clock;
  const typed = t < T_SENT ? QUESTION.slice(0, Math.floor(t / TYPE_SPEED)) : "";
  const typingDone = typed.length === QUESTION.length;
  const thinking =
    (t >= T_SENT && t < T_ANSWER) || (t >= T_QUIZ_REQUEST && t < T_QUIZ);
  const activeStep = t < T_ANSWER ? 0 : t < T_CHIP_PRESS ? 1 : 2;

  return (
    <div
      role="img"
      aria-label="Ejemplo animado del tutor de IA: un alumno pregunta cómo pedir una reunión en inglés de forma profesional, el tutor le muestra frases correctas e incorrectas y después le toma un quiz rápido."
      className="bg-surface border-border overflow-hidden rounded-2xl border shadow-xl"
    >
      <div className="bg-surface-elevated border-border flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="bg-success size-2 rounded-full" aria-hidden />
          <span className="text-text text-sm font-medium">Campus AI Tutor</span>
        </div>
        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
          Ejemplo · Inglés de negocios
        </span>
      </div>

      {/* Guía de pasos: acompaña la animación para que se entienda el flujo. */}
      <ol className="border-border flex border-b">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors duration-300 ${
              i === activeStep ? "text-primary bg-primary/10" : "text-text-muted"
            }`}
          >
            <span
              className={`flex size-4 items-center justify-center rounded-full text-[10px] transition-colors duration-300 ${
                i === activeStep
                  ? "bg-primary-solid text-white"
                  : "bg-surface-elevated"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {/* Alto fijo + justify-end: los mensajes nuevos empujan a los viejos
          hacia arriba, como un chat real, sin mover el resto de la landing. */}
      <div className="bg-bg flex h-[24rem] flex-col justify-end gap-3 overflow-hidden px-4 py-4">
        {t >= T_SENT && (
          <p className="chat-toast-in bg-primary-solid ml-auto max-w-[80%] shrink-0 rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white">
            {QUESTION}
          </p>
        )}

        {t >= T_ANSWER && (
          <div className="chat-toast-in bg-surface border-border max-w-[92%] shrink-0 space-y-3 rounded-2xl rounded-tl-sm border px-3 py-2">
            <p className="text-text-secondary text-sm">
              ¡Buena pregunta! En inglés de negocios se usan fórmulas corteses
              con <strong className="text-text">could</strong> o{" "}
              <strong className="text-text">would</strong> en vez de un pedido
              directo:
            </p>

            <ul className="bg-surface-elevated border-border space-y-1.5 rounded-lg border p-3 text-xs">
              <li className="text-text-muted flex items-center gap-2 line-through">
                <X className="text-danger size-3.5 shrink-0" aria-hidden />I want
                a meeting tomorrow.
              </li>
              <li className="text-text flex items-center gap-2">
                <Check className="text-success size-3.5 shrink-0" aria-hidden />
                Could we schedule a meeting for tomorrow?
              </li>
              <li className="text-text flex items-center gap-2">
                <Check className="text-success size-3.5 shrink-0" aria-hidden />
                Would you be available on Tuesday at 10?
              </li>
            </ul>

            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => {
                const pressed =
                  action === QUIZ_REQUEST &&
                  t >= T_CHIP_PRESS &&
                  t < T_QUIZ_REQUEST;
                return (
                  <span
                    key={action}
                    className={`rounded-full px-3 py-1 text-xs transition-all duration-200 ${
                      pressed
                        ? "bg-primary-solid ring-primary/30 scale-95 text-white ring-4"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {action}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {t >= T_QUIZ_REQUEST && (
          <p className="chat-toast-in bg-primary-solid ml-auto max-w-[80%] shrink-0 rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white">
            {QUIZ_REQUEST}
          </p>
        )}

        {t >= T_QUIZ && (
          <div className="chat-toast-in bg-surface border-border max-w-[92%] shrink-0 space-y-2 rounded-2xl rounded-tl-sm border px-3 py-2">
            <p className="text-text text-sm font-medium">
              ¿Cuál suena más profesional?
            </p>
            <p className="border-border text-text-secondary rounded-lg border px-3 py-1.5 text-xs">
              A. Send me the report now.
            </p>
            <p
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors duration-300 ${
                t >= T_CORRECT
                  ? "border-success bg-success/10 text-text"
                  : "border-border text-text-secondary"
              }`}
            >
              B. Could you send me the report, please?
            </p>
            {t >= T_CORRECT && (
              <p className="chat-toast-in text-success flex items-center gap-1 text-xs font-medium">
                <Check className="size-3.5" aria-hidden />
                ¡Correcto! “Could you…, please?” es cortés y claro.
              </p>
            )}
          </div>
        )}

        {thinking && <TypingDots />}
      </div>

      <div className="bg-surface-elevated border-border flex items-center gap-2 border-t px-4 py-3">
        <p
          className={`bg-surface border-border min-w-0 flex-1 truncate rounded-lg border px-3 py-2 text-sm ${
            typed ? "text-text" : "text-text-muted"
          }`}
        >
          {typed || "Escribí tu duda sobre esta lección..."}
          {typed && !typingDone && (
            <span className="bg-text ml-px inline-block h-4 w-px animate-pulse align-middle" />
          )}
        </p>
        <span className="text-text-muted rounded-lg p-2" aria-hidden>
          <Mic className="size-4" />
        </span>
        <span
          className={`bg-primary-solid rounded-lg p-2 text-white transition-transform duration-200 ${
            typingDone ? "ring-primary/30 scale-110 ring-4" : ""
          }`}
          aria-hidden
        >
          <Send className="size-4" />
        </span>
      </div>
    </div>
  );
}
