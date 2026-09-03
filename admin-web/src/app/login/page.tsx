'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { admin, loading, login } = useAuth();
  const { t, lang, toggleLanguage } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState('admin@sut.ac.th');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && admin) router.replace('/dashboard');
  }, [loading, admin, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error && err.message === 'NOT_ADMIN' ? t('login.notAdmin') : t('login.invalid'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <button type="button" className="lang-switch lang-switch-login" onClick={toggleLanguage}>
        {lang === 'th' ? 'EN' : 'TH'}
      </button>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-icon-lg">
          <Home />
        </div>
        <h2>SUT Roommate Match</h2>
        <p className="muted">{t('login.subtitle')}</p>
        <label htmlFor="loginEmail">{t('login.email')}</label>
        <input
          id="loginEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="loginPassword">{t('login.password')}</label>
        <input
          id="loginPassword"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="login-error">{error}</div>
        <button type="submit" className="login-btn" disabled={submitting}>
          {t('login.submit')}
        </button>
      </form>
    </div>
  );
}
