import { featuredReviewsQueryOptions } from '#/data/products'
import { Marquee } from '#/components/ui/marquee'
import { motion } from 'motion/react'
import { fadeUp, viewport } from '#/lib/motion'
import { useSuspenseQuery } from '@tanstack/react-query'

// Deterministic pastel color from name — no hex from DB needed
const AVATAR_PALETTE = [
  'var(--sky)',
  'var(--gold)',
  '#9B8E76',
  '#7AC4FF',
  '#A9DAFF',
  '#16110A',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

type FeaturedReview = {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  user: { name: string }
  product: { name: string; slug: string }
}

function ReviewCard({ r }: { r: FeaturedReview }) {
  const color = avatarColor(r.user.name)
  const initial = r.user.name.charAt(0).toUpperCase()

  return (
    <div className="card w-72 shrink-0 p-5 flex flex-col">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: r.rating }).map((_, i) => (
          <span key={i} className="text-gold text-[13px]">
            ★
          </span>
        ))}
      </div>
      <p className="m-0 text-[13.5px] leading-relaxed text-ink-2 flex-1 line-clamp-3">
        "{r.comment ?? ''}"
      </p>
      <div className="flex items-center gap-2.5 pt-2 border-t border-line mt-3">
        <div
          className="w-7 h-7 rounded-full border-[1.5px] border-ink shrink-0 flex items-center justify-center"
          style={{ background: color }}
        >
          <span className="text-[11px] font-bold text-ink leading-none">
            {initial}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink leading-tight mb-0.5 truncate">
            {r.user.name}
          </div>
          <div className="t-eyebrow truncate">{r.product.name}</div>
        </div>
      </div>
    </div>
  )
}

export function Reviews() {
  const { data: reviews } = useSuspenseQuery(featuredReviewsQueryOptions())

  const row1 = reviews.slice(0, Math.ceil(reviews.length / 2))
  const row2 = reviews.slice(Math.ceil(reviews.length / 2))

  return (
    <section className="w-full mx-auto max-w-360 px-8 overflow-hidden">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className="mb-10"
      >
        <p className="t-eyebrow mb-3">Reviews</p>
        <h2 className="h-display text-[clamp(2.5rem,6vw,5rem)] text-ink m-0">
          What makers say.
          <br />
          <span className="h-serif-italic text-fog font-stretch-normal">
            Honest words, real prints.
          </span>
        </h2>
      </motion.div>

      {reviews.length === 0 ? (
        <p className="text-fog text-sm">No reviews yet.</p>
      ) : (
        <>
          <Marquee
            pauseOnHover
            className="[--duration:35s] [--gap:1.25rem] pb-5"
          >
            {row1.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </Marquee>

          {row2.length > 0 && (
            <Marquee
              reverse
              pauseOnHover
              className="[--duration:30s] [--gap:1.25rem]"
            >
              {row2.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </Marquee>
          )}
        </>
      )}
    </section>
  )
}
