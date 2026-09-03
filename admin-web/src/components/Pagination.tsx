'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export type PageState = { page: number; pageSize: number; total: number };

/**
 * Every admin list is paged server-side (default 10 rows/page) so the
 * browser never has to fetch or hold a table the size of the whole student
 * body at once.
 */
export function Pagination({
  state,
  onPageChange,
}: {
  state: PageState;
  onPageChange: (page: number) => void;
}) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
  const from = state.total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const to = Math.min(state.page * state.pageSize, state.total);

  const start = Math.max(1, state.page - 2);
  const end = Math.min(totalPages, start + 4);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="pagination">
      <span>
        {from}-{to} {t('common.of')} {state.total}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          disabled={state.page <= 1}
          onClick={() => onPageChange(state.page - 1)}
        >
          <ChevronLeft />
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            className="page-btn"
            data-current={p === state.page}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          disabled={state.page >= totalPages}
          onClick={() => onPageChange(state.page + 1)}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
