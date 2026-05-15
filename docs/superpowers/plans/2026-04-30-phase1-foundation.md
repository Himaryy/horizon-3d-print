# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap TanStack Start project with Prisma schema, Better Auth, Tailwind v4, and i18n — everything needed before any UI can be built.

**Architecture:** TanStack Start monolith. Routes in `src/routes/`. Server functions via `createServerFn`. API-only routes via `createAPIFileRoute`. Prisma client singleton shared across server functions.

**Tech Stack:** TanStack Start, TanStack Router, Prisma 6, Neon (dev DB), Better Auth, Tailwind v4, i18next + react-i18next

**Depends on:** nothing — start here

**Next phase:** `2026-04-30-phase2-layout-products.md`

---

## File Map

```
src/
  routes/
    api/
      auth/
        $.ts            # Better Auth catch-all handler
  lib/
    db.ts               # Prisma client singleton
    auth.ts             # Better Auth server config
    auth-client.ts      # Better Auth client (browser)
  styles/
    globals.css         # Tailwind v4 base + design tokens
  locales/
    id/
      common.json
      products.json
      checkout.json
      chatbot.json
    en/
      common.json
      products.json
      checkout.json
      chatbot.json
  i18n.ts               # i18next config (shared client/server)
prisma/
  schema.prisma         # full data model
app.config.ts           # TanStack Start / Vinxi config
.env.example
```

---

## Task 1: Scaffold TanStack Start Project

**Files:**

- Create: `app.config.ts`
- Create: `src/router.tsx`
- Create: `src/client.tsx`
- Create: `src/ssr.tsx`
- Create: `tsconfig.json`
- Create: `package.json`

- [ ] **Step 1: Scaffold via CLI**

```bash
pnpm create tanstack-app@latest . --template react-start
```

Expected output: project files created, `pnpm install` runs automatically.

- [ ] **Step 2: Install all project dependencies**

```bash
pnpm add @prisma/client better-auth \
  i18next react-i18next i18next-browser-languagedetector \
  @anthropic-ai/sdk cloudinary xendit-node \
  nodemailer lucide-react clsx

pnpm add -D prisma @types/nodemailer vitest @vitejs/plugin-react
```

- [ ] **Step 3: Verify dev server starts**

```bash
pnpm dev
```

Expected: `http://localhost:3000` responds with TanStack Start default page.

- [ ] **Step 4: Create `.env.example`**

```bash
# App
VITE_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=change-me-32-chars-minimum
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Xendit
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=

# Gmail SMTP
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Anthropic
ANTHROPIC_API_KEY=
```

