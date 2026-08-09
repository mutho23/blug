import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto/index.js'
import {getDid} from '../../atproto/getDid.js'
import {Link, useLoaderData, useNavigation} from '@remix-run/react'
import {useMemo, useState, useEffect} from 'react'
import type {CSSProperties} from 'react'
import {LeafletDocument, LeafletBlock} from 'src/types'
import {NowPlayingWidget} from '../components/now-playing-widget.js'

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
    const rawPosts = await getPosts(undefined)
    const posts = rawPosts.map(p => ({
      ...p,
      description: p.description?.slice(0, 180),
    }))
    return json({posts, did: getDid()})
  } catch (err) {
    console.error('Blog loader error:', err)
    return json({posts: [], did: getDid()})
  }
}

export const meta: MetaFunction = () => [
  {title: 'Blog | mutho.'},
  {name: 'description', content: 'thoughts and vibes from mutho'},
]

type FeedEntry = {
  key: string
  href: string
  title: string
  date: Date
  meta: string
  tags: string[]
  excerpt?: string
  readingMinutes?: number
}

export default function Blog() {
  const {posts} = useLoaderData<{posts: LeafletDocument[]; did: string}>()
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const navigation = useNavigation()
  const isLoadingRoute = navigation.state === 'loading'

  const entries: FeedEntry[] = useMemo(() => {
    return posts
      .map(p => ({
        key: `post-${p.rkey}`,
        href: `/posts/${p.rkey}`,
        title: p.title,
        date: new Date(p.publishedAt),
        meta: p.tags?.[0] ? p.tags[0] : 'Blog',
        tags: p.tags ?? [],
        excerpt: p.description,
        readingMinutes: estimateReadingMinutes(p),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [posts])

  const allTags = useMemo(() => {
    const seen = new Map<string, string>() // lowercase -> display label
    entries.forEach(e => e.tags.forEach(t => {
      const key = t.toLowerCase()
      if (!seen.has(key)) seen.set(key, t)
    }))
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
  }, [entries])

  // Kalau tag yang lagi aktif nggak relevan lagi (mis. daftar entri berubah), lepas filternya.
  useEffect(() => {
    if (activeTag && !allTags.some(t => t.toLowerCase() === activeTag.toLowerCase())) {
      setActiveTag(null)
    }
  }, [allTags, activeTag])

  const filtered = useMemo(() => {
    if (!activeTag) return entries
    const key = activeTag.toLowerCase()
    return entries.filter(e => e.tags.some(t => t.toLowerCase() === key))
  }, [entries, activeTag])

  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

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
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
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

      {/* ── Right Sidebar: Now Playing (real Spotify data) ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 border-l border-[#1e1e1e] px-5 py-10 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
        <NowPlayingWidget className="mb-8" />
      </aside>

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
          <span className="uppercase tracking-[0.06em] text-[11px] text-[#555]">
            {entry.tags.length > 0 ? entry.tags.join(' · ') : 'Blog'}
          </span>
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
