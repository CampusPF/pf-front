import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
   dark en cuanto hidrata el Navbar. Sin preferencia guardada no toca nada y
   manda el @media (prefers-color-scheme) de globals.css. */
const themeScript = `(function () {
  try {
    var t = localStorage.getItem("theme");
    if (t === "dark" || t === "light") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();`;

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
      <body className="bg-bg text-text flex min-h-full flex-col">{children}</body>
    </html>
  );
}
