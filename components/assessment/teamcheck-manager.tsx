'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { useT, useLocale } from '@/components/i18n/locale-provider';

type Invitation = {
  id: string;
  token: string;
  invited_email: string | null;
  invitation_type: string;
  status: string;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
};

type Props = {
  assessmentId: string;
  initialInvitations: Invitation[];
  appUrl: string;
};

const MIN_PLAYERS = 5;

export function TeamcheckManager({ assessmentId, initialInvitations, appUrl }: Props) {
  const t = useT();
  const locale = useLocale();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-AT');

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: t('teamcheck.statusPending'), color: 'bg-bone-line text-ink' },
    sent: { label: t('teamcheck.statusSent'), color: 'bg-petrol text-bone' },
    opened: { label: t('teamcheck.statusOpened'), color: 'bg-gold-light text-ink' },
    completed: { label: t('teamcheck.statusCompleted'), color: 'bg-gold text-ink' },
    expired: { label: t('teamcheck.statusExpired'), color: 'bg-muted text-bone' },
  };

  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [tokenCount, setTokenCount] = useState(15);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const completedCount = invitations.filter((i) => i.status === 'completed').length;
  const activeCount = invitations.filter((i) => ['pending', 'sent', 'opened'].includes(i.status)).length;
  const progressPct = Math.min(100, Math.round((completedCount / MIN_PLAYERS) * 100));

  async function bulkCreate() {
    setCreating(true);
    setError(null);
    setBulkSuccess(null);
    try {
      const res = await fetch('/api/invitations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          mode: 'tokens',
          count: tokenCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('teamcheck.errGeneric'));

      setInvitations([...(data.invitations ?? []), ...invitations]);
      setBulkSuccess(t('teamcheck.tokensCreated').replace('{n}', String(data.count)).replace('{s}', data.count === 1 ? '' : 's'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('teamcheck.errGeneric'));
    } finally {
      setCreating(false);
      setTimeout(() => setBulkSuccess(null), 4000);
    }
  }

  function copyLink(inv: Invitation) {
    const url = `${appUrl}/teamcheck/${inv.token}`;
    copyToClipboard(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function copyAllLinks() {
    const lines = invitations
      .filter((i) => i.status !== 'completed' && i.status !== 'expired')
      .map((i, idx) =>
        t('teamcheck.copyAllLine')
          .replace('{n}', String(idx + 1).padStart(2, '0'))
          .replace('{url}', `${appUrl}/teamcheck/${i.token}`)
      )
      .join('\n');
    copyToClipboard(lines);
    setBulkSuccess(t('teamcheck.allCopied'));
    setTimeout(() => setBulkSuccess(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-bone-soft p-6 rounded-md border border-bone-line">
        <div className="flex justify-between items-baseline mb-3">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            {t('teamcheck.responses')}
          </span>
          <div className="flex gap-6 items-baseline">
            <span className="text-sm text-muted">{t('teamcheck.linksActive').replace('{n}', String(activeCount))}</span>
            <span className="font-display text-2xl tracking-[-0.02em]">
              {completedCount}<span className="text-muted text-base"> / {MIN_PLAYERS}{t('teamcheck.requiredSuffix')}</span>
            </span>
          </div>
        </div>
        <div className="h-1 bg-bone-line rounded overflow-hidden">
          <div
            className="h-full bg-gold transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.1em] text-muted mt-3">
          {completedCount >= MIN_PLAYERS
            ? t('teamcheck.canGenerate')
            : t('teamcheck.remaining').replace('{n}', String(MIN_PLAYERS - completedCount))}
        </div>
      </div>

      {/* Token generator (anonymous-only) */}
      <div className="bg-ink text-bone p-6 rounded-md">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-gold mb-3">
          {t('teamcheck.genKicker')}
        </div>
        <h3 className="font-display text-xl tracking-[-0.02em] mb-2">
          {t('teamcheck.genH3')}
        </h3>
        <p className="text-bone-soft text-sm mb-4 leading-[1.5] max-w-[60ch]">
          {t('teamcheck.genDesc1')} <strong className="text-gold">{t('teamcheck.genDescEmph')}</strong> {t('teamcheck.genDesc2')}
        </p>

        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            max={50}
            value={tokenCount}
            onChange={(e) =>
              setTokenCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))
            }
            className="w-24 px-4 py-3 bg-ink-soft border border-ink-line rounded-md text-bone text-center font-display text-2xl focus:border-gold focus:outline-none"
          />
          <span className="text-bone-soft">{t('teamcheck.generateN')}</span>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={bulkCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink rounded-full font-semibold hover:bg-bone disabled:opacity-50 transition"
          >
            {creating ? t('teamcheck.creating') : t('teamcheck.createLinks')} <span className="font-mono">→</span>
          </button>
        </div>

        {error && <div className="text-red-400 text-sm font-mono mt-3">{error}</div>}
        {bulkSuccess && <div className="text-gold text-sm font-mono mt-3">✓ {bulkSuccess}</div>}
      </div>

      {/* Invitations list */}
      {invitations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {t('teamcheck.playerTokens')} ({invitations.length})
            </div>
            <button
              onClick={copyAllLinks}
              className="font-mono text-[0.65rem] uppercase tracking-[0.12em] px-3 py-1.5 bg-ink text-bone rounded-full hover:bg-gold hover:text-ink transition"
            >
              {t('teamcheck.copyAll')}
            </button>
          </div>

          <div className="space-y-2">
            {invitations.map((inv, idx) => {
              const status = STATUS_LABELS[inv.status] ?? STATUS_LABELS.pending;
              const isCopied = copiedId === inv.id;
              return (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center gap-4 p-4 bg-bone border border-bone-line rounded-md"
                >
                  <span
                    className={`font-mono text-[0.65rem] uppercase tracking-[0.14em] px-3 py-1 rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                  <div className="flex-grow min-w-0">
                    <div className="font-medium text-sm truncate">
                      {t('teamcheck.tokenRow').replace('{n}', String(idx + 1).padStart(2, '0'))}
                    </div>
                    <div className="font-mono text-xs text-muted mt-0.5 truncate">
                      {inv.completed_at
                        ? t('teamcheck.receivedShort').replace('{date}', fmtDate(inv.completed_at))
                        : t('teamcheck.tokenTail').replace('{tail}', inv.token.slice(-8))}
                    </div>
                  </div>
                  {inv.status !== 'completed' && (
                    <button
                      onClick={() => copyLink(inv)}
                      className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-2 border border-ink rounded-full hover:bg-ink hover:text-bone transition"
                    >
                      {isCopied ? t('teamcheck.copied') : t('teamcheck.copyLink')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
