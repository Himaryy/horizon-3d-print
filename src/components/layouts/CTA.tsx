import { Link } from '@tanstack/react-router'
import { ArrowRight, LucideArrowUpFromLine } from 'lucide-react'
import { motion } from 'motion/react'
import { stagger, staggerItem, viewport } from '#/lib/motion'

export function CTA() {
  return (
    <section className="mx-auto max-w-360 px-8 w-full">
      <div className="relative overflow-hidden rounded-[28px] bg-ink border-[1.5px] border-ink px-14 py-20 flex flex-col items-center text-center">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--gold-400) 1.5px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="relative flex flex-col items-center text-center"
        >
          <motion.span
            variants={staggerItem}
            className="chip chip-ink border-[#2A2014] text-gold mb-8"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-[blink_1.5s_infinite]" />
            Small batch · Ships nationwide
          </motion.span>

          <motion.h2
            variants={staggerItem}
            className="h-display text-[clamp(3rem,8vw,7rem)] text-paper m-0 leading-[0.9] max-w-4xl"
          >
            Your idea.
            <br />
            <span
              className="h-serif-italic text-gold inline-block"
              style={{ fontSize: '0.88em', transform: 'translateY(0.04em)' }}
            >
              In your hands.
            </span>
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="text-[17px] leading-relaxed text-paper/60 max-w-xl mt-7 mb-10"
          >
            Stop looking at it on screen. Upload your file and we'll put
            something real in your hands by tomorrow — printed, finished, and
            shipped with full attention from start to finish.
          </motion.p>

          <motion.div
            variants={staggerItem}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
