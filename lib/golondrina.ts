/* Golondrina dentro del tutor: acciones de un clic que el asistente de cada
   lección le pasa a Golondrina (el motor de avisos de TecnoRosario) para que
   se encargue: recordatorios, plan de estudio, avisos y resúmenes.

   PROTOTIPO: todo es simulado en el navegador. No hay endpoint en pf-back,
   no se conecta a ninguna cuenta real y no se manda nada. Cuando exista la
   integración real, lo único que cambia es `ejecutarAccion` (que hoy arma
   el resultado localmente) y `CANALES` (que hoy sólo se prenden/apagan). */

export type CanalId = "whatsapp" | "mail" | "calendario";

export interface Canal {
  id: CanalId;
  nombre: string;
  que: string;
}

export const CANALES: Canal[] = [
  { id: "whatsapp", nombre: "WhatsApp", que: "Avisos y resúmenes por mensaje" },
  { id: "calendario", nombre: "Calendario", que: "Bloques de estudio en tu agenda" },
  { id: "mail", nombre: "Mail", que: "Resumen semanal de tu avance" },
];

export type AccionId = "recordar" | "plan" | "docente" | "resumen";

export interface Accion {
  id: AccionId;
  titulo: string;
  bajada: string;
  /** Canal que necesita para funcionar. Si está apagado, se ofrece conectarlo. */
  canal: CanalId;
}

export const ACCIONES: Accion[] = [
  { id: "recordar", titulo: "Recordame repasar", bajada: "Te aviso mañana para no olvidarla", canal: "whatsapp" },
  { id: "plan", titulo: "Armá mi plan", bajada: "3 bloques cortos esta semana", canal: "calendario" },
  { id: "resumen", titulo: "Mandame el resumen", bajada: "Los puntos clave al celular", canal: "whatsapp" },
  { id: "docente", titulo: "Avisame si responden", bajada: "Cuando el docente conteste", canal: "mail" },
];

export interface ResultadoAccion {
  accion: AccionId;
  /** Lo que Golondrina va a hacer, en una línea. */
  regla: string;
  /** Cuándo pasa. */
  cuando: string;
  /** Pasos o bloques concretos (el plan de estudio usa varios). */
  detalle: string[];
  /** Cómo le llega el aviso al alumno. */
  aviso: string;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Próximos días de estudio a partir de hoy, salteando el día actual. */
function proximosDias(desde: Date, cantidad: number, cadaCuantos: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(desde);
    fecha.setDate(desde.getDate() + 1 + i * cadaCuantos);
    const dia = DIAS[fecha.getDay()];
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  });
}

export function ejecutarAccion(id: AccionId, leccion: string, ahora: Date = new Date()): ResultadoAccion {
  switch (id) {
    case "recordar":
      return {
        accion: id,
        regla: `Recordarte repasar "${leccion}"`,
        cuando: "Mañana a las 19:00",
        detalle: ["Si ya la repasaste, el aviso no sale."],
        aviso: `⏰ Hoy toca repasar "${leccion}". Son 10 minutos, ¿arrancamos?`,
      };
    case "plan": {
      const dias = proximosDias(ahora, 3, 2);
      return {
        accion: id,
        regla: `Plan de estudio para "${leccion}"`,
        cuando: `${dias[0]}, ${dias[1]} y ${dias[2]}`,
        detalle: [
          `${dias[0]} 19:00 · 20 min · Releer la lección`,
          `${dias[1]} 19:00 · 20 min · Practicar con el tutor`,
          `${dias[2]} 19:00 · 15 min · Quiz rápido de repaso`,
        ],
        aviso: `📅 En 15 minutos tenés tu bloque de estudio: "${leccion}".`,
      };
    }
    case "resumen":
      return {
        accion: id,
        regla: `Mandarte el resumen de "${leccion}"`,
        cuando: "Ahora",
        detalle: ["Los puntos clave en 5 líneas, para leer en el celular."],
        aviso: `📝 Resumen de "${leccion}" listo. Tocá para leerlo.`,
      };
    case "docente":
      return {
        accion: id,
        regla: "Avisarte cuando el docente responda",
        cuando: "Apenas conteste",
        detalle: ["Vale para tus preguntas de esta lección en el chat y en los foros."],
        aviso: `💬 El docente respondió tu pregunta sobre "${leccion}".`,
      };
  }
}
