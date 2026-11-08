"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import {
  RECORRIDO_ABRIR_EVENT,
  RECORRIDO_INICIAR_EVENT,
  marcarVisto,
  recorridoDeRuta,
  yaVisto,
  type Recorrido,
} from "@/lib/recorridos";

/* Recorrido guiado «¿Cómo se usa?»: ilumina partes de la página con un borde
   amarillo y una frase corta. Arranca solo la primera vez que alguien entra
   al Inicio o a Cursos; después, sólo con el botón «¿Cómo se usa?» del Navbar
   (que dispara RECORRIDO_INICIAR_EVENT, o lleva a /?recorrido si la página
   actual no tiene recorrido). Los pasos están en lib/recorridos.ts.

   Es un diálogo modal de verdad (role="dialog", foco atrapado, ESC cierra):
   mientras está abierto, la página de atrás no recibe clicks. */

const MARGEN = 8; // aire entre el elemento y el borde amarillo
const ESPERA_APERTURA = 320; // ms para que el menú o el panel se abran antes de medir

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
}

function buscarObjetivo(objetivo: string): HTMLElement | null {
  const todos = document.querySelectorAll<HTMLElement>(`[data-recorrido="${objetivo}"]`);
  return Array.from(todos).find(visible) ?? null;
}

const reducirMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Rect = { top: number; left: number; width: number; height: number };

