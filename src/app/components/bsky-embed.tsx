import {useEffect, useRef} from 'react'

/**
 * Nampilin embed post Bluesky resmi (like/reply/repost count + tombol reply bawaan).
 * Dipakai baik di halaman blog post (block Bluesky dari Leaflet) maupun halaman
 * review (post hasil cross-post otomatis dari Popfeed).
 */
export function BskyEmbed({postUri}: {postUri: string}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const blockquote = document.createElement('blockquote')
    blockquote.className = 'bluesky-embed'
    blockquote.dataset.blueskyUri = postUri
    containerRef.current.appendChild(blockquote)
    if (!document.querySelector('script[src="https://embed.bsky.app/static/embed.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://embed.bsky.app/static/embed.js'
      script.async = true
      script.charset = 'utf-8'
      document.body.appendChild(script)
    } else {
      ;(window as any).bluesky?.scan?.()
    }
    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [postUri])

  return <div ref={containerRef} className="flex justify-center my-4" />
}
