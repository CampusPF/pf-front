"use client";

import { useState } from "react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import { useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";

/* App-shell del área logueada: sidebar fija en desktop / drawer en mobile +
   topbar sticky. Es client porque coordina el estado del drawer entre la
   hamburguesa (topbar) y el sidebar. El contenido de cada página entra como
   children. */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const collapsed = useSidebarCollapsed();

  return (
    <div className="bg-bg min-h-screen">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* El contenido se corre el ancho del sidebar sólo en lg+: 16rem
          expandido, 4rem colapsado (sólo íconos). */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ${
          collapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <DashboardTopbar onMenuClick={() => setSidebarOpen(true)} />
        {/* pb-14 en mobile: aire para que el botón flotante del tutor no tape
            lo último de cada pantalla. */}
        <main className="flex-1 pb-14 sm:pb-0">{children}</main>
      </div>
    </div>
  );
}
