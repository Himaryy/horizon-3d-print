import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/custom')({ component: CustomPage })

function CustomPage() {
  return <div className="p-8">Custom Order — coming soon</div>
}
