import { ProductCard } from '#/components/product/ProductCard'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { publishedProductsQueryOptions } from '#/data/products'
import type { PublishedProductsInput } from '#/data/products'
import { fadeUp, stagger, staggerItem } from '#/lib/motion'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Box, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  search: z.string().optional(),
  category: z.enum(['READY_MADE', 'CUSTOM_BASE']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
})

export const Route = createFileRoute('/products/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(publishedProductsQueryOptions(deps)),
  component: ProductsPage,
})

const CATEGORIES: {
  label: string
  value: PublishedProductsInput['category'] | undefined
}[] = [
  { label: 'All', value: undefined },
  { label: 'Ready Made', value: 'READY_MADE' },
  { label: 'Custom Base', value: 'CUSTOM_BASE' },
]

const SORTS: {
  label: string
  value: NonNullable<PublishedProductsInput['sort']>
}[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
]

function ProductsPage() {
  const { search, category, sort } = Route.useSearch()
  const navigate = useNavigate({ from: '/products/' })
  const searchRef = useRef<HTMLInputElement>(null)

  const activeSort = sort ?? 'newest'

  const { data: products } = useSuspenseQuery(
    publishedProductsQueryOptions({ search, category, sort }),
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({
      search: (prev) => ({
        ...prev,
        search: searchRef.current?.value || undefined,
      }),
      resetScroll: false,
    })
  }

  return (
    <main className="flex flex-col gap-10 pb-24">
      {/* Hero card */}
      <section className="mx-auto w-full max-w-360 px-8 pt-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="relative overflow-hidden rounded-[28px] bg-sky border-[1.5px] border-ink shadow-[6px_6px_0_var(--ink)] px-10 py-12 lg:px-14 lg:py-16"
        >
          {/* Decorative cube — top right */}
          <div className="absolute -top-3 -right-6 opacity-[0.15] pointer-events-none hidden lg:block">
            <Box className="size-72 text-ink" strokeWidth={0.75} />
          </div>

          <div className="relative">
            <p className="t-eyebrow mb-3 text-ink!">Marketplace</p>
            <h1 className="h-display text-[clamp(2.5rem,7vw,5.5rem)] text-ink m-0 mb-4 leading-[0.9]">
              Handpicked.{' '}
              <span className="h-serif-italic text-ink font-stretch-normal">
                One click to print.
              </span>
            </h1>

            <p className="text-[17px] leading-relaxed text-ink/70 max-w-lg mb-8 font-medium">
              Every piece made to order. Pick your design, hit order, and we
              handle the rest — printed, finished, and shipped within 24 hours.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="flex items-center max-w-lg rounded-full border-[1.5px] border-ink bg-white-warm p-1"
            >
              <Search className="ml-3 size-4 text-fog shrink-0" />
              <Input
                ref={searchRef}
                type="text"
                defaultValue={search ?? ''}
                placeholder="Search products..."
                className="
                  flex-1
                  h-10
                  border-0
                  bg-transparent
                  shadow-none
                  ring-0
                  focus-visible:ring-0
                  focus-visible:ring-offset-0
                  focus-visible:outline-none
                  focus:outline-none
                  text-ink
                  placeholder:text-fog
                  text-sm
                  font-medium
                "
              />
              <Button
                type="submit"
                className="btn btn-accent rounded-l-none rounded-r-full h-10 px-5 shrink-0"
              >
                Search
              </Button>
            </form>
          </div>
        </motion.div>
      </section>

      {/* Filter + grid */}
      <section className="mx-auto w-full max-w-360 px-8">
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {/* Category filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.label}
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, category: cat.value }),
                    resetScroll: false,
                  })
                }
                className={
                  category === cat.value
                    ? 'btn btn-sm bg-ink hover:bg-ink text-paper border-ink'
                    : 'btn btn-ghost btn-sm hover:bg-white-warm! bg-white-warm!'
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-1 ml-auto rounded-full border-[1.5px] border-line bg-white-warm p-1">
            {SORTS.map((s) => (
              <Button
                key={s.value}
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, sort: s.value }),
                    resetScroll: false,
                  })
                }
                className={`btn btn-sm rounded-full border-0! shadow-none! transition-colors duration-200 cursor-pointer ${
                  activeSort === s.value
                    ? 'bg-gold! text-ink! hover:bg-gold!'
                    : 'bg-transparent! text-ink-2! hover:text-ink! hover:bg-transparent!'
                }`}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-fog text-sm py-16 text-center">
            No products found.
          </p>
        ) : (
          <motion.div
            key={`${category ?? 'all'}-${activeSort}-${search ?? ''}`}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4"
          >
            {products.map((p) => (
              <motion.div key={p.id} variants={staggerItem}>
                <ProductCard
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  category={p.category}
                  image={p.image}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </main>
  )
}
