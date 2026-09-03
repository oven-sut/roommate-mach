'use client';

import { UserTable } from '@/components/UserTable';

export default function UsersPage() {
  return (
    <section className="page">
      <UserTable mode="all" />
    </section>
  );
}
