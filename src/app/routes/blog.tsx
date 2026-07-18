import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto/index.js'
import {getReviews, PopfeedReview} from '../../atproto/getReviews.js'
import {getDid} from '../../atproto/getDid.js'
import {useLoaderData} from '@remix-run/react'
import {useMemo, useState} from 'react'
import {LeafletDocument} from 'src/types'
import {StarRating} from '../components/star-rating'

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

const SOCIALS = [
  {icon: '🦋', label: 'Bluesky',  href: 'https://bsky.app/profile/mutho.my.id'},
  {icon: '💬', label: 'Discord',  href: 'https://discord.gg/DNcNBQaqgM'},
  {icon: '🌾', label: 'Grain', href: 'https://grain.social/profile/mutho.my.id'},
  {icon: '🎵', label: 'Spotify',  href: 'https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8'},
  {icon: '🎮', label: 'Steam',    href: 'https://steamcommunity.com/id/moebatsu'},
  {icon: '✉️', label: 'Email',    href: 'mailto:amuthohhari@gmail.com'},
]

const CATEGORY_LABELS: Record<string, string> = {
  movie: 'Movie', tv: 'TV Show', book: 'Book', game: 'Game', music: 'Music',
}

type Kind = 'post' | 'review'
type FeedEntry = {
  key: string
  kind: Kind
  href: string
  title: string
  date: Date
  meta: string
  excerpt?: string
  rating?: number
}

const TABS: {id: 'all' | Kind; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'post', label: 'Blogs'},
  {id: 'review', label: 'Reviews'},
]

export default function Blog() {
  const {posts, reviews} = useLoaderData<{posts: LeafletDocument[]; did: string; reviews: PopfeedReview[]}>()
  const [activeTab, setActiveTab] = useState<'all' | Kind>('all')

  const entries: FeedEntry[] = useMemo(() => {
    const postEntries: FeedEntry[] = posts.map(p => ({
      key: `post-${p.rkey}`,
      kind: 'post',
      href: `/posts/${p.rkey}`,
      title: p.title,
      date: new Date(p.publishedAt),
      meta: p.tags?.[0] ? p.tags[0] : 'Blog',
      excerpt: p.description,
    }))
    const reviewEntries: FeedEntry[] = reviews.map(r => ({
      key: `review-${r.rkey}`,
      kind: 'review',
      href: `/reviews/${r.rkey}`,
      title: r.title,
      date: new Date(r.addedAt),
      meta: CATEGORY_LABELS[r.creativeWorkType] ?? r.creativeWorkType ?? 'Review',
      rating: r.rating,
    }))
    return [...postEntries, ...reviewEntries].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [posts, reviews])

  const filtered = useMemo(
    () => (activeTab === 'all' ? entries : entries.filter(e => e.kind === activeTab)),
    [entries, activeTab],
  )

  const counts = useMemo(() => ({
    all: entries.length,
    post: entries.filter(e => e.kind === 'post').length,
    review: entries.filter(e => e.kind === 'review').length,
  }), [entries])

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
        <div className="w-full max-w-3xl px-8 md:px-14 py-10">

          {/* Hero */}
          <section className="mb-10">
            <h1 className="font-display text-[42px] md:text-[46px] text-[#f0f0f0] leading-tight tracking-[-0.02em]">
              It's Mutho<span className="text-[#4a9eff]">.</span>
            </h1>
            <p className="font-mono text-[17px] text-[#aaaaaa] mt-2">Just writing random stuff here.</p>
          </section>

          {/* Tab switcher */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#141414] border border-[#222] mb-8">
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

          {/* Feed */}
          {filtered.length === 0 ? (
            <p className="font-mono text-[17px] text-[#444] py-4">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]">
              {filtered.map(entry => <FeedItem entry={entry} key={entry.key} />)}
            </ul>
          )}
        </div>
      </div>

      {/* ── Right Sidebar: kosong (sticky, untuk simetri layout) ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 border-l border-[#1e1e1e] sticky top-[52px] self-start h-[calc(100vh-52px)]" />

    </div>
  )
}

/* ── Sub-components ── */

function FeedItem({entry}: {entry: FeedEntry}) {
  return (
    <li>
      <a href={entry.href} className="group block py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-[22px] md:text-[24px] text-[#f0f0f0] group-hover:text-[#4a9eff] transition-colors leading-snug">
            {entry.title}
          </h3>
          <time
            className="font-mono text-[13px] text-[#666] shrink-0"
            dateTime={entry.date.toISOString()}>
            {entry.date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
          </time>
        </div>
        <div className="flex items-center gap-2 font-mono text-[13px] text-[#666] mt-1.5">
          <span className="uppercase tracking-[0.06em] text-[11px] text-[#555]">{entry.meta}</span>
          {entry.rating != null && (
            <>
              <span className="text-[#333]">·</span>
              <StarRating rating={entry.rating} size={12} filledClassName="text-[#4a9eff]" emptyClassName="text-[#333]" />
            </>
          )}
        </div>
        {entry.excerpt && (
          <p className="font-sans text-[15px] text-[#888] leading-relaxed line-clamp-1 mt-2">
            {entry.excerpt}
          </p>
        )}
      </a>
    </li>
  )
}
