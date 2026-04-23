export function Ticker() {
  const items = [
    'Verstehe, wie dein Team dich wirklich erlebt',
    'Erkenne Spannungen, bevor sie Leistung kosten',
    'Schluss mit dem Blindflug',
    '12 Sport-Archetypen · 1 klare Antwort',
  ];
  // Duplicate for seamless loop
  const loop = [...items, ...items];

  return (
    <div className="bg-ink text-bone border-t border-b border-ink py-4 overflow-hidden">
      <div className="flex gap-12 animate-ticker whitespace-nowrap">
        {loop.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-12 font-display font-light italic text-[clamp(1.4rem,2.6vw,2.1rem)] tracking-[-0.02em]"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            {text}
            <span className="text-gold not-italic text-[0.7em]">✦</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 38s linear infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
