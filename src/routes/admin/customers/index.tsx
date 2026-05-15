/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Button } from '#/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { Input } from '#/components/ui/input'
import { adminCustomersQueryOptions } from '#/data/customers'
import type { getAdminCustomersFn } from '#/data/customers'
import { formatIDR } from '#/lib/format'
import { cn } from '#/lib/utils'
import { CUSTOM_STATUS_LABEL, CUSTOM_STATUS_STYLE } from '#/lib/custom-order'
import { STATUS_LABEL, STATUS_STYLE } from '#/lib/order'
import { validateSearchCustomerSchema } from '#/schemas/customer-schemas'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ChevronDown,
  Loader2,
  MapPin,
  Package,
  Printer,
  Search,
  Star,
} from 'lucide-react'
import React, { useRef, useState } from 'react'

export const Route = createFileRoute('/admin/customers/')({
  validateSearch: validateSearchCustomerSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminCustomersQueryOptions(deps)),
  component: AdminCustomersPage,
})

type CustomerList = Awaited<ReturnType<typeof getAdminCustomersFn>>
type Customer = CustomerList['customers'][number]

// ─── Detail panels ────────────────────────────────────────────────────────────

function PanelSection({
  icon: Icon,
  label,
  count,
  children,
}: {
  icon: React.ElementType
  label: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-fog" />
        <span className="text-[11px] font-semibold text-ink uppercase tracking-wide">
          {label} ({count})
        </span>
      </div>
      {children}
    </div>
  )
}

function AddressPanel({ addresses }: { addresses: Customer['addresses'] }) {
  if (addresses.length === 0)
    return <p className="text-xs text-fog italic">No addresses.</p>
  return (
    <ul className="space-y-2">
      {addresses.map((a) => (
        <li key={a.id} className="text-xs text-ink leading-relaxed">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">{a.label}</span>
            {a.isDefault && (
              <span className="text-[10px] font-mono text-fog bg-paper px-1.5 py-0.5 rounded-full border border-(--ink)/10">
                default
              </span>
            )}
          </div>
          <p className="text-fog">
            {a.name} · {a.phone}
          </p>
          <p className="text-fog">
            {a.street}, {a.city}, {a.province} {a.postal}
          </p>
        </li>
      ))}
    </ul>
  )
}

