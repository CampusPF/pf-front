import { Suspense } from 'react';

import { RegisterCard } from '@/components/RegisterForm/RegisterCard';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';

export default function RegisterPage() {
  return (
    <Suspense>
      <RedirectIfAuthenticated>
        <RegisterCard />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}