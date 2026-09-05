import * as yup from "yup";

/* Schemas de Yup para los forms de auth. Separados de los componentes para que
   Formik y la validación se puedan testear o reusar sin importar JSX. Esto es
   validación de front nada más — la que manda sigue siendo la del back. */

export const MIN_PASSWORD_LENGTH = 8;

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
  fullName: yup.string().trim().required("Escribí tu nombre completo."),
  email: yup
    .string()
    .trim()
    .required("Escribí tu email.")
    .email("Ese email no es válido."),
  password: yup
    .string()
    .required("Escribí una contraseña.")
    .min(
      MIN_PASSWORD_LENGTH,
      `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    ),
  confirmPassword: yup
    .string()
    .required("Confirmá tu contraseña.")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden."),
  acceptedTerms: yup
    .boolean()
    .oneOf([true], "Necesitás aceptar los términos y condiciones."),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
