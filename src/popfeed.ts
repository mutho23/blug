// popfeed.ts
// Fetch reviews dari Popfeed via ATProto
// Letakkan file ini di folder yang sama dengan atproto.ts kamu

// PDS endpoint untuk akun mutho.my.id
const ATPROTO_PDS = 'https://morel.us-east.host.bsky.network'
const DID = 'did:plc:kxb2w63yrod2t65mlnecgrlu'
const COLLECTION = 'social.popfeed.feed.review'

export interface PopfeedReview {
  rkey: string
  title: string
  description?: string       // teks review
  rating?: number            // 0–10
  publishedAt: string        // ISO date string (createdAt)
  releaseDate?: string       // tanggal rilis karya
  mediaType?: string         // 'movie' | 'book' | 'game' | 'music' | 'tv' | dll
  genres?: string[]          // ['Action', 'Comedy', ...]
  posterUrl?: string         // URL langsung ke gambar poster
  backdropUrl?: string       // URL backdrop dari TMDB
  mainCredit?: string        // sutradara / pengarang / dll
  isRevisit?: boolean        // apakah ini rewatch/reread
  containsSpoilers?: boolean
  tags: string[]             // selalu ['review'] + mediaType
  sourceUrl: string          // link ke review di film.popfeed.social
  type: 'review'
}

export async function getPopfeedReviews(limit = 50): Promise<PopfeedReview[]> {
  try {
    const url = `${ATPROTO_PDS}/xrpc/com.atproto.repo.listRecords?repo=${encodeURIComponent(DID)}&collection=${COLLECTION}&limit=${limit}`
    const res = await fetch(url)

    if (!res.ok) {
      console.error('[popfeed] listRecords failed:', res.status)
      return []
    }

    const data = await res.json()
    if (!data.records || data.records.length === 0) return []

    return data.records.map((record: any) => {
      const val = record.value
      const rkey = record.uri.split('/').pop() ?? record.uri
      const mediaType = val.creativeWorkType ?? undefined

      const tags = ['review']
      if (mediaType) tags.push(mediaType)

      // Subdomain berbeda per media type
      const subdomain = mediaTypeToSubdomain(mediaType)
      const sourceUrl = `https://${subdomain}.popfeed.social/review/at:/${DID}/${COLLECTION}/${rkey}`

      return {
        rkey,
        title: val.title ?? 'Untitled',
        description: val.text ?? undefined,
        rating: val.rating ?? undefined,
        publishedAt: val.createdAt ?? new Date().toISOString(),
        releaseDate: val.releaseDate ?? undefined,
        mediaType,
        genres: val.genres ?? undefined,
        posterUrl: val.posterUrl ?? undefined,
        backdropUrl: val.backdropUrl ?? undefined,
        mainCredit: val.mainCredit ?? undefined,
        isRevisit: val.isRevisit ?? false,
        containsSpoilers: val.containsSpoilers ?? false,
        tags,
        sourceUrl,
        type: 'review' as const,
      }
    })
  } catch (err) {
    console.error('[popfeed] Failed to fetch reviews:', err)
    return []
  }
}

function mediaTypeToSubdomain(mediaType?: string): string {
  switch (mediaType) {
    case 'movie':
    case 'tv':
      return 'film'
    case 'book':
      return 'book'
    case 'game':
      return 'game'
    case 'music':
      return 'music'
    default:
      return 'film'
  }
}
