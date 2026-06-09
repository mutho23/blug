import {ATP_AGENT} from './agent.js'
import {PopfeedReview} from './getReviews.js'

// rkey of your Popfeed lists
export const LIST_RKEYS = {
  currentWatching: '3mntm5c7uc22f',
  currentReading: '3mduaqji7vs24',
}

const mapToReview = (data: any, uri: string): PopfeedReview => {
  const v = data
  const uriPts = uri.split('/')
  return {
    rkey: uriPts[uriPts.length - 1],
    uri,
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
  }
}

export const getListItems = async (listRkey: string): Promise<PopfeedReview[]> => {
  const repo = process.env.ATP_IDENTIFIER!
  const listUri = `at://${repo}/social.popfeed.feed.list/${listRkey}`

  try {
    // Strategy 1: list items are stored as a separate collection social.popfeed.feed.listitem
    // Each listitem record has a `list` field pointing to the list URI and a `subject` field
    const itemsRes = await ATP_AGENT.com.atproto.repo.listRecords({
      collection: 'social.popfeed.feed.listitem',
      repo,
      limit: 100,
    })

    if (itemsRes.success && itemsRes.data.records.length > 0) {
      // Filter to only items belonging to this list
      const listItems = itemsRes.data.records.filter((r: any) => {
        const val = r.value as any
        return val.list === listUri
      })

      console.log(`[getListItems] listitem strategy: found ${listItems.length} items for list ${listRkey}`)

      if (listItems.length > 0) {
        const reviews = await Promise.all(
          listItems.map(async (item: any) => {
            try {
              const val = item.value as any
              const subjectUri: string = val.subject?.uri ?? val.subject
              if (!subjectUri) return null

              const parts = subjectUri.split('/')
              const rkey = parts[parts.length - 1]
              const collection = parts[parts.length - 2]

              const res = await ATP_AGENT.com.atproto.repo.getRecord({collection, repo, rkey})
              if (!res.success) return null

              return mapToReview(res.data.value, res.data.uri)
            } catch {
              return null
            }
          }),
        )
        const result = reviews.filter((r): r is PopfeedReview => r !== null)
        if (result.length > 0) return result
      }
    }

    // Strategy 2: items are embedded inside the list record itself
    const listRes = await ATP_AGENT.com.atproto.repo.getRecord({
      collection: 'social.popfeed.feed.list',
      repo,
      rkey: listRkey,
    })

    if (!listRes.success) return []

    const val = listRes.data.value as any
    console.log('[getListItems] list record keys:', Object.keys(val))
    console.log('[getListItems] list record value:', JSON.stringify(val).slice(0, 500))

    // Try various possible field names
    const rawItems: any[] =
      val.items ??
      val.entries ??
      val.subjects ??
      val.listItems ??
      []

    if (rawItems.length === 0) {
      console.log('[getListItems] no items found in list record')
      return []
    }

    console.log(`[getListItems] embedded strategy: found ${rawItems.length} items`)

    const reviews = await Promise.all(
      rawItems.map(async (item: any) => {
        try {
          // item might be {uri}, {subject: {uri}}, or just a string uri
          const subjectUri: string =
            typeof item === 'string'
              ? item
              : item.uri ?? item.subject?.uri ?? item.subject

          if (!subjectUri) return null

          const parts = subjectUri.split('/')
          const rkey = parts[parts.length - 1]
          const collection = parts[parts.length - 2]

          const res = await ATP_AGENT.com.atproto.repo.getRecord({collection, repo, rkey})
          if (!res.success) return null

          return mapToReview(res.data.value, res.data.uri)
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
