import {exchangeCodeForRefreshToken} from '../../spotify/spotify.server.js'

function page(body: string, status = 200) {
  return new Response(
    `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Spotify setup</title>
  <style>
    body { background:#0a0a0a; color:#f0f0f0; font-family: ui-monospace, monospace; padding: 24px; line-height: 1.6; }
    h1 { font-size: 18px; margin-bottom: 16px; }
    .box { background:#111; border:1px solid #242424; border-radius:10px; padding:14px; word-break: break-all; user-select: all; margin: 12px 0; }
    button { background:#1ed760; color:#000; border:none; border-radius:8px; padding:10px 16px; font-weight:600; font-family:inherit; font-size:14px; }
    .muted { color:#888; font-size:14px; }
    .error { color:#ff6b6b; }
  </style>
</head>
<body>${body}</body>
</html>`,
    {status, headers: {'Content-Type': 'text/html; charset=utf-8'}}
  )
}

export const loader = async ({request}: {request: Request}) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    return page(
      `<h1>Login gagal</h1><p class="error">${error ?? 'Tidak ada kode dari Spotify.'}</p><p class="muted">Coba buka lagi <code>/auth/spotify</code>.</p>`,
      400
    )
  }

  const redirectUri = `${url.origin}/auth/spotify/callback`

  try {
    const refreshToken = await exchangeCodeForRefreshToken(code, redirectUri)
    return page(`
      <h1>✅ Berhasil!</h1>
      <p>Copy nilai di bawah ini, lalu tambahkan sebagai <b>SPOTIFY_REFRESH_TOKEN</b> di environment variables (misalnya Vercel → Project Settings → Environment Variables), lalu redeploy.</p>
      <div class="box" id="token">${refreshToken}</div>
      <button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent)">Copy</button>
      <p class="muted">Setelah ini disimpan dan di-redeploy, halaman "Now playing" di web kamu akan otomatis menampilkan lagu yang sedang diputar di Spotify.</p>
    `)
  } catch (err) {
    return page(
      `<h1>Login gagal</h1><p class="error">${String(err instanceof Error ? err.message : err)}</p><p class="muted">Pastikan SPOTIFY_CLIENT_ID dan SPOTIFY_CLIENT_SECRET sudah benar di environment variables.</p>`,
      500
    )
  }
}
