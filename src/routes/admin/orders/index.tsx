/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Button, buttonVariants } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { adminOrderQueryOptions } from '#/data/order'
import { cn } from '#/lib/utils'
import { formatIDR } from '#/lib/format'
import {
  SOURCE_FILTERS,
  SOURCE_LABEL,
  SOURCE_STYLE,
  STATUS_FILTERS,
  STATUS_LABEL,
  STATUS_STYLE,
} from '#/lib/order'
import { validateSearchOrderSchema } from '#/schemas/order-schemas'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2, Plus, Search } from 'lucide-react'
import React, { useRef } from 'react'

export const Route = createFileRoute('/admin/orders/')({
  validateSearch: validateSearchOrderSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminOrderQueryOptions(deps)),
  component: AdminOrdersPage,
})

function AdminOrdersPage() {
  const { page, status, source, search } = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/orders/' })
  const searchRef = useRef<HTMLInputElement>(null)

  const {
    data: { orders, pages },
    isFetching,
  } = useSuspenseQuery(adminOrderQueryOptions({ page, status, source, search }))

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-ink">Orders</h1>
          <p className="mt-1 text-sm text-fog">Track and manage all orders.</p>
        </div>
        <Link
          to="/admin/orders/new-order"
          className={cn(
            buttonVariants(),
            'btn btn-accent rounded-l-none rounded-r-full h-10 px-5 shrink-0',
          )}
        >
          <Plus className="size-4" />
          Manual Order
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            ref={searchRef}
            defaultValue={search}
            placeholder="Invoice, order ID, customer..."
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

        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 w-max">
            {SOURCE_FILTERS.map((f) => (
              <button
                key={String(f.value)}
                type="button"
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, source: f.value, page: 1 }),
                  })
                }
                className={cn('chip', source === f.value && 'chip-ink')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 w-max">
            {STATUS_FILTERS.map((f) => (
              <button
                key={String(f.value)}
                type="button"
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, status: f.value, page: 1 }),
                  })
                }
                className={cn('chip', status === f.value && 'chip-ink')}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-paper hover:bg-paper">
              <TableHead className="px-10">Invoice</TableHead>
              <TableHead className="px-10">Source</TableHead>
              <TableHead className="px-10">Customer</TableHead>
              <TableHead className="px-10">Status</TableHead>
              <TableHead className="px-10">Total</TableHead>
              <TableHead className="px-10">Date</TableHead>
              <TableHead className="px-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Loader2 className="size-5 animate-spin text-fog mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-fog"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const customerName =
                  order.user?.name || order.customerName || '-'
                const customerEmail =
                  order.user?.email || order.customerEmail || '-'

                return (
                  <TableRow key={order.id}>
                    <TableCell className="px-10">
                      <p className="font-mono text-sm font-semibold text-ink">
                        {order.invoiceNumber}
                      </p>
                      {order.externalOrderId && (
                        <p className="text-xs text-fog">
                          {order.externalOrderId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-10">
                      <span className={cn(SOURCE_STYLE[order.source])}>
                        {SOURCE_LABEL[order.source]}
                      </span>
                    </TableCell>
                    <TableCell className="px-10">
                      <p className="text-sm font-semibold text-ink">
                        {customerName}
                      </p>
                      <p className="text-xs text-fog">{customerEmail}</p>
                    </TableCell>
                    <TableCell className="px-10">
                      <span className={cn(STATUS_STYLE[order.status])}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </TableCell>
                    <TableCell className="px-10 font-mono text-sm text-ink">
                      {formatIDR(order.total)}
                    </TableCell>
                    <TableCell className="px-10 text-sm text-fog">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="px-10">
                      <Link
                        to="/admin/orders/$id/update-order"
                        params={{ id: order.id }}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                        })}
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

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
