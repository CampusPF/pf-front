import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ForgotPasswordCard } from '@/components/auth/ForgotPasswordCard';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';

export const metadata: Metadata = {
  title: 'Recuperar contraseña — Campus',
  description: 'Pedí un link para elegir una nueva contraseña de tu cuenta.',
};

/* Con sesión abierta no tiene sentido: el cambio de contraseña estando
   logueado vive en Configuración. Mismo criterio que /login y /register. */
export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <RedirectIfAuthenticated>
        <ForgotPasswordCard />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}
