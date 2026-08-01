import {MetaFunction} from '@remix-run/node'
import type {CSSProperties} from 'react'
import {useLanyard, DISCORD_STATUS_META} from '../hooks/use-lanyard.js'
import {useSpotifyNowPlaying} from '../hooks/use-spotify-now-playing.js'
import {SpotifyCard, SpotifyIdleCard} from '../components/spotify-card.js'
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

/* ── Live Discord presence, powered by Lanyard (https://github.com/Phineas/lanyard) ──
   Used for online/idle/dnd status and current activities (games, apps, custom
   status) — requires the Discord account below to be a member of Lanyard's
   Discord server (https://discord.gg/lanyard). The Spotify card is sourced
   straight from the real Spotify Web API instead (see hooks/use-spotify-now-playing.ts
   and src/spotify/spotify.server.ts), not from Discord. */

function DiscordPresenceWidget() {
  const {data, status} = useLanyard()
  const {track: spotify} = useSpotifyNowPlaying()

  // Fail quietly on the live site (e.g. Lanyard down, or the account isn't in
  // Lanyard's Discord server yet) instead of showing a broken-looking widget.
  if (status === 'error') return null

  if (status === 'loading' || !data) {
    return (
      <div className="mb-10 flex flex-wrap items-start gap-5 sm:gap-6" aria-hidden="true">
        <div className="skeleton-line w-24 h-24 sm:w-[140px] sm:h-[140px] rounded-full shrink-0" />
        <div className="skeleton-line flex-1 min-w-[220px] h-[92px] rounded-xl" />
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

  // Discord's "custom status" (the little text+emoji under someone's name) is
  // activity type 4. Everything else (games, other apps) we show as a plain
  // activity line. Spotify is excluded here since it already gets its own
  // richer card sourced from the real Spotify API above.
  const customStatus = data.activities.find(a => a.type === 4)
  const otherActivities = data.activities.filter(a => a.type !== 4 && a.name !== 'Spotify')

  const hasExtras = Boolean(customStatus || otherActivities.length > 0)

  return (
    <div className="mb-10 flex flex-wrap items-start gap-5 sm:gap-6">
      <a
        href={`https://discord.com/users/${data.discord_user.id}`}
        target="_blank"
        rel="noopener noreferrer"
        title={data.discord_user.global_name || data.discord_user.username}
        className="group relative inline-block w-24 h-24 sm:w-[140px] sm:h-[140px] shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full rounded-full border border-[#242424] transition-transform group-hover:scale-[1.03]" />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-white text-4xl font-medium transition-transform group-hover:scale-[1.03]"
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
          className="absolute bottom-1 right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-[3px] border-[#0a0a0a]"
          style={{background: statusMeta.color}}
          title={statusMeta.label}
        />
      </a>

      {/* ── Beside the photo: Spotify now-listening + Discord status/activities ── */}
      <div className="flex-1 min-w-[240px] flex flex-col gap-2.5">
        <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#666]">mutho's now listening</p>

        {spotify ? <SpotifyCard spotify={spotify} /> : <SpotifyIdleCard />}

        {hasExtras && (
          <div className="rounded-xl border border-[#1e1e1e] bg-[#111111] p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{background: statusMeta.color}} />
              <span className="font-mono text-xs text-[#999]">{statusMeta.label} on Discord</span>
            </div>

            {customStatus && (customStatus.state || customStatus.emoji) && (
              <div className="font-mono text-sm text-[#f0f0f0] flex items-center gap-1.5">
                {customStatus.emoji && !customStatus.emoji.id && <span>{customStatus.emoji.name}</span>}
                {customStatus.state && <span className="truncate">{customStatus.state}</span>}
              </div>
            )}

            {otherActivities.map(activity => (
              <div key={activity.id} className="font-mono text-sm text-[#ccc] truncate">
                <span className="text-[#666]">{activityVerb(activity.type)} </span>
                {activity.name}
                {activity.details && <span className="text-[#888]"> — {activity.details}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Discord activity `type` → the verb Discord's own client uses for it. */
function activityVerb(type: number): string {
  switch (type) {
    case 0:
      return 'Playing'
    case 1:
      return 'Streaming'
    case 2:
      return 'Listening to'
    case 3:
      return 'Watching'
    case 5:
      return 'Competing in'
    default:
      return 'Using'
  }
}
