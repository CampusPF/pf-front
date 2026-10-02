import { ApiError, apiFetch } from "@/services/api-client";
import { backendMessageOr } from "@/services/backend-message";

/* Dictado por voz: el audio se graba en el navegador (hooks/useVoiceRecorder)
   y lo transcribe pf-back con Whisper en Groq (POST /speech/transcriptions).
   El back no guarda el audio. El texto vuelve al campo para que el usuario
   lo revise: nunca se envía solo. */

let availability: Promise<boolean> | null = null;

/** ¿Está configurado el dictado en el back? Se pregunta una vez por pestaña:
    sin GROQ_API_KEY el micrófono no aparece en vez de fallar al usarlo. */
export function isSpeechAvailable(): Promise<boolean> {
  availability ??= apiFetch<{ available: boolean }>("/speech/status", { auth: true })
    .then((result) => Boolean(result.available))
    .catch(() => {
      // Un error de red no es "no disponible para siempre": que el próximo
      // componente que monte vuelva a preguntar.
      availability = null;
      return false;
    });
  return availability;
}

function fileNameFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "dictado.m4a";
  if (mimeType.includes("ogg")) return "dictado.ogg";
  return "dictado.webm";
}

/**
 * Manda el audio y devuelve el texto ("" si no se entendió nada).
 * `context` (título de la lección o del curso) le da a Whisper el
 * vocabulario: mejora mucho los términos técnicos.
 */
export async function transcribeAudio(audio: Blob, context?: string | null): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, fileNameFor(audio.type));
  const trimmedContext = context?.trim().slice(0, 200);
  if (trimmedContext) form.append("context", trimmedContext);

  try {
    const result = await apiFetch<{ text: string }>("/speech/transcriptions", {
      method: "POST",
      body: form,
      auth: true,
    });
    return result.text?.trim() ?? "";
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      throw new Error("Estás dictando muy seguido. Esperá un momento y probá de nuevo.");
    }
    if (error instanceof ApiError && error.isNetworkError) {
      throw new Error("No hay conexión. Revisá tu internet y probá de nuevo.");
    }
    throw new Error(backendMessageOr(error, "No pudimos pasar tu audio a texto. Probá de nuevo."));
  }
}
