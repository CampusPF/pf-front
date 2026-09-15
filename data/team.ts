/* Docentes que se muestran en "Sobre nosotros". Tienen que coincidir con los
   instructores reales de los cursos publicados: si cambia uno, actualizar acá. */

export interface Teacher {
  name: string;
  course: string;
  bio: string;
  /** Color del avatar con iniciales (sin fotos ni servicios externos). */
  avatarClass: string;
}

export const TEACHERS: Teacher[] = [
  {
    name: "Martín Aguirre",
    course: "Introducción a NestJS",
    bio: "Desarrollador backend. Enseña a construir APIs REST con NestJS, TypeORM y autenticación con JWT.",
    avatarClass: "bg-rose-600",
  },
  {
    name: "Lucía Ferreyra",
    course: "React Avanzado con TypeScript",
    bio: "Desarrolladora frontend. Enseña patrones de componentes, estado global, performance y testing en React.",
    avatarClass: "bg-sky-600",
  },
  {
    name: "Valentina Sosa",
    course: "Fundamentos de UX/UI",
    bio: "Diseñadora de producto. Enseña investigación de usuarios, diseño visual accesible y prototipado en Figma.",
    avatarClass: "bg-amber-600",
  },
  {
    name: "Sofía Méndez",
    course: "Inglés para el trabajo en tecnología",
    bio: "Profesora de inglés especializada en equipos de tecnología. Enseña a comunicarse con claridad en reuniones y por escrito.",
    avatarClass: "bg-violet-600",
  },
  {
    name: "Diego Castro",
    course: "Emprender un negocio digital",
    bio: "Emprendedor y consultor de negocios. Enseña a validar ideas, poner precio y conseguir los primeros clientes.",
    avatarClass: "bg-emerald-600",
  },
  {
    name: "Camila Torres",
    course: "Marketing digital y redes sociales",
    bio: "Especialista en marketing digital. Enseña estrategia de contenidos, publicidad paga y analítica.",
    avatarClass: "bg-pink-600",
  },
];
