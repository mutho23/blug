import {ATP_AGENT} from './agent.js'

export type PopfeedReview = {
  rkey: string
  uri: string
  title: string
  posterUrl?: string
  creativeWorkType?: string
  mainCredit?: string
  mainCreditRole?: string
  genres?: string[]
  addedAt: string
  releaseDate?: string
  listType?: string
}

export const getReviews = async (): Promise<PopfeedReview[]> => {
  const repo = process.env.ATP_IDENTIFIER!

  try {
    const res = await ATP_AGENT.com.atproto.repo.listRecords({
      collection: 'social.popfeed.feed.listItem',
      repo,
      limit: 20,
    })

    if (!res.success) return []

    return res.data.records.map(data => {
      const val = data.value as any
      const uriPts = data.uri.split('/')
      return {
        rkey: uriPts[uriPts.length - 1],
        uri: data.uri,
        title: val.title ?? 'Untitled',
        posterUrl: val.posterUrl,
        creativeWorkType: val.creativeWorkType,
        mainCredit: val.mainCredit,
        mainCreditRole: val.mainCreditRole,
        genres: val.genres ?? [],
        addedAt: val.addedAt,
        releaseDate: val.releaseDate,
        listType: val.listType,
      }
    })
  } catch (err) {
    console.error('[getReviews] error:', err)
    return []
  }
}
