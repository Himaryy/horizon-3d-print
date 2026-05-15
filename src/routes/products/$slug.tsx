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
import { formatIDR } from '#/lib/format'
import { productBySlugQueryOptions } from '#/data/products'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Info, ShoppingCart } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useCartStore } from '#/store/cart'
import { fadeUp, viewport } from '#/lib/motion'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/products/$slug')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(productBySlugQueryOptions(params.slug)),
  component: RouteComponent,
})

const MATERIALS = ['PLA', 'PETG', 'TPU', 'Resin']

function RouteComponent() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)

  const { data: product } = useSuspenseQuery(productBySlugQueryOptions(slug))

  // Derive unique colors from variants (filter out null colors)
  const colorVariants = product.variants.filter(
    (v): v is typeof v & { color: string } => v.color !== null,
  )
  const uniqueColors = Array.from(
    new Map(colorVariants.map((v) => [v.color, v])).values(),
  )

  const firstColor = uniqueColors[0]?.color ?? null

  const [activeColor, setActiveColor] = useState<string | null>(firstColor)
  const [activeSize, setActiveSize] = useState<string | null>(() => {
    if (!firstColor) return null
    const firstWithSize = product.variants.find(
      (v) => v.color === firstColor && v.size !== null,
    )
    return firstWithSize?.size ?? null
  })

  const sizesForColor: string[] = product.variants
    .filter((v) => v.color === activeColor && v.size !== null)
    .map((v) => v.size as string)

  // Find the active variant — exact match → color-only → first in list
  function findSelectedVariant():
    | (typeof product.variants)[number]
    | undefined {
    if (activeColor !== null) {
      const exact = product.variants.find(
        (v) => v.color === activeColor && v.size === activeSize,
      )
      if (exact) return exact
      return product.variants.find((v) => v.color === activeColor)
    }
    return product.variants.find((_v, i) => i === 0)
  }
  const selectedVariant = findSelectedVariant()

  const priceAdjust = selectedVariant?.priceAdjust ?? 0
  const effectivePrice = product.price + priceAdjust

  const [qty, setQty] = useState(1)
  const [activeMaterial, setActiveMaterial] = useState('PLA')
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [specsOpen, setSpecsOpen] = useState(false)

  function handleQtyIncrease() {
    setQty((prev) => prev + 1)
  }

  function handleQtyDecrease() {
    setQty((prev) => Math.max(1, prev - 1))
  }

  function handleAddToCart() {
    addItem({
      id: product.id,
      name: product.name,
      price: effectivePrice,
      image: product.images[0]?.url,
      material: activeMaterial,
      color: activeColor ?? undefined,
      qty,
      category: product.category,
      slug: product.slug,
    })
  }

  function handleBuyNow() {
    handleAddToCart()
    navigate({ to: '/cart' })
  }

  const activeImage: (typeof product.images)[number] | undefined =
    product.images.length > 0 ? product.images[activeImageIdx] : undefined

  return (
    <motion.main
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-360 px-8 py-10 flex flex-col gap-16"
    >
      <nav className="flex items-center gap-1.5 t-eyebrow text-fog">
        <Link to="/products" className="hover:text-ink transition-colors">
          Products
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-start">
        {/* Image gallery */}
        <div className="flex flex-col gap-3">
          <div className="card aspect-4/3 max-h-105 flex items-center justify-center overflow-hidden">
            {activeImage ? (
              <img
                src={activeImage.url}
                alt={activeImage.alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="h-display text-[120px] text-ink opacity-[0.06] select-none leading-none">
                3D
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(i)}
                  aria-label={img.alt}
                  className={`w-20 h-20 rounded-[14px] border-[1.5px] overflow-hidden transition-colors ${
                    i === activeImageIdx
                      ? 'border-ink'
                      : 'border-line hover:border-ink'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-0">
            <Badge variant="outline" className="w-fit t-eyebrow">
              {product.category}
            </Badge>
            <h1 className="h-display text-[clamp(2rem,5vw,3.5rem)] text-ink leading-[0.92]">
              {product.name}
            </h1>
            <span className="price text-[28px] text-ink">
              {formatIDR(effectivePrice)}
            </span>
          </div>

          {product.desc && (
            <p className="text-[15px] leading-relaxed text-ink-2">
              {product.desc}
            </p>
          )}

          <Separator />

          {/* Material toggle — UI-only, not from DB */}
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
                  className="chip data-[state=on]:bg-ink data-[state=on]:text-paper data-[state=on]:border-ink"
                >
                  {m}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Color variant selection */}
          {uniqueColors.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label className="t-eyebrow">Color</Label>
                  {activeColor !== null && (
                    <span className="t-eyebrow text-fog">— {activeColor}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((v) => (
                    <Tooltip key={v.color}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setActiveColor(v.color)
                            const firstSize = product.variants.find(
                              (pv) => pv.color === v.color && pv.size !== null,
                            )
                            setActiveSize(firstSize?.size ?? null)
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-all bg-paper-2 flex items-center justify-center ${
                            activeColor === v.color
                              ? 'border-ink scale-110 shadow-[0_0_0_2px_var(--paper),0_0_0_4px_var(--ink)]'
                              : 'border-line hover:border-ink'
                          }`}
                          aria-label={v.color}
                          aria-pressed={activeColor === v.color}
                        >
                          <span className="text-[10px] font-bold text-ink leading-none truncate max-w-6">
                            {v.color.charAt(0).toUpperCase()}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{v.color}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Size variant selection */}
          {sizesForColor.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <Label className="t-eyebrow">Size</Label>
                <ToggleGroup
                  type="single"
                  value={activeSize ?? ''}
                  onValueChange={(v) => v && setActiveSize(v)}
                  className="flex flex-wrap justify-start gap-2"
                >
                  {sizesForColor.map((size) => {
                    const variantForSize = product.variants.find(
                      (v) => v.color === activeColor && v.size === size,
                    )
                    const outOfStock = (variantForSize?.stock ?? 0) === 0
                    return (
                      <ToggleGroupItem
                        key={size}
                        value={size}
                        disabled={outOfStock}
                        className="chip data-[state=on]:bg-ink data-[state=on]:text-paper data-[state=on]:border-ink disabled:opacity-40"
                      >
                        {size}
                      </ToggleGroupItem>
                    )
                  })}
                </ToggleGroup>
              </div>
            </>
          )}

          <Separator />

          {/* Specs collapsible */}
          <Collapsible open={specsOpen} onOpenChange={setSpecsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 t-eyebrow text-fog hover:text-ink transition-colors">
                <ChevronDown
                  className={`size-3 transition-transform ${specsOpen ? 'rotate-180 duration-200' : ''}`}
                />
                {specsOpen ? 'Hide specs' : 'Specs & Details'}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="card-soft rounded-[14px] p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="t-eyebrow text-fog">Stock</span>
                  <span className="t-mono text-[13px] text-ink">
                    {product.stock}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="t-eyebrow text-fog">Category</span>
                  <span className="t-mono text-[13px] text-ink">
                    {product.category}
                  </span>
                </div>
                {selectedVariant !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="t-eyebrow text-fog">SKU</span>
                    <span className="t-mono text-[13px] text-ink">
                      {selectedVariant.sku}
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <Label className="t-eyebrow">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleQtyDecrease}
                aria-label="Decrease quantity"
              >
                -
              </Button>
              <span className="t-mono text-[18px] w-8 text-center">{qty}</span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={handleQtyIncrease}
                aria-label="Increase quantity"
              >
                +
              </Button>
            </div>
          </div>

          <Badge variant="outline" className="w-fit text-fog t-eyebrow">
            {product.stock} in stock • Ships in 24h
          </Badge>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="btn btn-accent flex-1 h-12 text-[15px]"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="size-4" />
              Add to cart — {formatIDR(effectivePrice * qty)}
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-full"
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </section>

      {/* CTA to browse all instead of related products */}
      <section>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="card-soft rounded-[28px] p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <p className="t-eyebrow mb-2">Explore more</p>
            <h2 className="h-display text-[clamp(1.5rem,3vw,2.5rem)] text-ink m-0">
              See everything we print.
            </h2>
          </div>
          <Link
            to="/products"
            className="btn btn-accent shrink-0 inline-flex items-center gap-2 px-6 h-12"
          >
            Browse all products
          </Link>
        </motion.div>
      </section>
    </motion.main>
  )
}
