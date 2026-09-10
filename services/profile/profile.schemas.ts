import * as yup from "yup";

import {
  birthDateRule,
  nameRule,
  passwordRule,
  phoneRule,
} from "@/services/auth/validation-rules";

/* Schemas de la pantalla de configuración. Comparten las reglas de cada campo
   con el registro (validation-rules.ts) pero difieren en qué es obligatorio:

   En el registro todo es required. Acá sólo el nombre lo es — una cuenta creada
   con Google llega sin teléfono, fecha de nacimiento ni país, y el usuario tiene
   que poder guardar el nombre sin verse forzado a completar todo de una. Si un
   campo opcional se completa, igual se valida. */

export const profileSchema = yup.object({
  fullName: nameRule().required("Escribí tu nombre completo."),
  birthDate: birthDateRule().default(""),
  phone: phoneRule().default(""),
  country: yup.string().default(""),
  city: yup.string().trim().max(100, "La ciudad no puede superar los 100 caracteres.").default(""),
  address: yup
    .string()
    .trim()
    .max(200, "La dirección no puede superar los 200 caracteres.")
    .default(""),
});

export type ProfileFormValues = yup.InferType<typeof profileSchema>;

/**
 * Contraseña. `hasPassword` decide si se exige la actual: la cuenta de Google
 * que todavía no tiene ninguna no puede aportarla, así que pedirla la dejaría
 * trabada para siempre.
 */
export function buildPasswordSchema(hasPassword: boolean) {
  return yup.object({
    currentPassword: hasPassword
      ? yup.string().required("Escribí tu contraseña actual.")
      : yup.string().default(""),
    password: passwordRule().required("Escribí una contraseña."),
    confirmPassword: yup
      .string()
      .required("Confirmá tu contraseña.")
      .oneOf([yup.ref("password")], "Las contraseñas no coinciden."),
  });
}

export interface PasswordFormValues {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}
