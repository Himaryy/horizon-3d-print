import { ProductCard } from '#/components/product/ProductCard'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { MOCK_PRODUCTS } from '#/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'
import { Box, Search } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/products/')({ component: ProductsPage })

const CATEGORIES = ['All', 'Figurines', 'Utility', 'Home']
const SORTS = ['Newest', 'Price ↑', 'Price ↓']

function ProductsPage() {
  const [active, setActive] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [query, setQuery] = useState('')

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchCat = active === 'All' || p.category === active
    const matchQuery = p.name.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQuery
  }).sort((a, b) => {
    if (sort === 'Price ↑') return a.price - b.price
    if (sort === 'Price ↓') return b.price - a.price
    return 0
  })

  return (
    <main className="flex flex-col gap-10 pb-24">
      {/* Hero card */}
      <section className="mx-auto w-full max-w-360 px-8 pt-8">
        <div className="relative overflow-hidden rounded-[28px] bg-sky border-[1.5px] border-ink shadow-[6px_6px_0_var(--ink)] px-10 py-12 lg:px-14 lg:py-16">
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
            <div className="flex items-center max-w-lg rounded-full border-[1.5px] border-ink bg-white-warm p-1">
              <Search className="ml-3 size-4 text-fog shrink-0" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
              <Button className="btn btn-accent rounded-l-none rounded-r-full h-10 px-5 shrink-0">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter + grid */}
      <section className="mx-auto w-full max-w-360 px-8">
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {/* Category filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                onClick={() => setActive(cat)}
                className={
                  active === cat
                    ? 'btn btn-sm bg-ink hover:bg-ink text-paper border-ink'
                    : 'btn btn-ghost btn-sm hover:bg-white-warm! bg-white-warm!'
                }
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Sort pills */}
          <div className="flex items-center gap-1 ml-auto rounded-full border-[1.5px] border-line bg-white-warm p-1">
            {SORTS.map((s) => (
              <Button
                key={s}
                onClick={() => setSort(s)}
                className={`btn btn-sm rounded-full border-0! shadow-none! transition-colors duration-200 cursor-pointer ${
                  sort === s
                    ? 'bg-gold! text-ink! hover:bg-gold!'
                    : 'bg-transparent! text-ink-2! hover:text-ink! hover:bg-transparent!'
                }`}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              category={p.category}
              name={p.name}
              price={p.price}
              slug={p.slug}
              id={p.id}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
