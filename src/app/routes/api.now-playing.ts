import {json} from '@remix-run/node'
import {getNowPlaying} from '../../spotify/spotify.server.js'

export const loader = async () => {
  try {
    const track = await getNowPlaying()
    return json({track}, {headers: {'Cache-Control': 'no-store'}})
  } catch (error) {
    // Don't break the widget if Spotify/env config has an issue — just report
    // nothing playing, and log the real reason server-side for debugging.
    console.error('[api.now-playing]', error)
    return json({track: null}, {headers: {'Cache-Control': 'no-store'}})
  }
}
