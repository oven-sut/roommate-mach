'use client';

import { User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

export function Topbar() {
  const { lang, toggleLanguage } = useI18n();
  const { admin } = useAuth();

  return (
    <header className="topbar">
      <h1>{admin?.displayName || admin?.email || 'Admin'}</h1>
      <div className="topbar-right">
        <button type="button" className="lang-switch" onClick={toggleLanguage}>
          {lang === 'th' ? 'EN' : 'TH'}
        </button>
        <div className="avatar">
          <User />
        </div>
      </div>
    </header>
  );
}
