import {useEffect, useState} from 'react'

/* ── Live Discord/Spotify presence, powered by Lanyard (https://github.com/Phineas/lanyard) ──
   Requires the Discord account below to be a member of Lanyard's Discord server
   (https://discord.gg/lanyard) — that's what lets api.lanyard.rest track its presence.
   Uses the WebSocket endpoint (wss://api.lanyard.rest/socket) for push updates. */

export const DISCORD_USER_ID = '1134329616501309540'

export type LanyardActivity = {
  id: string
  name: string
  type: number
  details?: string
  state?: string
  application_id?: string
  timestamps?: {start?: number; end?: number}
  assets?: {
    large_image?: string
    large_text?: string
    small_image?: string
    small_text?: string
  }
}

export type LanyardSpotify = {
  song: string
  artist: string
  album: string
  album_art_url: string
  track_id: string
  timestamps: {start: number; end: number}
}

export type LanyardData = {
  discord_user: {
    id: string
    username: string
    global_name?: string | null
    avatar: string | null
    avatar_decoration_data?: {asset: string; sku_id: string} | null
  }
  discord_status: 'online' | 'idle' | 'dnd' | 'offline'
  activities: LanyardActivity[]
  spotify: LanyardSpotify | null
}

export const DISCORD_STATUS_META: Record<LanyardData['discord_status'], {color: string; label: string}> = {
  online: {color: '#3ba55d', label: 'Online'},
  idle: {color: '#faa61a', label: 'Idle'},
  dnd: {color: '#ed4245', label: 'Do Not Disturb'},
  offline: {color: '#747f8d', label: 'Offline'},
}

export type LanyardStatus = 'loading' | 'ready' | 'error'

/**
 * Subscribes to Lanyard's WebSocket for this user's Discord presence and
 * currently-playing Spotify track. `spotify` is kept "sticky" for a few
 * seconds after it disappears from the payload so a brief gap between songs
 * (Discord clears the activity for a split second) doesn't make any UI built
 * on top of this flicker away and back.
 */
export function useLanyard(userId: string = DISCORD_USER_ID) {
  const [data, setData] = useState<LanyardData | null>(null)
  const [status, setStatus] = useState<LanyardStatus>('loading')
  const [spotify, setSpotify] = useState<LanyardSpotify | null>(null)

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
        ws?.send(JSON.stringify({op: 2, d: {subscribe_to_id: userId}}))
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
  }, [userId])

  useEffect(() => {
    if (data?.spotify) {
      setSpotify(data.spotify)
      return
    }
    const clearTimer = setTimeout(() => setSpotify(null), 6000)
    return () => clearTimeout(clearTimer)
  }, [data?.spotify])

  return {data, status, spotify}
}
