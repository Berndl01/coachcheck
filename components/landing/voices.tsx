export function VoicesSection() {
  const voices = [
    {
      text: 'Ich dachte, ich wäre der Ruhige im Team. Der Check hat mir gezeigt: Für meine Spieler bin ich der Druck. Das war ein Schlag — im besten Sinn.',
      name: 'Markus W.',
      role: 'Handball · Regionalliga · Tirol',
    },
    {
      text: 'Nach zwölf Jahren als Coach dachte ich, ich kenne mein Team. Der TeamCheck hat zwei Spannungen sichtbar gemacht, die ich komplett übersehen hatte.',
      name: 'Lena B.',
      role: 'Volleyball · Bundesliga · Österreich',
    },
    {
      text: 'Sieben Minuten. Das ist das ehrlichste Feedback, das ich in meiner Karriere bekommen habe — und niemand musste sich trauen, es mir zu sagen.',
      name: 'Tobias F.',
      role: 'Fußball · Jugend-Akademie · DE',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-28">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted mb-6 flex items-center gap-3">
        <span className="w-10 h-px bg-ink" /> 07 — Stimmen aus der Praxis
      </div>
      <h2 className="font-display font-light text-[clamp(2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.03em] max-w-[18ch] mb-10 md:mb-16">
        Was <em className="font-editorial">Trainer sagen</em>, die<br />den Check schon gemacht haben.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {voices.map((v, i) => (
          <blockquote
            key={i}
            className="relative bg-bone border border-bone-line rounded-md p-7 flex flex-col transition-colors hover:border-gold"
          >
            <span
              className="font-display font-light text-[5rem] leading-[0.7] text-gold mb-2 block"
              style={{ fontVariationSettings: "'opsz' 144" }}
            >
              "
            </span>
            <p className="font-editorial italic text-[1.1rem] leading-[1.45] text-ink flex-grow mb-6">
              {v.text}
            </p>
            <footer className="border-t border-bone-line pt-4 flex flex-col gap-0.5">
              <span className="font-display font-medium text-[0.95rem] tracking-[-0.01em]">{v.name}</span>
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted">{v.role}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
