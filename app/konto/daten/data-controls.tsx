'use client';

import { useState } from 'react';
import { useT } from '@/components/i18n/locale-provider';

export function DataControls() {
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function requestAccountDeletion() {
    setBusy('delete');
    setMsg(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'account' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('dataControls.errGeneric'));
      setMsg(data.note ?? t('dataControls.deleteNote'));
      setConfirmDelete(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t('dataControls.errGeneric'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 max-w-[60ch]">
      <section className="grid gap-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{t('dataControls.exportTitle')}</h2>
        <p className="text-sm text-muted leading-relaxed">
          {t('dataControls.exportText')}
        </p>
        <a
          href="/api/account/export"
          className="inline-flex w-fit items-center gap-2 px-5 py-3 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
        >
          {t('dataControls.exportBtn')} <span className="font-mono">↓</span>
        </a>
      </section>

      <section className="grid gap-2 border-t border-bone-line pt-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{t('dataControls.deleteTitle')}</h2>
        <p className="text-sm text-muted leading-relaxed">
          {t('dataControls.deleteText')}
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex w-fit items-center gap-2 px-5 py-3 border border-red-300 text-red-600 rounded-full font-semibold hover:bg-red-50 transition"
          >
            {t('dataControls.deleteBtn')}
          </button>
        ) : (
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={requestAccountDeletion}
              disabled={busy === 'delete'}
              className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 disabled:opacity-50 transition"
            >
              {busy === 'delete' ? t('dataControls.deleting') : t('dataControls.deleteConfirm')}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="font-mono text-xs uppercase tracking-[0.1em] text-muted hover:text-ink"
            >
              {t('dataControls.cancel')}
            </button>
          </div>
        )}
      </section>

      {msg && <div className="text-sm font-mono text-gold-deep bg-bone border border-bone-line rounded-md p-3">{msg}</div>}
    </div>
  );
}
