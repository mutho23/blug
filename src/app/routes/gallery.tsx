import {useLoaderData} from '@remix-run/react'
import {json} from '@remix-run/node'
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
} from 'react'

const HANDLE = 'mutho.my.id'

const INITIAL_GALLERY_LIMIT = 12

type ImageItem = {
  url: string
  width: number
  height: number
}

export const links = () => {
  return [
    {
      rel: 'preconnect',
      href: 'https://bsky.social',
    },
    {
      rel: 'dns-prefetch',
      href: 'https://bsky.social',
    },
  ]
}

export const loader = async () => {
  const didRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}`,
  )

  const {did} = await didRes.json()

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

    const images = matchedPhotos.map((photo: any) => ({
      url: `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${photo.value.photo.ref.$link}`,
      width: photo.value.aspectRatio?.width ?? 1,
      height: photo.value.aspectRatio?.height ?? 1,
    }))

    return {
      ...gallery,
      images,
    }
  })

  return json({
    galleries,
    did,
  })
}

function useInView(rootMargin = '300px') {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
      },
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [rootMargin])

  return {ref, inView}
}

function ProgressiveImage({
  src,
  alt,
  className,
  eager = false,
  contain = false,
}: {
  src: string
  alt: string
  className?: string
  eager?: boolean
  contain?: boolean
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200" />
      )}

      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`
          ${className}
          ${contain ? 'object-contain bg-black' : 'object-cover'}
          transition-all duration-500
          ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'}
        `}
      />
    </>
  )
}

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

  const prev = useCallback(() => {
    setIndex(i => (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    setIndex(i => (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const nextIndex = (index + 1) % images.length
    const img = new Image()
    img.src = images[nextIndex].url
  }, [index, images])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return

      const diff = touchStartX.current - e.changedTouches[0].clientX

      if (Math.abs(diff) > 50) {
        if (diff > 0) next()
        else prev()
      }

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
      <button
        className="absolute top-4 right-4 z-10 text-3xl font-light text-white/70 hover:text-white"
        onClick={onClose}>
        ✕
      </button>

      <img
        src={images[index].url}
        alt={`Photo ${index + 1}`}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="max-h-screen max-w-full object-contain"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '90vh',
          maxWidth: '90vw',
        }}
      />
    </div>
  )
}

const MasonryGrid = memo(function MasonryGrid({
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
  const {ref, inView} = useInView()

  const shouldRender = eager || inView

  if (images.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center bg-neutral-100">
        <span className="font-mono text-xs text-neutral-400">
          no photo
        </span>
      </div>
    )
  }

  return (
    <div ref={ref}>
      {!shouldRender ? (
        <div className="h-64 animate-pulse bg-neutral-100" />
      ) : (
        <div className="grid grid-cols-2 gap-px overflow-hidden bg-neutral-200">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative h-48 cursor-zoom-in overflow-hidden"
              onClick={() => onPhotoClick(i)}>
              <ProgressiveImage
                src={img.url}
                alt={`${title} ${i + 1}`}
                eager={eager}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()

  const [visibleCount, setVisibleCount] = useState(
    INITIAL_GALLERY_LIMIT,
  )

  const [lightbox, setLightbox] = useState<{
    images: ImageItem[]
    index: number
  } | null>(null)

  const visibleGalleries = useMemo(() => {
    return galleries.slice(0, visibleCount)
  }, [galleries, visibleCount])

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0]

        if (first.isIntersecting) {
          setVisibleCount(prev => prev + 6)
        }
      },
      {
        rootMargin: '600px',
      },
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <article className="container mx-auto px-6 pb-24 pt-12 md:pt-20">
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      <header className="mb-12 flex max-w-prose flex-col gap-5 md:mb-16">
        <h1 className="font-display text-4xl leading-[1.02] text-neutral-950 md:text-6xl">
          Gallery
        </h1>

        <p className="font-sans text-lg text-neutral-500">
          Sometimes you see me. Mostly, you see what I see
        </p>
      </header>

      <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
        {visibleGalleries.map((gallery: any, index: number) => {
          const value = gallery.value

          const uriParts = gallery.uri.split('/')

          const rkey = uriParts[uriParts.length - 1]

          return (
            <div
              key={gallery.uri}
              className="group block break-inside-avoid overflow-hidden rounded-md border border-neutral-100 bg-neutral-50 transition-colors hover:border-neutral-300">
              <MasonryGrid
                images={gallery.images}
                title={value.title ?? 'Gallery'}
                eager={index < 3}
                onPhotoClick={index =>
                  setLightbox({
                    images: gallery.images,
                    index,
                  })
                }
              />

              <a
                href={`https://grain.social/profile/${did}/gallery/${rkey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5">
                <div className="flex flex-col gap-2">
                  <h2 className="font-display text-xl text-neutral-950 transition-colors group-hover:text-neutral-600">
                    {value.title ?? 'Untitled'}
                  </h2>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <p className="font-mono text-xs text-neutral-400">
                      {new Date(
                        value.createdAt,
                      ).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>

                    <p className="font-mono text-xs text-neutral-400">
                      {gallery.images.length} foto
                    </p>
                  </div>
                </div>
              </a>
            </div>
          )
        })}
      </div>

      <div
        ref={loadMoreRef}
        className="flex h-24 items-center justify-center">
        {visibleCount < galleries.length && (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent" />
        )}
      </div>
    </article>
  )
}
