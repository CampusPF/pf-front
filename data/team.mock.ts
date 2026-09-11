/* TODO(campus): data ficticia del equipo, sólo para maquetar "Sobre nosotros".
   Los avatares usan DiceBear (ilustraciones generadas, no fotos reales de
   personas) para no depender de fotos de stock ni de gente real. */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarSeed: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Martina Ríos",
    role: "Fundadora & CEO",
    bio: "Ex-instructora de bootcamp. Empezó Campus después de ver a demasiados estudiantes abandonar por falta de acompañamiento.",
    avatarSeed: "martina-rios-campus",
  },
  {
    id: "2",
    name: "IñakiDuarte",
    role: "Co-fundador & CTO",
    bio: "Diseñó la arquitectura del Tutor IA. Antes lideraba equipos de backend en fintech.",
    avatarSeed: "inaki-duarte-campus",
  },
  {
    id: "3",
    name: "Bruno Salas",
    role: "Head of Content",
    bio: "Coordina a los Masters que crean los cursos y revisa que cada lección tenga un proyecto real detrás.",
    avatarSeed: "bruno-salas-campus",
  },
  {
    id: "4",
    name: "Renata Ibáñez",
    role: "Head of Product",
    bio: "Se obsesiona con reducir la fricción entre 'quiero aprender X' y la primera lección.",
    avatarSeed: "renata-ibanez-campus",
  },
];
