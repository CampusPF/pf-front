import CourseEditor from "@/components/admin/CourseEditor";

export default async function EditCoursePage(
  props: PageProps<"/dashboard/admin/cursos/[id]">,
) {
  const { id } = await props.params;
  return <CourseEditor courseId={id} />;
}
