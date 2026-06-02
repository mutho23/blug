import {json, type LoaderFunctionArgs} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import {getReview} from '../../atproto/getReviews.js'
import {Link} from '../components/link.js'

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

function renderText(text: string) {
  const cleaned = text
    .replace(/<blockquote>/g, '<blockquote class="bq">')
    .replace(/\r\n/g, '\n')
  return cleaned
}

export default function ReviewPage() {
  const {review} = useLoaderData<typeof loader>()

  const typeLabel =
    review.creativeWorkType === 'book'
      ? 'Book'
      : review.creativeWorkType === 'movie'
        ? 'Movie'
        : review.creativeWorkType === 'tv'
          ? 'TV Show'
          : review.creativeWorkType === 'game'
            ? 'Game'
            : review.creativeWorkType

  const releaseYear = review.releaseDate
    ? new Date(review.releaseDate).getFullYear()
    : null

  const reviewedDate = new Date(review.addedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const creditLabel =
    review.mainCreditRole === 'director'
      ? 'Directed by'
      : review.mainCreditRole === 'author'
        ? 'Written by'
        : review.mainCreditRole === 'developer'
          ? 'Developed by'
          : 'By'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {review.backdropUrl && (
        <div className="relative w-full h-64 md:h-80 overflow-hidden">
          <img
            src={review.backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10 -mt-20 relative">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-8 tracking-wider uppercase"
        >
          ← Back
        </Link>

        <div className="flex gap-6 mb-8">
          {review.posterUrl && (
            <img
              src={review.posterUrl}
              alt={review.title}
              className="w-24 md:w-32 rounded-lg shadow-2xl flex-shrink-0 object-cover"
            />
          )}
          <div className="flex flex-col justify-end gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-2 py-0.5 rounded-full">
                {typeLabel}
              </span>
              {review.isRevisit && (
                <span className="font-mono text-xs text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
                  Revisit
                </span>
              )}
              {review.containsSpoilers && (
                <span className="font-mono text-xs text-amber-500 border border-amber-500/50 px-2 py-0.5 rounded-full">
                  Spoilers
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-4xl leading-tight">
              {review.title}
              {releaseYear && (
                <span className="text-zinc-500 ml-2 text-2xl font-normal">
                  ({releaseYear})
                </span>
              )}
            </h1>

            {review.mainCredit && (
              <p className="text-zinc-400 text-sm">
                {creditLabel}{' '}
                <span className="text-zinc-200">{review.mainCredit}</span>
              </p>
            )}

            {review.genres.length > 0 && (
              <p className="font-mono text-xs text-zinc-500">
                {review.genres.join(' · ')}
              </p>
            )}
          </div>
        </div>

        {review.rating && (
          <div className="flex items-center gap-3 mb-8 py-4 border-y border-zinc-800">
            <span className="font-display text-5xl text-zinc-100">
              {review.rating}
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs text-zinc-500">/ 10</span>
              {RATING_LABEL[review.rating] && (
                <span className="text-zinc-300 text-sm">
                  {RATING_LABEL[review.rating]}
                </span>
              )}
            </div>
          </div>
        )}

        {review.text && (
          <div
            className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed text-base [&_.bq]:border-l-2 [&_.bq]:border-zinc-600 [&_.bq]:pl-4 [&_.bq]:italic [&_.bq]:text-zinc-400 [&_.bq]:my-4"
            dangerouslySetInnerHTML={{__html: renderText(review.text)}}
          />
        )}

        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {review.identifiers?.imdbId && (
            <a
              href={`https://www.imdb.com/title/${review.identifiers.imdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              IMDb ↗
            </a>
          )}
          {review.identifiers?.tmdbId && (
            <a
              href={`https://www.themoviedb.org/${review.creativeWorkType === 'tv' ? 'tv' : 'movie'}/${review.identifiers.tmdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              TMDB ↗
            </a>
          )}
          {review.identifiers?.isbn13 && (
            <a
              href={`https://www.goodreads.com/search?q=${review.identifiers.isbn13}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Goodreads ↗
            </a>
          )}
        </div>

        <p className="font-mono text-xs text-zinc-600 mt-10">
          Reviewed on {reviewedDate}
        </p>
      </div>
    </div>
  )
}
