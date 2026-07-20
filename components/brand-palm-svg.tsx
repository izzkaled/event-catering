import { cn } from '@/lib/utils'

/** Precomputed leaflet endpoints (rounded) — avoids SSR/client float drift. */
const LEAFLETS = [
  { x: 18, y: 46, x2a: 32.18, y2a: 34.9, x2b: 20.55, y2b: 62.54, oa: 0.85, ob: 0.75 },
  { x: 34, y: 44.4, x2a: 49.05, y2a: 33.91, x2b: 38.2, y2b: 61.51, oa: 0.835, ob: 0.738 },
  { x: 50, y: 42.8, x2a: 66.01, y2a: 32.98, x2b: 55.75, y2b: 60.4, oa: 0.82, ob: 0.726 },
  { x: 66, y: 41.2, x2a: 82.92, y2a: 32.1, x2b: 73.2, y2b: 59.2, oa: 0.805, ob: 0.714 },
  { x: 82, y: 39.6, x2a: 99.68, y2a: 31.28, x2b: 90.55, y2b: 57.9, oa: 0.79, ob: 0.702 },
  { x: 98, y: 38, x2a: 115.2, y2a: 30.55, x2b: 107.5, y2b: 56.35, oa: 0.775, ob: 0.69 },
  { x: 114, y: 36.4, x2a: 130.4, y2a: 29.9, x2b: 124.1, y2b: 54.55, oa: 0.76, ob: 0.678 },
  { x: 130, y: 34.8, x2a: 145.3, y2a: 29.35, x2b: 140.4, y2b: 52.55, oa: 0.745, ob: 0.666 },
  { x: 146, y: 33.2, x2a: 159.9, y2a: 28.9, x2b: 156.4, y2b: 50.35, oa: 0.73, ob: 0.654 },
  { x: 162, y: 31.6, x2a: 174.2, y2a: 28.55, x2b: 172.1, y2b: 47.95, oa: 0.715, ob: 0.642 },
  { x: 178, y: 30, x2a: 188.2, y2a: 28.3, x2b: 187.5, y2b: 45.35, oa: 0.7, ob: 0.63 },
] as const

/** Stylized khousa palm frond — matches logo motif, crisp at any size. */
export function BrandPalmSvg({
  className,
  tone = 'palm',
}: {
  className?: string
  tone?: 'palm' | 'sand' | 'mix'
}) {
  const fill =
    tone === 'sand' ? 'var(--brand-sand)' : tone === 'mix' ? 'url(#khousaPalmGrad)' : 'var(--brand-palm)'

  return (
    <svg
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-auto', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="khousaPalmGrad" x1="0" y1="40" x2="200" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand-palm)" />
          <stop offset="0.55" stopColor="var(--brand-sand)" />
          <stop offset="1" stopColor="var(--brand-terracotta)" />
        </linearGradient>
      </defs>
      <path
        d="M8 48 C48 40, 100 36, 192 28"
        stroke={fill}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {LEAFLETS.map((leaf, i) => (
        <g key={i}>
          <line
            x1={leaf.x}
            y1={leaf.y}
            x2={leaf.x2a}
            y2={leaf.y2a}
            stroke={fill}
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity={leaf.oa}
          />
          <line
            x1={leaf.x}
            y1={leaf.y}
            x2={leaf.x2b}
            y2={leaf.y2b}
            stroke={fill}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={leaf.ob}
          />
        </g>
      ))}
    </svg>
  )
}
