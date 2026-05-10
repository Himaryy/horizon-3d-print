import { FEATURED } from '#/lib/mock-data'
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

export function FeatureProduct() {
  return (
    <section className="mx-auto max-w-360 px-8 w-full">
      <div className="flex items-baseline justify-between mb-10 flex-wrap gap-4">
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
      </div>

      {/* Desktop: grid */}
      <div className="hidden lg:grid gap-6 grid-cols-4">
        {FEATURED.map((f) => (
          <ProductCard
            key={f.id}
            slug={f.slug}
            name={f.name}
            price={f.price}
            category={f.category}
          />
        ))}
      </div>

      {/* Mobile: carousel */}
      <Carousel className="lg:hidden overflow-visible" opts={{ align: 'start', dragFree: true }}>
        <CarouselContent className="-ml-4 pt-2 pb-3 pr-3 overflow-visible">
          {FEATURED.map((f) => (
            <CarouselItem key={f.id} className="pl-4 basis-4/5 sm:basis-1/2">
              <ProductCard
                slug={f.slug}
                name={f.name}
                price={f.price}
                category={f.category}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:flex justify-end gap-2 mt-4">
          <CarouselPrevious className="static translate-y-0 translate-x-0" />
          <CarouselNext className="static translate-y-0 translate-x-0" />
        </div>
      </Carousel>
    </section>
  )
}
