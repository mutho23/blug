import {useLoaderData} from '@remix-run/react'
import {json} from '@remix-run/node'

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
    return {...gallery, images}
  })

  return json({galleries, did})
}

function MasonryGrid({images, title}: {images: {url: string; width: number; height: number}[]; title: string}) {
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
      <div className="w-full relative overflow-hidden rounded-t-md" style={{paddingTop}}>
        <img
          src={url}
          alt={title}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      </div>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-px bg-200 rounded-t-md overflow-hidden">
        {images.map((img, i) => {
          const paddingTop = `${(img.height / img.width) * 100}%`
          return (
            <div key={i} className="relative overflow-hidden" style={{paddingTop}}>
              <img
                src={img.url}
                alt={`${title} ${i + 1}`}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
          )
        })}
      </div>
    )
  }

  // 3+ photos: masonry 2 columns
  const col1: typeof images = []
  const col2: typeof images = []
  images.forEach((img, i) => {
    if (i % 2 === 0) col1.push(img)
    else col2.push(img)
  })

  return (
    <div className="grid grid-cols-2 gap-px bg-200 rounded-t-md overflow-hidden">
      <div className="flex flex-col gap-px">
        {col1.map((img, i) => {
          const paddingTop = `${(img.height / img.width) * 100}%`
          return (
            <div key={i} className="relative overflow-hidden" style={{paddingTop}}>
              <img
                src={img.url}
                alt={`${title} ${i * 2 + 1}`}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
          )
        })}
      </div>
      <div className="flex flex-col gap-px">
        {col2.map((img, i) => {
          const paddingTop = `${(img.height / img.width) * 100}%`
          return (
            <div key={i} className="relative overflow-hidden" style={{paddingTop}}>
              <img
                src={img.url}
                alt={`${title} ${i * 2 + 2}`}
                className="absolute inset-0 w-full h-full object-contain bg-black"
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

  return (
    <article className="container mx-auto pt-12 md:pt-20 pb-24 px-6">
      <header className="flex flex-col gap-5 mb-12 md:mb-16 max-w-prose">
     
        <h1 className="font-display text-950 text-4xl md:text-6xl leading-[1.02]">
          Gallery
        </h1>
        <p className="font-sans text-500 text-lg">
          Sometimes you see me. Mostly, you just see what i see.
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
              <a
                key={gallery.uri}
                href={`https://grain.social/profile/${did}/gallery/${rkey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group break-inside-avoid block border border-100 rounded-md overflow-hidden bg-50 hover:border-300 transition-colors">
                <MasonryGrid
                  images={gallery.images}
                  title={value.title ?? 'Gallery'}
                />
                <div className="flex flex-col gap-2 p-5">
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
                </div>
              </a>
            )
          })}
        </div>
      )}
    </article>
  )
}
