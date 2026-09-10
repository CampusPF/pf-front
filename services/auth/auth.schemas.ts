import * as yup from "yup";

import {
  birthDateRule,
  nameRule,
  passwordRule,
  phoneRule,
} from "@/services/auth/validation-rules";

/* Schemas de Yup para los forms de auth. Separados de los componentes para que
   Formik y la validación se puedan testear o reusar sin importar JSX. Esto es
   validación de front nada más — la que manda sigue siendo la del back.

   Las reglas de cada campo viven en validation-rules.ts, compartidas con la
   pantalla de perfil. Acá sólo se decide qué es obligatorio en el registro. */

// Re-exportadas: los componentes las consumen desde acá desde siempre y varias
// se usan en el JSX (el min/max del <input type="date">, el hint de contraseña).
export {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_BIRTH_DATE,
  MAX_BIRTH_DATE,
} from "@/services/auth/validation-rules";

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required("Escribí tu email.")
    .email("Ese email no es válido."),
  password: yup.string().required("Escribí tu contraseña."),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;

export const registerSchema = yup.object({
  fullName: nameRule().required("Escribí tu nombre completo."),
  email: yup
    .string()
    .trim()
    .required("Escribí tu email.")
    .email("Ese email no es válido.")
    .max(255, "El email no puede superar los 255 caracteres."),
  password: passwordRule().required("Escribí una contraseña."),
  confirmPassword: yup
    .string()
    .required("Confirmá tu contraseña.")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden."),
  birthDate: birthDateRule().required("Seleccioná tu fecha de nacimiento."),
  phone: phoneRule().required("Escribí tu teléfono."),
  country: yup.string().required("Elegí tu país."),
  acceptedTerms: yup
    .boolean()
    .oneOf([true], "Necesitás aceptar los términos y condiciones."),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
