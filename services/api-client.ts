import { getToken } from "@/services/auth/token-storage";

/* Cliente HTTP único del front. Todo lo que hable con el back pasa por acá:
   base URL, header de auth, desenvoltura del envelope y formato de error viven
   en un solo lugar. La URL sale de NEXT_PUBLIC_API_URL (ver .env.local).

   Este archivo es el que absorbe las diferencias entre el contrato y lo que el
   back devuelve hoy. Los componentes no saben nada de esto. */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Error de API con el status HTTP, para poder distinguir 401 de 500 en la UI. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }

  /** El back no respondió (caído, CORS, sin internet). */
  get isNetworkError() {
    return this.status === 0;
  }
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Query params; los `undefined` / `null` se descartan. */
  query?: QueryParams;
  /** Manda el Authorization: Bearer con el token guardado. */
  auth?: boolean;
  signal?: AbortSignal;
}

export function buildQueryString(query: QueryParams = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* TODO(back): el contrato define respuestas envueltas en `{ data, message? }`,
   pero el back hoy devuelve el objeto crudo. Desenvolvemos de forma tolerante
   para que el día que empiece a envolver no haya que tocar ni un componente.

   El cuidado está en no confundir un envelope con un payload que legítimamente
   tiene `data`: `PaginatedResponse<T>` es `{ data, meta }`. Por eso sólo
   desenvolvemos cuando las claves hermanas son de envelope — si hay `meta`,
   el objeto ES el payload y se devuelve entero. */
const ENVELOPE_SIBLING_KEYS = new Set([
  "message",
  "statusCode",
  "success",
  "timestamp",
  "path",
]);

function unwrapEnvelope(body: unknown): unknown {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;

  const record = body as Record<string, unknown>;
  if (!("data" in record)) return body;

  const isEnvelope = Object.keys(record).every(
    (key) => key === "data" || ENVELOPE_SIBLING_KEYS.has(key),
  );

  return isEnvelope ? record.data : body;
}

/* Igual de tolerante para el error: puede venir como `{ error, message,
   statusCode }` de Nest, como string pelado, o envuelto en `{ data }`.
   `message` además puede ser un array con los errores de class-validator. */
function extractMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  const message = record.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  if (Array.isArray(message) && message.length > 0) return message.join(". ");

  const error = record.error;
  if (typeof error === "string" && error.trim()) return error.trim();

  if ("data" in record) return extractMessage(record.data);

  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, auth = false, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}${buildQueryString(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // fetch sólo rechaza por red/CORS: el back apagado cae acá, no en !response.ok.
    throw new ApiError(
      "No pudimos conectarnos con el servidor. Revisá que el back esté levantado.",
      0,
      error,
    );
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload) ?? `La petición falló (${response.status}).`,
      response.status,
      payload,
    );
  }

  return unwrapEnvelope(payload) as T;
}
