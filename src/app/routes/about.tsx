import {MetaFunction} from '@remix-run/node'

export const meta: MetaFunction = () => {
  return [
    {title: "About | Mutho's Blog"},
    {
      name: 'description',
      content:
        'About Mutho — hanya seorang guru dan murid abadi',
    },
  ]
}

export default function About() {
  return (
    <div className="container mx-auto pt-12 md:pt-20 pb-24">
      <section className="mb-16 md:mb-20 flex flex-col gap-5">
        <h1 className="font-display text-4xl md:text-5xl text-950 leading-[1.05]">
          About Me<span className="text-600">.</span>
        </h1>
        <p className="text-lg leading-relaxed text-900 max-w-prose">
          Mutho (Ahmad Muthohhar) is a coffee addict who loves to ramble about manga, 
          anime, movies, books, JRPGs, philosophy, and psychology.  
          This site is his personal space to write about whatever else is on his mind.
        </p>
      </section>

      <Section label="Work">
        <WorkItem
          company="Teacher"

          role="I love to learn & teach"
          period="2013 — Present"
        />
      
      </Section>

      <Section label="Community">
        <WorkItem
          company="ASHINA"
          href="https://discord.gg/dndVwwGhEa"
          role="Discord Server"
          period="Dec 2025 — Present"
        />
      </Section>

      <Section label="Elsewhere">
        <LinkItem name="GitHub" href="https://github.com/haileyok" />
        <LinkItem name="Bluesky" href="https://bsky.app/profile/hailey.at" />
        <LinkItem name="Discord" href="https://discord.com/users/1134329616501309540" />

      </Section>

      <Section label="Contact">
        <ContactItem label="Email" value="me@haileyok.com" />
        <ContactItem label="Discord" value="haileyok" />
        <ContactItem label="Signal" value="haileyok.01" />
      </Section>
    </div>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="py-8 border-t border-100">
      <h2 className="label mb-5">{label}</h2>
      <ul className="flex flex-col gap-4">{children}</ul>
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
  href: string
  role: string
  period: string
}) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 group">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-display text-lg text-950 group-hover:text-600 transition-colors shrink-0">
        {company}
      </a>
      <span className="text-400 hidden sm:inline">·</span>
      <span className="text-900">{role}</span>
      <span className="text-500 text-xs font-mono uppercase tracking-wider sm:ml-auto shrink-0">
        {period}
      </span>
    </li>
  )
}

function ProjectItem({
  name,
  description,
  href,
}: {
  name: string
  description: string
  href: string
}) {
  return (
    <li>
      <a
        href={href}
        className="group flex flex-col gap-1 -mx-3 px-3 py-2 rounded-md hover:bg-50 transition-colors"
        target="_blank"
        rel="noreferrer">
        <span className="font-display text-lg text-950 group-hover:text-600 transition-colors inline-flex items-center gap-2">
          {name}
          <span className="text-400 text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            ↗
          </span>
        </span>
        <span className="text-500 text-sm leading-relaxed">{description}</span>
      </a>
    </li>
  )
}

function LinkItem({name, href}: {name: string; href: string}) {
  return (
    <li>
      <a
        href={href}
        className="font-display text-lg text-900 hover:text-600 transition-colors inline-flex items-center gap-2 group"
        target="_blank"
        rel="noreferrer">
        {name}
        <span className="text-400 text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity">
          ↗
        </span>
      </a>
    </li>
  )
}

function ContactItem({label, value}: {label: string; value: string}) {
  return (
    <li className="flex items-baseline gap-4">
      <span className="text-500 w-20 text-xs font-mono uppercase tracking-wider shrink-0">
        {label}
      </span>
      <span className="text-900 font-mono text-sm">{value}</span>
    </li>
  )
}
