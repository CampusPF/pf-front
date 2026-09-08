import * as yup from "yup";

/* Schemas de Yup para los forms de auth. Separados de los componentes para que
   Formik y la validación se puedan testear o reusar sin importar JSX. Esto es
   validación de front nada más — la que manda sigue siendo la del back. */

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 50;

/* Mismo regex que pf-back/src/auth/dto/register.dto.ts (@Matches en
   `password`): al menos una minúscula, una mayúscula y un número. Validarlo
   acá evita el viaje redondo al back sólo para enterarse de esto. */
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/* Formato internacional E.164-ish: "+" seguido del código de país y el
   número, sin espacios ni guiones. El back valida con class-validator
   IsPhoneNumber (libphonenumber-js); esto es sólo una validación rápida en
   el front para atajar el error más común (olvidarse el "+"). */
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

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
  fullName: yup
    .string()
    .trim()
    .required("Escribí tu nombre completo.")
    .min(2, "El nombre necesita al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  email: yup
    .string()
    .trim()
    .required("Escribí tu email.")
    .email("Ese email no es válido.")
    .max(255, "El email no puede superar los 255 caracteres."),
  password: yup
    .string()
    .required("Escribí una contraseña.")
    .min(
      MIN_PASSWORD_LENGTH,
      `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    )
    .max(MAX_PASSWORD_LENGTH, `La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres.`)
    .matches(
      PASSWORD_PATTERN,
      "Debe incluir mayúscula, minúscula y número.",
    ),
  confirmPassword: yup
    .string()
    .required("Confirmá tu contraseña.")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden."),
  birthDate: yup
    .string()
    .trim()
    .required("Seleccioná tu fecha de nacimiento."),
  phone: yup
    .string()
    .trim()
    .required("Escribí tu teléfono.")
    .matches(
      PHONE_PATTERN,
      'Incluí el código de país con "+", ej. +5491122334455.',
    ),
  address: yup
    .string()
    .trim()
    .max(200, "La dirección no puede superar los 200 caracteres."),
  city: yup
    .string()
    .trim()
    .max(100, "La ciudad no puede superar los 100 caracteres."),
  country: yup
    .string()
    .trim()
    .max(100, "El país no puede superar los 100 caracteres."),
  acceptedTerms: yup
    .boolean()
    .oneOf([true], "Necesitás aceptar los términos y condiciones."),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
