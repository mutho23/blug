/**
 * Renders a 5-star rating that supports half-star fills, matching Popfeed's
 * display (e.g. rating 4.5 -> 4.5 filled stars).
 *
 * `rating` is expected on Popfeed's native 0-5 scale (half-star steps,
 * e.g. 0.5, 1, 1.5 ... 5).
 */
export function StarRating({
  rating,
  size = 16,
  filledClassName = 'text-[#4a9eff]',
  emptyClassName = 'text-[#333]',
  className = '',
}: {
  rating: number
  size?: number
  filledClassName?: string
  emptyClassName?: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => {
        // How much of this star (0, 0.5, or 1) should be filled.
        const fill = Math.max(0, Math.min(1, rating - i))

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

