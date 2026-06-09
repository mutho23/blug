import {json, MetaFunction} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import {PopfeedReview} from '../../atproto/getReviews.js'
import {getAnilistCurrentManga, AnilistManga} from '../../atproto/getAnilist.js'
import {getListItems, LIST_RKEYS} from '../../atproto/getList.js'

export const meta: MetaFunction = () => [
  {title: 'mutho. — now'},
  {name: 'description', content: 'What Mutho is currently up to'},
]

type NowData = {
  manga: AnilistManga[]
  currentReading: PopfeedReview[]
  currentWatching: PopfeedReview[]
  updatedAt: string
}

export const loader = async () => {
  const [manga, currentReading, currentWatching] = await Promise.all([
    getAnilistCurrentManga(),
    getListItems(LIST_RKEYS.currentReading),
    getListItems(LIST_RKEYS.currentWatching),
  ])

  // Only show the most recently updated manga
  const latestManga = manga.slice(0, 1)

  const data: NowData = {
    manga: latestManga,
    currentReading,
    currentWatching,
    updatedAt: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }

  return json(data)
}

const SOCIALS = [
  {icon: '🦋', label: 'Bluesky', href: 'https://bsky.app/profile/mutho.my.id'},
  {icon: '💬', label: 'Discord', href: 'https://discord.gg/dndVwwGhEa'},
  {icon: '🌾', label: 'Grain', href: 'https://grain.social/profile/mutho.my.id'},
  {icon: '🎵', label: 'Spotify', href: 'https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8'},
  {icon: '🎮', label: 'Steam', href: 'https://steamcommunity.com/id/moebatsu'},
  {icon: '✈️', label: 'Telegram', href: 'https://t.me/moebatsu'},
  {icon: '✉️', label: 'Email', href: 'mailto:amuthohhari@gmail.com'},
]

const TYPE_EMOJI: Record<string, string> = {
  book: '📚',
  movie: '🎬',
  tv: '📺',
  game: '🎮',
  music: '🎵',
}

