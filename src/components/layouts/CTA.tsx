import { Link } from '@tanstack/react-router'
import { ArrowRight, LucideArrowUpFromLine } from 'lucide-react'

export function CTA() {
  return (
    <section className="mx-auto max-w-360 px-8 w-full">
      <div className="relative overflow-hidden rounded-[28px] bg-ink border-[1.5px] border-ink px-14 py-20 flex flex-col items-center text-center">
        {/* Decorative cubes */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--gold-400) 1.5px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Eyebrow */}
        <span className="chip chip-ink border-[#2A2014] text-gold mb-8">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-[blink_1.5s_infinite]" />
          24h turnaround · Ships nationwide
        </span>

        {/* Headline */}
        <h2 className="h-display text-[clamp(3rem,8vw,7rem)] text-paper m-0 leading-[0.9] max-w-4xl">
          Your idea.
          <br />
          <span
            className="h-serif-italic text-gold inline-block"
            style={{ fontSize: '0.88em', transform: 'translateY(0.04em)' }}
          >
            In your hands.
          </span>
        </h2>

        <p className="text-[17px] leading-relaxed text-(--ink-4) max-w-xl mt-7 mb-10">
          Upload any STL or OBJ, get an instant quote across 12 materials, and
          we'll print, finish, and ship it within 24 hours.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link to="/custom" className="btn btn-accent btn-lg">
            <LucideArrowUpFromLine className="size-4" />
            Upload your STL
          </Link>
          <Link
            to="/products"
            className="btn btn-lg bg-transparent text-paper border-[#2A2014]"
          >
            Browse Marketplace
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
