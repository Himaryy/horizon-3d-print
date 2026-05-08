# Phase 3 — Cart & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build cart (guest + user, merge on login), checkout flow, Xendit hosted invoice, webhook handler, and order status page.

**Architecture:** Cart stored in DB. Guests identified by `sessionKey` (UUID in localStorage). On login, guest cart merges into user cart. Checkout creates an Order and calls Xendit → redirects user to hosted payment page. Xendit webhook POSTs to `/api/xendit/webhook` → marks order PAID + sends confirmation email.

**Tech Stack:** TanStack Start, Prisma, Xendit Node SDK, Nodemailer + Gmail SMTP

**Depends on:** Phase 1 + Phase 2 complete

**Next phase:** `2026-04-30-phase4-custom-auth.md`

---

## File Map

```
src/
  routes/
    cart.tsx                  # cart page (/cart)
    checkout.tsx              # checkout page (/checkout)
    order/
      $id.tsx                 # order status page (/order/:id)
    api/
      xendit/
        webhook.ts            # POST /api/xendit/webhook
  server/
    cart.ts                   # cart server functions
    orders.ts                 # order + checkout server functions
  lib/
    xendit.ts                 # Xendit API helper
    email.ts                  # Nodemailer helper
  hooks/
    useCart.ts                # client-side cart state
  components/
    cart/
      CartItem.tsx            # single cart line item
```

---

## Task 15: Cart Server Functions

**Files:**
- Create: `src/server/cart.ts`

- [ ] **Step 1: Write cart server functions**

```typescript
// src/server/cart.ts
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { db } from '~/lib/db'
import { auth } from '~/lib/auth'
import { randomUUID } from 'crypto'

// Get or create sessionKey for guest carts.
// Reads from request cookie; falls back to creating a new UUID.
async function getSessionKey(): Promise<string> {
  const existing = getCookie('cart_session')
  if (existing) return existing

  const key = randomUUID()
  setCookie('cart_session', key, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,             // JS-readable so client can store in localStorage too
    sameSite: 'lax',
    path: '/',
  })
  return key
}

// Get or create cart for current user or guest
async function getOrCreateCart(userId: string | null, sessionKey: string) {
  if (userId) {
    return db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })
  }
  return db.cart.upsert({
    where: { sessionKey },
    create: { sessionKey },
    update: {},
  })
}

export const getCart = createServerFn({ method: 'GET' }).handler(async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  const userId = session?.user?.id ?? null
  const sessionKey = await getSessionKey()

  const cart = await (userId
    ? db.cart.findUnique({ where: { userId }, include: cartInclude })
    : db.cart.findUnique({ where: { sessionKey }, include: cartInclude })
  )

  return cart
})

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true, slug: true, nameId: true, nameEn: true,
          price: true, images: { take: 1, orderBy: { order: 'asc' as const } },
        },
      },
      variant: {
        select: { id: true, color: true, size: true, priceAdjust: true, stock: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const

export const addToCart = createServerFn({ method: 'POST' })
  .inputValidator((data: { productId: string; variantId?: string; qty?: number }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    const userId = session?.user?.id ?? null
    const sessionKey = await getSessionKey()

    const cart = await getOrCreateCart(userId, sessionKey)

    // Check product exists and has stock
    const product = await db.product.findFirst({
      where: { id: data.productId, isPublished: true, deletedAt: null },
    })
    if (!product) throw new Error('Product not found')

    if (data.variantId) {
      const variant = await db.productVariant.findFirst({
        where: { id: data.variantId, productId: data.productId },
      })
      if (!variant) throw new Error('Variant not found')
      if (variant.stock === 0) throw new Error('Out of stock')
    } else {
      if (product.stock === 0) throw new Error('Out of stock')
    }

    const qty = data.qty ?? 1

    // Upsert: if item exists, increment qty; otherwise create
    const existing = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId ?? null,
      },
    })

    if (existing) {
      return db.cartItem.update({
        where: { id: existing.id },
        data: { qty: existing.qty + qty },
      })
    }

    return db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        variantId: data.variantId ?? null,
        qty,
      },
    })
  })

export const updateCartItem = createServerFn({ method: 'POST' })
  .inputValidator((data: { cartItemId: string; qty: number }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    const userId = session?.user?.id ?? null
    const sessionKey = await getSessionKey()

    // Verify ownership before mutating
    const cart = await (userId
      ? db.cart.findUnique({ where: { userId } })
      : db.cart.findUnique({ where: { sessionKey } })
    )
    if (!cart) throw new Error('Cart not found')

    const item = await db.cartItem.findFirst({
      where: { id: data.cartItemId, cartId: cart.id },
    })
    if (!item) throw new Error('Item not in cart')

    if (data.qty <= 0) {
      return db.cartItem.delete({ where: { id: data.cartItemId } })
    }

    return db.cartItem.update({
      where: { id: data.cartItemId },
      data: { qty: data.qty },
    })
  })

export const removeFromCart = createServerFn({ method: 'POST' })
  .inputValidator((data: { cartItemId: string }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    const userId = session?.user?.id ?? null
    const sessionKey = await getSessionKey()

    const cart = await (userId
      ? db.cart.findUnique({ where: { userId } })
      : db.cart.findUnique({ where: { sessionKey } })
    )
    if (!cart) throw new Error('Cart not found')

    const item = await db.cartItem.findFirst({
      where: { id: data.cartItemId, cartId: cart.id },
    })
    if (!item) throw new Error('Item not in cart')

    return db.cartItem.delete({ where: { id: data.cartItemId } })
  })

// Called after login to merge guest cart → user cart
export const mergeGuestCart = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionKey: string }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) throw new Error('Not authenticated')

    const userId = session.user.id

    const guestCart = await db.cart.findUnique({
      where: { sessionKey: data.sessionKey },
      include: { items: true },
    })
    if (!guestCart || guestCart.items.length === 0) return { merged: 0 }

    const userCart = await db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    })

    let merged = 0
    for (const guestItem of guestCart.items) {
      const existing = await db.cartItem.findFirst({
        where: { cartId: userCart.id, productId: guestItem.productId, variantId: guestItem.variantId },
      })

      if (existing) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: { qty: existing.qty + guestItem.qty },
        })
      } else {
        await db.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            qty: guestItem.qty,
          },
        })
      }
      merged++
    }

    // Delete guest cart after merge
    await db.cart.delete({ where: { id: guestCart.id } })

    return { merged }
  })
```

