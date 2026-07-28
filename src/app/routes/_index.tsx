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
  application_id?: string
  timestamps?: { start?: number; end?: number }
  assets?: {
    large_image?: string
    large_text?: string
    small_image?: string
    small_text?: string
  }
}

type LanyardSpotify = {
  song: string
  artist: string
  album: string
  album_art_url: string
  track_id: string
  timestamps: { start: number; end: number }
}

type LanyardData = {
  discord_user: {
    id: string
    username: string
    global_name?: string | null
    avatar: string | null
    avatar_decoration_data?: { asset: string; sku_id: string } | null
  }
  discord_status: 'online' | 'idle' | 'dnd' | 'offline'
  activities: LanyardActivity[]
  spotify: LanyardSpotify | null
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
  // Kept separate from `data.spotify` so a brief gap in Lanyard's presence
  // updates (e.g. Discord clearing the activity for a split second between
  // songs) doesn't make the card flash away and reappear.
  const [displaySpotify, setDisplaySpotify] = useState<LanyardSpotify | null>(null)

  useEffect(() => {
    let cancelled = false
    let ws: WebSocket | null = null
    let heartbeat: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let noDataTimer: ReturnType<typeof setTimeout> | null = null

    const cleanupSocket = () => {
      if (heartbeat) clearInterval(heartbeat)
      heartbeat = null
      if (ws) {
        ws.onopen = null
        ws.onmessage = null
        ws.onclose = null
        ws.onerror = null
        ws.close()
      }
      ws = null
    }

    const connect = () => {
      if (cancelled) return
      cleanupSocket()
      ws = new WebSocket('wss://api.lanyard.rest/socket')

      ws.onopen = () => {
        ws?.send(JSON.stringify({op: 2, d: {subscribe_to_id: DISCORD_USER_ID}}))
      }

      ws.onmessage = event => {
        if (cancelled) return
        let msg: {op: number; t?: string; d?: unknown}
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }

        if (msg.op === 1) {
          // Hello: server tells us how often to heartbeat to keep the socket alive
          const {heartbeat_interval} = msg.d as {heartbeat_interval: number}
          if (heartbeat) clearInterval(heartbeat)
          heartbeat = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({op: 3}))
          }, heartbeat_interval)
          return
        }

        if (msg.op === 0 && (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE')) {
          if (noDataTimer) clearTimeout(noDataTimer)
          setData(msg.d as LanyardData)
          setStatus('ready')
        }
      }

      ws.onclose = () => {
        if (heartbeat) clearInterval(heartbeat)
        heartbeat = null
        if (!cancelled) reconnectTimer = setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        ws?.close()
      }
    }

    connect()
    // If we never hear back (e.g. socket blocked by CSP/network), fall back to
    // showing the "unavailable" state instead of leaving the skeleton forever.
    noDataTimer = setTimeout(() => {
      if (!cancelled) setStatus(prev => (prev === 'loading' ? 'error' : prev))
    }, 8000)

    return () => {
      cancelled = true
      if (noDataTimer) clearTimeout(noDataTimer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      cleanupSocket()
    }
  }, [])

  useEffect(() => {
    if (data?.spotify) {
      setDisplaySpotify(data.spotify)
      return
    }
    // data.spotify is missing right now — wait a bit before hiding the card,
    // in case it comes back (track-change gap) rather than actually stopping.
    const clearTimer = setTimeout(() => setDisplaySpotify(null), 6000)
    return () => clearTimeout(clearTimer)
  }, [data?.spotify])

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

      {displaySpotify && <SpotifyCard spotify={displaySpotify} />}
    </div>
  )
}

function SpotifyCard({spotify}: {spotify: LanyardSpotify}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const {start, end} = spotify.timestamps
  const total = Math.max(end - start, 1)
  const elapsed = Math.min(Math.max(now - start, 0), total)
  const progress = (elapsed / total) * 100
  const format = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <a
      href={`https://open.spotify.com/track/${spotify.track_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-3 rounded-xl border border-[#1c1c1c] bg-[#111] p-3 transition-colors hover:bg-[#161616]">
      <img src={spotify.album_art_url} alt="" className="w-14 h-14 rounded-lg shrink-0 object-cover" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm text-[#1ed760] truncate">{spotify.song}</div>
        <div className="font-mono text-xs text-[#999] truncate">by {spotify.artist}</div>
        <div className="font-mono text-xs text-[#666] truncate mb-1.5">on {spotify.album}</div>
        <div className="h-1 rounded-full bg-[#242424] overflow-hidden">
          <div className="h-full bg-[#1ed760] transition-[width]" style={{width: `${progress}%`}} />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-[#666] mt-1">
          <span>{format(elapsed)}</span>
          <span>{format(total)}</span>
        </div>
      </div>
    </a>
  )
}
