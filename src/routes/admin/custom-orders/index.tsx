import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/custom-orders/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/custom-orders/"!</div>
}
