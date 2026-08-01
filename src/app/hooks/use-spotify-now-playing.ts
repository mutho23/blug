import {useEffect, useRef, useState} from 'react'
import type {NowPlayingTrack} from '../../spotify/spotify.server.js'

export type SpotifyStatus = 'loading' | 'ready' | 'error'

const POLL_MS = 7000

/**
 * Polls our own `/api/now-playing` resource route (which talks to the real
 * Spotify Web API server-side) instead of listening to Discord/Lanyard.
 * Pauses polling while the tab is in the background to avoid wasting Spotify
 * API calls, and immediately re-polls when the tab becomes visible again.
 */
export function useSpotifyNowPlaying() {
  const [track, setTrack] = useState<NowPlayingTrack | null>(null)
  const [status, setStatus] = useState<SpotifyStatus>('loading')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch('/api/now-playing')
        if (!res.ok) throw new Error(`${res.status}`)
        const data = (await res.json()) as {track: NowPlayingTrack | null}
        if (cancelled) return
        setTrack(data.track)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus(prev => (prev === 'ready' ? prev : 'error'))
      } finally {
        if (!cancelled && document.visibilityState === 'visible') {
          timerRef.current = setTimeout(poll, POLL_MS)
        }
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timerRef.current) clearTimeout(timerRef.current)
        poll()
      }
    }

    poll()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return {track, status}
}
