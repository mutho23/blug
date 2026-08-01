import {useSpotifyNowPlaying} from '../hooks/use-spotify-now-playing.js'
import {SpotifyCard, SpotifyCompactCard} from './spotify-card.js'

/**
 * Sidebar variant: renders a labeled "Now playing" block only while a track
 * is actually playing (or briefly while still loading) — hides itself
 * entirely instead of showing an idle placeholder when nothing's playing.
 */
export function NowPlayingWidget({className = ''}: {className?: string}) {
  const {track, status} = useSpotifyNowPlaying()

  if (status === 'error') return null
  if (status === 'ready' && !track) return null

  return (
    <div className={className}>
      <p className="font-mono text-xs tracking-[0.14em] uppercase text-[#666] mb-3">Now playing</p>
      {status === 'loading' ? (
        <div className="skeleton-line h-[68px] rounded-xl" aria-hidden="true" />
      ) : (
        track && <SpotifyCompactCard spotify={track} />
      )}
    </div>
  )
}

/**
 * Mobile variant: a slim, fixed bar pinned to the bottom of the screen so
 * whatever's currently playing on Spotify is visible on the phone even
 * though the desktop sidebar is hidden below the `lg` breakpoint. Renders
 * nothing when there's no track playing, so it doesn't eat screen space.
 */
export function NowPlayingMobileBar() {
  const {track} = useSpotifyNowPlaying()

  if (!track) return null

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
      <SpotifyCompactCard spotify={track} className="shadow-lg shadow-black/40 backdrop-blur" />
    </div>
  )
}

/** Full card version (with progress bar) for pages that want a bigger widget, e.g. the About page. */
export function NowPlayingCard({className = ''}: {className?: string}) {
  const {track, status} = useSpotifyNowPlaying()

  if (status === 'error' || !track) return null

  return <SpotifyCard spotify={track} className={className} />
}
