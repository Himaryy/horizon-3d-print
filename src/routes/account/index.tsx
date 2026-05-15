import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { authClient } from '#/lib/auth-client'
import { formatIDR } from '#/lib/format'
import { getInitials } from '#/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Package, Settings, FileText } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeUp } from '#/lib/motion'

export const Route = createFileRoute('/account/')({
  component: AccountPage,
})

// mock — replace with real serverFn later
const MOCK_ORDERS = [
  {
    id: 'ORD-001',
    date: '2026-05-10',
    status: 'DELIVERED',
    total: 185000,
    items: 1,
  },
  {
    id: 'ORD-002',
    date: '2026-05-08',
    status: 'PRINTING',
    total: 230000,
    items: 2,
  },
  {
    id: 'ORD-003',
    date: '2026-05-01',
    status: 'SHIPPED',
    total: 95000,
    items: 1,
  },
]

const MOCK_CUSTOM = [
  {
    id: 'CUS-001',
    date: '2026-05-09',
    status: 'UNDER_REVIEW',
    description: 'Espresso machine bracket, CF Nylon',
  },
  {
    id: 'CUS-002',
    date: '2026-04-28',
    status: 'QUOTED',
    description: 'Articulated dragon XL version',
  },
]

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  PENDING_PAYMENT: { label: 'Pending', class: 'text-fog' },
  PAID: { label: 'Paid', class: 'text-sky' },
  PROCESSING: { label: 'Processing', class: 'text-sky' },
  PRINTING: { label: 'Printing', class: 'text-gold' },
  SHIPPED: { label: 'Shipped', class: 'text-sky' },
  DELIVERED: { label: 'Delivered', class: 'text-ink' },
  CANCELLED: { label: 'Cancelled', class: 'text-destructive' },
  NEW: { label: 'New', class: 'text-fog' },
  UNDER_REVIEW: { label: 'Under Review', class: 'text-gold' },
  QUOTED: { label: 'Quoted', class: 'text-sky' },
  ACCEPTED: { label: 'Accepted', class: 'text-sky' },
  IN_PRODUCTION: { label: 'In Production', class: 'text-gold' },
  COMPLETED: { label: 'Completed', class: 'text-ink' },
  REJECTED: { label: 'Rejected', class: 'text-destructive' },
}

function AccountPage() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  if (!user) {
    return (
      <main className="mx-auto max-w-360 px-8 py-24 flex flex-col items-center gap-6 text-center">
        <h1 className="h-display text-[clamp(2rem,5vw,3.5rem)] text-ink">
          Sign in to view your account.
        </h1>
        <Link
          to="/login"
          className="btn btn-accent inline-flex items-center gap-2"
        >
          Sign In
          <ArrowRight className="size-4" />
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-360 px-8 py-10 flex flex-col gap-10 pb-24">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex items-center gap-5"
      >
        <Avatar className="size-16 border-2 border-ink">
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback className="text-xl font-bold text-paper bg-sky">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="t-eyebrow text-fog mb-1">My Account</p>
          <h1 className="h-display text-[clamp(1.8rem,4vw,3rem)] text-ink leading-[0.92]">
            {user.name}
          </h1>
          <p className="text-[13px] text-fog mt-0.5">{user.email}</p>
        </div>
      </motion.div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            <Package className="size-3.5" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-1.5">
            <FileText className="size-3.5" />
            Custom Requests
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Settings className="size-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Orders tab */}
        <TabsContent value="orders">
          {MOCK_ORDERS.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Package className="size-12 text-line" strokeWidth={1} />
              <p className="text-ink-2">No orders yet.</p>
              <Link
                to="/products"
                className="btn btn-accent inline-flex items-center gap-2"
              >
                Browse Products <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {MOCK_ORDERS.map((o) => (
                <div key={o.id} className="card p-5 flex items-center gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="t-mono text-[13px] text-ink">
                        {o.id}
                      </span>
                      <span
                        className={`t-eyebrow ${STATUS_LABELS[o.status].class || 'text-fog'}`}
                      >
                        {STATUS_LABELS[o.status].label || o.status}
                      </span>
                    </div>
                    <span className="text-[13px] text-fog">
                      {o.date} · {o.items} {o.items === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <span className="price text-[16px] text-ink shrink-0">
                    {formatIDR(o.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Custom requests tab */}
        <TabsContent value="custom">
          {MOCK_CUSTOM.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <FileText className="size-12 text-line" strokeWidth={1} />
              <p className="text-ink-2">No custom requests yet.</p>
              <Link
                to="/custom"
                className="btn btn-accent inline-flex items-center gap-2"
              >
                Get a Quote <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {MOCK_CUSTOM.map((c) => (
                <div key={c.id} className="card p-5 flex items-center gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="t-mono text-[13px] text-ink">
                        {c.id}
                      </span>
                      <span
                        className={`t-eyebrow ${STATUS_LABELS[c.status].class || 'text-fog'}`}
                      >
                        {STATUS_LABELS[c.status].label || c.status}
                      </span>
                    </div>
                    <span className="text-[13px] text-fog truncate">
                      {c.description}
                    </span>
                    <span className="text-[12px] text-fog">{c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings">
          <div className="flex flex-col gap-6 max-w-lg">
            <div className="card-soft rounded-[14px] p-6 flex flex-col gap-4">
              <h3 className="h-display text-[18px] text-ink">Profile</h3>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[14px] font-medium text-ink">
                    {user.name}
                  </p>
                  <p className="text-[13px] text-fog">{user.email}</p>
                </div>
                <Button variant="outline" className="rounded-full" disabled>
                  Edit
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/5 w-fit"
              onClick={() =>
                authClient.signOut().then(() => (window.location.href = '/'))
              }
            >
              Sign Out
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
