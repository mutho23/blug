import React from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigate,
  useRouteError,
} from '@remix-run/react'
import {json, LinksFunction} from '@remix-run/node'
import styles from './tailwind.css?url'
import {getProfile} from 'src/atproto'
import {AppBskyActorDefs} from '@atproto/api'

export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: styles},
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous'},
  {href: 'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,300..900;1,7..72,300..900&display=swap', rel: 'stylesheet'},
  {href: 'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,MONO@-15..0,300..900,0..1,0..1&display=swap', rel: 'stylesheet'},
]

export const loader = async () => {
  try {
    const profile = await getProfile()
    return json({profile})
  } catch (err) {
    console.error('Failed to load profile:', err)
    return json({profile: null})
  }
}

const SOCIALS = [
  {icon: '🦋', label: 'Bluesky',  href: 'https://bsky.app/profile/mutho.my.id'},
  {icon: '💬', label: 'Discord',  href: 'https://discord.gg/DNcNBQaqgM'},
  {icon: '🌾', label: 'Grain', href: 'https://grain.social/profile/mutho.my.id'},
  {icon: '🎵', label: 'Spotify',  href: 'https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8'},
  {icon: '🎮', label: 'Steam',    href: 'https://steamcommunity.com/id/moebatsu'},
  {icon: '✉️', label: 'Email',    href: 'mailto:amuthohhari@gmail.com'},
]

const PAGE_ORDER = ['/', '/blog', '/gallery']

export function Layout({children}: {children: React.ReactNode}) {
  const data = useLoaderData<{profile: AppBskyActorDefs.ProfileViewDetailed | null}>()
  const profile = data?.profile ?? null
  const location = useLocation()
  const navigate = useNavigate()

  const isOn = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const isMainPage = PAGE_ORDER.includes(location.pathname)
  const currentIndex = PAGE_ORDER.indexOf(location.pathname)

  // Swipe state — live drag offset tracked in a ref, committed to state only for re-render
  const touchStartX = React.useRef(0)
  const touchStartY = React.useRef(0)
  const dragging = React.useRef(false)
  const [dragOffset, setDragOffset] = React.useState(0)

  // Juttu (kolom komentar) sengaja dimuat lewat effect, bukan <script> statis di <head>.
  // Kalau statis, script-nya (defer) bisa nyuntik konten ke #juttu-comments SEBELUM React
  // selesai hydrate elemen itu -> hydration mismatch (React error #418/#423) -> widget
  // ke-reset/ilang. useEffect di sini baru jalan SETELAH commit awal selesai, jadi aman.
  React.useEffect(() => {
    const SRC = 'https://cdn.jsdelivr.net/npm/juttu@latest/juttu-embed.js'
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`)
    if (existing) {
      // Sudah pernah dimuat (mis. navigasi client-side ke post lain) — Juttu belum tentu
      // auto rescan, jadi re-append supaya browser re-run script-nya buat scan ulang DOM.
      existing.remove()
    }
    const script = document.createElement('script')
    script.src = SRC
    script.defer = true
    script.dataset.theme = 'dark'
    document.head.appendChild(script)
  }, [location.pathname])

  React.useEffect(() => {
    if (!isMainPage) return

    const onTouchStart = (e: TouchEvent) => {
      // Jangan aktifkan page swipe kalau lightbox sedang terbuka
      if (document.querySelector('[style*="z-index: 9999"]')) return
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      dragging.current = false
      setDragOffset(0)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (document.querySelector('[style*="z-index: 9999"]')) return
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      // Only hijack if mostly horizontal
      if (!dragging.current && Math.abs(dx) < 8) return
      if (!dragging.current && dy > Math.abs(dx) * 0.8) return
      dragging.current = true
      // Resist at edges
      if ((dx > 0 && currentIndex === 0) || (dx < 0 && currentIndex === PAGE_ORDER.length - 1)) {
        setDragOffset(dx * 0.2) // rubber-band
      } else {
        setDragOffset(dx)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (document.querySelector('[style*="z-index: 9999"]')) return
      const dx = touchStartX.current - e.changedTouches[0].clientX
      const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY)
      setDragOffset(0)
      dragging.current = false
      if (Math.abs(dx) < 60 || dy > Math.abs(dx) * 0.6) return
      if (dx > 0 && currentIndex < PAGE_ORDER.length - 1) {
        navigate(PAGE_ORDER[currentIndex + 1])
      } else if (dx < 0 && currentIndex > 0) {
        navigate(PAGE_ORDER[currentIndex - 1])
      }
    }

    document.addEventListener('touchstart', onTouchStart, {passive: true})
    document.addEventListener('touchmove', onTouchMove, {passive: true})
    document.addEventListener('touchend', onTouchEnd, {passive: true})
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMainPage, currentIndex, navigate])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script async src="https://embed.bsky.app/static/embed.js" />
      </head>
      <body className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#f0f0f0] antialiased font-sans">
        {/* Scroll progress bar */}
        <div id="scroll-progress" className="fixed top-0 left-0 h-[2px] bg-[#4a9eff] z-[200] w-0 transition-[width] duration-100" />

        <div className="flex flex-col flex-1">
          {/* NAV */}
          <header
            className="sticky top-0 z-50 border-b border-[#222]"
            style={{background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)'}}>

            <div className="mx-auto w-full max-w-[1600px] px-4 h-[52px] flex items-center justify-between">

              {/* ── Kiri: Avatar ── */}
              <a href="/" className="flex items-center gap-2 group sm:gap-2.5">
                {profile?.avatar ? (
                  <img
                    className="rounded-full w-8 h-8 ring-1 ring-[#333] group-hover:ring-[#4a9eff] transition-all"
                    src={profile.avatar}
                    alt="Mutho's avatar"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-medium"
                    style={{background: 'linear-gradient(135deg, #4a9eff, #7c6ff7)'}}>
                    M
                  </div>
                )}
                <span className="font-display text-[20px] text-[#f0f0f0] hidden sm:inline tracking-[-0.01em]">
                  mutho<span className="text-[#4a9eff]">.</span>
                </span>
              </a>

              {/* ── Mobile tengah: nav links ── */}
              <nav className="sm:hidden flex items-center gap-5">
                <MobileNavLink href="/" selected={location.pathname === '/'}>About</MobileNavLink>
                <MobileNavLink href="/blog" selected={isOn('/blog')}>Blogs</MobileNavLink>
                <MobileNavLink href="/gallery" selected={isOn('/gallery')}>Gallery</MobileNavLink>
              </nav>

              {/* Desktop nav */}
              <nav className="hidden sm:flex items-center gap-7">
                <NavLink href="/" selected={location.pathname === '/'}>About</NavLink>
                <NavLink href="/blog" selected={isOn('/blog')}>Blogs</NavLink>
                <NavLink href="/gallery" selected={isOn('/gallery')}>Gallery</NavLink>
              </nav>

              {/* ── Kanan: burger Contact (mobile) / spacer (desktop) ── */}
              <button
                className="sm:hidden flex flex-col justify-center gap-[5px] w-9 h-9 shrink-0"
                aria-label="Contact"
                onClick={() => {
                  document.getElementById('mobile-contact')?.classList.toggle('hidden')
                }}>
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
              </button>
              <div className="hidden sm:block w-9" />
            </div>

            {/* ── Mobile dropdown: Contact ── */}
            <div id="mobile-contact" className="hidden sm:hidden border-t border-[#222] px-6 py-1" style={{background: 'rgba(10,10,10,0.97)'}}>
              <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[#aaaaaa] pt-3 pb-2">Contact</p>
              {SOCIALS.map(({icon, label, href}) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
                  <div className="w-6 h-6 rounded bg-[#1a1a1a] flex items-center justify-center text-sm shrink-0">
                    {icon}
                  </div>
                  <span className="font-mono text-[15px] text-[#cccccc]">{label}</span>
                </a>
              ))}
            </div>

            {/* ── Dot indicator (mobile, halaman utama) ── */}
            {isMainPage && (
              <div className="sm:hidden flex justify-center gap-1.5 py-1.5">
                {PAGE_ORDER.map((path, i) => (
                  <a key={path} href={path}
                    className={`block rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 h-1.5 bg-[#4a9eff]' : 'w-1.5 h-1.5 bg-[#333]'}`} />
                ))}
              </div>
            )}
          </header>

          {/* Konten — live drag transform saat swipe */}
          <main
            className="flex-1"
            style={{
              transform: isMainPage && dragOffset !== 0 ? `translateX(${dragOffset}px)` : 'none',
              transition: dragOffset === 0 ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
              willChange: 'transform',
            }}>
            {children}
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#1a1a1a] px-8 py-3.5 flex items-center justify-between">
          <span className="font-mono text-[12px] tracking-[0.12em] uppercase text-[#555]">Made on ATProto</span>
          <a
            href="https://github.com/mutho23/blug"
            className="font-mono text-[16px] text-[#444] hover:text-[#4a9eff] transition-colors">
            source
          </a>
        </footer>

        <ScrollRestoration />
        <Scripts />

        <script dangerouslySetInnerHTML={{__html: `
          window.addEventListener('scroll', function() {
            var doc = document.documentElement;
            var pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
            var bar = document.getElementById('scroll-progress');
            if (bar) bar.style.width = pct + '%';
          });
        `}} />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

