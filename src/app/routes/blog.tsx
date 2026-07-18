import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto/index.js'
import {getReviews, PopfeedReview} from '../../atproto/getReviews.js'
import {getDid} from '../../atproto/getDid.js'
import {useLoaderData} from '@remix-run/react'
import {useMemo, useState, useRef, useEffect} from 'react'
import {LeafletDocument} from 'src/types'
import {StarRating} from '../components/star-rating'

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
    posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    reviews.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    return json({items: posts, did: getDid(), reviews})
  } catch (err) {
    console.error('Index loader error:', err)
    return json({items: [], did: getDid(), reviews: []})
  }
}

export const meta: MetaFunction = () => [
  {title: 'mutho. — writing random stuff'},
  {name: 'description', content: 'thoughts and vibes from mutho'},
]

const SOCIALS = [
  {icon: '🦋', label: 'Bluesky',       href: 'https://bsky.app/profile/mutho.my.id'},
  {icon: '💬', label: 'Discord',        href: 'https://discord.gg/DNcNBQaqgM'},
  {icon: '🌾', label: 'Grain', href: 'https://grain.social/profile/mutho.my.id'},
  {icon: '🎵', label: 'Spotify',        href: 'https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8'},
  {icon: '🎮', label: 'Steam',          href: 'https://steamcommunity.com/id/moebatsu'},
  {icon: '✉️', label: 'Email',          href: 'mailto:amuthohhari@gmail.com'},
]

const CATEGORY_LABELS: Record<string, string> = {
  movie: 'Movie', tv: 'TV Show', book: 'Book', game: 'Game', music: 'Music',
}
const TYPE_EMOJI: Record<string, string> = {
  book: '📚', movie: '🎬', tv: '📺', game: '🎮', music: '🎵',
}

