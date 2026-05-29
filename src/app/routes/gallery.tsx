import {useLoaderData} from '@remix-run/react'
import {json} from '@remix-run/node'

const HANDLE = 'mutho.my.id'

export const loader = async () => {
  const didRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}`,
  )
  const {did} = await didRes.json()

  const recordsRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=social.grain.gallery&limit=30`,
  )
  const data = await recordsRes.json()

  return json({galleries: data.records ?? [], did})
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
              
                key={gallery.uri}
                href={'https://grain.social/gallery/' + rkey}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-100 rounded-md p-5 bg-50 hover:bg-100 hover:border-300 transition-colors flex flex-col gap-2">
                <h2 className="font-display text-xl text-950 group-hover:text-600 transition-colors">
                  {value.title ?? 'Untitled'}
                </h2>
                {value.address ? (
                  <p className="font-sans text-sm text-500">
                    {value.address.locality}
                    {value.address.region ? ', ' + value.address.region : ''}
                  </p>
                ) : null}
                <p className="font-mono text-xs text-300 mt-auto pt-2">
                  {new Date(value.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </a>
            )
          })}
        </div>
      )}
    </article>
  )
}
