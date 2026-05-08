# Phase 2 — Layout + Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build root layout, navbar, base UI components, product server functions, home page, product catalog, and product detail page with 3D model viewer.

**Architecture:** All data fetching via `createServerFn` called from route `loader`. Components are client components where interactivity needed, server-rendered otherwise. `@google/model-viewer` loaded as web component via CDN script tag in root.

**Tech Stack:** TanStack Start, TanStack Router, Prisma, react-i18next, Tailwind v4, `@google/model-viewer`

**Depends on:** Phase 1 complete (DB migrated, Better Auth running, i18n set up)

**Next phase:** `2026-04-30-phase3-cart-checkout.md`

---

## File Map

```
src/
  routes/
    __root.tsx              # root layout: html shell, providers, scripts
    index.tsx               # home page (/)
    products/
      index.tsx             # product catalog (/products)
      $slug.tsx             # product detail (/products/:slug)
  components/
    layout/
      Navbar.tsx            # top nav: logo, links, lang toggle, cart icon
      Footer.tsx            # simple footer
    products/
      ProductCard.tsx       # single product card (tilted, bold border)
      ProductGrid.tsx       # responsive grid of ProductCard
      ModelViewer.tsx       # @google/model-viewer web component wrapper
    ui/
      Button.tsx            # primary/secondary/ghost variants
      Badge.tsx             # small label chip
      Card.tsx              # styled container with bold border
  server/
    products.ts             # server functions: getFeatured, getProducts, getProductBySlug
```

---

## Task 7: Root Layout

**Files:**
- Create: `src/routes/__root.tsx`

- [ ] **Step 1: Write root layout**

```tsx
// src/routes/__root.tsx
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Navbar } from '~/components/layout/Navbar'
import { Footer } from '~/components/layout/Footer'
import '~/styles/globals.css'
import '~/i18n' // initialize i18next

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Brand3D — 3D Printed Toys Indonesia' },
      { name: 'description', content: 'Articulated 3D printed figures and custom prints made in Indonesia.' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap',
      },
    ],
    scripts: [
      // @google/model-viewer — loaded via CDN as a web component
      {
        type: 'module',
        src: 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js',
      },
    ],
  }),
  component: RootLayout,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-black">404</h1>
      <p className="text-gray-500">Halaman tidak ditemukan / Page not found</p>
      <a href="/" className="text-[#2563eb] font-bold underline">← Kembali ke Home</a>
    </div>
  ),
})

function RootLayout() {
  return (
    <RootDocument>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="bg-white text-[#111111] font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify dev server renders without errors**

```bash
pnpm dev
```

Open `http://localhost:3000` — should render without console errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "feat: root layout with model-viewer CDN, i18n init, Tailwind"
```

---

## Task 8: Navbar Component

**Files:**
- Create: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Write Navbar**

```tsx
// src/components/layout/Navbar.tsx
import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '~/i18n'

