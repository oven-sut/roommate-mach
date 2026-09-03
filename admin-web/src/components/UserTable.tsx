'use client';

import { useCallback, useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useDebouncedCallback } from '@/lib/useDebouncedCallback';
import type { AdminUser, PagedUsers } from '@/lib/types';
import { Pagination, type PageState } from './Pagination';

function facultyYear(u: AdminUser) {
  const major = u.profile?.major || '-';
  const year = u.profile?.year ? `year${u.profile.year}` : '-';
  return `${major}, ${year}`;
}

/**
 * Backs both the Users and Verification screens - they hit the same paged
 * endpoint, differing only in the `verified` filter and the action column.
 */
export function UserTable({
  mode,
  searchPlaceholderKey = 'common.searchStudent',
}: {
  mode: 'all' | 'unverified';
  searchPlaceholderKey?: string;
}) {
  const { t } = useI18n();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [state, setState] = useState<PageState>({ page: 1, pageSize: 10, total: 0 });
  const [query, setQuery] = useState('');

  const load = useCallback(
    async (page: number, q: string) => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(state.pageSize), q });
      if (mode === 'unverified') params.set('verified', 'false');
      const res = await api<PagedUsers>(`/api/admin/users?${params.toString()}`);
      setItems(res.items);
      setState({ page: res.page, pageSize: res.pageSize, total: res.total });
    },
    [mode, state.pageSize],
  );

  useEffect(() => {
    // Fetching from the API on mount/mode-change - the resulting setState
    // happens asynchronously inside `load`'s promise, not synchronously in
    // the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, '').catch(console.error);
  }, [mode, load]);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    load(1, q).catch(console.error);
  }, 350);

  async function toggleSuspend(id: string, suspended: boolean) {
    try {
      await api(`/api/admin/users/${id}/suspend`, { method: 'PATCH', body: { suspended } });
      await load(state.page, query);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function verifyUser(id: string, approve: boolean) {
    try {
      await api(`/api/admin/users/${id}/verify`, {
        method: 'PATCH',
        body: { status: approve ? 'VERIFIED' : 'REJECTED' },
      });
      await load(state.page, query);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <div className="search-bar">
        <input
          type="text"
          placeholder={t(searchPlaceholderKey)}
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
              <th>{t('table.verification')}</th>
              <th>{t('table.facultyYear')}</th>
              <th>{t('table.email')}</th>
              <th>{t('table.action')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  {mode === 'unverified' ? t('common.nothingPending') : t('common.noUsersFound')}
                </td>
              </tr>
            )}
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.sutId || u.id.slice(0, 8)}</td>
                <td>{u.displayName}</td>
                <td>
                  <span className={`badge ${u.verification?.status === 'VERIFIED' ? 'badge-verified' : 'badge-unverified'}`}>
                    {u.verification?.status || 'PENDING'}
                  </span>
                </td>
                <td>{facultyYear(u)}</td>
                <td>{u.email}</td>
                <td>
                  {mode === 'all' ? (
                    <button type="button" className="btn-view" onClick={() => toggleSuspend(u.id, !u.suspended)}>
                      {u.suspended ? t('common.unsuspend') : t('common.suspend')}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn-view" onClick={() => verifyUser(u.id, true)}>
                        {t('common.verify')}
                      </button>{' '}
                      <button type="button" className="btn-view btn-reject" onClick={() => verifyUser(u.id, false)}>
                        {t('common.reject')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination state={state} onPageChange={(page) => load(page, query)} />
    </>
  );
}
