"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";

const LABELS = ["Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

/* Selector de 1 a 5 estrellas hecho con radios nativos (ocultos visualmente):
   el teclado funciona gratis (flechas dentro del grupo, Tab entra y sale) y
   el lector de pantalla anuncia "Bueno, 4 de 5". El hover sólo previsualiza. */
export default function StarRatingInput({
  value,
  onChange,
  disabled = false,
  invalid = false,
}: {
  /** 0 = sin elegir. */
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const name = useId();
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Tu valoración"
        aria-invalid={invalid || undefined}
        className="flex"
        onMouseLeave={() => setHovered(0)}
      >
        {LABELS.map((label, index) => {
          const star = index + 1;
          const filled = star <= shown;

          return (
            <label
              key={star}
              onMouseEnter={() => !disabled && setHovered(star)}
              className={`rounded p-0.5 has-focus-visible:ring-primary/50 has-focus-visible:ring-2 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                disabled={disabled}
                className="sr-only"
                aria-label={`${label}, ${star} de 5`}
              />
              <Star
                className={`size-7 transition-colors duration-100 ${filled ? "text-warning fill-current" : "text-border"}`}
                aria-hidden
              />
            </label>
          );
        })}
      </div>
      <span className="text-text-muted min-w-20 text-sm" aria-hidden>
        {shown ? LABELS[shown - 1] : "Elegí de 1 a 5"}
      </span>
    </div>
  );
}
