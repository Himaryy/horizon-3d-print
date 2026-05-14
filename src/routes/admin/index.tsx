/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { getDashboardStatsFn } from '#/data/dashboard'
import { formatIDR } from '#/lib/format'
import { STATUS_STYLE, STATUS_LABEL } from '#/lib/order'
import { cn } from '#/lib/utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '#/components/ui/chart'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Banknote,
  Clock,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

export const Route = createFileRoute('/admin/')({
  loader: () => getDashboardStatsFn(),
  component: RouteComponent,
})

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--gold)',
  },
}

function RouteComponent() {
  const {
    products,
    orders,
    revenue,
    pendingOrders,
    recentOrders,
    pendingCustomRequests,
    monthlyRevenue,
  } = Route.useLoaderData()

  const stats = [
    {
      label: 'Products',
      value: String(products),
      icon: Package,
      colorText: 'text-gold',
      colorBg: 'bg-gold/10',
    },
    {
      label: 'Total Orders',
      value: String(orders),
      icon: ShoppingCart,
      colorText: 'text-sky',
      colorBg: 'bg-sky/10',
    },
    {
      label: 'Pending Orders',
      value: String(pendingOrders),
      icon: Clock,
      colorText: 'text-gold',
      colorBg: 'bg-gold/10',
    },
    {
      label: 'Revenue',
      value: formatIDR(revenue),
      icon: Banknote,
      colorText: 'text-sky',
      colorBg: 'bg-sky/10',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-fog">
          Welcome back. Here's what's going on.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, colorText, colorBg }) => (
          <div key={label} className="card p-5">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${colorBg}`}>
              <Icon className={`size-5 ${colorText}`} />
            </div>
            <p className="price text-2xl font-bold text-ink">{value}</p>
            <p className="mt-1 text-xs font-medium text-fog">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-5 space-y-4">
        <p className="t-eyebrow">Revenue — Last 6 Months</p>
        <ChartContainer config={chartConfig} className="h-52 w-full">
          <BarChart data={monthlyRevenue} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--paper-2)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--fog)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--fog)' }}
              tickFormatter={(v) =>
                v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`
              }
              width={40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    formatIDR(value as number),
                    ' Revenue',
                  ]}
                />
              }
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Recent Orders + Custom Requests */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow">Recent Orders</p>
            <Link
              to="/admin/orders"
              search={{ page: 1 }}
              className="text-xs text-sky hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-fog">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-(--paper-2) p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {order.user?.name ?? order.customerName ?? '-'}
                    </p>
                    <p className="truncate text-xs text-fog">
                      {order.user?.email ?? order.customerEmail ?? '-'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn(STATUS_STYLE[order.status])}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    <p className="font-mono text-xs text-ink">
                      {formatIDR(order.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Custom Requests */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="t-eyebrow">
              Custom Requests
              {pendingCustomRequests.length > 0 && (
                <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink">
                  {pendingCustomRequests.length}
                </span>
              )}
            </p>
            <Link
              to="/admin/custom-orders"
              className="text-xs text-sky hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          {pendingCustomRequests.length === 0 ? (
            <p className="py-6 text-center text-sm text-fog">
              No new requests.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingCustomRequests.map((req) => {
                const customerName = req.user?.name ?? req.guestName ?? 'Guest'
                const customerEmail = req.user?.email ?? req.guestEmail ?? '-'

                return (
                  <div
                    key={req.id}
                    className="rounded-lg border border-(--paper-2) p-3 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm text-ink">
                        {req.description}
                      </p>
                      {(req.budgetMin || req.budgetMax) && (
                        <p className="shrink-0 font-mono text-xs text-gold">
                          {req.budgetMin && req.budgetMax
                            ? `${formatIDR(req.budgetMin)} - ${formatIDR(req.budgetMax)}`
                            : req.budgetMin
                              ? `from ${formatIDR(req.budgetMin)}`
                              : `up to ${formatIDR(req.budgetMax!)}`}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-fog">
                      {customerName} · {customerEmail}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
