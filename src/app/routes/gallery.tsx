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
const INITIAL_GALLERY_LIMIT = 6

type ImageItem = {
  url: string
  width: number
  height: number
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

    const images = matchedPhotos.map((photo: any) => {
      const cid = photo.value.photo.ref.$link
      const encodedDid = encodeURIComponent(did)

      return {
        // thumbnail ringan untuk grid gallery
        url: `https://cdn.bsky.app/img/feed_thumbnail/plain/${encodedDid}/${cid}@jpeg`,

        width: photo.value.aspectRatio?.width ?? 1,
        height: photo.value.aspectRatio?.height ?? 1,
      }
    })

    return {
      ...gallery,
      images,
    }
  })

  return json({galleries, did})
}

function ProgressiveImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string
  alt: string
  className?: string
  eager?: boolean
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-200">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`
          ${className}
          transition-all duration-500
          ${loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'}
        `}
      />
    </div>
  )
}

function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: {url: string}[]
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

    return () => window.removeEventListener('keydown', onKey)
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
        className="absolute top-4 right-4 z-20 text-3xl text-white/70 hover:text-white"
        onClick={onClose}>
        ✕
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-[2px] md:left-[calc(50%-430px)] top-1/2 z-30 -translate-y-1/2 rounded-full bg-blue-500/90 px-4 py-2 text-4xl font-bold text-white shadow-2xl hover:scale-110 hover:bg-blue-400 transition-all duration-200 hidden md:block"
            onClick={e => {
              e.stopPropagation()
              prev()
            }}>
            ‹
          </button>

          <button
            className="absolute right-[2px] md:right-[calc(50%-430px)] top-1/2 z-30 -translate-y-1/2 rounded-full bg-blue-500/90 px-4 py-2 text-4xl font-bold text-white shadow-2xl hover:scale-110 hover:bg-blue-400 transition-all duration-200 hidden md:block"
            onClick={e => {
              e.stopPropagation()
              next()
            }}>
            ›
          </button>
        </>
      )}

      <img
        src={images[index].url}
        alt={`Photo ${index + 1}`}
        loading="eager"
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
  if (images.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center bg-gray-100">
        <span className="font-mono text-xs text-gray-400">
          no photo
        </span>
      </div>
    )
  }

  if (images.length === 1) {
    const {url, width, height} = images[0]

    const paddingTop = `${(height / width) * 100}%`

    return (
      <div
        className="relative w-full overflow-hidden bg-black"
        style={{paddingTop}}
        onClick={() => onPhotoClick(0)}>
        <ProgressiveImage
          src={url}
          alt={title}
          eager={eager}
          className="absolute inset-0 h-full w-full object-contain bg-black"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden bg-gray-200">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative h-48 overflow-hidden"
            onClick={() => onPhotoClick(i)}>
            <ProgressiveImage
              src={img.url}
              alt={`${title} ${i + 1}`}
              eager={eager}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    )
  }

  // 3+ images layout without empty spaces
  const isOdd = images.length % 2 !== 0
  const gridImages = isOdd ? images.slice(0, -1) : images
  const lastImage = isOdd ? images[images.length - 1] : null

  const col1: any[] = []
  const col2: any[] = []

  gridImages.forEach((img, i) => {
    if (i % 2 === 0) {
      col1.push({...img, origIndex: i})
    } else {
      col2.push({...img, origIndex: i})
    }
  })

  return (
    <div className="flex flex-col gap-px overflow-hidden bg-gray-200">
      <div className="grid grid-cols-2 gap-px">
        <div className="flex flex-col gap-px">
          {col1.map((img, i) => (
            <div
              key={i}
              className="relative h-48 overflow-hidden"
              onClick={() => onPhotoClick(img.origIndex)}>
              <ProgressiveImage
                src={img.url}
                alt={`${title} ${img.origIndex + 1}`}
                eager={eager}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-px">
          {col2.map((img, i) => (
            <div
              key={i}
              className="relative h-48 overflow-hidden"
              onClick={() => onPhotoClick(img.origIndex)}>
              <ProgressiveImage
                src={img.url}
                alt={`${title} ${img.origIndex + 1}`}
                eager={eager}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {lastImage && (
        <div
          className="relative h-48 overflow-hidden"
          onClick={() => onPhotoClick(images.length - 1)}>
          <ProgressiveImage
            src={lastImage.url}
            alt={`${title} ${images.length}`}
            eager={eager}
            className="absolute inset-0 h-full w-full object-cover"
          />
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
          setVisibleCount(prev =>
            Math.min(prev + 6, galleries.length),
          )
        }
      },
      {
        rootMargin: '400px',
      },
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [galleries.length])

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
        <h1 className="font-display text-4xl leading-[1.02] text-950 md:text-6xl">
          Gallery
        </h1>

        <p className="font-sans text-lg text-500">
          Sometimes you see me. Mostly, you see what I see
        </p>
      </header>

      {visibleGalleries.length === 0 ? (
        <div className="max-w-prose">
          <p className="font-sans text-lg text-500">
            Belum ada gallery.
          </p>
        </div>
      ) : (
        <>
          <div className="columns-1 gap-4 space-y-4 md:columns-2 lg:columns-3">
            {visibleGalleries.map((gallery: any, index: number) => {
              const value = gallery.value

              const uriParts = gallery.uri.split('/')

              const rkey = uriParts[uriParts.length - 1]

              return (
                <div
                  key={gallery.uri}
                  className="group block break-inside-avoid overflow-hidden rounded-md border border-100 bg-50 transition-colors hover:border-300">
                  <MasonryGrid
                    images={gallery.images}
                    title={value.title ?? 'Gallery'}
                    eager={index < 3}
                    onPhotoClick={photoIndex =>
                      setLightbox({
                        images: gallery.images,
                        index: photoIndex,
                      })
                    }
                  />

                  <a
                    href={`https://grain.social/profile/${did}/gallery/${rkey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5">
                    <div className="flex flex-col gap-2">
                      <h2 className="font-display text-xl text-950 transition-colors group-hover:text-600">
                        {value.title ?? 'Untitled'}
                      </h2>

                      {value.address ? (
                        <p className="font-sans text-sm text-500">
                          {value.address.locality}
                          {value.address.region
                            ? ', ' + value.address.region
                            : ''}
                        </p>
                      ) : null}

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <p className="font-mono text-xs text-300">
                          {new Date(
                            value.createdAt,
                          ).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>

                        <p className="font-mono text-xs text-300">
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
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
            )}
          </div>
        </>
      )}
    </article>
  )
}
