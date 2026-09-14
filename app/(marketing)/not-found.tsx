import NotFoundContent from "@/components/layout/NotFoundContent";

/* notFound() dentro de (marketing) (ej. /courses/slug-inexistente). Se
   renderiza adentro del layout del grupo, que ya pone Navbar y Footer: si
   cayera en app/not-found.tsx salían duplicados. */
export default function MarketingNotFound() {
  return <NotFoundContent />;
}
