import {json, MetaFunction} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import {getNowPlaying, NowPlaying} from '../../spotify.server.js'

// Re-export shared layout components — in your project these should live in
// a shared file e.g. ~/components/ThreeColumnLayout.tsx and imported from there.
// For now they're duplicated here for clarity; see _index.tsx for full implementations.

export const loader = async () => {
  const nowPlaying = await getNowPlaying()
  return json({nowPlaying})
}

export const meta: MetaFunction = () => {
  return [
    {title: "About | Mutho's Blog"},
    {name: 'description', content: 'About Mutho — hanya seorang guru dan murid abadi'},
  ]
}

export default function About() {
  const {nowPlaying} = useLoaderData<{nowPlaying: NowPlaying}>()

  return (
    <ThreeColumnLayout nowPlaying={nowPlaying} rightContent={<AboutNav />}>
      <section className="mb-8 md:mb-10 flex flex-col gap-3">
        <h1 className="font-display text-4xl md:text-5xl text-950 leading-[1.05]">
          About Me<span className="text-600">.</span>
        </h1>
        <p className="text-lg leading-relaxed text-900 max-w-prose">
          Mutho (Muthohhar) is a coffee addict who loves to ramble about manga,
          anime, movies, books, JRPGs, philosophy, and psychology.
          This site is his personal space to write about whatever else is on his mind.
        </p>
      </section>

      <Section label="Work">
        <WorkItem company="Teacher" role="I love to learn & teach" period="2013 — Present" />
      </Section>

      <Section label="Community">
        <WorkItem
          company="ASHINA"
          href="https://discord.gg/dndVwwGhEa"
          role="Discord Server"
          period="Dec 2025 — Present"
        />
      </Section>

      <Section label="Elsewhere">
        <LinkItem name="Discord" href="https://discord.com/users/1134329616501309540" />
        <LinkItem name="Spotify" href="https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8?si=95240bc3a0ad4de8" />
        <LinkItem name="Steam" href="https://steamcommunity.com/id/moebatsu" />
        <LinkItem name="Popfeed" href="https://popfeed.social/profile/did:plc:kxb2w63yrod2t65mlnecgrlu" />
      </Section>
    </ThreeColumnLayout>
  )
}

// Right sidebar — quick nav for about sections
function AboutNav() {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">On this page</p>
      <div className="flex flex-col gap-1">
        {['Work', 'Community', 'Elsewhere'].map(section => (
          <a
            key={section}
            href={`#${section.toLowerCase()}`}
            className="px-3 py-1.5 rounded-lg font-mono text-[12px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all">
            {section}
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Shared layout (import from shared file in your project) ─────────────────

function ThreeColumnLayout({
  children,
  nowPlaying,
  rightContent,
}: {
  children: React.ReactNode
  nowPlaying: NowPlaying
  rightContent?: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 xl:grid-cols-[220px_1fr_220px] gap-8">
        <aside className="hidden xl:block">
          <div className="sticky top-8 flex flex-col gap-6">
            <ProfileCard />
            <NowPlayingCard nowPlaying={nowPlaying} />
          </div>
        </aside>
        <main className="min-w-0 pb-12">{children}</main>
        <aside className="hidden xl:block">
          <div className="sticky top-8">{rightContent}</div>
        </aside>
      </div>
    </div>
  )
}

function ProfileCard() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-mono text-zinc-300 shrink-0">
          M
        </div>
        <div>
          <p className="font-display text-base text-zinc-100 leading-tight">Mutho</p>
          <p className="font-mono text-[11px] text-zinc-500">mutho.my.id</p>
        </div>
      </div>
      <p className="font-sans text-[13px] text-zinc-400 leading-relaxed">
        Guru & murid abadi. Nulis soal code, manga, filosofi, & hal-hal kecil yang menarik.
      </p>
      <div className="flex flex-col gap-1.5">
        {[
          {label: 'Bluesky', href: 'https://bsky.app/profile/mutho.my.id', icon: '☁'},
          {label: 'GitHub', href: 'https://github.com/muthohhar', icon: '⌥'},
          {label: 'RSS', href: '/rss.xml', icon: '◉'},
        ].map(({label, href, icon}) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="flex items-center gap-2.5 font-mono text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors group">
            <span className="text-[10px] text-zinc-600 group-hover:text-[#5EA2FF] transition-colors">{icon}</span>
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

function NowPlayingCard({nowPlaying}: {nowPlaying: NowPlaying}) {
  if (!nowPlaying) return null
  return (
    <div className="border-t border-zinc-800 pt-5">
      <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest mb-3">
        {nowPlaying.isPlaying ? 'Now playing' : 'Last played'}
      </p>
      <a href={nowPlaying.url} target="_blank" rel="noreferrer" className="flex items-start gap-2.5 group">
        {nowPlaying.albumArt ? (
          <img src={nowPlaying.albumArt} alt="" className="w-9 h-9 rounded object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-9 h-9 rounded bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-600 text-xs">♪</div>
        )}
        <div className="min-w-0">
          <p className="font-sans text-[12px] text-zinc-200 leading-snug truncate group-hover:text-[#5EA2FF] transition-colors">{nowPlaying.title}</p>
          <p className="font-mono text-[11px] text-zinc-500 truncate">{nowPlaying.artist}</p>
          {nowPlaying.isPlaying && (
            <div className="flex items-end gap-[2px] h-3 mt-1.5">
              {[1,2,3,4].map(i => (
                <span key={i} className="w-[2px] bg-[#5EA2FF] rounded-sm" style={{height: '100%', animation: `eq-bar 0.8s ease-in-out ${i * 0.12}s infinite alternate`}} />
              ))}
            </div>
          )}
        </div>
      </a>
      <style>{`@keyframes eq-bar { from { transform: scaleY(0.2); } to { transform: scaleY(1); } }`}</style>
    </div>
  )
}

// ─── About-specific section components ───────────────────────────────────────

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <section id={label.toLowerCase()} className="py-5 border-t border-100">
      <h2 className="label mb-4">{label}</h2>
      <ul className="flex flex-col gap-3">{children}</ul>
    </section>
  )
}

function WorkItem({company, href, role, period}: {company: string; href?: string; role: string; period: string}) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 group">
      <a href={href} target="_blank" rel="noreferrer" className="font-display text-lg text-950 group-hover:text-600 transition-colors shrink-0">
        {company}
      </a>
      <span className="text-400 hidden sm:inline">·</span>
      <span className="text-900">{role}</span>
      <span className="text-500 text-xs font-mono uppercase tracking-wider sm:ml-auto shrink-0">{period}</span>
    </li>
  )
}

function LinkItem({name, href}: {name: string; href: string}) {
  return (
    <li>
      <a href={href} className="font-display text-lg text-900 hover:text-600 transition-colors inline-flex items-center gap-2 group" target="_blank" rel="noreferrer">
        {name}
        <span className="text-400 text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
      </a>
    </li>
  )
}