export default function Now() {
  const {manga, currentReading, currentWatching, updatedAt} = useLoaderData<NowData>()

  const books = currentReading.filter(r => r.creativeWorkType === 'book')
  const games = currentReading.filter(r => r.creativeWorkType === 'game')
  const otherReading = currentReading.filter(r => r.creativeWorkType !== 'book' && r.creativeWorkType !== 'game')

  const movies = currentWatching.filter(r => r.creativeWorkType === 'movie')
  const tv = currentWatching.filter(r => r.creativeWorkType === 'tv' || r.creativeWorkType === 'anime')
  const otherWatching = currentWatching.filter(r => r.creativeWorkType !== 'movie' && r.creativeWorkType !== 'tv' && r.creativeWorkType !== 'anime')

  const totalItems = manga.length + currentReading.length + currentWatching.length

  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* Left Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex justify-center">
        <div className="w-full max-w-5xl px-8 md:px-14 py-8">

          {/* Hero */}
          <section className="mb-9">
            <h1 className="font-display text-[42px] md:text-[46px] text-[#f0f0f0] leading-tight tracking-[-0.02em]">
              Now<span className="text-[#4a9eff]">.</span>
            </h1>
            <p className="font-mono text-[15px] text-[#555] mt-2">
              What I'm currently into —{' '}
              <span className="text-[#3a7bd5]">updated {updatedAt}</span>
            </p>
          </section>

          {/* Manga (AniList — most recently updated) */}
          {manga.length > 0 && (
            <NowSection title="📖 Reading (Manga)" source="AniList" sourceUrl="https://anilist.co/user/moebatsu/mangalist">
              {manga.map(m => (
                <a key={m.id} href={m.siteUrl} target="_blank" rel="noopener noreferrer"
                  className="group flex gap-4 py-4 -mx-2 px-2 rounded hover:bg-[#111] transition-colors">
                  <div className="w-12 h-16 shrink-0 rounded bg-[#1a1a1a] border border-[#222] overflow-hidden">
                    <img src={m.coverImage} alt={m.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-col justify-center gap-1 min-w-0">
                    <p className="font-display text-[18px] text-[#f0f0f0] group-hover:text-[#4a9eff] transition-colors leading-snug truncate">{m.title}</p>
                    <p className="font-mono text-[13px] text-[#555]">
                      Ch. {m.progress}{m.totalChapters ? ` / ${m.totalChapters}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {m.genres.slice(0, 3).map(g => (
                        <span key={g} className="font-mono text-[11px] text-[#4a9eff]">{g}</span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </NowSection>
          )}

          {/* Books */}
          {books.length > 0 && (
            <NowSection title="📚 Reading (Books)" source="Popfeed" sourceUrl="https://popfeed.social/list/at:/did:plc:kxb2w63yrod2t65mlnecgrlu/social.popfeed.feed.list/3mduaqji7vs24">
              <ReviewList reviews={books} />
            </NowSection>
          )}

          {/* Games */}
          {games.length > 0 && (
            <NowSection title="🎮 Playing" source="Popfeed" sourceUrl="https://popfeed.social/list/at:/did:plc:kxb2w63yrod2t65mlnecgrlu/social.popfeed.feed.list/3mduaqji7vs24">
              <ReviewList reviews={games} />
            </NowSection>
          )}

          {/* Other reading types */}
          {otherReading.length > 0 && (
            <NowSection title="📖 Reading" source="Popfeed">
              <ReviewList reviews={otherReading} />
            </NowSection>
          )}

          {/* Movies */}
          {movies.length > 0 && (
            <NowSection title="🎬 Watching (Movies)" source="Popfeed" sourceUrl="https://popfeed.social/list/at:/did:plc:kxb2w63yrod2t65mlnecgrlu/social.popfeed.feed.list/3mntm5c7uc22f">
              <ReviewList reviews={movies} />
            </NowSection>
          )}

          {/* TV / Anime */}
          {tv.length > 0 && (
            <NowSection title="📺 Watching (TV / Anime)" source="Popfeed" sourceUrl="https://popfeed.social/list/at:/did:plc:kxb2w63yrod2t65mlnecgrlu/social.popfeed.feed.list/3mntm5c7uc22f">
              <ReviewList reviews={tv} />
            </NowSection>
          )}

          {/* Other watching */}
          {otherWatching.length > 0 && (
            <NowSection title="▶️ Watching" source="Popfeed">
              <ReviewList reviews={otherWatching} />
            </NowSection>
          )}

          {totalItems === 0 && (
            <p className="font-mono text-[17px] text-[#444] py-4">Nothing tracked yet.</p>
          )}

          <p className="font-mono text-[12px] text-[#333] mt-8">
            — inspired by{' '}
            <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer" className="text-[#444] hover:text-[#555] underline">
              nownownow.com
            </a>
          </p>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-l border-[#1e1e1e] px-5 py-6 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
        <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#aaaaaa] mb-3">Now</p>

        {[
          {label: 'Manga reading', count: manga.length},
          {label: 'Books', count: books.length},
          {label: 'Games', count: games.length},
          {label: 'Movies', count: movies.length},
          {label: 'TV / Anime', count: tv.length},
        ]
          .filter(s => s.count > 0)
          .map(({label, count}, i, arr) => (
            <div key={label} className={`mb-3 pb-3 ${i < arr.length - 1 ? 'border-b border-[#1a1a1a]' : ''}`}>
              <div className="font-display text-[36px] text-[#f0f0f0] leading-none">{count}</div>
              <div className="font-mono text-[12px] text-[#aaaaaa] mt-1">{label}</div>
            </div>
          ))}
      </aside>

    </div>
  )
}

function NowSection({
  title,
  source,
  sourceUrl,
  children,
}: {
  title: string
  source: string
  sourceUrl?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between border-t border-[#222] pt-4 mb-2">
        <span className="font-mono text-[14px] tracking-[0.12em] uppercase text-[#aaaaaa]">{title}</span>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
            className="font-mono text-[12px] text-[#333] hover:text-[#555] transition-colors">
            via {source} ↗
          </a>
        ) : (
          <span className="font-mono text-[12px] text-[#333]">via {source}</span>
        )}
      </div>
      <ul className="divide-y divide-[#1a1a1a]">{children}</ul>
    </section>
  )
}

function ReviewList({reviews}: {reviews: PopfeedReview[]}) {
  return (
    <>
      {reviews.map(r => {
        const emoji = TYPE_EMOJI[r.creativeWorkType] ?? '🎞️'
        return (
          <li key={r.rkey}>
            <a href={`/reviews/${r.rkey}`}
              className="group flex gap-4 py-4 -mx-2 px-2 rounded hover:bg-[#111] transition-colors">
              <div className="w-12 h-16 shrink-0 rounded bg-[#1a1a1a] border border-[#222] overflow-hidden flex items-center justify-center">
                {r.posterUrl
                  ? <img src={r.posterUrl} alt={r.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  : <span className="text-xl">{emoji}</span>}
              </div>
              <div className="flex flex-col justify-center gap-1 min-w-0">
                <p className="font-display text-[18px] text-[#f0f0f0] group-hover:text-[#4a9eff] transition-colors leading-snug truncate">
                  {r.title}
                </p>
                {r.mainCredit && (
                  <p className="font-mono text-[13px] text-[#555]">
                    {r.mainCreditRole === 'author' ? 'by' : 'dir.'} {r.mainCredit}
                  </p>
                )}
                {r.rating && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({length: 5}, (_, i) => (
                      <span key={i} className={`text-[13px] ${i < Math.round(r.rating! / 2) ? 'text-[#4a9eff]' : 'text-[#333]'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          </li>
        )
      })}
    </>
  )
}
