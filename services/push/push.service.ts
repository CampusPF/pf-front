import { API_URL, apiFetch } from "@/services/api-client";

interface PushPublicKeyResponse {
  publicKey: string;
}

interface SerializedPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/* 3 s alcanzaban en localhost pero no en un celular con red lenta la primera
   vez que se instala el SW. Si expira, el usuario ve "Service worker timeout"
   y cree que las notificaciones están rotas. */
const SERVICE_WORKER_TIMEOUT_MS = 10_000;

/* El service worker no puede leer el env de Next, pero necesita la URL del
   back y la clave VAPID para re-suscribirse solo cuando el navegador rota la
   suscripción (ver `pushsubscriptionchange` en public/sw.js). Se las dejamos
   en Cache Storage, que el SW sí puede leer. */
const CONFIG_CACHE = "campus-push-config";
const CONFIG_URL = "/__push-config";

async function cachePushConfig(publicKey: string): Promise<void> {
  try {
    const cache = await caches.open(CONFIG_CACHE);
    await cache.put(
      CONFIG_URL,
      new Response(
        JSON.stringify({
          apiUrl: API_URL,
          publicKey,
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
  } catch {
    // Sin Cache Storage (modo privado) el push sigue andando: lo único que se
    // pierde es la re-suscripción automática.
  }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Safari en iPhone/iPad, sin la app agregada a la pantalla de inicio. */
function isIosWithoutPwa(): boolean {
  if (typeof window === "undefined") return false;
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS se hace pasar por Mac, pero tiene pantalla táctil.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return isIos && !standalone;
}

/**
 * Traduce el error de `pushManager.subscribe()` a algo accionable.
 *
 * El del navegador ("Registration failed - push service error") no le dice
 * nada a nadie: no distingue entre "estás en Safari sin instalar la app",
 * "el servicio de push no respondió" y "la clave no sirve".
 */
function subscribeErrorMessage(error: unknown): string {
  if (isIosWithoutPwa()) {
    return (
      "En iPhone y iPad las notificaciones sólo funcionan con la app agregada a " +
      "la pantalla de inicio. Tocá Compartir → “Agregar a inicio”, abrila desde " +
      "ahí y volvé a activarlas."
    );
  }

  const detail = error instanceof Error ? error.message : "";
  if (/permission/i.test(detail)) {
    return "El navegador bloqueó las notificaciones para este sitio. Habilitalas desde la configuración del navegador.";
  }

  return (
    "El navegador no pudo registrar las notificaciones. Suele ser un problema " +
    "momentáneo del servicio de push: probá de nuevo en un rato, o desde otro " +
    "navegador."
  );
}

export async function registerPush(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    SERVICE_WORKER_TIMEOUT_MS,
  );
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const existingKeys = subscription.toJSON().keys;
    if (!existingKeys?.p256dh || !existingKeys.auth) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }
  if (!subscription) {
    const { publicKey } = await apiFetch<PushPublicKeyResponse>("/push/public-key");
    if (!publicKey) throw new Error("El servidor no tiene configurada la clave Web Push.");
    await cachePushConfig(publicKey);

    const options: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(publicKey),
    };

    try {
      subscription = await registration.pushManager.subscribe(options);
    } catch (error) {
      /* Reintento después de limpiar. El caso que esto arregla: el navegador
         conserva una suscripción vieja hecha con OTRA clave VAPID (pasa si se
         regeneraron las claves, o entre entornos), y `subscribe` la rechaza
         con "Registration failed - push service error" sin decir por qué. Como
         `getSubscription()` de arriba no devolvió nada, no hay forma de
         detectarlo antes: sólo se puede limpiar y volver a intentar. */
      const stale = await registration.pushManager.getSubscription();
      if (stale) await stale.unsubscribe().catch(() => false);

      try {
        subscription = await registration.pushManager.subscribe(options);
      } catch {
        throw new Error(subscribeErrorMessage(error));
      }
    }
  } else {
    // Ya suscripto: igual refrescamos la config por si el SW se instaló antes
    // de que existiera (o si cambió la URL del back entre deploys).
    void apiFetch<PushPublicKeyResponse>("/push/public-key")
      .then(({ publicKey }) => (publicKey ? cachePushConfig(publicKey) : undefined))
      .catch(() => undefined);
  }

  try {
    await apiFetch<void>("/push/subscribe", {
      method: "POST",
      auth: true,
      body: toSerializedSubscription(subscription),
    });
    return true;
  } catch (error) {
    await subscription.unsubscribe().catch(() => false);
    throw error;
  }
}

export async function unregisterPush(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    SERVICE_WORKER_TIMEOUT_MS,
  );
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await apiFetch<{ removed: number }>("/push/unsubscribe", {
    method: "DELETE",
    auth: true,
    body: { endpoint: subscription.endpoint },
  });

  await unsubscribeLocally(registration, subscription);
}

async function unsubscribeLocally(
  registration: ServiceWorkerRegistration,
  subscription: PushSubscription,
): Promise<void> {
  const removed = await subscription.unsubscribe();
  if (!removed) {
    console.warn("El navegador indicó que la suscripción Web Push ya estaba desactivada.");
  }

  const remaining = await registration.pushManager.getSubscription();
  if (remaining) {
    const retried = await remaining.unsubscribe();
    if (!retried) {
      console.warn("El navegador indicó que el segundo intento ya estaba desactivado.");
    }
    if (await registration.pushManager.getSubscription()) {
      throw new Error("El navegador mantiene activa la suscripción Web Push. Volvé a intentarlo.");
    }
  }
}

/**
 * Re-sincroniza la suscripción del navegador con el back.
 *
 * Hace falta porque las dos puntas se pueden desfasar sin que nadie se entere:
 * el back borra la fila cuando el servicio de push responde 404/410 (endpoint
 * rotado) o 401/403 (las claves VAPID cambiaron), pero el navegador sigue
 * teniendo su objeto `subscription` local. El usuario ve el switch en
 * "activado" y no le llega nada nunca más.
 *
 * `POST /push/subscribe` es un upsert por endpoint, así que volver a mandarlo
 * es barato e idempotente. Devuelve si quedó sincronizada.
 */
export async function syncPushSubscription(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") return false;

  try {
    /* `register` es idempotente y además dispara el chequeo de actualización
       del sw.js: sin esto, un arreglo en el service worker podía tardar días
       en llegar (el navegador revalida solo cada 24 h). */
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      SERVICE_WORKER_TIMEOUT_MS,
    );
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    await apiFetch<void>("/push/subscribe", {
      method: "POST",
      auth: true,
      body: toSerializedSubscription(subscription),
    });
    return true;
  } catch {
    // Silencioso a propósito: corre de fondo al entrar a la app y no tiene
    // que molestar a nadie si el back está caído o el SW todavía no arrancó.
    return false;
  }
}

