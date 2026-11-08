"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, CalendarDays, Check, Clock, FileText, Mail, MessageCircle, MessageSquareReply, X } from "lucide-react";

import GolondrinaLogo from "@/components/golondrina/GolondrinaLogo";
import {
  ACCIONES,
  CANALES,
  ejecutarAccion,
  type AccionId,
  type CanalId,
  type ResultadoAccion,
} from "@/lib/golondrina";

/* Vista "Golondrina" del drawer del tutor. El asistente de cada lección trae
   cuatro acciones de un clic; Golondrina las convierte en un aviso concreto
   (qué hace, cuándo y cómo te llega) y muestra la notificación tal como la
   vería el alumno en el celular.

   Prototipo: ver lib/golondrina.ts. El estado vive en memoria y se reinicia al
   cambiar de lección (el drawer monta este panel con `key={lessonId}`). */

const ICONO_ACCION: Record<AccionId, React.ElementType> = {
  recordar: BellRing,
  plan: CalendarDays,
  resumen: FileText,
  docente: MessageSquareReply,
};

const ICONO_CANAL: Record<CanalId, React.ElementType> = {
  whatsapp: MessageCircle,
  calendario: CalendarDays,
  mail: Mail,
};

export default function GolondrinaPanel({ lessonTitle }: { lessonTitle: string }) {
  const [canales, setCanales] = useState<Record<CanalId, boolean>>({
    whatsapp: false,
    calendario: false,
    mail: false,
  });
  const [resultados, setResultados] = useState<ResultadoAccion[]>([]);
  const [avisoVisible, setAvisoVisible] = useState(false);
  const avisoTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (avisoTimer.current) window.clearTimeout(avisoTimer.current);
  }, []);

  function alternarCanal(id: CanalId) {
    setCanales((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function activar(id: AccionId) {
    const resultado = ejecutarAccion(id, lessonTitle);
    // Si ya estaba, no se duplica: sube arriba de la lista.
    setResultados((prev) => [resultado, ...prev.filter((r) => r.accion !== id)]);
    // Un instante después aparece cómo le llega el aviso, como en el celular.
    setAvisoVisible(false);
    if (avisoTimer.current) window.clearTimeout(avisoTimer.current);
    avisoTimer.current = window.setTimeout(() => setAvisoVisible(true), 700);
  }

  function quitar(id: AccionId) {
    setResultados((prev) => prev.filter((r) => r.accion !== id));
  }

  const activas = new Set(resultados.map((r) => r.accion));
  const ultimo = resultados[0];
  const canalUltimo = ultimo ? ACCIONES.find((a) => a.id === ultimo.accion)?.canal : undefined;
  const nombreCanalUltimo = canalUltimo && canales[canalUltimo]
    ? CANALES.find((c) => c.id === canalUltimo)?.nombre
    : null;

  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
      <div className="flex items-start gap-3">
        <GolondrinaLogo className="h-10 w-9 shrink-0" />
        <div className="min-w-0">
          <p className="text-text text-sm font-medium">Golondrina se encarga</p>
          <p className="text-text-secondary text-xs">
            Tocá una acción y te aviso donde vos me dejes. Sobre: <span className="text-text font-medium">{lessonTitle}</span>
          </p>
        </div>
      </div>

      {/* 1. Acciones de un clic */}
      <section aria-labelledby="golondrina-acciones">
        <h3 id="golondrina-acciones" className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
          Acciones de esta lección
        </h3>
        <ul className="grid grid-cols-2 gap-2">
          {ACCIONES.map(({ id, titulo, bajada }) => {
            const Icono = ICONO_ACCION[id];
            const activa = activas.has(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => activar(id)}
                  aria-pressed={activa}
                  className={`flex h-full w-full cursor-pointer flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors duration-150 ${
                    activa
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface-elevated hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <Icono className="text-primary size-4" aria-hidden />
                    {activa && <Check className="text-primary size-4" aria-label="Activada" />}
                  </span>
                  <span className="text-text text-sm font-medium leading-snug">{titulo}</span>
                  <span className="text-text-muted text-xs leading-snug">{bajada}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 2. Lo que Golondrina va a hacer + vista del aviso */}
      {resultados.length > 0 && (
        <section aria-labelledby="golondrina-resultados" aria-live="polite">
          {ultimo && avisoVisible && (
            <div className="mb-3">
              <p className="text-text-muted mb-1.5 text-xs">
                Así te va a llegar{nombreCanalUltimo ? ` por ${nombreCanalUltimo}` : " al celular"}:
              </p>
              <div className="golondrina-aviso flex items-start gap-3 rounded-2xl bg-white p-3 text-slate-900 shadow-lg ring-1 ring-black/5">
                <GolondrinaLogo className="h-9 w-8 shrink-0" />
                <div className="min-w-0">
                  <p className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <span>Golondrina{nombreCanalUltimo ? ` · ${nombreCanalUltimo}` : ""}</span>
                    <span>{ultimo.cuando === "Ahora" || ultimo.cuando.startsWith("Apenas") ? "ahora" : "programado"}</span>
                  </p>
                  <p className="text-sm leading-snug">{ultimo.aviso}</p>
                </div>
              </div>
            </div>
          )}
          <h3 id="golondrina-resultados" className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
            Lo que voy a hacer
          </h3>
          <ul className="space-y-2">
            {resultados.map((r) => {
              const canal = ACCIONES.find((a) => a.id === r.accion)?.canal;
              const canalInfo = CANALES.find((c) => c.id === canal);
              const falta = canal && !canales[canal] ? canalInfo : null;
              return (
                <li key={r.accion} className="border-border bg-surface-elevated rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-text text-sm font-medium">{r.regla}</p>
                    <button
                      type="button"
                      onClick={() => quitar(r.accion)}
                      aria-label={`Quitar: ${r.regla}`}
                      className="text-text-muted hover:text-text -m-1 shrink-0 cursor-pointer rounded p-1"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <p className="text-primary mt-1 flex items-center gap-1.5 text-xs font-medium">
                    <Clock className="size-3.5" aria-hidden /> {r.cuando}
                  </p>
                  <ul className="text-text-secondary mt-1.5 space-y-0.5 text-xs">
                    {r.detalle.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  {falta && (
                    <button
                      type="button"
                      onClick={() => alternarCanal(falta.id)}
                      className="text-accent mt-2 cursor-pointer text-xs font-medium hover:underline"
                    >
                      Conectar {falta.nombre} para que te llegue →
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

        </section>
      )}

      {/* 3. Canales: se conectan con un clic */}
      <section aria-labelledby="golondrina-canales">
        <h3 id="golondrina-canales" className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
          ¿Dónde te aviso?
        </h3>
        <ul className="space-y-2">
          {CANALES.map(({ id, nombre, que }) => {
            const Icono = ICONO_CANAL[id];
            const ok = canales[id];
            return (
              <li key={id} className="border-border flex items-center gap-3 rounded-xl border p-2.5">
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Icono className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-text block text-sm font-medium">{nombre}</span>
                  <span className="text-text-muted block text-xs">{que}</span>
                </span>
                <button
                  type="button"
                  onClick={() => alternarCanal(id)}
                  aria-pressed={ok}
                  className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    ok
                      ? "bg-success-subtle text-success-text"
                      : "bg-primary-solid hover:bg-primary-solid-hover text-white"
                  }`}
                >
                  {ok ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3.5" aria-hidden /> Conectado
                    </span>
                  ) : (
                    "Conectar"
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-text-muted text-center text-xs">
        Prototipo: no se conecta a tus cuentas ni manda nada.
      </p>
    </div>
  );
}
