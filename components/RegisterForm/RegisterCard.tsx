'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFormik } from 'formik';
import { AlertCircle, GraduationCap } from 'lucide-react';

import { ApiError } from '@/services/api-client';
import { getGoogleAuthUrl } from '@/services/auth/auth.service';
import { useAuth } from '@/components/auth/AuthProvider';
import { PasswordField } from '@/components/auth/PasswordField';
import {
  MAX_BIRTH_DATE,
  MAX_PASSWORD_LENGTH,
  MIN_BIRTH_DATE,
  MIN_PASSWORD_LENGTH,
  registerSchema,
  type RegisterFormValues,
} from '@/services/auth/auth.schemas';
import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  findCountry,
} from '@/data/countries';

const initialValues: RegisterFormValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  birthDate: '',
  phone: '',
  country: DEFAULT_COUNTRY_CODE,
  acceptedTerms: false,
};

/* Un solo lugar para el estilo de los inputs: el borde cambia a
   --color-danger cuando el campo tiene error, así el error no depende sólo
   del texto rojo de abajo (WCAG 1.4.1 — no usar el color como único medio). */
function inputClass(hasError: boolean) {
  return `w-full px-4 py-3 bg-surface border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
    hasError ? 'border-danger' : 'border-border'
  }`;
}