function NavLink({href, selected, children}: {href: string; selected: boolean; children: string}) {
  return (
    <a
      href={href}
      className={`font-mono text-[14px] tracking-[0.04em] pb-0.5 border-b-[1.5px] transition-colors ${
        selected ? 'text-[#f0f0f0] border-[#4a9eff]' : 'text-[#555] border-transparent hover:text-[#b0b0b0]'
      }`}>
      {children}
    </a>
  )
}

function MobileNavLink({href, selected, children}: {href: string; selected: boolean; children: string}) {
  return (
    <a
      href={href}
      className={`font-mono text-[13px] tracking-[0.04em] pb-0.5 border-b-[1.5px] transition-colors ${
        selected ? 'text-[#f0f0f0] border-[#4a9eff]' : 'text-[#444] border-transparent'
      }`}>
      {children}
    </a>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-[#0a0a0a] text-[#f0f0f0] antialiased font-sans">
        <div className="container mx-auto pt-10 md:pt-20 pb-20 text-center">
          <p className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555] mb-6">Error</p>
          <h1 className="font-display text-5xl md:text-7xl text-[#f0f0f0]">Something broke.</h1>
          <div className="p-10 flex justify-center">
            <img src="/monkey.jpg" alt="Monkey muppet meme" className="rounded-lg shadow-2xl shadow-black/40 max-w-sm" />
          </div>
          <a href="/blog" className="inline-block font-mono text-xs text-[#4a9eff] hover:text-[#7c6ff7] transition-colors">
            ← back to writing
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
