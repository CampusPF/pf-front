import type { LucideIcon } from "lucide-react";

/* Lugar de un link cuya pantalla todavía no existe. Se ve igual que un item
   de navegación pero no navega: evita mandar al usuario a un 404 o a un "#".

   No es un <a> sin href ni un <Link href="#">: `aria-disabled` + el badge
   "Pronto" le dicen a quien usa lector de pantalla que existe pero no está
   disponible, y sigue siendo enfocable para que se entienda qué es.

   Cuando la ruta exista, se cambia por el <Link> normal. */

export default function ComingSoonLink({
  label,
  icon: Icon,
  className = "",
  iconClassName = "size-5",
}: {
  label: string;
  icon?: LucideIcon;
  /** Clases de layout del item (padding, gap, tamaño de texto). */
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      role="link"
      aria-disabled="true"
      tabIndex={0}
      title="Próximamente"
      className={`text-text-muted flex cursor-not-allowed items-center gap-3 opacity-70 ${className}`}
    >
      {Icon && <Icon className={iconClassName} aria-hidden />}
      <span className="truncate">{label}</span>
      <span className="bg-surface-elevated text-text-muted ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
        Pronto
        <span className="sr-only"> (todavía no disponible)</span>
      </span>
    </span>
  );
}
