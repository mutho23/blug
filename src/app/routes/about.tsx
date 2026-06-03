import {MetaFunction} from '@remix-run/node'
import {NavLink} from '@remix-run/react'

export const meta: MetaFunction = () => {
  return [
    {title: "About | Mutho's Blog"},
    {name: 'description', content: 'About Mutho — hanya seorang guru dan murid abadi'},
  ]
}

export default function About() {
  return (
    <div className="bl-page">

      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="bl-sidebar bl-sidebar-l">
        <div>
          <p className="bl-widget-label">Navigate</p>
          <ul className="bl-nav">
            <li><NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}><span className="ico">◈</span>Posts</NavLink></li>
            <li><NavLink to="/gallery" className={({isActive}) => isActive ? 'active' : ''}><span className="ico">◻</span>Gallery</NavLink></li>
            <li><NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}><span className="ico">◯</span>About</NavLink></li>
          </ul>
        </div>

        <div style={{marginTop: 'auto'}}>
          <p className="bl-widget-label">Elsewhere</p>
          <ul className="bl-nav">
            <li><a href="https://discord.com/users/1134329616501309540" target="_blank" rel="noreferrer"><span className="ico">↗</span>Discord</a></li>
            <li><a href="https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8" target="_blank" rel="noreferrer"><span className="ico">↗</span>Spotify</a></li>
            <li><a href="https://steamcommunity.com/id/moebatsu" target="_blank" rel="noreferrer"><span className="ico">↗</span>Steam</a></li>
            <li><a href="https://popfeed.social/profile/did:plc:kxb2w63yrod2t65mlnecgrlu" target="_blank" rel="noreferrer"><span className="ico">↗</span>Popfeed</a></li>
          </ul>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="bl-main">

        {/* Hero */}
        <section className="bl-hero">
          <p className="bl-hero-eyebrow">About</p>
          <h1 className="bl-hero-title">
            About Me<span className="accent">.</span>
          </h1>
          <p className="bl-about-bio" style={{marginTop: '0'}}>
            Mutho (Muthohhar) is a coffee addict who loves to ramble about manga,
            anime, movies, books, JRPGs, philosophy, and psychology.
            This site is his personal space to write about whatever else is on his mind.
          </p>
        </section>

        {/* Work */}
        <Section label="Work">
          <WorkItem
            company="Teacher"
            role="I love to learn &amp; teach"
            period="2013 — Present"
          />
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
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.1rem'}}>
            <LinkItem name="Discord" href="https://discord.com/users/1134329616501309540" />
            <LinkItem name="Spotify" href="https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8?si=95240bc3a0ad4de8" />
            <LinkItem name="Steam" href="https://steamcommunity.com/id/moebatsu" />
            <LinkItem name="Popfeed" href="https://popfeed.social/profile/did:plc:kxb2w63yrod2t65mlnecgrlu" />
          </div>
        </Section>
      </main>

      {/* ─── RIGHT SIDEBAR ─── */}
      <aside className="bl-sidebar bl-sidebar-r">
        <div>
          <p className="bl-widget-label">Identity</p>
          <div style={{padding: '0.85rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '3px'}}>
            <p style={{fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.15rem'}}>
              Mutho
            </p>
            <p style={{fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--accent)'}}>
              @mutho.my.id
            </p>
            <p style={{fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--text-2)', marginTop: '0.6rem', lineHeight: 1.6}}>
              Teacher · Writer · Coffee addict
            </p>
          </div>
        </div>

        <div>
          <p className="bl-widget-label">Interests</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.35rem'}}>
            {['Manga', 'Anime', 'Movies', 'Books', 'JRPGs', 'Philosophy', 'Psychology', 'Coffee'].map(i => (
              <span
                key={i}
                style={{
                  fontFamily: 'var(--mono)', fontSize: '0.62rem',
                  padding: '0.15rem 0.5rem', border: '1px solid var(--border)',
                  borderRadius: '2px', color: 'var(--text-2)',
                }}>
                {i}
              </span>
            ))}
          </div>
        </div>

        <div style={{marginTop: 'auto'}}>
          <p className="bl-widget-label">Community</p>
          <a
            href="https://discord.gg/dndVwwGhEa"
            target="_blank"
            rel="noreferrer"
            className="bl-mini-item">
            <p className="bl-mini-title">ASHINA</p>
            <p className="bl-mini-meta">Discord Server · Dec 2025</p>
          </a>
        </div>
      </aside>

      {/* ─── Mobile bottom nav ─── */}
      <nav className="bl-mobile-nav">
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>
          <span className="mn-ico">◈</span>Posts
        </NavLink>
        <NavLink to="/gallery" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="mn-ico">◻</span>Gallery
        </NavLink>
        <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="mn-ico">◯</span>About
        </NavLink>
      </nav>
    </div>
  )
}

/* ─── Reusable sub-components (same as original) ─── */

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="bl-section-block">
      <p className="bl-widget-label" style={{marginBottom: '0.85rem'}}>{label}</p>
      {children}
    </div>
  )
}

function WorkItem({company, href, role, period}: {
  company: string
  href?: string
  role: string
  period: string
}) {
  return (
    <div className="bl-work-item">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="bl-work-co">{company}</a>
      ) : (
        <span className="bl-work-co" style={{cursor: 'default'}}>{company}</span>
      )}
      <span className="bl-work-dot">·</span>
      <span className="bl-work-role">{role}</span>
      <span className="bl-work-period">{period}</span>
    </div>
  )
}

function LinkItem({name, href}: {name: string; href: string}) {
  return (
    <a href={href} className="bl-link-item" target="_blank" rel="noreferrer">
      {name}
      <span className="bl-link-arr">↗</span>
    </a>
  )
}
