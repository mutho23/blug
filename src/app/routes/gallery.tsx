import {useLoaderData} from '@remix-run/react'
import {json} from '@remix-run/node'
import {useState, useEffect, useCallback, useRef} from 'react'

const HANDLE = 'mutho.my.id'

// ─── wsrv.nl proxy ────────────────────────────────────────────────────────────
// Grid thumbnail: kecil & ringan. Lightbox: lebih besar tapi tetap dikompres.
// Ubah angka di sini kalau mau sesuaikan kualitas vs kecepatan.
const THUMB_W = 400
const THUMB_Q = 55
const FULL_W  = 900
const FULL_Q  = 70

function toWsrv(blobUrl: string, w: number, q: number) {
  const stripped = blobUrl.replace(/^https?:\/\//, '')
  return `https://wsrv.nl/?url=${stripped}&w=${w}&q=${q}&output=webp&we=1`
}
// ──────────────────────────────────────────────────────────────────────────────

// Cache DID di server memory supaya tidak perlu resolve setiap request
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
  const photosData = await photosRes.json()
  const photos: any[] = photosData.records ?? []

  const galleries = (galleriesData.records ?? []).map((gallery: any) => {
    const galleryTime = gallery.value.createdAt
    const matchedPhotos = photos.filter(
      (photo: any) => photo.value.createdAt === galleryTime,
    )
    const images = matchedPhotos.map((photo: any) => {
      const blobUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${photo.value.photo.ref.$link}`
      return {
        url: toWsrv(blobUrl, THUMB_W, THUMB_Q),       // untuk grid
        fullUrl: toWsrv(blobUrl, FULL_W, FULL_Q),     // untuk lightbox
        width: photo.value.aspectRatio?.width ?? 1,
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

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: {url: string; fullUrl: string}[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)

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

  // Preload prev & next
  useEffect(() => {
    if (images.length <= 1) return
    new Image().src = images[(index + 1) % images.length].fullUrl
    new Image().src = images[(index - 1 + images.length) % images.length].fullUrl
  }, [index, images])

  // Touch swipe
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
    touchStartX.current = null
  }, [next, prev])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}>
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light z-10"
        onClick={onClose}>
        ✕
      </button>

      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/50">
          {index + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl z-10 px-2"
          onClick={e => { e.stopPropagation(); prev() }}>
          ‹
        </button>
      )}

      {/*
        Progressive: thumbnail (sudah di-cache dari grid) muncul instan sebagai blur,
        fullUrl load di belakang. Begitu selesai, blur disembunyikan.
      */}
      <div
        className="relative flex items-center justify-center"
        style={{maxHeight: '90vh', maxWidth: '90vw'}}
        onClick={e => e.stopPropagation()}>
        <img
          key={`thumb-${index}`}
          src={images[index].url}
          alt={`Photo ${index + 1}`}
          className="absolute max-h-full max-w-full object-contain blur-sm"
          style={{maxHeight: '90vh', maxWidth: '90vw'}}
        />
        <img
          key={`full-${index}`}
          src={images[index].fullUrl}
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

      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl z-10 px-2"
          onClick={e => { e.stopPropagation(); next() }}>
          ›
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIndex(i) }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MasonryGrid({
  images,
  title,
  onPhotoClick,
  eager = false,
}: {
  images: {url: string; fullUrl: string; width: number; height: number}[]
  title: string
  onPhotoClick: (index: number) => void
  eager?: boolean
}) {
  if (images.length === 0) {
    return (
      <div className="w-full h-48 bg-100 flex items-center justify-center">
        <span className="font-mono text-xs text-300">no photo</span>
      </div>
    )
  }

  if (images.length === 1) {
    const {url, width, height} = images[0]
    const paddingTop = `${(height / width) * 100}%`
    return (
      <div
        className="w-full relative overflow-hidden cursor-zoom-in"
        style={{paddingTop}}
        onClick={e => { e.preventDefault(); onPhotoClick(0) }}>
        <img
          src={url}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          // @ts-expect-error fetchpriority valid HTML
          fetchpriority={eager ? 'high' : 'low'}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-px bg-200 overflow-hidden">
        {images.map((img, i) => {
          const paddingTop = `${(img.height / img.width) * 100}%`
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-zoom-in"
              style={{paddingTop}}
              onClick={e => { e.preventDefault(); onPhotoClick(i) }}>
              <img
                src={img.url}
                alt={`${title} ${i + 1}`}
                loading={eager ? 'eager' : 'lazy'}
                // @ts-expect-error fetchpriority valid HTML
                fetchpriority={eager && i === 0 ? 'high' : 'low'}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
          )
        })}
      </div>
    )
  }

  // Foto ganjil: pasangkan dulu yang bisa dipasangkan,
  // foto terakhir ditampilkan full-width agar tidak ada kolom kosong
  const isOdd = images.length % 2 !== 0
  const paired = isOdd ? images.slice(0, -1) : images
  const lastImg = isOdd ? images[images.length - 1] : null

  const col1: any[] = []
  const col2: any[] = []
  paired.forEach((img, i) => {
    if (i % 2 === 0) col1.push({...img, origIndex: i})
    else col2.push({...img, origIndex: i})
  })

  return (
    <div className="flex flex-col gap-px bg-200 overflow-hidden">
      <div className="grid grid-cols-2 gap-px">
        <div className="flex flex-col gap-px">
          {col1.map((img: any, i) => {
            const paddingTop = `${(img.height / img.width) * 100}%`
            return (
              <div
                key={i}
                className="relative overflow-hidden cursor-zoom-in"
                style={{paddingTop}}
                onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
                <img
                  src={img.url}
                  alt={`${title} ${img.origIndex + 1}`}
                  loading={eager ? 'eager' : 'lazy'}
                  // @ts-expect-error fetchpriority valid HTML
                  fetchpriority={eager && i === 0 ? 'high' : 'low'}
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
              </div>
            )
          })}
        </div>
        <div className="flex flex-col gap-px">
          {col2.map((img: any, i) => {
            const paddingTop = `${(img.height / img.width) * 100}%`
            return (
              <div
                key={i}
                className="relative overflow-hidden cursor-zoom-in"
                style={{paddingTop}}
                onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
                <img
                  src={img.url}
                  alt={`${title} ${img.origIndex + 1}`}
                  loading={eager ? 'eager' : 'lazy'}
                  // @ts-expect-error fetchpriority valid HTML
                  fetchpriority="low"
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
              </div>
            )
          })}
        </div>
      </div>
      {lastImg && (
        <div
          className="relative overflow-hidden cursor-zoom-in"
          style={{paddingTop: `${(lastImg.height / lastImg.width) * 100}%`}}
          onClick={e => { e.preventDefault(); onPhotoClick(images.length - 1) }}>
          <img
            src={lastImg.url}
            alt={`${title} ${images.length}`}
            loading={eager ? 'eager' : 'lazy'}
            // @ts-expect-error fetchpriority valid HTML
            fetchpriority="low"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        </div>
      )}
    </div>
  )
}

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()
  const [lightbox, setLightbox] = useState<{
    images: {url: string; fullUrl: string}[]
    index: number
  } | null>(null)

  return (
    <article className="container mx-auto pt-12 md:pt-20 pb-24 px-6">
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      <header className="flex flex-col gap-5 mb-12 md:mb-16 max-w-prose">
        <a href="/" className="label hover:text-600 transition-colors w-fit">
          back to writing
        </a>
        <h1 className="font-display text-950 text-4xl md:text-6xl leading-[1.02]">
          Gallery
        </h1>
        <p className="font-sans text-500 text-lg">
          Koleksi tempat dari grain.social
        </p>
      </header>

      {galleries.length === 0 ? (
        <div className="max-w-prose">
          <p className="font-sans text-500 text-lg">Belum ada gallery.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {galleries.map((gallery: any, index: number) => {
            const value = gallery.value
            const uriParts = gallery.uri.split('/')
            const rkey = uriParts[uriParts.length - 1]

            return (
              <div
                key={gallery.uri}
                className="group break-inside-avoid block border border-100 rounded-md overflow-hidden bg-50 hover:border-300 transition-colors">
                <MasonryGrid
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
                  className="flex flex-col gap-2 p-5 block">
                  <h2 className="font-display text-xl text-950 group-hover:text-600 transition-colors">
                    {value.title ?? 'Untitled'}
                  </h2>
                  {value.address ? (
                    <p className="font-sans text-sm text-500">
                      {value.address.locality}
                      {value.address.region ? ', ' + value.address.region : ''}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <p className="font-mono text-xs text-300">
                      {new Date(value.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {gallery.images.length > 0 ? (
                      <p className="font-mono text-xs text-300">
                        {gallery.images.length} foto
                      </p>
                    ) : null}
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