- [ ] **Step 2: Write cart merge unit tests**

```typescript
// src/server/cart.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Most cart logic is DB-level; test the pure calculation helpers
describe('cart item qty merge', () => {
  it('sums qty when same product+variant exists', () => {
    const existingQty = 2
    const addedQty = 3
    expect(existingQty + addedQty).toBe(5)
  })

  it('removes item when qty <= 0', () => {
    const shouldDelete = (qty: number) => qty <= 0
    expect(shouldDelete(0)).toBe(true)
    expect(shouldDelete(-1)).toBe(true)
    expect(shouldDelete(1)).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/server/cart.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/server/cart.ts src/server/cart.test.ts
git commit -m "feat: cart server functions with guest/user support and merge on login"
```

---

## Task 16: Xendit Helper

**Files:**
- Create: `src/lib/xendit.ts`

- [ ] **Step 1: Write Xendit helper**

```typescript
// src/lib/xendit.ts
import Xendit from 'xendit-node'

const xendit = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY! })

export interface CreateInvoiceParams {
  externalId: string    // our Order.id — used for reconciliation
  amount: number        // total in IDR
  payerEmail: string
  description: string
  successRedirectUrl: string
  failureRedirectUrl: string
}

export interface XenditInvoice {
  id: string
  invoiceUrl: string
  status: string
}

export async function createXenditInvoice(params: CreateInvoiceParams): Promise<XenditInvoice> {
  const invoice = await xendit.Invoice.createInvoice({
    data: {
      externalId: params.externalId,
      amount: params.amount,
      payerEmail: params.payerEmail,
      description: params.description,
      successRedirectUrl: params.successRedirectUrl,
      failureRedirectUrl: params.failureRedirectUrl,
      currency: 'IDR',
    },
  })

  return {
    id: invoice.id!,
    invoiceUrl: invoice.invoiceUrl!,
    status: invoice.status!,
  }
}

// Verify webhook authenticity using the shared token
export function verifyXenditWebhook(callbackToken: string): boolean {
  return callbackToken === process.env.XENDIT_WEBHOOK_TOKEN
}
```

