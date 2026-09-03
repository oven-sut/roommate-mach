'use client';

import { useI18n } from '@/lib/i18n';

export function DistList({ items }: { items: { name: string; value: number }[] }) {
  const { t } = useI18n();

  if (!items.length) {
    return (
      <ul className="dist-list">
        <li className="muted">{t('analytics.noData')}</li>
      </ul>
    );
  }

  const max = Math.max(...items.map((it) => it.value), 1);

  return (
    <ul className="dist-list">
      {items.map((it, idx) => (
        <li className="dist-row" key={it.name}>
          <div className="dist-row-top">
            <div className="dist-rank">{idx + 1}</div>
            <div className="dist-name">{it.name}</div>
            <div className="dist-val">{it.value}</div>
          </div>
          <div className="dist-track">
            <div className="dist-fill" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
