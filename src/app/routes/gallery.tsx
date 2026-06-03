import {useLoaderData, NavLink} from '@remix-run/react'
import {json} from '@remix-run/node'
import {useState, useEffect, useCallback, useRef} from 'react'

// ── Constants & helpers (identical to original) ──────────────────────────────

const HANDLE = 'mutho.my.id'
const THUMB_W = 480, THUMB_Q = 60
const FULL_W  = 1200, FULL_Q  = 80

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

  return json(
    {galleries, did},
    {headers: {Link: '<https://wsrv.nl>; rel=preconnect, <https://bsky.social>; rel=preconnect'}},
  )
}

// ── Types ────────────────────────────────────────────────────────────────────

type ImageItem = {thumb: string; full: string; width: number; height: number}

// ── Lightbox (identical logic, same Tailwind classes) ─────────────────────────

function Lightbox({images, initialIndex, onClose}: {
  images: ImageItem[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {document.body.style.overflow = ''}
  }, [])

  useEffect(() => {
    if (images.length <= 1) return
    new Image().src = images[(index + 1) % images.length].full
    new Image().src = images[(index - 1 + images.length) % images.length].full
  }, [index, images])

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
          onClick={e => {e.stopPropagation(); prev()}}>
          ‹
        </button>
      )}
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
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl z-10 px-2"
          onClick={e => {e.stopPropagation(); next()}}>
          ›
        </button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => {e.stopPropagation(); setIndex(i)}}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── MasonryGrid (identical logic) ────────────────────────────────────────────

const GRID_H = 'h-48'

