import {json, type LoaderFunctionArgs} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import {getReview} from '../../atproto/getReviews.js'
import {Link} from '../components/link.js'
import {StarRating} from '../components/star-rating'

export const loader = async ({params}: LoaderFunctionArgs) => {
  const rkey = params.rkey
  if (!rkey) throw new Response('Not Found', {status: 404})
  const review = await getReview(rkey)
  if (!review) throw new Response('Not Found', {status: 404})
  return json({review})
}

const RATING_LABEL: Record<number, string> = {
  10: 'Masterpiece',
  9: 'Excellent',
  8: 'Great',
  7: 'Good',
  6: 'Fine',
  5: 'Average',
  4: 'Bad',
  3: 'Terrible',
  2: 'Awful',
  1: 'Unbearable',
}

const TYPE_LABEL: Record<string, string> = {
  book: 'Book',
  movie: 'Movie',
  tv: 'TV Show',
  game: 'Game',
  music: 'Music',
}

const CREDIT_LABEL: Record<string, string> = {
  director: 'Directed by',
  author: 'Written by',
  developer: 'Developed by',
}

function formatReviewText(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n').trim()

  return normalized
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim()
      if (/^<blockquote/i.test(trimmed)) {
        return trimmed.replace(/<blockquote>/g, '<blockquote class="bq">')
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('')
}

export default function ReviewPage() {
  const {review} = useLoaderData<typeof loader>()

  const typeLabel = TYPE_LABEL[review.creativeWorkType ?? ''] ?? review.creativeWorkType
  const releaseYear = review.releaseDate ? new Date(review.releaseDate).getFullYear() : null
  const reviewedDate = new Date(review.addedAt).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})
  const creditLabel = CREDIT_LABEL[review.mainCreditRole ?? ''] ?? 'By'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Backdrop */}
      {review.backdropUrl && (
        <div className="relative w-full h-52 md:h-72 overflow-hidden">
          <img src={review.backdropUrl} alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0" style={{background: 'linear-gradient(to bottom, transparent, #0a0a0a)'}} />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-8 relative" style={{marginTop: review.backdropUrl ? '-60px' : 0}}>
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 font-mono text-[16px] text-[#555] hover:text-[#4a9eff] transition-colors mb-7 uppercase tracking-wider">
          ← Back
        </Link>

        {/* Header */}
        <div className="flex gap-5 mb-7">
          {review.posterUrl && (
            <img
              src={review.posterUrl}
              alt={review.title}
              className="w-20 md:w-28 rounded-md shadow-xl flex-shrink-0 object-cover border border-[#1e1e1e]"
            />
          )}
          <div className="flex flex-col justify-end gap-2">
            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {review.creativeWorkType && (
                <span className="font-mono text-[13px] text-[#4a9eff] border border-[#1e3a5f] px-2 py-0.5 rounded-full">
                  {typeLabel}
                </span>
              )}
              {review.isRevisit && (
                <span className="font-mono text-[13px] text-[#555] border border-[#2a2a2a] px-2 py-0.5 rounded-full">Revisit</span>
              )}
              {review.containsSpoilers && (
                <span className="font-mono text-[13px] text-amber-500 border border-amber-500/40 px-2 py-0.5 rounded-full">Spoilers</span>
              )}
            </div>

            {/* Title — sama dengan posts: font-display text-[35px] */}
            <h1 className="font-display text-[35px] md:text-[37px] text-[#f0f0f0] leading-tight tracking-[-0.02em]">
              {review.title}
              {releaseYear && (
                <span className="text-[#555] ml-2 text-[20px] font-normal">({releaseYear})</span>
              )}
            </h1>

            {review.mainCredit && (
              <p className="font-mono text-[16px] text-[#555] uppercase tracking-wider">
                {creditLabel} <span className="text-[#b0b0b0]">{review.mainCredit}</span>
              </p>
            )}
            {review.genres.length > 0 && (
              <p className="font-mono text-[13px] text-[#444]">{review.genres.join(' · ')}</p>
            )}
          </div>
        </div>

        {/* Rating */}
        {review.rating && (
          <div className="flex items-center gap-3 py-4 border-y border-[#1e1e1e] mb-7">
            <StarRating rating={review.rating} size={28} filledClassName="text-[#4a9eff]" emptyClassName="text-[#222]" />
            {RATING_LABEL[review.rating] && (
              <span className="font-mono text-[16px] text-[#888]">{RATING_LABEL[review.rating]}</span>
            )}
          </div>
        )}

        {/* Review text — sama dengan posts: font-sans text-[#888] leading-[1.9] */}
        {review.text && (
          <div
            className="font-sans text-[17px] md:text-[18px] text-[#888] leading-[1.9] max-w-prose [&_p]:mb-5 [&_p:last-child]:mb-0 [&_.bq]:border-l-[1.5px] [&_.bq]:border-[#4a9eff] [&_.bq]:pl-4 [&_.bq]:italic [&_.bq]:text-[#777] [&_.bq]:my-4"
            dangerouslySetInnerHTML={{__html: formatReviewText(review.text)}}
          />
        )}

        {/* Tags */}
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-7">
            {review.tags.map(tag => (
              <span key={tag} className="font-mono text-[13px] text-[#4a9eff] border border-[#1e3a5f] px-2 py-0.5 rounded-full bg-[#0d1f33]">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* External links */}
        <div className="flex gap-2 mt-7">
          {review.identifiers?.imdbId && (
            <a href={`https://www.imdb.com/title/${review.identifiers.imdbId}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-[14px] text-[#555] border border-[#222] px-3 py-1.5 rounded hover:border-[#4a9eff] hover:text-[#4a9eff] transition-colors">
              IMDb ↗
            </a>
          )}
          {review.identifiers?.tmdbId && (
            <a href={`https://www.themoviedb.org/${review.creativeWorkType === 'tv' ? 'tv' : 'movie'}/${review.identifiers.tmdbId}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-[14px] text-[#555] border border-[#222] px-3 py-1.5 rounded hover:border-[#4a9eff] hover:text-[#4a9eff] transition-colors">
              TMDB ↗
            </a>
          )}
          {review.identifiers?.isbn13 && (
            <a href={`https://www.goodreads.com/search?q=${review.identifiers.isbn13}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-[14px] text-[#555] border border-[#222] px-3 py-1.5 rounded hover:border-[#4a9eff] hover:text-[#4a9eff] transition-colors">
              Goodreads ↗
            </a>
          )}
        </div>

        <p className="font-mono text-[13px] text-[#333] mt-8">Reviewed on {reviewedDate}</p>
      </div>
    </div>
  )
}