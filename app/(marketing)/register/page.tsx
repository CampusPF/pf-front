import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RegisterCard } from '@/components/RegisterForm/RegisterCard';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';

export const metadata: Metadata = {
  title: 'Crear cuenta — Campus',
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RedirectIfAuthenticated>
        <RegisterCard />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}