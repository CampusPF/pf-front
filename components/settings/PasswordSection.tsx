"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { ApiError } from "@/services/api-client";
import { PasswordField } from "@/components/auth/PasswordField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { inputClass } from "@/components/ui/input-styles";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/services/auth/auth.schemas";
import type { User } from "@/services/auth/auth.types";
import {
  buildPasswordSchema,
  type PasswordFormValues,
} from "@/services/profile/profile.schemas";
import { setPassword } from "@/services/profile/profile.service";

/* Una sola sección para dos casos, decididos por `hasPassword`:

   - Cuenta con contraseña → cambio: pide la actual y la valida contra el hash.
   - Cuenta creada con Google sin contraseña → alta: no pide la actual (no la
     tiene, pedírsela la dejaría trabada para siempre) y a partir de ahí puede
     entrar también con email y contraseña.

   El back resuelve los dos con el mismo endpoint; acá sólo cambia el schema y
   el copy. */

export default function PasswordSection({
  profile,
  onChanged,
}: {
  profile: User;
  onChanged: () => void;
}) {
  const hasPassword = profile.hasPassword ?? true;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validationSchema = useMemo(
    () => buildPasswordSchema(hasPassword),
    [hasPassword],
  );

  const formik = useFormik<PasswordFormValues>({
    initialValues: { currentPassword: "", password: "", confirmPassword: "" },
    validationSchema,
    /* `setSubmitting(false)` es obligatorio: Formik no baja isSubmitting solo
       cuando onSubmit es síncrono, y el diálogo quedaría con el spinner
       puesto y los dos botones deshabilitados para siempre. El estado del
       guardado real lo lleva `isSaving`. */
    onSubmit: (_values, { setSubmitting }) => {
      setSubmitting(false);
      setConfirmOpen(true);
    },
  });

  async function handleConfirm() {
    formik.setStatus(undefined);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const result = await setPassword({
        currentPassword: hasPassword ? formik.values.currentPassword : undefined,
        password: formik.values.password,
        confirmPassword: formik.values.confirmPassword,
      });

      setConfirmOpen(false);
      setSuccessMessage(result.message);
      formik.resetForm();
      // Después de crear la primera contraseña, `hasPassword` cambia a true y
      // el formulario tiene que pasar a pedir la actual.
      onChanged();
    } catch (caught) {
      setConfirmOpen(false);
      formik.setStatus(
        caught instanceof ApiError
          ? caught.message
          : "Algo salió mal. Probá de nuevo en un momento.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const currentHasError = Boolean(
    formik.touched.currentPassword && formik.errors.currentPassword,
  );
  const passwordHasError = Boolean(formik.touched.password && formik.errors.password);
  const confirmHasError = Boolean(
    formik.touched.confirmPassword && formik.errors.confirmPassword,
  );

  return (
    <section
      aria-labelledby="password-title"
      className="bg-surface border-border rounded-xl border p-6 shadow-sm"
    >
      <h2 id="password-title" className="text-text text-lg font-semibold">
        {hasPassword ? "Cambiar contraseña" : "Crear una contraseña"}
      </h2>
      <p className="text-text-muted mt-1 text-sm">
        {hasPassword
          ? "Elegí una contraseña nueva para tu cuenta."
          : "Entraste con Google, así que tu cuenta todavía no tiene contraseña."}
      </p>

      {!hasPassword && (
        <p className="bg-primary-subtle text-primary mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-xs">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Si creás una, vas a poder entrar tanto con Google como con tu email y
            contraseña. Seguí usando Google si preferís.
          </span>
        </p>
      )}

      <form className="mt-6 space-y-4" onSubmit={formik.handleSubmit} noValidate>
        {formik.status && (
          <p
            role="alert"
            className="bg-danger-subtle text-danger border-danger/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{formik.status}</span>
          </p>
        )}

        {successMessage && (
          <p
            role="status"
            className="bg-success-subtle text-success border-success/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{successMessage}</span>
          </p>
        )}

        {hasPassword && (
          <div>
            <label
              className="text-text mb-1.5 block text-xs font-medium"
              htmlFor="currentPassword"
            >
              Contraseña actual
            </label>
            <PasswordField
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={currentHasError}
              aria-describedby={currentHasError ? "currentPassword-error" : undefined}
              placeholder="••••••••"
              className={inputClass(currentHasError)}
            />
            {currentHasError && (
              <p
                id="currentPassword-error"
                role="alert"
                className="text-danger mt-1 text-xs"
              >
                {formik.errors.currentPassword}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="newPassword">
            {hasPassword ? "Contraseña nueva" : "Contraseña"}
          </label>
          <PasswordField
            id="newPassword"
            name="password"
            autoComplete="new-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={passwordHasError}
            aria-describedby="newPassword-hint"
            placeholder="••••••••"
            className={inputClass(passwordHasError)}
          />
          {passwordHasError ? (
            <p id="newPassword-hint" role="alert" className="text-danger mt-1 text-xs">
              {formik.errors.password}
            </p>
          ) : (
            <p id="newPassword-hint" className="text-text-muted mt-1 text-[11px]">
              <span aria-hidden>ⓘ</span> {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH}{" "}
              caracteres, con mayúscula, minúscula y número
            </p>
          )}
        </div>

        <div>
          <label
            className="text-text mb-1.5 block text-xs font-medium"
            htmlFor="confirmNewPassword"
          >
            Confirmar contraseña
          </label>
          <PasswordField
            id="confirmNewPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={confirmHasError}
            aria-describedby={confirmHasError ? "confirmNewPassword-error" : undefined}
            placeholder="••••••••"
            className={inputClass(confirmHasError)}
          />
          {confirmHasError && (
            <p
              id="confirmNewPassword-error"
              role="alert"
              className="text-danger mt-1 text-xs"
            >
              {formik.errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!formik.dirty || isSaving}
            className="bg-primary-solid hover:bg-primary-solid-hover cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={hasPassword ? "¿Cambiar tu contraseña?" : "¿Crear tu contraseña?"}
        description={
          hasPassword
            ? "Vas a necesitar la contraseña nueva la próxima vez que inicies sesión."
            : "Vas a poder entrar con tu email y esta contraseña, además de con Google."
        }
        confirmLabel={hasPassword ? "Sí, cambiar" : "Sí, crear"}
        cancelLabel="Volver"
        isPending={isSaving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