export async function isPushEnabled(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") return false;
  try {
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      SERVICE_WORKER_TIMEOUT_MS,
    );
    const subscription = await registration.pushManager.getSubscription();
    const keys = subscription?.toJSON().keys;
    return Boolean(keys?.p256dh && keys.auth);
  } catch {
    return false;
  }
}

export async function clearPushState(userId?: string): Promise<void> {
  try {
    if (!isPushSupported()) return;
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      SERVICE_WORKER_TIMEOUT_MS,
    );
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    let deleteError: unknown;
    try {
      await apiFetch<{ removed: number }>("/push/unsubscribe", {
        method: "DELETE",
        auth: true,
        body: { endpoint: subscription.endpoint },
      });
    } catch (error) {
      deleteError = error;
    }
    await unsubscribeLocally(registration, subscription);
    if (deleteError) throw deleteError;
  } catch {
    // Logout must complete even if the API or service worker is unavailable.
  } finally {
    if (userId && typeof localStorage !== "undefined") {
      localStorage.removeItem(`push-enabled:${userId}`);
    }
  }
}

export async function sendPushTest(): Promise<void> {
  await apiFetch<{ sent: boolean }>("/push/test", { method: "POST", auth: true });
}

function decodeApplicationServerKey(base64Key: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64Key.length % 4)) % 4);
  const base64 = (base64Key + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer as ArrayBuffer;
}

function toSerializedSubscription(
  subscription: PushSubscription,
): SerializedPushSubscription {
  const serialized = subscription.toJSON();
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
    throw new Error("El navegador devolvió una suscripción Web Push incompleta.");
  }
  return {
    endpoint: serialized.endpoint,
    keys: {
      p256dh: serialized.keys.p256dh,
      auth: serialized.keys.auth,
    },
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("Service worker timeout")), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}