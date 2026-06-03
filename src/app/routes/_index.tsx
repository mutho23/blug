import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto/index.js'
import {getReviews, PopfeedReview} from '../../atproto/getReviews.js'
import {getDid} from '../../atproto/getDid.js'
import {useLoaderData} from '@remix-run/react'
import {useMemo, useState} from 'react'
import {LeafletDocument} from 'src/types'

type FeedItem = LeafletDocument & {type: 'post'}

export const loader = async () => {
  try {
    const [rawPosts, reviews] = await Promise.all([
      getPosts(undefined),
      getReviews(),
    ])

    const posts: FeedItem[] = rawPosts.map(p => ({
      ...p,
      type: 'post' as const,
      description: p.description?.slice(0, 180),
    }))

    posts.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime(),
    )

    reviews.sort(
      (a, b) =>
        new Date(b.addedAt).getTime() -
        new Date(a.addedAt).getTime(),
    )

    return json({items: posts, did: getDid(), reviews})
  } catch (err) {
    console.error('Index loader error:', err)
    return json({items: [], did: getDid(), reviews: []})
  }
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
  const {items, did, reviews} = useLoaderData<{
    items: FeedItem[]
    did: string
    reviews: PopfeedReview[]
  }>()

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
    <div className="mx-auto w-full max-w-xl px-6 pt-8 md:pt-12 pb-12">
      <section className="mb-8 md:mb-10 flex flex-col gap-3">
        <h1 className="font-display text-4xl md:text-5xl text-950 leading-[1.05]">
          It's Mutho<span className="text-[#5EA2FF]">.</span>
        </h1>

        <p className="text-lg leading-relaxed text-zinc-400 max-w-prose">
          Just writing random stuff here.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4 border-b border-zinc-800 pb-3">
          <h2 className="label tracking-[0.25em] uppercase text-zinc-500">
            Recent writing
          </h2>

          <span className="label text-zinc-500">
            {filteredItems.length} posts
          </span>
        </div>

        {allTags.length > 0 && (
          <div className="relative inline-block mb-5">
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center gap-2 font-mono text-[12px] text-[#5EA2FF] border-2 border-[#5EA2FF] rounded-xl px-4 py-2.5 bg-black hover:bg-zinc-950 transition-all">
              {activeTag ?? 'All Posts'}
              <span className={`transition-transform duration-200 ${showTags ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showTags && (
              <div className="absolute left-0 top-full mt-2 w-[180px] rounded-[18px] border border-zinc-800 bg-[#0A0A0A] p-2 shadow-2xl z-50">
                <button
                  onClick={() => { setActiveTag(null); setShowTags(false) }}
                  className={`w-full text-left px-3 py-2 rounded-[14px] text-[13px] transition-all ${
                    activeTag === null
                      ? 'bg-[#69A7F5] text-black'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}>
                  All Posts
                </button>

                <div className="mt-2 flex flex-col">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => { setActiveTag(tag); setShowTags(false) }}
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

        {filteredItems.length === 0 ? (
          <p className="text-zinc-600 font-mono text-sm pt-4">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-900">
            {filteredItems.map(item => (
              <PostItem post={item} did={did} key={`post-${item.rkey}`} />
            ))}
          </ul>
        )}
      </section>

      {reviews.length > 0 && (
        <ReviewsSection reviews={reviews} />
      )}
    </div>
  )
}

function PostItem({post, did}: {post: LeafletDocument; did: string}) {
  const date = new Date(post.publishedAt)
  const coverUrl = post.coverImage
    ? `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${post.coverImage.ref.$link}@jpeg`
    : null

  return (
    <li>
      <a
        href={`/posts/${post.rkey}`}
        className="group flex gap-4 py-4 -mx-3 px-3 rounded-md transition-colors hover:bg-zinc-950">

        <div className="w-12 h-[4.5rem] flex-shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={post.title}
              className="w-full h-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <span className="text-zinc-700 text-xs">✏️</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-display text-3xl text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
              {post.title}
            </h3>
            <time
              className="font-mono text-sm text-zinc-500 uppercase tracking-wider"
              dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
            </time>
          </div>

          {post.description ? (
            <p className="text-zinc-500 text-base leading-relaxed line-clamp-2">
              {post.description}
            </p>
          ) : null}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {post.tags.map(tag => (
                <span key={tag} className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>
    </li>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  book: 'Book',
  game: 'Game',
}

function ReviewsSection({reviews}: {reviews: PopfeedReview[]}) {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [showTypes, setShowTypes] = useState(false)

  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>()
    reviews.forEach(r => { if (r.creativeWorkType) typeSet.add(r.creativeWorkType) })
    return Array.from(typeSet).sort()
  }, [reviews])

  const filteredReviews = useMemo(() => {
    if (!activeType) return reviews
    return reviews.filter(r => r.creativeWorkType === activeType)
  }, [reviews, activeType])

  const activeLabel = activeType ? (CATEGORY_LABELS[activeType] ?? activeType) : 'All Reviews'

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-4 border-b border-zinc-800 pb-3">
        <h2 className="label tracking-[0.25em] uppercase text-zinc-500">
          Recently watched & read
        </h2>
        <span className="label text-zinc-500">{filteredReviews.length} items</span>
      </div>

      {availableTypes.length > 0 && (
        <div className="relative inline-block mb-5">
          <button
            onClick={() => setShowTypes(!showTypes)}
            className="flex items-center gap-2 font-mono text-[12px] text-[#5EA2FF] border-2 border-[#5EA2FF] rounded-xl px-4 py-2.5 bg-black hover:bg-zinc-950 transition-all">
            {activeLabel}
            <span className={`transition-transform duration-200 ${showTypes ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showTypes && (
            <div className="absolute left-0 top-full mt-2 w-[180px] rounded-[18px] border border-zinc-800 bg-[#0A0A0A] p-2 shadow-2xl z-50">
              <button
                onClick={() => { setActiveType(null); setShowTypes(false) }}
                className={`w-full text-left px-3 py-2 rounded-[14px] text-[13px] transition-all ${
                  activeType === null
                    ? 'bg-[#69A7F5] text-black'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}>
                All Reviews
              </button>
              <div className="mt-2 flex flex-col">
                {availableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => { setActiveType(type); setShowTypes(false) }}
                    className={`w-full text-left px-3 py-2 rounded-[14px] text-[13px] transition-all ${
                      activeType === type
                        ? 'bg-[#69A7F5] text-black'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                    }`}>
                    {CATEGORY_LABELS[type] ?? type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ul className="divide-y divide-zinc-900">
        {filteredReviews.map(review => (
          <ReviewItem review={review} key={`review-${review.rkey}`} />
        ))}
      </ul>
    </section>
  )
}

function ReviewItem({review}: {review: PopfeedReview}) {
  const date = new Date(review.addedAt)

  return (
    <li>
      <a
        href={`/reviews/${review.rkey}`}
        className="group flex gap-4 py-4 -mx-3 px-3 rounded-md transition-colors hover:bg-zinc-950">

        <div className="w-12 h-[4.5rem] flex-shrink-0">
          {review.posterUrl ? (
            <img
              src={review.posterUrl}
              alt={review.title}
              className="w-full h-full object-cover rounded opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <span className="text-zinc-700 text-xs">
                {review.creativeWorkType === 'book' ? '📚' : '🎬'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-display text-2xl text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
              {review.creativeWorkType === 'book' ? '📚' :
               review.creativeWorkType === 'movie' ? '🎬' :
               review.creativeWorkType === 'tv' ? '📺' :
               review.creativeWorkType === 'game' ? '🎮' :
               review.creativeWorkType === 'music' ? '🎵' : '🎞️'}{' '}
              {review.title}
            </h3>
            {review.releaseDate && (
              <span className="font-mono text-sm text-zinc-600">
                {new Date(review.releaseDate).getFullYear()}
              </span>
            )}
            <time
              className="font-mono text-sm text-zinc-500 uppercase tracking-wider"
              dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
            </time>
          </div>

          {review.mainCredit && (
            <p className="text-zinc-500 text-sm">
              {review.mainCreditRole === 'author' ? 'by' : 'dir.'} {review.mainCredit}
            </p>
          )}

          {review.rating && (
            <div className="flex items-center gap-1">
              {Array.from({length: 5}, (_, i) => (
                <span
                  key={i}
                  className={`text-base ${i < Math.round(review.rating! / 2) ? 'text-[#5EA2FF]' : 'text-zinc-700'}`}>
                  ★
                </span>
              ))}
            </div>
          )}

          {(review.genres && review.genres.length > 0 || review.creativeWorkType) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {review.creativeWorkType && (
                <span className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-3 py-1 rounded-full">
                  {review.creativeWorkType === 'book' ? '📚 Book' :
                   review.creativeWorkType === 'movie' ? '🎬 Movie' :
                   review.creativeWorkType === 'tv' ? '📺 TV Show' :
                   review.creativeWorkType === 'game' ? '🎮 Game' :
                   review.creativeWorkType === 'music' ? '🎵 Music' :
                   review.creativeWorkType}
                </span>
              )}
              {review.genres && review.genres.slice(0, 3).map(genre => (
                <span key={genre} className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-3 py-1 rounded-full">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>
    </li>
  )
}
