'use client';

import { useState } from 'react';

type Props = {
  archetypeCode: string;
  archetypeName: string;
  assessmentId: string;
  trainingLevel: string | null;
  ageGroup: string | null;
  clubType: string | null;
};

export function PersonalSection({
  archetypeCode, archetypeName, assessmentId, trainingLevel, ageGroup, clubType,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<{
    intro: string;
    heute_konkret: string[];
    dein_spezifisches_risiko: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/archetyp/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetype_code: archetypeCode,
          assessment_id: assessmentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fehler');
      setContent(data.content);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-bone-soft py-16 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-4">
          06 · Persönlich für dich
        </div>
        <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-[-0.03em] mb-3">
          Was <em className="font-editorial">du</em> als {archetypeName.replace(/^Der /, '')} <br />heute tun kannst.
        </h2>
        <p className="font-editorial italic text-lg text-muted mb-10 leading-[1.5]">
          Bis hier war es der Archetyp allgemein. Jetzt: konkret auf deine Werte und dein Niveau zugeschnitten.
        </p>

        {!loaded && !loading && (
          <div className="text-center py-12 border-2 border-dashed border-bone-line rounded-md">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-8 py-4 bg-ink text-bone rounded-full font-semibold hover:bg-gold hover:text-ink transition"
            >
              Personalisierte Analyse laden <span className="font-mono">→</span>
            </button>
            <p className="text-sm text-muted mt-4">
              Wird von Claude auf Basis deines Assessments individuell erstellt (~15 Sek).
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold-deep mb-2 animate-pulse">
              Wird erstellt …
            </div>
            <div className="font-editorial italic text-lg text-muted">
              Claude liest deine Werte und schreibt dir deine persönliche Schicht.
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md font-mono text-sm">
            {error}
          </div>
        )}

        {content && (
          <div className="space-y-10">
            <div className="p-6 bg-bone rounded-md border border-bone-line">
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-3">
                Dein spezifischer Punkt
              </div>
              <p className="font-editorial italic text-lg leading-[1.55]">
                {content.intro}
              </p>
            </div>

            <div>
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold-deep mb-4">
                Was du heute konkret tun kannst
              </div>
              <div className="space-y-3">
                {content.heute_konkret.map((action, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-bone rounded-md border border-bone-line">
                    <div className="font-display text-2xl text-gold-deep font-light shrink-0" style={{ fontVariationSettings: "'opsz' 144" }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <p className="text-ink leading-[1.6] pt-1">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-ink text-bone rounded-md">
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-gold mb-3">
                Dein spezifisches Risiko
              </div>
              <p className="leading-[1.6] text-bone-soft">
                {content.dein_spezifisches_risiko}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
