import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginCard } from '@/components/LoginForm/LoginCard';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';

// Sin esto la pestaña mostraba el título genérico de la landing.
export const metadata: Metadata = {
  title: 'Iniciar sesión — Campus',
};

export default function LoginPage() {
  return (
    <Suspense>
      <RedirectIfAuthenticated>
        <LoginCard />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}