import Link from "next/link";
import { UserX } from "lucide-react";

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
          error, escribinos desde{" "}
          <Link href="/contacto" className="text-primary font-medium underline">
            Contacto
          </Link>{" "}
          y lo revisamos.
        </p>
      </div>
    </div>
  );
}
