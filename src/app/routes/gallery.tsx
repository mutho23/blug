import {useLoaderData} from '@remix-run/react'
import {json} from '@remix-run/node'
import {useState, useEffect, useCallback, useRef} from 'react'

const HANDLE = 'mutho.my.id'
const THUMB_W = 480
const THUMB_Q = 60
const FULL_W  = 1200
const FULL_Q  = 80

function wsrv(url: string, w: number, q: number) {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=${q}&output=webp&we=1`
}

let _did: string | null = null
let _didAt = 0
async function resolveDid() {
  if (_did && Date.now() - _didAt < 3_600_000) return _did
  const res = await fetch(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}`)
  const {did} = await res.json()
  _did = did; _didAt = Date.now()
  return did
}

export const loader = async () => {
  const did = await resolveDid()
  const [galleriesRes, photosRes] = await Promise.all([
    fetch(`https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=social.grain.gallery&limit=30`),
    fetch(`https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=social.grain.photo&limit=100`),
  ])
  const galleriesData = await galleriesRes.json()
  const photosData    = await photosRes.json()
  const photos: any[] = photosData.records ?? []

  const galleries = (galleriesData.records ?? []).map((gallery: any) => {
    const galleryTime = gallery.value.createdAt
    const matchedPhotos = photos.filter((photo: any) => photo.value.createdAt === galleryTime)
    const images = matchedPhotos.map((photo: any) => {
      const blobUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${photo.value.photo.ref.$link}`
      return {
        thumb: wsrv(blobUrl, THUMB_W, THUMB_Q),
        full:  wsrv(blobUrl, FULL_W, FULL_Q),
        width:  photo.value.aspectRatio?.width  ?? 1,
        height: photo.value.aspectRatio?.height ?? 1,
      }
    })
    return {...gallery, images}
  })

  const totalPhotos = galleries.reduce((sum: number, g: any) => sum + g.images.length, 0)

  return json({galleries, did, totalPhotos}, {
    headers: {Link: '<https://wsrv.nl>; rel=preconnect, <https://bsky.social>; rel=preconnect'},
  })
}

type ImageItem = {thumb: string; full: string; width: number; height: number}

const SOCIALS = [
  {icon: '🦋', label: 'Bluesky',  href: 'https://bsky.app/profile/mutho.my.id'},
  {icon: '💬', label: 'Discord',  href: 'https://discord.gg/dndVwwGhEa'},
  {icon: '🌾', label: 'Grain',    href: 'https://grain.social/profile/mutho.my.id'},
  {icon: '🎵', label: 'Spotify',  href: 'https://open.spotify.com/user/zq8df1jprwpxyiu9mkn691ai8'},
  {icon: '🎮', label: 'Steam',    href: 'https://steamcommunity.com/id/moebatsu'},
  {icon: '🍿', label: 'Popfeed',  href: 'https://popfeed.social/profile/did:plc:kxb2w63yrod2t65mlnecgrlu'},
  {icon: '✉️', label: 'Email',    href: 'mailto:hello@mutho.site'},
]

function Lightbox({images, initialIndex, onClose}: {images: ImageItem[]; initialIndex: number; onClose: () => void}) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)
  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
        touchStartX.current = null
      }}>
      <button className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-light z-10 font-mono" onClick={onClose}>✕</button>
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/40">{index + 1} / {images.length}</div>
      )}
      {images.length > 1 && (
        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10 px-2" onClick={e => { e.stopPropagation(); prev() }}>‹</button>
      )}
      <div className="relative flex items-center justify-center" style={{maxHeight: '90vh', maxWidth: '90vw'}} onClick={e => e.stopPropagation()}>
        <img key={`t-${index}`} src={images[index].thumb} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain blur-sm scale-105" />
        <img key={`f-${index}`} src={images[index].full} alt={`Photo ${index + 1}`}
          className="relative max-h-full max-w-full object-contain" style={{maxHeight: '90vh', maxWidth: '90vw'}}
          onLoad={e => { const t = e.currentTarget.previousElementSibling as HTMLElement | null; if (t) t.style.display = 'none' }} />
      </div>
      {images.length > 1 && (
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10 px-2" onClick={e => { e.stopPropagation(); next() }}>›</button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIndex(i) }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function GalleryThumb({images, title, onPhotoClick, eager = false}: {images: ImageItem[]; title: string; onPhotoClick: (i: number) => void; eager?: boolean}) {
  if (images.length === 0) {
    return (
      <div className="w-full h-40 bg-[#1a1a1a] flex items-center justify-center">
        <span className="font-mono text-[16px] text-[#444]">no photo</span>
      </div>
    )
  }
  if (images.length === 1) {
    const {thumb, width, height} = images[0]
    return (
      <div className="w-full relative overflow-hidden cursor-zoom-in bg-black" style={{paddingTop: `${(height / width) * 100}%`}}
        onClick={e => { e.preventDefault(); onPhotoClick(0) }}>
        <img src={thumb} alt={title} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-contain" />
      </div>
    )
  }
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-px bg-[#1a1a1a] overflow-hidden">
        {images.map((img, i) => (
          <div key={i} className="relative h-40 overflow-hidden cursor-zoom-in" onClick={e => { e.preventDefault(); onPhotoClick(i) }}>
            <img src={img.thumb} alt={`${title} ${i + 1}`} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ))}
      </div>
    )
  }
  const [first, ...rest] = images
  return (
    <div className="flex flex-col gap-px bg-[#1a1a1a] overflow-hidden">
      <div className="relative h-44 cursor-zoom-in" onClick={e => { e.preventDefault(); onPhotoClick(0) }}>
        <img src={first.thumb} alt={title} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="grid gap-px" style={{gridTemplateColumns: `repeat(${Math.min(rest.length, 3)}, 1fr)`}}>
        {rest.slice(0, 3).map((img, i) => (
          <div key={i} className="relative h-24 cursor-zoom-in overflow-hidden" onClick={e => { e.preventDefault(); onPhotoClick(i + 1) }}>
            <img src={img.thumb} alt={`${title} ${i + 2}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            {i === 2 && rest.length > 3 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="font-mono text-white text-sm">+{rest.length - 2}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Gallery() {
  const {galleries, did, totalPhotos} = useLoaderData<typeof loader>()
  const [lightbox, setLightbox] = useState<{images: ImageItem[]; index: number} | null>(null)

  return (
    <div className="flex" style={{minHeight: 'calc(100vh - 52px - 48px)'}}>

      {/* ── Left Sidebar: Contact (sticky) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-[#1e1e1e] px-5 py-6 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
        <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#aaaaaa] mb-3">Contact</p>
        {SOCIALS.map(({icon, label, href}) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2.5 border-b border-[#1a1a1a] last:border-0 group">
            <div className="w-[22px] h-[22px] rounded bg-[#1a1a1a] flex items-center justify-center text-[12px] shrink-0">
              {icon}
            </div>
            <span className="font-mono text-[14px] text-[#cccccc] group-hover:text-white transition-colors truncate">
              {label}
            </span>
          </a>
        ))}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 px-6 md:px-14 py-8 min-w-0">
        {lightbox && (
          <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
        )}

        <header className="mb-8">
          <h1 className="font-display text-[42px] md:text-[46px] text-[#f0f0f0] tracking-[-0.02em]">Gallery</h1>
          <p className="font-mono text-[17px] text-[#aaaaaa] mt-2">Just dropping some memories here.</p>
        </header>

        {galleries.length === 0 ? (
          <p className="font-mono text-[19px] text-[#555]">Belum ada gallery.</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {galleries.map((gallery: any, index: number) => {
              const value = gallery.value
              const rkey  = gallery.uri.split('/').pop()
              return (
                <div key={gallery.uri}
                  className="break-inside-avoid border border-[#1e1e1e] rounded-md overflow-hidden bg-[#0f0f0f] hover:border-[#2a2a2a] transition-colors group">
                  <GalleryThumb
                    images={gallery.images}
                    title={value.title ?? 'Gallery'}
                    eager={index === 0}
                    onPhotoClick={i => setLightbox({images: gallery.images, index: i})}
                  />
                  <a href={`https://grain.social/profile/${did}/gallery/${rkey}`} target="_blank" rel="noopener noreferrer"
                    className="block px-4 py-3">
                    <h2 className="font-display text-[24px] text-[#f0f0f0] group-hover:text-[#4a9eff] transition-colors leading-snug">
                      {value.title ?? 'Untitled'}
                    </h2>
                    {value.address?.locality && (
                      <p className="font-mono text-[13px] text-[#aaaaaa] mt-0.5">
                        {value.address.locality}{value.address.region ? `, ${value.address.region}` : ''}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-mono text-[14px] text-[#aaaaaa]">
                        {new Date(value.createdAt).toLocaleDateString('id-ID', {year: 'numeric', month: 'long', day: 'numeric'})}
                      </p>
                      {gallery.images.length > 0 && (
                        <p className="font-mono text-[14px] text-[#aaaaaa]">{gallery.images.length} foto</p>
                      )}
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Photo count (sticky) ── */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-l border-[#1e1e1e] px-5 py-6 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
        <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-[#aaaaaa] mb-3">Gallery</p>
        <div className="mb-4">
          <div className="font-display text-[36px] text-[#f0f0f0] leading-none">{galleries.length}</div>
          <div className="font-mono text-[12px] text-[#aaaaaa] mt-1">Albums</div>
        </div>
        <div className="mb-6">
          <div className="font-display text-[36px] text-[#f0f0f0] leading-none">{totalPhotos}</div>
          <div className="font-mono text-[12px] text-[#aaaaaa] mt-1">Photos</div>
        </div>
      </aside>

    </div>
  )
}