export function Navbar() {
  const { t } = useTranslation('common')

  function toggleLang() {
    const next = i18n.language === 'id' ? 'en' : 'id'
    i18n.changeLanguage(next)
    // i18next-browser-languagedetector writes to cookie automatically
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#2563eb] shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="font-black text-xl italic text-white">
          Brand<span className="text-[#facc15]">3D!</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/products"
            className="text-white/80 hover:text-white text-sm font-semibold transition-colors"
            activeProps={{ className: 'text-white underline underline-offset-4' }}
          >
            {t('nav.products')}
          </Link>
          <Link
            to="/custom"
            className="text-white/80 hover:text-white text-sm font-semibold transition-colors"
            activeProps={{ className: 'text-white underline underline-offset-4' }}
          >
            {t('nav.custom')}
          </Link>
          <Link
            to="/about"
            className="text-white/80 hover:text-white text-sm font-semibold transition-colors"
            activeProps={{ className: 'text-white underline underline-offset-4' }}
          >
            {t('nav.about')}
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="text-white/80 hover:text-white text-xs font-bold border border-white/30 px-2 py-1 rounded transition-colors"
            aria-label="Toggle language"
          >
            {t('lang_toggle')}
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            className="bg-[#facc15] text-[#111] rounded-full px-3 py-1.5 flex items-center gap-1.5 font-black text-sm hover:bg-[#eab308] transition-colors"
          >
            <ShoppingCart size={16} />
            {t('nav.cart')}
          </Link>

          {/* Auth */}
          <Link
            to="/login"
            className="text-white/80 hover:text-white text-sm font-semibold transition-colors"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create Footer**

```tsx
// src/components/layout/Footer.tsx
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation('common')

  return (
    <footer className="bg-[#111111] text-white mt-16 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="font-black text-xl italic">Brand<span className="text-[#facc15]">3D!</span></span>
          <p className="text-white/50 text-sm mt-1">{t('footer.tagline')}</p>
        </div>
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} Brand3D. {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: Navbar and Footer components with i18n and lang toggle"
```

---

## Task 9: Base UI Components

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Card.tsx`

- [ ] **Step 1: Write Button component**

```tsx
// src/components/ui/Button.tsx
import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  chunky?: boolean  // apply toy-shop tilt effect on hover
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[#2563eb] text-white hover:bg-[#1d4ed8]',
  secondary: 'bg-white text-[#111] border-2 border-[#111] hover:bg-[#eff6ff]',
  ghost:     'bg-transparent text-[#2563eb] hover:bg-[#eff6ff]',
  accent:    'bg-[#facc15] text-[#111] hover:bg-[#eab308]',
}

const sizeStyles: Record<Size, string> = {
  sm:  'px-3 py-1.5 text-xs',
  md:  'px-5 py-2.5 text-sm',
  lg:  'px-7 py-3.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  chunky = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-black rounded-lg transition-all inline-flex items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        chunky && 'btn-chunky',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Write Badge component**

```tsx
// src/components/ui/Badge.tsx
import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

type Color = 'blue' | 'yellow' | 'green' | 'gray' | 'red'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: Color
}

const colorStyles: Record<Color, string> = {
  blue:   'bg-[#dbeafe] text-[#1e40af]',
  yellow: 'bg-[#fef9c3] text-[#713f12]',
  green:  'bg-[#dcfce7] text-[#14532d]',
  gray:   'bg-[#f3f4f6] text-[#374151]',
  red:    'bg-[#fee2e2] text-[#991b1b]',
}

export function Badge({ color = 'blue', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block px-2 py-0.5 rounded text-xs font-black tracking-wide uppercase',
        colorStyles[color],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 3: Write Card component**

```tsx
// src/components/ui/Card.tsx
import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

type Tilt = 'none' | 'left' | 'right'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tilt?: Tilt
}

const tiltStyles: Record<Tilt, string> = {
  none:  '',
  left:  'card-tilt-left',
  right: 'card-tilt-right',
}

export function Card({ tilt = 'none', className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white border-2 border-[#111] rounded-[10px] overflow-hidden',
        tiltStyles[tilt],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: base UI components (Button, Badge, Card) with toy-shop style"
```

---

## Task 10: Product Server Functions

**Files:**
- Create: `src/server/products.ts`

- [ ] **Step 1: Write product server functions**

```typescript
// src/server/products.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '~/lib/db'

// Fields selected for list views (skip heavy text fields)
const productListSelect = {
  id: true,
  slug: true,
  nameId: true,
  nameEn: true,
  price: true,
  stock: true,
  category: true,
  isFeatured: true,
  modelUrl: true,
  videoUrl: true,
  tokopediaUrl: true,
  shopeeUrl: true,
  images: {
    select: { url: true, alt: true, order: true },
    orderBy: { order: 'asc' as const },
    take: 1, // only first image for list views
  },
} as const

export const getFeaturedProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    return db.product.findMany({
      where: { isFeatured: true, isPublished: true, deletedAt: null },
      select: productListSelect,
      orderBy: { createdAt: 'desc' },
      take: 6,
    })
  },
)

export const getProducts = createServerFn({ method: 'GET' })
  .inputValidator((data: { category?: 'READY_MADE' | 'CUSTOM_BASE' }) => data)
  .handler(async ({ data }) => {
    return db.product.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        ...(data.category ? { category: data.category } : {}),
      },
      select: productListSelect,
      orderBy: { createdAt: 'desc' },
    })
  })

