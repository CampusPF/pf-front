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

];
