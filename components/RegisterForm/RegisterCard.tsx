'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFormik } from 'formik';
import { GraduationCap } from 'lucide-react';

import { ApiError } from '@/services/api-client';
import { getGoogleAuthUrl } from '@/services/auth/auth.service';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  MIN_PASSWORD_LENGTH,
  registerSchema,
  type RegisterFormValues,
} from '@/services/auth/auth.schemas';

const initialValues: RegisterFormValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export const RegisterCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const formik = useFormik<RegisterFormValues>({
    initialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);

      try {
        await register({
          name: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
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
              className="bg-danger-subtle text-danger border border-danger/30 rounded-xl px-4 py-3 text-xs"
            >
              {formik.status}
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
              aria-invalid={Boolean(formik.touched.fullName && formik.errors.fullName)}
              placeholder="Ej. Alex Morgan"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {formik.touched.fullName && formik.errors.fullName && (
              <p className="text-danger text-xs mt-1">{formik.errors.fullName}</p>
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
              aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-danger text-xs mt-1">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {formik.touched.password && formik.errors.password ? (
              <p className="text-danger text-xs mt-1">{formik.errors.password}</p>
            ) : (
              <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                <span>ⓘ</span> Mínimo {MIN_PASSWORD_LENGTH} caracteres
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1.5" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={Boolean(
                formik.touched.confirmPassword && formik.errors.confirmPassword,
              )}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-danger text-xs mt-1">{formik.errors.confirmPassword}</p>
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
                className="mt-0.5 rounded border-border bg-surface accent-primary focus:ring-0 cursor-pointer"
              />
              <label htmlFor="acceptedTerms" className="text-xs text-text-muted leading-tight cursor-pointer">
                Acepto los{' '}
                <a href="#" className="text-primary hover:underline cursor-pointer">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="#" className="text-primary hover:underline cursor-pointer">
                  política de privacidad
                </a>
                .
              </label>
            </div>
            {formik.touched.acceptedTerms && formik.errors.acceptedTerms && (
              <p className="text-danger text-xs mt-1">{formik.errors.acceptedTerms}</p>
            )}
          </div>

          {/* Botón Principal Submit */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{formik.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</span>
            {!formik.isSubmitting && <span>→</span>}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-text-muted">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline cursor-pointer">
            Iniciar sesión
          </Link>
        </div>

      </div>
    </div>
  );
};