export const RegisterCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const formik = useFormik<RegisterFormValues>({
    initialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);

      const country = findCountry(values.country);

      try {
        await register({
          name: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
          confirmPassword: values.confirmPassword,
          birthDate: values.birthDate,
          // El campo pide sólo el número local; el "+código" lo agregamos
          // acá según el país elegido, que es lo que el back espera.
          phone: `+${country?.dialCode ?? ''}${values.phone.trim()}`,
          country: country?.name,
        });
        const redirect = searchParams.get('redirect');
        router.push(redirect?.startsWith('/') ? redirect : '/courses');
      } catch (caught) {
        setStatus(
          caught instanceof ApiError
            ? caught.message
            : 'Algo salió mal. Probá de nuevo en un momento.',
        );
        setSubmitting(false);
      }
    },
  });

  const fullNameHasError = Boolean(formik.touched.fullName && formik.errors.fullName);
  const emailHasError = Boolean(formik.touched.email && formik.errors.email);
  const passwordHasError = Boolean(formik.touched.password && formik.errors.password);
  const birthDateHasError = Boolean(formik.touched.birthDate && formik.errors.birthDate);
  const phoneHasError = Boolean(formik.touched.phone && formik.errors.phone);
  const countryHasError = Boolean(formik.touched.country && formik.errors.country);
  const acceptedTermsHasError = Boolean(
    formik.touched.acceptedTerms && formik.errors.acceptedTerms,
  );

  /* El error de "confirmar contraseña" se calcula acá (no se toma de
     formik.errors) para que desaparezca EN EL MOMENTO en que las dos
     contraseñas coinciden, sin esperar a que Formik revalide en el próximo
     ciclo. El schema igual bloquea el submit si no coinciden. */
  let confirmPasswordError: string | undefined;
  if (formik.touched.confirmPassword) {
    if (!formik.values.confirmPassword) {
      confirmPasswordError = 'Confirmá tu contraseña.';
    } else if (formik.values.password !== formik.values.confirmPassword) {
      confirmPasswordError = 'Las contraseñas no coinciden.';
    }
  }
  const confirmPasswordHasError = Boolean(confirmPasswordError);

  const selectedCountry = findCountry(formik.values.country);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center pt-28 pb-12 px-4">

      {/* Contenedor central */}
      <div className="w-full max-w-md space-y-6">

        {/* Encabezado con Ícono Lucide + Título */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <GraduationCap className="text-primary size-6" aria-hidden />
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-text">
              Crear tu cuenta
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            Empezá gratis. Sin tarjeta de crédito.
          </p>
        </div>

        {/* Botón de Google */}
        <button
          type="button"
          onClick={() => {
            window.location.href = getGoogleAuthUrl();
          }}
          className="w-full py-3 px-4 bg-surface hover:bg-surface-elevated border border-border rounded-xl font-medium text-sm text-text flex items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuar con Google
        </button>

        {/* Separador */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full"></div>
          <span className="bg-bg px-3 text-[10px] uppercase tracking-widest text-text-muted font-medium absolute">
            O CONTINUÁ CON EMAIL
          </span>
        </div>

        {/* Formulario */}
        <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
          {formik.status && (
            <p
              role="alert"
              className="bg-danger-subtle text-danger border border-danger/30 rounded-xl px-4 py-3 text-xs flex items-start gap-2"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
              <span>{formik.status}</span>
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="fullName">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={fullNameHasError}
              aria-describedby={fullNameHasError ? 'fullName-error' : undefined}
              placeholder="Ej. Alex Morgan"
              className={inputClass(fullNameHasError)}
            />
            {fullNameHasError && (
              <p id="fullName-error" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={emailHasError}
              aria-describedby={emailHasError ? 'email-error' : undefined}
              placeholder="tu@email.com"
              className={inputClass(emailHasError)}
            />
            {emailHasError && (
              <p id="email-error" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <PasswordField
              id="password"
              name="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={passwordHasError}
              aria-describedby="password-hint"
              placeholder="••••••••"
              className={inputClass(passwordHasError)}
            />
            {passwordHasError ? (
              <p id="password-hint" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.password}
              </p>
            ) : (
              <p id="password-hint" className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                <span aria-hidden>ⓘ</span> {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} caracteres, con mayúscula, minúscula y número
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={confirmPasswordHasError}
              aria-describedby={confirmPasswordHasError ? 'confirmPassword-error' : undefined}
              placeholder="••••••••"
              className={inputClass(confirmPasswordHasError)}
            />
            {confirmPasswordHasError && (
              <p id="confirmPassword-error" role="alert" className="text-danger text-xs mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="birthDate">
              Fecha de nacimiento
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              autoComplete="bday"
              min={MIN_BIRTH_DATE}
              max={MAX_BIRTH_DATE}
              value={formik.values.birthDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={birthDateHasError}
              aria-describedby={birthDateHasError ? 'birthDate-error' : undefined}
              className={inputClass(birthDateHasError)}
            />
            {birthDateHasError && (
              <p id="birthDate-error" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.birthDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="phone">
              Teléfono
            </label>
            <div
              className={`flex items-stretch overflow-hidden rounded-xl border bg-surface transition-all focus-within:ring-2 focus-within:ring-primary ${
                phoneHasError ? 'border-danger' : 'border-border'
              }`}
            >
              <span className="flex items-center gap-1 border-r border-border px-3 text-sm text-text-secondary">
                <span aria-hidden>{selectedCountry?.flag}</span>
                +{selectedCountry?.dialCode ?? ''}
              </span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={phoneHasError}
                aria-describedby="phone-hint"
                placeholder="3511234567"
                className="flex-1 bg-transparent px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none"
              />
            </div>
            {phoneHasError ? (
              <p id="phone-hint" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.phone}
              </p>
            ) : (
              <p id="phone-hint" className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                <span aria-hidden>ⓘ</span> Sólo el número, sin el código de país (lo agregamos según tu país).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="country">
              País
            </label>
            <select
              id="country"
              name="country"
              autoComplete="country"
              value={formik.values.country}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={countryHasError}
              aria-describedby={countryHasError ? 'country-error' : undefined}
              className={inputClass(countryHasError)}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} (+{country.dialCode})
                </option>
              ))}
            </select>
            {countryHasError && (
              <p id="country-error" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.country}
              </p>
            )}
          </div>

          {/* Checkbox Términos */}
          <div>
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="acceptedTerms"
                name="acceptedTerms"
                checked={formik.values.acceptedTerms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={acceptedTermsHasError}
                aria-describedby={acceptedTermsHasError ? 'acceptedTerms-error' : undefined}
                className="mt-0.5 rounded border-border bg-surface accent-primary focus:ring-0 cursor-pointer"
              />
              <label htmlFor="acceptedTerms" className="text-xs text-text-muted leading-tight cursor-pointer">
                Acepto los{' '}
                <a href="/terminos" className="text-primary underline underline-offset-2 hover:text-primary-hover cursor-pointer">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="/privacidad" className="text-primary underline underline-offset-2 hover:text-primary-hover cursor-pointer">
                  política de privacidad
                </a>
                .
              </label>
            </div>
            {acceptedTermsHasError && (
              <p id="acceptedTerms-error" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.acceptedTerms}
              </p>
            )}
          </div>

          {/* Botón Principal Submit */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full py-3.5 px-4 bg-primary-solid hover:bg-primary-solid-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{formik.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</span>
            {!formik.isSubmitting && <span>→</span>}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-text-muted">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover cursor-pointer">
            Iniciar sesión
          </Link>
        </div>

      </div>
    </div>
  );
};
