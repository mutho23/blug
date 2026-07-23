import {MetaFunction} from '@remix-run/node'

export const meta: MetaFunction = () => [
  {title: 'About | mutho.'},
  {name: 'description', content: 'About Mutho — hanya seorang guru dan murid abadi'},
]

export default function About() {
  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* ── Left Sidebar: dihapus (dulu berisi Contact), spacer dipertahankan biar konten tetap center di desktop ── */}
      <aside className="hidden lg:block w-[220px] shrink-0" />

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 flex justify-center">
      <div className="w-full max-w-3xl px-8 md:px-14 py-10">
        <section className="mb-10">
          <h1 className="font-display text-[42px] text-[#f0f0f0] tracking-[-0.02em]">
            About Me<span className="text-[#4a9eff]">.</span>
          </h1>
          <p className="font-mono text-[19px] text-[#cccccc] leading-[1.9] mt-3 max-w-[540px]">
            Mutho (Muthohhar) is a coffee addict who loves to ramble about manga,
            anime, movies, books, JRPGs, philosophy, and psychology.
            This site is his personal space to write about whatever else is on his mind.
          </p>
        </section>

        <Section label="Work">
          <WorkItem company="Teacher" role="I love to learn & teach" period="2013 — Present" />
        </Section>

        <Section label="Community">
          <WorkItem company="KIKEN" href="https://discord.gg/DNcNBQaqgM" role="Discord Server" period="Dec 2026 — Present" />
        </Section>
      </div>
      </div>

      {/* ── Right Sidebar: kosong (sticky) ── */}
      <aside className="hidden lg:block w-[220px] shrink-0 border-l border-[#1e1e1e] sticky top-[52px] self-start h-[calc(100vh-52px)]" />

    </div>
  )
}

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <section className="border-t border-[#1e1e1e] pt-4 pb-5 mb-2">
      <p className="font-mono text-[14px] tracking-[0.12em] uppercase text-[#aaaaaa] mb-4">{label}</p>
      <ul className="flex flex-col gap-0">{children}</ul>
    </section>
  )
}

function WorkItem({company, href, role, period}: {company: string; href?: string; role: string; period: string}) {
  return (
    <li className="flex items-start justify-between py-3 border-b border-[#1a1a1a] last:border-0">
      <div>
        <a
          href={href}
          target={href ? '_blank' : undefined}
          rel="noopener noreferrer"
          className={`font-mono text-[19px] text-[#f0f0f0] ${href ? 'hover:text-[#4a9eff] transition-colors' : ''}`}>
          {company}
        </a>
        <div className="font-mono text-[14px] text-[#aaaaaa] mt-1">{role}</div>
      </div>
      <span className="font-mono text-[17px] text-[#aaaaaa] shrink-0 mt-0.5">{period}</span>
    </li>
  )
}
