"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import ImageUploader from "@/components/ui/ImageUploader";
import type { User } from "@/services/auth/auth.types";
import { uploadAvatar } from "@/services/profile/profile.service";

/* Foto de perfil. Sin diálogo de confirmación (a diferencia de los datos
   personales): elegir el archivo ya es la decisión, y se puede volver a
   cambiar cuando quiera. */

export default function AvatarSection({
  profile,
  onSaved,
}: {
  profile: User;
  onSaved: (updated: User) => void;
}) {
  const { refreshUser } = useAuth();
  const [saved, setSaved] = useState(false);

  async function handleUploaded(updated: User) {
    setSaved(true);
    onSaved(updated);
    // El avatar se ve en el sidebar, que lee del AuthProvider.
    await refreshUser().catch(() => null);
  }

  return (
    <section
      aria-labelledby="avatar-title"
      className="bg-surface border-border rounded-xl border p-6 shadow-sm"
    >
      <h2 id="avatar-title" className="text-text text-lg font-semibold">
        Foto de perfil
      </h2>
      <p className="text-text-muted mt-1 mb-5 text-sm">
        Es la que ven los demás en el campus.
      </p>

      <ImageUploader
        shape="circle"
        label={profile.avatarUrl ? "Cambiar foto" : "Subir foto"}
        currentUrl={profile.avatarUrl}
        upload={(file) => {
          setSaved(false);
          return uploadAvatar(file);
        }}
        onUploaded={handleUploaded}
        fallback={
          <span className="text-text-secondary text-2xl font-semibold">
            {profile.name?.charAt(0).toUpperCase() || "?"}
          </span>
        }
      />

      {saved && (
        <p role="status" className="text-success mt-3 flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Listo, actualizamos tu foto.
        </p>
      )}
    </section>
  );
}
