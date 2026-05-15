# Marketing + E-Commerce Website — Design Spec

**Date:** 2026-04-30
**Sub-project:** Phase 1 — Marketing site + e-commerce (buy on website)
**Team:** 2 people
**Status:** Approved

---

## 1. Overview

Website for a 3D printing startup selling playful, articulated physical products (poseable figures, transformable toys, mechanical gadgets). Two product types: ready-made catalog and custom-order (customer describes idea, team prints it).

Website goals:

- Showcase products with video + interactive 3D model viewer
- Allow direct purchase via website
- Provide links to Tokopedia/Shopee listings per product
- Handle custom order requests
- Offer AI chatbot for product Q&A with escalation to human
- Support bilingual content (Indonesian + English)

---

## 2. Tech Stack

| Concern   | Tool                    | Notes                                         |
| --------- | ----------------------- | --------------------------------------------- |
| Framework | TanStack Start          | SSR + server functions, file-based routing    |
| ORM       | Prisma                  | With inline field comments on all models      |
| DB (dev)  | Neon                    | Free tier PostgreSQL, serverless              |
| DB (prod) | PostgreSQL on VPS       | Same server as app, pg_dump cron for backups  |
| Storage   | Cloudinary              | Free tier — images, videos, `.glb` 3D models  |
| Auth      | Better Auth             | Session-based, email/password + Google OAuth  |
| Payment   | Xendit                  | Hosted invoice flow, webhook for confirmation |
| i18n      | i18next + react-i18next | ID/EN toggle, stored in cookie                |
| Chatbot   | Claude Haiku API        | Agent with tools, prompt caching              |
| Email     | Nodemailer + Gmail SMTP | Order confirmation, forgot password           |
| Deploy    | VPS                     | Decided later                                 |

---

## 3. Visual Design

**Style:** Bold & Creative (Hybrid) — clean structure with playful moments. Not SaaS. Toy shop energy.

**Mode:** Light mode primary, dark mode supported.

**Color palette:**

- Primary: Blue `#2563eb`
- Accent: Yellow `#facc15`
- Background: White `#ffffff` / Light blue `#eff6ff`
- Text: Near-black `#111111`
- Borders: Bold `2px solid #111111` on cards (slightly tilted for personality)

**Typography:** Heavy/black weight headings (900), clean body text.

**Card style:** Slight rotation (`rotate(-1deg)` / `rotate(0.8deg)`), bold borders, chunky buttons — toy shop not dashboard.

**Brand name:** TBD — placeholder used during development.

---

## 4. Pages & Routes

### Public

| Route             | Page            | Key Content                                                                                                                        |
| ----------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/`               | Home            | Hero video, featured products, CTA to shop                                                                                         |
| `/products`       | Product Catalog | Grid, filter by category (ready-made / custom-base)                                                                                |
| `/products/:slug` | Product Detail  | 3D model viewer (`@google/model-viewer`, `.glb` from Cloudinary), video demo, price, add to cart, variants, Tokopedia/Shopee links |
| `/custom`         | Custom Order    | Form: describe idea, upload reference image, size/color/budget, submit to team                                                     |
| `/cart`           | Cart            | Items, qty, total, checkout CTA                                                                                                    |
| `/checkout`       | Checkout        | Shipping address, Xendit payment                                                                                                   |
| `/order/:id`      | Order Status    | Payment status, order progress tracking                                                                                            |
| `/about`          | About           | Startup story, team, mission                                                                                                       |

### Auth

| Route       | Page                              |
| ----------- | --------------------------------- |
| `/login`    | Email + password or Google OAuth  |
| `/register` | Create account                    |
| `/account`  | Order history, profile, addresses |

Forgot password handled natively by Better Auth (email reset link via Verification table).

### System

| Route                      | Purpose                             |
| -------------------------- | ----------------------------------- |
| `POST /api/xendit/webhook` | Xendit payment confirmation webhook |

### AI Chatbot

Floating widget (bottom-right), present on all pages. Not a dedicated route.

---

## 5. Data Model (Prisma)

All models include `createdAt`, `updatedAt`. Inline comments on every field in final schema.

### Auth (Better Auth auto-generated)

- `User` — id, email, emailVerified, name, image, role, createdAt, updatedAt
- `Session` — token, expiresAt, ipAddress, userAgent
- `Account` — OAuth provider accounts
- `Verification` — email verify tokens + forgot password reset tokens

### Products

```
Product         — slug, nameId, nameEn, descId, descEn, price (IDR), stock,
                  category (READY_MADE|CUSTOM_BASE), isPublished, isFeatured,
                  modelUrl (Cloudinary .glb), videoUrl, tokopediaUrl, shopeeUrl,
                  deletedAt (soft delete)
ProductImage    — productId, url, alt, order
ProductVariant  — productId, color, size, priceAdjust, stock, sku (unique)
```

### Orders

```
Order           — userId, status (PENDING_PAYMENT|PAID|PROCESSING|PRINTING|
                  SHIPPED|DELIVERED|CANCELLED|REFUNDED), subtotal, shippingCost,
                  discountAmount, total, couponCode, xenditInvoiceId, xenditPaymentUrl,
                  paidAt, shippingAddress (JSON snapshot), trackingNumber,
                  trackingUrl, notes, adminNotes