export const getProductBySlug = createServerFn({ method: 'GET' })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const product = await db.product.findFirst({
      where: { slug: data.slug, isPublished: true, deletedAt: null },
      include: {
        images: { orderBy: { order: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
        reviews: {
          where: { isVisible: true },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    return product
  })
```

- [ ] **Step 2: Write smoke test (requires DB connection)**

```typescript
// src/server/products.test.ts
import { describe, it, expect, vi } from 'vitest'

// Mock db to avoid real DB connection in unit test
vi.mock('~/lib/db', () => ({
  db: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}))

describe('product server functions', () => {
  it('getFeaturedProducts returns array', async () => {
    const { db } = await import('~/lib/db')
    const result = await (db.product.findMany as ReturnType<typeof vi.fn>)()
    expect(Array.isArray(result)).toBe(true)
  })
})
```

- [ ] **Step 3: Run test**

```bash
npx vitest run src/server/products.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/server/products.ts src/server/products.test.ts
git commit -m "feat: product server functions (featured, catalog, detail)"
```

---

## Task 11: ProductCard Component

**Files:**
- Create: `src/components/products/ProductCard.tsx`
- Create: `src/components/products/ProductGrid.tsx`

- [ ] **Step 1: Write ProductCard**

```tsx
// src/components/products/ProductCard.tsx
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card } from '~/components/ui/Card'
import { Badge } from '~/components/ui/Badge'
import type { ProductCategory } from '@prisma/client'

interface ProductCardProps {
  slug: string
  nameId: string
  nameEn: string
  price: number
  stock: number
  category: ProductCategory
  imageUrl?: string
  imageAlt?: string
  tilt?: 'left' | 'right' | 'none'
  onAddToCart?: () => void
}

export function ProductCard({
  slug,
  nameId,
  nameEn,
  price,
  stock,
  category,
  imageUrl,
  imageAlt,
  tilt = 'none',
  onAddToCart,
}: ProductCardProps) {
  const { t, i18n } = useTranslation('products')
  const name = i18n.language === 'id' ? nameId : nameEn
  const outOfStock = stock === 0

  return (
    <Card tilt={tilt} className="group hover:shadow-[4px_4px_0_#111] transition-shadow">
      <Link to="/products/$slug" params={{ slug }}>
        {/* Product image */}
        <div className="bg-[#eff6ff] h-44 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt ?? name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-5xl">🖨️</span>
          )}
        </div>
      </Link>

      <div className="p-3">
        {/* Category badge */}
        <Badge color={category === 'READY_MADE' ? 'blue' : 'yellow'} className="mb-2">
          {category === 'READY_MADE' ? t('filter_ready') : t('filter_custom')}
        </Badge>

        {/* Name */}
        <Link to="/products/$slug" params={{ slug }}>
          <h3 className="font-black text-sm leading-tight hover:text-[#2563eb] transition-colors">
            {name}
          </h3>
        </Link>

        {/* Price + Add to cart */}
        <div className="flex items-center justify-between mt-3">
          <span className="font-black text-[#2563eb] text-base">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)}
          </span>

          {outOfStock ? (
            <span className="text-xs text-gray-400 font-semibold">{t('out_of_stock')}</span>
          ) : (
            <button
              onClick={onAddToCart}
              className="bg-[#facc15] text-[#111] text-xs font-black px-2.5 py-1.5 rounded hover:bg-[#eab308] transition-colors"
            >
              {t('add_to_cart')}
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Write ProductGrid**

```tsx
// src/components/products/ProductGrid.tsx
import { ProductCard } from './ProductCard'

type TiltPattern = 'left' | 'right' | 'none'

// Alternates left/right tilt for toy shop feel
function getTilt(index: number): TiltPattern {
  return index % 2 === 0 ? 'left' : 'right'
}

interface Product {
  id: string
  slug: string
  nameId: string
  nameEn: string
  price: number
  stock: number
  category: 'READY_MADE' | 'CUSTOM_BASE'
  images: Array<{ url: string; alt: string; order: number }>
}

interface ProductGridProps {
  products: Product[]
  onAddToCart?: (productId: string) => void
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <span className="text-4xl block mb-3">📦</span>
        <p className="font-semibold">Belum ada produk / No products yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          slug={product.slug}
          nameId={product.nameId}
          nameEn={product.nameEn}
          price={product.price}
          stock={product.stock}
          category={product.category}
          imageUrl={product.images[0]?.url}
          imageAlt={product.images[0]?.alt}
          tilt={getTilt(i)}
          onAddToCart={() => onAddToCart?.(product.id)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/products/
git commit -m "feat: ProductCard and ProductGrid components"
```

---

## Task 12: Home Page

**Files:**
- Create: `src/routes/index.tsx`

- [ ] **Step 1: Write home page route**

```tsx
// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getFeaturedProducts } from '~/server/products'
import { ProductGrid } from '~/components/products/ProductGrid'
import { Button } from '~/components/ui/Button'

export const Route = createFileRoute('/')({
  loader: () => getFeaturedProducts(),
  component: HomePage,
})

function HomePage() {
  const { t } = useTranslation('common')
  const products = Route.useLoaderData()

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#eff6ff] border-b-[3px] border-[#2563eb] px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-black tracking-[3px] text-[#2563eb] mb-4">
            {t('hero.badge')}
          </p>
          <h1 className="font-black text-5xl md:text-7xl leading-[1.05] text-[#111] mb-6">
            {t('hero.heading_1')}<br />
            <span className="text-[#2563eb]">{t('hero.heading_2')}</span><br />
            <span className="bg-[#facc15] px-2">{t('hero.heading_3')}</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-md mb-8">
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button asChild chunky size="lg">
              <Link to="/products">{t('hero.cta_shop')}</Link>
            </Button>
            <Button variant="secondary" asChild chunky size="lg">
              <Link to="/custom">{t('hero.cta_custom')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-black text-xs tracking-[3px] text-gray-400 uppercase">
            {t('featured', { ns: 'products' })}
          </h2>
          <Link to="/products" className="text-[#2563eb] font-bold text-sm hover:underline">
            Lihat Semua / View All →
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>

      {/* Custom order CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="border-2 border-dashed border-[#2563eb] rounded-[10px] p-8 text-center bg-[#eff6ff]">
          <p className="text-3xl mb-3">✏️</p>
          <h2 className="font-black text-2xl text-[#2563eb] mb-2">
            {t('lang_toggle') === 'EN' ? 'Desain milikmu sendiri!' : 'Design your own!'}
          </h2>
          <p className="text-gray-500 mb-6">
            {t('lang_toggle') === 'EN'
              ? 'Ceritakan idemu → kami yang cetak'
              : 'Describe your idea → we print it'}
          </p>
          <Button asChild chunky variant="primary">
            <Link to="/custom">Custom Order →</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
```

Note: `Button` needs `asChild` support (like Radix's asChild). Add it to Button.tsx:

```tsx
// Add to src/components/ui/Button.tsx — replace component with Slot support
import { Slot } from '@radix-ui/react-slot'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  chunky?: boolean
  asChild?: boolean  // renders children as the root element
}

export function Button({ asChild = false, variant = 'primary', size = 'md', chunky = false, className, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={clsx(
        'font-black rounded-lg transition-all inline-flex items-center justify-center gap-2',
        variantStyles[variant],
        sizeStyles[size],
        chunky && 'btn-chunky',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}
```

Install Radix Slot:

```bash
pnpm add @radix-ui/react-slot
```

- [ ] **Step 2: Verify home page renders**

```bash
pnpm dev
```

Open `http://localhost:3000` — should show hero + empty featured grid (no products seeded yet).

- [ ] **Step 3: Seed one test product**

```bash
npx prisma studio
```

Or run seed script — create product manually to verify cards render.

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.tsx src/components/ui/Button.tsx
git commit -m "feat: home page with hero section and featured products"
```

---

## Task 13: Product Catalog Page

**Files:**
- Create: `src/routes/products/index.tsx`

- [ ] **Step 1: Write catalog page**

```tsx
// src/routes/products/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getProducts } from '~/server/products'
import { ProductGrid } from '~/components/products/ProductGrid'
import type { ProductCategory } from '@prisma/client'

export const Route = createFileRoute('/products/')({
  loader: () => getProducts({ data: {} }),
  component: ProductsPage,
})

type Filter = 'ALL' | ProductCategory

function ProductsPage() {
  const { t } = useTranslation('products')
  const allProducts = Route.useLoaderData()
  const [filter, setFilter] = useState<Filter>('ALL')

  const filtered = filter === 'ALL'
    ? allProducts
    : allProducts.filter(p => p.category === filter)

  const filters: Array<{ value: Filter; label: string }> = [
    { value: 'ALL', label: t('filter_all') },
    { value: 'READY_MADE', label: t('filter_ready') },
    { value: 'CUSTOM_BASE', label: t('filter_custom') },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-black text-4xl mb-8">{t('catalog_title')}</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-black border-2 border-[#111] transition-all ${
              filter === f.value
                ? 'bg-[#2563eb] text-white border-[#2563eb]'
                : 'bg-white text-[#111] hover:bg-[#eff6ff]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ProductGrid products={filtered} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/products/index.tsx
git commit -m "feat: product catalog page with category filter"
```

---

## Task 14: ModelViewer Component + Product Detail Page

**Files:**
- Create: `src/components/products/ModelViewer.tsx`
- Create: `src/routes/products/$slug.tsx`

- [ ] **Step 1: Write ModelViewer web component wrapper**

```tsx
// src/components/products/ModelViewer.tsx

// Declare global type for the @google/model-viewer web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string
        alt?: string
        'auto-rotate'?: boolean | ''
        'camera-controls'?: boolean | ''
        'shadow-intensity'?: string
        poster?: string
        loading?: 'auto' | 'lazy' | 'eager'
        style?: React.CSSProperties
        class?: string
      }, HTMLElement>
    }
  }
}

interface ModelViewerProps {
  src: string     // Cloudinary .glb URL
  alt: string
  poster?: string // preview image shown while model loads
}

export function ModelViewer({ src, alt, poster }: ModelViewerProps) {
  return (
    <div className="w-full aspect-square bg-[#eff6ff] rounded-[10px] overflow-hidden border-2 border-[#111]">
      <model-viewer
        src={src}
        alt={alt}
        poster={poster}
        auto-rotate=""
        camera-controls=""
        shadow-intensity="1"
        loading="lazy"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Write product detail page**

```tsx
// src/routes/products/$slug.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getProductBySlug } from '~/server/products'
import { ModelViewer } from '~/components/products/ModelViewer'
import { Button } from '~/components/ui/Button'
import { Badge } from '~/components/ui/Badge'
import { ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/products/$slug')({
  loader: ({ params }) => getProductBySlug({ data: { slug: params.slug } }),
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { t, i18n } = useTranslation('products')
  const product = Route.useLoaderData()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [show3D, setShow3D] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product?.variants[0]?.id ?? null,
  )

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl font-black text-gray-400">Produk tidak ditemukan / Product not found</p>
        <Link to="/products" className="text-[#2563eb] font-bold mt-4 inline-block hover:underline">← Kembali</Link>
      </div>
    )
  }

  const lang = i18n.language === 'id' ? 'id' : 'en'
  const name = lang === 'id' ? product.nameId : product.nameEn
  const desc = lang === 'id' ? product.descId : product.descEn

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId)
  const finalPrice = product.price + (selectedVariant?.priceAdjust ?? 0)
  const finalStock = selectedVariant?.stock ?? product.stock

  const activeImage = product.images[activeImageIndex]

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">

        {/* Left: images + 3D viewer */}
        <div className="space-y-4">
          {/* Toggle: image vs 3D */}
          {product.modelUrl && (
            <div className="flex gap-2">
              <button
                onClick={() => setShow3D(false)}
                className={`text-xs font-black px-3 py-1 rounded border-2 border-[#111] transition-all ${!show3D ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#111]'}`}
              >
                📸 Foto
              </button>
              <button
                onClick={() => setShow3D(true)}
                className={`text-xs font-black px-3 py-1 rounded border-2 border-[#111] transition-all ${show3D ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#111]'}`}
              >
                {t('view_3d')}
              </button>
            </div>
          )}

          {/* Main display */}
          {show3D && product.modelUrl ? (
            <ModelViewer src={product.modelUrl} alt={name} poster={activeImage?.url} />
          ) : (
            <div className="aspect-square bg-[#eff6ff] rounded-[10px] border-2 border-[#111] overflow-hidden">
              {activeImage ? (
                <img src={activeImage.url} alt={activeImage.alt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🖨️</div>
              )}
            </div>
          )}

          {/* Thumbnail row */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden transition-all ${
                    i === activeImageIndex ? 'border-[#2563eb]' : 'border-[#111]/30'
                  }`}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video demo */}
          {product.videoUrl && (
            <video
              src={product.videoUrl}
              controls
              className="w-full rounded-[10px] border-2 border-[#111]"
            />
          )}
        </div>

        {/* Right: info */}
        <div className="space-y-5">
          <Badge color={product.category === 'READY_MADE' ? 'blue' : 'yellow'}>
            {product.category === 'READY_MADE' ? t('filter_ready') : t('filter_custom')}
          </Badge>

          <h1 className="font-black text-3xl md:text-4xl leading-tight">{name}</h1>

          <p className="font-black text-3xl text-[#2563eb]">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(finalPrice)}
          </p>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div>
              <p className="font-black text-sm mb-2">{t('variants')}</p>
              <div className="flex gap-2 flex-wrap">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-3 py-1.5 text-xs font-black rounded border-2 border-[#111] transition-all ${
                      selectedVariantId === v.id
                        ? 'bg-[#2563eb] text-white border-[#2563eb]'
                        : v.stock === 0 ? 'bg-gray-100 text-gray-400 line-through' : 'bg-white hover:bg-[#eff6ff]'
                    }`}
                    disabled={v.stock === 0}
                  >
                    {[v.color, v.size].filter(Boolean).join(' / ')}
                    {v.priceAdjust > 0 && ` +${new Intl.NumberFormat('id-ID').format(v.priceAdjust)}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          <p className="text-sm text-gray-500">
            {t('stock')}: <span className={finalStock > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
              {finalStock > 0 ? finalStock : t('out_of_stock')}
            </span>
          </p>

          {/* Add to cart */}
          <Button
            chunky
            size="lg"
            className="w-full"
            disabled={finalStock === 0}
          >
            {finalStock === 0 ? t('out_of_stock') : t('add_to_cart')}
          </Button>

          {/* Marketplace links */}
          <div className="flex gap-3 flex-wrap">
            {product.tokopediaUrl && (
              <a href={product.tokopediaUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                {t('buy_tokopedia')} <ExternalLink size={12} />
              </a>
            )}
            {product.shopeeUrl && (
              <a href={product.shopeeUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                {t('buy_shopee')} <ExternalLink size={12} />
              </a>
            )}
          </div>

          {/* Description */}
          <div className="pt-4 border-t-2 border-[#111]/10">
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{desc}</p>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      {product.reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="font-black text-2xl mb-6">⭐ Reviews</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {product.reviews.map(review => (
              <div key={review.id} className="border-2 border-[#111]/10 rounded-[10px] p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center font-black text-sm text-[#2563eb]">
                    {review.user.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-black text-sm">{review.user.name ?? 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{'⭐'.repeat(review.rating)}</p>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Test product detail with seeded product**

```bash
pnpm dev
```

Navigate to `/products/<your-slug>` — verify:
- Images render
- Variant buttons work (change price/stock)
- 3D viewer toggle appears when `modelUrl` is set
- Tokopedia/Shopee links appear when URLs set

- [ ] **Step 4: Commit**

```bash
git add src/components/products/ModelViewer.tsx src/routes/products/\$slug.tsx
git commit -m "feat: product detail page with 3D model viewer, variants, and marketplace links"
```

---

## Phase 2 Complete

Verify before moving to Phase 3:

- `http://localhost:3000` — home page loads with featured products grid
- `http://localhost:3000/products` — catalog page with filter tabs
- `http://localhost:3000/products/<slug>` — detail page with image, 3D toggle, variant selector
- Lang toggle in navbar switches ID ↔ EN text
- No TypeScript errors: `npx tsc --noEmit`

**Next:** `2026-04-30-phase3-cart-checkout.md`