Copy to `.env` and fill real values.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold TanStack Start project with all dependencies"
```

---

## Task 2: Prisma Schema

**Files:**

- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Replace generated schema with full data model**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Better Auth (auto-managed, do not rename fields) ───────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false) // true after email confirmation click
  name          String?
  image         String?   // profile photo URL
  role          String    @default("user") // "user" | "admin"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      Session[]
  accounts      Account[]
  addresses     UserAddress[]
  orders        Order[]
  reviews       Review[]
  cart          Cart?
  chatSessions  ChatSession[]
  customOrders  CustomOrderRequest[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique // session token stored in cookie
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String  @id @default(cuid())
  userId                String
  accountId             String  // provider's user ID
  providerId            String  // "google" | "credential"
  accessToken           String? @db.Text
  refreshToken          String? @db.Text
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String? @db.Text
  password              String? // hashed, only for email/password accounts
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
}

model Verification {
  id         String   @id @default(cuid())
  identifier String   // email address
  value      String   // one-time token
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─── Products ────────────────────────────────────────────────────────────────

enum ProductCategory {
  READY_MADE    // pre-built catalog item, ships from stock
  CUSTOM_BASE   // base model that supports customization
}

model Product {
  id           String          @id @default(cuid())
  slug         String          @unique // URL-friendly ID, e.g. "robot-figure-v2"
  nameId       String          // product name in Indonesian
  nameEn       String          // product name in English
  descId       String          @db.Text // full description in Indonesian
  descEn       String          @db.Text // full description in English
  price        Int             // base price in IDR (smallest catalog price)
  stock        Int             @default(0) // total stock across all variants
  category     ProductCategory
  isPublished  Boolean         @default(false) // false = draft, not shown on site
  isFeatured   Boolean         @default(false) // shown in homepage featured section
  modelUrl     String?         // Cloudinary URL for .glb 3D model file
  videoUrl     String?         // Cloudinary URL for demo video
  tokopediaUrl String?         // external link to Tokopedia listing
  shopeeUrl    String?         // external link to Shopee listing
  deletedAt    DateTime?       // soft delete — null = active
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  images       ProductImage[]
  variants     ProductVariant[]
  orderItems   OrderItem[]
  cartItems    CartItem[]
  reviews      Review[]
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  url       String  // Cloudinary image URL
  alt       String  // alt text for accessibility
  order     Int     // display order, lower = first
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model ProductVariant {
  id           String  @id @default(cuid())
  productId    String
  color        String? // e.g. "Red", "Blue"
  size         String? // e.g. "Small", "Large"
  priceAdjust  Int     @default(0) // added to product.price, can be negative
  stock        Int     @default(0)
  sku          String  @unique // unique stock-keeping unit
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  product      Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems    CartItem[]
  orderItems   OrderItem[]
}

// ─── Orders ──────────────────────────────────────────────────────────────────

enum OrderStatus {
  PENDING_PAYMENT // invoice created, waiting for Xendit webhook
  PAID            // webhook received, payment confirmed
  PROCESSING      // team acknowledged, preparing to print
  PRINTING        // 3D printing in progress
  SHIPPED         // handed to courier, tracking number added
  DELIVERED       // courier confirmed delivery
  CANCELLED       // cancelled before payment or by team
  REFUNDED        // payment returned to customer
}

model Order {
  id                String      @id @default(cuid())
  userId            String
  status            OrderStatus @default(PENDING_PAYMENT)
  subtotal          Int         // sum of all item totals in IDR
  shippingCost      Int         @default(0)
  discountAmount    Int         @default(0) // from coupon
  total             Int         // subtotal + shippingCost - discountAmount
  couponCode        String?     // code used, nullable
  xenditInvoiceId   String?     @unique // Xendit invoice ID for reconciliation
  xenditPaymentUrl  String?     // hosted payment page URL sent to customer
  paidAt            DateTime?   // timestamp from Xendit webhook
  shippingAddress   Json        // snapshot of address at order time
  trackingNumber    String?     // courier tracking number
  trackingUrl       String?     // courier tracking page URL
  notes             String?     @db.Text // customer notes
  adminNotes        String?     @db.Text // internal team notes
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user              User        @relation(fields: [userId], references: [id])
  items             OrderItem[]
}

model OrderItem {
  id              String   @id @default(cuid())
  orderId         String
  productId       String
  variantId       String?  // null if no variant selected
  productSnapshot Json     // full product+variant data at time of purchase
  qty             Int
  unitPrice       Int      // price per unit at time of purchase in IDR
  total           Int      // unitPrice * qty
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product         Product        @relation(fields: [productId], references: [id])
  variant         ProductVariant? @relation(fields: [variantId], references: [id])
}

// ─── Custom Orders ───────────────────────────────────────────────────────────

enum CustomOrderStatus {
  NEW           // just submitted, team not yet seen it
  UNDER_REVIEW  // team is evaluating feasibility
  QUOTED        // team sent a price quote, waiting for customer
  ACCEPTED      // customer accepted quote, moving to production
  IN_PRODUCTION // printing in progress
  COMPLETED     // delivered to customer
  REJECTED      // team cannot fulfill (too complex, out of scope)
  CANCELLED     // customer or team cancelled
}

model CustomOrderRequest {
  id          String            @id @default(cuid())
  userId      String?           // null if submitted as guest
  guestEmail  String?           // required when userId is null
  guestName   String?
  description String            @db.Text // customer's idea description
  refImages   String[]          // Cloudinary URLs of reference images
  size        String?           // e.g. "15cm", "palm-sized"
  colorNote   String?           // color preferences
  budgetMin   Int?              // minimum acceptable budget in IDR
  budgetMax   Int?              // maximum acceptable budget in IDR
  status      CustomOrderStatus @default(NEW)
  quotedPrice Int?              // team's quoted price in IDR
  adminNotes  String?           @db.Text
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User?             @relation(fields: [userId], references: [id])
}

// ─── Cart ────────────────────────────────────────────────────────────────────

model Cart {
  id         String     @id @default(cuid())
  userId     String?    @unique // null for guest carts
  sessionKey String?    @unique // localStorage fingerprint for guests
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  user       User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items      CartItem[]
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  variantId String?  // null if product has no variants
  qty       Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product         @relation(fields: [productId], references: [id])
  variant   ProductVariant? @relation(fields: [variantId], references: [id])

  @@unique([cartId, productId, variantId]) // one row per product+variant combo
}

// ─── Chatbot ─────────────────────────────────────────────────────────────────

enum ChatRole {
  USER
  ASSISTANT
}

model ChatSession {
  id         String        @id @default(cuid())
  userId     String?       // null for anonymous sessions
  sessionKey String        @unique // anon browser fingerprint (always set)
  escalated  Boolean       @default(false) // true = team must follow up
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  user       User?         @relation(fields: [userId], references: [id])
  messages   ChatMessage[]
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  role      ChatRole
  content   String      @db.Text
  createdAt DateTime    @default(now())

  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

// ─── Supporting ──────────────────────────────────────────────────────────────

model UserAddress {
  id        String   @id @default(cuid())
  userId    String
  label     String   // e.g. "Home", "Office"
  isDefault Boolean  @default(false)
  name      String   // recipient name
  phone     String
  street    String
  city      String
  province  String
  postal    String
  country   String   @default("Indonesia")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Review {
  id        String   @id @default(cuid())
  productId String
  userId    String
  orderId   String   // must have purchased product to leave review
  rating    Int      // 1-5 stars
  comment   String?  @db.Text
  images    String[] // Cloudinary URLs of review photos
  isVisible Boolean  @default(true) // false = hidden by admin
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  product   Product  @relation(fields: [productId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

enum CouponType {
  PERCENT // discount as percentage of subtotal
  FIXED   // fixed IDR amount off
}

model Coupon {
  id        String     @id @default(cuid())
  code      String     @unique
  type      CouponType
  value     Int        // percentage (0-100) or fixed IDR amount
  minOrder  Int        @default(0) // minimum subtotal to apply coupon
  maxUses   Int?       // null = unlimited
  usedCount Int        @default(0)
  expiresAt DateTime?  // null = never expires
  isActive  Boolean    @default(true)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: `prisma/migrations/..._init/migration.sql` created, tables created in Neon DB.

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `node_modules/@prisma/client` updated.

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: full Prisma schema with all models and inline comments"
```

