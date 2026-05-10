import { Link } from '@tanstack/react-router'
import { ArrowRight, LucideArrowUpFromLine } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

function FloatingCube({ size = 100 }: { size?: number }) {
  return (
    <div className="cube-wrap" style={{ width: size, height: size }}>
      <div className="cube" style={{ width: size * 0.55, height: size * 0.55 }}>
        <div className="f-front" />
        <div className="f-back" />
        <div className="f-right" />
        <div className="f-left" />
        <div className="f-top" />
        <div className="f-bottom" />
      </div>
    </div>
  )
}

const STATS = [
  { value: '24h', label: 'Average turnaround' },
  { value: '12+', label: 'Materials available' },
  { value: '4.9★', label: 'From 2.3K reviews' },
  { value: '0.05mm', label: 'Print precision' },
]

const AVATAR_COLORS = ['#5BB8FF', '#FFC23C', '#16110A', '#7AC4FF']

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!heroRef.current) return
      const r = heroRef.current.getBoundingClientRect()
      setMouse({
        x: (e.clientX - r.left) / r.width - 0.5,
        y: (e.clientY - r.top) / r.height - 0.5,
      })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <section className="w-full mx-auto max-w-360 px-8 pt-8 pb-2">
      {/* Big gold hero card */}
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-[28px] pt-16 px-14 pb-14 bg-gold border-[1.5px] border-ink shadow-[6px_6px_0_var(--ink)]"
      >
        {/* Floating cubes — desktop only */}
        <div
          className="absolute top-16 right-20 pointer-events-none hidden lg:block"
          style={{
            transform: `translate(${mouse.x * 20}px, ${mouse.y * 20}px) rotate(15deg)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <FloatingCube size={160} />
        </div>
        <div
          className="absolute bottom-24 right-72 pointer-events-none hidden lg:block"
          style={{
            transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px) rotate(-8deg)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <FloatingCube size={80} />
        </div>

        {/* Content */}
        <div className="relative max-w-3xl">
          {/* Eyebrow chips */}
          <div className="flex items-center gap-2 mb-7 flex-wrap">
            <span className="chip chip-ink">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-[blink_1.5s_infinite]" />
              Live · 12 printers running
            </span>
            <span className="chip bg-white-warm border-ink">
              ⚡ 24h turnaround
            </span>
          </div>

          {/* Headline */}
          <h1 className="h-display text-[clamp(72px,9vw,132px)] text-ink m-0 leading-[0.9]">
            From pixel
            <br />
            to{' '}
            <span
              className="h-serif-italic inline-block"
              style={{ fontSize: '0.92em', transform: 'translateY(0.05em)' }}
            >
              physical.
            </span>
          </h1>

          {/* Body */}
          <p className="text-[19px] leading-normal max-w-130 text-ink font-medium mt-7 mb-9">
            Upload any 3D model, get an instant quote, and we'll print, finish,
            and ship it within 24 hours. Built for makers, businesses, and
            curious humans of every size.
          </p>

          {/* CTAs + social proof */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/custom"
              className="btn btn-lg bg-ink text-paper border-ink"
            >
              <LucideArrowUpFromLine className="size-4" />
              Upload your STL
            </Link>
            <Link
              to="/products"
              className="btn btn-lg bg-white-warm text-ink border-ink"
            >
              Browse Marketplace
              <ArrowRight size={18} className="inline-block ml-1" />
            </Link>

            {/* Avatar stack + count */}
            <div className="flex items-center gap-2.5 ml-2">
              <div className="flex">
                {AVATAR_COLORS.map((c, i) => (
                  <div
                    key={c}
                    className="w-8 h-8 rounded-full border-2 border-gold"
                    style={{ background: c, marginLeft: i ? -10 : 0 }}
                  />
                ))}
              </div>
              <div className="text-[12.5px] leading-snug text-ink">
                <strong>1,847 makers</strong>
                <br />
                <span className="text-ink-2">printed this month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div
          className="relative mt-16 pt-6 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t-[1.5px] border-dashed border-ink"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="h-display text-[44px] text-ink leading-none">
                {s.value}
              </div>
              <div className="t-eyebrow text-ink-2 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
