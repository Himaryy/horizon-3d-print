import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { ProductCard } from '#/components/product/ProductCard'
import { formatIDR } from '#/lib/format'
import { MOCK_DETAIL, MOCK_PRODUCTS } from '#/lib/mock-data'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Info, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/products/$slug')({
  component: RouteComponent,
})

const MATERIALS = ['PLA', 'PETG', 'TPU', 'Resin']

function RouteComponent() {
  const product = MOCK_DETAIL
  const [qty, setQty] = useState(1)
  const [activeMaterial, setActiveMaterial] = useState(
    product.material ?? 'PLA',
  )
  const [activeColor, setActiveColor] = useState(
    product.colors?.[0]?.name ?? '',
  )
  const [specsOpen, setSpecsOpen] = useState(false)

  return (
    <main className="mx-auto max-w-360 px-8 py-10 flex flex-col gap-16">
      <nav className="flex items-center gap-1.5 t-eyebrow text-fog">
        <Link to="/products" className="hover:text-ink transition-colors">
          Products
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-start">
        <div className="flex flex-col gap-3">
          <div className="card aspect-4/3 max-h-105 flex items-center justify-center overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="h-display text-[120px] text-ink opacity-[0.06] select-none leading-none">
                3D
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-20 h-20
                  rounded-[14px] border-[1.5px] border-line bg-paper-2
                  cursor-pointer hover:border-ink transition-colors"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-0">
            <Badge variant={'outline'} className="w-fit t-eyebrow">
              {product.category}
            </Badge>
            <h1 className="h-display text-[clamp(2rem,5vw,3.5rem)] text-ink leading-[0.92]">
              {product.name}
            </h1>
            <span className="price text-[28px] text-ink">
              {formatIDR(product.price)}
            </span>
          </div>

          {product.description && (
            <p className="text-[15px] leading-relaxed text-ink-2">
              {product.description}
            </p>
          )}

          {product.specs && product.specs.length > 0 && (
            <Collapsible open={specsOpen} onOpenChange={setSpecsOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1.5 t-eyebrow text-fog hover:text-ink transition-colors group">
                  <ChevronDown
                    className={`size-3 transition-transform ${specsOpen ? 'rotate-180 duration-200' : ''}`}
                  />
                  {specsOpen ? 'Hide specs' : 'Specs & Details'}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="card-soft rounded-[14px] p-4 flex flex-col gap-2">
                  {product.specs.map((s) => (
                    <div
                      key={s.label}
                      className="flex justify-between items-center"
                    >
                      <span className="t-eyebrow text-fog">{s.label}</span>
                      <span className="t-mono text-[13px] text-ink">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Separator />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="t-eyebrow">Material</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3 text-fog cursor-help" />
                </TooltipTrigger>

                <TooltipContent>
                  <p>Material affects durability, finish, and price.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <ToggleGroup
              type="single"
              value={activeMaterial}
              onValueChange={(v) => v && setActiveMaterial(v)}
              className="flex flex-wrap justify-start gap-2"
            >
              {MATERIALS.map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={m}
                  className="chip
                  data-[state=on]:bg-ink data-[state=on]:text-paper
                  data-[state=on]:border-ink"
                >
                  {m}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {product.colors && product.colors.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label className="t-eyebrow">Color</Label>
                  <span className="t-eyebrow text-fog">— {activeColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <Tooltip key={c.name}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActiveColor(c.name)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            activeColor === c.name
                              ? 'border-ink scale-110 shadow-[0_0_0_2px_var(--paper),0_0_0_4px_var(--ink)]'
                              : 'border-line hover:border-ink'
                          }`}
                          style={{ background: c.hex }}
                          aria-label={c.name}
                        />
                      </TooltipTrigger>
                      <TooltipContent>{c.name}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-col gap-2">
            <Label className="t-eyebrow">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant={'outline'}
                size={'icon'}
                className="rounded-full"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                -
              </Button>
              <span className="t-mono text-[18px] w-8 text-center">{qty}</span>
              <Button
                variant={'outline'}
                size={'icon'}
                className="rounded-full"
                onClick={() => setQty(Math.max(1, qty + 1))}
              >
                +
              </Button>
            </div>
          </div>

          {product.stock !== undefined && (
            <Badge variant={'outline'} className="w-fit text-fog t-eyebrow">
              {product.stock} in stock • Ships in 24h
            </Badge>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="btn btn-accent flex-1 h-12 text-[15px]">
              <ShoppingCart className="size-4" />
              Add to cart — {formatIDR(product.price * qty)}
            </Button>
            <Button variant={'outline'} className="h-12 rounded-full">
              Buy Now
            </Button>
          </div>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      <section>
        <p className="t-eyebrow mb-3">More like this</p>
        <h2 className="h-display text-[clamp(1.8rem,4vw,3rem)] text-ink mb-8">
          You might also{' '}
          <span className="h-serif-italic font-stretch-normal">like these.</span>
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {MOCK_PRODUCTS.filter((p) => p.slug !== product.slug)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
        </div>
      </section>
    </main>
  )
}
