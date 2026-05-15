import { createFileRoute, Link } from '@tanstack/react-router'
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  adminCustomOrderByIdQueryOptions,
  updateCustomOrderFn,
} from '#/data/custom-orders'
import { useForm } from '@tanstack/react-form'
import { updateCustomOrderSchema } from '#/schemas/custom-order-schemas'
import type { UpdateCustomOrderSchema } from '#/schemas/custom-order-schemas'
import {
  CUSTOM_STATUS_LABEL,
  CUSTOM_STATUS_STYLE,
  CUSTOM_STATUS_OPTIONS,
} from '#/lib/custom-order'
import { formatIDR } from '#/lib/format'
import { cn } from '#/lib/utils'
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

export const Route = createFileRoute('/admin/custom-orders/$id/')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(adminCustomOrderByIdQueryOptions(params.id)),
  component: CustomOrderDetailPage,
})

function CustomOrderDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: req } = useSuspenseQuery(adminCustomOrderByIdQueryOptions(id))

  const shortId = req.id.slice(-8).toUpperCase()
  const customerName = req.user?.name ?? req.guestName ?? '—'
  const customerEmail = req.user?.email ?? req.guestEmail ?? '—'
  const isGuest = !req.userId

  const { mutate, isPending } = useMutation({
    mutationFn: (value: UpdateCustomOrderSchema) =>
      updateCustomOrderFn({ data: value }),
    onSuccess: () => {
      toast.success('Updated')
      queryClient.invalidateQueries({
        queryKey: ['admin', 'custom-orders', id],
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-orders'] })
    },
    onError: () => toast.error('Failed to update request'),
  })

  const form = useForm({
    defaultValues: {
      id: req.id,
      status: req.status as (typeof CUSTOM_STATUS_OPTIONS)[number]['value'],
      quotedPrice: req.quotedPrice ?? null,
      adminNotes: req.adminNotes ?? null,
    },

    validators: {
      onSubmit: updateCustomOrderSchema,
    },

    onSubmit: ({ value }) => {
      mutate(value)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/admin/custom-orders"
          search={{ page: 1 }}
          className={buttonVariants({ size: 'icon', variant: 'ghost' })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl text-ink font-mono">#{shortId}</h1>
            <span className={cn(CUSTOM_STATUS_STYLE[req.status])}>
              {CUSTOM_STATUS_LABEL[req.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-fog">
            Submitted{' '}
            {new Date(req.createdAt).toLocaleString('id-ID', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — Request details */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <p className="t-eyebrow">Customer</p>
              {isGuest && <span className="chip text-xs">Guest</span>}
            </div>
            <div>
              <p className="font-semibold text-ink">{customerName}</p>
              <p className="text-sm text-fog">{customerEmail}</p>
            </div>
          </div>

          {/* Request details */}
          <div className="card p-5 space-y-4">
            <p className="t-eyebrow">Request Details</p>

            <div className="space-y-1">
              <p className="text-xs text-fog uppercase tracking-wide">
                Description
              </p>
              <p className="text-sm text-ink whitespace-pre-wrap">
                {req.description}
              </p>
            </div>

            {req.size && (
              <div className="space-y-1">
                <p className="text-xs text-fog uppercase tracking-wide">Size</p>
                <p className="text-sm text-ink">{req.size}</p>
              </div>
            )}

            {req.colorNote && (
              <div className="space-y-1">
                <p className="text-xs text-fog uppercase tracking-wide">
                  Color / Finish Notes
                </p>
                <p className="text-sm text-ink">{req.colorNote}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-fog uppercase tracking-wide">
                Budget Range
              </p>
              <p className="text-sm font-mono text-ink">
                {req.budgetMin !== null && req.budgetMax !== null
                  ? `${formatIDR(req.budgetMin)} – ${formatIDR(req.budgetMax)}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="card p-5 space-y-3">
            <p className="t-eyebrow">Timeline</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-fog">Submitted</span>
                <span className="text-ink">
                  {new Date(req.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fog">Last updated</span>
                <span className="text-ink">
                  {new Date(req.updatedAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Update form */}
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <p className="t-eyebrow">Update Request</p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              {/* Status */}
              <form.Field
                name="status"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(
                          v as (typeof CUSTOM_STATUS_OPTIONS)[number]['value'],
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOM_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              {/* Quoted Price */}
              <form.Field
                name="quotedPrice"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Quoted Price (optional)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-fog">
                        Rp
                      </span>
                      <Input
                        id={field.name}
                        type="text"
                        inputMode="numeric"
                        className="pl-9"
                        value={field.state.value ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          field.handleChange(raw === '' ? 0 : parseInt(raw, 10))
                        }}
                        onBlur={field.handleBlur}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              />

              {/* Admin Notes */}
              <form.Field
                name="adminNotes"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Admin Notes (optional)</Label>
                    <Textarea
                      id={field.name}
                      rows={3}
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Internal notes visible only to admins..."
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
        </div>
      </div>
    </div>
  )
}