---

## Task 3: Prisma Client Singleton

**Files:**

- Create: `src/lib/db.ts`

- [ ] **Step 1: Write singleton**

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

// Prevent multiple PrismaClient instances in dev (hot reload creates new modules)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 2: Write smoke test**

```typescript
// src/lib/db.test.ts
import { describe, it, expect } from 'vitest'
import { db } from './db'

describe('db singleton', () => {
  it('returns same instance on repeated import', async () => {
    const { db: db2 } = await import('./db')
    expect(db).toBe(db2)
  })
})
```

- [ ] **Step 3: Run test**

```bash
npx vitest run src/lib/db.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/lib/db.test.ts
git commit -m "feat: Prisma client singleton"
```

---

## Task 4: Better Auth Setup

**Files:**

- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/routes/api/auth/$.ts`

- [ ] **Step 1: Write server auth config**

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from './db'

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // simplify for v1
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
    updateAge: 60 * 60 * 24, // refresh session daily
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
```

- [ ] **Step 2: Write client auth config**

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_APP_URL ?? 'http://localhost:3000',
})

export const { signIn, signOut, signUp, useSession, getSession } = authClient
```

- [ ] **Step 3: Create Better Auth catch-all API route**

```typescript
// src/routes/api/auth/$.ts
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { auth } from '~/lib/auth'

