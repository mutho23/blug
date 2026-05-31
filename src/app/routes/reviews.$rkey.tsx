import {useLoaderData} from '@remix-run/react'
import {getPopfeedReviews, type PopfeedReview} from '../../popfeed'
import {json, LoaderFunctionArgs, MetaFunction} from '@remix-run/node'
import {getProfile} from '../../atproto'
import {AppBskyActorDefs} from '@atproto/api'

export const loader = async ({params}: LoaderFunctionArgs) => {
  const {rkey} = params
  const [reviews, profile] = await Promise.all([
    getPopfeedReviews(),
    getProfile(),
  ])
  const review = reviews.find(r => r.rkey === rkey) ?? null
  return json({review, profile})
}

export const meta: MetaFunction<typeof loader> = ({data}) => {
  if (!data?.review) return [{title: 'Review not found'}]
  return [
    {title: `${data.review.title} | Mutho's Blog`},
    {
      name: 'description',
      content: data.review.description?.slice(0, 160) ?? '',
    },
    {name: 'og:title', content: data.review.title},
    ...(data.review.posterUrl
      ? [{property: 'og:image', content: data.review.posterUrl}]
      : []),
  ]
}

const MEDIA_TYPE_EMOJI: Record<string, string> = {
  movie: '🎬',
  tv: '📺',
  music: '🎵',
  game: '🎮',
  book: '📚',
}

export default function ReviewPage() {
  const {review, profile} = useLoaderData<{
    review: PopfeedReview | null
    profile: AppBskyActorDefs.ProfileViewDetailed
  }>()

  if (!review) return <Error />

  const emoji = review.mediaType
    ? MEDIA_TYPE_EMOJI[review.mediaType] ?? '⭐'
    : '⭐'
  const stars = review.rating != null ? Math.round(review.rating / 2) : null
  const date = new Date(review.publishedAt)
  const releaseYear = review.releaseDate
    ? new Date(review.releaseDate).getFullYear()
    : null

  return (
    <article className="container mx-auto pt-12 md:pt-20 pb-24">
      <header className="flex flex-col gap-5 mb-12 md:mb-16 max-w-prose">
        <a href="/" className="label hover:text-600 transition-colors w-fit">
          ← Writing
        </a>

        <div className="flex gap-6 items-start">
          {/* Poster */}
          {review.posterUrl && (
            <img
              src={review.posterUrl}
              alt={review.title}
              className="w-24 md:w-32 rounded-md shadow-2xl shadow-black/40 flex-shrink-0"
            />
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 uppercase tracking-wider">
              <span>{emoji}</span>
              {review.mediaType && <span>{review.mediaType}</span>}
              {releaseYear && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span>{releaseYear}</span>
                </>
              )}
              {review.mainCredit && (
                <>
                  <span className="text-zinc-700">·</span>
                  <span>{review.mainCredit}</span>
                </>
              )}
            </div>

            <h1 className="font-display text-950 text-4xl md:text-6xl leading-[1.02]">
              {review.title}
            </h1>

            {/* Rating */}
            {stars != null && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#5EA2FF] text-lg">
                  {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                </span>
                <span className="font-mono text-sm text-zinc-500">
                  {review.rating}/10
                </span>
                {review.isRevisit && (
                  <span className="font-mono text-xs text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-full">
                    revisit
                  </span>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider">
              <span className="text-500">{profile.displayName}</span>
              <span className="text-300">·</span>
              <time className="text-500" dateTime={date.toISOString()}>
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>

            {/* Genres */}
            {review.genres && review.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {review.genres.map(genre => (
                  <span
                    key={genre}
                    className="font-mono text-xs text-zinc-600 border border-zinc-800 px-3 py-1 rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {review.backdropUrl && (
        <div className="max-w-prose mb-10 -mx-2 md:-mx-8">
          <img
            src={review.backdropUrl}
            alt={`${review.title} backdrop`}
            className="rounded-md shadow-2xl shadow-black/40 w-full object-cover max-h-64"
          />
        </div>
      )}

      {/* Isi review */}
      <div className="max-w-prose">
        {review.containsSpoilers && (
          <div className="mb-6 px-4 py-3 rounded-md border border-yellow-800/40 bg-yellow-900/10 font-mono text-xs text-yellow-600 uppercase tracking-wider">
            ⚠ Mengandung spoiler
          </div>
        )}

        {review.description && (
          <p className="text-lg md:text-xl font-sans text-900 leading-relaxed whitespace-pre-line">
            {review.description}
          </p>
        )}

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            {review.tags.map(tag => (
              <span
                key={tag}
                className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Link ke Popfeed */}
        <div className="mt-10 pt-6 border-t border-zinc-900">
          <a
            href={review.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-zinc-600 hover:text-[#5EA2FF] transition-colors">
            Lihat di Popfeed ↗
          </a>
        </div>
      </div>
    </article>
  )
}

function Error() {
  return (
    <div className="container mx-auto pt-16 md:pt-28 pb-24 text-center">
      <p className="label mb-6">404</p>
      <h1 className="font-display text-5xl md:text-7xl text-950 leading-[0.95]">
        That review wandered off.
      </h1>
      <div className="p-10 flex justify-center">
        <img
          src="/monkey.jpg"
          alt="Monkey muppet meme image"
          className="rounded-md shadow-2xl shadow-black/40 max-w-sm"
        />
      </div>
      <a
        href="/"
        className="inline-block font-mono text-xs text-600 hover:text-700 transition-colors">
        ← back to writing
      </a>
    </div>
  )
}
