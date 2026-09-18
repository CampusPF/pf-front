'use client';

import Link from 'next/link';
import { useFormik } from 'formik';
import { AlertCircle, ArrowLeft, KeyRound, MailCheck } from 'lucide-react';

import { ApiError } from '@/services/api-client';
import { forgotPassword } from '@/services/auth/auth.service';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/services/auth/auth.schemas';
import { inputClass } from '@/components/ui/input-styles';
import { liveChange } from '@/lib/formik-live-validation';

const initialValues: ForgotPasswordFormValues = { email: '' };

/* Paso 1 de "olvidé mi contraseña": pedir el mail con el link.

   El back responde lo mismo exista o no la cuenta, así que esta pantalla
   NUNCA puede decir "ese email no está registrado" — eso convertiría el
   formulario en una forma de averiguar qué direcciones tienen cuenta. Por eso
   al salir bien se muestra siempre el mismo cartel de "si existe, te
   llegó". */
export function ForgotPasswordCard() {
  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);

      try {
        await forgotPassword(values.email.trim());
        setStatus('sent');
      } catch (caught) {
        setStatus(
          caught instanceof ApiError
            ? caught.message
            : 'Algo salió mal. Probá de nuevo en un momento.',
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const emailHasError = Boolean(formik.touched.email && formik.errors.email);
  const wasSent = formik.status === 'sent';
  const errorMessage = wasSent ? null : formik.status;

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center pt-28 pb-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <KeyRound className="text-primary size-6" aria-hidden />
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-text">
              Recuperar contraseña
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            Te mandamos un link para elegir una nueva.
          </p>
        </div>

        {wasSent ? (
          <div
            role="status"
            className="bg-surface border border-border rounded-xl p-6 text-center space-y-3"
          >
            <MailCheck className="text-success mx-auto size-10" aria-hidden />
            <p className="text-text text-sm font-medium">Revisá tu correo</p>
            <p className="text-text-muted text-xs leading-relaxed">
              Si <span className="text-text">{formik.values.email.trim()}</span>{' '}
              está registrado, te enviamos un link para elegir una contraseña
              nueva. Vence en 1 hora y se puede usar una sola vez.
            </p>
            <p className="text-text-muted text-xs">
              ¿No te llegó? Mirá en spam, o{' '}
              <button
                type="button"
                onClick={() => formik.setStatus(undefined)}
                className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover cursor-pointer"
              >
                probá con otro email
              </button>
              .
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={formik.handleSubmit} noValidate>
            {errorMessage && (
              <p
                role="alert"
                className="bg-danger-subtle text-danger border border-danger/30 rounded-xl px-4 py-3 text-xs flex items-start gap-2"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
                <span>{errorMessage}</span>
              </p>
            )}

            <div>
              <label className="block text-xs font-medium text-text mb-1.5" htmlFor="email">
                Email de tu cuenta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={formik.values.email}
                onChange={liveChange(formik)}
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

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className="w-full py-3.5 px-4 bg-primary-solid hover:bg-primary-solid-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formik.isSubmitting ? 'Enviando…' : 'Enviarme el link'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-text-muted hover:text-text inline-flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
