'use client';

import type { RawAnswer } from '@/lib/scoring';

export type Item = {
  id: number;
  code: string;
  module_code: string;
  submodule: string | null;
  format: string;
  text_de: string;
  options: Array<{ key: string; text: string; weights: Record<string, number> }> | null;
  axis_weights: Record<string, number>;
  reverse_scored: boolean;
};

export type AnswerValue = {
  value_numeric?: number;
  value_choice?: string;
  value_position?: number;
};

type Props = {
  item: Item;
  currentValue?: AnswerValue;
  onAnswer: (value: AnswerValue) => void;
};

const MODULE_TITLES: Record<string, string> = {
  A: 'Führungsidentität',
  B: 'Kommunikationsarchitektur',
  C: 'Entscheidung & Priorität',
  D: 'Fehler- & Lernkultur',
  E: 'Führung unter Druck',
  F: 'Motivation & Aktivierung',
  G: 'Beziehung & Vertrauen',
};

const FORMAT_HINTS: Record<string, string> = {
  likert_5: 'Wie stark trifft das auf dich zu?',
  forced_choice: 'Wähle die Option, die eher zu dir passt.',
  spannungsfeld: 'Bewege den Regler zwischen den Polen.',
  szenario: 'Welche Reaktion ist am wahrscheinlichsten?',
  dilemma: 'Was wiegt für dich am stärksten?',
  gap_wichtig: 'Wie wichtig ist dir das?',
  gap_gelebt: 'Wie stark gelingt dir das aktuell?',
  state: 'Denke an die letzten 14 Tage.',
  ranking: 'Wähle deine wichtigste Priorität.',
};

export function ItemRenderer({ item, currentValue, onAnswer }: Props) {
  const moduleLabel = MODULE_TITLES[item.module_code] ?? item.module_code;
  const formatHint = FORMAT_HINTS[item.format] ?? '';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-ink-line">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">
          {item.code} · Modul {item.module_code} — {moduleLabel}
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted-dark">
          {formatHint}
        </span>
      </header>

      <h2
        className="font-display font-normal text-[clamp(1.4rem,3vw,2.2rem)] leading-[1.2] tracking-[-0.025em] max-w-[30ch]"
        style={{ fontVariationSettings: "'opsz' 144" }}
      >
        {item.text_de}
      </h2>

      <div className="mt-2">
        {item.format === 'likert_5' || item.format === 'state' || item.format === 'gap_wichtig' || item.format === 'gap_gelebt' ? (
          <LikertInput
            value={currentValue?.value_numeric}
            onChange={(v) => onAnswer({ value_numeric: v })}
            lowLabel={item.format === 'gap_wichtig' ? 'Unwichtig' : item.format === 'gap_gelebt' ? 'Gelingt mir selten' : 'Trifft nicht zu'}
            highLabel={item.format === 'gap_wichtig' ? 'Sehr wichtig' : item.format === 'gap_gelebt' ? 'Gelingt mir sehr gut' : 'Trifft voll zu'}
          />
        ) : item.format === 'forced_choice' || item.format === 'szenario' || item.format === 'dilemma' || item.format === 'ranking' ? (
          <ChoiceInput
            options={item.options ?? []}
            value={currentValue?.value_choice}
            onChange={(k) => onAnswer({ value_choice: k })}
          />
        ) : item.format === 'spannungsfeld' ? (
          <SpannungsfeldInput
            options={item.options ?? []}
            value={currentValue?.value_position}
            onChange={(p) => onAnswer({ value_position: p })}
          />
        ) : (
          <div className="text-muted font-mono text-sm">Unbekanntes Format: {item.format}</div>
        )}
      </div>
    </div>
  );
}

/* ============ Likert / State / Gap Input ============ */

function LikertInput({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="mt-4">
      <div className="flex flex-wrap justify-between gap-2 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-dark mb-3">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const isActive = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`aspect-square flex items-center justify-center rounded-full border-2 font-display text-2xl font-light transition-all ${
                isActive
                  ? 'bg-gold border-gold text-ink scale-110 shadow-[0_10px_30px_-8px_rgba(179,142,69,0.6)]'
                  : 'bg-transparent border-ink-line text-bone-soft hover:border-gold hover:text-gold'
              }`}
              aria-pressed={isActive}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ Choice Input (Forced Choice / Szenario / Dilemma) ============ */

function ChoiceInput({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; text: string; weights: Record<string, number> }>;
  value: string | undefined;
  onChange: (k: string) => void;
}) {
  return (
    <div className="grid gap-3 mt-2">
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`flex items-start gap-4 px-5 py-4 rounded-2xl border text-left transition-all ${
              isActive
                ? 'bg-gold border-gold text-ink shadow-[0_10px_30px_-8px_rgba(179,142,69,0.5)]'
                : 'bg-ink-soft border-ink-line text-bone hover:border-gold hover:translate-x-1'
            }`}
            aria-pressed={isActive}
          >
            <span
              className={`font-mono text-xs uppercase tracking-[0.12em] shrink-0 mt-0.5 ${
                isActive ? 'opacity-100' : 'opacity-60'
              }`}
            >
              {opt.key}
            </span>
            <span className="text-base leading-[1.4] font-medium">{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============ Spannungsfeld (Tension Poles) ============ */

function SpannungsfeldInput({
  options,
  value,
  onChange,
}: {
  options: Array<{ key?: string; text?: string; left?: string; right?: string; axis?: string }>;
  value: number | undefined;
  onChange: (p: number) => void;
}) {
  // first option carries the left/right labels
  const poles = options[0] ?? { left: 'Pol A', right: 'Pol B' };
  const current = value ?? 0.5;

  return (
    <div className="mt-6">
      <div className="flex justify-between font-mono text-xs uppercase tracking-[0.12em] text-bone-soft mb-4">
        <span>{poles.left}</span>
        <span>{poles.right}</span>
      </div>
      <div className="relative h-14 flex items-center">
        <div className="absolute inset-x-0 h-0.5 bg-ink-line rounded" />
        <div
          className="absolute h-0.5 bg-gradient-to-r from-gold to-gold-light rounded"
          style={{ left: 0, width: `${current * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(current * 100)}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_var(--ink),0_10px_30px_-8px_rgba(179,142,69,0.8)]
                     [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
                     [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-gold
                     [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab"
        />
      </div>
      <div className="text-center font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted-dark mt-4">
        Position: {Math.round(current * 100)} %
      </div>
    </div>
  );
}
