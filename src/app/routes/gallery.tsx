import {useLoaderData} from '@remix-run/react'
import {json} from '@remix-run/node'
import {useState, useEffect, useCallback, useRef} from 'react'

const HANDLE = 'mutho.my.id'
const THUMB_W = 480, THUMB_Q = 60, FULL_W = 1200, FULL_Q = 80

function wsrv(url: string, w: number, q: number) {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=${q}&output=webp&we=1`
}

let _did: string | null = null, _didAt = 0
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
  const photosData = await photosRes.json()
  const photos: any[] = photosData.records ?? []

  const galleries = (galleriesData.records ?? []).map((gallery: any) => {
    const galleryTime = gallery.value.createdAt
    const matchedPhotos = photos.filter((photo: any) => photo.value.createdAt === galleryTime)
    const images = matchedPhotos.map((photo: any) => {
      const blobUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${photo.value.photo.ref.$link}`
      return {
        thumb: wsrv(blobUrl, THUMB_W, THUMB_Q),
        full: wsrv(blobUrl, FULL_W, FULL_Q),
        width: photo.value.aspectRatio?.width ?? 1,
        height: photo.value.aspectRatio?.height ?? 1,
      }
    })
    return {...gallery, images}
  })

  return json({galleries, did}, {
    headers: {Link: '<https://wsrv.nl>; rel=preconnect, <https://bsky.social>; rel=preconnect'},
  })
}

