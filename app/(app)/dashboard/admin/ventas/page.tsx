import type { Metadata } from "next";

import SalesList from "@/components/admin/SalesList";

export const metadata: Metadata = {
  title: "Ventas — Campus",
  description: "Las ventas de tus cursos: quién compró, cuánto y cuándo.",
};

/* Cae bajo app/(app)/dashboard/admin/layout.tsx, así que ya viene con
   RequireAuth, el gate de rol (admin + teacher) y las pestañas del panel. */
export default function VentasPage() {
  return <SalesList />;
}
