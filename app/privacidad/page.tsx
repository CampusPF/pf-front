import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de privacidad — Campus",
  description: "Cómo Campus recopila, usa y protege tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <LegalPageLayout title="Política de privacidad" lastUpdated="9 de septiembre de 2026">
      <section>
        <h2>1. Qué datos recopilamos</h2>
        <p>Para poder ofrecerte el servicio, Campus recopila:</p>
        <ul>
          <li><strong>Datos de cuenta:</strong> nombre, email, y contraseña (encriptada, nunca almacenada en texto plano).</li>
          <li><strong>Datos de perfil opcionales:</strong> avatar, teléfono, dirección, ciudad y país.</li>
          <li><strong>Datos de uso:</strong> progreso en los cursos, racha de estudio, logros y estadísticas de aprendizaje.</li>
          <li><strong>Datos de pago:</strong> gestionados enteramente por nuestro procesador de pagos (Stripe). Campus nunca ve ni almacena el número completo de tu tarjeta.</li>
          <li><strong>Preferencias de la interfaz:</strong> como el tema claro/oscuro, guardado localmente en tu navegador.</li>
        </ul>
      </section>

      <section>
        <h2>2. Cómo usamos tus datos</h2>
        <p>Usamos tu información para:</p>
        <ul>
          <li>Darte acceso a tu cuenta y a los cursos correspondientes a tu plan.</li>
          <li>Personalizar las respuestas del Tutor IA según tu progreso y nivel.</li>
          <li>Enviarte notificaciones relevantes (bienvenida, recordatorios de inactividad, confirmaciones de pago).</li>
          <li>Mejorar la plataforma a partir de estadísticas de uso agregadas y anónimas.</li>
        </ul>
      </section>

      <section>
        <h2>3. Con quién compartimos tus datos</h2>
        <p>Campus no vende tus datos personales. Los compartimos únicamente con:</p>
        <ul>
          <li><strong>Stripe</strong>, para procesar los pagos de la suscripción Premium.</li>
          <li><strong>Google</strong>, si elegís iniciar sesión con tu cuenta de Google (autenticación OAuth).</li>
          <li><strong>Proveedores de infraestructura</strong> (hosting, base de datos, almacenamiento de archivos) necesarios para operar el servicio.</li>
        </ul>
      </section>

      <section>
        <h2>4. Cookies y almacenamiento local</h2>
        <p>
          Usamos almacenamiento local del navegador (localStorage) para mantener tu
          sesión iniciada y recordar tu preferencia de tema claro/oscuro. No usamos
          cookies de rastreo publicitario ni compartimos esta información con redes de
          publicidad de terceros.
        </p>
      </section>

      <section>
        <h2>5. Seguridad</h2>
        <p>
          Tu contraseña se almacena encriptada (hash) y nunca en texto plano. Las
          comunicaciones entre tu navegador y nuestros servidores viajan cifradas. El
          acceso a tu cuenta requiere tu contraseña o autenticación con Google.
        </p>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>Como usuario de Campus, podés en cualquier momento:</p>
        <ul>
          <li>Acceder y editar tus datos personales desde tu perfil.</li>
          <li>Solicitar la eliminación de tu cuenta y de los datos asociados.</li>
          <li>Cancelar tu suscripción Premium sin necesidad de justificar el motivo.</li>
          <li>Solicitar una copia de los datos que tenemos sobre vos.</li>
        </ul>
      </section>

      <section>
        <h2>7. Retención de datos</h2>
        <p>
          Conservamos tus datos mientras tu cuenta esté activa. Si solicitás la
          eliminación de tu cuenta, tus datos personales se eliminan de nuestros
          sistemas dentro de un plazo razonable, salvo la información que estemos
          obligados a conservar por motivos administrativos o de facturación.
        </p>
      </section>

      <section>
        <h2>8. Contacto</h2>
        <p>
          Para consultas sobre el manejo de tus datos, podés escribir a{" "}
          <span className="font-medium text-text">privacidad@campus-demo.edu</span>{" "}
          (casilla de ejemplo, no monitoreada).
        </p>
      </section>
    </LegalPageLayout>
  );
}
