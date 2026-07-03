/**
 * Renders a 5-star rating that supports half-star fills, matching Popfeed's
 * display (e.g. rating 9 -> 4.5 filled stars).
 *
 * Popfeed stores ratings on a 1-10 scale internally (each star = 2 points),
 * even though its own UI displays them as 5 stars. Pass `maxRating` if a
 * different source ever uses a different raw scale.
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

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => {
        // How much of this star (0, 0.5, or 1) should be filled.
        const fill = Math.max(0, Math.min(1, stars - i))

        return (
          <span
            key={i}
            className="relative inline-block shrink-0"
            style={{ width: size, height: size, fontSize: size, lineHeight: 1 }}
          >
            <span className={`absolute inset-0 ${emptyClassName}`}>★</span>
            {fill > 0 && (
              <span
                className={`absolute inset-0 overflow-hidden ${filledClassName}`}
                style={{ width: `${fill * 100}%` }}
              >
                ★
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}


