import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({ component: AuthLayout })

function AuthLayout() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-12">
      <Outlet />
    </main>
  )
}
