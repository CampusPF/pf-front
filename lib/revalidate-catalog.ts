"use server";

import { revalidatePath } from "next/cache";

/* Server Function que invalida las páginas que muestran el catálogo.

   La landing usa `revalidate = 300`: sin esto, renombrar un curso o cambiar
   su portada desde el panel tardaba hasta 5 minutos en verse ahí (el detalle
   y /courses son force-dynamic y ya se veían al instante). El panel la llama
   después de cada escritura exitosa de cursos, categorías o portadas (ver
   services/admin/admin.service.ts y entity-images.service.ts).

   No recibe parámetros ni toca datos: lo peor que puede hacer quien la
   invoque por su cuenta es forzar un re-render de la landing. */
export async function revalidateCatalog(): Promise<void> {
  revalidatePath("/");
  revalidatePath("/courses");
}
