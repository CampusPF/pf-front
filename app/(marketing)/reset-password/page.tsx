import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ResetPasswordCard } from '@/components/auth/ResetPasswordCard';

export const metadata: Metadata = {
  title: 'Nueva contraseña — Campus',
  description: 'Elegí una nueva contraseña para tu cuenta de Campus.',
};

/* Destino del link que llega por mail (/reset-password?token=...).
   El <Suspense> es obligatorio: ResetPasswordCard usa useSearchParams().

   Sin RedirectIfAuthenticated a propósito — ver el comentario del componente:
   alguien con una sesión vieja abierta tiene que poder completar el cambio. */
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordCard />
    </Suspense>
  );
}
