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
    {title: "mutho. — writing random stuff"},
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
  const [activeReviewType, setActiveReviewType] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach(item => item.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (!activeTag) return items
    return items.filter(item => item.tags?.includes(activeTag))
  }, [items, activeTag])

  const availableReviewTypes = useMemo(() => {
    const typeSet = new Set<string>()
    reviews.forEach(r => {if (r.creativeWorkType) typeSet.add(r.creativeWorkType)})
    return Array.from(typeSet).sort()
  }, [reviews])

  const filteredReviews = useMemo(() => {
    if (!activeReviewType) return reviews
    return reviews.filter(r => r.creativeWorkType === activeReviewType)
  }, [reviews, activeReviewType])

  // Stats
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    items.forEach(item => item.tags?.forEach(t => { counts[t] = (counts[t] || 0) + 1 }))
    return counts
  }, [items])

  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:block w-[200px] shrink-0 border-r border-[#1e1e1e] px-4 py-6">
        {/* Filter */}
        <p className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555] mb-2.5">Filter</p>
        <div className="flex flex-wrap gap-1 mb-5">
          <FilterTag active={activeTag === null} onClick={() => setActiveTag(null)}>All</FilterTag>
          <FilterTag active={activeTag === 'blog'} onClick={() => setActiveTag('blog')}>Blog</FilterTag>
          <FilterTag active={activeTag === 'review'} onClick={() => setActiveTag('review')}>Review</FilterTag>
          {allTags.filter(t => t !== 'blog' && t !== 'review').map(tag => (
            <FilterTag key={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)}>
              {tag}
            </FilterTag>
          ))}
        </div>

        {/* Recent sidebar */}
        <p className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555] mb-2 mt-4">Recent</p>
        {items.slice(0, 5).map(item => (
          <a
            key={item.rkey}
            href={`/posts/${item.rkey}`}
            className="block py-1.5 border-b border-[#1e1e1e] group last:border-0">
            <div className="font-mono text-[16px] text-[#b0b0b0] group-hover:text-[#4a9eff] transition-colors truncate">
              {item.title}
            </div>
            <div className="font-mono text-[12px] text-[#555] mt-0.5">
              {new Date(item.publishedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
            </div>
          </a>
        ))}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 px-6 md:px-8 py-7 min-w-0">
        {/* Hero */}
        <section className="mb-7">
          <h1 className="font-display text-[38px] md:text-[40px] text-[#f0f0f0] leading-tight tracking-[-0.02em]">
            It's Mutho<span className="text-[#4a9eff]">.</span>
          </h1>
          <p className="font-mono text-[15px] text-[#555] mt-1">Just writing random stuff here.</p>
        </section>

        {/* Posts section */}
        <section className="mb-8">
          <div className="flex items-center justify-between border-t border-[#222] pt-3 mb-3">
            <span className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555]">Recent Writing</span>
            <span className="font-mono text-[13px] text-[#555]">{filteredItems.length} Posts</span>
          </div>

          {/* Mobile tag filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 lg:hidden">
              <FilterTag active={activeTag === null} onClick={() => setActiveTag(null)}>All</FilterTag>
              {allTags.map(tag => (
                <FilterTag key={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)}>
                  {tag}
                </FilterTag>
              ))}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <p className="font-mono text-[15px] text-[#444] py-4">No posts yet.</p>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]">
              {filteredItems.map(item => (
                <PostItem post={item} did={did} key={`post-${item.rkey}`} />
              ))}
            </ul>
          )}
        </section>

        {/* Reviews section */}
        {reviews.length > 0 && (
          <section>
            <div className="flex items-center justify-between border-t border-[#222] pt-3 mb-3">
              <span className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555]">Recently Watched &amp; Read</span>
              <span className="font-mono text-[13px] text-[#555]">{filteredReviews.length} Items</span>
            </div>

            {availableReviewTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <FilterTag active={activeReviewType === null} onClick={() => setActiveReviewType(null)}>All</FilterTag>
                {availableReviewTypes.map(type => (
                  <FilterTag key={type} active={activeReviewType === type} onClick={() => setActiveReviewType(type)}>
                    {CATEGORY_LABELS[type] ?? type}
                  </FilterTag>
                ))}
              </div>
            )}

            <ul className="divide-y divide-[#1a1a1a]">
              {filteredReviews.map(review => (
                <ReviewItem review={review} key={`review-${review.rkey}`} />
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* ── Right Sidebar ── */}
      <aside className="hidden xl:block w-[200px] shrink-0 border-l border-[#1e1e1e] px-4 py-6">
        <p className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555] mb-3">Stats</p>
        <div className="mb-4">
          <div className="font-display text-[35px] text-[#f0f0f0]">{items.length}</div>
          <div className="font-mono text-[12px] text-[#555] mt-0.5">Posts written</div>
        </div>
        <div className="mb-5">
          <div className="font-display text-[35px] text-[#f0f0f0]">{reviews.length}</div>
          <div className="font-mono text-[12px] text-[#555] mt-0.5">Reviews</div>
        </div>

        {Object.keys(tagCounts).length > 0 && (
          <>
            <p className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555] mb-2 mt-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(tagCounts).map(([tag]) => (
                <span
                  key={tag}
                  className="font-mono text-[16px] text-[#888] border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </aside>

    </div>
  )
}

/* ── Sub-components ── */

function FilterTag({active, onClick, children}: {active: boolean; onClick: () => void; children: React.ReactNode}) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[16px] px-2.5 py-1 rounded-full border transition-all ${
        active
          ? 'bg-[#1e1e1e] text-[#f0f0f0] border-[#4a9eff]'
          : 'bg-[#1a1a1a] text-[#888] border-[#2a2a2a] hover:text-[#f0f0f0] hover:border-[#555]'
      }`}>
      {children}
    </button>
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
        className="group flex gap-3 py-3 -mx-2 px-2 rounded transition-colors hover:bg-[#111]">
        <div className="w-11 h-11 shrink-0 rounded bg-[#1a1a1a] border border-[#222] overflow-hidden flex items-center justify-center">
          {coverUrl ? (
            <img src={coverUrl} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <span className="text-[#444] text-xs">✏️</span>
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-display text-[16px] text-[#e0e0e0] group-hover:text-[#4a9eff] transition-colors leading-snug">
            {post.title}
          </h3>
          <time className="font-mono text-[12px] text-[#555]" dateTime={date.toISOString()}>
            {date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
          </time>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {post.tags.map(tag => (
                <span key={tag} className="font-mono text-[18px] text-[#4a9eff]">{tag}</span>
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
  music: 'Music',
}

const TYPE_EMOJI: Record<string, string> = {
  book: '📚',
  movie: '🎬',
  tv: '📺',
  game: '🎮',
  music: '🎵',
}

function ReviewItem({review}: {review: PopfeedReview}) {
  const date = new Date(review.addedAt)
  const emoji = TYPE_EMOJI[review.creativeWorkType ?? ''] ?? '🎞️'

  return (
    <li>
      <a
        href={`/reviews/${review.rkey}`}
        className="group flex gap-3 py-3 -mx-2 px-2 rounded transition-colors hover:bg-[#111]">
        <div className="w-8 h-[46px] shrink-0 rounded bg-[#1a1a1a] border border-[#222] overflow-hidden flex items-center justify-center">
          {review.posterUrl ? (
            <img src={review.posterUrl} alt={review.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <span className="text-[16px]">{emoji}</span>
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-display text-[18px] text-[#e0e0e0] group-hover:text-[#4a9eff] transition-colors leading-snug">
            {emoji} {review.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {review.creativeWorkType && (
              <span className="font-mono text-[18px] text-[#555]">
                {CATEGORY_LABELS[review.creativeWorkType] ?? review.creativeWorkType}
              </span>
            )}
            <span className="font-mono text-[18px] text-[#444]">·</span>
            <time className="font-mono text-[12px] text-[#555]" dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
            </time>
          </div>
          {review.mainCredit && (
            <p className="font-mono text-[18px] text-[#555]">
              {review.mainCreditRole === 'author' ? 'by' : 'dir.'} {review.mainCredit}
            </p>
          )}
          {review.rating && (
            <div className="flex items-center gap-0.5">
              {Array.from({length: 5}, (_, i) => (
                <span key={i} className={`text-[16px] ${i < Math.round(review.rating! / 2) ? 'text-[#4a9eff]' : 'text-[#333]'}`}>★</span>
              ))}
            </div>
          )}
        </div>
      </a>
    </li>
  )
}
