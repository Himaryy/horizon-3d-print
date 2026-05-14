import { MATERIALS } from '#/lib/mock-data'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUp, stagger, staggerItem, viewport } from '#/lib/motion'

export function Materials() {
  return (
    <section className="mx-auto max-w-360 px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className="flex items-baseline justify-between mb-10 flex-wrap gap-4"
      >
        <div>
          <p className="t-eyebrow mb-3">Materials</p>
          <h2 className="h-display text-[clamp(2.5rem,6vw,5rem)] text-ink m-0">
            12 Materials.
            <br />
            <span className="h-serif-italic text-fog font-stretch-normal">
              One that's perfect for yours.
            </span>
          </h2>
        </div>

        <Link
          to="/custom"
          className="btn btn-ghost shrink-0 inline-flex items-center justify-center gap-1"
        >
          <span>Get a quote</span>
          <ArrowRight className="size-4 shrink-0 -rotate-45" />
        </Link>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:grid-cols-3"
      >
        {MATERIALS.map((m) => (
          <motion.div
            key={m.name}
            variants={staggerItem}
            className="card flex flex-col gap-4 p-4 sm:p-6 transition-transform duration-200 hover:-translate-y-1.5"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-[8px] sm:rounded-[10px] border-[1.5px] border-ink shrink-0"
                style={{ background: m.swatch }}
              />
              <div className="min-w-0">
                <div className="h-display text-[22px] sm:text-[28px] text-ink leading-none truncate">
                  {m.name}
                </div>
                <div className="text-[11px] sm:text-[12.5px] text-fog mt-0.5 truncate">
                  {m.tagline}
                </div>
              </div>
              <span className="chip ml-auto shrink-0 hidden sm:inline-flex">{m.tier}</span>
            </div>

            <div className="hidden sm:flex flex-wrap gap-2">
              {m.properties.map((p) => (
                <span className="chip chip-sky" key={p}>
                  {p}
                </span>
              ))}
            </div>

            <div className="pt-3 border-t border-line">
              <span className="t-eyebrow mr-2 hidden sm:inline">Best for</span>
              <span className="text-[12px] sm:text-[13px] text-ink-2">{m.best}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
