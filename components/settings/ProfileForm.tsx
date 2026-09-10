"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { ApiError } from "@/services/api-client";
import { useAuth } from "@/components/auth/AuthProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { inputClass } from "@/components/ui/input-styles";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, findCountry } from "@/data/countries";
import { joinPhone, splitPhone } from "@/lib/phone";
import { MAX_BIRTH_DATE, MIN_BIRTH_DATE } from "@/services/auth/auth.schemas";
import type { User } from "@/services/auth/auth.types";
import { profileSchema, type ProfileFormValues } from "@/services/profile/profile.schemas";
import { updateProfile } from "@/services/profile/profile.service";

/* Datos personales. Mismo molde que RegisterCard (Formik + Yup, inputClass,
   aria-invalid/aria-describedby, el par hint↔error), con dos diferencias:

   1. El email es de sólo lectura. Es la credencial de login y el back no lo
      acepta en PATCH /users/me: cambiarlo sin verificar el mail nuevo permite
      secuestrar la cuenta.
   2. El submit no guarda: abre el diálogo de confirmación y guarda ahí. */

export default function ProfileForm({
  profile,
  onSaved,
}: {
  profile: User;
  onSaved: (updated: User) => void;
}) {
  const { refreshUser } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const storedPhone = splitPhone(profile.phone, profile.country);

  const formik = useFormik<ProfileFormValues>({
    initialValues: {
      fullName: profile.name ?? "",
      birthDate: profile.birthDate ?? "",
      phone: storedPhone.localNumber,
      country: storedPhone.countryCode || DEFAULT_COUNTRY_CODE,
      city: profile.city ?? "",
      address: profile.address ?? "",
    },
    validationSchema: profileSchema,
    /* El submit no guarda nada: sólo abre el diálogo. El guardado real está
       en handleConfirm.

       `setSubmitting(false)` es obligatorio acá. Formik pone isSubmitting en
       true al hacer submit y, si onSubmit es síncrono (no devuelve una
       promesa), NO lo vuelve a bajar solo. Sin esta línea isSubmitting queda
       en true para siempre: el diálogo se abre con el spinner puesto y los
       dos botones deshabilitados, y el de "Guardar cambios" queda muerto.

       Por eso el estado del guardado lo lleva `isSaving` y no formik. */
    onSubmit: (_values, { setSubmitting }) => {
      setSubmitting(false);
      setConfirmOpen(true);
    },
  });

  async function handleConfirm() {
    formik.setStatus(undefined);
    setSavedMessage(null);
    setIsSaving(true);

    const values = formik.values;

    try {
      const updated = await updateProfile({
        name: values.fullName.trim(),
        // Los opcionales sólo viajan si tienen algo: mandar "" haría que el
        // back guarde un string vacío en vez de dejar el campo sin completar.
        birthDate: values.birthDate || undefined,
        phone: values.phone.trim()
          ? joinPhone(values.country, values.phone)
          : undefined,
        country: values.country ? findCountry(values.country)?.name : undefined,
        city: values.city.trim() || undefined,
        address: values.address.trim() || undefined,
      });

      setConfirmOpen(false);
      setSavedMessage("Listo, guardamos tus cambios.");
      onSaved(updated);
      // El nombre y la inicial se muestran en el sidebar y el topbar, que
      // viven en el layout: sin esto quedarían desactualizados hasta recargar.
      await refreshUser();
      formik.resetForm({ values });
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

  const fullNameHasError = Boolean(formik.touched.fullName && formik.errors.fullName);
  const birthDateHasError = Boolean(formik.touched.birthDate && formik.errors.birthDate);
  const phoneHasError = Boolean(formik.touched.phone && formik.errors.phone);
  const cityHasError = Boolean(formik.touched.city && formik.errors.city);
  const addressHasError = Boolean(formik.touched.address && formik.errors.address);

  const selectedCountry = findCountry(formik.values.country);

  return (
    <section
      aria-labelledby="profile-title"
      className="bg-surface border-border rounded-xl border p-6 shadow-sm"
    >
      <h2 id="profile-title" className="text-text text-lg font-semibold">
        Datos personales
      </h2>
      <p className="text-text-muted mt-1 text-sm">
        Así te identificamos en el campus.
      </p>

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

        {savedMessage && (
          <p
            role="status"
            className="bg-success-subtle text-success border-success/30 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{savedMessage}</span>
          </p>
        )}

        <div>
          <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="fullName">
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
            aria-describedby={fullNameHasError ? "fullName-error" : undefined}
            className={inputClass(fullNameHasError)}
          />
          {fullNameHasError && (
            <p id="fullName-error" role="alert" className="text-danger mt-1 text-xs">
              {formik.errors.fullName}
            </p>
          )}
        </div>

        <div>
          <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="settings-email">
            Email
          </label>
          <input
            id="settings-email"
            type="email"
            value={profile.email}
            readOnly
            aria-describedby="settings-email-hint"
            className={`${inputClass(false)} text-text-muted cursor-not-allowed opacity-70`}
          />
          <p id="settings-email-hint" className="text-text-muted mt-1 text-[11px]">
            <span aria-hidden>ⓘ</span> El email no se puede cambiar: es con lo que
            iniciás sesión.
          </p>
        </div>

        <div>
          <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="birthDate">
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
            aria-describedby={birthDateHasError ? "birthDate-error" : undefined}
            className={inputClass(birthDateHasError)}
          />
          {birthDateHasError && (
            <p id="birthDate-error" role="alert" className="text-danger mt-1 text-xs">
              {formik.errors.birthDate}
            </p>
          )}
        </div>

        <div>
          <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="settings-phone">
            Teléfono
          </label>
          <div
            className={`bg-surface focus-within:ring-primary flex items-stretch overflow-hidden rounded-xl border transition-all focus-within:ring-2 ${
              phoneHasError ? "border-danger" : "border-border"
            }`}
          >
            <span className="border-border text-text-secondary flex items-center gap-1 border-r px-3 text-sm">
              <span aria-hidden>{selectedCountry?.flag}</span>+
              {selectedCountry?.dialCode ?? ""}
            </span>
            <input
              id="settings-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={phoneHasError}
              aria-describedby="settings-phone-hint"
              placeholder="3511234567"
              className="text-text placeholder:text-text-muted flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
            />
          </div>
          {phoneHasError ? (
            <p id="settings-phone-hint" role="alert" className="text-danger mt-1 text-xs">
              {formik.errors.phone}
            </p>
          ) : (
            <p id="settings-phone-hint" className="text-text-muted mt-1 text-[11px]">
              <span aria-hidden>ⓘ</span> Sólo el número, sin el código de país (lo
              agregamos según tu país).
            </p>
          )}
        </div>

        <div>
          <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="settings-country">
            País
          </label>
          <select
            id="settings-country"
            name="country"
            autoComplete="country"
            value={formik.values.country}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={inputClass(false)}
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name} (+{country.dialCode})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="city">
              Ciudad <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={cityHasError}
              aria-describedby={cityHasError ? "city-error" : undefined}
              placeholder="Córdoba"
              className={inputClass(cityHasError)}
            />
            {cityHasError && (
              <p id="city-error" role="alert" className="text-danger mt-1 text-xs">
                {formik.errors.city}
              </p>
            )}
          </div>

          <div>
            <label className="text-text mb-1.5 block text-xs font-medium" htmlFor="address">
              Dirección <span className="text-text-muted font-normal">(opcional)</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={addressHasError}
              aria-describedby={addressHasError ? "address-error" : undefined}
              placeholder="Av. Siempre Viva 742"
              className={inputClass(addressHasError)}
            />
            {addressHasError && (
              <p id="address-error" role="alert" className="text-danger mt-1 text-xs">
                {formik.errors.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            // Sin cambios no hay nada que confirmar: el botón apagado lo dice
            // mejor que un diálogo que no haría nada.
            disabled={!formik.dirty || isSaving}
            className="bg-primary-solid hover:bg-primary-solid-hover cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guardar cambios
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Guardar los cambios?"
        description="Vamos a actualizar tus datos personales con lo que completaste."
        confirmLabel="Sí, guardar"
        cancelLabel="Volver"
        isPending={isSaving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
