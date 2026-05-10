import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$slug')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/products/$slug"!</div>
}