OrderItem       — orderId, productId, variantId, productSnapshot (JSON), qty,
                  unitPrice, total
```

### Custom Orders

```
CustomOrderRequest — userId (nullable), guestEmail, guestName, description,
                     refImages (String[]), size, colorNote, budgetMin, budgetMax,
                     status (NEW|UNDER_REVIEW|QUOTED|ACCEPTED|IN_PRODUCTION|
                     COMPLETED|REJECTED|CANCELLED), quotedPrice, adminNotes
```

### Cart

```
Cart            — userId (nullable), sessionKey (guest cart fingerprint)
CartItem        — cartId, productId, variantId, qty
```

Guest cart uses `sessionKey` (localStorage). On login, guest cart merged into user cart automatically.

### Chatbot

```
ChatSession     — userId (nullable), sessionKey (anon browser fingerprint),
                  escalated (bool)
ChatMessage     — sessionId, role (USER|ASSISTANT), content
```

### Supporting

```
UserAddress     — userId, label, isDefault, name, phone, street, city,
                  province, postal, country
Review          — productId, userId, orderId (must purchase to review),
                  rating (1-5), comment, images (String[]), isVisible
Coupon          — code (unique), type (PERCENT|FIXED), value, minOrder,
                  maxUses, usedCount, expiresAt, isActive
```

---

## 6. Payment Flow (Xendit)

1. User clicks Checkout
2. Server fn creates `Order` (status: `PENDING_PAYMENT`)
3. Server fn calls Xendit API → create invoice (amount, email, redirect URLs)
4. Save `xenditInvoiceId` + `xenditPaymentUrl` to Order
5. Redirect user to Xendit hosted payment page
6. User pays (GoPay, OVO, bank transfer, VA, credit card, Alfamart, etc.)
7. Xendit calls `POST /api/xendit/webhook`
8. Server verifies webhook signature (`XENDIT_WEBHOOK_TOKEN`)
9. Update Order → `status: PAID`, `paidAt: now()`
10. Send order confirmation email (Nodemailer)
11. User redirected to `/order/:id`

**Failed payment:** Xendit webhook failure event → Order stays `PENDING_PAYMENT`. Cron job cancels unpaid orders after 24h.

**Cart:** Stored in DB. Guest cart uses `sessionKey` (localStorage). On login, guest cart merges into user cart. Survives browser refresh and device changes after login.

---

## 7. i18n (Bilingual ID / EN)

- Library: `i18next` + `react-i18next`
- Language stored in cookie, persists across sessions
- Default: detect browser language → fallback to Indonesian
- UI toggle: flag icon in navbar (🇮🇩 / 🇬🇧)
- Product content: stored as dual DB fields (`nameId`/`nameEn`, `descId`/`descEn`) — server returns correct field per active locale
- Translation files in `/locales/{id,en}/{common,products,checkout,chatbot}.json`

---

## 8. AI Chatbot (Claude Agent)

**Model:** `claude-haiku-4-5` (cheap, fast, sufficient for support chat)

**Placement:** Floating widget, bottom-right, all pages

**Token management:**

- Context window: last 10 messages only (full history in DB)
- System prompt caching: Claude prompt cache (~90% cheaper on repeated calls)
- Tool results trimmed: max 5 results, essential fields only
- Language: Claude auto-detects and replies in user's language

**Agent tools:**

```
get_order_status(orderId)
  → queries Order table → returns status, tracking, ETA

search_products(query, category?)
  → searches Product table → max 5 results, name/price/slug

get_product_details(slug)
  → returns product info, variants, price, stock

escalate_to_human()
  → marks ChatSession.escalated = true
  → returns WhatsApp link + email to user
```

**Escalation:** Claude decides when to call `escalate_to_human()`. Escalated sessions visible to admin in Phase 2 (admin panel).

**Anonymous users:** `sessionKey` stored in localStorage. Linked to `userId` if user logs in mid-chat.

**Estimated cost:** ~$0.001–0.003 per conversation with caching.

---

## 9. Custom Order Flow

1. User visits `/custom`
2. Fills form: description, reference image upload (Cloudinary), size, color notes, budget range
3. Submit → creates `CustomOrderRequest` (status: `NEW`)
4. Team receives notification email
5. Team reviews → updates status, adds quoted price
6. User notified of quote via email
7. User accepts/rejects quote

**Guest allowed:** `userId` nullable, `guestEmail` required if no account.

**Future feature (deferred):** Claude agent + image generation API (DALL-E or similar) on `/custom` page — user prompts to generate design reference image. Rate limit: 3–5 generations/day per user. Not in Phase 1.

---

## 10. Marketplace Integration

Each product has `tokopediaUrl` and `shopeeUrl` fields (nullable).

On product detail page: simple external links ("Buy on Tokopedia ↗", "Buy on Shopee ↗") when URLs are set.

No inventory sync in Phase 1.

---

## 11. Out of Scope (Phase 2+)

- Admin panel (order management, inventory, custom order review, chat escalation view)
- AI image generation on custom order page
- Inventory sync with Tokopedia/Shopee
- Mobile app

---

## 12. Key Constraints

- 2-person team → minimize ops burden, favor free tiers, ship fast
- All free-tier services for development phase
- VPS Postgres on production (same server as app) — no separate DB bill
- Cloudinary free tier for storage
- Brand name TBD — use placeholder during build
