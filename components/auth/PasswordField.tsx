"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = Omit<
  React.ComponentPropsWithoutRef<"input">,
  "type"
> & {
  /** Clases del input (mismo `inputClass(hasError)` que los demás campos). */
  className?: string;
};

/* Input de contraseña con botón de ojo para mostrar/ocultar. Se usa en
   login y registro. El botón es `type="button"` para no disparar el submit
   del form, y queda en el orden de tabulación (accesible con teclado). */
export function PasswordField({ className = "", ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="text-text-muted hover:text-text absolute inset-y-0 right-0 flex cursor-pointer items-center px-3.5 transition-colors duration-150"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
