import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = {
  title: "Contacto — Campus",
  description: "Cómo ponerte en contacto con el equipo de Campus.",
};

/* Un solo canal real y atendido. Antes había una casilla de ejemplo "no
   monitoreada", una oficina y cinco redes marcadas como "cuenta oficial" que
   no existen — y esta página es justo a donde `AccountDisabledAlert` manda a
   quien tiene la cuenta dada de baja, o sea la única persona que no tiene otra
   forma de escribir. Un canal que funciona vale más que seis de adorno. */

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <div className="bg-bg min-h-screen pt-16">
        <div className="mx-auto max-w-prose px-4 py-16">
          <div className="text-center">
            <h1 className="text-text mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
              Hablemos
            </h1>
            <p className="text-text-secondary text-lg">
              ¿Preguntas, sugerencias o encontraste un bug? Escribinos y te
              respondemos.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-4">
            {/* El mail es un <a mailto:>: el canal de soporte tiene que poder
                usarse de un click, no copiarse a mano. */}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="border-border bg-surface hover:border-primary flex items-start gap-4 rounded-2xl border p-6 shadow-sm transition-colors duration-150"
            >
              <span className="bg-primary-subtle text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-text-muted text-sm font-medium">
                  Soporte y atención al cliente
                </p>
                <p className="text-text text-lg font-semibold break-all">
                  {SUPPORT_EMAIL}
                </p>
                <p className="text-text-muted text-sm">
                  Dudas de cuenta, pagos, suscripción o problemas con un curso.
                </p>
              </div>
            </a>

            <div className="border-border bg-surface flex items-start gap-4 rounded-2xl border p-6 shadow-sm">
              <span className="bg-primary-subtle text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-text-muted text-sm font-medium">Tutor IA</p>
                <p className="text-text text-lg font-semibold">
                  Dentro de cada lección
                </p>
                <p className="text-text-muted text-sm">
                  Para dudas del contenido que estás cursando, la respuesta es
                  inmediata y no hace falta escribirnos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
