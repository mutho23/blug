import {useEffect, useState} from 'react'
import type {NowPlayingTrack} from '../../spotify/spotify.server.js'

/** Full card with album art, progress bar, and elapsed/total time — used in sidebars. */
export function SpotifyCard({spotify, className = ''}: {spotify: NowPlayingTrack; className?: string}) {
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
      className={`flex items-center gap-3 rounded-xl border border-[#1c1c1c] bg-[#111] p-3 transition-colors hover:bg-[#161616] ${className}`}>
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

/** Compact single-row variant with an equalizer animation — fits a mobile bar or a tight sidebar slot. */
export function SpotifyCompactCard({spotify, className = ''}: {spotify: NowPlayingTrack; className?: string}) {
  return (
    <a
      href={`https://open.spotify.com/track/${spotify.track_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-xl border border-[#1e1e1e] bg-[#111111] p-3 transition-colors hover:bg-[#161616] ${className}`}>
      <img src={spotify.album_art_url} alt="" className="w-11 h-11 rounded-lg shrink-0 object-cover" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm text-[#1ed760] truncate">{spotify.song}</div>
        <div className="font-mono text-xs text-[#666] mt-0.5 truncate">{spotify.artist}</div>
      </div>
      <div className="flex items-end gap-[2px] h-3.5 shrink-0" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-[2px] bg-[#1ed760] rounded-full"
            style={{animation: `eq 1s ease-in-out infinite`, animationDelay: `${-0.4 + i * 0.2}s`}}
          />
        ))}
      </div>
      <style>{`@keyframes eq { 0%, 100% { height: 3px; } 50% { height: 14px; } }`}</style>
    </a>
  )
}

/** Static "nothing playing" placeholder, so the sidebar slot doesn't just vanish. */
export function SpotifyIdleCard({className = ''}: {className?: string}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-[#1e1e1e] bg-[#111111] p-3 ${className}`}>
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center text-base shrink-0 opacity-50"
        style={{background: 'linear-gradient(135deg, #7c6ff7, #4a9eff)'}}>
        🎵
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm text-[#666]">Not listening right now</div>
      </div>
    </div>
  )
}
