import type { ChangeEvent } from "react";
import type { FormikProps } from "formik";

/* Validación en tiempo real: Formik ya revalida en cada cambio, pero los
   formularios sólo muestran el error de un campo "tocado", y touched se
   marca recién en el blur. Este onChange marca el campo apenas se escribe,
   así el error aparece (y desaparece) mientras el usuario tipea. */
export function liveChange<Values>(formik: FormikProps<Values>) {
  return (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    formik.handleChange(event);
    // false: la validación ya la dispara handleChange con el valor nuevo.
    void formik.setFieldTouched(event.target.name, true, false);
  };
}
