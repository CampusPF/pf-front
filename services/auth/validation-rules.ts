import * as yup from "yup";

/* Reglas de validación compartidas entre el registro (services/auth/auth.schemas)
   y la edición de perfil (services/profile/profile.schemas). Viven acá para que
   las dos pantallas no puedan discrepar: si el back cambia el largo mínimo de la
   contraseña, se toca un solo archivo.

   Los helpers devuelven el schema SIN `.required()` a propósito. Un campo puede
   ser obligatorio en el registro y opcional en el perfil (una cuenta creada con
   Google no tiene teléfono ni fecha de nacimiento hasta que el usuario los
   complete), así que la obligatoriedad la decide cada schema. */

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 50;

/* Mismo regex que pf-back/src/auth/dto/register.dto.ts y set-password.dto.ts
   (@Matches en `password`): al menos una minúscula, una mayúscula y un número.
   Validarlo acá evita el viaje redondo al back sólo para enterarse de esto. */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/* El teléfono se pide como número local, sin código de país ni "+": ese
   prefijo lo agrega el form según el país elegido. Acá sólo se valida que sean
   dígitos y que el largo sea plausible para un número real. */
export const PHONE_MIN_DIGITS = 6;
export const PHONE_MAX_DIGITS = 14;

/* Rango válido de fecha de nacimiento: entre 18 y 120 años atrás. Se calcula
   una vez al cargar el módulo. Formato "YYYY-MM-DD" para poder usarlo tal cual
   en el min/max del <input type="date"> y comparar lexicográficamente (que para
   ese formato equivale a comparar fechas). */
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

/** Nombre completo: 2-100 caracteres, sin números (igual que el back). */
export function nameRule() {
  return yup
    .string()
    .trim()
    .min(2, "El nombre necesita al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .matches(/^\D*$/, "El nombre no puede contener números.");
}

export function passwordRule() {
  return yup
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres.`,
    )
    .matches(PASSWORD_PATTERN, "Debe incluir mayúscula, minúscula y número.");
}

/** Sólo el número local, sin prefijo de país. */
export function phoneRule() {
  return yup
    .string()
    .trim()
    .matches(/^\d*$/, "El teléfono sólo puede tener números.")
    .min(PHONE_MIN_DIGITS, `El teléfono necesita al menos ${PHONE_MIN_DIGITS} dígitos.`)
    .max(
      PHONE_MAX_DIGITS,
      `El teléfono no puede tener más de ${PHONE_MAX_DIGITS} dígitos.`,
    );
}

/** Fecha real, mayor de 18 y no absurdamente antigua. */
export function birthDateRule() {
  return yup
    .string()
    .trim()
    .test("fecha-real", function (value) {
      if (!value) return true; // el required() de cada schema se encarga del vacío
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
    });
}
