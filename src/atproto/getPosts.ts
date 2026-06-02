import {ATP_AGENT} from './agent.js'
import {getCachedPosts, setCachedPosts} from '../redis/redis.js'
import {LeafletDocument} from 'src/types.js'

export const getPosts = async (
  cursor: string | undefined,
  skipCache?: boolean,
) => {
  const cachedRes = await getCachedPosts()
  if (!skipCache && cachedRes) {
    console.log('[getPosts] returning cached posts:', cachedRes.length)
    return cachedRes
  }

  const repo = process.env.ATP_IDENTIFIER!
  const service = process.env.ATP_SERVICE!
  console.log('[getPosts] fetching from ATP_SERVICE:', service)
  console.log('[getPosts] repo (ATP_IDENTIFIER):', repo)

  const res = await ATP_AGENT.com.atproto.repo.listRecords({
    collection: 'site.standard.document',
    repo,
    cursor,
  })

  console.log('[getPosts] res.success:', res.success)
  console.log('[getPosts] records count:', res.data?.records?.length)

  if (!res.success) {
    throw new Error('Failed to get posts.')
  }

  const posts = res.data.records.map(data => {
    const post = data.value as LeafletDocument
    const uriPts = data.uri.split('/')
    post.rkey = uriPts[uriPts.length - 1]
    return post
  })

  await setCachedPosts(posts)

  return posts
}