export default function RecorridoGuiado() {
  const pathname = usePathname();
  const [recorrido, setRecorrido] = useState<Recorrido | null>(null);
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const objetivoRef = useRef<HTMLElement | null>(null);
  const dialogoRef = useRef<HTMLDivElement>(null);
  const siguienteRef = useRef<HTMLButtonElement>(null);
  const abiertoAntesRef = useRef<Element | null>(null);

  const cerrar = useCallback(() => {
    setRecorrido(null);
    setRect(null);
    objetivoRef.current = null;
    (abiertoAntesRef.current as HTMLElement | null)?.focus?.();
  }, []);

  const iniciar = useCallback((r: Recorrido) => {
    marcarVisto(r.id);
    abiertoAntesRef.current = document.activeElement;
    setPaso(0);
    setRect(null);
    setRecorrido(r);
  }, []);

  // Primera visita (o ?recorrido, que pone el botón desde otra página).
  useEffect(() => {
    const r = recorridoDeRuta(pathname);
    if (!r) return;
    const pedido = new URLSearchParams(window.location.search).has("recorrido");
    if (!pedido && yaVisto(r.id)) return;
    if (pedido) window.history.replaceState(null, "", pathname + window.location.hash);
    // Un respiro para que la página termine de pintar (cursos del back, fuentes).
    const t = window.setTimeout(() => iniciar(r), 900);
    return () => window.clearTimeout(t);
  }, [pathname, iniciar]);

  // Botón «¿Cómo se usa?».
  useEffect(() => {
    const onIniciar = () => {
      const r = recorridoDeRuta(pathname);
      if (r) iniciar(r);
    };
    window.addEventListener(RECORRIDO_INICIAR_EVENT, onIniciar);
    return () => window.removeEventListener(RECORRIDO_INICIAR_EVENT, onIniciar);
  }, [pathname, iniciar]);

  // Cambiar de página cierra el recorrido.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- al navegar, el recorrido de la página anterior ya no aplica.
  useEffect(() => setRecorrido(null), [pathname]);

  // Ubicar el paso actual: abrir lo que haga falta, scrollear y medir.
  useEffect(() => {
    if (!recorrido) return;
    const actual = recorrido.pasos[paso];
    let cancelado = false;
    const timers: number[] = [];
    // Se pasó del último (por pasos salteados): termina. Diferido para no
    // encadenar renders dentro del efecto.
    if (!actual) {
      timers.push(window.setTimeout(cerrar, 0));
      return () => timers.forEach((t) => window.clearTimeout(t));
    }

    const medir = () => {
      const el = objetivoRef.current;
      if (!el || cancelado) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const ubicar = (el: HTMLElement) => {
      objetivoRef.current = el;
      el.scrollIntoView({ block: "center", behavior: reducirMovimiento() ? "auto" : "smooth" });
      timers.push(window.setTimeout(medir, reducirMovimiento() ? 30 : 420));
    };

    let el = buscarObjetivo(actual.objetivo);
    if (el) {
      ubicar(el);
    } else if (actual.abrir) {
      window.dispatchEvent(new CustomEvent(RECORRIDO_ABRIR_EVENT, { detail: actual.abrir }));
      timers.push(
        window.setTimeout(() => {
          if (cancelado) return;
          el = buscarObjetivo(actual.objetivo);
          if (el) ubicar(el);
          else setPaso((p) => p + 1); // no está en esta página (p. ej. sin categorías): se saltea
        }, ESPERA_APERTURA),
      );
    } else {
      timers.push(window.setTimeout(() => setPaso((p) => p + 1), 0));
    }

    const alMover = () => window.requestAnimationFrame(medir);
    window.addEventListener("resize", alMover);
    window.addEventListener("scroll", alMover, { passive: true });
    return () => {
      cancelado = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", alMover);
      window.removeEventListener("scroll", alMover);
    };
  }, [recorrido, paso, cerrar]);

  // Foco en «Siguiente» en cada paso; ESC cierra; Tab queda adentro del diálogo.
  useEffect(() => {
    if (!recorrido || !rect) return;
    siguienteRef.current?.focus({ preventScroll: true });
  }, [recorrido, paso, rect]);

  useEffect(() => {
    if (!recorrido) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        cerrar();
        return;
      }
      if (event.key === "ArrowRight") setPaso((p) => p + 1);
      if (event.key === "ArrowLeft") setPaso((p) => Math.max(0, p - 1));
      if (event.key === "Tab" && dialogoRef.current) {
        const focos = dialogoRef.current.querySelectorAll<HTMLElement>("button");
        const primero = focos[0];
        const ultimo = focos[focos.length - 1];
        if (event.shiftKey && document.activeElement === primero) {
          event.preventDefault();
          ultimo.focus();
        } else if (!event.shiftKey && document.activeElement === ultimo) {
          event.preventDefault();
          primero.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [recorrido, cerrar]);

  if (!recorrido) return null;
  const actual = recorrido.pasos[paso];
  if (!actual) return null;
  const total = recorrido.pasos.length;
  const esUltimo = paso === total - 1;

  // Globo: abajo del elemento si entra, si no arriba; en celular, pegado abajo.
  const ancho = typeof window !== "undefined" ? window.innerWidth : 1024;
  const alto = typeof window !== "undefined" ? window.innerHeight : 768;
  const esCelular = ancho < 640;
  let globo: React.CSSProperties = { left: 16, right: 16, bottom: 16 };
  if (rect && !esCelular) {
    const anchoGlobo = 340;
    const left = Math.min(Math.max(16, rect.left), ancho - anchoGlobo - 16);
    const debajo = rect.top + rect.height + MARGEN + 12;
    const arriba = rect.top - MARGEN - 12;
    globo =
      debajo + 200 < alto
        ? { left, top: debajo, width: anchoGlobo }
        : arriba > 200
          ? { left, bottom: alto - arriba, width: anchoGlobo }
          : rect.left > anchoGlobo + 40
            ? // Sin lugar arriba ni abajo: al costado izquierdo, centrado.
              { left: rect.left - anchoGlobo - MARGEN - 16, top: Math.max(16, rect.top + rect.height / 2 - 90), width: anchoGlobo }
            : ancho - (rect.left + rect.width) > anchoGlobo + 40
              ? { left: rect.left + rect.width + MARGEN + 16, top: Math.max(16, rect.top + rect.height / 2 - 90), width: anchoGlobo }
              : // El elemento ocupa casi toda la pantalla: el globo va abajo, adentro.
                { right: 24, bottom: 24, width: anchoGlobo };
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Capa que bloquea la página de atrás (el recorrido es modal). */}
      <div className="absolute inset-0" aria-hidden />

      {rect ? (
        <div
          aria-hidden
          className="recorrido-foco pointer-events-none fixed rounded-xl"
          style={{
            top: rect.top - MARGEN,
            left: rect.left - MARGEN,
            width: rect.width + MARGEN * 2,
            height: rect.height + MARGEN * 2,
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-black/55" />
      )}

      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recorrido-titulo"
        aria-describedby="recorrido-frase"
        className="bg-surface border-border fixed rounded-2xl border p-4 shadow-2xl"
        style={rect ? globo : { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 320 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-text-muted text-xs font-medium">
              ¿Cómo se usa? · Paso {paso + 1} de {total}
            </p>
            <h2 id="recorrido-titulo" className="text-text mt-0.5 text-base font-semibold">
              {actual.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar recorrido"
            className="text-text-muted hover:text-text hover:bg-surface-elevated -m-1 cursor-pointer rounded-lg p-1.5"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <p id="recorrido-frase" className="text-text-secondary mt-1.5 text-sm">
          {actual.frase}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden>
            {recorrido.pasos.map((p, i) => (
              <span
                key={p.objetivo}
                className={`h-1.5 rounded-full transition-all ${i === paso ? "bg-primary w-4" : "bg-border w-1.5"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => setPaso((p) => p - 1)}
                className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium"
              >
                Anterior
              </button>
            )}
            <button
              ref={siguienteRef}
              type="button"
              onClick={() => (esUltimo ? cerrar() : setPaso((p) => p + 1))}
              className="bg-primary-solid hover:bg-primary-solid-hover cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium text-white"
            >
              {esUltimo ? "Listo" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
