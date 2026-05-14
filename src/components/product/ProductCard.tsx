import { formatIDR } from '#/lib/format'
import type { Product } from '#/lib/types'
import { Link } from '@tanstack/react-router'
import { Button } from '../ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '#/store/cart'

export function ProductCard({
  id,
  category,
  name,
  price,
  slug,
  image,
}: Product) {
  const addItem = useCartStore((s) => s.addItem)

  function handleAddToCart() {
    addItem({
      id,
      slug,
      name,
      price,
      category,
      image,
      material: 'PLA',
      qty: 1,
    })
  }
  return (
    <article className="card group flex flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1.5">
      {/* Image */}
      <Link
        to="/products/$slug"
        params={{ slug }}
        className="block aspect-4/3 bg-paper-2 overflow-hidden"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="h-display text-[80px] text-ink opacity-[0.06] select-none leading-none">
              3D
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-1 p-4 flex-1">
        {category && <span className="t-eyebrow mb-1">{category}</span>}

        <Link
          to="/products/$slug"
          params={{ slug }}
          className="h-display text-[17px] leading-tight transition-colors line-clamp-1 truncate hover:underline"
        >
          {name}
        </Link>

        <div className="mt-auto pt-3">
          <span className="price text-[18px] text-ink">{formatIDR(price)}</span>
        </div>

        <Button
          className="btn btn-accent w-full mt-3"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="size-4" />
          Add to Cart
        </Button>
      </div>
    </article>
  )
}
