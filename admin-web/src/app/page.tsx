'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RootPage() {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(admin ? '/dashboard' : '/login');
  }, [loading, admin, router]);

  return null;
}
