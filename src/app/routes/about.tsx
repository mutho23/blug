import {MetaFunction} from '@remix-run/node'

export const meta: MetaFunction = () => {
  return [
    {title: "About | mutho."},
    {name: 'description', content: 'About Mutho — hanya seorang guru dan murid abadi'},
  ]
}

export default function About() {
  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:block w-[200px] shrink-0 border-r border-[#1e1e1e] px-4 py-6">
        <p className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555] mb-3">Elsewhere</p>
        {[
          {icon: '🦋', label: 'Bluesky', href: 'https://bsky.app/profile/mutho.my.id'},
          {icon: '💬', label: 'Discord (ASHINA)', href: 'https://discord.gg/dndVwwGhEa'},
          {icon: '🌾', label: 'Grain', href: 'https://grain.social/profile/mutho.my.id'},
          {icon: '✉️', label: 'Email', href: 'mailto:hello@mutho.site'},
        ].map(({icon, label, href}) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 border-b border-[#1e1e1e] last:border-0 group">
            <div className="w-[22px] h-[22px] rounded bg-[#1a1a1a] flex items-center justify-center text-xs shrink-0">
              {icon}
            </div>
            <span className="font-mono text-[16px] text-[#888] group-hover:text-[#f0f0f0] transition-colors truncate">
              {label}
            </span>
          </a>
        ))}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 px-6 md:px-10 py-9 max-w-2xl">
        {/* Hero */}
        <section className="mb-8">
          <h1 className="font-display text-[35px] md:text-[35px] text-[#f0f0f0] tracking-[-0.02em]">
            About Me<span className="text-[#4a9eff]">.</span>
          </h1>
          <p className="font-mono text-[18px] text-[#888] leading-[1.8] mt-2.5 max-w-[480px]">
            Mutho (Muthohhar) is a coffee addict who loves to ramble about manga,
            anime, movies, books, JRPGs, philosophy, and psychology.
            This site is his personal space to write about whatever else is on his mind.
          </p>
        </section>

        {/* Work */}
        <Section label="Work">
          <WorkItem company="Teacher" role="I love to learn & teach" period="2013 — Present" />
        </Section>

        {/* Community */}
        <Section label="Community">
          <WorkItem
            company="ASHINA"
            href="https://discord.gg/dndVwwGhEa"
            role="Discord Server"
            period="Dec 2025 — Present"
          />
        </Section>

        {/* Elsewhere */}
        <Section label="Elsewhere">
          <LinkItem name="Discord" href="https://discord.com/users/1134329616501309540" />
          <LinkItem name="Spotify" href="https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8?si=95240bc3a0ad4de8" />
          <LinkItem name="Steam" href="https://steamcommunity.com/id/moebatsu" />
          <LinkItem name="Popfeed" href="https://popfeed.social/profile/did:plc:kxb2w63yrod2t65mlnecgrlu" />
        </Section>
      </div>

    </div>
  )
}

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <section className="border-t border-[#1e1e1e] pt-3.5 pb-4 mb-1">
      <p className="font-mono text-[13px] tracking-[0.12em] uppercase text-[#555] mb-3">{label}</p>
      <ul className="flex flex-col gap-0">{children}</ul>
    </section>
  )
}

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
    <li className="flex items-start justify-between py-2 border-b border-[#1a1a1a] last:border-0">
      <div>
        <a
          href={href}
          target={href ? '_blank' : undefined}
          rel="noopener noreferrer"
          className={`font-mono text-[18px] text-[#e0e0e0] ${href ? 'hover:text-[#4a9eff] transition-colors' : ''}`}>
          {company}
        </a>
        <div className="font-mono text-[12px] text-[#555] mt-0.5">{role}</div>
      </div>
      <span className="font-mono text-[18px] text-[#555] shrink-0 mt-0.5">{period}</span>
    </li>
  )
}

function LinkItem({name, href}: {name: string; href: string}) {
  return (
    <li className="py-2 border-b border-[#1a1a1a] last:border-0">
      <a
        href={href}
        className="group inline-flex items-center gap-1.5 font-mono text-[18px] text-[#888] hover:text-[#f0f0f0] transition-colors"
        target="_blank"
        rel="noreferrer">
        {name}
        <span className="text-[16px] text-[#444] opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
      </a>
    </li>
  )
}
