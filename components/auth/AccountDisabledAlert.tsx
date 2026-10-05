import { UserX } from "lucide-react";

import { SUPPORT_EMAIL } from "@/lib/support";

/* Aviso de cuenta dada de baja, en /login y /register.

   Es un aviso propio y no el cartel rojo genérico de "algo salió mal": la
   persona no se equivocó en nada, así que no se le habla como a un error de
   formulario. Lo que necesita es saber qué pasó y a dónde ir. */
export default function AccountDisabledAlert() {
  return (
    <div
      role="alert"
      className="border-warning/40 bg-warning-subtle text-text flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
    >
      <UserX className="text-warning mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold">Tu cuenta fue dada de baja</p>
        <p className="text-text-secondary text-xs">
          Ya no podés iniciar sesión ni crear una cuenta nueva con este email. Si creés que es un
          error, escribinos a{" "}
          {/* mailto directo, no un link a /contacto: es la única persona que
              no puede entrar a la plataforma, no la mandemos a buscar. */}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary font-medium break-all underline"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          y lo revisamos.
        </p>
      </div>
    </div>
  );
}
