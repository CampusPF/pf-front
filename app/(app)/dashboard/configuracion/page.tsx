import type { Metadata } from "next";

import SettingsView from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Configuración — Campus",
  description: "Actualizá tus datos personales, tu contraseña y tu plan.",
};

/* Cae bajo app/(app)/layout.tsx, así que ya viene con RequireAuth y el shell
   del dashboard. El contenido es cliente porque la sesión (y por lo tanto el
   token que pide GET /users/me) sólo existe en el navegador. */
export default function ConfiguracionPage() {
  return <SettingsView />;
}
