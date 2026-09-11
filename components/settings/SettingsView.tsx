"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import AvatarSection from "@/components/settings/AvatarSection";
import ProfileForm from "@/components/settings/ProfileForm";
import PasswordSection from "@/components/settings/PasswordSection";
import SubscriptionSection from "@/components/settings/SubscriptionSection";
import type { User } from "@/services/auth/auth.types";
import { getMyProfile } from "@/services/profile/profile.service";

/* El perfil se pide acá, una vez, y se pasa a las secciones.

   No alcanza con el `user` del AuthProvider: ese sale de localStorage y de la
   respuesta del login, que sólo trae id/name/email. Los datos personales,
   `hasPassword` e `isGoogleAccount` sólo llegan por GET /users/me. */

export default function SettingsView() {
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getMyProfile(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProfile(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "No pudimos cargar tu perfil.",
        );
      });

    return () => controller.abort();
  }, []);

  // Tras crear la primera contraseña, `hasPassword` cambia y el formulario
  // tiene que pasar a pedir la actual: se relee el perfil entero.
  const reloadProfile = useCallback(() => {
    getMyProfile()
      .then(setProfile)
      .catch(() => {
        /* El cambio ya se guardó; si la relectura falla no vale la pena
           molestar al usuario con un error sobre algo que salió bien. */
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <h1 className="text-text text-2xl font-bold md:text-3xl">Configuración</h1>
        <p className="text-text-secondary mt-1">
          Actualizá tus datos, tu contraseña y tu plan.
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="bg-danger-subtle text-danger border-danger/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : !profile ? (
        <div className="flex items-center gap-2 py-10">
          <Loader2 className="text-primary size-5 animate-spin" aria-hidden />
          <span className="text-text-muted text-sm">Cargando tu perfil…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <AvatarSection profile={profile} onSaved={setProfile} />
          <ProfileForm profile={profile} onSaved={setProfile} />
          <PasswordSection profile={profile} onChanged={reloadProfile} />
          <SubscriptionSection />
        </div>
      )}
    </div>
  );
}
