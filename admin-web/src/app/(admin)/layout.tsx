'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { LogoutModal } from '@/components/LogoutModal';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    if (!loading && !admin) router.replace('/login');
  }, [loading, admin, router]);

  if (loading || !admin) {
    return <div className="auth-loading">{t('common.loading')}</div>;
  }

  function handleLogout() {
    setConfirmingLogout(false);
    logout();
    router.replace('/login');
  }

  return (
    <div className="app">
      <Sidebar onLogoutClick={() => setConfirmingLogout(true)} />
      <main className="content">
        <Topbar />
        {children}
      </main>
      <LogoutModal
        open={confirmingLogout}
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
