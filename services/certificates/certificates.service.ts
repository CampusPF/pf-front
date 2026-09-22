import { apiFetch } from "@/services/api-client";

/* Certificados: emisión, listado propio y verificación pública.

   La verificación (`verifyCertificate`) es el único endpoint de este archivo
   que NO lleva `auth: true` — es a donde apunta el QR impreso en el PDF, y
   tiene que poder abrirse sin sesión, incluso desde el server (ver
   app/certificados/verificar/[code]/page.tsx). */

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  code: string;
  pdfUrl: string;
  issuedAt: string;
  /** Sólo viene en GET /certificates/me (relations: { course: true }). */
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

/**
 * Duración del curso para el certificado, a partir de sus minutos REALES:
 * 45 → "45 min", 94 → "1 h y 34 min", 154 → "2 hs y 34 min", 120 → "2 hs".
 *
 * No reusa `formatDuration` de lib/course-utils (que escribe "2 h 34 min")
 * porque ese formato lo comparten el temario y las cards del catálogo, donde
 * conviene que sea corto. Acá tiene que leerse como una frase, y además
 * coincidir palabra por palabra con lo que imprime el PDF
 * (formatCourseDuration en pf-back), que muestra este mismo dato.
 */
export function formatCertificateDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  // "1 hs" quedaría mal, así que la unidad va en singular cuando es una sola.
  const hoursLabel = `${hours} ${hours === 1 ? "h" : "hs"}`;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return hoursLabel;
  return `${hoursLabel} y ${rest} min`;
}

/** Lo que devuelve GET /certificates/:code — sólo datos públicos. */
export interface CertificateVerification {
  valido: boolean;
  nombreAlumno?: string;
  curso?: string;
  /**
   * MINUTOS de contenido, sin redondear. Antes el back mandaba horas ya
   * redondeadas hacia arriba y dos cursos distintos (83 min y 115 min) decían
   * los dos "2 horas". El formato lo decide la UI, con `formatDuration`.
   */
  minutos?: number;
  fechaEmision?: string;
}

/**
 * `POST /courses/:courseId/certificate` — emite mi certificado de un curso
 * que ya completé al 100%.
 *
 * Puede fallar con 400 (curso incompleto), 404 (no inscripto) o 409 (ya
 * tengo certificado de ese curso); el mensaje ya viene listo para mostrar
 * (ver `extractMessage` en api-client).
 */
export function issueCertificate(courseId: string): Promise<Certificate> {
  return apiFetch<Certificate>(
    `/courses/${encodeURIComponent(courseId)}/certificate`,
    { method: "POST", auth: true },
  );
}

/** `GET /certificates/me` — todos mis certificados, del más nuevo al más viejo. */
export function getMyCertificates(signal?: AbortSignal): Promise<Certificate[]> {
  return apiFetch<Certificate[]>("/certificates/me", { auth: true, signal });
}

/** Ruta pública a la que apunta el QR del PDF: la misma que se comparte. */
export function certificateVerificationPath(code: string): string {
  return `/certificados/verificar/${encodeURIComponent(code)}`;
}

/**
 * URL del PDF que fuerza la descarga en vez de abrirlo en el visor.
 *
 * El atributo `download` de un <a> se ignora en un link a otro dominio
 * (Cloudinary), así que se usa el flag `fl_attachment` de sus URLs de
 * entrega. Con `code`, el flag lleva el nombre del archivo
 * (`fl_attachment:Certificado-CMP-XXXX`); sin él Cloudinary lo baja como
 * `file.pdf`. Una URL que no sea de Cloudinary se devuelve tal cual.
 */
export function certificateDownloadUrl(pdfUrl: string, code?: string): string {
  try {
    const url = new URL(pdfUrl);
    if (url.hostname !== "res.cloudinary.com") return pdfUrl;
    if (url.pathname.includes("/fl_attachment")) return pdfUrl;

    // Cloudinary agrega la extensión sola: el nombre va sin ".pdf".
    const flag = code
      ? `fl_attachment:${encodeURIComponent(`Certificado-${code}`)}`
      : "fl_attachment";
    url.pathname = url.pathname.replace("/upload/", `/upload/${flag}/`);
    return url.toString();
  } catch {
    return pdfUrl;
  }
}

/**
 * `GET /certificates/:code` — verificación pública, sin sesión.
 *
 * Un código inválido NO tira: el back responde 200 con `{ valido: false }`
 * (ver CertificatesService.verify en pf-back). Esta función nunca lanza por
 * un código inexistente; sólo por un problema de red/servidor.
 */
export function verifyCertificate(
  code: string,
  signal?: AbortSignal,
): Promise<CertificateVerification> {
  return apiFetch<CertificateVerification>(
    `/certificates/${encodeURIComponent(code)}`,
    { signal },
  );
}
