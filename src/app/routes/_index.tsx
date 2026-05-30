import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto'
import {getPopfeedReviews, type PopfeedReview} from '../../popfeed'
import {useLoaderData} from '@remix-run/react'
import {useMemo, useState} from 'react'
import {LeafletDocument} from 'src/types'

// Union type untuk item di feed
type FeedItem =
  | (LeafletDocument & {type: 'post'})
  | PopfeedReview

export const loader = async () => {
  // Fetch keduanya paralel
  const [rawPosts, reviews] = await Promise.all([
    getPosts(undefined),
    getPopfeedReviews(),
  ])

  const posts: FeedItem[] = rawPosts.map(p => ({
    ...p,
    type: 'post' as const,
    description: p.description?.slice(0, 180),
  }))

  // Review sudah punya type: 'review' dari helper
  const allItems: FeedItem[] = [...posts, ...reviews]

  // Sort by date, terbaru duluan
  allItems.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime(),
  )

  return json({items: allItems})
}

export const meta: MetaFunction = () => {
  return [
    {title: "Mutho's Blog"},
    {
      name: 'description',
      content: 'thoughts and vibes from mutho',
    },
  ]
}

export default function Index() {
  const {items} = useLoaderData<{items: FeedItem[]}>()

  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach(item => item.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (!activeTag) return items
    return items.filter(item => item.tags?.includes(activeTag))
  }, [items, activeTag])

  return (
    <div className="container mx-auto pt-12 md:pt-20 pb-24">
      <section className="mb-16 md:mb-20 flex flex-col gap-5">
        <h1 className="font-display text-4xl md:text-5xl text-950 leading-[1.05]">
          It's Mutho<span className="text-[#5EA2FF]">.</span>
        </h1>

        <p className="text-lg leading-relaxed text-zinc-400 max-w-prose">
          Just writing random stuff here.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-5 border-b border-zinc-800 pb-3">
          <h2 className="label tracking-[0.25em] uppercase text-zinc-500">
            Recent writing
          </h2>

          <span className="label text-zinc-500">
            {filteredItems.length} posts
          </span>
        </div>

        {allTags.length > 0 && (
          <div className="relative inline-block mb-8">
            {/* BUTTON */}
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center gap-2 font-mono text-[12px] text-[#5EA2FF] border-2 border-[#5EA2FF] rounded-xl px-4 py-2.5 bg-black hover:bg-zinc-950 transition-all">
              {activeTag ?? 'All Posts'}

              <span
                className={`transition-transform duration-200 ${
                  showTags ? 'rotate-180' : ''
                }`}>
                ▼
              </span>
            </button>

            {/* DROPDOWN */}
            {showTags && (
              <div className="absolute left-0 top-full mt-2 w-[180px] rounded-[18px] border border-zinc-800 bg-[#0A0A0A] p-2 shadow-2xl z-50">
                {/* ALL POSTS */}
                <button
                  onClick={() => {
                    setActiveTag(null)
                    setShowTags(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-[14px] text-[13px] transition-all ${
                    activeTag === null
                      ? 'bg-[#69A7F5] text-black'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}>
                  All Posts
                </button>

                {/* TAGS */}
                <div className="mt-2 flex flex-col">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveTag(tag)
                        setShowTags(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-[14px] text-[13px] transition-all ${
                        activeTag === tag
                          ? 'bg-[#69A7F5] text-black'
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <ul className="divide-y divide-zinc-900">
          {filteredItems.map(item =>
            item.type === 'review' ? (
              <ReviewItem review={item as PopfeedReview} key={`review-${item.rkey}`} />
            ) : (
              // @ts-ignore
              <PostItem post={item} key={`post-${item.rkey}`} />
            ),
          )}
        </ul>
      </section>
    </div>
  )
}

// ── Komponen untuk postingan Leaflet (tidak berubah) ─────────────────────────

function PostItem({post}: {post: LeafletDocument}) {
  const date = new Date(post.publishedAt)

  return (
    <li>
      <a
        href={`/posts/${post.rkey}`}
        className="group flex flex-col gap-1.5 py-5 -mx-3 px-3 rounded-md transition-colors hover:bg-zinc-950">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-display text-3xl text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
            {post.title}
          </h3>

          <time
            className="font-mono text-sm text-zinc-500 uppercase tracking-wider"
            dateTime={date.toISOString()}>
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>

        {post.description ? (
          <p className="text-zinc-500 text-base leading-relaxed line-clamp-2">
            {post.description}
          </p>
        ) : null}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </a>
    </li>
  )
}

// ── Komponen baru untuk review Popfeed ───────────────────────────────────────

const MEDIA_TYPE_EMOJI: Record<string, string> = {
  movie: '🎬',
  tv: '📺',
  music: '🎵',
  game: '🎮',
  book: '📚',
}

function ReviewItem({review}: {review: PopfeedReview}) {
  const date = new Date(review.publishedAt)
  const emoji = review.mediaType ? MEDIA_TYPE_EMOJI[review.mediaType] ?? '⭐' : '⭐'
  const stars = review.rating != null ? Math.round(review.rating / 2) : null

  return (
    <li>
      <a
        href={review.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 py-5 -mx-3 px-3 rounded-md transition-colors hover:bg-zinc-950">

        {/* Poster */}
        {review.posterUrl && (
          <img
            src={review.posterUrl}
            alt={review.title}
            className="w-12 h-[4.5rem] object-cover rounded flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
          />
        )}

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-display text-3xl text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
              {emoji} {review.title}
            </h3>

            <time
              className="font-mono text-sm text-zinc-500 uppercase tracking-wider"
              dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>

          {stars != null && (
            <p className="font-mono text-sm text-[#5EA2FF]">
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
              <span className="text-zinc-500 ml-1">{review.rating}/10</span>
              {review.isRevisit && (
                <span className="text-zinc-600 ml-2">· revisit</span>
              )}
            </p>
          )}

          {review.description ? (
            <p className="text-zinc-500 text-base leading-relaxed line-clamp-2">
              {review.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 mt-1">
            {review.tags.map(tag => (
              <span
                key={tag}
                className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
            {review.genres?.slice(0, 2).map(genre => (
              <span
                key={genre}
                className="font-mono text-xs text-zinc-600 border border-zinc-800 px-3 py-1 rounded-full">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </a>
    </li>
  )
}
