import {MetaFunction} from '@remix-run/node'
import type {CSSProperties} from 'react'
import {useEffect, useState} from 'react'

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

      {/* ── Right Sidebar: Now Playing (sticky) ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 border-l border-[#1e1e1e] px-5 py-10 sticky top-[52px] self-start h-[calc(100vh-52px)]">
        <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#666] mb-3">Now playing</p>
        {/* Static placeholder — see the note in routes/blog.tsx for how to wire this to real Spotify data. */}
        <div className="flex items-center gap-3 rounded-xl border border-[#1e1e1e] bg-[#111111] p-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{background: 'linear-gradient(135deg, #7c6ff7, #4a9eff)'}}>
            🎵
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm text-[#f0f0f0] truncate">Midnight City</div>
            <div className="font-mono text-xs text-[#666] mt-0.5 truncate">M83</div>
          </div>
        </div>
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
   Requires the Discord account below to be a member of Lanyard's Discord server
   (https://discord.gg/lanyard) — that's what lets api.lanyard.rest track its presence.
   Polls the REST endpoint every 20s; upgrade to the WebSocket endpoint later
   (wss://api.lanyard.rest/socket) if you want push updates instead of polling. */

const DISCORD_USER_ID = '1134329616501309540'

type LanyardActivity = {
  id: string
  name: string
  type: number
  details?: string
  state?: string
}

type LanyardData = {
  discord_user: {
    id: string
    username: string
    global_name?: string | null
    avatar: string | null
  }
  discord_status: 'online' | 'idle' | 'dnd' | 'offline'
  activities: LanyardActivity[]
}

const DISCORD_STATUS_META: Record<LanyardData['discord_status'], {color: string; label: string}> = {
  online: {color: '#3ba55d', label: 'Online'},
  idle: {color: '#faa61a', label: 'Idle'},
  dnd: {color: '#ed4245', label: 'Do Not Disturb'},
  offline: {color: '#747f8d', label: 'Offline'},
}

function DiscordPresenceWidget() {
  const [data, setData] = useState<LanyardData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    const fetchPresence = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
        const json = await res.json()
        if (cancelled) return
        if (json.success) {
          setData(json.data)
          setStatus('ready')
        } else {
          setStatus('error')
        }
      } catch (err) {
        console.error('[DiscordPresenceWidget] failed to fetch Lanyard presence:', err)
        if (!cancelled) setStatus('error')
      }
    }

    fetchPresence()
    const interval = setInterval(fetchPresence, 20000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Fail quietly on the live site (e.g. Lanyard down, or the account isn't in
  // Lanyard's Discord server yet) instead of showing a broken-looking widget.
  if (status === 'error') return null

  if (status === 'loading' || !data) {
    return (
      <div className="flex items-center gap-4 mb-8" aria-hidden="true">
        <div className="skeleton-line w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 max-w-[260px]">
          <div className="skeleton-line h-4 w-32 mb-2.5" />
          <div className="skeleton-line h-3.5 w-52" />
        </div>
      </div>
    )
  }

  const statusMeta = DISCORD_STATUS_META[data.discord_status] ?? DISCORD_STATUS_META.offline
  const activity = data.activities.find(a => a.type !== 4) // type 4 = custom status, handled separately below
  const customStatus = data.activities.find(a => a.type === 4)
  const avatarUrl = data.discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.${
        data.discord_user.avatar.startsWith('a_') ? 'gif' : 'png'
      }?size=64`
    : null

  return (
    <a
      href={`https://discord.com/users/${data.discord_user.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 mb-8 -mx-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-[#141414]">
      <div className="relative shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full border border-[#242424] transition-transform group-hover:scale-[1.03]" />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-medium transition-transform group-hover:scale-[1.03]"
            style={{background: 'linear-gradient(135deg, #4a9eff, #7c6ff7)'}}>
            M
          </div>
        )}
        <span
          className="absolute bottom-0.5 right-0.5 w-[18px] h-[18px] rounded-full border-2 border-[#0a0a0a]"
          style={{background: statusMeta.color}}
          title={statusMeta.label}
        />
      </div>
      <div className="min-w-0">
        <div className="font-mono text-base text-[#f0f0f0] truncate group-hover:text-[#4a9eff] transition-colors">
          {data.discord_user.global_name || data.discord_user.username}
        </div>
        <div className="font-mono text-sm text-[#888] truncate max-w-[320px]">
          {activity ? (
            <>
              {activity.type === 0 ? 'Playing' : activity.type === 2 ? 'Listening to' : activity.type === 3 ? 'Watching' : ''}{' '}
              <span className="text-[#aaa]">{activity.name}</span>
            </>
          ) : customStatus?.state ? (
            customStatus.state
          ) : (
            statusMeta.label
          )}
        </div>
      </div>
    </a>
  )
}
