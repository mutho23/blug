import {json, MetaFunction} from '@remix-run/node'
import {getPosts} from '../../atproto/index.js'
import {getReviews, PopfeedReview} from '../../atproto/getReviews.js'
import {getDid} from '../../atproto/getDid.js'
import {useLoaderData, NavLink} from '@remix-run/react'
import {useMemo, useState} from 'react'
import {LeafletDocument} from 'src/types'

type FeedItem = LeafletDocument & {type: 'post'}

export const loader = async () => {
  try {
    const [rawPosts, reviews] = await Promise.all([
      getPosts(undefined),
      getReviews(),
    ])

    const posts: FeedItem[] = rawPosts.map(p => ({
      ...p,
      type: 'post' as const,
      description: p.description?.slice(0, 180),
    }))

    posts.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime(),
    )

    reviews.sort(
      (a, b) =>
        new Date(b.addedAt).getTime() -
        new Date(a.addedAt).getTime(),
    )

    return json({items: posts, did: getDid(), reviews})
  } catch (err) {
    console.error('Index loader error:', err)
    return json({items: [], did: getDid(), reviews: []})
  }
}

export const meta: MetaFunction = () => {
  return [
    {title: "Mutho's Blog"},
    {name: 'description', content: 'thoughts and vibes from mutho'},
  ]
}