export default function Index() {
  const {items, did, reviews} = useLoaderData<{items: FeedItem[]; did: string; reviews: PopfeedReview[]}>()

  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeReviewType, setActiveReviewType] = useState<string | null>(null)
  const [postDropdownOpen, setPostDropdownOpen] = useState(false)
  const [reviewDropdownOpen, setReviewDropdownOpen] = useState(false)
  const postRef = useRef<HTMLDivElement>(null)
  const reviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (postRef.current && !postRef.current.contains(e.target as Node)) setPostDropdownOpen(false)
      if (reviewRef.current && !reviewRef.current.contains(e.target as Node)) setReviewDropdownOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    items.forEach(i => i.tags?.forEach(t => s.add(t)))
    return Array.from(s).sort()
  }, [items])

  const allReviewTags = useMemo(() => {
    const s = new Set<string>()
    reviews.forEach(r => r.tags?.forEach((t: string) => s.add(t)))
    return Array.from(s).sort()
  }, [reviews])

  const availableReviewTypes = useMemo(() => {
    const s = new Set<string>()
    reviews.forEach(r => { if (r.creativeWorkType) s.add(r.creativeWorkType) })
    return Array.from(s).sort()
  }, [reviews])

  const filteredItems = useMemo(() => activeTag ? items.filter(i => i.tags?.includes(activeTag)) : items, [items, activeTag])
  const filteredReviews = useMemo(() => activeReviewType ? reviews.filter(r => r.creativeWorkType === activeReviewType) : reviews, [reviews, activeReviewType])

  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* ── Left Sidebar: Contact (sticky) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-[#1e1e1e] px-5 py-6 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
        <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#aaaaaa] mb-3">Contact</p>
        {SOCIALS.map(({icon, label, href}) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2.5 border-b border-[#1a1a1a] last:border-0 group">
            <div className="w-[22px] h-[22px] rounded bg-[#1a1a1a] flex items-center justify-center text-[12px] shrink-0">
              {icon}
            </div>
            <span className="font-mono text-[14px] text-[#cccccc] group-hover:text-white transition-colors truncate">
              {label}
            </span>
          </a>
        ))}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 flex justify-center">
      <div className="w-full max-w-5xl px-8 md:px-14 py-8">
        {/* Hero */}
        <section className="mb-9">
          <h1 className="font-display text-[42px] md:text-[46px] text-[#f0f0f0] leading-tight tracking-[-0.02em]">
            It's Mutho<span className="text-[#4a9eff]">.</span>
          </h1>
          <p className="font-mono text-[17px] text-[#aaaaaa] mt-2">Just writing random stuff here.</p>
        </section>

        {/* Posts section */}
        <section className="mb-10">
          <div className="flex items-center justify-between border-t border-[#222] pt-4 mb-4">
            <span className="font-mono text-[14px] tracking-[0.12em] uppercase text-[#aaaaaa]">Recent Blogs</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[14px] text-[#aaaaaa]">{filteredItems.length} Posts</span>
              {allTags.length > 0 && (
                <div className="relative" ref={postRef}>
                  <button
                    onClick={() => setPostDropdownOpen(p => !p)}
                    className={`font-mono text-[13px] uppercase tracking-[0.08em] px-3 py-1.5 rounded border transition-all ${
                      activeTag ? 'text-[#4a9eff] border-[#4a9eff] bg-[#1e1e1e]' : 'text-[#555] border-[#2a2a2a] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#555]'
                    }`}>
                    {activeTag ?? 'Filter'} ▾
                  </button>
                  {postDropdownOpen && (
                    <div className="absolute right-0 mt-1 bg-[#141414] border border-[#2a2a2a] rounded-md shadow-xl z-10 min-w-[130px] py-1">
                      <button onClick={() => { setActiveTag(null); setPostDropdownOpen(false) }}
                        className={`w-full text-left font-mono text-[14px] px-3 py-2 transition-colors ${activeTag === null ? 'text-[#4a9eff] bg-[#1a1a1a]' : 'text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'}`}>
                        All
                      </button>
                      {allTags.map(tag => (
                        <button key={tag} onClick={() => { setActiveTag(tag); setPostDropdownOpen(false) }}
                          className={`w-full text-left font-mono text-[14px] px-3 py-2 transition-colors ${activeTag === tag ? 'text-[#4a9eff] bg-[#1a1a1a]' : 'text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'}`}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <p className="font-mono text-[17px] text-[#444] py-4">No posts yet.</p>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]">
              {filteredItems.map(item => <PostItem post={item} did={did} key={`post-${item.rkey}`} />)}
            </ul>
          )}
        </section>

        {/* Reviews section */}
        {reviews.length > 0 && (
          <section>
            <div className="flex items-center justify-between border-t border-[#222] pt-4 mb-4">
              <span className="font-mono text-[14px] tracking-[0.12em] uppercase text-[#aaaaaa]">Recent Reviews</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[14px] text-[#aaaaaa]">{filteredReviews.length} Items</span>
                {availableReviewTypes.length > 0 && (
                  <div className="relative" ref={reviewRef}>
                    <button
                      onClick={() => setReviewDropdownOpen(p => !p)}
                      className={`font-mono text-[13px] uppercase tracking-[0.08em] px-3 py-1.5 rounded border transition-all ${
                        activeReviewType ? 'text-[#4a9eff] border-[#4a9eff] bg-[#1e1e1e]' : 'text-[#555] border-[#2a2a2a] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#555]'
                      }`}>
                      {activeReviewType ? (CATEGORY_LABELS[activeReviewType] ?? activeReviewType) : 'Filter'} ▾
                    </button>
                    {reviewDropdownOpen && (
                      <div className="absolute right-0 mt-1 bg-[#141414] border border-[#2a2a2a] rounded-md shadow-xl z-10 min-w-[130px] py-1">
                        <button onClick={() => { setActiveReviewType(null); setReviewDropdownOpen(false) }}
                          className={`w-full text-left font-mono text-[14px] px-3 py-2 transition-colors ${activeReviewType === null ? 'text-[#4a9eff] bg-[#1a1a1a]' : 'text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'}`}>
                          All
                        </button>
                        {availableReviewTypes.map(type => (
                          <button key={type} onClick={() => { setActiveReviewType(type); setReviewDropdownOpen(false) }}
                            className={`w-full text-left font-mono text-[14px] px-3 py-2 transition-colors ${activeReviewType === type ? 'text-[#4a9eff] bg-[#1a1a1a]' : 'text-[#888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'}`}>
                            {CATEGORY_LABELS[type] ?? type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <ul className="divide-y divide-[#1a1a1a]">
              {filteredReviews.map(review => <ReviewItem review={review} key={`review-${review.rkey}`} />)}
            </ul>
          </section>
        )}
      </div>
      </div>

      {/* ── Right Sidebar: Stats + Tags (sticky) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-l border-[#1e1e1e] px-5 py-6 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
        {/* Stats */}
        <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#aaaaaa] mb-3">Stats</p>
        <div className="mb-3">
          <div className="font-display text-[36px] text-[#f0f0f0] leading-none">{items.length}</div>
          <div className="font-mono text-[12px] text-[#aaaaaa] mt-1">Blogs written</div>
        </div>
        <div className="mb-6 pb-6 border-b border-[#1a1a1a]">
          <div className="font-display text-[36px] text-[#f0f0f0] leading-none">{reviews.length}</div>
          <div className="font-mono text-[12px] text-[#aaaaaa] mt-1">Reviews</div>
        </div>

        {/* Post Tags */}
        {allTags.length > 0 && (
          <div className="mb-6 pb-6 border-b border-[#1a1a1a]">
            <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#aaaaaa] mb-3">Blog Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`font-mono text-[12px] px-2.5 py-1 rounded-full border transition-all ${
                    activeTag === tag
                      ? 'text-[#4a9eff] border-[#4a9eff] bg-[#1e1e1e]'
                      : 'text-[#666] border-[#2a2a2a] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#555]'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Review Tags */}
        {availableReviewTypes.length > 0 && (
          <div>
            <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#aaaaaa] mb-3">Review Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {availableReviewTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setActiveReviewType(activeReviewType === type ? null : type)}
                  className={`font-mono text-[12px] px-2.5 py-1 rounded-full border transition-all ${
                    activeReviewType === type
                      ? 'text-[#4a9eff] border-[#4a9eff] bg-[#1e1e1e]'
                      : 'text-[#666] border-[#2a2a2a] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#555]'
                  }`}>
                  {CATEGORY_LABELS[type] ?? type}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

    </div>
  )
}

/* ── Sub-components ── */

function PostItem({post, did}: {post: LeafletDocument; did: string}) {
  const date = new Date(post.publishedAt)
  const coverUrl = post.coverImage
    ? `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${post.coverImage.ref.$link}@jpeg`
    : null
  return (
    <li>
      <a href={`/posts/${post.rkey}`} className="group flex gap-5 py-6 -mx-2 px-2 rounded transition-colors hover:bg-[#111]">
        <div className="w-24 h-24 shrink-0 rounded-md bg-[#1a1a1a] border border-[#222] overflow-hidden flex items-center justify-center">
          {coverUrl
            ? <img src={coverUrl} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            : <span className="text-[#444] text-2xl">✏️</span>}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="font-display text-[24px] text-[#f0f0f0] group-hover:text-[#4a9eff] transition-colors leading-snug">{post.title}</h3>
          <time className="font-mono text-[15px] text-[#aaaaaa]" dateTime={date.toISOString()}>
            {date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
          </time>
          {post.description && (
            <p className="font-sans text-[16px] text-[#888] leading-relaxed line-clamp-2">{post.description}</p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-0.5">
              {post.tags.map(tag => <span key={tag} className="font-mono text-[13px] text-[#4a9eff]">{tag}</span>)}
            </div>
          )}
        </div>
      </a>
    </li>
  )
}

function ReviewItem({review}: {review: PopfeedReview}) {
  const date = new Date(review.addedAt)
  const emoji = TYPE_EMOJI[review.creativeWorkType ?? ''] ?? '🎞️'
  return (
    <li>
      <a href={`/reviews/${review.rkey}`} className="group flex gap-5 py-6 -mx-2 px-2 rounded transition-colors hover:bg-[#111]">
        <div className="w-[72px] h-[108px] shrink-0 rounded-md bg-[#1a1a1a] border border-[#222] overflow-hidden flex items-center justify-center">
          {review.posterUrl
            ? <img src={review.posterUrl} alt={review.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            : <span className="text-[24px]">{emoji}</span>}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <h3 className="font-display text-[24px] text-[#f0f0f0] group-hover:text-[#4a9eff] transition-colors leading-snug">{emoji} {review.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {review.creativeWorkType && <span className="font-mono text-[15px] text-[#4a9eff]">{CATEGORY_LABELS[review.creativeWorkType] ?? review.creativeWorkType}</span>}
            <span className="font-mono text-[15px] text-[#777]">·</span>
            <time className="font-mono text-[15px] text-[#aaaaaa]" dateTime={date.toISOString()}>
              {date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
            </time>
          </div>
          {review.mainCredit && (
            <p className="font-mono text-[15px] text-[#aaaaaa]">{review.mainCreditRole === 'author' ? 'by' : 'dir.'} {review.mainCredit}</p>
          )}
          {review.rating && (
            <StarRating rating={review.rating} size={16} filledClassName="text-[#4a9eff]" emptyClassName="text-[#333]" />
          )}
        </div>
      </a>
    </li>
  )
}