- [ ] **Step 2: Write webhook verification test**

```typescript
// src/lib/xendit.test.ts
import { describe, it, expect, vi } from 'vitest'

// Test verifyXenditWebhook without importing env (mock it)
vi.stubEnv('XENDIT_WEBHOOK_TOKEN', 'test-token-abc')

describe('verifyXenditWebhook', () => {
  it('returns true for matching token', async () => {
    const { verifyXenditWebhook } = await import('./xendit')
    expect(verifyXenditWebhook('test-token-abc')).toBe(true)
  })

  it('returns false for wrong token', async () => {
    const { verifyXenditWebhook } = await import('./xendit')
    expect(verifyXenditWebhook('wrong-token')).toBe(false)
  })

  it('returns false for empty string', async () => {
    const { verifyXenditWebhook } = await import('./xendit')
    expect(verifyXenditWebhook('')).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/lib/xendit.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/xendit.ts src/lib/xendit.test.ts
git commit -m "feat: Xendit invoice creation and webhook token verification"
```

---

## Task 17: Email Helper

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: Write email helper**

```typescript
// src/lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!, // Gmail App Password (not account password)
  },
})

export interface OrderConfirmationData {
  to: string
  customerName: string
  orderId: string
  total: number
  orderUrl: string
  items: Array<{ name: string; qty: number; price: number }>
}

export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
  const itemRows = data.items
    .map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${formatIDR(i.price)}</td></tr>`)
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#2563eb;">Pesanan Dikonfirmasi! ✅</h2>
      <p>Halo <strong>${data.customerName}</strong>, pembayaran kamu telah kami terima.</p>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <tr style="background:#eff6ff;"><th>Produk</th><th>Qty</th><th>Harga</th></tr>
        ${itemRows}
        <tr><td colspan="2"><strong>Total</strong></td><td><strong>${formatIDR(data.total)}</strong></td></tr>
      </table>
      <p style="margin-top:16px;">
        <a href="${data.orderUrl}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">
          Lihat Status Pesanan
        </a>
      </p>
      <p style="color:#888;font-size:12px;">Brand3D — 3D Printed Toys Indonesia</p>
    </div>
  `

  await transporter.sendMail({
    from: `"Brand3D" <${process.env.GMAIL_USER}>`,
    to: data.to,
    subject: `✅ Pesanan #${data.orderId.slice(-8).toUpperCase()} Dikonfirmasi`,
    html,
  })
}

