import {useState, useEffect, useRef, useCallback} from 'react'
import {json} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import {AtpAgent} from '@atproto/api'

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader() {
  const did = process.env.BLUESKY_DID
  if (!did) throw new Response('DID not configured', {status: 500})

  const agent = new AtpAgent({service: 'https://bsky.social'})

  const res = await agent.api.com.atproto.repo.listRecords({
    repo: did,
    collection: 'social.grain.gallery',
    limit: 50,
  })

  const galleries = await Promise.all(
    res.data.records.map(async (record: any) => {
      const value = record.value as any
      const imageRefs: any[] = value.images ?? []

      const images = imageRefs.map((img: any) => {
        const cid =
          img.image?.ref?.$link ??
          img.image?.ref?.toString() ??
          img.image?.cid ??
          ''
        const width = img.image?.aspectRatio?.width ?? img.aspectRatio?.width ?? 1
        const height = img.image?.aspectRatio?.height ?? img.aspectRatio?.height ?? 1
        return {
          url: `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@jpeg`,
          thumbUrl: `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`,
          blurUrl: `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`,
          width,
          height,
          cid,
        }
      })

      return {uri: record.uri, value, images}
    }),
  )

  return json({galleries, did})
}

// ─── Progressive Image ────────────────────────────────────────────────────────
// Loads thumb first (blurry), then swaps to full resolution when in viewport

function ProgressiveImage({
  src,
  thumbSrc,
  alt,
  className,
  style,
}: {
  src: string
  thumbSrc: string
  alt: string
  className?: string
  style?: React.CSSProperties
}) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer untuk lazy loading
  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {rootMargin: '200px'}, // preload 200px sebelum masuk viewport
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={className} style={style}>
      {/* Skeleton shimmer saat belum ada gambar sama sekali */}
      {!thumbLoaded && (
        <div className="absolute inset-0 skeleton-shimmer" />
      )}

      {/* Thumbnail (blur placeholder) — load segera saat inView */}
      {inView && (
        <img
          src={thumbSrc}
          alt=""
          aria-hidden
          onLoad={() => setThumbLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'blur(8px)',
            transform: 'scale(1.05)', // tutup tepi blur
            opacity: thumbLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Full resolution — load setelah thumb tampil */}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          style={{
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: {url: string; thumbUrl: string}[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [imgLoaded, setImgLoaded] = useState(false)

  const prev = useCallback(
    () => setIndex(i => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setIndex(i => (i + 1) % images.length),
    [images.length],
  )

  useEffect(() => {
    setImgLoaded(false)
  }, [index])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  const current = images[index]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}>
      {/* Blur placeholder fullscreen */}
      <img
        src={current.thumbUrl}
        aria-hidden
        alt=""
        className="absolute inset-0 w-full h-full object-contain"
        style={{filter: 'blur(20px)', transform: 'scale(1.1)', opacity: imgLoaded ? 0 : 0.6, transition: 'opacity 0.3s'}}
      />

      {/* Full image */}
      <img
        key={current.url}
        src={current.url}
        alt={`Photo ${index + 1}`}
        onLoad={() => setImgLoaded(true)}
        onClick={e => e.stopPropagation()}
        className="relative z-10 max-h-[90vh] max-w-[90vw] object-contain"
        style={{opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s ease'}}
      />

      {/* Controls */}
      {images.length > 1 && (
        <>
          <button
            onClick={e => {e.stopPropagation(); prev()}}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white text-4xl px-3 py-2 transition-colors">
            ‹
          </button>
          <button
            onClick={e => {e.stopPropagation(); next()}}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white text-4xl px-3 py-2 transition-colors">
            ›
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={e => {e.stopPropagation(); setIndex(i)}}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === index ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 text-white/70 hover:text-white text-2xl transition-colors">
        ✕
      </button>
    </div>
  )
}

// ─── Masonry Grid ─────────────────────────────────────────────────────────────

function MasonryGrid({
  images,
  title,
  onPhotoClick,
}: {
  images: any[]
  title: string
  onPhotoClick: (index: number) => void
}) {
  const indexed = images.map((img, i) => ({...img, origIndex: i}))
  const col1 = indexed.filter((_, i) => i % 2 === 0)
  const col2 = indexed.filter((_, i) => i % 2 === 1)

  return (
    <div className="flex gap-px">
      <div className="flex flex-col gap-px flex-1">
        {col1.map((img, i) => {
          const paddingTop = `${(img.height / img.width) * 100}%`
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-zoom-in"
              style={{paddingTop}}
              onClick={e => {e.preventDefault(); onPhotoClick(img.origIndex)}}>
              <ProgressiveImage
                src={img.url}
                thumbSrc={img.thumbUrl}
                alt={`${title} ${img.origIndex + 1}`}
                className="absolute inset-0 w-full h-full"
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
              />
            </div>
          )
        })}
      </div>
      <div className="flex flex-col gap-px flex-1">
        {col2.map((img, i) => {
          const paddingTop = `${(img.height / img.width) * 100}%`
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-zoom-in"
              style={{paddingTop}}
              onClick={e => {e.preventDefault(); onPhotoClick(img.origIndex)}}>
              <ProgressiveImage
                src={img.url}
                thumbSrc={img.thumbUrl}
                alt={`${title} ${img.origIndex + 1}`}
                className="absolute inset-0 w-full h-full"
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Gallery Page ─────────────────────────────────────────────────────────────

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()
  const [lightbox, setLightbox] = useState<{
    images: {url: string; thumbUrl: string}[]
    index: number
  } | null>(null)

  return (
    <>
      {/* Skeleton shimmer CSS — injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-50, #f9fafb) 25%,
            var(--color-100, #f3f4f6) 50%,
            var(--color-50, #f9fafb) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
      `}</style>

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
            {galleries.map((gallery: any) => {
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
                    onPhotoClick={index =>
                      setLightbox({images: gallery.images, index})
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
    </>
  )
}
