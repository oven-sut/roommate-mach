'use client';

import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Hand, HeartHandshake, MessageCircle, Percent, Filter, Sliders, GraduationCap, Building2 } from 'lucide-react';
import '@/lib/chartSetup';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { DistList } from '@/components/DistList';
import type { AnalyticsData } from '@/lib/types';

const LIFESTYLE_COLORS = ['#5b7fb5', '#f2d98d', '#8fc48a', '#c0453a'];

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    api<AnalyticsData>('/api/admin/analytics').then(setData).catch(console.error);
  }, []);

  const funnel = data?.swipeFunnel;
  const conversionRate = funnel && funnel.swiped ? Math.round((funnel.matched / funnel.swiped) * 100) : 0;

  const lifestyleLabels = ['Sleep & Wake', 'Guest', 'Cleanliness', 'Temp & Study'];
  const lifestyleValues = data
    ? [data.lifestyleWeights.sleep, data.lifestyleWeights.guests, data.lifestyleWeights.cleanliness, data.lifestyleWeights.temperature]
    : [0, 0, 0, 0];
  const lifestyleTotal = lifestyleValues.reduce((a, b) => a + b, 0) || 1;

  return (
    <section className="page">
      <div className="an-stats">
        <div className="an-stat">
          <div className="an-stat-icon an-stat-icon-yellow">
            <Hand />
          </div>
          <div>
            <div className="an-stat-value">{funnel?.swiped.toLocaleString() ?? '-'}</div>
            <div className="an-stat-label">{t('analytics.totalSwiped')}</div>
          </div>
        </div>
        <div className="an-stat">
          <div className="an-stat-icon an-stat-icon-blue">
            <HeartHandshake />
          </div>
          <div>
            <div className="an-stat-value">{funnel?.matched.toLocaleString() ?? '-'}</div>
            <div className="an-stat-label">{t('analytics.matched')}</div>
          </div>
        </div>
        <div className="an-stat">
          <div className="an-stat-icon an-stat-icon-green">
            <MessageCircle />
          </div>
          <div>
            <div className="an-stat-value">{funnel?.talking.toLocaleString() ?? '-'}</div>
            <div className="an-stat-label">{t('analytics.talking')}</div>
          </div>
        </div>
        <div className="an-stat">
          <div className="an-stat-icon an-stat-icon-red">
            <Percent />
          </div>
          <div>
            <div className="an-stat-value">{funnel ? `${conversionRate}%` : '-'}</div>
            <div className="an-stat-label">{t('analytics.conversionRate')}</div>
          </div>
        </div>
      </div>

      <div className="an-grid">
        <div className="panel">
          <h3>
            <Filter /> <span>{t('analytics.swipeFunnel')}</span>
          </h3>
          {funnel && (
            <Bar
              height={220}
              data={{
                labels: ['Swiped', 'Matched', 'Talking'],
                datasets: [
                  {
                    data: [funnel.swiped, funnel.matched, funnel.talking],
                    backgroundColor: ['#5b7fb5', '#f2d98d', '#8fc48a'],
                    borderRadius: 8,
                    maxBarThickness: 64,
                  },
                ],
              }}
              options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
            />
          )}
        </div>

        <div className="panel">
          <h3>
            <Sliders /> <span>{t('analytics.lifestyleWeights')}</span>
          </h3>
          <div className="lifestyle-flex">
            {data && (
              <Doughnut
                height={220}
                data={{
                  labels: lifestyleLabels,
                  datasets: [{ data: lifestyleValues, backgroundColor: LIFESTYLE_COLORS, borderWidth: 0 }],
                }}
                options={{ cutout: '68%', plugins: { legend: { display: false } } }}
              />
            )}
            <ul className="legend-list">
              {lifestyleLabels.map((label, idx) => (
                <li className="legend-row" key={label}>
                  <span className="legend-dot" style={{ background: LIFESTYLE_COLORS[idx] }} />
                  <span className="legend-label">{label}</span>
                  <span className="legend-value">{Math.round((lifestyleValues[idx] / lifestyleTotal) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel">
          <h3>
            <GraduationCap /> <span>{t('analytics.yearDistribution')}</span>
          </h3>
          <DistList items={(data?.yearDistribution ?? []).map((y) => ({ name: `Year ${y.year}`, value: y.count }))} />
        </div>
        <div className="panel">
          <h3>
            <Building2 /> <span>{t('analytics.facultyDistribution')}</span>
          </h3>
          <DistList
            items={(data?.facultyDistribution ?? []).slice(0, 6).map((f) => ({ name: f.major, value: f.count }))}
          />
        </div>
      </div>
    </section>
  );
}
