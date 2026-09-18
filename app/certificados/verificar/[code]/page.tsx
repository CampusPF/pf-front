import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, Clock, ShieldAlert, ShieldX } from "lucide-react";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ApiError } from "@/services/api-client";
import {
  verifyCertificate,
  type CertificateVerification,
} from "@/services/certificates/certificates.service";

interface VerificarCertificadoPageProps {
  params: Promise<{ code: string }>;
}

/* Página PÚBLICA: es a donde apunta el QR impreso en el PDF del certificado.
   Vive fuera de todo route group (como app/blog/[slug]) y trae su propio
   Navbar/Footer — no hereda el chrome de (marketing) ni pasa por RequireAuth.

   Server Component: se resuelve en el server, sin flash de loading — importa
   para alguien que la abre desde el celular escaneando el QR.

   `verifyCertificate` no lleva `auth: true`, así que `apiFetch` es seguro de
   llamar acá (getToken()/trackBackendWait ya hacen guard de
   `typeof window === "undefined"`). */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: VerificarCertificadoPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Verificar certificado ${code} — Campus`,
    description: "Verificá la autenticidad de un certificado emitido por Campus.",
  };
}

type LoadResult =
  | { status: "ok"; data: CertificateVerification }
  | { status: "network-error" };

async function safeVerify(code: string): Promise<LoadResult> {
  try {
    return { status: "ok", data: await verifyCertificate(code) };
  } catch (error) {
    // Un código inválido NO tira (el back responde 200 { valido: false }):
    // esto sólo captura caídas de red o del servidor.
    if (error instanceof ApiError) return { status: "network-error" };
    throw error;
  }
}

export default async function VerificarCertificadoPage({
  params,
}: VerificarCertificadoPageProps) {
  const { code } = await params;
  const result = await safeVerify(code);

  return (
    <>
      <Navbar />
      <main className="bg-bg flex min-h-[80vh] items-center justify-center px-4 py-20">
        <div className="bg-surface border-border w-full max-w-md rounded-2xl border p-8 text-center shadow-sm">
          {result.status === "network-error" ? (
            <NetworkErrorState />
          ) : result.data.valido ? (
            <ValidCertificate data={result.data} code={code} />
          ) : (
            <InvalidCertificate code={code} />
          )}

          <Link
            href="/"
            className="text-primary mt-6 inline-block text-sm font-medium hover:underline"
          >
            Ir a Campus
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ValidCertificate({
  data,
  code,
}: {
  data: CertificateVerification;
  code: string;
}) {
  return (
    <>
      <span className="bg-success-subtle text-success mx-auto flex size-14 items-center justify-center rounded-full">
        <BadgeCheck className="size-7" aria-hidden />
      </span>
      <h1 className="text-text mt-4 text-xl font-bold">Certificado válido</h1>
      <p className="text-text-muted mt-1 text-sm">
        Este certificado fue emitido por Campus y es auténtico.
      </p>

      <dl className="border-border mt-6 space-y-3 border-t pt-6 text-left">
        <Row label="Alumno" value={data.nombreAlumno} />
        <Row label="Curso" value={data.curso} />
        <Row
          label="Duración"
          value={
            data.horas != null
              ? `${data.horas} ${data.horas === 1 ? "hora" : "horas"} de contenido`
              : undefined
          }
          icon={Clock}
        />
        <Row
          label="Emitido"
          value={
            data.fechaEmision
              ? new Date(data.fechaEmision).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : undefined
          }
          icon={Award}
        />
      </dl>

      <p className="text-text-muted mt-6 font-mono text-xs">Código: {code}</p>
    </>
  );
}

function InvalidCertificate({ code }: { code: string }) {
  return (
    <>
      <span className="bg-danger-subtle text-danger mx-auto flex size-14 items-center justify-center rounded-full">
        <ShieldX className="size-7" aria-hidden />
      </span>
      <h1 className="text-text mt-4 text-xl font-bold">Código no válido</h1>
      <p className="text-text-muted mt-1 text-sm">
        No encontramos ningún certificado con el código{" "}
        <span className="font-mono">{code}</span>. Revisá que esté completo y
        sin espacios.
      </p>
    </>
  );
}

function NetworkErrorState() {
  return (
    <>
      <span className="bg-warning-subtle text-warning mx-auto flex size-14 items-center justify-center rounded-full">
        <ShieldAlert className="size-7" aria-hidden />
      </span>
      <h1 className="text-text mt-4 text-xl font-bold">No pudimos verificar el certificado</h1>
      <p className="text-text-muted mt-1 text-sm">
        Hubo un problema para conectarnos con el servidor. Recargá la página
        en un momento.
      </p>
    </>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string;
  icon?: typeof Clock;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-text-muted flex items-center gap-1.5 text-sm">
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </dt>
      <dd className="text-text text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
