'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-primary">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-theme-primary mb-4">Pesquisou</h1>
        <p className="text-theme-secondary">Redirecionando...</p>
      </div>
    </div>
  );
}
