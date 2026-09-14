import { revalidateCatalog } from "@/lib/revalidate-catalog";

/**
 * Espera una escritura del panel y, si salió bien, invalida la landing y el
 * catálogo para que el cambio se vea ya (ver lib/revalidate-catalog.ts).
 * Si la revalidación falla no se propaga: el dato ya se guardó en el back, y
 * en el peor caso la landing se actualiza sola a los 5 minutos.
 */
export async function withCatalogRevalidation<T>(request: Promise<T>): Promise<T> {
  const result = await request;
  await revalidateCatalog().catch(() => undefined);
  return result;
}
