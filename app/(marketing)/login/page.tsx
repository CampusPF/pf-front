import { Suspense } from 'react';

import { LoginCard } from '@/components/LoginForm/LoginCard';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}