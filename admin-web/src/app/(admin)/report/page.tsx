'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Mail, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDebouncedCallback } from '@/lib/useDebouncedCallback';
import { Pagination, type PageState } from '@/components/Pagination';
import type { PagedReports, Report, ReportSummary } from '@/lib/types';

const CARD_CLASSES = ['rcard-red', 'rcard-yellow', 'rcard-blue'] as const;
const CARD_SUB_KEYS = ['report.topReason', 'report.secondReason', 'report.thirdReason'] as const;

export default function ReportPage() {
  const { t, lang } = useI18n();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [items, setItems] = useState<Report[]>([]);
  const [state, setState] = useState<PageState>({ page: 1, pageSize: 10, total: 0 });
  const [query, setQuery] = useState('');

  const load = useCallback(async (page: number, q: string) => {
    const [sum, res] = await Promise.all([
      api<ReportSummary>('/api/admin/reports/summary'),
      api<PagedReports>(`/api/admin/reports?page=${page}&pageSize=10&q=${encodeURIComponent(q)}`),
    ]);
    setSummary(sum);
    setItems(res.items);
    setState({ page: res.page, pageSize: res.pageSize, total: res.total });
  }, []);

  useEffect(() => {
    // Fetching from the API on mount - the resulting setState happens
    // asynchronously inside `load`'s promise, not synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, '').catch(console.error);
  }, [load]);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    load(1, q).catch(console.error);
  }, 350);

  async function resolveReport(id: string, status: 'RESOLVED' | 'DISMISSED') {
    try {
      await api(`/api/admin/reports/${id}`, { method: 'PATCH', body: { status } });
      await load(state.page, query);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  const pendingPct = summary && summary.total ? Math.round((summary.pending / summary.total) * 100) : 0;
  const top3 = summary?.byReason.slice(0, 3) ?? [];
  const locale = lang === 'th' ? 'th-TH' : 'en-US';

  return (
    <section className="page">
      <div className="report-cards">
        {CARD_CLASSES.map((cls, idx) => {
          const entry = top3[idx];
          return (
            <div className={`rcard ${cls}`} key={cls}>
              <div className="rcard-title">{entry ? entry.reason : '—'}</div>
              <div className="rcard-sub">{t(CARD_SUB_KEYS[idx])}</div>
              <div className="rcard-bottom">
                <span>
                  {t('report.case')} <b>{entry ? entry.count : 0}</b>
                </span>
                <span className="rcard-arrow">
                  <ArrowUpRight />
                </span>
              </div>
            </div>
          );
        })}
        <div className="rcard-side">
          <div className="rcard-allcase">
            <span>
              <Mail /> <b>{summary?.total ?? 0}</b> {t('report.case')}
            </span>
            <small>{t('report.allCase')}</small>
          </div>
          <div className="rcard-todo">
            <div className="todo-pill">{t('report.toDo')}</div>
            <div className="todo-case">
              <b>{summary?.pending ?? 0}</b> {t('report.case')} {t('report.from')} <b>{summary?.total ?? 0}</b> {t('report.case')}
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${pendingPct}%` }} />
            </div>
            <div className="bar-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder={t('report.searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />
        <button type="button" className="filter-btn">
          <SlidersHorizontal />
        </button>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{t('table.id')}</th>
              <th>{t('table.name')}</th>
              <th>{t('table.tags')}</th>
              <th>{t('table.dateTime')}</th>
              <th>{t('table.cause')}</th>
              <th>{t('table.action')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  {t('common.noReports')}
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.reportedId.slice(0, 8)}</td>
                <td>{r.reported?.displayName || '-'}</td>
                <td>
                  <span className="tag tag-chat">{r.reason}</span>
                </td>
                <td>{new Date(r.createdAt).toLocaleString(locale)}</td>
                <td>{r.details || '-'}</td>
                <td>
                  {r.status === 'PENDING' ? (
                    <>
                      <button type="button" className="btn-view" onClick={() => resolveReport(r.id, 'RESOLVED')}>
                        {t('common.resolve')}
                      </button>{' '}
                      <button type="button" className="btn-view btn-reject" onClick={() => resolveReport(r.id, 'DISMISSED')}>
                        {t('common.dismiss')}
                      </button>
                    </>
                  ) : (
                    <span className={`badge ${r.status === 'RESOLVED' ? 'badge-verified' : 'badge-unverified'}`}>{r.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination state={state} onPageChange={(page) => load(page, query)} />
    </section>
  );
}
