import { COUNTRIES, DEFAULT_COUNTRY_CODE, type Country } from "@/data/countries";

/* El back guarda el teléfono en formato internacional ("+543511234567") y el
   país por su NOMBRE ("Argentina"), que es lo que manda el registro. El
   formulario, en cambio, lo muestra partido en dos: un select de país y un
   input con sólo el número local.

   Estos helpers traducen entre las dos formas. Hacen falta en la pantalla de
   configuración, que es la primera que tiene que PRECARGAR un teléfono ya
   guardado — el registro sólo tenía que armarlo. */

/** Busca un país por su nombre en español, que es como lo guarda el back. */
export function findCountryByName(name?: string | null): Country | undefined {
  if (!name) return undefined;
  return COUNTRIES.find((country) => country.name === name);
}

export interface SplitPhone {
  /** ISO alpha-2 del país elegido en el select. */
  countryCode: string;
  /** Sólo el número local, sin "+" ni código de país. */
  localNumber: string;
}

/**
 * Parte "+543511234567" en `{ countryCode: "AR", localNumber: "3511234567" }`.
 *
 * El nombre del país guardado se usa para desambiguar: varios países comparten
 * código de discado (+1 lo usan Estados Unidos, Canadá y buena parte del
 * Caribe), así que del número solo no se puede deducir cuál es. Si no hay país
 * guardado, se elige el que tenga el dialCode más largo que coincida — el
 * criterio menos malo, porque los códigos son un prefijo libre.
 */
export function splitPhone(
  phone?: string | null,
  countryName?: string | null,
): SplitPhone {
  const storedCountry = findCountryByName(countryName);
  const digits = (phone ?? "").replace(/^\+/, "");

  if (!digits) {
    return {
      countryCode: storedCountry?.code ?? DEFAULT_COUNTRY_CODE,
      localNumber: "",
    };
  }

  if (storedCountry && digits.startsWith(storedCountry.dialCode)) {
    return {
      countryCode: storedCountry.code,
      localNumber: digits.slice(storedCountry.dialCode.length),
    };
  }

  const match = COUNTRIES.filter((country) => digits.startsWith(country.dialCode)).sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  )[0];

  if (!match) {
    // Número que no matchea ningún código conocido: lo mostramos entero para
    // no perder el dato del usuario, con el país que tuviera guardado.
    return {
      countryCode: storedCountry?.code ?? DEFAULT_COUNTRY_CODE,
      localNumber: digits,
    };
  }

  return {
    countryCode: match.code,
    localNumber: digits.slice(match.dialCode.length),
  };
}

/** Arma "+543511234567" a partir del país elegido y el número local. */
export function joinPhone(countryCode: string, localNumber: string): string {
  const country = COUNTRIES.find((item) => item.code === countryCode);
  return `+${country?.dialCode ?? ""}${localNumber.trim()}`;
}
