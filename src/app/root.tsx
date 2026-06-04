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
  {icon: '💬', label: 'Discord',  href: 'https://discord.gg/dndVwwGhEa'},
  {icon: '🌾', label: 'Grain',    href: 'https://grain.social/profile/mutho.my.id'},
  {icon: '🎵', label: 'Spotify',  href: 'https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8'},
  {icon: '🎮', label: 'Steam',    href: 'https://steamcommunity.com/id/moebatsu'},
  {icon: '🍿', label: 'Popfeed',  href: 'https://popfeed.social/profile/did:plc:kxb2w63yrod2t65mlnecgrlu'},
  {icon: '✉️', label: 'Email',    href: 'mailto:hello@mutho.site'},
]

export function Layout({children}: {children: React.ReactNode}) {
  const data = useLoaderData<{profile: AppBskyActorDefs.ProfileViewDetailed | null}>()
  const profile = data?.profile ?? null
  const location = useLocation()

  const isOn = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

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

            <div className="mx-auto w-full max-w-[1600px] px-5 h-[52px] flex items-center justify-between">

              {/* ── Mobile kiri: tombol Contact ── */}
              <button
                className="sm:hidden flex flex-col justify-center gap-[5px] w-9 h-9 shrink-0"
                aria-label="Contact"
                onClick={() => {
                  document.getElementById('mobile-contact')?.classList.toggle('hidden')
                  document.getElementById('mobile-menu')?.classList.add('hidden')
                }}>
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
              </button>

              {/* Brand — mobile: absolut tengah; desktop: kiri */}
              <a href="/" className="flex items-center gap-2.5 group sm:static absolute left-1/2 -translate-x-1/2 sm:translate-x-0">
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

              {/* Desktop nav */}
              <nav className="hidden sm:flex items-center gap-7">
                <NavLink href="/" selected={isOn('/') && location.pathname === '/'}>Blogs</NavLink>
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

              {/* ── Mobile kanan: tombol Nav ── */}
              <button
                className="sm:hidden flex flex-col justify-center gap-[5px] w-9 h-9 shrink-0"
                aria-label="Menu"
                onClick={() => {
                  document.getElementById('mobile-menu')?.classList.toggle('hidden')
                  document.getElementById('mobile-contact')?.classList.add('hidden')
                }}>
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
                <span className="block w-5 h-[1.5px] bg-[#ccc] rounded" />
              </button>
            </div>

            {/* ── Mobile dropdown: Nav (kanan) ── */}
            <div id="mobile-menu" className="hidden sm:hidden border-t border-[#222] px-6 py-1" style={{background: 'rgba(10,10,10,0.97)'}}>
              {[
                {href: '/',       label: 'Blogs',      active: isOn('/') && location.pathname === '/'},
                {href: '/about',  label: 'About',      active: isOn('/about')},
                {href: '/gallery',label: 'Gallery',    active: isOn('/gallery')},
                {href: 'https://bsky.app/profile/mutho.my.id', label: 'Bluesky ↗', active: false},
              ].map(({href, label, active}) => (
                <a
                  key={href}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`block py-3 border-b border-[#1a1a1a] last:border-0 font-mono text-[16px] transition-colors ${active ? 'text-[#4a9eff]' : 'text-[#cccccc]'}`}>
                  {label}
                </a>
              ))}
            </div>

            {/* ── Mobile dropdown: Contact (kiri) ── */}
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
          </header>

          <main className="flex-1">{children}</main>
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
          <a href="/" className="inline-block font-mono text-xs text-[#4a9eff] hover:text-[#7c6ff7] transition-colors">
            ← back to writing
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
