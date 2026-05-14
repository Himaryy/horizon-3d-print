import { HowItWorks } from '#/components/layouts/HowItsWorks'
import { Materials } from '#/components/layouts/Materials'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/_home/about')({ component: AboutPage })

const STATS = [
  { value: '500+', label: 'Prints delivered' },
  { value: '12', label: 'Materials available' },
  { value: '24h', label: 'Average turnaround' },
  { value: '98%', label: 'Satisfaction rate' },
]

function AboutPage() {
  return (
    <main className="flex flex-col gap-20 pb-24">
      {/* Hero */}
      <section className="mx-auto w-full max-w-360 px-8 pt-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-10 py-16 lg:px-14 lg:py-20">
          <p className="t-eyebrow text-fog mb-4">About Horizon 3D</p>
          <h1 className="h-display text-[clamp(2.5rem,7vw,5.5rem)] text-paper leading-[0.92] mb-6 max-w-3xl">
            Serious craft.{' '}
            <span className="h-serif-italic font-stretch-normal text-sky">
              Playful soul.
            </span>
            <br />
            Made in Indonesia.
          </h1>
          <p className="text-[17px] text-fog leading-relaxed max-w-xl">
            We're a small studio in Indonesia that believes physical objects
            should be as precise as they are fun. Every print leaves our shop
            quality-checked, finished, and ready to impress.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto w-full max-w-360 px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((s) => (
            <div key={s.label} className="card p-6 flex flex-col gap-2">
              <span className="h-display text-[clamp(2.5rem,5vw,4rem)] text-ink leading-none">
                {s.value}
              </span>
              <span className="t-eyebrow text-fog">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Materials */}
      <Materials />

      {/* CTA */}
      <section className="mx-auto w-full max-w-360 px-8">
        <div className="card bg-gold px-10 py-12 lg:px-14 lg:py-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <p className="t-eyebrow mb-3">Ready?</p>
            <h2 className="h-display text-[clamp(2rem,5vw,4rem)] text-ink leading-[0.92]">
              Pick a print.{' '}
              <span className="h-serif-italic font-stretch-normal">
                Or bring your own.
              </span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/products"
              className="btn btn-accent inline-flex items-center gap-2"
            >
              Browse Products
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/custom"
              className="btn btn-ghost inline-flex items-center gap-2"
            >
              Get a Custom Quote
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
