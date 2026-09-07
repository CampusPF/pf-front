import { Suspense } from 'react';

import { RegisterCard } from '@/components/RegisterForm/RegisterCard';

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterCard />
    </Suspense>
  );
}