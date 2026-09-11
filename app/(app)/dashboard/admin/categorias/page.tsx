import RequireRole from "@/components/auth/RequireRole";
import CategoriesManager from "@/components/admin/CategoriesManager";

export default function AdminCategoriesPage() {
  return (
    <RequireRole roles={["admin"]}>
      <CategoriesManager />
    </RequireRole>
  );
}
