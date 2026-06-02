import {ATP_AGENT} from './agent.js'

export type PopfeedReview = {
  rkey: string
  uri: string
  subject: {
    title?: string
    type?: string
    poster?: string
    year?: number
  }
  rating?: number
  body?: string
  createdAt: string
}

export const getReviews = async (): Promise<PopfeedReview[]> => {
  const repo = process.env.ATP_IDENTIFIER!

  try {
    const res = await ATP_AGENT.com.atproto.repo.listRecords({
      collection: 'app.popsky.review',
      repo,
    })

    if (!res.success) return []

    return res.data.records.map(data => {
      const val = data.value as any
      const uriPts = data.uri.split('/')
      return {
        rkey: uriPts[uriPts.length - 1],
        uri: data.uri,
        subject: val.subject ?? {},
        rating: val.rating,
        body: val.body?.slice(0, 200),
        createdAt: val.createdAt,
      }
    })
  } catch (err) {
    console.error('[getReviews] error:', err)
    return []
  }
}