export const APIRoute = createAPIFileRoute('/api/auth/$')({
  GET: ({ request }) => auth.handler(request),
  POST: ({ request }) => auth.handler(request),
})
```

- [ ] **Step 4: Test auth endpoint responds**

```bash
curl -s http://localhost:3000/api/auth/get-session
```

Expected: `{"session":null,"user":null}` (no active session)

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-client.ts src/routes/api/auth/
git commit -m "feat: Better Auth setup with email/password and Google OAuth"
```

---

## Task 5: Tailwind v4 + Design Tokens

**Files:**

- Modify: `app.config.ts`
- Create: `src/styles/globals.css`

- [ ] **Step 1: Install Tailwind v4**

```bash
pnpm add tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Add Tailwind plugin to app.config.ts**

```typescript
// app.config.ts
import { defineConfig } from '@tanstack/react-start/config'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  vite: {
    plugins: [tsConfigPaths({ projects: ['./tsconfig.json'] }), tailwindcss()],
  },
})
```

- [ ] **Step 3: Write global CSS with design tokens**

```css
/* src/styles/globals.css */
@import 'tailwindcss';

@theme {
  /* Brand palette — Palette B: Blue + Yellow */
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #3b82f6;
  --color-accent: #facc15;
  --color-accent-dark: #eab308;

  /* Backgrounds */
  --color-bg: #ffffff;
  --color-bg-blue: #eff6ff;
  --color-bg-dark: #0a0a1a;

  /* Text */
  --color-text: #111111;
  --color-text-muted: #6b7280;

  /* Card style — toy shop energy */
  --card-border: 2px solid #111111;
  --card-radius: 10px;
}

/* Card tilt utility — applied alternately on product grids */
.card-tilt-left {
  transform: rotate(-1deg);
}
.card-tilt-right {
  transform: rotate(0.8deg);
}

/* Chunky button base */
.btn-chunky {
  font-weight: 900;
  border: 2px solid #111111;
  border-radius: 8px;
  transition:
    transform 0.1s,
    box-shadow 0.1s;
}
.btn-chunky:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 #111111;
}
.btn-chunky:active {
  transform: translate(0, 0);
  box-shadow: none;
}
```

- [ ] **Step 4: Import globals in root route (placeholder — root route built in Phase 2)**

Note: import will be added in `src/routes/__root.tsx` in Phase 2:

```typescript
import '~/styles/globals.css'
```

- [ ] **Step 5: Commit**

```bash
git add app.config.ts src/styles/globals.css
git commit -m "feat: Tailwind v4 with brand design tokens and card styles"
```

---

## Task 6: i18n Setup

**Files:**

- Create: `src/i18n.ts`
- Create: `src/locales/id/common.json`
- Create: `src/locales/id/products.json`
- Create: `src/locales/id/checkout.json`
- Create: `src/locales/id/chatbot.json`
- Create: `src/locales/en/common.json`
- Create: `src/locales/en/products.json`
- Create: `src/locales/en/checkout.json`
- Create: `src/locales/en/chatbot.json`

- [ ] **Step 1: Write i18n config**

```typescript
// src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Static imports for SSR compatibility (no HTTP backend needed)
import idCommon from './locales/id/common.json'
import idProducts from './locales/id/products.json'
import idCheckout from './locales/id/checkout.json'
import idChatbot from './locales/id/chatbot.json'
import enCommon from './locales/en/common.json'
import enProducts from './locales/en/products.json'
import enCheckout from './locales/en/checkout.json'
import enChatbot from './locales/en/chatbot.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: {
        common: idCommon,
        products: idProducts,
        checkout: idCheckout,
        chatbot: idChatbot,
      },
      en: {
        common: enCommon,
        products: enProducts,
        checkout: enCheckout,
        chatbot: enChatbot,
      },
    },
    fallbackLng: 'id', // default Indonesian
    defaultNS: 'common',
    detection: {
      order: ['cookie', 'navigator'],
      caches: ['cookie'],
      cookieMinutes: 525600, // 1 year
      cookieSameSite: 'strict',
    },
    interpolation: {
      escapeValue: false, // React handles XSS
    },
  })

