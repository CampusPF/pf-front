import type { Metadata } from "next";

import CertificateView from "@/components/certificates/CertificateView";

export const metadata: Metadata = {
  title: "Tu certificado — Campus",
  description: "Vista previa, descarga y link de verificación de tu certificado.",
};

/* Cae bajo app/(app)/layout.tsx: ya viene con RequireAuth y el shell del
   dashboard. La verificación PÚBLICA (sin login) es otra ruta:
   app/certificados/verificar/[code]. */
export default async function CertificadoPage(
  props: PageProps<"/dashboard/certificados/[code]">,
) {
  const { code } = await props.params;
  return <CertificateView code={code} />;
}