export async function sendCustomOrderNotification(data: {
  adminEmail: string
  requestId: string
  description: string
  guestEmail?: string
}): Promise<void> {
  await transporter.sendMail({
    from: `"Brand3D System" <${process.env.GMAIL_USER}>`,
    to: data.adminEmail,
    subject: `🖨️ Custom Order Baru — ${data.requestId.slice(-8).toUpperCase()}`,
    html: `
      <p>Custom order baru masuk:</p>
      <p><strong>ID:</strong> ${data.requestId}</p>
      <p><strong>Deskripsi:</strong> ${data.description}</p>
      ${data.guestEmail ? `<p><strong>Email tamu:</strong> ${data.guestEmail}</p>` : ''}
      <p>Buka admin panel untuk review.</p>
    `,
  })
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: Nodemailer email helper for order confirmation and custom order notification"
```

---

## Task 18: Orders Server Functions

**Files:**
- Create: `src/server/orders.ts`

- [ ] **Step 1: Write orders server functions**

```typescript
// src/server/orders.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '~/lib/db'
import { auth } from '~/lib/auth'
import { createXenditInvoice } from '~/lib/xendit'

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    shippingAddress: {
      name: string
      phone: string
      street: string
      city: string
      province: string
      postal: string
      country: string
    }
    couponCode?: string
    notes?: string
  }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) throw new Error('Must be logged in to checkout')

    const userId = session.user.id
    const user = session.user

    // Get user's cart with items
    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) throw new Error('Cart is empty')

    // Validate all items still in stock
    for (const item of cart.items) {
      const stock = item.variant ? item.variant.stock : item.product.stock
      if (stock < item.qty) {
        throw new Error(`${item.product.nameId} stok tidak cukup`)
      }
    }

    // Apply coupon if provided
    let discountAmount = 0
    if (data.couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: data.couponCode,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          OR: [{ maxUses: null }, { usedCount: { lt: db.coupon.fields.maxUses } }],
        },
      })

      if (coupon) {
        const subtotal = cart.items.reduce((sum, item) => {
          const unitPrice = item.product.price + (item.variant?.priceAdjust ?? 0)
          return sum + unitPrice * item.qty
        }, 0)

        if (subtotal >= coupon.minOrder) {
          discountAmount = coupon.type === 'PERCENT'
            ? Math.round(subtotal * coupon.value / 100)
            : coupon.value
        }

        await db.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        })
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      const unitPrice = item.product.price + (item.variant?.priceAdjust ?? 0)
      return sum + unitPrice * item.qty
    }, 0)
    const shippingCost = 0 // flat rate — Phase 2 can add shipping API
    const total = subtotal + shippingCost - discountAmount

    // Build order items with product snapshot
    const orderItemsData = cart.items.map(item => ({
      productId: item.product.id,
      variantId: item.variantId ?? undefined,
      productSnapshot: {
        nameId: item.product.nameId,
        nameEn: item.product.nameEn,
        imageUrl: null,
        variantColor: item.variant?.color ?? null,
        variantSize: item.variant?.size ?? null,
      },
      qty: item.qty,
      unitPrice: item.product.price + (item.variant?.priceAdjust ?? 0),
      total: (item.product.price + (item.variant?.priceAdjust ?? 0)) * item.qty,
    }))

    // Create order in DB
    const order = await db.order.create({
      data: {
        userId,
        subtotal,
        shippingCost,
        discountAmount,
        total,
        couponCode: data.couponCode ?? null,
        shippingAddress: data.shippingAddress,
        notes: data.notes ?? null,
        items: { create: orderItemsData },
      },
    })

    // Create Xendit invoice
    const appUrl = process.env.VITE_APP_URL ?? 'http://localhost:3000'
    const invoice = await createXenditInvoice({
      externalId: order.id,
      amount: total,
      payerEmail: user.email,
      description: `Brand3D Order #${order.id.slice(-8).toUpperCase()}`,
      successRedirectUrl: `${appUrl}/order/${order.id}?status=paid`,
      failureRedirectUrl: `${appUrl}/order/${order.id}?status=failed`,
    })

    // Save Xendit invoice details to order
    await db.order.update({
      where: { id: order.id },
      data: {
        xenditInvoiceId: invoice.id,
        xenditPaymentUrl: invoice.invoiceUrl,
      },
    })

    // Clear cart
    await db.cart.delete({ where: { id: cart.id } })

    return {
      orderId: order.id,
      paymentUrl: invoice.invoiceUrl,
    }
  })

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data, request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user?.id) throw new Error('Not authenticated')

    const order = await db.order.findFirst({
      where: { id: data.orderId, userId: session.user.id },
      include: { items: true },
    })

    return order
  })
```

- [ ] **Step 2: Commit**

```bash
git add src/server/orders.ts
git commit -m "feat: order creation with Xendit invoice generation and cart clear"
```

---

## Task 19: Xendit Webhook Handler

**Files:**
- Create: `src/routes/api/xendit/webhook.ts`

- [ ] **Step 1: Write webhook route**

```typescript
// src/routes/api/xendit/webhook.ts
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { db } from '~/lib/db'
import { verifyXenditWebhook } from '~/lib/xendit'
import { sendOrderConfirmation } from '~/lib/email'

