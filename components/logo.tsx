export function HumatrixLogo({
  size = 34,
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
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 200 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Polygon mesh — stylized version of Humatrix mark */}
        <g stroke={color} strokeWidth="1.5" fill="none">
          {/* Outer octagon */}
          <path d="M60 30 L140 30 L180 80 L180 160 L140 210 L100 240 L60 210 L20 160 L20 80 Z" />
          {/* Inner triangulation */}
          <path d="M60 30 L80 80 L140 30" />
          <path d="M140 30 L120 80 L60 30" />
          <path d="M80 80 L100 130 L120 80" />
          <path d="M20 80 L80 80 M180 80 L120 80" />
          <path d="M50 120 L80 80 M150 120 L120 80" />
          <path d="M20 160 L70 140 L100 130" />
          <path d="M180 160 L130 140 L100 130" />
          <path d="M70 140 L90 180 L130 140" />
          <path d="M90 180 L100 240 L130 180" />
          <path d="M90 180 L60 210 M130 180 L140 210" />
          <path d="M100 130 L100 180" />
        </g>
        {/* Nodes */}
        {[
          [60,30],[140,30],[180,80],[180,160],[140,210],[100,240],[60,210],[20,160],[20,80],
          [80,80],[120,80],[100,130],[50,120],[150,120],[70,140],[130,140],[90,180],[130,180],[100,180]
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill={color} />
        ))}
      </svg>
      {showText && (
        <span className="flex flex-col leading-none gap-1">
          <span
            className="font-wordmark font-extralight uppercase"
            style={{ fontSize: '1.05rem', letterSpacing: '0.22em', color }}
          >
            Humatrix
          </span>
          <span
            className="font-wordmark font-light uppercase hidden sm:inline"
            style={{ fontSize: '0.55rem', letterSpacing: '0.24em', color: 'var(--muted)' }}
          >
            the mind club company
          </span>
        </span>
      )}
    </span>
  );
}