export default i18n
```

- [ ] **Step 2: Write Indonesian common translations**

```json
// src/locales/id/common.json
{
  "nav": {
    "products": "Produk",
    "custom": "Custom Order",
    "about": "Tentang Kami",
    "cart": "Keranjang",
    "login": "Masuk",
    "register": "Daftar",
    "account": "Akun",
    "logout": "Keluar"
  },
  "hero": {
    "badge": "🖨️ DICETAK 3D DI INDONESIA",
    "heading_1": "Dicetak.",
    "heading_2": "Bisa Digerakkan.",
    "heading_3": "Milikmu.",
    "subtitle": "Figur artikulasi, cetakan custom & lainnya. Mainkan apa yang kamu punya.",
    "cta_shop": "Belanja Sekarang →",
    "cta_custom": "Custom Order"
  },
  "footer": {
    "tagline": "Mainan 3D printed terbaik di Indonesia.",
    "rights": "Semua hak dilindungi."
  },
  "lang_toggle": "EN",
  "loading": "Memuat...",
  "error": "Terjadi kesalahan.",
  "not_found": "Halaman tidak ditemukan."
}
```

- [ ] **Step 3: Write English common translations**

```json
// src/locales/en/common.json
{
  "nav": {
    "products": "Products",
    "custom": "Custom Order",
    "about": "About",
    "cart": "Cart",
    "login": "Login",
    "register": "Sign Up",
    "account": "Account",
    "logout": "Logout"
  },
  "hero": {
    "badge": "🖨️ 3D PRINTED IN INDONESIA",
    "heading_1": "Printed.",
    "heading_2": "Poseable.",
    "heading_3": "Yours.",
    "subtitle": "Articulated figures, custom prints & more. Play with what you own.",
    "cta_shop": "Shop Now →",
    "cta_custom": "Custom Order"
  },
  "footer": {
    "tagline": "Indonesia's best 3D printed toys.",
    "rights": "All rights reserved."
  },
  "lang_toggle": "ID",
  "loading": "Loading...",
  "error": "Something went wrong.",
  "not_found": "Page not found."
}
```

- [ ] **Step 4: Write Indonesian product translations**

```json
// src/locales/id/products.json
{
  "catalog_title": "Katalog Produk",
  "filter_all": "Semua",
  "filter_ready": "Siap Kirim",
  "filter_custom": "Bisa Custom",
  "featured": "PRODUK UNGGULAN",
  "add_to_cart": "+ Keranjang",
  "buy_tokopedia": "Beli di Tokopedia ↗",
  "buy_shopee": "Beli di Shopee ↗",
  "stock": "Stok",
  "out_of_stock": "Habis",
  "variants": "Pilih Varian",
  "view_3d": "Lihat Model 3D",
  "price_from": "Mulai dari"
}
```

- [ ] **Step 5: Write English product translations**

```json
// src/locales/en/products.json
{
  "catalog_title": "Product Catalog",
  "filter_all": "All",
  "filter_ready": "Ready Made",
  "filter_custom": "Custom Base",
  "featured": "FEATURED PRODUCTS",
  "add_to_cart": "+ Cart",
  "buy_tokopedia": "Buy on Tokopedia ↗",
  "buy_shopee": "Buy on Shopee ↗",
  "stock": "Stock",
  "out_of_stock": "Out of stock",
  "variants": "Choose Variant",
  "view_3d": "View 3D Model",
  "price_from": "From"
}
```

- [ ] **Step 6: Write checkout translations (both languages)**

```json
// src/locales/id/checkout.json
{
  "title": "Checkout",
  "shipping_address": "Alamat Pengiriman",
  "order_summary": "Ringkasan Pesanan",
  "subtotal": "Subtotal",
  "shipping": "Ongkos Kirim",
  "discount": "Diskon",
  "total": "Total",
  "pay_now": "Bayar Sekarang",
  "coupon_placeholder": "Kode kupon",
  "apply_coupon": "Pakai",
  "order_status": "Status Pesanan",
  "status_pending": "Menunggu Pembayaran",
  "status_paid": "Lunas",
  "status_processing": "Diproses",
  "status_printing": "Sedang Dicetak",
  "status_shipped": "Dikirim",
  "status_delivered": "Terkirim",
  "status_cancelled": "Dibatalkan",
  "status_refunded": "Dikembalikan"
}
```

```json
// src/locales/en/checkout.json
{
  "title": "Checkout",
  "shipping_address": "Shipping Address",
  "order_summary": "Order Summary",
  "subtotal": "Subtotal",
  "shipping": "Shipping",
  "discount": "Discount",
  "total": "Total",
  "pay_now": "Pay Now",
  "coupon_placeholder": "Coupon code",
  "apply_coupon": "Apply",
  "order_status": "Order Status",
  "status_pending": "Pending Payment",
  "status_paid": "Paid",
  "status_processing": "Processing",
  "status_printing": "Printing",
  "status_shipped": "Shipped",
  "status_delivered": "Delivered",
  "status_cancelled": "Cancelled",
  "status_refunded": "Refunded"
}
```

- [ ] **Step 7: Write chatbot translations (both languages)**

```json
// src/locales/id/chatbot.json
{
  "placeholder": "Tanya sesuatu...",
  "send": "Kirim",
  "title": "Tanya AI Kami",
  "greeting": "Halo! Saya asisten AI. Bisa bantu kamu cari produk, cek status pesanan, atau menjawab pertanyaan.",
  "escalated": "Saya terhubungkan kamu ke tim kami. WhatsApp: {whatsapp} atau Email: {email}",
  "thinking": "Sedang berpikir..."
}
```

```json
// src/locales/en/chatbot.json
{
  "placeholder": "Ask something...",
  "send": "Send",
  "title": "Ask Our AI",
  "greeting": "Hi! I'm an AI assistant. I can help you find products, check order status, or answer questions.",
  "escalated": "I'm connecting you to our team. WhatsApp: {whatsapp} or Email: {email}",
  "thinking": "Thinking..."
}
```

- [ ] **Step 8: Write i18n unit test**

```typescript
// src/i18n.test.ts
import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(async () => {
  // Load i18n (triggers init)
  await import('./i18n')
})

