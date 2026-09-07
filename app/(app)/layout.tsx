import DashboardShell from "@/components/dashboard/DashboardShell";

/* Chrome del área logueada (sidebar + topbar). Route group (app): no agrega
   segmento a la URL, así que /dashboard sigue siendo /dashboard. */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
