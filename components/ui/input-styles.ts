/* Estilo compartido de los inputs de formulario.

   El borde pasa a --color-danger cuando el campo tiene error, así el error no
   depende sólo del texto rojo de abajo (WCAG 1.4.1 — no usar el color como
   único medio para transmitir información).

   Vivía duplicado en LoginCard y RegisterCard; se extrajo al sumar los
   formularios de configuración para que las tres pantallas no se desincronicen. */
export function inputClass(hasError: boolean): string {
  return `w-full px-4 py-3 bg-surface border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
    hasError ? "border-danger" : "border-border"
  }`;
}
