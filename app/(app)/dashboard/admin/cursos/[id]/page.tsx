import RequireRole from "@/components/auth/RequireRole";
import CourseEditor from "@/components/admin/CourseEditor";

/* Editar un curso (datos, portada, temario, lecciones, adjuntos): sólo el
   docente que lo dicta. El admin no edita contenido; el back responde 403 a
   cualquier escritura suya, y la titularidad del docente también la valida
   el back. */
export default async function EditCoursePage(
  props: PageProps<"/dashboard/admin/cursos/[id]">,
) {
  const { id } = await props.params;
  return (
    <RequireRole roles={["teacher"]}>
      <CourseEditor courseId={id} />
    </RequireRole>
  );
}
