import RequireRole from "@/components/auth/RequireRole";
import CourseForm from "@/components/admin/CourseForm";

/* Crear un curso: sólo docentes. El admin no arma cursos (el back responde
   403); esto evita que llegue al formulario por un link directo. */
export default function NewCoursePage() {
  return (
    <RequireRole roles={["teacher"]}>
      <CourseForm />
    </RequireRole>
  );
}