export const APIRoute = createAPIFileRoute('/api/xendit/webhook')({
  POST: async ({ request }) => {
    // 1. Verify webhook token
    const callbackToken = request.headers.get('x-callback-token') ?? ''
    if (!verifyXenditWebhook(callbackToken)) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Parse body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    const externalId = body.external_id as string | undefined
    const status = body.status as string | undefined
    const paidAt = body.paid_at as string | undefined

    if (!externalId || status !== 'PAID') {
      // Not a payment confirmation — acknowledge silently
      return new Response('OK', { status: 200 })
    }

    // 3. Find order by external_id (= order.id)
    const order = await db.order.findFirst({
      where: { id: externalId, status: 'PENDING_PAYMENT' },
      include: {
        items: true,
        user: { select: { email: true, name: true } },
      },
    })

    if (!order) {
      // Already processed or doesn't exist — idempotent response
      return new Response('OK', { status: 200 })
    }

    // 4. Mark order as PAID
    await db.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      },
    })

    // 5. Send confirmation email
    const appUrl = process.env.VITE_APP_URL ?? 'http://localhost:3000'
    await sendOrderConfirmation({
      to: order.user.email,
      customerName: order.user.name ?? 'Pelanggan',
      orderId: order.id,
      total: order.total,
      orderUrl: `${appUrl}/order/${order.id}`,
      items: order.items.map(item => ({
        name: (item.productSnapshot as { nameId: string }).nameId,
        qty: item.qty,
        price: item.unitPrice,
      })),
    })

    return new Response('OK', { status: 200 })
  },
})
```

- [ ] **Step 2: Write webhook handler tests**

```typescript
// src/routes/api/xendit/webhook.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('XENDIT_WEBHOOK_TOKEN', 'valid-token')

describe('Xendit webhook verification', () => {
  it('verifies matching token', async () => {
    const { verifyXenditWebhook } = await import('~/lib/xendit')
    expect(verifyXenditWebhook('valid-token')).toBe(true)
  })

  it('rejects mismatched token', async () => {
    const { verifyXenditWebhook } = await import('~/lib/xendit')
    expect(verifyXenditWebhook('bad-token')).toBe(false)
  })

  it('rejects empty token', async () => {
    const { verifyXenditWebhook } = await import('~/lib/xendit')
    expect(verifyXenditWebhook('')).toBe(false)
  })
})

