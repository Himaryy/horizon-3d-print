import { featuredProductsQueryOptions } from '#/data/products'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '../product/ProductCard'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '#/components/ui/carousel'
import { motion } from 'motion/react'
import { fadeUp, stagger, staggerItem, viewport } from '#/lib/motion'
import { useSuspenseQuery } from '@tanstack/react-query'

export function FeatureProduct() {
  const { data: featured } = useSuspenseQuery(featuredProductsQueryOptions())

  return (
    <section className="mx-auto max-w-360 px-8 w-full">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        className="flex items-baseline justify-between mb-10 flex-wrap gap-4"
      >
        <div>
          <p className="t-eyebrow mb-3">Featured</p>
          <h2 className="h-display text-[clamp(2.5rem,6vw,5rem)] text-ink m-0">
            Made here.
            <br />
            <span className="h-serif-italic text-fog font-stretch-normal">
              Ship tomorrow.
            </span>
          </h2>
        </div>
        <Link
          to="/products"
          className="btn btn-ghost shrink-0 inline-flex items-center justify-center gap-1"
        >
          <span>See all products</span>
          <ArrowRight className="size-4 shrink-0 -rotate-45" />
        </Link>
      </motion.div>

      {featured.length === 0 ? (
        <p className="text-fog text-sm">No featured products yet.</p>
      ) : (
        <>
          {/* Desktop: stagger grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="hidden lg:grid gap-6 grid-cols-4"
          >
            {featured.map((f) => (
              <motion.div key={f.id} variants={staggerItem}>
                <ProductCard
                  id={f.id}
                  slug={f.slug}
                  name={f.name}
                  price={f.price}
                  category={f.category}
                  image={f.image}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile: carousel */}
          <Carousel
            className="lg:hidden overflow-visible"
            opts={{ align: 'start', dragFree: true }}
          >
            <CarouselContent className="-ml-4 pt-2 pb-3 pr-3 overflow-visible">
              {featured.map((f) => (
                <CarouselItem
                  key={f.id}
                  className="pl-4 basis-4/5 sm:basis-1/2"
                >
                  <ProductCard
                    id={f.id}
                    slug={f.slug}
                    name={f.name}
                    price={f.price}
                    category={f.category}
                    image={f.image}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden sm:flex justify-end gap-2 mt-4">
              <CarouselPrevious className="static translate-y-0 translate-x-0" />
              <CarouselNext className="static translate-y-0 translate-x-0" />
            </div>
          </Carousel>
        </>
      )}
    </section>
  )
}
