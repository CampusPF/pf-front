"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

/* El tutor «se adelanta» al volver a una lección: si la última vez la dejaste
   por la mitad, te muestra dónde quedaste y te lleva ahí con un clic.

   Guarda en este navegador (localStorage, por lección) hasta dónde se leyó y,
   si la lección tiene un <video> propio, el segundo del video. YouTube va en un
   iframe y no deja leer ni mover su tiempo, así que ahí sólo se guarda la
   lectura. Si localStorage no está disponible, simplemente no aparece. */

type Posicion = { y: number; pct: number; video?: number };

const clave = (lessonId: string) => `campus.posicion.${lessonId}`;

function leer(lessonId: string): Posicion | null {
  try {
    const raw = window.localStorage.getItem(clave(lessonId));
    return raw ? (JSON.parse(raw) as Posicion) : null;
  } catch {
    return null;
  }
}

function guardar(lessonId: string, posicion: Posicion) {
  try {
    window.localStorage.setItem(clave(lessonId), JSON.stringify(posicion));
  } catch {
    // sin almacenamiento: no se puede retomar, nada más
  }
}

function borrar(lessonId: string) {
  try {
    window.localStorage.removeItem(clave(lessonId));
  } catch {
    // idem
  }
}

const porcentaje = (y: number) => {
  const alto = document.documentElement.scrollHeight - window.innerHeight;
  return alto > 0 ? Math.round((y / alto) * 100) : 0;
};

/** Título de la sección que estaba leyendo: el último h2/h3 por encima de `y`. */
function seccionEn(y: number): string | null {
  const titulos = Array.from(document.querySelectorAll<HTMLElement>("main h2, main h3"));
  let actual: string | null = null;
  for (const t of titulos) {
    if (t.getBoundingClientRect().top + window.scrollY <= y + 160) actual = t.textContent?.trim() || actual;
  }
  return actual;
}

const minutos = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function RetomarLeccion({ lessonId }: { lessonId: string }) {
  const [pendiente, setPendiente] = useState<(Posicion & { seccion: string | null }) | null>(null);

  // Al entrar: ¿había quedado por la mitad?
  useEffect(() => {
    const previa = leer(lessonId);
    // Un momento para que el contenido (markdown, video) tenga su alto real.
    const t = window.setTimeout(() => {
      const porLaMitad = previa && ((previa.pct >= 10 && previa.pct < 95) || (previa.video ?? 0) > 15);
      setPendiente(porLaMitad && previa ? { ...previa, seccion: seccionEn(previa.y) } : null);
    }, 600);
    return () => window.clearTimeout(t);
  }, [lessonId]);

  // Mientras lee: guardar por dónde va (cada medio segundo como mucho).
  useEffect(() => {
    let ultimo = 0;
    let video = leer(lessonId)?.video;
    const anotar = () => {
      const ahora = Date.now();
      if (ahora - ultimo < 500) return;
      ultimo = ahora;
      guardar(lessonId, { y: window.scrollY, pct: porcentaje(window.scrollY), video });
    };
    const el = document.querySelector<HTMLVideoElement>("main video");
    const alVideo = () => {
      if (!el) return;
      video = el.currentTime;
      anotar();
    };
    window.addEventListener("scroll", anotar, { passive: true });
    el?.addEventListener("timeupdate", alVideo);
    return () => {
      window.removeEventListener("scroll", anotar);
      el?.removeEventListener("timeupdate", alVideo);
    };
  }, [lessonId]);

  if (!pendiente) return null;

  const retomar = () => {
    window.scrollTo({ top: pendiente.y, behavior: "smooth" });
    const el = document.querySelector<HTMLVideoElement>("main video");
    if (el && pendiente.video) el.currentTime = pendiente.video;
    setPendiente(null);
  };

  const desdeCero = () => {
    borrar(lessonId);
    setPendiente(null);
  };

  const donde = [
    pendiente.seccion ? `«${pendiente.seccion}»` : null,
    pendiente.video && pendiente.video > 15 ? `el minuto ${minutos(pendiente.video)} del video` : null,
  ]
    .filter(Boolean)
    .join(" y ");

  return (
    <div
      role="status"
      className="retomar-leccion bg-surface border-border fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-start gap-3 rounded-2xl border p-4 shadow-2xl"
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-text-muted text-xs font-medium">Tutor IA</p>
        <p className="text-text mt-0.5 text-sm">
          La última vez llegaste hasta {donde || `el ${pendiente.pct} % de la lección`}. ¿Seguimos desde ahí?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={retomar}
            className="bg-primary-solid hover:bg-primary-solid-hover cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-white"
          >
            Ir a donde quedé
          </button>
          <button
            type="button"
            onClick={desdeCero}
            className="text-text-secondary hover:text-text hover:bg-surface-elevated cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium"
          >
            Empezar de nuevo
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPendiente(null)}
        aria-label="Cerrar aviso"
        className="text-text-muted hover:text-text -m-1 cursor-pointer rounded-lg p-1.5"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
