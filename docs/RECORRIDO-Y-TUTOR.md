# Recorrido «¿Cómo se usa?» y mejoras del Tutor IA

Implementa la propuesta «Campus — Recorrido guiado» (3 de noviembre de 2026).

## Recorrido guiado

- **Botón «¿Cómo se usa?»** en el Navbar, al lado de «Precios» (también en el
  menú de celular). En una página sin recorrido lleva al Inicio y arranca ahí.
- **Primera visita:** cada recorrido aparece solo la primera vez
  (`localStorage`: `campus.recorrido.inicio` / `campus.recorrido.cursos`);
  después, solo con el botón.
- **Estilo:** colores y tipografía del sitio, borde amarillo en la parte
  iluminada y el resto en penumbra. Es un diálogo modal: foco atrapado, ESC
  cierra, flechas ← → cambian de paso.
- **Celular:** si el menú o el panel de filtros están cerrados, el recorrido
  los abre antes de mostrar ese paso (evento `campus:recorrido-abrir`).

| Inicio | Frase |
| --- | --- |
| Barra de arriba | Desde acá vas a cursos, precios y cómo funciona. |
| Botón «Explorar cursos» | Empezá por acá para elegir qué aprender. |
| Panel del tutor | Escribís tu duda y el tutor te responde al momento. |
| Cursos destacados | Los cursos que más eligen otros alumnos. |
| Cómo funciona | Cuatro pasos: te registrás, elegís, aprendés y te certificás. |
| Precios | Podés empezar gratis y pasar a Premium cuando quieras. |
| Ventana flotante «Tutor IA» | El tutor también te acompaña dentro de cada lección. |

| Cursos | Frase |
| --- | --- |
| Filtro de categoría | Elegí el tema que te interesa. |
| Filtro de precio | Mostrá solo los cursos gratis o los Premium. |
| Filtro de valoración | Quedate con los mejor puntuados. |
| Primera tarjeta | Tocá un curso para ver sus lecciones. |

Los pasos y las frases están en `lib/recorridos.ts`; cada uno apunta a un
elemento con `data-recorrido="…"`. Si el elemento no existe (por ejemplo, sin
categorías cargadas), el paso se saltea.

## Mejoras al Tutor IA

- **Entiende por voz:** ya estaba en `main` (micrófono en el composer del
  tutor, transcripción con Whisper). No se tocó.
- **Se adelanta en una búsqueda sin resultados:** en el catálogo, en vez de
  la grilla vacía, el tutor sugiere el curso más cercano (`lib/tutor-sugerencias.ts`):
  afloja primero el texto buscado y la valoración, después nivel y precio, y por
  último la categoría. Botones «Ver el curso» y «Quitar los filtros».
- **Se adelanta al retomar una lección:** si la última vez la dejó por la
  mitad, le muestra hasta qué sección (y minuto del video, si es un `<video>`
  propio) llegó, con «Ir a donde quedé» o «Empezar de nuevo»
  (`components/lesson-player/RetomarLeccion.tsx`, guardado por lección en
  `localStorage`). YouTube no deja leer el tiempo del iframe: ahí se retoma la
  lectura.

Probado con `NEXT_PUBLIC_COURSES_SOURCE=mock` en computadora y celular.
