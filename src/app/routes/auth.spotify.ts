import {redirect} from '@remix-run/node'
import {buildSpotifyAuthorizeUrl} from '../../spotify/spotify.server.js'

/**
 * Visit /auth/spotify in a browser (once) to log in to Spotify and get a
 * refresh token for SPOTIFY_REFRESH_TOKEN. See spotify.server.ts for the
 * full setup steps.
 *
 * If SPOTIFY_SETUP_SECRET is set in the environment, this route requires a
 * matching ?key= query param, so random visitors can't kick off the login
 * flow using your app's Client ID. Optional but recommended since this
 * route stays live on the public site after setup.
 */
export const loader = async ({request}: {request: Request}) => {
  const setupSecret = process.env.SPOTIFY_SETUP_SECRET
  const url = new URL(request.url)

  if (setupSecret && url.searchParams.get('key') !== setupSecret) {
    return new Response('Forbidden — missing or incorrect ?key=', {status: 403})
  }

  const redirectUri = `${url.origin}/auth/spotify/callback`
  return redirect(buildSpotifyAuthorizeUrl(redirectUri))
}
