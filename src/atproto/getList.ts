import {ATP_AGENT} from './agent.js'
import {PopfeedReview} from './getReviews.js'

// AT URIs of your Popfeed lists
export const LIST_URIS = {
  currentWatching: `at://${process.env.ATP_IDENTIFIER}/social.popfeed.feed.list/3mntm5c7uc22f`,
  currentReading: `at://${process.env.ATP_IDENTIFIER}/social.popfeed.feed.list/3mduaqji7vs24`,
}

/**
 * Fetch all listItem records whose listUri matches the given list AT-URI.
 * Popfeed stores list membership as a `listUri` field on each listItem record.
 */
export const getListItems = async (listUri: string): Promise<PopfeedReview[]> => {
  const repo = process.env.ATP_IDENTIFIER!

  try {
    // Fetch all listItem records (Popfeed stores items as social.popfeed.feed.listItem)
    const res = await ATP_AGENT.com.atproto.repo.listRecords({
      collection: 'social.popfeed.feed.listItem',
      repo,
      limit: 100,
    })

    if (!res.success) return []

    // Filter to only items belonging to this list
    const matched = res.data.records.filter((r: any) => {
      const val = r.value as any
      return val.listUri === listUri
    })

    return matched.map((r: any) => {
      const val = r.value as any
      const uriPts = r.uri.split('/')
      return {
        rkey: uriPts[uriPts.length - 1],
        uri: r.uri,
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
      } as PopfeedReview
    })
  } catch (err) {
    console.error('[getListItems] error:', err)
    return []
  }
}
