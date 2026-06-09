import {ATP_AGENT} from './agent.js'
import {PopfeedReview} from './getReviews.js'

// rkey of your Popfeed lists
export const LIST_RKEYS = {
  currentWatching: '3mntm5c7uc22f',
  currentReading: '3mduaqji7vs24',
}

type ListItem = {
  subject: {uri: string}
}

/**
 * Fetch all review URIs inside a Popfeed list, then resolve each to a full PopfeedReview.
 */
export const getListItems = async (listRkey: string): Promise<PopfeedReview[]> => {
  const repo = process.env.ATP_IDENTIFIER!

  try {
    // 1. Get the list record to find all item refs
    const listRes = await ATP_AGENT.com.atproto.repo.getRecord({
      collection: 'social.popfeed.feed.list',
      repo,
      rkey: listRkey,
    })

    if (!listRes.success) return []

    const val = listRes.data.value as any
    const items: ListItem[] = val.items ?? []

    if (items.length === 0) return []

    // 2. Resolve each referenced review record
    const reviews = await Promise.all(
      items.map(async item => {
        try {
          const uri = item.subject?.uri
          if (!uri) return null

          const parts = uri.split('/')
          const rkey = parts[parts.length - 1]
          const collection = parts[parts.length - 2]

          const res = await ATP_AGENT.com.atproto.repo.getRecord({
            collection,
            repo,
            rkey,
          })

          if (!res.success) return null

          const v = res.data.value as any
          const uriPts = res.data.uri.split('/')
          return {
            rkey: uriPts[uriPts.length - 1],
            uri: res.data.uri,
            title: v.title ?? 'Untitled',
            text: v.text ?? '',
            rating: v.rating,
            posterUrl: v.posterUrl,
            backdropUrl: v.backdropUrl,
            creativeWorkType: v.creativeWorkType ?? 'movie',
            mainCredit: v.mainCredit,
            mainCreditRole: v.mainCreditRole,
            genres: v.genres ?? [],
            tags: v.tags ?? [],
            addedAt: v.createdAt,
            releaseDate: v.releaseDate,
            isRevisit: v.isRevisit ?? false,
            containsSpoilers: v.containsSpoilers ?? false,
            identifiers: v.identifiers,
          } as PopfeedReview
        } catch {
          return null
        }
      }),
    )

    return reviews.filter((r): r is PopfeedReview => r !== null)
  } catch (err) {
    console.error('[getListItems] error:', err)
    return []
  }
}
