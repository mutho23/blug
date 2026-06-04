import React from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteError,
} from '@remix-run/react'
import {json, LinksFunction} from '@remix-run/node'
import styles from './tailwind.css?url'
import {getProfile} from 'src/atproto'
import {AppBskyActorDefs} from '@atproto/api'

export const links: LinksFunction = () => [
  {rel: 'stylesheet', href: styles},
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    href: 'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,300..900;1,7..72,300..900&display=swap',
    rel: 'stylesheet',
  },
  {
    href: 'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,MONO@-15..0,300..900,0..1,0..1&display=swap',
    rel: 'stylesheet',
  },
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

export function Layout({children}: {children: React.ReactNode}) {
  const data = useLoaderData<{profile: AppBskyActorDefs.ProfileViewDetailed | null}>()
  const profile = data?.profile ?? null
  const location = useLocation()

  const isOn = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path)

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
        <div
          id="scroll-progress"
          className="fixed top-0 left-0 h-[2px] bg-[#4a9eff] z-[200] w-0 transition-[width] duration-100"
        />

        <div className="flex flex-col flex-1">
          {/* NAV */}
          <header
            className="sticky top-0 z-50 border-b border-[#222]"
            style={{background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(12px)'}}>
            <div className="mx-auto w-full max-w-[1600px] px-8 h-[52px] flex items-center justify-between gap-4">
              {/* Brand */}
              <a href="/" className="flex items-center gap-2.5 group">
                {profile?.avatar ? (
                  <img
                    className="rounded-full w-7 h-7 ring-1 ring-[#333] group-hover:ring-[#4a9eff] transition-all"
                    src={profile.avatar}
                    alt="Mutho's avatar"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[13px] font-medium"
                    style={{background: 'linear-gradient(135deg, #4a9eff, #7c6ff7)'}}>
                    M
                  </div>
                )}
                <span className="font-display text-[20px] text-[#f0f0f0] hidden sm:inline tracking-[-0.01em]">
                  mutho<span className="text-[#4a9eff]">.</span>
                </span>
              </a>

              {/* Desktop nav */}
              <nav className="hidden sm:flex items-center gap-7">
                <NavLink href="/" selected={isOn('/') && location.pathname === '/'}>Writing</NavLink>
                <NavLink href="/about" selected={isOn('/about')}>About</NavLink>
                <NavLink href="/gallery" selected={isOn('/gallery')}>Gallery</NavLink>
                <a
                  href="https://bsky.app/profile/mutho.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[14px] text-[#555] hover:text-[#b0b0b0] transition-colors tracking-[0.04em]">
                  Bluesky
                </a>
              </nav>

              {/* Mobile hamburger */}
              <button
                id="mobile-menu-btn"
                className="sm:hidden flex flex-col gap-1 p-1"
                aria-label="Menu"
                onClick={() => {
                  const m = document.getElementById('mobile-menu')
                  if (m) m.classList.toggle('hidden')
                }}>
                <span className="block w-5 h-px bg-[#888] rounded" />
                <span className="block w-5 h-px bg-[#888] rounded" />
                <span className="block w-5 h-px bg-[#888] rounded" />
              </button>
            </div>

            {/* Mobile dropdown */}
            <div id="mobile-menu" className="hidden sm:hidden border-t border-[#222] px-6 py-2 flex flex-col" style={{background: 'rgba(10,10,10,0.97)'}}>
              {[
                {href: '/', label: 'Writing', active: isOn('/') && location.pathname === '/'},
                {href: '/about', label: 'About', active: isOn('/about')},
                {href: '/gallery', label: 'Gallery', active: isOn('/gallery')},
                {href: 'https://bsky.app/profile/mutho.my.id', label: 'Bluesky ↗', active: false},
              ].map(({href, label, active}) => (
                <a
                  key={href}
                  href={href}
                  className={`py-3 border-b border-[#1a1a1a] last:border-0 font-mono text-[16px] transition-colors ${active ? 'text-[#4a9eff]' : 'text-[#888]'}`}>
                  {label}
                </a>
              ))}
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#1a1a1a] px-8 py-3.5 flex items-center justify-between">
          <span className="font-display text-[17px] text-[#555]">mutho.</span>
          <a
            href="https://github.com/mutho23/blug"
            className="font-mono text-[16px] text-[#444] hover:text-[#4a9eff] transition-colors">
            source
          </a>
        </footer>

        <ScrollRestoration />
        <Scripts />

        {/* Scroll progress script */}
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

function NavLink({
  href,
  selected,
  children,
}: {
  href: string
  selected: boolean
  children: string
}) {
  return (
    <a
      href={href}
      className={`font-mono text-[14px] tracking-[0.04em] pb-0.5 border-b-[1.5px] transition-colors ${
        selected
          ? 'text-[#f0f0f0] border-[#4a9eff]'
          : 'text-[#555] border-transparent hover:text-[#b0b0b0]'
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
          <h1 className="font-display text-5xl md:text-7xl text-[#f0f0f0]">
            Something broke.
          </h1>
          <div className="p-10 flex justify-center">
            <img
              src="/monkey.jpg"
              alt="Monkey muppet meme"
              className="rounded-lg shadow-2xl shadow-black/40 max-w-sm"
            />
          </div>
          <a href="/" className="inline-block font-mono text-xs text-[#4a9eff] hover:text-[#7c6ff7] transition-colors">
            ← back to writing
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
