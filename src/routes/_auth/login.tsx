import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/login')({ component: LoginPage })

function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-[10px] border-2 border-press bg-surface p-8">
      <h1 className="text-2xl">Sign In</h1>
      <p className="mt-1 text-sm text-fog">Login page — coming soon</p>
    </div>
  )
}
