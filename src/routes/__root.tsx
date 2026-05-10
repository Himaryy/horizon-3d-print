import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { Navbar } from '#/components/layouts/Navbar'
import { Footer } from '#/components/layouts/Footer'
import appCss from '../styles.css?url'

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Horizon 3D Print' },
      {
        name: 'description',
        content: '3D printed articulated toys, made in Indonesia.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
    scripts: [
      {
        type: 'module',
        src: 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
      <p className="font-display text-8xl font-black text-blue">404</p>
      <p className="text-fog">Page not found.</p>
    </main>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Navbar />
        {children}
        <Footer />
        <Suspense>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
