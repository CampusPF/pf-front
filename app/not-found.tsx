import type { Metadata } from "next";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import NotFoundContent from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: "Página no encontrada — Campus",
};

/* 404 de las URLs que no matchean ninguna ruta. Vive en la raíz, fuera de los
   route groups, así que no hereda el chrome de (marketing) y trae el suyo.
   Sin esto Next mostraba su pantalla en blanco con el texto en inglés.
   notFound() dentro de (marketing) usa app/(marketing)/not-found.tsx. */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <NotFoundContent />
      <Footer />
    </>
  );
}