function OrdersPanel({ orders }: { orders: Customer['orders'] }) {
  if (orders.length === 0)
    return <p className="text-xs text-fog italic">No orders.</p>
  return (
    <ul className="space-y-2">
      {orders.map((o) => {
        const snapshot = o.items[0]?.productSnapshot as { name?: string } | null
        const firstProduct = snapshot?.name ?? '—'
        const moreCount = o.items.length - 1
        return (
          <li key={o.id} className="text-xs space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <Link
                to="/admin/orders/$id/update-order"
                params={{ id: o.id }}
                className="font-mono font-semibold text-ink hover:underline truncate"
              >
                {o.invoiceNumber}
              </Link>
              <span className="font-mono text-fog shrink-0">
                {formatIDR(o.total)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-fog truncate">
                {firstProduct}
                {moreCount > 0 && ` +${moreCount}`}
              </p>
              <span
                className={cn(
                  STATUS_STYLE[o.status],
                  'text-[10px] py-0 shrink-0',
                )}
              >
                {STATUS_LABEL[o.status]}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function CustomOrdersPanel({
  customOrders,
}: {
  customOrders: Customer['customOrders']
}) {
  if (customOrders.length === 0)
    return <p className="text-xs text-fog italic">No custom orders.</p>
  return (
    <ul className="space-y-2">
      {customOrders.map((co) => (
        <li key={co.id} className="text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/admin/custom-orders/$id"
              params={{ id: co.id }}
              className="font-mono font-semibold text-ink hover:underline"
            >
              #{co.id.slice(-8).toUpperCase()}
            </Link>
            <span
              className={cn(CUSTOM_STATUS_STYLE[co.status], 'text-[10px] py-0')}
            >
              {CUSTOM_STATUS_LABEL[co.status]}
            </span>
            {co.quotedPrice && (
              <span className="text-fog font-mono ml-auto">
                {formatIDR(co.quotedPrice)}
              </span>
            )}
          </div>
          <p className="text-fog mt-0.5 line-clamp-1">{co.description}</p>
        </li>
      ))}
    </ul>
  )
}

function ReviewPanel({ reviews }: { reviews: Customer['reviews'] }) {
  if (reviews.length === 0)
    return <p className="text-xs text-fog italic">No reviews.</p>
  return (
    <ul className="space-y-2">
      {reviews.map((r) => (
        <li key={r.id} className="text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3 ${i < r.rating ? 'fill-gold text-gold' : 'text-fog'}`}
                />
              ))}
            </span>
            <Link
              to="/products/$slug"
              params={{ slug: r.product.slug }}
              className="font-semibold text-ink hover:underline"
            >
              {r.product.name}
            </Link>
            <span className="text-fog ml-auto">
              {new Date(r.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          {r.comment && <p className="text-fog mt-0.5">{r.comment}</p>}
        </li>
      ))}
    </ul>
  )
}

// ─── Customer card ────────────────────────────────────────────────────────────

function CustomerCard({
  customer,
  open,
  onOpenChange,
}: {
  customer: Customer
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="card p-0 overflow-hidden"
    >
      {/* Summary row — entire row is the trigger */}
      <CollapsibleTrigger asChild>
        <div className="grid grid-cols-[1fr_auto] items-center px-5 py-4 cursor-pointer hover:bg-fog/5 transition-colors group">
          <div className="grid grid-cols-[200px_80px_120px_110px_110px] items-center gap-4 min-w-0">
            {/* Name + email — stop propagation so link still works */}
            <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
              <Link
                to="/admin/orders"
                search={{ search: customer.email, page: 1 }}
              >
                <p className="text-sm font-semibold text-ink truncate hover:underline">
                  {customer.name}
                </p>
                <p className="text-xs text-fog truncate">{customer.email}</p>
              </Link>
            </div>

            {/* Orders */}
            <div className="text-center">
              <p className="text-sm font-semibold text-ink tabular-nums">
                {customer.orderCount}
              </p>
              <p className="text-[11px] text-fog">orders</p>
            </div>

            {/* Total spent */}
            <div>
              <p className="text-sm font-mono text-ink">
                {formatIDR(customer.totalSpent)}
              </p>
              <p className="text-[11px] text-fog">total spent</p>
            </div>

            {/* Last order */}
            <div>
              <p className="text-sm text-ink">
                {customer.lastOrderAt
                  ? new Date(customer.lastOrderAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
              <p className="text-[11px] text-fog">last order</p>
            </div>

            {/* Joined */}
            <div>
              <p className="text-sm text-ink">
                {new Date(customer.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-fog">joined</p>
            </div>
          </div>

          <ChevronDown className="ml-4 size-4 text-fog transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>

      {/* Expandable detail */}
      <CollapsibleContent>
        <div className="border-t border-line px-5 py-4 grid grid-cols-2 xl:grid-cols-4 gap-6 bg-paper/50">
          <PanelSection
            icon={MapPin}
            label="Addresses"
            count={customer.addresses.length}
          >
            <AddressPanel addresses={customer.addresses} />
          </PanelSection>
          <PanelSection
            icon={Package}
            label="Orders"
            count={customer.orderCount}
          >
            <OrdersPanel orders={customer.orders} />
          </PanelSection>
          <PanelSection
            icon={Printer}
            label="Custom"
            count={customer.customOrderCount}
          >
            <CustomOrdersPanel customOrders={customer.customOrders} />
          </PanelSection>
          <PanelSection
            icon={Star}
            label="Reviews"
            count={customer.reviewCount}
          >
            <ReviewPanel reviews={customer.reviews} />
          </PanelSection>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ─── Header row ───────────────────────────────────────────────────────────────

function CustomerListHeader() {
  return (
    <div className="grid grid-cols-[1fr_auto] px-5">
      <div className="grid grid-cols-[200px_80px_120px_110px_110px] gap-4">
        <span className="text-[11px] font-semibold text-fog uppercase tracking-wide">
          Customer
        </span>
        <span className="text-[11px] font-semibold text-fog uppercase tracking-wide text-center">
          Orders
        </span>
        <span className="text-[11px] font-semibold text-fog uppercase tracking-wide">
          Total Spent
        </span>
        <span className="text-[11px] font-semibold text-fog uppercase tracking-wide">
          Last Order
        </span>
        <span className="text-[11px] font-semibold text-fog uppercase tracking-wide">
          Joined
        </span>
      </div>
      <div className="w-9" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdminCustomersPage() {
  const { page, search } = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/customers/' })
  const searchRef = useRef<HTMLInputElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const {
    data: { customers, pages },
    isFetching,
  } = useSuspenseQuery(adminCustomersQueryOptions({ page, search }))

  function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault()
    navigate({
      search: (prev) => ({
        ...prev,
        search: searchRef.current?.value || undefined,
        page: 1,
      }),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-ink">Customers</h1>
        <p className="mt-1 text-sm text-fog">
          Users who have placed at least one order.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          ref={searchRef}
          defaultValue={search}
          placeholder="Search by name or email..."
          className="flex-1 rounded-full"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
        >
          <Search className="size-4" />
        </Button>
      </form>

      {/* List */}
      {isFetching ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-fog" />
        </div>
      ) : customers.length === 0 ? (
        <p className="py-12 text-center text-sm text-fog">
          No customers found.
        </p>
      ) : (
        <div className="space-y-1">
          <CustomerListHeader />
          <div className="space-y-2">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                open={openId === customer.id}
                onOpenChange={(o) => setOpenId(o ? customer.id : null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-fog">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page - 1 }) })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() =>
                navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
