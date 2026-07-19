import {ATP_AGENT} from './agent.js'
import {getCachedPost, setCachedPost} from '../redis/redis'
import {LeafletDocument} from 'src/types.js'

export const getPost = async (rkey: string, skipCache?: boolean) => {
  const cachedRes = await getCachedPost(rkey)
  if (!skipCache && cachedRes) {
    return cachedRes
  }

  const repo = process.env.ATP_DID!

  const res = await ATP_AGENT.com.atproto.repo.getRecord({
    collection: 'site.standard.document',
    repo,
    rkey,
  })

  if (!res.success) {
    throw new Error('Failed to get post.')
  }

  const val = res.data.value as any
  // Juttu bisa nulis record ke collection yang sama (lihat catatan di getPosts.ts) — kalau
  // rkey yang diminta ternyata bukan post blog asli (nggak punya content.pages), 404 rapi
  // daripada nge-crash ke halaman "Something broke".
  if (!val?.content || !Array.isArray(val.content.pages) || val.content.pages.length === 0) {
    throw new Response('Not Found', {status: 404})
  }

  const post = res.data.value as LeafletDocument

  await setCachedPost(rkey, post)

  // set the rkey in the post
  post.rkey = rkey

  return post
}
