import { ALL_REVIEWS } from '#/lib/mock-data'
import { Marquee } from '#/components/ui/marquee'

type Review = (typeof ALL_REVIEWS)[number]

function ReviewCard({ r }: { r: Review }) {
  if (r.featured) {
    return (
      <div
        className="card relative overflow-hidden w-80 shrink-0 p-5 flex flex-col bg-(--sky-400)"
        style={{ boxShadow: '4px 4px 0 var(--ink)' }}
      >
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: r.stars }).map((_, i) => (
            <span key={i} className="text-gold text-[13px]">
              ★
            </span>
          ))}
        </div>
        <p className="m-0 text-[13.5px] leading-relaxed text-ink flex-1 line-clamp-3">
          "{r.text}"
        </p>
        <div className="flex items-center gap-2.5 pt-2 border-t border-ink/20 mt-3">
          <div
            className="w-8 h-8 rounded-full border-[1.5px] border-ink shrink-0"
            style={{ background: r.avatar }}
          />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink leading-tight mb-0.5 truncate">
              {r.name}
            </div>
            <div className="t-eyebrow truncate">{r.label}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card w-72 shrink-0 p-5 flex flex-col">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: r.stars }).map((_, i) => (
          <span key={i} className="text-gold text-[13px]">
            ★
          </span>
        ))}
      </div>
      <p className="m-0 text-[13.5px] leading-relaxed text-ink-2 flex-1 line-clamp-3">
        "{r.text}"
      </p>
      <div className="flex items-center gap-2.5 pt-2 border-t border-line mt-3">
        <div
          className="w-7 h-7 rounded-full border-[1.5px] border-ink shrink-0"
          style={{ background: r.avatar }}
        />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink leading-tight mb-0.5 truncate">
            {r.name}
          </div>
          <div className="t-eyebrow truncate">{r.label}</div>
        </div>
      </div>
    </div>
  )
}

const ROW_1 = ALL_REVIEWS.slice(0, 4)
const ROW_2 = ALL_REVIEWS.slice(4)

export function Reviews() {
  return (
    <section className="w-full overflow-hidden">
      {/* Header */}
      <div className="mx-auto max-w-360 px-8 mb-10">
        <p className="t-eyebrow mb-3">Reviews</p>
        <h2 className="h-display text-[clamp(2.5rem,6vw,5rem)] text-ink m-0">
          What makers say.
          <br />
          <span className="h-serif-italic text-fog font-stretch-normal">
            Honest words, real prints.
          </span>
        </h2>
      </div>

      {/* Row 1 — left to right */}
      <Marquee pauseOnHover className="[--duration:35s] [--gap:1.25rem] pb-5">
        {ROW_1.map((r) => (
          <ReviewCard key={r.name} r={r} />
        ))}
      </Marquee>

      {/* Row 2 — right to left */}
      <Marquee
        reverse
        pauseOnHover
        className="[--duration:30s] [--gap:1.25rem]"
      >
        {ROW_2.map((r) => (
          <ReviewCard key={r.name} r={r} />
        ))}
      </Marquee>
    </section>
  )
}
