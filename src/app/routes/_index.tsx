import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto'
import {useLoaderData} from '@remix-run/react'
import {useMemo, useState} from 'react'
import {LeafletDocument} from 'src/types'

export const loader = async () => {
  const posts = await getPosts(undefined)

  const postsShortened = posts.map(p => {
    p.description = p.description?.slice(0, 180)
    return p
  })

  return json({posts: postsShortened})
}

export const meta: MetaFunction = () => {
  return [
    {title: "Mutho's Blog"},
    {
      name: 'description',
      content: 'thoughts and vibes from mutho',
    },
  ]
}

export default function Index() {
  const {posts} = useLoaderData<{
    posts: LeafletDocument[]
  }>()

  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()

    posts.forEach(p => p.tags?.forEach(t => tagSet.add(t)))

    return Array.from(tagSet).sort()
  }, [posts])

  const filteredPosts = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime(),
    )

    if (!activeTag) return sorted

    return sorted.filter(p => p.tags?.includes(activeTag))
  }, [posts, activeTag])

  return (
    <div className="container mx-auto pt-12 md:pt-20 pb-24">
      <section className="mb-16 md:mb-20 flex flex-col gap-5">
        <h1 className="font-display text-4xl md:text-5xl text-950 leading-[1.05]">
          It's Mutho<span className="text-[#5EA2FF]">.</span>
        </h1>

        <p className="text-lg leading-relaxed text-zinc-400 max-w-prose">
          Just writing random stuff here.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-5 border-b border-zinc-800 pb-3">
          <h2 className="label tracking-[0.25em] uppercase text-zinc-500">
            Recent writing
          </h2>

          <span className="label text-zinc-500">
            {filteredPosts.length} posts
          </span>
        </div>

        {allTags.length > 0 && (
          <div className="relative inline-block mb-8">
            {/* BUTTON */}
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center gap-3 font-mono text-[15px] text-[#5EA2FF] border-2 border-[#5EA2FF] rounded-2xl px-6 py-4 bg-black hover:bg-zinc-950 transition-all">
              {activeTag ?? 'All Posts'}

              <span
                className={`transition-transform duration-200 ${
                  showTags ? 'rotate-180' : ''
                }`}>
                ▼
              </span>
            </button>

            {/* DROPDOWN */}
            {showTags && (
              <div className="absolute left-0 top-full mt-3 w-[220px] rounded-[22px] border border-zinc-800 bg-[#0A0A0A] p-3 shadow-2xl z-50">
                {/* ALL POSTS */}
                <button
                  onClick={() => {
                    setActiveTag(null)
                    setShowTags(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-[18px] text-[15px] transition-all ${
                    activeTag === null
                      ? 'bg-[#69A7F5] text-black'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}>
                  All Posts
                </button>

                {/* TAGS */}
                <div className="mt-2 flex flex-col">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveTag(tag)
                        setShowTags(false)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-[18px] text-[15px] transition-all ${
                        activeTag === tag
                          ? 'bg-[#69A7F5] text-black'
                          : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <ul className="divide-y divide-zinc-900">
          {filteredPosts.map(post => (
            // @ts-ignore
            <PostItem post={post} key={post.rkey} />
          ))}
        </ul>
      </section>
    </div>
  )
}

function PostItem({post}: {post: LeafletDocument}) {
  const date = new Date(post.publishedAt)

  return (
    <li>
      <a
        href={`/posts/${post.rkey}`}
        className="group flex flex-col gap-1.5 py-5 -mx-3 px-3 rounded-md transition-colors hover:bg-zinc-950">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-display text-3xl text-zinc-100 group-hover:text-[#5EA2FF] transition-colors leading-tight">
            {post.title}
          </h3>

          <time
            className="font-mono text-sm text-zinc-500 uppercase tracking-wider"
            dateTime={date.toISOString()}>
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>

        {post.description ? (
          <p className="text-zinc-500 text-base leading-relaxed line-clamp-2">
            {post.description}
          </p>
        ) : null}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="font-mono text-xs text-[#5EA2FF] border border-[#5EA2FF] px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </a>
    </li>
  )
}
