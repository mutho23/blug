import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto/index.js'
import {getReviews, PopfeedReview} from '../../atproto/getReviews.js'
import {getDid} from '../../atproto/getDid.js'
import {Link, useLoaderData, useNavigation} from '@remix-run/react'
import {useMemo, useState, useEffect} from 'react'
import type {CSSProperties} from 'react'
import {LeafletDocument, LeafletBlock} from 'src/types'
import {StarRating} from '../components/star-rating'

// Walks a Leaflet document's blocks (including nested list children) and
// sums up the plaintext so we can estimate reading time — same content the
// reader will actually see on the post page, not just the trimmed excerpt.
function estimateReadingMinutes(doc: Pick<LeafletDocument, 'content'>): number {
  let words = 0
  const countText = (text?: string) => {
    if (!text) return
    words += text.trim().split(/\s+/).filter(Boolean).length
  }
  const walk = (blocks: LeafletBlock[]) => {
    for (const {block} of blocks) {
      switch (block.$type) {
        case 'pub.leaflet.blocks.text':
        case 'pub.leaflet.blocks.blockquote':
        case 'pub.leaflet.blocks.header':
        case 'pub.leaflet.blocks.code':
          countText(block.plaintext)
          break
        case 'pub.leaflet.blocks.list':
          for (const child of block.children.content) {
            if ('plaintext' in child) countText(child.plaintext)
          }
          break
        default:
          break
      }
    }
  }
  for (const page of doc.content?.pages ?? []) walk(page.blocks)
  return Math.max(1, Math.round(words / 200)) // ~200 wpm average reading speed
}

export const loader = async () => {
  try {
    const [rawPosts, reviews] = await Promise.all([
      getPosts(undefined),
      getReviews(),
    ])
    const posts = rawPosts.map(p => ({
      ...p,
      description: p.description?.slice(0, 180),
    }))
    return json({posts, did: getDid(), reviews})
  } catch (err) {
    console.error('Blog loader error:', err)
    return json({posts: [], did: getDid(), reviews: []})
  }
}

export const meta: MetaFunction = () => [
  {title: 'Blog | mutho.'},
  {name: 'description', content: 'thoughts and vibes from mutho'},
]

const CATEGORY_LABELS: Record<string, string> = {
  movie: 'Movie', tv: 'TV Show', tv_show: 'TV Show', book: 'Book', game: 'Game', music: 'Music',
}

type Kind = 'post' | 'review'
type FeedEntry = {
  key: string
  kind: Kind
  href: string
  title: string
  date: Date
  meta: string
  tags: string[]
  excerpt?: string
  rating?: number
  readingMinutes?: number
}

const TABS: {id: 'all' | Kind; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'post', label: 'Blogs'},
  {id: 'review', label: 'Reviews'},
]

