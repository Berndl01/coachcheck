/**
 * Humatrix Brand-Logo — polygonales Mesh + Wordmark.
 * SVG-basiert: funktioniert auf hellen UND dunklen Hintergründen via currentColor.
 * Rekonstruiert auf Basis des Original-Brandassets PP_LinkedIn.jpg.
 */
export function HumatrixLogo({
  size = 40,
  className = '',
  color = 'currentColor',
  showText = true,
}: {
  size?: number;
  className?: string;
  color?: string;
  showText?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} style={{ color }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Humatrix"
        role="img"
      >
        {/* Edges */}
        <g stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Top edge */}
          <line x1="140" y1="40" x2="260" y2="40" />
          {/* Upper diagonals to shoulders */}
          <line x1="140" y1="40" x2="60" y2="130" />
          <line x1="260" y1="40" x2="340" y2="130" />
          {/* Shoulders down to sides */}
          <line x1="60" y1="130" x2="60" y2="270" />
          <line x1="340" y1="130" x2="340" y2="270" />
          {/* Sides converging to chin */}
          <line x1="60" y1="270" x2="120" y2="360" />
          <line x1="340" y1="270" x2="280" y2="360" />
          <line x1="120" y1="360" x2="200" y2="420" />
          <line x1="280" y1="360" x2="200" y2="420" />

          {/* Triangulation top — eyebrow points */}
          <line x1="140" y1="40" x2="150" y2="140" />
          <line x1="260" y1="40" x2="250" y2="140" />
          <line x1="140" y1="40" x2="250" y2="140" />
          <line x1="260" y1="40" x2="150" y2="140" />
          <line x1="150" y1="140" x2="250" y2="140" />
          <line x1="60" y1="130" x2="150" y2="140" />
          <line x1="340" y1="130" x2="250" y2="140" />

          {/* Mid-face — nose bridge + cheekbones */}
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

          {/* Nose */}
          <line x1="170" y1="205" x2="200" y2="270" />
          <line x1="230" y1="205" x2="200" y2="270" />

          {/* Lower face — cheek to mouth */}
          <line x1="60" y1="270" x2="150" y2="300" />
          <line x1="340" y1="270" x2="250" y2="300" />
          <line x1="150" y1="300" x2="200" y2="270" />
          <line x1="250" y1="300" x2="200" y2="270" />
          <line x1="150" y1="300" x2="200" y2="340" />
          <line x1="250" y1="300" x2="200" y2="340" />
          <line x1="150" y1="300" x2="250" y2="300" />

          {/* Chin */}
          <line x1="200" y1="340" x2="120" y2="360" />
          <line x1="200" y1="340" x2="280" y2="360" />
          <line x1="200" y1="340" x2="200" y2="420" />
        </g>

        {/* Nodes */}
        <g fill={color}>
          {[
            [140, 40], [260, 40],
            [60, 130], [340, 130],
            [150, 140], [250, 140],
            [170, 205], [230, 205],
            [110, 210], [290, 210],
            [60, 270], [340, 270],
            [200, 270],
            [150, 300], [250, 300],
            [200, 340],
            [120, 360], [280, 360],
            [200, 420],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="7" />
          ))}
        </g>
      </svg>

      {showText && (
        <span className="flex flex-col leading-none gap-1">
          <span
            className="font-wordmark font-extralight uppercase"
            style={{ fontSize: '1.05rem', letterSpacing: '0.24em' }}
          >
            Humatrix
          </span>
          <span
            className="font-wordmark font-light uppercase hidden sm:inline"
            style={{ fontSize: '0.55rem', letterSpacing: '0.22em', opacity: 0.6 }}
          >
            the mind club company
          </span>
        </span>
      )}
    </span>
  );
}
