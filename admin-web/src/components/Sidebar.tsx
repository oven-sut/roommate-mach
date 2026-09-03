'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  LineChart,
  Users,
  ShieldCheck,
  Flag,
  Settings,
  LogOut,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { href: '/analytics', icon: LineChart, key: 'nav.analytics' },
  { href: '/users', icon: Users, key: 'nav.users' },
  { href: '/verification', icon: ShieldCheck, key: 'nav.verification' },
  { href: '/report', icon: Flag, key: 'nav.report' },
  { href: '/setting', icon: Settings, key: 'nav.setting' },
] as const;

export function Sidebar({ onLogoutClick }: { onLogoutClick: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Home />
        </div>
        <div className="brand-text">
          SUT <span>Roommate Match</span>
        </div>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map(({ href, icon: Icon, key }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item${pathname === href ? ' active' : ''}`}
          >
            <span className="ic">
              <Icon />
            </span>
            <span>{t(key)}</span>
          </Link>
        ))}
      </nav>

      <button type="button" className="logout" onClick={onLogoutClick}>
        <LogOut />
        <span>{t('nav.logout')}</span>
      </button>
    </aside>
  );
}
