'use client';

import { useState } from 'react';
import { UserCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

export default function SettingPage() {
  const { t, lang } = useI18n();
  const { admin, updateAdmin } = useAuth();

  const [displayName, setDisplayName] = useState(admin?.displayName ?? '');
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);

  if (!admin) return null;

  const locale = lang === 'th' ? 'th-TH' : 'en-US';
  const since = new Date(admin.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updated = await api<{ displayName: string }>('/api/me', {
        method: 'PATCH',
        body: { displayName: displayName.trim() },
      });
      updateAdmin(updated);
      setProfileMsg({ text: t('profile.saveSuccess'), ok: true });
    } catch (err) {
      setProfileMsg({ text: err instanceof Error ? err.message : t('profile.saveFailed'), ok: false });
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: t('profile.passwordMismatch'), ok: false });
      return;
    }
    try {
      await api('/api/password', { method: 'PATCH', body: { currentPassword, password: newPassword } });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ text: t('profile.passwordSuccess'), ok: true });
    } catch (err) {
      setPasswordMsg({ text: err instanceof Error ? err.message : t('profile.passwordFailed'), ok: false });
    }
  }

  return (
    <section className="page">
      <div className="profile-grid">
        <div className="panel profile-card">
          <div className="profile-avatar">
            <UserCircle2 />
          </div>
          <div className="profile-name">{admin.displayName}</div>
          <div className="profile-email muted">{admin.email}</div>
          <span className="badge badge-verified profile-role">{admin.role}</span>
          <div className="profile-meta muted">
            {t('profile.adminSince')} {since}
          </div>
        </div>

        <div className="panel">
          <h3>{t('profile.info')}</h3>
          <form className="settings-form" onSubmit={handleProfileSubmit}>
            <label htmlFor="profileDisplayName">{t('profile.displayName')}</label>
            <input
              id="profileDisplayName"
              type="text"
              maxLength={60}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <div className={`form-msg ${profileMsg ? (profileMsg.ok ? 'success' : 'error') : ''}`}>
              {profileMsg?.text}
            </div>
            <button type="submit" className="login-btn form-btn">
              {t('profile.saveChanges')}
            </button>
          </form>
        </div>

        <div className="panel">
          <h3>{t('profile.changePassword')}</h3>
          <form className="settings-form" onSubmit={handlePasswordSubmit}>
            <label htmlFor="currentPassword">{t('profile.currentPassword')}</label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <label htmlFor="newPassword">{t('profile.newPassword')}</label>
            <input
              id="newPassword"
              type="password"
              minLength={8}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <label htmlFor="confirmPassword">{t('profile.confirmPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className={`form-msg ${passwordMsg ? (passwordMsg.ok ? 'success' : 'error') : ''}`}>
              {passwordMsg?.text}
            </div>
            <button type="submit" className="login-btn form-btn">
              {t('profile.changePasswordBtn')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
