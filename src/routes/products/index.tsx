import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/')({ component: ProductsPage })

function ProductsPage() {
  return <main className="mx-auto max-w-360 px-8 pt-8 pb-24"></main>
}
