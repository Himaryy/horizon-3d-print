import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/about')({ component: AboutPage })

function AboutPage() {
  return <div className="p-8">About — coming soon</div>
}
