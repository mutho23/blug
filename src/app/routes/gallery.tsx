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
  const res = await fetch(
    `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}`,
  )
  const {did} = await res.json()
  _did = did
  _didAt = Date.now()
  return did
}

export const loader = async () => {
  const did = await resolveDid()

  const [galleriesRes, photosRes] = await Promise.all([
    fetch(
      `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=social.grain.gallery&limit=30`,
    ),
    fetch(
      `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=social.grain.photo&limit=100`,
    ),
  ])

  const galleriesData = await galleriesRes.json()
  const photosData    = await photosRes.json()
  const photos: any[] = photosData.records ?? []

  const galleries = (galleriesData.records ?? []).map((gallery: any) => {
    const galleryTime   = gallery.value.createdAt
    const matchedPhotos = photos.filter(
      (photo: any) => photo.value.createdAt === galleryTime,
    )
    const images = matchedPhotos.map((photo: any) => {
      const blobUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${photo.value.photo.ref.$link}`
      return {
        thumb:  wsrv(blobUrl, THUMB_W, THUMB_Q),
        full:   wsrv(blobUrl, FULL_W,  FULL_Q),
        width:  photo.value.aspectRatio?.width  ?? 1,
        height: photo.value.aspectRatio?.height ?? 1,
      }
    })
    return {...gallery, images}
  })

  return json(
    {galleries, did},
    {
      headers: {
        Link: '<https://wsrv.nl>; rel=preconnect, <https://bsky.social>; rel=preconnect',
      },
    },
  )
}

type ImageItem = {thumb: string; full: string; width: number; height: number}

/* ── Lightbox ── */
function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: ImageItem[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(
    () => setIndex(i => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setIndex(i => (i + 1) % images.length),
    [images.length],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowLeft')   prev()
      if (e.key === 'ArrowRight')  next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (images.length <= 1) return
    new Image().src = images[(index + 1) % images.length].full
    new Image().src = images[(index - 1 + images.length) % images.length].full
  }, [index, images])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX },
    [],
  )
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const diff = touchStartX.current - e.changedTouches[0].clientX
      if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
      touchStartX.current = null
    },
    [next, prev],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>

      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl z-10 transition-colors"
        onClick={onClose}>
        ✕
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 font-mono-dm text-[11px] tracking-widest text-white/40">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 text-4xl text-white/50 hover:text-white z-10 px-2 transition-colors"
          onClick={e => { e.stopPropagation(); prev() }}>
          ‹
        </button>
      )}

      {/* Image */}
      <div
        className="relative flex items-center justify-center"
        style={{maxHeight: '90vh', maxWidth: '90vw'}}
        onClick={e => e.stopPropagation()}>
        <img
          key={`t-${index}`}
          src={images[index].thumb}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-contain blur-sm scale-105"
        />
        <img
          key={`f-${index}`}
          src={images[index].full}
          alt={`Photo ${index + 1}`}
          // @ts-expect-error fetchpriority valid HTML
          fetchpriority="high"
          className="relative max-h-full max-w-full object-contain"
          style={{maxHeight: '90vh', maxWidth: '90vw'}}
          onLoad={e => {
            const thumb = e.currentTarget.previousElementSibling as HTMLElement | null
            if (thumb) thumb.style.display = 'none'
          }}
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-4xl text-white/50 hover:text-white z-10 px-2 transition-colors"
          onClick={e => { e.stopPropagation(); next() }}>
          ›
        </button>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIndex(i) }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === index ? 'bg-white' : 'bg-white/25'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Photo Grid ── */
const CELL_H = 'h-44'

function PhotoGrid({
  images,
  title,
  onPhotoClick,
  eager = false,
}: {
  images: ImageItem[]
  title: string
  onPhotoClick: (index: number) => void
  eager?: boolean
}) {
  if (images.length === 0) {
    return (
      <div className="w-full h-44 bg-zinc-900 flex items-center justify-center">
        <span className="font-mono-dm text-xs text-zinc-700">no photo</span>
      </div>
    )
  }

  if (images.length === 1) {
    const {thumb, width, height} = images[0]
    return (
      <div
        className="w-full relative overflow-hidden cursor-zoom-in bg-black"
        style={{paddingTop: `${(height / width) * 100}%`}}
        onClick={e => { e.preventDefault(); onPhotoClick(0) }}>
        <img
          src={thumb}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          className="gallery-img absolute inset-0 w-full h-full object-contain"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-px bg-zinc-900 overflow-hidden">
        {images.map((img, i) => (
          <div
            key={i}
            className={`relative ${CELL_H} overflow-hidden cursor-zoom-in`}
            onClick={e => { e.preventDefault(); onPhotoClick(i) }}>
            <img
              src={img.thumb}
              alt={`${title} ${i + 1}`}
              loading={eager ? 'eager' : 'lazy'}
              className="gallery-img absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    )
  }

  // 3+ photos: masonry-style 2-col
  const isOdd   = images.length % 2 !== 0
  const paired  = isOdd ? images.slice(0, -1) : images
  const lastImg = isOdd ? images[images.length - 1] : null

  const col1: any[] = []
  const col2: any[] = []
  paired.forEach((img, i) => {
    if (i % 2 === 0) col1.push({...img, origIndex: i})
    else             col2.push({...img, origIndex: i})
  })

  return (
    <div className="flex flex-col gap-px bg-zinc-900 overflow-hidden">
      <div className="grid grid-cols-2 gap-px">
        <div className="flex flex-col gap-px">
          {col1.map((img: any, i: number) => (
            <div
              key={i}
              className={`relative ${CELL_H} overflow-hidden cursor-zoom-in`}
              onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
              <img
                src={img.thumb}
                alt={`${title} ${img.origIndex + 1}`}
                loading={eager ? 'eager' : 'lazy'}
                className="gallery-img absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-px">
          {col2.map((img: any, i: number) => (
            <div
              key={i}
              className={`relative ${CELL_H} overflow-hidden cursor-zoom-in`}
              onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
              <img
                src={img.thumb}
                alt={`${title} ${img.origIndex + 1}`}
                loading={eager ? 'eager' : 'lazy'}
                className="gallery-img absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      {lastImg && (
        <div
          className={`relative ${CELL_H} overflow-hidden cursor-zoom-in`}
          onClick={e => { e.preventDefault(); onPhotoClick(images.length - 1) }}>
          <img
            src={lastImg.thumb}
            alt={`${title} ${images.length}`}
            loading={eager ? 'eager' : 'lazy'}
            className="gallery-img absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  )
}

/* ── Gallery Page ── */
export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()
  const [lightbox, setLightbox] = useState<{images: ImageItem[]; index: number} | null>(null)

  const totalPhotos = galleries.reduce(
    (acc: number, g: any) => acc + g.images.length,
    0,
  )

  return (
    <div className="page-layout">
      {/* ── Left Sidebar ── */}
      <aside className="sidebar-left">
        <div className="sidebar-sticky">
          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
            Gallery
          </p>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="font-display text-2xl text-zinc-100 leading-none">
              {galleries.length}
            </span>
            <span className="font-mono-dm text-[11px] text-zinc-700">albums</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-6">
            <span className="font-display text-2xl text-zinc-100 leading-none">
              {totalPhotos}
            </span>
            <span className="font-mono-dm text-[11px] text-zinc-700">photos</span>
          </div>

          <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
            Navigate
          </p>
          <nav className="flex flex-col gap-0.5">
            <a href="/" className="sidebar-link">Writing</a>
            <a href="/about" className="sidebar-link">About</a>
          </nav>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="page-main">
        {lightbox && (
          <Lightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}

        {/* Hero */}
        <section className="pt-14 pb-9">
          <h1 className="font-display text-5xl md:text-6xl text-zinc-100 leading-[1.03] tracking-tight mb-2">
            Gallery<span className="accent">.</span>
          </h1>
          <p className="font-mono-dm text-sm text-zinc-500">
            Just dropping some memories here.
          </p>
        </section>

        {galleries.length === 0 ? (
          <p className="font-mono-dm text-sm text-zinc-700 py-6">Belum ada gallery.</p>
        ) : (
          <div className="gallery-columns">
            {galleries.map((gallery: any, index: number) => {
              const value    = gallery.value
              const uriParts = gallery.uri.split('/')
              const rkey     = uriParts[uriParts.length - 1]

              return (
                <div
                  key={gallery.uri}
                  className="gallery-card-break group border border-zinc-900 rounded overflow-hidden bg-zinc-950 hover:border-zinc-700 transition-colors">

                  <PhotoGrid
                    images={gallery.images}
                    title={value.title ?? 'Gallery'}
                    eager={index === 0}
                    onPhotoClick={i =>
                      setLightbox({images: gallery.images, index: i})
                    }
                  />

                  <a
                    href={`https://grain.social/profile/${did}/gallery/${rkey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-1 p-3.5">
                    <h2 className="font-display text-[1.1rem] text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
                      {value.title ?? 'Untitled'}
                    </h2>

                    {value.address && (
                      <p className="font-mono-dm text-[11px] text-zinc-500">
                        {value.address.locality}
                        {value.address.region ? ', ' + value.address.region : ''}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <p className="font-mono-dm text-[10px] text-zinc-700">
                        {new Date(value.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {gallery.images.length > 0 && (
                        <p className="font-mono-dm text-[10px] text-zinc-700">
                          {gallery.images.length} foto
                        </p>
                      )}
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="sidebar-right">
        <div className="sidebar-sticky">
          {galleries.length > 0 && (
            <>
              <p className="font-mono-dm text-[10px] tracking-[0.18em] uppercase text-zinc-700 mb-3">
                Recent albums
              </p>
              <div className="flex flex-col">
                {galleries.slice(0, 5).map((g: any) => (
                  <span
                    key={g.uri}
                    className="font-mono-dm text-[11px] text-zinc-500 py-1.5 border-b border-zinc-900 truncate">
                    {g.value.title ?? 'Untitled'}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