export default function Index() {
  const {items, did, reviews} = useLoaderData<{
    items: FeedItem[]
    did: string
    reviews: PopfeedReview[]
  }>()

  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    items.forEach(item => item.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (!activeTag) return items
    return items.filter(item => item.tags?.includes(activeTag))
  }, [items, activeTag])

  return (
    <div className="bl-page">

      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="bl-sidebar bl-sidebar-l">
        <div>
          <p className="bl-widget-label">Navigate</p>
          <ul className="bl-nav">
            <li><NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}><span className="ico">◈</span>Posts</NavLink></li>
            <li><NavLink to="/gallery" className={({isActive}) => isActive ? 'active' : ''}><span className="ico">◻</span>Gallery</NavLink></li>
            <li><NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}><span className="ico">◯</span>About</NavLink></li>
          </ul>
        </div>

        {allTags.length > 0 && (
          <div>
            <p className="bl-widget-label">Tags</p>
            <ul className="bl-nav">
              <li>
                <button
                  onClick={() => setActiveTag(null)}
                  style={{
                    all: 'unset', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    width: '100%', fontFamily: 'var(--mono)', fontSize: '0.75rem',
                    color: activeTag === null ? 'var(--text)' : 'var(--text-2)',
                    padding: '0.35rem 0.5rem', borderRadius: '3px', cursor: 'pointer',
                    background: activeTag === null ? 'var(--bg-2)' : 'transparent',
                  }}>
                  <span className="ico">·</span>All
                </button>
              </li>
              {allTags.map(tag => (
                <li key={tag}>
                  <button
                    onClick={() => setActiveTag(tag)}
                    style={{
                      all: 'unset', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      width: '100%', fontFamily: 'var(--mono)', fontSize: '0.75rem',
                      color: activeTag === tag ? 'var(--accent)' : 'var(--text-2)',
                      padding: '0.35rem 0.5rem', borderRadius: '3px', cursor: 'pointer',
                      background: activeTag === tag ? 'var(--accent-dim)' : 'transparent',
                    }}>
                    <span className="ico" style={{color: 'var(--text-4)'}}>·</span>{tag}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{marginTop: 'auto'}}>
          <p className="bl-widget-label">Links</p>
          <ul className="bl-nav">
            <li><a href="https://bsky.app" target="_blank" rel="noreferrer"><span className="ico">↗</span>Bluesky</a></li>
            <li><a href="https://popfeed.social" target="_blank" rel="noreferrer"><span className="ico">↗</span>Popfeed</a></li>
          </ul>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="bl-main">

        {/* Hero */}
        <section className="bl-hero">
          <p className="bl-hero-eyebrow">Personal writing</p>
          <h1 className="bl-hero-title">
            It's Mutho<span className="accent">.</span>
          </h1>
          <p className="bl-hero-sub">Just writing random stuff here.</p>
        </section>

        {/* Posts section */}
        <section>
          <div className="bl-sec-header" style={{marginBottom: '0'}}>
            <span className="bl-sec-label">Recent writing</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              {/* Mobile tag filter — also shown on desktop as inline */}
              {allTags.length > 0 && (
                <div style={{position: 'relative'}}>
                  <button
                    onClick={() => setShowTags(!showTags)}
                    className={`bl-filter-btn${showTags ? ' open' : ''}`}>
                    {activeTag ?? 'All'}
                    <span className="arrow">▼</span>
                  </button>
                  {showTags && (
                    <div className="bl-dropdown">
                      <button
                        className={activeTag === null ? 'active-opt' : ''}
                        onClick={() => {setActiveTag(null); setShowTags(false)}}>
                        All Posts
                      </button>
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          className={activeTag === tag ? 'active-opt' : ''}
                          onClick={() => {setActiveTag(tag); setShowTags(false)}}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <span className="bl-sec-count">{filteredItems.length} posts</span>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <p style={{fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-3)', padding: '2rem 0'}}>
              No posts yet.
            </p>
          ) : (
            <ul className="bl-post-list">
              {filteredItems.map(item => (
                <PostItem post={item} did={did} key={`post-${item.rkey}`} />
              ))}
            </ul>
          )}
        </section>

        {/* Reviews section */}
        {reviews.length > 0 && (
          <ReviewsSection reviews={reviews} />
        )}
      </main>

      {/* ─── RIGHT SIDEBAR ─── */}
      <aside className="bl-sidebar bl-sidebar-r">
        <div>
          <p className="bl-widget-label">Stats</p>
          <div>
            <div className="bl-stat">
              <span className="bl-stat-lbl">Posts</span>
              <span className="bl-stat-val">{items.length}</span>
            </div>
            <div className="bl-stat">
              <span className="bl-stat-lbl">Reviews</span>
              <span className="bl-stat-val">{reviews.length}</span>
            </div>
            {allTags.length > 0 && (
              <div className="bl-stat">
                <span className="bl-stat-lbl">Tags</span>
                <span className="bl-stat-val">{allTags.length}</span>
              </div>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div>
            <p className="bl-widget-label">Recent</p>
            {items.slice(0, 5).map(item => (
              <a key={item.rkey} href={`/posts/${item.rkey}`} className="bl-mini-item">
                <p className="bl-mini-title">{item.title}</p>
                <p className="bl-mini-meta">
                  {new Date(item.publishedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                </p>
              </a>
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <div>
            <p className="bl-widget-label">Latest reviewed</p>
            {reviews.slice(0, 4).map(r => (
              <a key={r.rkey} href={`/reviews/${r.rkey}`} className="bl-mini-item">
                <p className="bl-mini-title">{r.title}</p>
                <p className="bl-mini-meta">
                  {r.creativeWorkType} · {r.rating ? `${Math.round(r.rating / 2)}/5` : '—'}
                </p>
              </a>
            ))}
          </div>
        )}
      </aside>

      {/* ─── Mobile bottom nav ─── */}
      <nav className="bl-mobile-nav">
        <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>
          <span className="mn-ico">◈</span>Posts
        </NavLink>
        <NavLink to="/gallery" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="mn-ico">◻</span>Gallery
        </NavLink>
        <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}>
          <span className="mn-ico">◯</span>About
        </NavLink>
      </nav>
    </div>
  )
}

/* ─── PostItem — minimal redesign, same data ─── */
function PostItem({post, did}: {post: LeafletDocument; did: string}) {
  const date = new Date(post.publishedAt)
  const coverUrl = post.coverImage
    ? `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${post.coverImage.ref.$link}@jpeg`
    : null

  return (
    <li>
      <a href={`/posts/${post.rkey}`} className="bl-post-item">
        <div className="bl-post-thumb">
          {coverUrl ? (
            <img src={coverUrl} alt={post.title} />
          ) : (
            <div className="bl-post-thumb-empty">✏</div>
          )}
        </div>
        <div>
          <p className="bl-post-meta">
            {date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
          </p>
          <h3 className="bl-post-title">{post.title}</h3>
          {post.description && (
            <p className="bl-post-desc">{post.description}</p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="bl-tags">
              {post.tags.map(tag => (
                <span key={tag} className="bl-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </a>
    </li>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  book: 'Book',
  game: 'Game',
  music: 'Music',
}

/* ─── ReviewsSection — same logic, new look ─── */
function ReviewsSection({reviews}: {reviews: PopfeedReview[]}) {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [showTypes, setShowTypes] = useState(false)

  const availableTypes = useMemo(() => {
    const typeSet = new Set<string>()
    reviews.forEach(r => {if (r.creativeWorkType) typeSet.add(r.creativeWorkType)})
    return Array.from(typeSet).sort()
  }, [reviews])

  const filteredReviews = useMemo(() => {
    if (!activeType) return reviews
    return reviews.filter(r => r.creativeWorkType === activeType)
  }, [reviews, activeType])

  const activeLabel = activeType ? (CATEGORY_LABELS[activeType] ?? activeType) : 'All'

  return (
    <section style={{marginTop: '3rem'}}>
      <div className="bl-sec-header" style={{marginBottom: '0'}}>
        <span className="bl-sec-label">Recently watched &amp; read</span>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          {availableTypes.length > 0 && (
            <div style={{position: 'relative'}}>
              <button
                onClick={() => setShowTypes(!showTypes)}
                className={`bl-filter-btn${showTypes ? ' open' : ''}`}>
                {activeLabel}
                <span className="arrow">▼</span>
              </button>
              {showTypes && (
                <div className="bl-dropdown">
                  <button
                    className={activeType === null ? 'active-opt' : ''}
                    onClick={() => {setActiveType(null); setShowTypes(false)}}>
                    All Reviews
                  </button>
                  {availableTypes.map(type => (
                    <button
                      key={type}
                      className={activeType === type ? 'active-opt' : ''}
                      onClick={() => {setActiveType(type); setShowTypes(false)}}>
                      {CATEGORY_LABELS[type] ?? type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <span className="bl-sec-count">{filteredReviews.length} items</span>
        </div>
      </div>

      <ul className="bl-post-list">
        {filteredReviews.map(review => (
          <ReviewItem review={review} key={`review-${review.rkey}`} />
        ))}
      </ul>
    </section>
  )
}

/* ─── ReviewItem ─── */
function ReviewItem({review}: {review: PopfeedReview}) {
  const date = new Date(review.addedAt)
  const typeEmoji: Record<string, string> = {
    book: '📚', movie: '🎬', tv: '📺', game: '🎮', music: '🎵',
  }

  return (
    <li>
      <a href={`/reviews/${review.rkey}`} className="bl-review-item">
        <div className="bl-review-poster">
          {review.posterUrl ? (
            <img src={review.posterUrl} alt={review.title} />
          ) : (
            <div className="bl-review-poster-empty">
              {typeEmoji[review.creativeWorkType ?? ''] ?? '🎞️'}
            </div>
          )}
        </div>
        <div>
          <h3 className="bl-review-title">
            {typeEmoji[review.creativeWorkType ?? ''] ?? '🎞️'} {review.title}
          </h3>
          {review.mainCredit && (
            <p className="bl-review-credit">
              {review.mainCreditRole === 'author' ? 'by' : 'dir.'} {review.mainCredit}
              {review.releaseDate && (
                <> · {new Date(review.releaseDate).getFullYear()}</>
              )}
            </p>
          )}
          {review.rating && (
            <div className="bl-stars">
              {Array.from({length: 5}, (_, i) => (
                <span key={i} className={i < Math.round(review.rating! / 2) ? 'bl-star-on' : 'bl-star-off'}>★</span>
              ))}
            </div>
          )}
          <div className="bl-tags" style={{marginTop: '0.4rem'}}>
            {review.creativeWorkType && (
              <span className="bl-tag">{CATEGORY_LABELS[review.creativeWorkType] ?? review.creativeWorkType}</span>
            )}
            {review.genres?.slice(0, 2).map(g => (
              <span key={g} className="bl-tag">{g}</span>
            ))}
          </div>
        </div>
      </a>
    </li>
  )
}
