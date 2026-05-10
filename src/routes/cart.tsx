import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cart')({ component: CartPage })

function CartPage() {
  return <div className="p-8">Cart — coming soon</div>
}
