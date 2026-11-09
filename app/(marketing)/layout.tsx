import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RecorridoGuiado from "@/components/recorrido/RecorridoGuiado";

/* Chrome público: la landing, el catálogo y los formularios de auth viven acá
   y comparten el Navbar fijo + Footer. Las URLs no cambian: (marketing) es un
   route group, no un segmento de ruta. */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      {/* «¿Cómo se usa?»: sólo Inicio y Cursos tienen recorrido (lib/recorridos.ts). */}
      <RecorridoGuiado />
    </>
  );
}
