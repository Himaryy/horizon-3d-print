import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { formatIDR } from '#/lib/format'
import type { CartItemType } from '#/lib/types'
import { useCartStore } from '#/store/cart'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, ShoppingCart, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUp, stagger, staggerItem } from '#/lib/motion'

export const Route = createFileRoute('/_home/cart')({ component: CartPage })

function CartPage() {
  const { items, updateQty, removeItem, totalItems, totalPrice } =
    useCartStore()

  function handleDecrease(item: CartItemType) {
    if (item.qty > 1) {
      updateQty(item.id, item.material, item.color, item.qty - 1)
    } else {
      removeItem(item.id, item.material, item.color)
    }
  }

  function handleIncrease(item: CartItemType) {
    updateQty(item.id, item.material, item.color, item.qty + 1)
  }

  function handleRemove(item: CartItemType) {
    removeItem(item.id, item.material, item.color)
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-360 px-8 py-24 flex flex-col items-center gap-6 text-center">
        <ShoppingCart className="size-16 text-line" strokeWidth={1} />
        <h1 className="h-display text-[clamp(2rem,5vw,3.5rem)] text-ink">
          Cart is empty.
        </h1>
        <p className="text-ink-2 text-[15px] max-w-sm">
          You haven't added anything yet. Browse the marketplace and find
          something worth printing.
        </p>

        <Link
          to="/products"
          className="btn btn-accent mt-2 inline-flex items-center gap-2"
        >
          Browse Products
          <ArrowRight className="size-4" />
        </Link>
      </main>
    )
  }

  return (
    <motion.main
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-360 px-8 py-10 flex flex-col gap-10"
    >
      <div>
        <p className="t-eyebrow mb-2">Cart</p>
        <h1 className="h-display text-[clamp(2rem,5vw,3.5rem)] text-ink leading-[0.92]">
          {totalItems()} {totalItems() === 1 ? 'item' : 'items'}.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
        {/* Left column - Cart items */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          {items.map((item) => (
            <motion.div
              variants={staggerItem}
              className="card p-4 flex gap-4 items-start"
              key={`${item.id}-${item.material}-${item.color}`}
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 shrink-0 rounded-[14px] border-[1.5px] border-line bg-paper-2 flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="h-display text-[22px] text-ink opacity-[0.12] select-none">
                    3D
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="t-eyebrow text-fog">{item.category}</span>

                <Link
                  to="/products/$slug"
                  params={{ slug: item.slug }}
                  className="h-display text-[17px] text-ink leading-tight hover:underline truncate"
                >
                  {item.name}
                </Link>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="chip">{item.material}</span>

                  {item.color && <span className="chip">{item.color}</span>}
                </div>
              </div>

              {/* QTY */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className="price text-[17px] text-ink">
                  {formatIDR(item.price * item.qty)}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant={'outline'}
                    size={'icon'}
                    className="rounded-full w-7 h-7"
                    onClick={() => handleDecrease(item)}
                  >
                    —
                  </Button>
                  <span className="t-mono text-[15px] w-5 text-center">
                    {item.qty}
                  </span>
                  <Button
                    variant={'outline'}
                    size={'icon'}
                    className="rounded-full w-7 h-7"
                    onClick={() => handleIncrease(item)}
                  >
                    +
                  </Button>
                </div>

                <button
                  onClick={() => handleRemove(item)}
                  className="text-fog hover:text-destructive transition-colors"
                  aria-label="Remove Item"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}

          <Link
            to="/products"
            className="flex items-center gap-2 t-eyebrow text-fog hover:text-ink transition-colors w-fit mt-2"
          >
            <ArrowLeft className="size-3" />
            Continue Shopping
          </Link>
        </motion.div>

        {/* Right - Order Summary */}
        <div className="card p-6 flex flex-col gap-4 lg:sticky lg:top-24">
        <h2 className="h-display text-[22px] text-ink">Order Summary</h2>
        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-[14px]">
            <span className="text-ink-2">Subtotal ({totalItems()} items)</span>
            <span className="t-mono text-ink">{formatIDR(totalPrice())}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-ink-2">Shipping</span>
            <span className="t-mono text-fog">Calculated at checkout</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between">
          <span className="t-eyebrow">Total</span>
          <span className="price text-[20px] text-ink">
            {formatIDR(totalPrice())}
          </span>
        </div>

        <Button className="btn btn-accent w-full h-12 text-[15px] mt-2">
          Checkout
          <ArrowRight className="size-4" />
        </Button>

        <p className="text-[12px] text-fog text-center">
          Prints shipped within 24h • Made in Indonesia
        </p>
        </div>
      </div>
    </motion.main>
  )
}
