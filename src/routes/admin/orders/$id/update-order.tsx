import { createFileRoute, Link } from '@tanstack/react-router'
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { adminOrderByIdQueryOptions, updateOrderStatusFn } from '#/data/order'
import { useForm } from '@tanstack/react-form'
import { updateOrderStatusSchema } from '#/schemas/order-schemas'
import type { UpdateOrderStatus } from '#/schemas/order-schemas'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button, buttonVariants } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import { formatIDR } from '#/lib/format'
import {
  STATUS_LABEL,
  STATUS_STYLE,
  SOURCE_LABEL,
  SOURCE_STYLE,
  STATUS_OPTIONS,
} from '#/lib/order'

type ShippingAddress = {
  name: string
  phone: string
  street: string
  city: string
  province: string
  postal: string
}

export const Route = createFileRoute('/admin/orders/$id/update-order')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(adminOrderByIdQueryOptions(params.id)),
  component: UpdateOrderPage,
})

function UpdateOrderPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: order } = useSuspenseQuery(adminOrderByIdQueryOptions(id))

  const customerName = order.user?.name ?? order.customerName ?? '-'
  const customerEmail = order.user?.email ?? order.customerEmail ?? '-'
  const address = order.shippingAddress as ShippingAddress

  const { mutate, isPending } = useMutation({
    mutationFn: (value: UpdateOrderStatus) =>
      updateOrderStatusFn({ data: value }),
    onSuccess: () => {
      toast.success('Order updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
    onError: () => toast.error('Failed to update order'),
  })

  const form = useForm({
    defaultValues: {
      id: order.id,
      status: order.status as (typeof STATUS_OPTIONS)[number]['value'],
      courier: order.courier ?? '',
      trackingNumber: order.trackingNumber ?? '',
      trackingUrl: order.trackingUrl ?? '',
      adminNotes: order.adminNotes ?? '',
    },
    validators: { onSubmit: updateOrderStatusSchema },
    onSubmit: ({ value }) => mutate(value),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/admin/orders"
          search={{ page: 1 }}
          className={buttonVariants({ size: 'icon', variant: 'ghost' })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl text-ink">{order.invoiceNumber}</h1>
            <span className={cn(STATUS_STYLE[order.status])}>
              {STATUS_LABEL[order.status]}
            </span>
            <span className={cn(SOURCE_STYLE[order.source])}>
              {SOURCE_LABEL[order.source]}
            </span>
          </div>
          <p className="mt-1 text-sm text-fog">
            {new Date(order.createdAt).toLocaleString('id-ID', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
            {order.externalOrderId && (
              <span className="ml-2 font-mono">· {order.externalOrderId}</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — Order details */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="card p-5 space-y-3">
            <p className="t-eyebrow">Customer</p>
            <div>
              <p className="font-semibold text-ink">{customerName}</p>
              <p className="text-sm text-fog">{customerEmail}</p>
            </div>
          </div>

          {/* Shipping address */}
          <div className="card p-5 space-y-3">
            <p className="t-eyebrow">Shipping Address</p>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold text-ink">{address.name}</p>
              <p className="text-fog">{address.phone}</p>
              <p className="text-fog">{address.street}</p>
              <p className="text-fog">
                {address.city}, {address.province} {address.postal}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="card p-5 space-y-3">
            <p className="t-eyebrow">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-(--paper-2) p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-ink truncate">
                      {item.product?.name ?? 'Unknown product'}
                    </p>
                    <p className="text-xs text-fog">
                      {formatIDR(item.unitPrice)} × {item.qty}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-ink shrink-0">
                    {formatIDR(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Summary + Update */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="card p-5 space-y-3">
            <p className="t-eyebrow">Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-fog">Subtotal</span>
                <span className="font-mono text-ink">
                  {formatIDR(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-fog">Shipping</span>
                <span className="font-mono text-ink">
                  {formatIDR(order.shippingCost)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-fog">Discount</span>
                  <span className="font-mono text-green-600">
                    -{formatIDR(order.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-(--paper-2) pt-2 font-semibold">
                <span className="text-ink">Total</span>
                <span className="font-mono text-ink">
                  {formatIDR(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Update status */}
          <div className="card p-5 space-y-4">
            <p className="t-eyebrow">Update Order</p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              <form.Field
                name="status"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <form.Subscribe
                selector={(s) => s.values.status}
                children={(status) =>
                  status === 'SHIPPED' ? (
                    <div className="space-y-3">
                      <form.Field
                        name="courier"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>Courier</Label>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                              placeholder="JNE, J&T, SiCepat..."
                            />
                          </div>
                        )}
                      />
                      <form.Field
                        name="trackingNumber"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>Tracking Number</Label>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                              placeholder="JNE123456789"
                            />
                          </div>
                        )}
                      />
                      <form.Field
                        name="trackingUrl"
                        children={(field) => (
                          <div className="space-y-1.5">
                            <Label htmlFor={field.name}>
                              Tracking URL (optional)
                            </Label>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              onBlur={field.handleBlur}
                              placeholder="https://cekresi.com/..."
                            />
                          </div>
                        )}
                      />
                    </div>
                  ) : null
                }
              />

              <form.Field
                name="adminNotes"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Admin Notes (optional)</Label>
                    <Textarea
                      id={field.name}
                      rows={3}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Internal notes..."
                    />
                  </div>
                )}
              />

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-gold hover:bg-gold/90 cursor-pointer"
              >
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>

          {/* Customer notes */}
          {order.notes && (
            <div className="card p-5 space-y-2">
              <p className="t-eyebrow">Customer Notes</p>
              <p className="text-sm text-fog">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
