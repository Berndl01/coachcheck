export function QuoteBreak() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-16 md:py-24 relative text-center">
      <span
        className="absolute top-12 left-1/2 -translate-x-1/2 font-display font-light leading-[0.7] text-gold opacity-90 pointer-events-none"
        style={{ fontSize: 'clamp(8rem, 18vw, 14rem)', fontVariationSettings: "'opsz' 144", zIndex: 0 }}
      >
        "
      </span>
      <p
        className="font-editorial italic font-normal text-[clamp(1.6rem,3.5vw,2.6rem)] leading-[1.25] max-w-[24ch] mx-auto relative z-10"
      >
        Die meisten Trainer wissen alles über ihre Spieler — und überraschend wenig
        darüber, wie sie selbst wirken.
      </p>
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted mt-8 relative z-10">
        — Humatrix · Sport Mindset Lab
      </div>
    </section>
  );
}
