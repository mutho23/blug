import { useId } from 'react'

// Simple 5-point star, 24x24 viewBox.
const STAR_PATH = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'

// A star is only ever fully empty, half-filled, or fully filled — Popfeed
// ratings move in 0.5-star steps, never anything in between.
type StarLevel = 'empty' | 'half' | 'full'

function getStarLevel(starsRemaining: number): StarLevel {
  if (starsRemaining >= 1) return 'full'
  if (starsRemaining >= 0.5) return 'half'
  return 'empty'
}

/**
 * Renders a 5-star rating that supports half-star fills, matching Popfeed's
 * display (e.g. rating 9 -> 4.5 filled stars, shown as 4 full + 1 half).
 *
 * Popfeed stores ratings on a 1-10 scale internally (each star = 2 points),
 * even though its own UI displays them as 5 stars. Pass `maxRating` if a
 * different source ever uses a different raw scale.
 *
 * Each star is rendered as one of exactly three fixed states — empty, half
 * (always clipped at a locked 50% width, not a computed percentage), or
 * full — so there's no dependency on floating-point fractions lining up
 * perfectly.
 */
export function StarRating({
  rating,
  maxRating = 10,
  size = 16,
  filledClassName = 'text-[#4a9eff]',
  emptyClassName = 'text-[#333]',
  className = '',
}: {
  rating: number
  maxRating?: number
  size?: number
  filledClassName?: string
  emptyClassName?: string
  className?: string
}) {
  const stars = rating / (maxRating / 5)
  const idPrefix = useId()

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const level = getStarLevel(stars - i)
        const clipId = `${idPrefix}-star-${i}`

        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="shrink-0"
          >
            <path d={STAR_PATH} fill="currentColor" className={emptyClassName} />
            {level === 'full' && (
              <path d={STAR_PATH} fill="currentColor" className={filledClassName} />
            )}
            {level === 'half' && (
              <>
                <defs>
                  <clipPath id={clipId}>
                    {/* Locked at exactly half the 24-wide viewBox — not a computed fraction. */}
                    <rect x="0" y="0" width="12" height="24" />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${clipId})`}>
                  <path d={STAR_PATH} fill="currentColor" className={filledClassName} />
                </g>
              </>
            )}
          </svg>
        )
      })}
    </div>
  )
}
