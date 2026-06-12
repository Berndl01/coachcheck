'use client';

/**
 * ThinkingHead — animierter SVG-Kopf im Humatrix-Mesh-Stil.
 * Nodes "denken" (pulsieren), Edges "arbeiten" (Farbwelle durch das Netz).
 * Passt stilistisch zum Humatrix-Logo.
 */
export function ThinkingHead({ size = 180 }: { size?: number }) {
  return (
    <div className="inline-block" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Humatrix Kopf denkt"
        role="img"
      >
        {/* Animierter Gradient läuft durch Edges */}
        <defs>
          <linearGradient id="meshPulse" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ink-line, #33343A)">
              <animate
                attributeName="stop-color"
                values="#33343A; #B38E45; #33343A"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="#B38E45">
              <animate
                attributeName="stop-color"
                values="#B38E45; #CDB072; #B38E45"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="var(--ink-line, #33343A)">
              <animate
                attributeName="stop-color"
                values="#33343A; #143F3A; #33343A"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>

        {/* Edges */}
        <g stroke="url(#meshPulse)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="140" y1="40" x2="260" y2="40" />
          <line x1="140" y1="40" x2="60" y2="130" />
          <line x1="260" y1="40" x2="340" y2="130" />
          <line x1="60" y1="130" x2="60" y2="270" />
          <line x1="340" y1="130" x2="340" y2="270" />
          <line x1="60" y1="270" x2="120" y2="360" />
          <line x1="340" y1="270" x2="280" y2="360" />
          <line x1="120" y1="360" x2="200" y2="420" />
          <line x1="280" y1="360" x2="200" y2="420" />

          <line x1="140" y1="40" x2="150" y2="140" />
          <line x1="260" y1="40" x2="250" y2="140" />
          <line x1="140" y1="40" x2="250" y2="140" />
          <line x1="260" y1="40" x2="150" y2="140" />
          <line x1="150" y1="140" x2="250" y2="140" />
          <line x1="60" y1="130" x2="150" y2="140" />
          <line x1="340" y1="130" x2="250" y2="140" />

          <line x1="150" y1="140" x2="170" y2="205" />
          <line x1="250" y1="140" x2="230" y2="205" />
          <line x1="170" y1="205" x2="230" y2="205" />
          <line x1="60" y1="130" x2="110" y2="210" />
          <line x1="340" y1="130" x2="290" y2="210" />
          <line x1="110" y1="210" x2="170" y2="205" />
          <line x1="290" y1="210" x2="230" y2="205" />
          <line x1="60" y1="270" x2="110" y2="210" />
          <line x1="340" y1="270" x2="290" y2="210" />
          <line x1="60" y1="270" x2="170" y2="205" />
          <line x1="340" y1="270" x2="230" y2="205" />

          <line x1="170" y1="205" x2="200" y2="270" />
          <line x1="230" y1="205" x2="200" y2="270" />

          <line x1="60" y1="270" x2="150" y2="300" />
          <line x1="340" y1="270" x2="250" y2="300" />
          <line x1="150" y1="300" x2="200" y2="270" />
          <line x1="250" y1="300" x2="200" y2="270" />
          <line x1="150" y1="300" x2="200" y2="340" />
          <line x1="250" y1="300" x2="200" y2="340" />
          <line x1="150" y1="300" x2="250" y2="300" />

          <line x1="200" y1="340" x2="120" y2="360" />
          <line x1="200" y1="340" x2="280" y2="360" />
          <line x1="200" y1="340" x2="200" y2="420" />
        </g>

        {/* Nodes mit pulsierenden Ringen */}
        <g>
          {[
            [140, 40, 0], [260, 40, 0.1],
            [60, 130, 0.2], [340, 130, 0.25],
            [150, 140, 0.3], [250, 140, 0.35],
            [170, 205, 0.4], [230, 205, 0.45],
            [110, 210, 0.5], [290, 210, 0.55],
            [60, 270, 0.6], [340, 270, 0.65],
            [200, 270, 0.7],
            [150, 300, 0.8], [250, 300, 0.85],
            [200, 340, 0.9],
            [120, 360, 1.0], [280, 360, 1.1],
            [200, 420, 1.2],
          ].map(([cx, cy, delay], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="7" fill="#1B1C1E" />
              <circle cx={cx} cy={cy} r="7" fill="none" stroke="#B38E45" strokeWidth="2" opacity="0">
                <animate
                  attributeName="r"
                  from="7"
                  to="18"
                  dur="2s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.8; 0"
                  dur="2s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
