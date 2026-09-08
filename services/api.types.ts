/* Tipos del contrato de la API — cómo DEBERÍA responder el back.
   Lo que hoy difiere se adapta adentro de la capa de servicios; de acá para
   arriba (hooks, componentes) sólo existen estas formas. */

/** Envelope estándar del contrato: `{ data, message? }`. */
export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Listados paginados del contrato: `{ data: T[], meta }`. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Forma de error del contrato (y la que devuelve Nest por default). */
export interface ApiErrorBody {
  error?: string;
  message?: string | string[];
  statusCode?: number;
}
