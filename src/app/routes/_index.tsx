import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto'
import {useLoaderData} from '@remix-run/react'
import {useState, useMemo} from 'react'
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
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )

    if (!activeTag) return sorted

    return sorted.filter(p => p.tags?.includes(activeTag))
  }, [posts, activeTag])

  return (
    <div className="container mx-auto pt-12 md:pt-20 pb-24">
      <section className="mb-16 md:mb-20 flex flex-col gap-5">
        <h1 className="font-display text-4xl md:text-5xl text-950 leading-[1.05]">
          It's Mutho<span className="text-600">.</span>
        </h1>

        <p className="text-lg leading-relaxed text-900 max-w-prose">
          Just writing random stuff here.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-5 border-b border-100 pb-3">
          <h2 className="label">Recent writing</h2>
          <span className="label">{filteredPosts.length} posts</span>
        </div>

        {allTags.length > 0 && (
          <div className="relative inline-block mb-6">
            {/* tombol utama */}
            <button
              onClick={() => setShowTags(!showTags)}
              className="font-mono text-xs px-4 py-2 rounded-full border border-blue-400 text-blue-400 hover:border-blue-300 hover:text-blue-300 transition-colors">
              {activeTag ?? 'All Posts'}
            </button>

            {/* dropdown */}
            {showTags && (
              <div className="absolute left-0 mt-3 w-56 rounded-3xl border border-zinc-700 bg-black p-3 shadow-2xl z-50">
                {/* all posts */}
                <button
                  onClick={() => {
                    setActiveTag(null)
                    setShowTags(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-colors ${
                    activeTag === null
                      ? 'bg-blue-400 text-black'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}>
                  All Posts
                </button>

                {/* tag lainnya */}
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setActiveTag(tag)
                      setShowTags(false)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-colors ${
                      activeTag === tag
                        ? 'bg-blue-400 text-black'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <ul className="divide-y divide-100">
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
        className="group flex flex-col gap-1.5 py-4 -mx-3 px-3 rounded-md transition-colors hover:bg-50">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-display text-xl md:text-2xl text-900 group-hover:text-600 transition-colors leading-tight">
            {post.title}
          </h3>

          <time
            className="font-mono text-xs text-500 uppercase tracking-wider"
            dateTime={date.toISOString()}>
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>

        {post.description ? (
          <p className="text-500 text-base leading-relaxed line-clamp-2">
            {post.description}
          </p>
        ) : null}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="font-mono text-xs text-400 border border-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </a>
    </li>
  )
}
