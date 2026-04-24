import Image from 'next/image';

/**
 * Offizielles Humatrix-Brand-Logo.
 *
 * Nutzt das echte PNG-Asset aus /public/brand/humatrix-mesh.png
 * (transparenter Hintergrund, dunkles Petrol-Mesh).
 *
 * Für dunkle Hintergründe setzt das CSS-Filter `invert` die Farben um,
 * ohne dass ein zweites Asset nötig ist.
 */
export function HumatrixLogo({
  size = 40,
  className = '',
  showText = true,
  variant = 'auto',
}: {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'auto' | 'inverted';
}) {
  // Original: 347×400 — Seitenverhältnis ~0.87
  const pngWidth = Math.round(size * 0.87);
  const pngHeight = size;

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/brand/humatrix-mesh.png"
        alt="Humatrix"
        width={pngWidth}
        height={pngHeight}
        className={`shrink-0 ${variant === 'inverted' ? 'invert' : ''}`}
        priority
      />
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
