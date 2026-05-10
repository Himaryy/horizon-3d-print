# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server on :3000
pnpm build        # production build
pnpm lint         # ESLint
pnpm format       # Prettier + ESLint fix
pnpm test         # Vitest (run once)

pnpm db:generate  # prisma generate (reads .env.local)
pnpm db:push      # push schema to DB (dev, no migration history)
pnpm db:migrate   # create migration + apply
pnpm db:studio    # Prisma Studio UI
pnpm db:seed      # run seed script
```

All `db:*` commands load `.env.local` via `dotenv-cli`. Required env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Architecture

**Stack:** TanStack Start (SSR React) + Nitro + Vite + Tailwind v4 + Prisma (Neon/Postgres) + Better Auth

### Routing — TanStack Router file-based

Routes live in `src/routes/`. The router plugin auto-generates `src/routeTree.gen.ts` on save — never edit it manually.

| Pattern | Meaning |
|---|---|
| `__root.tsx` | Root layout: `shellComponent` wraps ALL routes with `<Navbar>`, `<Footer>` |
| `_auth/route.tsx` | Pathless layout group for `/login`, `/register` (centered blue-wash bg) |
| `_home/route.tsx` | Pathless layout group for `/`, `/about`, `/custom` (just `<Outlet />`) |
| `products/$slug.tsx` | Dynamic segment |

Route files export `const Route = createFileRoute('/<path>')({ component })`. The shell is `shellComponent`, not `component`, in `__root.tsx`.

### Server functions

Use `createServerFn` from `@tanstack/react-start` for any server-side data access. Place them in `src/server/` by domain (`products.ts`, `orders.ts`, etc.). Call them from route `loader` or directly in components via `useQuery`.

### Auth — Better Auth

- Server config: `src/lib/auth.ts` — email/password + Google OAuth, `role` as additional field
- Client: `src/lib/auth-client.ts` — must use `inferAdditionalFields<typeof auth>()` plugin so `user.role` resolves on the client type
- Auth API route is handled by Better Auth's TanStack Start integration (`tanstackStartCookies` plugin)
- Check role in components: `session?.user?.role === 'admin'`

### Database — Prisma

- Schema: `prisma/schema.prisma`
- Generated client output: `src/generated/prisma/` (checked in — do not delete)
- Import: `import { prisma } from '#/db'`
- Prices stored as integers (IDR cents/rupiah — confirm convention before writing)
- `Product.deletedAt` soft-delete pattern
- `OrderItem.productSnapshot` is JSON — snapshot of product at time of purchase

### Styling — Tailwind v4

No `tailwind.config.*`. Config is entirely in `src/styles.css` via `@theme inline` and `:root` custom properties.

**Canonical Tailwind v4 class forms** (not arbitrary values):
- CSS vars: `text-(--ink-2)`, `bg-(--paper)` — not `text-[var(--ink-2)]`
- Animations: `animate-[blink_2s_infinite]` — not `[animation:blink...]`
- Font stretch: `font-stretch-75%` — not `[font-stretch:75%]`
- Opacity modifier: `bg-paper/90` works because brand colors are in `@theme inline`

**Never write vanilla/inline CSS in components.** Convert everything to Tailwind classes. The two legitimate exceptions: `WebkitTextStroke` (not in Tailwind) and `backgroundSize` for multi-stop gradients.

### Design system

See `DESIGN.md` (authoritative) and `PRODUCT.md` (brand/product context). Key rules:

- **Chunky Shadow Rule:** `.card` always has `4px 4px 0 var(--ink)` — permanent, not a hover state
- **Stretch Rule:** Bricolage Grotesque always `font-stretch: 75%` — use `h-display` or `font-stretch-75%`
- **Serif Contrast Rule:** Instrument Serif italic only paired with Bricolage display (`h-serif-italic`)
- **No `#000` / `#fff`** — use `--ink` / `--white` (warm tints)
- **No gaussian blur shadows** — only hard 0-blur offset shadows
- Gold (`#FFC23C`) = action/CTA only. Sky (`#5BB8FF`) = primary interactive

### UI components

shadcn/ui for ALL interactive components (Button, Dropdown, Avatar, Dialog, etc.). Raw Radix or hand-rolled HTML for interactive elements is not the pattern here.

Components live in `src/components/`:
- `layouts/` — Navbar, Footer, Hero (page-level shells)
- `ui/` — shadcn primitives (Avatar, DropdownMenu, etc.)
- `product/` — ProductCard, ProductGallery, etc. (to be created)

### Path alias

`#/*` → `src/*`. Use in all imports: `import { foo } from '#/lib/foo'`.
