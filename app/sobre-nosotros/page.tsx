import type { Metadata } from "next";
import { Target, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { TEAM_MEMBERS } from "@/data/team.mock";

export const metadata: Metadata = {
  title: "Sobre nosotros — Campus",
  description: "La historia y el equipo detrás de Campus.",
};

export default function SobreNosotrosPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-bg pt-16">
        <div className="mx-auto max-w-content px-4 py-16 md:px-6">
    
        {/* Encabezado */}
        <div className="mx-auto max-w-prose text-center">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-text md:text-4xl">
            Aprender no debería sentirse solitario
          </h1>
          <p className="text-lg leading-relaxed text-text-secondary">
            Campus nació de una frustración compartida: cursos grabados excelentes,
            pero ni una sola persona a quien preguntarle cuando algo no cierra.
            Armamos la plataforma que nos hubiera gustado tener cuando empezamos.
          </p>
        </div>

        {/* Misión / Valores */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <Target className="mb-4 h-8 w-8 text-primary" />
            <h2 className="mb-2 text-lg font-semibold text-text">Nuestra misión</h2>
            <p className="text-text-secondary">
              Cerrar la distancia entre &quot;contenido disponible&quot; y &quot;aprendizaje
              efectivo&quot;. Contenido estructurado, acompañamiento inteligente y
              motivación continua, en un solo lugar.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <Users className="mb-4 h-8 w-8 text-accent" />
            <h2 className="mb-2 text-lg font-semibold text-text">Cómo trabajamos</h2>
            <p className="text-text-secondary">
              Cada curso lo diseña un Master con experiencia real en la industria,
              y cada estudiante tiene un tutor de IA que conoce exactamente en qué
              lección está parado.
            </p>
          </div>
        </div>

        {/* Equipo */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-text">
            El equipo
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
                  alt=""
                  className="mb-4 h-20 w-20 rounded-full bg-primary-subtle"
                />
                <p className="font-semibold text-text">{member.name}</p>
                <p className="mb-2 text-sm font-medium text-primary">{member.role}</p>
                <p className="text-sm text-text-secondary">{member.bio}</p>
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
