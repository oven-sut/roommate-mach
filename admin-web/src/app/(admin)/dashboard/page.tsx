'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import '@/lib/chartSetup';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import type { DashboardStats } from '@/lib/types';

function Calendar() {
  const { lang } = useI18n();
  const locale = lang === 'th' ? 'th-TH' : 'en-US';
  const today = useMemo(() => new Date(), []);
  const title = today.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i - 3));
    return { active: i === 3, weekday: d.toLocaleDateString(locale, { weekday: 'short' }), date: d.getDate() };
  });

  return (
    <div className="calendar-card">
      <div className="cal-title">{title}</div>
      <div className="cal-row">
        <span className="cal-arrow">
          <ChevronLeft />
        </span>
        <div className="cal-days">
          {days.map((d, i) => (
            <div key={i} className={d.active ? 'cal-active' : ''}>
              <small>{d.weekday}</small>
              <b>{d.date}</b>
            </div>
          ))}
        </div>
        <span className="cal-arrow">
          <ChevronRight />
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api<DashboardStats>('/api/admin/dashboard').then(setStats).catch(console.error);
  }, []);

  const pendingPct = stats ? Math.min(100, (stats.pendingVerifications / Math.max(1, stats.members)) * 100) : 0;

  return (
    <section className="page">
      <div className="grid-top">
        <div className="stat-card stat-primary">
          <div className="stat-label">{t('dashboard.pending')}</div>
          <div className="stat-value">{stats?.pendingVerifications ?? '-'}</div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${pendingPct}%` }} />
          </div>
          <div className="bar-labels">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.activeMatches')}</div>
          <div className="stat-value dark">{stats?.matches ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.unmatched')}</div>
          <div className="stat-value dark">{stats?.unmatched ?? '-'}</div>
        </div>
        <Calendar />
      </div>

      <div className="grid-mid">
        <div className="panel">
          <h3>{t('dashboard.overview')}</h3>
          {stats && (
            <Bar
              height={140}
              data={{
                labels: ['Messages', 'Reports', 'Active Matches'],
                datasets: [
                  {
                    label: 'Count',
                    data: [stats.messages, stats.reports, stats.active],
                    backgroundColor: ['#bcd4f2', '#c0453a', '#8fc48a'],
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
            />
          )}
        </div>
        <div className="side-stack">
          <div className="users-card">
            <div className="users-count">
              <span>{stats?.members.toLocaleString() ?? '-'}</span> <small>{t('dashboard.users')}</small>
            </div>
          </div>
          <div className="users-icon-card">
            <Users />
          </div>
        </div>
      </div>

      <div className="grid-bottom">
        <div className="panel dark-panel">
          <h3>{t('dashboard.swipeMatchTalk')}</h3>
          {stats && (
            <Bar
              height={140}
              data={{
                labels: ['Swiped', 'Matched', 'Talking'],
                datasets: [{ data: [stats.swipes, stats.matches, stats.conversations], backgroundColor: '#bcd4f2' }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.2)' }, beginAtZero: true },
                  x: { ticks: { color: '#fff' }, grid: { display: false } },
                },
              }}
            />
          )}
        </div>
        <div className="panel">
          <h3>{t('dashboard.funnelTrend')}</h3>
          {stats && (
            <Line
              height={160}
              data={{
                labels: ['Members', 'Active', 'Matches', 'Messages'],
                datasets: [
                  {
                    data: [stats.members, stats.active, stats.matches, stats.messages],
                    borderColor: '#c0453a',
                    backgroundColor: 'rgba(192,69,58,0.2)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
