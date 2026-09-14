"use client";

import { useState } from "react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";

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

  return (
    <div className="bg-bg min-h-screen">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* El contenido se corre el ancho del sidebar (16rem) sólo en lg+ */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <DashboardTopbar onMenuClick={() => setSidebarOpen(true)} />
        {/* pb-14 en mobile: aire para que el botón flotante del tutor no tape
            lo último de cada pantalla. */}
        <main className="flex-1 pb-14 sm:pb-0">{children}</main>
      </div>
    </div>
  );
}