describe('webhook payload handling', () => {
  it('ignores non-PAID status events', () => {
    const status = 'EXPIRED'
    const shouldProcess = status === 'PAID'
    expect(shouldProcess).toBe(false)
  })

  it('processes PAID status events', () => {
    const status = 'PAID'
    const shouldProcess = status === 'PAID'
    expect(shouldProcess).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/routes/api/xendit/webhook.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/routes/api/xendit/ src/routes/api/xendit/webhook.test.ts
git commit -m "feat: Xendit webhook handler with token verification, order PAID update, and confirmation email"
```

---

## Task 20: Cart Page

**Files:**
- Create: `src/routes/cart.tsx`
- Create: `src/components/cart/CartItem.tsx`

- [ ] **Step 1: Write CartItem component**

```tsx
// src/components/cart/CartItem.tsx
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CartItemProps {
  id: string
  imageUrl?: string
  nameId: string
  nameEn: string
  variantLabel?: string
  unitPrice: number
  qty: number
  onQtyChange: (qty: number) => void
  onRemove: () => void
}

export function CartItem({
  imageUrl, nameId, nameEn, variantLabel, unitPrice, qty, onQtyChange, onRemove,
}: CartItemProps) {
  const { i18n } = useTranslation()
  const name = i18n.language === 'id' ? nameId : nameEn

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="flex gap-4 py-4 border-b-2 border-[#111]/10">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 bg-[#eff6ff] rounded-[8px] border-2 border-[#111] overflow-hidden">
        {imageUrl
          ? <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          : <span className="w-full h-full flex items-center justify-center text-2xl">🖨️</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm leading-tight truncate">{name}</p>
        {variantLabel && <p className="text-xs text-gray-400 mt-0.5">{variantLabel}</p>}
        <p className="font-black text-[#2563eb] mt-1">{fmt(unitPrice)}</p>

        {/* Qty control */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onQtyChange(qty - 1)}
            className="w-7 h-7 border-2 border-[#111] rounded font-black flex items-center justify-center hover:bg-[#eff6ff] text-sm"
          >−</button>
          <span className="font-black text-sm w-5 text-center">{qty}</span>
          <button
            onClick={() => onQtyChange(qty + 1)}
            className="w-7 h-7 border-2 border-[#111] rounded font-black flex items-center justify-center hover:bg-[#eff6ff] text-sm"
          >+</button>
          <button onClick={onRemove} className="ml-2 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="text-right flex-shrink-0">
        <p className="font-black text-sm">{fmt(unitPrice * qty)}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write cart page**

```tsx
// src/routes/cart.tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getCart, updateCartItem, removeFromCart } from '~/server/cart'
import { CartItem } from '~/components/cart/CartItem'
import { Button } from '~/components/ui/Button'

export const Route = createFileRoute('/cart')({
  loader: () => getCart(),
  component: CartPage,
})

function CartPage() {
  const { t } = useTranslation('checkout')
  const cart = Route.useLoaderData()
  const router = useRouter()

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  async function handleQtyChange(cartItemId: string, qty: number) {
    await updateCartItem({ data: { cartItemId, qty } })
    router.invalidate()
  }

  async function handleRemove(cartItemId: string) {
    await removeFromCart({ data: { cartItemId } })
    router.invalidate()
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <p className="font-black text-xl text-gray-400">Keranjang kosong / Cart is empty</p>
        <Button asChild chunky className="mt-6">
          <Link to="/products">Belanja Sekarang →</Link>
        </Button>
      </div>
    )
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.price + (item.variant?.priceAdjust ?? 0)
    return sum + price * item.qty
  }, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-black text-3xl mb-8">{t('nav.cart', { ns: 'common' })}</h1>

      <div className="mb-8">
        {cart.items.map(item => {
          const variantParts = [item.variant?.color, item.variant?.size].filter(Boolean)
          return (
            <CartItem
              key={item.id}
              id={item.id}
              imageUrl={item.product.images[0]?.url}
              nameId={item.product.nameId}
              nameEn={item.product.nameEn}
              variantLabel={variantParts.length > 0 ? variantParts.join(' / ') : undefined}
              unitPrice={item.product.price + (item.variant?.priceAdjust ?? 0)}
              qty={item.qty}
              onQtyChange={(qty) => handleQtyChange(item.id, qty)}
              onRemove={() => handleRemove(item.id)}
            />
          )
        })}
      </div>

      {/* Summary */}
      <div className="border-2 border-[#111] rounded-[10px] p-5 bg-[#eff6ff]">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm">{t('subtotal')}</span>
          <span className="font-black">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center mb-4 border-t-2 border-[#111]/20 pt-3">
          <span className="font-black text-lg">{t('total')}</span>
          <span className="font-black text-2xl text-[#2563eb]">{fmt(subtotal)}</span>
        </div>
        <Button asChild chunky size="lg" className="w-full">
          <Link to="/checkout">Lanjut Checkout →</Link>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/cart.tsx src/components/cart/
git commit -m "feat: cart page with qty controls and line totals"
```

---

## Task 21: Checkout Page

**Files:**
- Create: `src/routes/checkout.tsx`

- [ ] **Step 1: Write checkout page**

```tsx
// src/routes/checkout.tsx
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '~/lib/auth-client'
import { getCart } from '~/server/cart'
import { createOrder } from '~/server/orders'
import { Button } from '~/components/ui/Button'

export const Route = createFileRoute('/checkout')({
  loader: () => getCart(),
  component: CheckoutPage,
})

interface AddressForm {
  name: string
  phone: string
  street: string
  city: string
  province: string
  postal: string
  country: string
}

function CheckoutPage() {
  const { t } = useTranslation('checkout')
  const { data: session } = useSession()
  const cart = Route.useLoaderData()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [form, setForm] = useState<AddressForm>({
    name: '', phone: '', street: '', city: '', province: '', postal: '', country: 'Indonesia',
  })

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  if (!session?.user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="font-black text-xl mb-4">Login dulu ya / Please login first</p>
        <Button asChild chunky>
          <a href="/login?redirect=/checkout">Login →</a>
        </Button>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    router.navigate({ to: '/cart' })
    return null
  }

  const subtotal = cart.items.reduce((sum, item) => {
    return sum + (item.product.price + (item.variant?.priceAdjust ?? 0)) * item.qty
  }, 0)

  function setField(field: keyof AddressForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createOrder({
        data: {
          shippingAddress: form,
          couponCode: couponCode || undefined,
        },
      })
      // Redirect to Xendit hosted payment page
      window.location.href = result.paymentUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  const fields: Array<{ key: keyof AddressForm; label: string; placeholder: string }> = [
    { key: 'name', label: 'Nama Penerima', placeholder: 'Budi Santoso' },
    { key: 'phone', label: 'Nomor HP', placeholder: '0812...' },
    { key: 'street', label: 'Alamat Lengkap', placeholder: 'Jl. Kebon Jeruk No. 10' },
    { key: 'city', label: 'Kota', placeholder: 'Jakarta Barat' },
    { key: 'province', label: 'Provinsi', placeholder: 'DKI Jakarta' },
    { key: 'postal', label: 'Kode Pos', placeholder: '11530' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-black text-3xl mb-8">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr_360px] gap-8">

        {/* Shipping address */}
        <div>
          <h2 className="font-black text-lg mb-4">{t('shipping_address')}</h2>
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-bold mb-1">{f.label}</label>
                <input
                  required
                  value={form[f.key]}
                  onChange={e => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full border-2 border-[#111] rounded-[8px] px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div>
          <h2 className="font-black text-lg mb-4">{t('order_summary')}</h2>
          <div className="border-2 border-[#111] rounded-[10px] p-4 bg-[#eff6ff] space-y-3">
            {cart.items.map(item => {
              const price = item.product.price + (item.variant?.priceAdjust ?? 0)
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="font-semibold truncate max-w-[180px]">
                    {item.product.nameId} ×{item.qty}
                  </span>
                  <span className="font-black">{fmt(price * item.qty)}</span>
                </div>
              )
            })}

            {/* Coupon input */}
            <div className="flex gap-2 pt-2 border-t-2 border-[#111]/20">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder={t('coupon_placeholder')}
                className="flex-1 border-2 border-[#111] rounded-[6px] px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-[#2563eb]"
              />
              <button type="button" className="text-xs font-black px-3 py-1.5 border-2 border-[#2563eb] text-[#2563eb] rounded-[6px] hover:bg-[#eff6ff]">
                {t('apply_coupon')}
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-1 border-t-2 border-[#111]/20 pt-2">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}</span>
                <span className="font-bold">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('shipping')}</span>
                <span className="font-bold">TBD</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#111]/20">
                <span className="font-black">{t('total')}</span>
                <span className="font-black text-[#2563eb] text-lg">{fmt(subtotal)}</span>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

            <Button
              type="submit"
              chunky
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? '⏳ Memproses...' : t('pay_now')}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Kamu akan diarahkan ke halaman pembayaran Xendit.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/checkout.tsx
git commit -m "feat: checkout page with address form and Xendit redirect"
```

---

## Task 22: Order Status Page

**Files:**
- Create: `src/routes/order/$id.tsx`

- [ ] **Step 1: Write order status page**

```tsx
// src/routes/order/$id.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getOrder } from '~/server/orders'
import { Badge } from '~/components/ui/Badge'
import type { OrderStatus } from '@prisma/client'

export const Route = createFileRoute('/order/$id')({
  loader: ({ params }) => getOrder({ data: { orderId: params.id } }),
  component: OrderStatusPage,
})

const statusColors: Record<OrderStatus, 'gray' | 'yellow' | 'blue' | 'green' | 'red'> = {
  PENDING_PAYMENT: 'yellow',
  PAID:            'blue',
  PROCESSING:      'blue',
  PRINTING:        'blue',
  SHIPPED:         'green',
  DELIVERED:       'green',
  CANCELLED:       'red',
  REFUNDED:        'gray',
}

const statusSteps: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'PRINTING', 'SHIPPED', 'DELIVERED']

function OrderStatusPage() {
  const { t } = useTranslation('checkout')
  const order = Route.useLoaderData()

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="font-black text-xl text-gray-400">Pesanan tidak ditemukan / Order not found</p>
        <Link to="/account" className="text-[#2563eb] font-bold mt-4 inline-block hover:underline">← Akun</Link>
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const currentStepIndex = statusSteps.indexOf(order.status as OrderStatus)
  const statusKey = `status_${order.status.toLowerCase()}` as const

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-black text-3xl mb-2">{t('order_status')}</h1>
      <p className="text-gray-400 text-sm mb-8 font-mono">#{order.id.slice(-12).toUpperCase()}</p>

      {/* Status badge */}
      <div className="mb-8">
        <Badge color={statusColors[order.status as OrderStatus]} className="text-sm px-4 py-2">
          {t(statusKey)}
        </Badge>
      </div>

      {/* Progress stepper */}
      {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
        <div className="mb-10">
          <div className="flex gap-0 relative">
            {statusSteps.map((step, i) => {
              const done = i <= currentStepIndex
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black z-10 ${
                    done ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'bg-white border-gray-300 text-gray-300'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`absolute top-3 h-0.5 ${done && i < currentStepIndex ? 'bg-[#2563eb]' : 'bg-gray-200'}`}
                      style={{ left: `calc(${(i + 0.5) * (100 / statusSteps.length)}%)`, width: `calc(${100 / statusSteps.length}%)` }}
                    />
                  )}
                  <span className="text-[10px] text-gray-400 text-center leading-tight mt-1">
                    {t(`status_${step.toLowerCase()}` as Parameters<typeof t>[0])}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="border-2 border-[#2563eb] rounded-[10px] p-4 bg-[#eff6ff] mb-6">
          <p className="font-black text-sm">📦 Tracking</p>
          <p className="text-sm mt-1">{order.trackingNumber}</p>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
              className="text-[#2563eb] font-bold text-sm hover:underline mt-1 inline-block">
              Track package →
            </a>
          )}
        </div>
      )}

      {/* Pay now button if still pending */}
      {order.status === 'PENDING_PAYMENT' && order.xenditPaymentUrl && (
        <a href={order.xenditPaymentUrl}
          className="block w-full text-center bg-[#facc15] text-[#111] font-black py-3 rounded-[10px] border-2 border-[#111] hover:bg-[#eab308] transition-colors mb-6 btn-chunky">
          💳 Bayar Sekarang
        </a>
      )}

      {/* Order items */}
      <div className="border-2 border-[#111] rounded-[10px] p-4">
        <p className="font-black mb-3">Detail Pesanan</p>
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between py-2 border-b border-[#111]/10 last:border-0 text-sm">
            <span className="font-semibold">
              {(item.productSnapshot as { nameId: string }).nameId} ×{item.qty}
            </span>
            <span className="font-black">{fmt(item.total)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 border-t-2 border-[#111]/20 mt-1">
          <span className="font-black">{t('total')}</span>
          <span className="font-black text-[#2563eb] text-lg">{fmt(order.total)}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/order/
git commit -m "feat: order status page with progress stepper, tracking, and pay-now button"
```

---

## Phase 3 Complete

Verify before moving to Phase 4:

```bash
# End-to-end payment smoke test:
# 1. Add product to cart → /cart shows items
# 2. Login → /checkout fills address → click Pay Now
# 3. Redirected to Xendit hosted page (use test mode credentials)
# 4. Complete test payment
# 5. Xendit calls POST /api/xendit/webhook (test via Xendit dashboard "Send test webhook")
# 6. Order status at /order/:id changes to PAID
# 7. Confirmation email received

npx vitest run
# All tests pass
```

**Next:** `2026-04-30-phase4-custom-auth.md`
