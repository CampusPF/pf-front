import { getToken } from "@/services/auth/token-storage";

/* Cliente HTTP único del front. Todo lo que hable con el back pasa por acá:
   así la base URL, el header de auth y el formato de error viven en un solo
   lugar. La URL sale de NEXT_PUBLIC_API_URL (ver .env.local). */
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

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Manda el Authorization: Bearer con el token guardado. */
  auth?: boolean;
  signal?: AbortSignal;
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

/* Nest devuelve { statusCode, error, message } y `message` puede ser un array
   con los errores de class-validator. Sacamos algo mostrable de todo eso. */
function extractMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) return payload;

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message: unknown }).message;

    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(". ");
  }

  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
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

  return payload as T;
}
