import {MetaFunction} from '@remix-run/node'

export const meta: MetaFunction = () => {
  return [
    {title: "About | Mutho's Blog"},
    {
      name: 'description',
      content: 'About Mutho — hanya seorang guru dan murid abadi',
    },
  ]
}

export default function About() {
  return (
    <div className="page-layout">
      {/* ── Left Sidebar ── */}
      <aside className="sidebar-left">
        <div className="sidebar-sticky">
          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
            Sections
          </p>
          <nav className="flex flex-col gap-0.5">
            <a href="#work" className="sidebar-link">Work</a>
            <a href="#community" className="sidebar-link">Community</a>
            <a href="#elsewhere" className="sidebar-link">Elsewhere</a>
          </nav>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="page-main">
        {/* Hero */}
        <section className="pt-14 pb-9">
          <h1 className="font-display text-5xl md:text-6xl text-zinc-100 leading-[1.03] tracking-tight mb-2">
            About Me<span className="accent">.</span>
          </h1>
          <p className="font-mono-dm text-sm text-zinc-500 leading-relaxed max-w-prose">
            Mutho (Muthohhar) is a coffee addict who loves to ramble about manga,
            anime, movies, books, JRPGs, philosophy, and psychology.
            This site is his personal space to write about whatever else is on his mind.
          </p>
        </section>

        {/* Work */}
        <Section id="work" label="Work">
          <WorkItem
            company="Teacher"
            role="I love to learn & teach"
            period="2013 — Present"
          />
        </Section>

        {/* Community */}
        <Section id="community" label="Community">
          <WorkItem
            company="ASHINA"
            href="https://discord.gg/dndVwwGhEa"
            role="Discord Server"
            period="Dec 2025 — Present"
          />
        </Section>

        {/* Elsewhere */}
        <Section id="elsewhere" label="Elsewhere">
          <LinkItem name="Discord"  href="https://discord.com/users/1134329616501309540" />
          <LinkItem name="Spotify"  href="https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8?si=95240bc3a0ad4de8" />
          <LinkItem name="Steam"    href="https://steamcommunity.com/id/moebatsu" />
          <LinkItem name="Popfeed"  href="https://popfeed.social/profile/did:plc:kxb2w63yrod2t65mlnecgrlu" />
        </Section>
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="sidebar-right">
        <div className="sidebar-sticky">
          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
            Quick links
          </p>
          <nav className="flex flex-col gap-0.5 mb-6">
            <a href="/" className="sidebar-link">Writing</a>
            <a href="/gallery" className="sidebar-link">Gallery</a>
            <a
              href="https://bsky.app"
              className="sidebar-link"
              target="_blank"
              rel="noreferrer">
              Bluesky ↗
            </a>
          </nav>

          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-2">
            Location
          </p>
          <p className="font-mono-dm text-xs text-zinc-500 mb-5">Indonesia 🇮🇩</p>

          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-2">
            Vibe
          </p>
          <p className="font-mono-dm text-xs text-zinc-500 leading-relaxed">
            Coffee-fueled teacher, eternal student
          </p>
        </div>
      </aside>
    </div>
  )
}

/* ── Section wrapper ── */
function Section({
  id,
  label,
  children,
}: {
  id?: string
  label: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="py-7 border-t border-zinc-900">
      <p className="font-mono-dm text-[10px] tracking-[0.2em] uppercase text-zinc-700 mb-5">
        {label}
      </p>
      <ul className="flex flex-col gap-4">{children}</ul>
    </section>
  )
}

/* ── Work Item ── */
function WorkItem({
  company,
  href,
  role,
  period,
}: {
  company: string
  href?: string
  role: string
  period: string
}) {
  return (
    <li className="flex items-baseline gap-3 flex-wrap group">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-display text-lg text-zinc-100 group-hover:text-[#5EA2FF] transition-colors shrink-0">
          {company}
        </a>
      ) : (
        <span className="font-display text-lg text-zinc-100 shrink-0">{company}</span>
      )}
      <span className="font-mono-dm text-xs text-zinc-500 flex-1">{role}</span>
      <span className="font-mono-dm text-[10px] uppercase tracking-wider text-zinc-700 shrink-0">
        {period}
      </span>
    </li>
  )
}

/* ── Link Item ── */
function LinkItem({name, href}: {name: string; href: string}) {
  return (
    <li>
      <a
        href={href}
        className="font-display text-lg text-zinc-100 hover:text-[#5EA2FF] transition-colors inline-flex items-center gap-2 group"
        target="_blank"
        rel="noreferrer">
        {name}
        <span className="font-mono-dm text-xs text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
          ↗
        </span>
      </a>
    </li>
  )
}
