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
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    reviews.sort(
      (a, b) =>
        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
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
    {name: 'description', content: 'thoughts and vibes from mutho'},
  ]
}

export default function Index() {
  const {items, did, reviews} = useLoaderData<{
    items: FeedItem[]
    did: string
    reviews: PopfeedReview[]
  }>()

  const [activeTag, setActiveTag] = useState<string | null>(null)

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
    <div className="page-layout">
      {/* ── Left Sidebar ── */}
      <aside className="sidebar-left">
        <div className="sidebar-sticky">
          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
            Writing
          </p>
          <nav className="flex flex-col gap-0.5 mb-6">
            <a href="#writing" className="sidebar-link active">Recent</a>
            <a href="#reviews" className="sidebar-link">Reviews</a>
          </nav>

          {allTags.length > 0 && (
            <>
              <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
                Tags
              </p>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`sidebar-link text-left ${activeTag === null ? 'active' : ''}`}>
                  all
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`sidebar-link text-left ${activeTag === tag ? 'active' : ''}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="page-main">
        {/* Hero */}
        <section className="pt-14 pb-9">
          <h1 className="font-display text-5xl md:text-6xl text-zinc-100 leading-[1.03] tracking-tight mb-2">
            It's Mutho<span className="accent">.</span>
          </h1>
          <p className="font-mono-dm text-sm text-zinc-500 leading-relaxed">
            Just writing random stuff here.
          </p>
        </section>

        {/* Writing section */}
        <section id="writing" className="mb-14">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-5">
            <span className="font-mono-dm text-[10px] tracking-[0.2em] uppercase text-zinc-700">
              Recent writing
            </span>
            <span className="font-mono-dm text-[10px] tracking-[0.1em] uppercase text-zinc-700">
              {filteredItems.length} posts
            </span>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              <button
                onClick={() => setActiveTag(null)}
                className={`tag-pill ${activeTag === null ? 'active' : ''}`}>
                all
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`tag-pill ${activeTag === tag ? 'active' : ''}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <p className="font-mono-dm text-sm text-zinc-700 py-6">No posts yet.</p>
          ) : (
            <ul>
              {filteredItems.map(item => (
                <PostItem post={item} did={did} key={`post-${item.rkey}`} />
              ))}
            </ul>
          )}
        </section>

        {/* Reviews section */}
        {reviews.length > 0 && <ReviewsSection reviews={reviews} />}
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="sidebar-right">
        <div className="sidebar-sticky">
          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
            Stats
          </p>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="font-display text-2xl text-zinc-100 leading-none">{items.length}</span>
            <span className="font-mono-dm text-[11px] text-zinc-700">posts</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="font-display text-2xl text-zinc-100 leading-none">{reviews.length}</span>
            <span className="font-mono-dm text-[11px] text-zinc-700">reviews</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-6">
            <span className="font-display text-2xl text-zinc-100 leading-none">{allTags.length}</span>
            <span className="font-mono-dm text-[11px] text-zinc-700">tags</span>
          </div>

          {reviews.length > 0 && (
            <>
              <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
                Latest reviewed
              </p>
              <div className="flex flex-col">
                {reviews.slice(0, 4).map(r => (
                  <a
                    key={r.rkey}
                    href={`/reviews/${r.rkey}`}
                    className="flex items-center gap-1.5 py-1.5 border-b border-zinc-900 group">
                    <span className="text-xs">
                      {r.creativeWorkType === 'book' ? '📚' :
                       r.creativeWorkType === 'movie' ? '🎬' :
                       r.creativeWorkType === 'tv' ? '📺' :
                       r.creativeWorkType === 'game' ? '🎮' : '🎞️'}
                    </span>
                    <span className="font-mono-dm text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors truncate">
                      {r.title}
                    </span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

/* ── Post Item ── */
function PostItem({post, did}: {post: LeafletDocument; did: string}) {
  const date = new Date(post.publishedAt)
  const coverUrl = post.coverImage
    ? `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${post.coverImage.ref.$link}@jpeg`
    : null

  return (
    <li className="post-list-item">
      <a
        href={`/posts/${post.rkey}`}
        className="group flex gap-4 py-5">

        {/* Thumbnail */}
        <div className="w-11 h-[60px] flex-shrink-0 rounded overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={post.title}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-base">
              ✏️
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-display text-[1.45rem] text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
              {post.title}
            </h3>
            <time
              className="font-mono-dm text-[10px] uppercase tracking-wider text-zinc-700 flex-shrink-0"
              dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
            </time>
          </div>

          {post.description && (
            <p className="font-mono-dm text-xs text-zinc-500 leading-relaxed line-clamp-2">
              {post.description}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {post.tags.map(tag => (
                <span key={tag} className="post-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </a>
    </li>
  )
}

/* ── Reviews Section ── */
const CATEGORY_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  book: 'Book',
  game: 'Game',
  music: 'Music',
}

function ReviewsSection({reviews}: {reviews: PopfeedReview[]}) {
  const [activeType, setActiveType] = useState<string | null>(null)

  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>()
    reviews.forEach(r => { if (r.creativeWorkType) typeSet.add(r.creativeWorkType) })
    return Array.from(typeSet).sort()
  }, [reviews])

  const filteredReviews = useMemo(() => {
    if (!activeType) return reviews
    return reviews.filter(r => r.creativeWorkType === activeType)
  }, [reviews, activeType])

  return (
    <section id="reviews" className="mb-14">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-5">
        <span className="font-mono-dm text-[10px] tracking-[0.2em] uppercase text-zinc-700">
          Recently watched & read
        </span>
        <span className="font-mono-dm text-[10px] tracking-[0.1em] uppercase text-zinc-700">
          {filteredReviews.length} items
        </span>
      </div>

      {availableTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setActiveType(null)}
            className={`tag-pill ${activeType === null ? 'active' : ''}`}>
            all
          </button>
          {availableTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`tag-pill ${activeType === type ? 'active' : ''}`}>
              {CATEGORY_LABELS[type] ?? type}
            </button>
          ))}
        </div>
      )}

      <ul>
        {filteredReviews.map(review => (
          <ReviewItem review={review} key={`review-${review.rkey}`} />
        ))}
      </ul>
    </section>
  )
}

/* ── Review Item ── */
function ReviewItem({review}: {review: PopfeedReview}) {
  const date = new Date(review.addedAt)
  const typeEmoji =
    review.creativeWorkType === 'book' ? '📚' :
    review.creativeWorkType === 'movie' ? '🎬' :
    review.creativeWorkType === 'tv' ? '📺' :
    review.creativeWorkType === 'game' ? '🎮' :
    review.creativeWorkType === 'music' ? '🎵' : '🎞️'

  return (
    <li className="post-list-item">
      <a
        href={`/reviews/${review.rkey}`}
        className="group flex gap-4 py-5">

        {/* Poster */}
        <div className="w-11 h-[60px] flex-shrink-0 rounded overflow-hidden">
          {review.posterUrl ? (
            <img
              src={review.posterUrl}
              alt={review.title}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-base">
              {typeEmoji}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-display text-[1.3rem] text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
              {typeEmoji} {review.title}
            </h3>
            {review.releaseDate && (
              <span className="font-mono-dm text-[10px] text-zinc-700">
                {new Date(review.releaseDate).getFullYear()}
              </span>
            )}
            <time
              className="font-mono-dm text-[10px] uppercase tracking-wider text-zinc-700 flex-shrink-0"
              dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
            </time>
          </div>

          {review.mainCredit && (
            <p className="font-mono-dm text-xs text-zinc-500">
              {review.mainCreditRole === 'author' ? 'by' : 'dir.'} {review.mainCredit}
            </p>
          )}

          {review.rating && (
            <div className="flex items-center gap-0.5">
              {Array.from({length: 5}, (_, i) => (
                <span
                  key={i}
                  className={`text-sm ${i < Math.round(review.rating! / 2) ? 'text-[#5EA2FF]' : 'text-zinc-800'}`}>
                  ★
                </span>
              ))}
            </div>
          )}

          {review.genres && review.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {review.genres.slice(0, 3).map(genre => (
                <span key={genre} className="post-tag">{genre}</span>
              ))}
            </div>
          )}
        </div>
      </a>
    </li>
  )
}
