/* Recorridos guiados «¿Cómo se usa?» (ver components/recorrido/RecorridoGuiado.tsx).

   Cada paso ilumina el primer elemento visible con `data-recorrido="<objetivo>"`.
   Si en celular ese elemento está escondido (menú cerrado, panel de filtros
   plegado, botón flotante oculto por el scroll), el paso dispara
   RECORRIDO_ABRIR_EVENT con `abrir` y el componente dueño lo muestra. Si
   igual no aparece (por ejemplo, no hay categorías cargadas), el paso se saltea. */

export const RECORRIDO_ABRIR_EVENT = "campus:recorrido-abrir";
export const RECORRIDO_INICIAR_EVENT = "campus:recorrido-iniciar";

export type QueAbrir = "menu" | "filtros" | "lanzador";

export interface PasoRecorrido {
  objetivo: string;
  titulo: string;
  frase: string;
  abrir?: QueAbrir;
}

export interface Recorrido {
  id: "inicio" | "cursos";
  ruta: string;
  pasos: PasoRecorrido[];
}

export const RECORRIDOS: Recorrido[] = [
  {
    id: "inicio",
    ruta: "/",
    pasos: [
      { objetivo: "barra", titulo: "Barra de arriba", frase: "Desde acá vas a cursos, precios y cómo funciona.", abrir: "menu" },
      { objetivo: "explorar", titulo: "Explorar cursos", frase: "Empezá por acá para elegir qué aprender." },
      { objetivo: "tutor-panel", titulo: "Tutor IA", frase: "Escribís tu duda y el tutor te responde al momento." },
      { objetivo: "destacados", titulo: "Cursos destacados", frase: "Los cursos que más eligen otros alumnos." },
      { objetivo: "como-funciona", titulo: "Cómo funciona", frase: "Cuatro pasos: te registrás, elegís, aprendés y te certificás." },
      { objetivo: "precios", titulo: "Precios", frase: "Podés empezar gratis y pasar a Premium cuando quieras." },
      { objetivo: "tutor-flotante", titulo: "Tutor IA flotante", frase: "El tutor también te acompaña dentro de cada lección.", abrir: "lanzador" },
    ],
  },
  {
    id: "cursos",
    ruta: "/courses",
    pasos: [
      { objetivo: "filtro-categoria", titulo: "Categoría", frase: "Elegí el tema que te interesa.", abrir: "filtros" },
      { objetivo: "filtro-precio", titulo: "Precio", frase: "Mostrá solo los cursos gratis o los Premium.", abrir: "filtros" },
      { objetivo: "filtro-valoracion", titulo: "Valoración", frase: "Quedate con los mejor puntuados.", abrir: "filtros" },
      { objetivo: "primer-curso", titulo: "Un curso", frase: "Tocá un curso para ver sus lecciones." },
    ],
  },
];

export function recorridoDeRuta(pathname: string): Recorrido | null {
  return RECORRIDOS.find((r) => r.ruta === pathname) ?? null;
}

/* Cada recorrido aparece solo la primera vez; después, solo con el botón.
   localStorage puede fallar (modo privado, bloqueado): ante la duda, se toma
   como visto para no mostrarlo en cada visita. */
const clave = (id: Recorrido["id"]) => `campus.recorrido.${id}`;

export function yaVisto(id: Recorrido["id"]): boolean {
  try {
    return window.localStorage.getItem(clave(id)) === "visto";
  } catch {
    return true;
  }
}

export function marcarVisto(id: Recorrido["id"]): void {
  try {
    window.localStorage.setItem(clave(id), "visto");
  } catch {
    // sin almacenamiento: no pasa nada, sólo se volvería a mostrar
  }
}

/** Pide abrir un recorrido. Si la página actual no tiene, el botón lleva al Inicio y arranca ahí. */
export function iniciarRecorrido(): void {
  window.dispatchEvent(new Event(RECORRIDO_INICIAR_EVENT));
}
