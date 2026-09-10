'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFormik } from 'formik';
import { AlertCircle, GraduationCap } from 'lucide-react';

import { ApiError } from '@/services/api-client';
import { getGoogleAuthUrl } from '@/services/auth/auth.service';
import { useAuth } from '@/components/auth/AuthProvider';
import { PasswordField } from '@/components/auth/PasswordField';
import { loginSchema, type LoginFormValues } from '@/services/auth/auth.schemas';

const initialValues: LoginFormValues = { email: '', password: '' };

/* Un solo lugar para el estilo de los inputs: el borde cambia a
   --color-danger cuando el campo tiene error, así el error no depende sólo
   del texto rojo de abajo (WCAG 1.4.1 — no usar el color como único medio). */
function inputClass(hasError: boolean) {
  return `w-full px-4 py-3 bg-surface border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
    hasError ? 'border-danger' : 'border-border'
  }`;
}

export const LoginCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const formik = useFormik<LoginFormValues>({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);

      try {
        await login(values);
        const redirect = searchParams.get('redirect');
        router.push(redirect?.startsWith('/') ? redirect : '/courses');
      } catch (caught) {
        setStatus(
          caught instanceof ApiError
            ? caught.message
            : 'Algo salió mal. Probá de nuevo en un momento.',
        );
        // Sólo reactivamos el botón si falló: si salió bien ya estamos navegando.
        setSubmitting(false);
      }
    },
  });

  const emailHasError = Boolean(formik.touched.email && formik.errors.email);
  const passwordHasError = Boolean(formik.touched.password && formik.errors.password);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center pt-28 pb-12 px-4">

      {/* Contenedor central */}
      <div className="w-full max-w-md space-y-6">

        {/* Encabezado con Ícono Lucide + Título */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <GraduationCap className="text-primary size-6" aria-hidden />
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-text">
              Iniciar sesión
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            ¡Qué bueno verte de nuevo!
          </p>
        </div>

        {/* Botón de Google */}
        <button
          type="button"
          onClick={() => {
            // Es un 302 del back hacia Google: tiene que ser navegación, no fetch.
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-text" htmlFor="password">
                Contraseña
              </label>
            </div>
            <PasswordField
              id="password"
              name="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={passwordHasError}
              aria-describedby={passwordHasError ? 'password-error' : undefined}
              placeholder="••••••••"
              className={inputClass(passwordHasError)}
            />
            {passwordHasError && (
              <p id="password-error" role="alert" className="text-danger text-xs mt-1">
                {formik.errors.password}
              </p>
            )}
          </div>

          {/* Recordarme */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              className="rounded border-border bg-surface accent-primary focus:ring-0 cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs text-text-muted cursor-pointer">
              Recordarme en este dispositivo
            </label>
          </div>

          {/* Botón Principal Submit */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full py-3.5 px-4 bg-primary-solid hover:bg-primary-solid-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{formik.isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}</span>
            {!formik.isSubmitting && <span>→</span>}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-text-muted">
          ¿No tenés una cuenta?{' '}
          <Link href="/register" className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover cursor-pointer">
            Crear cuenta
          </Link>
        </div>

      </div>
    </div>
  );
};
