/**
 * Server-only. Talks directly to Spotify's Web API using YOUR account's
 * refresh token — no Discord/Lanyard involved. Setup:
 *
 *   1. Create an app at https://developer.spotify.com/dashboard
 *      → note the Client ID and Client Secret.
 *      → add a Redirect URI: https://YOUR-DOMAIN/auth/spotify/callback
 *   2. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your env
 *      (Vercel project settings, or .env locally) and deploy.
 *   3. Visit https://YOUR-DOMAIN/auth/spotify in a browser, log in, click
 *      Agree — it'll show you a refresh token on screen.
 *   4. Copy that into your env as SPOTIFY_REFRESH_TOKEN and redeploy.
 *
 * After that this module renews its own access token forever — no more
 * manual steps needed, and nothing here depends on Discord being open.
 * (routes/auth.spotify.ts and routes/auth.spotify.callback.ts implement
 * step 3; scripts/get-spotify-refresh-token.mjs is a local/terminal
 * alternative to the same thing.)
 */

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing'

export type NowPlayingTrack = {
  song: string
  artist: string
  album: string
  album_art_url: string
  track_id: string
  is_playing: boolean
  timestamps: {start: number; end: number}
}

/** Scopes: only enough to read what's currently playing. No write/control access. */
const SCOPES = ['user-read-currently-playing', 'user-read-playback-state'].join(' ')

/** Builds the URL to send the browser to for the one-time Spotify login/consent screen. */
export function buildSpotifyAuthorizeUrl(redirectUri: string): string {
  const clientId = requireEnv('SPOTIFY_CLIENT_ID')
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  return url.toString()
}

/** Exchanges the one-time `code` Spotify redirected back with for a long-lived refresh token. */
export async function exchangeCodeForRefreshToken(code: string, redirectUri: string): Promise<string> {
  const clientId = requireEnv('SPOTIFY_CLIENT_ID')
  const clientSecret = requireEnv('SPOTIFY_CLIENT_SECRET')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({grant_type: 'authorization_code', code, redirect_uri: redirectUri}),
  })

  const data = await res.json()
  if (!res.ok || !data.refresh_token) {
    throw new Error(`Spotify code exchange failed: ${res.status} ${JSON.stringify(data)}`)
  }
  return data.refresh_token as string
}

let cachedAccessToken: {token: string; expiresAt: number} | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing ${name}. Run scripts/get-spotify-refresh-token.mjs to set up Spotify auth, then add ${name} to your .env — see src/spotify/spotify.server.ts for the full setup steps.`
    )
  }
  return value
}

async function getAccessToken(): Promise<string> {
  // Reuse the cached token until ~1 minute before it expires.
  if (cachedAccessToken && cachedAccessToken.expiresAt - Date.now() > 60_000) {
    return cachedAccessToken.token
  }

  const clientId = requireEnv('SPOTIFY_CLIENT_ID')
  const clientSecret = requireEnv('SPOTIFY_CLIENT_SECRET')
  const refreshToken = requireEnv('SPOTIFY_REFRESH_TOKEN')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    throw new Error(`Spotify token refresh failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as {access_token: string; expires_in: number}
  cachedAccessToken = {token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000}
  return cachedAccessToken.token
}

/**
 * Returns the track currently playing on the account tied to
 * SPOTIFY_REFRESH_TOKEN, or `null` if nothing's playing (including private
 * sessions / podcasts / ads, which Spotify reports without track data).
 */
export async function getNowPlaying(): Promise<NowPlayingTrack | null> {
  const accessToken = await getAccessToken()

  const res = await fetch(NOW_PLAYING_URL, {
    headers: {Authorization: `Bearer ${accessToken}`},
  })

  // 204 = nothing playing right now.
  if (res.status === 204 || res.status === 202) return null

  if (!res.ok) {
    throw new Error(`Spotify currently-playing request failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()

  // No `item` happens for local files, some podcasts, or an empty response body.
  if (!data?.item || data.currently_playing_type !== 'track') return null

  const track = data.item as {
    id: string
    name: string
    artists: {name: string}[]
    album: {name: string; images: {url: string}[]}
  }

  const now = Date.now()
  const progressMs: number = data.progress_ms ?? 0
  const durationMs: number = data.item?.duration_ms ?? 0

  return {
    song: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    album_art_url: track.album.images[0]?.url ?? '',
    track_id: track.id,
    is_playing: Boolean(data.is_playing),
    timestamps: {start: now - progressMs, end: now - progressMs + durationMs},
  }
}