function MasonryGrid({images, title, onPhotoClick, eager = false}: {
  images: ImageItem[]
  title: string
  onPhotoClick: (index: number) => void
  eager?: boolean
}) {
  if (images.length === 0) {
    return (
      <div
        className="w-full h-48 flex items-center justify-center"
        style={{background: 'var(--bg-3)'}}>
        <span style={{fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-3)'}}>
          no photo
        </span>
      </div>
    )
  }

  if (images.length === 1) {
    const {thumb, width, height} = images[0]
    const paddingTop = `${(height / width) * 100}%`
    return (
      <div
        className="w-full relative overflow-hidden cursor-zoom-in"
        style={{paddingTop, background: '#000'}}
        onClick={e => {e.preventDefault(); onPhotoClick(0)}}>
        <img
          src={thumb}
          alt={title}
          loading={eager ? 'eager' : 'lazy'}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2" style={{gap: '1px', background: 'var(--border)'}}>
        {images.map((img, i) => (
          <div
            key={i}
            className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`}
            onClick={e => {e.preventDefault(); onPhotoClick(i)}}>
            <img
              src={img.thumb}
              alt={`${title} ${i + 1}`}
              loading={eager ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    )
  }

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
    <div className="flex flex-col" style={{gap: '1px', background: 'var(--border)'}}>
      <div className="grid grid-cols-2" style={{gap: '1px'}}>
        <div className="flex flex-col" style={{gap: '1px'}}>
          {col1.map((img: any, i) => (
            <div
              key={i}
              className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`}
              onClick={e => {e.preventDefault(); onPhotoClick(img.origIndex)}}>
              <img
                src={img.thumb}
                alt={`${title} ${img.origIndex + 1}`}
                loading={eager ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col" style={{gap: '1px'}}>
          {col2.map((img: any, i) => (
            <div
              key={i}
              className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`}
              onClick={e => {e.preventDefault(); onPhotoClick(img.origIndex)}}>
              <img
                src={img.thumb}
                alt={`${title} ${img.origIndex + 1}`}
                loading={eager ? 'eager' : 'lazy'}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      {lastImg && (
        <div
          className={`relative ${GRID_H} overflow-hidden cursor-zoom-in`}
          onClick={e => {e.preventDefault(); onPhotoClick(images.length - 1)}}>
          <img
            src={lastImg.thumb}
            alt={`${title} ${images.length}`}
            loading={eager ? 'eager' : 'lazy'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  )
}

// ── Gallery page ──────────────────────────────────────────────────────────────

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()
  const [lightbox, setLightbox] = useState<{images: ImageItem[]; index: number} | null>(null)

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

        <div>
          <p className="bl-widget-label">Info</p>
          <p style={{fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-2)', lineHeight: 1.7}}>
            Photos synced from{' '}
            <a
              href="https://grain.social"
              target="_blank"
              rel="noreferrer"
              style={{color: 'var(--accent)'}}>
              Grain
            </a>
            {' '}via ATProto.
          </p>
        </div>

        <div style={{marginTop: 'auto'}}>
          <p className="bl-widget-label">Stats</p>
          <div>
            <div className="bl-stat">
              <span className="bl-stat-lbl">Albums</span>
              <span className="bl-stat-val">{galleries.length}</span>
            </div>
            <div className="bl-stat">
              <span className="bl-stat-lbl">Photos</span>
              <span className="bl-stat-val">
                {galleries.reduce((acc: number, g: any) => acc + (g.images?.length ?? 0), 0)}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="bl-main">
        {lightbox && (
          <Lightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}

        <section className="bl-hero">
          <p className="bl-hero-eyebrow">Photo archive</p>
          <h1 className="bl-hero-title">Gallery<span className="accent">.</span></h1>
          <p className="bl-hero-sub">Just dropping some memories here.</p>
        </section>

        {galleries.length === 0 ? (
          <p style={{fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-3)', padding: '2rem 0'}}>
            Belum ada gallery.
          </p>
        ) : (
          <div className="bl-gallery-grid">
            {galleries.map((gallery: any, index: number) => {
              const value = gallery.value
              const rkey  = gallery.uri.split('/').pop()

              return (
                <div key={gallery.uri} className="bl-gallery-card">
                  <MasonryGrid
                    images={gallery.images}
                    title={value.title ?? 'Gallery'}
                    eager={index === 0}
                    onPhotoClick={i => setLightbox({images: gallery.images, index: i})}
                  />
                  <a
                    href={`https://grain.social/profile/${did}/gallery/${rkey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bl-gallery-card-body"
                    style={{display: 'block', textDecoration: 'none'}}>
                    <h2 className="bl-gallery-card-title">{value.title ?? 'Untitled'}</h2>
                    {value.address && (
                      <p className="bl-gallery-card-loc">
                        {value.address.locality}
                        {value.address.region ? `, ${value.address.region}` : ''}
                      </p>
                    )}
                    <div className="bl-gallery-card-footer">
                      <span className="bl-gallery-card-meta">
                        {new Date(value.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                      {gallery.images.length > 0 && (
                        <span className="bl-gallery-card-meta">
                          {gallery.images.length} foto
                        </span>
                      )}
                    </div>
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ─── RIGHT SIDEBAR ─── */}
      <aside className="bl-sidebar bl-sidebar-r">
        <div>
          <p className="bl-widget-label">Collection</p>
          <div>
            <div className="bl-stat">
              <span className="bl-stat-lbl">Albums</span>
              <span className="bl-stat-val">{galleries.length}</span>
            </div>
            <div className="bl-stat">
              <span className="bl-stat-lbl">Photos</span>
              <span className="bl-stat-val">
                {galleries.reduce((acc: number, g: any) => acc + (g.images?.length ?? 0), 0)}
              </span>
            </div>
          </div>
        </div>

        {galleries.length > 0 && (
          <div>
            <p className="bl-widget-label">Recent Albums</p>
            {galleries.slice(0, 5).map((gallery: any) => {
              const rkey = gallery.uri.split('/').pop()
              return (
                <a
                  key={gallery.uri}
                  href={`https://grain.social/profile/${did}/gallery/${rkey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bl-mini-item">
                  <p className="bl-mini-title">{gallery.value.title ?? 'Untitled'}</p>
                  <p className="bl-mini-meta">
                    {gallery.images.length} foto ·{' '}
                    {new Date(gallery.value.createdAt).toLocaleDateString('id-ID', {month: 'short', year: 'numeric'})}
                  </p>
                </a>
              )
            })}
          </div>
        )}

        <div style={{marginTop: 'auto'}}>
          <p className="bl-widget-label">Source</p>
          <ul className="bl-nav">
            <li>
              <a href="https://grain.social" target="_blank" rel="noreferrer">
                <span className="ico">↗</span>Grain Social
              </a>
            </li>
          </ul>
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