export default function Blog() {
  const {posts, reviews} = useLoaderData<{posts: LeafletDocument[]; did: string; reviews: PopfeedReview[]}>()
  const [activeTab, setActiveTab] = useState<'all' | Kind>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const navigation = useNavigation()
  const isLoadingRoute = navigation.state === 'loading'

  const entries: FeedEntry[] = useMemo(() => {
    const postEntries: FeedEntry[] = posts.map(p => ({
      key: `post-${p.rkey}`,
      kind: 'post',
      href: `/posts/${p.rkey}`,
      title: p.title,
      date: new Date(p.publishedAt),
      meta: p.tags?.[0] ? p.tags[0] : 'Blog',
      tags: p.tags ?? [],
      excerpt: p.description,
      readingMinutes: estimateReadingMinutes(p),
    }))
    const reviewEntries: FeedEntry[] = reviews.map(r => {
      const categoryLabel = CATEGORY_LABELS[r.creativeWorkType] ?? r.creativeWorkType
      return {
        key: `review-${r.rkey}`,
        kind: 'review',
        href: `/reviews/${r.rkey}`,
        title: r.title,
        date: new Date(r.addedAt),
        meta: categoryLabel ?? 'Review',
        // Hanya pakai kategori resmi Popfeed (Book/Movie/TV Show/Game/Music) sebagai tag,
        // bukan tag bebas dari review.tags (biar nggak muncul tag liar kayak "netflix").
        tags: categoryLabel ? [categoryLabel] : [],
        rating: r.rating,
      }
    })
    return [...postEntries, ...reviewEntries].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [posts, reviews])

  const tagSourceEntries = useMemo(
    () => (activeTab === 'all' ? entries : entries.filter(e => e.kind === activeTab)),
    [entries, activeTab],
  )

  const allTags = useMemo(() => {
    const seen = new Map<string, string>() // lowercase -> display label
    tagSourceEntries.forEach(e => e.tags.forEach(t => {
      const key = t.toLowerCase()
      if (!seen.has(key)) seen.set(key, t)
    }))
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
  }, [tagSourceEntries])

  // Kalau ganti tab dan tag yang lagi aktif nggak relevan lagi di tab baru, lepas filternya.
  useEffect(() => {
    if (activeTag && !allTags.some(t => t.toLowerCase() === activeTag.toLowerCase())) {
      setActiveTag(null)
    }
  }, [allTags, activeTag])

  const filtered = useMemo(() => {
    let result = activeTab === 'all' ? entries : entries.filter(e => e.kind === activeTab)
    if (activeTag) {
      const key = activeTag.toLowerCase()
      result = result.filter(e => e.tags.some(t => t.toLowerCase() === key))
    }
    return result
  }, [entries, activeTab, activeTag])

  const counts = useMemo(() => ({
    all: entries.length,
    post: entries.filter(e => e.kind === 'post').length,
    review: entries.filter(e => e.kind === 'review').length,
  }), [entries])

  // Latest Popfeed entry per category, straight from real review data (not
  // hardcoded) — powers the sidebar widget below. Movie/TV Show/Book/Game are
  // the four Popfeed tracks; a category just renders an empty state until you
  // log something in it (e.g. game, which is empty until you start using it).
  const POPFEED_CATEGORIES: {key: string; label: string; match: (t: string) => boolean}[] = [
    {key: 'movie', label: 'Movie', match: t => t === 'movie'},
    {key: 'tv', label: 'TV Show', match: t => t === 'tv' || t === 'tv_show'},
    {key: 'book', label: 'Book', match: t => t === 'book'},
    {key: 'game', label: 'Game', match: t => t === 'game'},
  ]
  const latestByCategory = useMemo(() => {
    return POPFEED_CATEGORIES.map(cat => {
      const items = reviews
        .filter(r => cat.match(r.creativeWorkType))
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      return {...cat, latest: items[0] ?? null}
    })
  }, [reviews])

  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* ── Left Sidebar: quick jump to each tab ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 px-5 py-10">
        <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#666] mb-4">On this page</p>
        <ul className="flex flex-col gap-2.5">
          {TABS.map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`font-mono text-sm transition-colors ${
                  activeTab === tab.id ? 'text-[#4a9eff]' : 'text-[#666] hover:text-[#aaaaaa]'
                }`}>
                {tab.label} <span className="text-[#444]">({counts[tab.id]})</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-3xl px-8 md:px-14 py-10">

          {/* Hero */}
          <section className="mb-10">
            <h1 className="font-display text-[42px] md:text-[46px] text-[#f0f0f0] leading-tight tracking-[-0.02em]">
              Writing<span className="text-[#4a9eff]">.</span>
            </h1>
            <p className="font-mono text-[17px] text-[#aaaaaa] mt-2">Just writing random stuff here.</p>
          </section>

          {/* Tab switcher */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#141414] border border-[#222] mb-5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-mono text-[13px] tracking-[0.03em] px-3.5 py-1.5 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#232323] text-[#f0f0f0]'
                    : 'text-[#666] hover:text-[#aaaaaa]'
                }`}>
                {tab.label} <span className="text-[#555]">{counts[tab.id]}</span>
              </button>
            ))}
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag?.toLowerCase() === tag.toLowerCase() ? null : tag)}
                  className={`font-mono text-[12px] px-2.5 py-1 rounded-full border transition-all ${
                    activeTag?.toLowerCase() === tag.toLowerCase()
                      ? 'text-[#4a9eff] border-[#4a9eff] bg-[#1e1e1e]'
                      : 'text-[#666] border-[#2a2a2a] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#555]'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Feed */}
          {isLoadingRoute ? (
            <FeedSkeleton />
          ) : filtered.length === 0 ? (
            <div className="py-4">
              <p className="font-mono text-[17px] text-[#444]">Nothing here yet.</p>
              {(activeTag || activeTab !== 'all') && (
                <button
                  onClick={() => { setActiveTag(null); setActiveTab('all') }}
                  className="font-mono text-[13px] text-[#4a9eff] hover:text-[#7c6ff7] transition-colors mt-2">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]">
              {filtered.map((entry, i) => <FeedItem entry={entry} index={i} key={entry.key} />)}
            </ul>
          )}
        </div>
      </div>

      {/* ── Right Sidebar: Now Playing + latest Popfeed entries ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 border-l border-[#1e1e1e] px-5 py-10 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
        <NowPlayingWidget />
        <PopfeedWidget categories={latestByCategory} />
      </aside>

    </div>
  )
}

// NOTE ON DATA:
//  - Now Playing is still a static placeholder. Wiring it up means calling
//    Spotify's `/me/player/currently-playing` endpoint server-side in this
//    route's `loader` (needs a refresh-token stored in an env var), then
//    passing the track down like `posts`/`reviews` already are.
//  - The Popfeed widget below is already live — it reads straight from the
//    `reviews` data this route already loads via `getReviews()`, grouped by
//    creativeWorkType. Log something as "game" on Popfeed and it'll show up
//    here automatically, no code change needed.

const NOW_PLAYING = {title: 'Midnight City', artist: 'M83'}

function NowPlayingWidget() {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#666] mb-3">Now playing</p>
      <div className="flex items-center gap-3 rounded-xl border border-[#1e1e1e] bg-[#111111] p-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{background: 'linear-gradient(135deg, #7c6ff7, #4a9eff)'}}>
          🎵
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm text-[#f0f0f0] truncate">{NOW_PLAYING.title}</div>
          <div className="font-mono text-xs text-[#666] mt-0.5 truncate">{NOW_PLAYING.artist}</div>
        </div>
        <div className="flex items-end gap-[2px] h-3.5 shrink-0" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-[2px] bg-[#4a9eff] rounded-full"
              style={{animation: `eq 1s ease-in-out infinite`, animationDelay: `${-0.4 + i * 0.2}s`}}
            />
          ))}
        </div>
      </div>
      <style>{`@keyframes eq { 0%, 100% { height: 3px; } 50% { height: 14px; } }`}</style>
    </div>
  )
}

function PopfeedWidget({
  categories,
}: {
  categories: {key: string; label: string; latest: PopfeedReview | null}[]
}) {
  return (
    <div>
      <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#666] mb-3">From Popfeed</p>
      <ul className="flex flex-col">
        {categories.map(cat => (
          <li key={cat.key} className="flex gap-2.5 py-2.5 border-b border-[#1a1a1a] last:border-0">
            {cat.latest?.posterUrl ? (
              <img
                src={cat.latest.posterUrl}
                alt=""
                className="w-7 h-9 rounded-[3px] object-cover shrink-0 bg-[#141414] border border-[#222]"
              />
            ) : (
              <div className="w-7 h-9 rounded-[3px] bg-[#141414] border border-[#222] shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#4a9eff]">{cat.label}</div>
              {cat.latest ? (
                <>
                  <div className="font-mono text-sm text-[#f0f0f0] truncate mt-0.5">{cat.latest.title}</div>
                  {cat.latest.rating != null && (
                    <div className="mt-1">
                      <StarRating rating={cat.latest.rating} size={10} filledClassName="text-[#4a9eff]" emptyClassName="text-[#333]" />
                    </div>
                  )}
                </>
              ) : (
                <div className="font-mono text-xs text-[#555] mt-0.5">Belum ada</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Sub-components ── */

function FeedItem({entry, index}: {entry: FeedEntry; index: number}) {
  return (
    <li className="fade-up-item" style={{'--delay': `${Math.min(index, 8) * 0.06}s`} as CSSProperties}>
      <Link to={entry.href} prefetch="intent" className="group block py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="title-underline font-display text-[22px] md:text-[24px] text-[#f0f0f0] group-hover:text-[#4a9eff] transition-colors leading-snug">
            {entry.title}
          </h3>
          <time
            className="font-mono text-[13px] text-[#666] shrink-0"
            dateTime={entry.date.toISOString()}>
            {entry.date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
          </time>
        </div>
        <div className="flex items-center gap-2 font-mono text-[13px] text-[#666] mt-1.5">
          {entry.kind === 'post' ? (
            <span className="uppercase tracking-[0.06em] text-[11px] text-[#555]">
              {entry.tags.length > 0 ? entry.tags.join(' · ') : 'Blog'}
            </span>
          ) : (
            <span className="uppercase tracking-[0.06em] text-[11px] text-[#555]">{entry.meta}</span>
          )}
          {entry.rating != null && (
            <>
              <span className="text-[#333]">·</span>
              <StarRating rating={entry.rating} size={12} filledClassName="text-[#4a9eff]" emptyClassName="text-[#333]" />
            </>
          )}
          {entry.readingMinutes != null && (
            <>
              <span className="text-[#333]">·</span>
              <span className="text-[11px] text-[#555]">{entry.readingMinutes} min read</span>
            </>
          )}
        </div>
        {entry.excerpt && (
          <p className="font-sans text-[15px] text-[#888] leading-relaxed line-clamp-1 mt-2">
            {entry.excerpt}
          </p>
        )}
      </Link>
    </li>
  )
}

function FeedSkeleton() {
  return (
    <ul className="divide-y divide-[#1a1a1a]" aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <li key={i} className="py-6">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <div className="skeleton-line h-[22px] w-2/3" />
            <div className="skeleton-line h-[13px] w-12 shrink-0" />
          </div>
          <div className="skeleton-line h-[13px] w-1/4 mb-3" />
          <div className="skeleton-line h-[15px] w-4/5" />
        </li>
      ))}
    </ul>
  )
}
