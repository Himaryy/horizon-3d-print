import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    title: 'Upload',
    body: 'Drop in an STL, OBJ, or 3MF file. We auto-check wall thickness, overhangs, and printability while you grab a coffee.',
    bg: 'bg-sky',
    text: 'text-ink',
    border: 'border-ink',
  },
  {
    n: '02',
    title: 'Quote & confirm',
    body: 'Get an instant quote across 12 materials and finishes. Choose your specs, confirm the price, and we handle the rest.',
    bg: 'bg-gold',
    text: 'text-ink',
    border: 'border-ink',
  },
  {
    n: '03',
    title: 'Print & ship',
    body: 'Your file goes straight to our printers. We finish, quality-check, and dispatch within 24 hours.',
    bg: 'bg-ink',
    text: 'text-paper',
    border: 'border-ink',
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-360 px-8">
      <div className="flex items-baseline justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="t-eyebrow mb-3">How it works</p>
          <h2 className="h-display text-[clamp(2.5rem,6vw,5rem)] text-ink m-0">
            Three steps.
            <br />
            <span className="h-serif-italic text-fog font-stretch-normal">
              One sleepless night for our printers.
            </span>
          </h2>
        </div>
        <Link
          to="/custom"
          className="btn btn-ghost shrink-0 inline-flex items-center justify-center gap-1"
        >
          <span>See Pricing</span>
          <ArrowRight className="size-4 shrink-0 -rotate-45" />
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className={`${step.bg} ${step.text} ${step.border} border-[1.5px] rounded-[22px] p-7 min-h-90 flex flex-col relative overflow-hidden`}
          >
            <div className="t-eyebrow opacity-70">STEP {step.n}</div>

            {/* Large step number watermark */}
            <div className="h-display text-[120px] leading-none select-none opacity-10 my-4">
              {step.n}
            </div>

            <h3 className="h-display text-[48px] m-0 mb-2 leading-none">
              {step.title}
            </h3>
            <p className="text-[14.5px] leading-relaxed m-0 opacity-90">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
