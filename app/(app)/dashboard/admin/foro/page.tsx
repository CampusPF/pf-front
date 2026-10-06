import RequireRole from "@/components/auth/RequireRole";
import ForumCategoriesAdmin from "@/components/admin/ForumCategoriesAdmin";

export default function AdminForumPage() {
  return (
    <RequireRole roles={["admin"]} nested>
      <ForumCategoriesAdmin />
    </RequireRole>
  );
}
