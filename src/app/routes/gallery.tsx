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
    const imageUrls = matchedPhotos.map(
      (photo: any) =>
        `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${photo.value.photo.ref.$link}`,
    )
    return {...gallery, imageUrls}
  })

  return json({galleries, did})
}

function PhotoGrid({
  urls,
  title,
}: {
  urls: string[]
  title: string
}) {
  if (urls.length === 0) {
    return (
      <div className="w-full h-48 bg-100 flex items-center justify-center">
        <span className="font-mono text-xs text-300">no photo</span>
      </div>
    )
  }

  if (urls.length === 1) {
    return (
      <div className="w-full h-48 overflow-hidden">
        <img
          src={urls[0]}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    )
  }

  if (urls.length === 2) {
    return (
      <div className="w-full h-48 grid grid-cols-2 gap-px bg-100">
        {urls.map((url, i) => (
          <div key={i} className="overflow-hidden">
            <img
              src={url}
              alt={`${title} ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    )
  }

  if (urls.length === 3) {
    return (
      <div className="w-full h-48 grid gap-px bg-100" style={{gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr'}}>
        <div className="overflow-hidden" style={{gridRow: '1 / 3'}}>
          <img
            src={urls[0]}
            alt={`${title} 1`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        {urls.slice(1, 3).map((url, i) => (
          <div key={i} className="overflow-hidden">
            <img
              src={url}
              alt={`${title} ${i + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full h-48 grid grid-cols-2 grid-rows-2 gap-px bg-100">
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className="overflow-hidden relative">
          <img
            src={url}
            alt={`${title} ${i + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {i === 3 && urls.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="font-mono text-white text-sm">+{urls.length - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()

  return (
    <article className="container mx-auto pt-12 md:pt-20 pb-24 px-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="group border border-100 rounded-md overflow-hidden bg-50 hover:bg-100 hover:border-300 transition-colors flex flex-col">
                <PhotoGrid
                  urls={gallery.imageUrls}
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
                    {gallery.imageUrls.length > 0 ? (
                      <p className="font-mono text-xs text-300">
                        {gallery.imageUrls.length} foto
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
