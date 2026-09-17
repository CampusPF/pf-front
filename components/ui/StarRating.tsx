import { Star } from "lucide-react";

/* Estrellas de sólo lectura, con relleno parcial (4.7 → la quinta estrella
   llena al 70%). Dos capas: la de fondo vacía y encima la llena recortada al
   porcentaje. Los lectores de pantalla leen el texto, no los íconos. */
export default function StarRating({
  value,
  className = "size-4",
}: {
  value: number;
  /** Tamaño de cada estrella. */
  className?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / 5) * 100));

  return (
    <span className="relative inline-flex shrink-0" role="img" aria-label={`${formatRating(value)} de 5 estrellas`}>
      <span className="text-border flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`${className} fill-current`} />
        ))}
      </span>
      <span
        className="text-warning absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden"
        style={{ width: `${percent}%` }}
        aria-hidden
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`${className} shrink-0 fill-current`} />
        ))}
      </span>
    </span>
  );
}

/** 4.7 → "4,7" · 4 → "4,0" (coma decimal, como el resto de la UI). */
export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** "1 reseña" · "12 reseñas". */
export function reviewsLabel(count: number): string {
  return `${count} ${count === 1 ? "reseña" : "reseñas"}`;
}
