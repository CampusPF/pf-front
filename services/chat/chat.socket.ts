import { io, type Socket } from "socket.io-client";

import { API_URL } from "@/services/api-client";
import { getToken } from "@/services/auth/token-storage";

/* Conexión en vivo al gateway del chat (namespace '/chat' de pf-back).
   Singleton por pestaña: todas las pantallas de chat comparten el mismo
   socket en vez de abrir uno por componente montado.

   El token va en `auth.token` del handshake — así lo lee
   ChatGateway.getToken en el back — no como header, porque el handshake de
   WebSocket no permite headers custom desde el navegador. Se resuelve una
   sola vez al conectar: si el token cambia (login/logout), hay que
   reconectar (ver disconnectChatSocket, llamado desde AuthProvider.logout). */
let socket: Socket | null = null;

export function getChatSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;

  if (socket?.connected || socket?.active) return socket;

  socket = io(`${API_URL}/chat`, {
    auth: (cb) => cb({ token: getToken() }),
    withCredentials: true,
    reconnectionDelayMax: 5000,
  });

  socket.on("disconnect", (reason) => console.warn("[chat] disconnect:", reason));
  socket.on("connect_error", (err) => console.warn("[chat] connect_error:", err.message));

  return socket;
}

/** Cierra la conexión y suelta la instancia: el próximo getChatSocket() abre
    una nueva (con el token que haya en ese momento). Se llama al cerrar
    sesión para no dejar un socket autenticado como el usuario anterior. */
export function disconnectChatSocket(): void {
  socket?.disconnect();
  socket = null;
}

/** Evento `message:new` del back: un mensaje nuevo en cualquier conversación
    del usuario logueado (el back sólo lo emite a sus propios rooms). Cada
    pantalla filtra los que le importan; ver chat.service.ts. Devuelve la
    función para desuscribirse. */
export function onNewMessage(callback: (payload: unknown) => void): () => void {
  const current = getChatSocket();
  if (!current) return () => {};

  current.on("message:new", callback);
  return () => current.off("message:new", callback);
}