type ImageItem = {thumb: string; full: string; width: number; height: number}

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

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  useEffect(() => {
    if (images.length <= 1) return
    new Image().src = images[(index + 1) % images.length].full
    new Image().src = images[(index - 1 + images.length) % images.length].full
  }, [index, images])

  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }, [])
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
    touchStartX.current = null
  }, [next, prev])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light z-10" onClick={onClose}>✕</button>
      {images.length > 1 && <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/50">{index + 1} / {images.length}</div>}
      {images.length > 1 && (
        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl z-10 px-2" onClick={e => { e.stopPropagation(); prev() }}>‹</button>
      )}
      <div className="relative flex items-center justify-center" style={{maxHeight: '90vh', maxWidth: '90vw'}} onClick={e => e.stopPropagation()}>
        <img key={`t-${index}`} src={images[index].thumb} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain blur-sm scale-105" />
        <img key={`f-${index}`} src={images[index].full} alt={`Photo ${index + 1}`}
          className="relative max-h-full max-w-full object-contain" style={{maxHeight: '90vh', maxWidth: '90vw'}}
          onLoad={e => { const thumb = e.currentTarget.previousElementSibling as HTMLElement | null; if (thumb) thumb.style.display = 'none' }} />
      </div>
      {images.length > 1 && (
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl z-10 px-2" onClick={e => { e.stopPropagation(); next() }}>›</button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIndex(i) }} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

const GRID_H = 'h-48'

function MasonryGrid({images, title, onPhotoClick, eager = false}: {images: ImageItem[]; title: string; onPhotoClick: (index: number) => void; eager?: boolean}) {
  if (images.length === 0) return <div className="w-full h-48 bg-100 flex items-center justify-center"><span className="font-mono text-xs text-300">no photo</span></div>

  if (images.length === 1) {
    const {thumb, width, height} = images[0]
    return (
      <div className="w-full relative overflow-hidden cursor-zoom-in bg-black" style={{paddingTop: `${(height / width) * 100}%`}} onClick={e => { e.preventDefault(); onPhotoClick(0) }}>
        <img src={thumb} alt={title} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-contain" />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-px bg-200 overflow-hidden">
        {images.map((img, i) => (
          <div key={i} className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`} onClick={e => { e.preventDefault(); onPhotoClick(i) }}>
            <img src={img.thumb} alt={`${title} ${i + 1}`} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ))}
      </div>
    )
  }

  const isOdd = images.length % 2 !== 0
  const paired = isOdd ? images.slice(0, -1) : images
  const lastImg = isOdd ? images[images.length - 1] : null
  const col1: any[] = [], col2: any[] = []
  paired.forEach((img, i) => { if (i % 2 === 0) col1.push({...img, origIndex: i}); else col2.push({...img, origIndex: i}) })

  return (
    <div className="flex flex-col gap-px bg-200 overflow-hidden">
      <div className="grid grid-cols-2 gap-px">
        <div className="flex flex-col gap-px">
          {col1.map((img: any, i) => (
            <div key={i} className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`} onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
              <img src={img.thumb} alt={`${title} ${img.origIndex + 1}`} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-px">
          {col2.map((img: any, i) => (
            <div key={i} className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`} onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
              <img src={img.thumb} alt={`${title} ${img.origIndex + 1}`} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      {lastImg && (
        <div className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`} onClick={e => { e.preventDefault(); onPhotoClick(images.length - 1) }}>
          <img src={lastImg.thumb} alt={`${title} ${images.length}`} loading={eager ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}
    </div>
  )
}

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()
  const [lightbox, setLightbox] = useState<{images: ImageItem[]; index: number} | null>(null)

  return (
    <ThreeColumnLayout>
      {lightbox && <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      <header className="flex flex-col gap-3 mb-8 md:mb-10">
        <h1 className="font-display text-950 text-4xl md:text-6xl leading-[1.02]">Gallery</h1>
        <p className="font-sans text-500 text-lg">Just dropping some memories here.</p>
      </header>

      {galleries.length === 0 ? (
        <p className="font-sans text-500 text-lg">Belum ada gallery.</p>
      ) : (
        <div className="columns-1 md:columns-2 gap-4 space-y-4">
          {galleries.map((gallery: any, index: number) => {
            const value = gallery.value
            const rkey = gallery.uri.split('/').at(-1)
            return (
              <div key={gallery.uri} className="group break-inside-avoid block border border-100 rounded-md overflow-hidden bg-50 hover:border-300 transition-colors">
                <MasonryGrid images={gallery.images} title={value.title ?? 'Gallery'} eager={index === 0} onPhotoClick={i => setLightbox({images: gallery.images, index: i})} />
                <a href={`https://grain.social/profile/${did}/gallery/${rkey}`} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-2 p-4 block">
                  <h2 className="font-display text-xl text-950 group-hover:text-600 transition-colors">{value.title ?? 'Untitled'}</h2>
                  {value.address ? (
                    <p className="font-sans text-sm text-500">{value.address.locality}{value.address.region ? ', ' + value.address.region : ''}</p>
                  ) : null}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <p className="font-mono text-xs text-300">{new Date(value.createdAt).toLocaleDateString('id-ID', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
                    {gallery.images.length > 0 && <p className="font-mono text-xs text-300">{gallery.images.length} foto</p>}
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      )}
    </ThreeColumnLayout>
  )
}

function ThreeColumnLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-[180px_1fr_180px] gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <ProfileCard />
          </div>
        </aside>
        <main className="min-w-0 pb-12">{children}</main>
        <aside className="hidden lg:block" />
      </div>
    </div>
  )
}

function ProfileCard() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-mono text-zinc-300 shrink-0">M</div>
        <div>
          <p className="font-display text-base text-zinc-100 leading-tight">Mutho</p>
          <p className="font-mono text-[11px] text-zinc-500">mutho.my.id</p>
        </div>
      </div>
      <p className="font-sans text-[13px] text-zinc-400 leading-relaxed">
        Guru & murid abadi. Nulis soal code, manga, filosofi, & hal-hal kecil yang menarik.
      </p>
      <div className="flex flex-col gap-1.5">
        {[
          {label: 'Bluesky', href: 'https://bsky.app/profile/mutho.my.id', icon: '☁'},
          {label: 'GitHub', href: 'https://github.com/muthohhar', icon: '⌥'},
          {label: 'RSS', href: '/rss.xml', icon: '◉'},
        ].map(({label, href, icon}) => (
          <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
            className="flex items-center gap-2.5 font-mono text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors group">
            <span className="text-[10px] text-zinc-600 group-hover:text-[#5EA2FF] transition-colors">{icon}</span>
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
