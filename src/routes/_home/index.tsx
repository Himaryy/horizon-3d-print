import { createFileRoute } from '@tanstack/react-router'
import { Hero } from '#/components/layouts/Hero'
import { HowItWorks } from '#/components/layouts/HowItsWorks'
import { Materials } from '#/components/layouts/Materials'
import { FeatureProduct } from '#/components/layouts/Feature'
import { Reviews } from '#/components/layouts/Reviews'
import { CTA } from '#/components/layouts/CTA'

export const Route = createFileRoute('/_home/')({ component: HomePage })

function HomePage() {
  return (
    <main className="flex flex-col gap-16 sm:gap-20 lg:gap-30">
      <Hero />
      <HowItWorks />
      <Materials />
      <FeatureProduct />
      <Reviews />
      <CTA />
    </main>
  )
}
