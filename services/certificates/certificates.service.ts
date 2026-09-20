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

/** Lo que devuelve GET /certificates/:code — sólo datos públicos. */
export interface CertificateVerification {
  valido: boolean;
  nombreAlumno?: string;
  curso?: string;
  horas?: number;
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
 * entrega. Una URL que no sea de Cloudinary se devuelve tal cual.
 */
export function certificateDownloadUrl(pdfUrl: string): string {
  try {
    const url = new URL(pdfUrl);
    if (url.hostname !== "res.cloudinary.com") return pdfUrl;
    if (url.pathname.includes("/fl_attachment")) return pdfUrl;

    url.pathname = url.pathname.replace("/upload/", "/upload/fl_attachment/");
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
