import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account/')({ component: AccountPage })

function AccountPage() {
  return <div className="p-8">Account — coming soon</div>
}
