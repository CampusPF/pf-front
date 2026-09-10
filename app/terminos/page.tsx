import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Términos y condiciones — Campus",
  description: "Términos y condiciones de uso de la plataforma Campus.",
};

export default function TerminosPage() {
  return (
    <LegalPageLayout title="Términos y condiciones" lastUpdated="9 de septiembre de 2026">
      <section>
        <h2>1. Aceptación de los términos</h2>
        <p>
          Al crear una cuenta en Campus aceptás estos Términos y Condiciones en su
          totalidad. Si no estás de acuerdo con alguna parte, no deberías registrarte ni
          usar la plataforma. Campus es un proyecto desarrollado en el marco de un curso
          de formación en programación; este documento es contenido de demostración y no
          constituye un contrato legal real.
        </p>
      </section>

      <section>
        <h2>2. Descripción del servicio</h2>
        <p>
          Campus es una plataforma educativa que ofrece cursos de programación en
          formato de video y texto, acompañados por un tutor con inteligencia
          artificial. El catálogo incluye:
        </p>
        <ul>
          <li><strong>Cursos gratuitos</strong>, disponibles para cualquier usuario registrado.</li>
          <li>
            <strong>Cursos Premium</strong>, accesibles únicamente con una suscripción
            Campus Premium activa.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Cuentas de usuario</h2>
        <p>
          Para acceder a los cursos es necesario crear una cuenta con email y
          contraseña, o mediante autenticación con Google. Sos responsable de mantener
          la confidencialidad de tus credenciales y de toda actividad que ocurra bajo tu
          cuenta. Debés notificarnos de inmediato ante cualquier uso no autorizado.
        </p>
      </section>

      <section>
        <h2>4. Suscripción Campus Premium</h2>
        <p>
          La suscripción Premium se cobra de forma recurrente (mensual o anual, según el
          plan elegido) a través de nuestro procesador de pagos. El pago se procesa de
          forma segura y Campus no almacena los datos completos de tu tarjeta en ningún
          momento. Podés cancelar tu suscripción cuando quieras desde la configuración
          de tu cuenta; la cancelación tiene efecto al finalizar el período ya pagado.
        </p>
      </section>

      <section>
        <h2>5. Uso aceptable</h2>
        <p>Al usar Campus, te comprometés a no:</p>
        <ul>
          <li>Compartir tus credenciales de acceso con terceros.</li>
          <li>Redistribuir, revender o publicar el contenido de los cursos sin autorización.</li>
          <li>Utilizar el Tutor IA con fines ajenos al aprendizaje (spam, contenido dañino, etc.).</li>
          <li>Intentar vulnerar la seguridad de la plataforma o acceder a cuentas ajenas.</li>
        </ul>
      </section>

      <section>
        <h2>6. Propiedad intelectual</h2>
        <p>
          Todo el contenido de los cursos (videos, textos, ejercicios y material
          complementario) es propiedad de Campus o de los instructores (&quot;Masters&quot;)
          que lo publicaron. Tu suscripción o compra te otorga una licencia personal e
          intransferible para consumir ese contenido, no su propiedad.
        </p>
      </section>

      <section>
        <h2>7. Modificaciones del servicio</h2>
        <p>
          Campus puede modificar, agregar o discontinuar funcionalidades de la
          plataforma en cualquier momento. Cambios relevantes a estos términos se
          notificarán por email o dentro de la plataforma con razonable anticipación.
        </p>
      </section>

      <section>
        <h2>8. Limitación de responsabilidad</h2>
        <p>
          Campus se ofrece &quot;tal cual&quot;. No garantizamos que el servicio esté libre de
          interrupciones o errores. El Tutor IA es una herramienta de apoyo educativo y
          sus respuestas no reemplazan la evaluación de un instructor humano.
        </p>
      </section>

      <section>
        <h2>9. Contacto</h2>
        <p>
          Ante cualquier consulta sobre estos términos, podés escribirnos a{" "}
          <span className="font-medium text-text">soporte@campus-demo.edu</span>{" "}
          (casilla de ejemplo, no monitoreada).
        </p>
      </section>
    </LegalPageLayout>
  );
}
