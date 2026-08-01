import {MetaFunction} from '@remix-run/node'
import type {CSSProperties} from 'react'
import {useLanyard, DISCORD_STATUS_META} from '../hooks/use-lanyard.js'
import {useSpotifyNowPlaying} from '../hooks/use-spotify-now-playing.js'
import {SpotifyCard} from '../components/spotify-card.js'
import {NowPlayingWidget} from '../components/now-playing-widget.js'

export const meta: MetaFunction = () => [
  {title: 'About | mutho.'},
  {name: 'description', content: 'About Mutho — hanya seorang guru dan murid abadi'},
]

export default function About() {
  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* ── Left Sidebar: quick nav to the other pages ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 px-5 py-10">
        <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#666] mb-4">Explore</p>
        <ul className="flex flex-col gap-2.5 font-mono text-sm">
          <li><a href="/blog" className="text-[#666] hover:text-[#4a9eff] transition-colors">Writing →</a></li>
          <li><a href="/gallery" className="text-[#666] hover:text-[#4a9eff] transition-colors">Gallery →</a></li>
        </ul>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 flex justify-center">
      <div className="w-full max-w-3xl px-8 md:px-14 py-10">
        <DiscordPresenceWidget />

        <section className="mb-10">
          <h1 className="font-display text-[42px] text-[#f0f0f0] tracking-[-0.02em]">
            About Me<span className="text-[#4a9eff]">.</span>
          </h1>
          <p className="font-mono text-[19px] text-[#cccccc] leading-[1.9] mt-3 max-w-[540px]">
            Mutho (Muthohhar) is a coffee addict who loves to ramble about manga,
            anime, movies, books, JRPGs, philosophy, and psychology.
            This site is his personal space to write about whatever else is on his mind.
          </p>
        </section>

        <Section label="Work">
          <WorkItem index={0} company="Teacher" role="I love to learn & teach" period="2013 — Present" />
        </Section>

        <Section label="Community">
          <WorkItem index={1} company="KIKEN" href="https://discord.gg/DNcNBQaqgM" role="Discord Server" period="Dec 2026 — Present" />
        </Section>
      </div>
      </div>

      {/* ── Right Sidebar: Now Playing (sticky, real Spotify data via Lanyard) ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 border-l border-[#1e1e1e] px-5 py-10 sticky top-[52px] self-start h-[calc(100vh-52px)]">
        <NowPlayingWidget />
      </aside>

    </div>
  )
}

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <section className="border-t border-[#1e1e1e] pt-4 pb-5 mb-2">
      <p className="font-mono text-[14px] tracking-[0.12em] uppercase text-[#aaaaaa] mb-4">{label}</p>
      <ul className="flex flex-col gap-0">{children}</ul>
    </section>
  )
}

function WorkItem({company, href, role, period, index = 0}: {company: string; href?: string; role: string; period: string; index?: number}) {
  return (
    <li
      className="fade-up-item flex items-start justify-between py-3 border-b border-[#1a1a1a] last:border-0"
      style={{'--delay': `${index * 0.08}s`} as CSSProperties}>
      <div>
        <a
          href={href}
          target={href ? '_blank' : undefined}
          rel="noopener noreferrer"
          className={`title-underline font-mono text-[19px] text-[#f0f0f0] ${href ? 'hover:text-[#4a9eff] transition-colors' : ''}`}>
          {company}
        </a>
        <div className="font-mono text-[14px] text-[#aaaaaa] mt-1">{role}</div>
      </div>
      <span className="font-mono text-[17px] text-[#aaaaaa] shrink-0 mt-0.5">{period}</span>
    </li>
  )
}

/* ── Live Discord presence, powered by Lanyard (https://github.com/Phineas/lanyard) ──
   Only used here for online/idle/dnd status — requires the Discord account
   below to be a member of Lanyard's Discord server (https://discord.gg/lanyard).
   The Spotify card below it, and the sidebar/mobile "now playing" widgets,
   are sourced straight from the real Spotify Web API (see hooks/use-spotify-now-playing.ts
   and src/spotify/spotify.server.ts) — not from Discord. */

function DiscordPresenceWidget() {
  const {data, status} = useLanyard()
  const {track: displaySpotify} = useSpotifyNowPlaying()

  // Fail quietly on the live site (e.g. Lanyard down, or the account isn't in
  // Lanyard's Discord server yet) instead of showing a broken-looking widget.
  if (status === 'error') return null

  if (status === 'loading' || !data) {
    return (
      <div className="mb-8" aria-hidden="true">
        <div className="skeleton-line w-[140px] h-[140px] rounded-full" />
      </div>
    )
  }

  const statusMeta = DISCORD_STATUS_META[data.discord_status] ?? DISCORD_STATUS_META.offline
  const avatarUrl = data.discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.${
        data.discord_user.avatar.startsWith('a_') ? 'gif' : 'png'
      }?size=320`
    : null
  const avatarDecorationUrl = data.discord_user.avatar_decoration_data
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${data.discord_user.avatar_decoration_data.asset}.png?size=320`
    : null

  return (
    <div className="mb-8">
      <a
        href={`https://discord.com/users/${data.discord_user.id}`}
        target="_blank"
        rel="noopener noreferrer"
        title={data.discord_user.global_name || data.discord_user.username}
        className="group relative inline-block w-[140px] h-[140px]">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-[140px] h-[140px] rounded-full border border-[#242424] transition-transform group-hover:scale-[1.03]" />
        ) : (
          <div
            className="w-[140px] h-[140px] rounded-full flex items-center justify-center text-white text-4xl font-medium transition-transform group-hover:scale-[1.03]"
            style={{background: 'linear-gradient(135deg, #4a9eff, #7c6ff7)'}}>
            M
          </div>
        )}
        {avatarDecorationUrl && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-[1.03]">
            <img src={avatarDecorationUrl} alt="" className="w-[118%] h-[118%] max-w-none" />
          </div>
        )}
        <span
          className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full border-[3px] border-[#0a0a0a]"
          style={{background: statusMeta.color}}
          title={statusMeta.label}
        />
      </a>

      {displaySpotify && <SpotifyCard spotify={displaySpotify} className="mt-2" />}
    </div>
  )
}
