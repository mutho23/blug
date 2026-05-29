import {useLoaderData} from '@remix-run/react'
import {json, LoaderFunctionArgs} from '@remix-run/node'
import {getDid} from 'src/atproto/getDid'

// Ganti dengan handle atproto kamu
const HANDLE = 'mutho.my.id'

export const loader = async () => {
  // 1. Resolve handle → DID
  const didRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}`
  )
  const {did} = await didRes.json()

  // 2. Ambil semua gallery dari grain.social
  const recordsRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=social.grain.gallery&limit=30`
  )
  const data = await recordsRes.json()

  return json({galleries: data.records ?? [], did})
}

export default function Gallery() {
  const {galleries, did} = useLoaderData<typeof loader>()

  return (
    <main className="container mx-auto pt-12 md:pt-20 pb-24">
      <header className="flex flex-col gap-5 mb-12 max-w-prose">
        <a href="/" className="label hover:text-600 transition-colors w-fit">
          ← Writing
        </a>
        <h1 className="font-display text-950 text-4xl md:text-6xl leading-[1.02]">
          Gallery
        </h1>
        <p className="font-sans text-500 text-lg">
          Foto-foto dari grain.social saya
        </p>
      </header>

      {galleries.length === 0 ? (
        <p className="font-sans text-500">Belum ada gallery.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleries.map((gallery: any) => {
            const value = gallery.value
            const rkey = gallery.uri.split('/').pop()
            const firstImage = value.images?.[0]?.image

            return (
              
                key={gallery.uri}
                href={`https://grain.social/gallery/${rkey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2">
                {firstImage ? (
                  <img
                    src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${firstImage.ref.$link}@jpeg`}
                    alt={value.title ?? 'Gallery'}
                    className="w-full aspect-square object-cover rounded-md shadow-md group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="w-full aspect-square bg-100 rounded-md flex items-center justify-center">
                    <span className="text-400 text-xs font-mono">No image</span>
                  </div>
                )}
                {value.title ? (
                  <p className="font-mono text-xs uppercase tracking-wider text-500 truncate">
                    {value.title}
                  </p>
                ) : null}
              </a>
            )
          })}
        </div>
      )}
    </main>
  )
}
