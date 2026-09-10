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

/* El teléfono se pide como número local, sin código de país ni "+": ese
   prefijo lo agrega el form según el país elegido (ver RegisterCard). Acá
   sólo se valida que sean dígitos y que el largo sea plausible para un
   número real. */
const PHONE_MIN_DIGITS = 6;
const PHONE_MAX_DIGITS = 14;

/* Rango válido de fecha de nacimiento: entre 18 y 120 años atrás. Se
   calcula una vez al cargar el módulo. Formato "YYYY-MM-DD" para poder
   usarlo tal cual en el min/max del <input type="date"> y comparar
   lexicográficamente (que para ese formato equivale a comparar fechas). */
function toYmd(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
const _now = new Date();
export const MAX_BIRTH_DATE = toYmd(
  new Date(_now.getFullYear() - 18, _now.getMonth(), _now.getDate()),
);
export const MIN_BIRTH_DATE = toYmd(
  new Date(_now.getFullYear() - 120, _now.getMonth(), _now.getDate()),
);

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
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .matches(/^\D*$/, "El nombre no puede contener números."),
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
    .required("Seleccioná tu fecha de nacimiento.")
    .test("fecha-real", function (value) {
      if (!value) return true; // el required() se encarga del vacío
      if (Number.isNaN(new Date(value).getTime())) {
        return this.createError({ message: "Ingresá una fecha válida." });
      }
      if (value > MAX_BIRTH_DATE) {
        return this.createError({ message: "Tenés que ser mayor de 18 años." });
      }
      if (value < MIN_BIRTH_DATE) {
        return this.createError({
          message: "Ingresá una fecha de nacimiento real.",
        });
      }
      return true;
    }),
  phone: yup
    .string()
    .trim()
    .required("Escribí tu teléfono.")
    .matches(/^\d*$/, "El teléfono sólo puede tener números.")
    .min(PHONE_MIN_DIGITS, `El teléfono necesita al menos ${PHONE_MIN_DIGITS} dígitos.`)
    .max(PHONE_MAX_DIGITS, `El teléfono no puede tener más de ${PHONE_MAX_DIGITS} dígitos.`),
  country: yup.string().required("Elegí tu país."),
  acceptedTerms: yup
    .boolean()
    .oneOf([true], "Necesitás aceptar los términos y condiciones."),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