describe('i18n', () => {
  it('has Indonesian nav keys', async () => {
    const i18n = (await import('./i18n')).default
    expect(i18n.t('nav.products', { lng: 'id' })).toBe('Produk')
  })

  it('has English nav keys', async () => {
    const i18n = (await import('./i18n')).default
    expect(i18n.t('nav.products', { lng: 'en' })).toBe('Products')
  })

  it('falls back to id for unknown language', async () => {
    const i18n = (await import('./i18n')).default
    expect(i18n.t('nav.products', { lng: 'fr' })).toBe('Produk')
  })
})
```

- [ ] **Step 9: Run tests**

```bash
npx vitest run src/i18n.test.ts
```

Expected: 3 PASS

- [ ] **Step 10: Commit**

```bash
git add src/i18n.ts src/locales/ src/i18n.test.ts
git commit -m "feat: i18n setup with Indonesian/English locale files"
```

---

## Phase 1 Complete

All foundation pieces in place. Verify before moving to Phase 2:

```bash
# DB connected
npx prisma db pull  # should show all tables

# Better Auth responding
curl http://localhost:3000/api/auth/get-session
# → {"session":null,"user":null}

# All tests passing
npx vitest run src/lib/db.test.ts src/i18n.test.ts
```

**Next:** `2026-04-30-phase2-layout-products.md`
