import { io, type Socket } from "socket.io-client";

import { API_URL } from "@/services/api-client";
import { getToken } from "@/services/auth/token-storage";

/* Conexión en vivo al gateway del foro (namespace '/forums' de pf-back),
   separado del '/chat' — no comparten sockets ni rooms. Mismo patrón que
   chat.socket.ts: singleton por pestaña, token en `auth.token` del
   handshake (el handshake de WebSocket no admite headers custom desde el
   navegador), y se reusa la instancia mientras el token no cambie.

   El gateway no recibe escrituras: sólo avisa "este hilo cambió"
   (`thread:changed`) a quien tenga la room del hilo abierta
   (`thread:join`/`thread:leave`), para que vuelva a pedir el estado por
   REST. No reemplaza al REST, lo complementa. */
let socket: Socket | null = null;
let socketToken: string | null = null;

export function getForumSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;

  if (socket && socketToken === token) return socket;

  socket?.disconnect();
  socketToken = token;
  socket = io(`${API_URL}/forums`, {
    auth: { token },
    withCredentials: true,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

/** Se llama al cerrar sesión, igual que disconnectChatSocket. */
export function disconnectForumSocket(): void {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}

export function joinThreadRoom(threadId: string): void {
  getForumSocket()?.emit("thread:join", { threadId });
}

export function leaveThreadRoom(threadId: string): void {
  getForumSocket()?.emit("thread:leave", { threadId });
}

/** Evento `thread:changed` del back: alguien escribió/editó/borró algo en
    ESE hilo. Devuelve la función para desuscribirse. */
export function onThreadChanged(
  callback: (payload: { threadId: string }) => void,
): () => void {
  const current = getForumSocket();
  if (!current) return () => {};

  current.on("thread:changed", callback);
  return () => current.off("thread:changed", callback);
}
