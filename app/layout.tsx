import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import AiTutorProvider from "@/components/ai-tutor/AiTutorProvider";
import AiTutorFAB from "@/components/ai-tutor/AiTutorFAB";
import AiTutorDrawer from "@/components/ai-tutor/AiTutorDrawer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus — Aprendé con un tutor de IA a tu lado",
  description:
    "Cursos estructurados con proyectos del mundo real + un tutor inteligente que te acompaña 24/7.",
};

/* Corre antes del primer paint: sin esto la página pinta en light y salta a
   dark en cuanto hidrata. Sin preferencia guardada no toca nada y manda el
   @media (prefers-color-scheme) de globals.css. */
const themeScript = `(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t === "dark" || t === "light") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();`;

/* Root layout mínimo a propósito: solo html/body + providers globales.
   El chrome (Navbar/Footer vs. sidebar del dashboard) lo pone cada route
   group — (marketing) y (app) — con su propio layout.

   El tutor IA (FAB + drawer) vive acá, no en el reproductor de lecciones:
   tiene que poder abrirse desde cualquier pantalla. Dentro de una lección,
   LessonTutorContext le avisa al provider en qué lección está el usuario
   para personalizar el saludo; en el resto de la app queda genérico. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-text flex min-h-full flex-col">
        <AuthProvider>
          <AiTutorProvider>
            {children}
            <AiTutorFAB />
            <AiTutorDrawer />
          </AiTutorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
