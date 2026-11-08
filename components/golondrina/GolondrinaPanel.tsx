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
  // Qué aviso se muestra en la vista del celular, y en qué fase: "enviando"
  // es el instante entre que se conecta el canal y que llega el mensaje.
  const [mostrado, setMostrado] = useState<AccionId | null>(null);
  const [fase, setFase] = useState<"oculto" | "enviando" | "visible">("oculto");
  const avisoTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (avisoTimer.current) window.clearTimeout(avisoTimer.current);
  }, []);

  const canalDe = (id: AccionId) => ACCIONES.find((a) => a.id === id)!.canal;
  const nombreCanal = (id: CanalId) => CANALES.find((c) => c.id === id)!.nombre;

  /** Muestra el aviso de `id` como si llegara al celular. Con `enviando`, antes
      pasa un instante por "Enviando por …", que es lo que se ve al conectar. */
  function mostrarAviso(id: AccionId, enviando: boolean) {
    setMostrado(id);
    if (avisoTimer.current) window.clearTimeout(avisoTimer.current);
    setFase(enviando ? "enviando" : "oculto");
    avisoTimer.current = window.setTimeout(() => setFase("visible"), enviando ? 900 : 700);
  }

  /** Conectar un canal manda en el acto lo que estaba esperando por él. */
  function alternarCanal(id: CanalId, accionPendiente?: AccionId) {
    const conectando = !canales[id];
    setCanales((prev) => ({ ...prev, [id]: conectando }));
    if (!conectando) return;
    const pendiente = accionPendiente ?? resultados.find((r) => canalDe(r.accion) === id)?.accion;
    if (pendiente) mostrarAviso(pendiente, true);
  }

  function activar(id: AccionId) {
    const resultado = ejecutarAccion(id, lessonTitle);
    // Si ya estaba, no se duplica: sube arriba de la lista.
    setResultados((prev) => [resultado, ...prev.filter((r) => r.accion !== id)]);
    // Con el canal ya conectado se manda directo; si no, se muestra cómo llegaría.
    mostrarAviso(id, canales[canalDe(id)]);
  }

  function quitar(id: AccionId) {
    setResultados((prev) => prev.filter((r) => r.accion !== id));
    if (mostrado === id) {
      setMostrado(null);
      setFase("oculto");
    }
  }

  /** Estado de envío de una acción: depende sólo de si su canal está conectado. */
  function envio(r: ResultadoAccion): string | null {
    const canal = canalDe(r.accion);
    if (!canales[canal]) return null;
    if (r.cuando === "Ahora") return `Enviado por ${nombreCanal(canal)}`;
    if (canal === "calendario") return "Agendado en tu Calendario";
    return `Activado: te llega por ${nombreCanal(canal)}`;
  }

  const activas = new Set(resultados.map((r) => r.accion));
  const ultimo = resultados.find((r) => r.accion === mostrado);
  const canalUltimo = ultimo ? canalDe(ultimo.accion) : undefined;
  const nombreCanalUltimo = canalUltimo && canales[canalUltimo] ? nombreCanal(canalUltimo) : null;
  const enviadoUltimo = ultimo ? envio(ultimo) : null;

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
          {ultimo && fase === "enviando" && nombreCanalUltimo && (
            <p className="text-primary mb-3 flex items-center gap-2 text-xs font-medium">
              <span className="golondrina-enviando bg-primary size-2 rounded-full" aria-hidden />
              Enviando por {nombreCanalUltimo}…
            </p>
          )}
          {ultimo && fase === "visible" && (
            <div className="mb-3">
              <p className="text-text-muted mb-1.5 text-xs">
                {enviadoUltimo
                  ? `${enviadoUltimo}. Así te llegó:`
                  : "Así te va a llegar al celular (conectá el canal para recibirlo):"}
              </p>
              <div className="golondrina-aviso flex items-start gap-3 rounded-2xl bg-white p-3 text-slate-900 shadow-lg ring-1 ring-black/5">
                <GolondrinaLogo className="h-9 w-8 shrink-0" />
                <div className="min-w-0">
                  <p className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                    <span>Golondrina{nombreCanalUltimo ? ` · ${nombreCanalUltimo}` : ""}</span>
                    <span>{ultimo.cuando === "Ahora" || ultimo.cuando.startsWith("Apenas") ? "ahora" : "programado"}</span>
                  </p>
                  <p className="text-sm leading-snug">{ultimo.aviso}</p>
                  {enviadoUltimo && (
                    <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-700">
                      <Check className="size-3" aria-hidden /> {ultimo.cuando === "Ahora" ? "Entregado" : "Activado"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <h3 id="golondrina-resultados" className="text-text-muted mb-2 text-xs font-medium uppercase tracking-wide">
            Lo que voy a hacer
          </h3>
          <ul className="space-y-2">
            {resultados.map((r) => {
              const canal = canalDe(r.accion);
              const falta = !canales[canal] ? CANALES.find((c) => c.id === canal)! : null;
              const estado = envio(r);
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
                  {falta ? (
                    <button
                      type="button"
                      onClick={() => alternarCanal(falta.id, r.accion)}
                      className="bg-primary-solid hover:bg-primary-solid-hover mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150"
                    >
                      Conectar {falta.nombre} y {r.cuando === "Ahora" ? "enviar" : "activar"}
                    </button>
                  ) : (
                    estado && (
                      <p className="bg-success-subtle text-success-text mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium">
                        <Check className="size-3.5" aria-hidden /> {estado}
                      </p>
                    )
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
