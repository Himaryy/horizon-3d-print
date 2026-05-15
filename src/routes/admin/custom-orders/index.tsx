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
import { adminCustomOrdersQueryOptions } from '#/data/custom-orders'
import { formatIDR } from '#/lib/format'
import {
  CUSTOM_STATUS_FILTERS,
  CUSTOM_STATUS_LABEL,
  CUSTOM_STATUS_STYLE,
} from '#/lib/custom-order'
import { cn } from '#/lib/utils'
import { validateSearchCustomOrderSchema } from '#/schemas/custom-order-schemas'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2, Search } from 'lucide-react'
import React, { useRef } from 'react'

export const Route = createFileRoute('/admin/custom-orders/')({
  validateSearch: validateSearchCustomOrderSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminCustomOrdersQueryOptions(deps)),
  component: AdminCustomOrdersPage,
})

// ─── Component ────────────────────────────────────────────────────────────────

function AdminCustomOrdersPage() {
  const { page, status, search } = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/custom-orders/' })
  const searchRef = useRef<HTMLInputElement>(null)

  const {
    data: { requests, pages },
    isFetching,
  } = useSuspenseQuery(adminCustomOrdersQueryOptions({ page, status, search }))

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
          <h1 className="text-3xl text-ink">Custom Orders</h1>
          <p className="mt-1 text-sm text-fog">
            Review and manage custom print requests.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            ref={searchRef}
            defaultValue={search}
            placeholder="Name, email, description…"
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
            {CUSTOM_STATUS_FILTERS.map((f) => (
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
              <TableHead className="px-6">Request</TableHead>
              <TableHead className="px-6">Description</TableHead>
              <TableHead className="px-6">Status</TableHead>
              <TableHead className="px-6">Budget / Quoted</TableHead>
              <TableHead className="px-6">Submitted</TableHead>
              <TableHead className="px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Loader2 className="size-5 animate-spin text-fog mx-auto" />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-fog"
                >
                  No custom order requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => {
                const customerName = req.user?.name ?? req.guestName ?? '—'
                const customerEmail = req.user?.email ?? req.guestEmail ?? '—'
                const shortId = req.id.slice(-8).toUpperCase()
                const truncatedDesc =
                  req.description.length > 50
                    ? req.description.slice(0, 50) + '…'
                    : req.description

                return (
                  <TableRow key={req.id}>
                    <TableCell className="px-6">
                      <p className="font-mono text-xs text-fog tracking-wide mb-0.5">
                        #{shortId}
                      </p>
                      <p className="text-sm font-semibold text-ink">
                        {customerName}
                      </p>
                      <p className="text-xs text-fog">{customerEmail}</p>
                    </TableCell>
                    <TableCell className="px-6 w-56 max-w-56">
                      <p className="text-sm text-ink truncate">
                        {truncatedDesc}
                      </p>
                      {req.size && (
                        <p className="text-xs text-fog mt-0.5 truncate">
                          {req.size}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-6">
                      <span className={cn(CUSTOM_STATUS_STYLE[req.status])}>
                        {CUSTOM_STATUS_LABEL[req.status]}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">
                      <p className="text-xs font-mono text-fog">
                        {req.budgetMin !== null && req.budgetMax !== null
                          ? `${formatIDR(req.budgetMin)} – ${formatIDR(req.budgetMax)}`
                          : '—'}
                      </p>
                      <p className="text-sm font-mono text-ink mt-0.5">
                        {req.quotedPrice !== null
                          ? formatIDR(req.quotedPrice)
                          : '—'}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 text-sm text-fog">
                      {new Date(req.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="px-6">
                      <Link
                        to="/admin/custom-orders/$id"
                        params={{ id: req.id }}
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
