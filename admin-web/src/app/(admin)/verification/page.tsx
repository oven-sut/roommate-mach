'use client';

import { UserTable } from '@/components/UserTable';

export default function VerificationPage() {
  return (
    <section className="page">
      <UserTable mode="unverified" />
    </section>
  );
}
