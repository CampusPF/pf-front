import { apiFetch } from "@/services/api-client";

interface PushPublicKeyResponse {
  publicKey: string;
}

interface SerializedPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const SERVICE_WORKER_TIMEOUT_MS = 3_000;

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
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
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(publicKey),
    });
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