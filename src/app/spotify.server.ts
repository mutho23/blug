const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN!

const BASIC = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  })
  const data = await res.json()
  return data.access_token
}

export type NowPlaying =
  | {isPlaying: true; title: string; artist: string; url: string; albumArt: string | null}
  | {isPlaying: false; title: string; artist: string; url: string; albumArt: string | null}
  | null

export async function getNowPlaying(): Promise<NowPlaying> {
  try {
    const token = await getAccessToken()

    // Try currently playing first
    const currentRes = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {headers: {Authorization: `Bearer ${token}`}},
    )

    if (currentRes.status === 200) {
      const data = await currentRes.json()
      if (data?.item) {
        return {
          isPlaying: data.is_playing,
          title: data.item.name,
          artist: data.item.artists.map((a: any) => a.name).join(', '),
          url: data.item.external_urls.spotify,
          albumArt: data.item.album.images?.[2]?.url ?? null,
        }
      }
    }

    // Fallback: recently played
    const recentRes = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      {headers: {Authorization: `Bearer ${token}`}},
    )
    if (recentRes.ok) {
      const data = await recentRes.json()
      const item = data.items?.[0]?.track
      if (item) {
        return {
          isPlaying: false,
          title: item.name,
          artist: item.artists.map((a: any) => a.name).join(', '),
          url: item.external_urls.spotify,
          albumArt: item.album.images?.[2]?.url ?? null,
        }
      }
    }

    return null
  } catch {
    return null
  }
}
