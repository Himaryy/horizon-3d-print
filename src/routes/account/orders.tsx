import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account/orders')({ component: OrdersPage })

function OrdersPage() {
  return <div className="p-8">My Orders — coming soon</div>
}
