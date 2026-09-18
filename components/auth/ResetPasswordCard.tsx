'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import { AlertCircle, KeyRound, LinkIcon } from 'lucide-react';

import { ApiError } from '@/services/api-client';
import { resetPassword } from '@/services/auth/auth.service';
import {
  resetPasswordSchema,
  MIN_PASSWORD_LENGTH,
  type ResetPasswordFormValues,
} from '@/services/auth/auth.schemas';
import { PasswordField } from '@/components/auth/PasswordField';
import { inputClass } from '@/components/ui/input-styles';
import { liveChange } from '@/lib/formik-live-validation';

const initialValues: ResetPasswordFormValues = {
  password: '',
  confirmPassword: '',
};

/* Paso 2 de "olvidé mi contraseña": elegir la nueva.

   El token viaja en la query (?token=...), que es lo que arma el link del
   mail. No se valida contra el back hasta el submit: hacerlo al entrar
   gastaría el chequeo y no aportaría nada (el token es de un solo uso y se
   consume recién al cambiar la contraseña).

   A propósito NO está envuelta en RedirectIfAuthenticated: si alguien tiene
   una sesión vieja abierta y clickea el link del mail, tiene que poder
   completar el cambio igual. */
export function ResetPasswordCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const formik = useFormik<ResetPasswordFormValues>({
    initialValues,
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);

      if (!token) {
        setStatus('El link no es válido. Pedí uno nuevo.');
        setSubmitting(false);
        return;
      }

      try {
        await resetPassword(token, values.password);
        // El cartel de éxito lo muestra el login (?reset=1), así el usuario
        // queda justo donde tiene que usar la contraseña nueva.
        router.push('/login?reset=1');
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

  const passwordHasError = Boolean(formik.touched.password && formik.errors.password);
  const confirmHasError = Boolean(
    formik.touched.confirmPassword && formik.errors.confirmPassword,
  );

  // Sin token no hay nada que hacer: se avisa y se manda a pedir otro, en vez
  // de mostrar un formulario que va a fallar sí o sí al enviarlo.
  if (!token) {
    return (
      <Shell>
        <div
          role="alert"
          className="bg-surface border border-border rounded-xl p-6 text-center space-y-3"
        >
          <LinkIcon className="text-text-muted mx-auto size-10" aria-hidden />
          <p className="text-text text-sm font-medium">Este link no es válido</p>
          <p className="text-text-muted text-xs leading-relaxed">
            Le falta el código de recuperación. Puede que se haya cortado al
            copiarlo del mail.
          </p>
          <Link
            href="/forgot-password"
            className="bg-primary-solid hover:bg-primary-solid-hover inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            Pedir un link nuevo
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
        {formik.status && (
          <div
            role="alert"
            className="bg-danger-subtle text-danger border border-danger/30 rounded-xl px-4 py-3 text-xs"
          >
            <p className="flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
              <span>{formik.status}</span>
            </p>
            <Link
              href="/forgot-password"
              className="mt-2 ml-6 inline-block font-medium underline underline-offset-2 cursor-pointer"
            >
              Pedir un link nuevo
            </Link>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text mb-1.5" htmlFor="password">
            Nueva contraseña
          </label>
          <PasswordField
            id="password"
            name="password"
            autoComplete="new-password"
            autoFocus
            value={formik.values.password}
            onChange={liveChange(formik)}
            onBlur={formik.handleBlur}
            aria-invalid={passwordHasError}
            aria-describedby={passwordHasError ? 'password-error' : 'password-hint'}
            placeholder="••••••••"
            className={inputClass(passwordHasError)}
          />
          {passwordHasError ? (
            <p id="password-error" role="alert" className="text-danger text-xs mt-1">
              {formik.errors.password}
            </p>
          ) : (
            <p id="password-hint" className="text-text-muted text-xs mt-1">
              Mínimo {MIN_PASSWORD_LENGTH} caracteres, con mayúscula, minúscula y número.
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-xs font-medium text-text mb-1.5"
            htmlFor="confirmPassword"
          >
            Repetir contraseña
          </label>
          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={formik.values.confirmPassword}
            onChange={liveChange(formik)}
            onBlur={formik.handleBlur}
            aria-invalid={confirmHasError}
            aria-describedby={confirmHasError ? 'confirm-error' : undefined}
            placeholder="••••••••"
            className={inputClass(confirmHasError)}
          />
          {confirmHasError && (
            <p id="confirm-error" role="alert" className="text-danger text-xs mt-1">
              {formik.errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="w-full py-3.5 px-4 bg-primary-solid hover:bg-primary-solid-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {formik.isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </Shell>
  );
}

/** Encabezado y contenedor, compartidos por los dos estados de la pantalla. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center pt-28 pb-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <KeyRound className="text-primary size-6" aria-hidden />
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-text">
              Nueva contraseña
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            Elegí una contraseña nueva para tu cuenta.
          </p>
        </div>

        {children}

        <div className="text-center text-xs text-text-muted">
          <Link
            href="/login"
            className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover cursor-pointer"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
