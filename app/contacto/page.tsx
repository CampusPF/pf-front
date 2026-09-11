import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contacto — Campus",
  description: "Cómo ponerte en contacto con el equipo de Campus.",
};

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "hola@campus-demo.edu",
    hint: "Casilla de ejemplo, no monitoreada",
  },
  {
    icon: MessageCircle,
    label: "Tutor IA",
    value: "Chat en vivo dentro de la plataforma",
    hint: "Respuesta inmediata para dudas de cursos",
  },
  {
    icon: MapPin,
    label: "Oficina",
    value: "Córdoba, Argentina",
    hint: "Equipo 100% remoto",
  },
];

const SOCIAL_LINKS = [
  { icon: InstagramIcon, label: "Instagram", value: "@campus.edu", hint: "Cuenta oficial" },
  { icon: LinkedinIcon, label: "LinkedIn", value: "Campus", hint: "Página de la empresa" },
  { icon: YoutubeIcon, label: "YouTube", value: "Campus", hint: "Canal oficial" },
  { icon: XIcon, label: "X (Twitter)", value: "@campus_edu", hint: "Cuenta oficial" },
  { icon: DiscordIcon, label: "Discord", value: "Comunidad Campus", hint: "Servidor de estudiantes" },
];

/* Versiones recientes de lucide-react sacaron los logos de marcas
   (Instagram, LinkedIn, YouTube, etc.) por temas de trademark. Se arman acá
   como SVG simple para no depender de que existan en la versión instalada. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9Z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22 12c0-2.3-.2-3.7-.5-4.5-.3-.8-1-1.4-1.8-1.6C18 5.5 12 5.5 12 5.5s-6 0-7.7.4c-.8.2-1.5.8-1.8 1.6C2.2 8.3 2 9.7 2 12s.2 3.7.5 4.5c.3.8 1 1.4 1.8 1.6 1.7.4 7.7.4 7.7.4s6 0 7.7-.4c.8-.2 1.5-.8 1.8-1.6.3-.8.5-2.2.5-4.5Zm-12 3V9l5.2 3-5.2 3Z" />
    </svg>
  );
}

/* lucide-react no incluye X ni Discord por defecto en versiones viejas del
   paquete; se arman como SVG simple para no sumar otra dependencia sólo por
   dos íconos. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.9 2H22l-7.6 8.7L23 22h-7l-5.5-6.8L4.2 22H1l8.1-9.3L1 2h7.2l5 6.2L18.9 2Zm-1.2 18h1.7L6.4 4h-1.8l13.1 16Z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.6 3l-.3.6a13.6 13.6 0 0 1 4 1.6 15.8 15.8 0 0 0-15 0 13.6 13.6 0 0 1 4.1-1.6L8 3a19.8 19.8 0 0 0-4.7 1.4C1 8.3.4 12 .6 15.7a19.9 19.9 0 0 0 6 3l.8-1.2a12.9 12.9 0 0 1-1.9-.9l.5-.4a14.3 14.3 0 0 0 12 0l.5.4a13 13 0 0 1-1.9.9l.8 1.2a19.8 19.8 0 0 0 6-3c.3-4.3-.6-8-2.9-11.3ZM8.5 13.4c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Zm7 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8 1.6.8 1.6 1.8-.7 1.8-1.6 1.8Z" />
    </svg>
  );
}

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-bg pt-16">
        <div className="mx-auto max-w-prose px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-text md:text-4xl">
            Hablemos
          </h1>
          <p className="text-lg text-text-secondary">
            ¿Preguntas, sugerencias o encontraste un bug? Estos son los canales para
            llegar a nosotros.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          {CONTACT_CHANNELS.map((channel) => (
            <div
              key={channel.label}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                <channel.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-text-muted">{channel.label}</p>
                <p className="text-lg font-semibold text-text">{channel.value}</p>
                <p className="text-sm text-text-muted">{channel.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Redes sociales: mismo estilo de tarjeta que los canales de arriba,
            pero sin link — son solo informativas. */}
        <div className="mt-12">
          <h2 className="mb-4 text-center text-sm font-semibold text-text-muted">
            Seguinos en redes
          </h2>
          <div className="flex flex-col gap-4">
            {SOCIAL_LINKS.map((social) => (
              <div
                key={social.label}
                className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
                  <social.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-text-muted">{social.label}</p>
                  <p className="text-lg font-semibold text-text">{social.value}</p>
                  <p className="text-sm text-text-muted">{social.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
