import {useEffect, useRef} from 'react'

export function GiscusComments() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || ref.current.hasChildNodes()) return

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', 'mutho23/blug')
    script.setAttribute('data-repo-id', 'R_kgDOSpjFJw')
    script.setAttribute('data-category', 'General')
    script.setAttribute('data-category-id', 'DIC_kwDOSpjFJ84C-N14')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', 'en')
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    ref.current.appendChild(script)
  }, [])

  return (
    <section className="max-w-prose mt-16 pt-10 border-t border-100">
      <h2 className="font-display text-2xl text-950 mb-6">Komentar</h2>
      <div ref={ref} />
    </section>
  )
}
