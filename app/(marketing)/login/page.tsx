import { Suspense } from 'react';

import { LoginCard } from '@/components/LoginForm/LoginCard';
import RedirectIfAuthenticated from '@/components/auth/RedirectIfAuthenticated';

export default function LoginPage() {
  return (
    <Suspense>
      <RedirectIfAuthenticated>
        <LoginCard />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}