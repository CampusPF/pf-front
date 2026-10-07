import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import AiTutorProvider from "@/components/ai-tutor/AiTutorProvider";
import AiTutorDrawer from "@/components/ai-tutor/AiTutorDrawer";
import ChatCenterProvider from "@/components/chat/ChatCenterProvider";
import ChatPanel from "@/components/chat/ChatPanel";
import ChatToast from "@/components/chat/ChatToast";
import NotificationsCenterProvider from "@/components/notifications/NotificationsCenterProvider";
import FloatingLauncher from "@/components/launcher/FloatingLauncher";
import BackendWakeNotice from "@/components/ui/BackendWakeNotice";

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

   El tutor IA y el chat en vivo viven acá, no en una pantalla puntual:
   tienen que poder abrirse (y avisar de un mensaje nuevo) desde cualquier
   lado. Un único botón flotante (FloatingLauncher) da acceso a los dos.
   Dentro de una lección, LessonTutorContext le avisa al provider del tutor
   en qué lección está el usuario; en el resto de la app queda genérico. */
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
      {/* suppressHydrationWarning: extensiones del navegador (ColorZilla,
          Grammarly, etc.) le agregan atributos al <body> antes de hidratar.
          Sólo silencia los atributos de este elemento, no los de sus hijos. */}
      <body
        className="bg-bg text-text flex min-h-full flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <AiTutorProvider>
            <ChatCenterProvider>
              {/* Debajo de ChatCenterProvider: la campana necesita saber qué
                  conversación está abierta para no avisar de un mensaje que
                  ya estás leyendo. */}
              <NotificationsCenterProvider>
                {children}
                <FloatingLauncher />
                <AiTutorDrawer />
                <ChatPanel />
                <ChatToast />
                {/* Despierta el back (Render free) al abrir la web y avisa si tarda. */}
                <BackendWakeNotice />
              </NotificationsCenterProvider>
            </ChatCenterProvider>
          </AiTutorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
