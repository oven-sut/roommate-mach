'use client';

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function LogoutModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal-card">
        <div className="modal-icon">
          <LogOut />
        </div>
        <h3>{t('logoutModal.title')}</h3>
        <p className="muted">{t('logoutModal.body')}</p>
        <div className="modal-actions">
          <button type="button" className="modal-btn modal-cancel" onClick={onCancel}>
            {t('logoutModal.cancel')}
          </button>
          <button type="button" className="modal-btn modal-confirm" onClick={onConfirm}>
            {t('logoutModal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
