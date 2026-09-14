import { API_URL } from "@/services/api-client";

/* El back corre en el plan gratuito de Render, que lo duerme tras un rato sin
   tráfico: el primer request tarda ~30-60s mientras arranca. Este módulo:

   - `wakeBackend()`: ping liviano a GET / (público, sin base de datos) para
     despertarlo apenas se abre la web, antes de que el usuario lo necesite.
     Se deduplica: cualquiera que lo llame espera el mismo ping.
   - avisa a quien se suscriba (BackendWakeNotice) cuando algo tarda más de
     SLOW_MS con el back todavía sin confirmar, para mostrar un spinner en vez
     de una pantalla que parece colgada.

   Es para el navegador. En el server (SSR del catálogo) el aviso lo dan los
   loading.tsx de cada ruta. */

const SLOW_MS = 2500;
const PING_TIMEOUT_MS = 90_000;

type Listener = (waking: boolean) => void;

let awake = false;
let ping: Promise<boolean> | null = null;
let slowInFlight = 0;
const listeners = new Set<Listener>();

function emit() {
  const waking = slowInFlight > 0 && !awake;
  for (const listener of listeners) listener(waking);
}

export function subscribeBackendWaking(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Marca el back como despierto (cualquier respuesta HTTP lo prueba). */
export function markBackendAwake(): void {
  if (awake) return;
  awake = true;
  emit();
}

/**
 * Envuelve una espera contra el back: si tarda más de SLOW_MS y el back no se
 * confirmó despierto, se muestra el aviso hasta que termine.
 */
export async function trackBackendWait<T>(request: Promise<T>): Promise<T> {
  if (awake || typeof window === "undefined") return request;

  let counted = false;
  const timer = setTimeout(() => {
    counted = true;
    slowInFlight += 1;
    emit();
  }, SLOW_MS);

  try {
    return await request;
  } finally {
    clearTimeout(timer);
    if (counted) {
      slowInFlight -= 1;
      emit();
    }
  }
}

/** `true` cuando el back respondió; `false` si no hubo respuesta a tiempo. */
export function wakeBackend(): Promise<boolean> {
  if (awake) return Promise.resolve(true);
  if (ping) return ping;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  ping = trackBackendWait(
    fetch(`${API_URL}/`, { signal: controller.signal, cache: "no-store" })
      .then(() => {
        markBackendAwake();
        return true;
      })
      .catch(() => false),
  ).finally(() => {
    clearTimeout(timeout);
    ping = null;
  });

  return ping;
}
