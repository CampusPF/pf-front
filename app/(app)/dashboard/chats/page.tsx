import type { Metadata } from "next";

import ChatsView from "@/components/chat/ChatsView";

export const metadata: Metadata = {
  title: "Chats — Campus",
  description: "Chat en vivo con el docente: la sala del curso y tu conversación directa.",
};

/* Cae bajo app/(app)/layout.tsx: ya viene con RequireAuth y el shell del
   dashboard. ChatsView resuelve el rol (alumno/docente) y arma la lista de
   conversaciones — acá no hay nada más que renderizarlo. */
export default function ChatsPage() {
  return <ChatsView />;
}
