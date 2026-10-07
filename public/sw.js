/* Service worker de las notificaciones push.
 *
 * Ojo al tocar este archivo: un service worker nuevo queda en "waiting" hasta
 * que se cierran TODAS las pestañas del sitio, así que sin `skipWaiting` un
 * arreglo acá puede tardar días en llegarle a la gente. Por eso las dos
 * primeras líneas de abajo no son opcionales.
 */

/* `skipWaiting` + `clients.claim`: el SW nuevo reemplaza al viejo apenas se
   instala y pasa a controlar las pestañas que ya estaban abiertas. Lo segundo
   además es lo que hace que `notificationclick` pueda navegar (ver abajo). */
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* Config que el SW necesita para re-suscribirse solo (ver
   `pushsubscriptionchange`): la URL del back y la clave VAPID pública. No
   puede leer el env de Next, así que el front se la deja acá al suscribirse
   (services/push/push.service.ts → cachePushConfig). */
const CONFIG_CACHE = 'campus-push-config';
const CONFIG_URL = '/__push-config';

async function readConfig() {
  try {
    const cache = await caches.open(CONFIG_CACHE);
    const response = await cache.match(CONFIG_URL);
    if (!response) return null;
    return await response.json();
  } catch {
    return null;
  }
}

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Campus';
  /* `renotify` sin `tag` hace que showNotification RECHACE y la notificación
     se pierda sin aviso. Si no vino tag, no renotificamos. */
  const tag = typeof payload.tag === 'string' && payload.tag ? payload.tag : undefined;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: payload.icon || '/logo-campus.png',
      badge: '/logo-campus.png',
      tag,
      renotify: tag ? true : undefined,
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin);

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const existing = clientList.find(
        (client) => new URL(client.url).origin === targetUrl.origin,
      );

      /* `client.navigate()` sólo funciona sobre clientes CONTROLADOS por este
         service worker: si la pestaña se abrió antes de que el SW tomara el
         control, rechaza con TypeError y el click no hacía nada. Ahora se
         intenta navegar y, si falla, se abre una ventana nueva. */
      if (existing) {
        try {
          const navigated = await existing.navigate(targetUrl.href);
          if (navigated) return navigated.focus();
          return existing.focus();
        } catch {
          return self.clients.openWindow(targetUrl.href);
        }
      }

      return self.clients.openWindow(targetUrl.href);
    })(),
  );
});

/* El navegador rota o invalida las suscripciones push por su cuenta (pasa
   solo, sobre todo en Chrome Android). Sin este handler la suscripción moría
   ahí: el back la borraba al recibir 410 y el usuario seguía viendo el switch
   en "activado" sin que le llegara nunca más nada. Era LA causa de "andaba y
   dejó de andar" en producción.

   La re-suscripción va por un endpoint público que identifica la fila por el
   endpoint viejo (el SW no tiene el JWT del usuario). */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const config = await readConfig();
      if (!config?.apiUrl || !config.publicKey) return;

      const oldEndpoint = event.oldSubscription?.endpoint;

      let subscription = await self.registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(config.publicKey),
        });
      }

      const serialized = subscription.toJSON();
      if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) return;

      await fetch(`${config.apiUrl}/push/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEndpoint: oldEndpoint || null,
          endpoint: serialized.endpoint,
          keys: { p256dh: serialized.keys.p256dh, auth: serialized.keys.auth },
        }),
      });
    })(),
  );
});

function decodeKey(base64Key) {
  const padding = '='.repeat((4 - (base64Key.length % 4)) % 4);
  const base64 = (base64Key + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
