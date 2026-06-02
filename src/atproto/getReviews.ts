import {ATP_AGENT} from './agent.js'

export type PopfeedReview = {
  rkey: string
  uri: string
  title: string
  text: string
  rating?: number
  posterUrl?: string
  backdropUrl?: string
  creativeWorkType: string
  mainCredit?: string
  mainCreditRole?: string
  genres: string[]
  tags: string[]
  addedAt: string
  releaseDate?: string
  isRevisit: boolean
  containsSpoilers: boolean
  identifiers?: {
    imdbId?: string
    tmdbId?: string | number
    isbn10?: string
    isbn13?: string
  }
}

export const getReviews = async (): Promise<PopfeedReview[]> => {
  const repo = process.env.ATP_IDENTIFIER!

  try {
    const res = await ATP_AGENT.com.atproto.repo.listRecords({
      collection: 'social.popfeed.feed.review',
      repo,
      limit: 50,
    })

    if (!res.success) return []

    return res.data.records.map(data => {
      const val = data.value as any
      const uriPts = data.uri.split('/')
      return {
        rkey: uriPts[uriPts.length - 1],
        uri: data.uri,
        title: val.title ?? 'Untitled',
        text: val.text ?? '',
        rating: val.rating,
        posterUrl: val.posterUrl,
        backdropUrl: val.backdropUrl,
        creativeWorkType: val.creativeWorkType ?? 'movie',
        mainCredit: val.mainCredit,
        mainCreditRole: val.mainCreditRole,
        genres: val.genres ?? [],
        tags: val.tags ?? [],
        addedAt: val.createdAt,
        releaseDate: val.releaseDate,
        isRevisit: val.isRevisit ?? false,
        containsSpoilers: val.containsSpoilers ?? false,
        identifiers: val.identifiers,
      }
    })
  } catch (err) {
    console.error('[getReviews] error:', err)
    return []
  }
}

export const getReview = async (rkey: string): Promise<PopfeedReview | null> => {
  const repo = process.env.ATP_IDENTIFIER!

  try {
    const res = await ATP_AGENT.com.atproto.repo.getRecord({
      collection: 'social.popfeed.feed.review',
      repo,
      rkey,
    })

    if (!res.success) return null

    const val = res.data.value as any
    const uriPts = res.data.uri.split('/')
    return {
      rkey: uriPts[uriPts.length - 1],
      uri: res.data.uri,
      title: val.title ?? 'Untitled',
      text: val.text ?? '',
      rating: val.rating,
      posterUrl: val.posterUrl,
      backdropUrl: val.backdropUrl,
      creativeWorkType: val.creativeWorkType ?? 'movie',
      mainCredit: val.mainCredit,
      mainCreditRole: val.mainCreditRole,
      genres: val.genres ?? [],
      tags: val.tags ?? [],
      addedAt: val.createdAt,
      releaseDate: val.releaseDate,
      isRevisit: val.isRevisit ?? false,
      containsSpoilers: val.containsSpoilers ?? false,
      identifiers: val.identifiers,
    }
  } catch (err) {
    console.error('[getReview] error:', err)
    return null
  }
}
