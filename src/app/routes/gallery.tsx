import {useLoaderData} from '@remix-run/react'
import {json} from '@remix-run/node'
import {useState, useEffect, useCallback} from 'react'

const HANDLE = 'mutho.my.id'

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

  const galleries = (galleriesData.records ?? [])
    .map((gallery: any) => {
      const galleryTime = gallery.value.createdAt
      
      // Pastikan record foto memiliki data gambar referensi ($link) yang valid
      const matchedPhotos = photos.filter(
        (photo: any) => 
          photo.value.createdAt === galleryTime && 
          photo.value.photo?.ref?.$link
      )
      
      const images = matchedPhotos.map((photo: any) => {
        // Menggunakan || untuk mengantisipasi jika nilainya adalah angka 0
        const width = photo.value.aspectRatio?.width || 1
        const height = photo.value.aspectRatio?.height || 1
        
        return {
          url: `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${photo.value.photo.ref.$link}`,
          width: width,
          height: height,
        }
      })
      
      return {...gallery, images}
    })
    // Filter super ketat: HANYA meloloskan galeri yang memiliki susunan gambar valid
    .filter((gallery: any) => gallery.images && gallery.images.length > 0)

  return json({galleries, did})
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

  // Prevent scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}>
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

      <img
        src={images[index].url}
        alt={`Photo ${index + 1}`}
        className="max-h-screen max-w-full object-contain"
        onClick={e => e.stopPropagation()}
        style={{maxHeight: '90vh', maxWidth: '90vw'}}
      />

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
}: {
  images: {url: string; width: number; height: number}[]
  title: string
  onPhotoClick: (index: number) => void
}) {
  if (!images || images.length === 0) {
    return null; // Langsung hilangkan elemen jika kosong tanpa menyisakan container box
  }

  if (images.length === 1) {
    const {url, width, height} = images[0]
    // Mengamankan kalkulasi rasio agar tidak menghasilkan NaN / Infinity
    const ratio = width > 0 ? (height / width) * 100 : 100
    const paddingTop = `${ratio}%`
    
    return (
      <div
        className="w-full relative overflow-hidden cursor-zoom-in bg-black"
        style={{paddingTop}}
        onClick={e => { e.preventDefault(); onPhotoClick(0) }}>
        <img
          src={url}
          alt={title}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-px bg-200 overflow-hidden">
        {images.map((img, i) => {
          const ratio = img.width > 0 ? (img.height / img.width) * 100 : 100
          const paddingTop = `${ratio}%`
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-zoom-in bg-black"
              style={{paddingTop}}
              onClick={e => { e.preventDefault(); onPhotoClick(i) }}>
              <img
                src={img.url}
                alt={`${title} ${i + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          )
        })}
      </div>
    )
  }

  const col1: typeof images = []
  const col2: typeof images = []
  images.forEach((img, i) => {
    if (i % 2 === 0) col1.push({...img, origIndex: i} as any)
    else col2.push({...img, origIndex: i} as any)
  })

  return (
    <div className="grid grid-cols-2 gap-px bg-200 overflow-hidden">
      <div className="flex flex-col gap-px">
        {col1.map((img: any, i) => {
          const ratio = img.width > 0 ? (img.height / img.width) * 100 : 100
          const paddingTop = `${ratio}%`
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-zoom-in bg-black"
              style={{paddingTop}}
              onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
              <img
                src={img.url}
                alt={`${title} ${img.origIndex + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          )
        })}
      </div>
      <div className="flex flex-col gap-px">
        {col2.map((img: any, i) => {
          const ratio = img.width > 0 ? (img.height / img.width) * 100 : 100
          const paddingTop = `${ratio}%`
          return (
            <div
              key={i}
              className="relative overflow-hidden cursor-zoom-in bg-black"
              style={{paddingTop}}
              onClick={e => { e.preventDefault(); onPhotoClick(img.origIndex) }}>
              <img
                src={img.url}
                alt={`${title} ${img.origIndex + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()
  const [lightbox, setLightbox] = useState<{images: {url: string}[]; index: number} | null>(null)

  // Double check penyaringan di sisi klien
  const validGalleries = (galleries ?? []).filter((g: any) => g.images && g.images.length > 0)

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

      {validGalleries.length === 0 ? (
        <div className="max-w-prose">
          <p className="font-sans text-500 text-lg">Belum ada gallery.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {validGalleries.map((gallery: any) => {
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
                    <p className="font-mono text-xs text-300">
                      {gallery.images.length} foto
                    </p>
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
