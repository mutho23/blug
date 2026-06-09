const ANILIST_API = 'https://graphql.anilist.co'
const ANILIST_USERNAME = 'moebatsu'

export type AnilistManga = {
  id: number
  title: string
  coverImage: string
  siteUrl: string
  progress: number
  totalChapters: number | null
  genres: string[]
}

const QUERY = `
query ($username: String) {
  MediaListCollection(userName: $username, type: MANGA, status: CURRENT) {
    lists {
      entries {
        progress
        media {
          id
          title {
            userPreferred
          }
          coverImage {
            medium
          }
          siteUrl
          chapters
          genres
        }
      }
    }
  }
}
`

export const getAnilistCurrentManga = async (): Promise<AnilistManga[]> => {
  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify({query: QUERY, variables: {username: ANILIST_USERNAME}}),
    })

    if (!res.ok) return []

    const json = await res.json()
    const lists = json?.data?.MediaListCollection?.lists ?? []

    const entries: AnilistManga[] = []
    for (const list of lists) {
      for (const entry of list.entries ?? []) {
        entries.push({
          id: entry.media.id,
          title: entry.media.title.userPreferred,
          coverImage: entry.media.coverImage.medium,
          siteUrl: entry.media.siteUrl,
          progress: entry.progress ?? 0,
          totalChapters: entry.media.chapters ?? null,
          genres: entry.media.genres ?? [],
        })
      }
    }

    return entries
  } catch (err) {
    console.error('[getAnilistCurrentManga] error:', err)
    return []
  }
}
