/* TODO(campus): este layout no puede ocultar el Navbar/Footer del root layout —
   Next compone layouts, no los reemplaza. Para un player realmente inmersivo hay
   que partir las rutas en route groups: (marketing) con Navbar/Footer y (app)
   sin ellos. Mientras tanto, LessonHeader es `fixed h-16 z-50` y va después en el
   DOM que el Navbar, así que lo tapa; el Footer sigue quedando abajo de todo. */
export default function LearnLayout({
  children,
}: LayoutProps<"/courses/[slug]/learn">) {
  return <div className="bg-bg flex min-h-screen flex-col">{children}</div>;
}
