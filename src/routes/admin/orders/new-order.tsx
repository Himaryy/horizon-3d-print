import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createManualOrderSchema } from '#/schemas/order-schemas'
import type { CreateManualOrderSchema } from '#/schemas/order-schemas'
import { createManualOrderFn } from '#/data/order'
import { getProductsForSelectFn } from '#/data/product'
import { toast } from 'sonner'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import { ArrowLeft, Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react'
import { formatIDR } from '#/lib/format'
import { SOURCE_OPTIONS, STATUS_OPTIONS } from '#/lib/order'
import { useState } from 'react'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin/orders/new-order')({
  loader: () => getProductsForSelectFn(),
  component: NewOrderPage,
})

type Product = { id: string; name: string; price: number }

function ProductCombobox({
  value,
  products,
  onChange,
}: {
  value: string
  products: Product[]
  onChange: (id: string, price: number) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = products.find((p) => p.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.name}
              <span className="text-fog">{formatIDR(selected.price)}</span>
            </span>
          ) : (
            <span className="text-fog">Select product...</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-fog" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    onChange(p.id, p.price)
                    setOpen(false)
                  }}
                  className="data-[selected=true]:bg-transparent"
                >
                  <span className="flex-1">{p.name}</span>
                  <Check
                    className={cn(
                      'ml-2 size-4',
                      value === p.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function NewOrderPage() {
  const products = Route.useLoaderData()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: (value: CreateManualOrderSchema) =>
      createManualOrderFn({ data: value }),
    onSuccess: (result) => {
      toast.success(`Order ${result.invoiceNumber} created`)
      navigate({ to: '/admin/orders', search: { page: 1 } })
    },
    onError: () => toast.error('Failed to create order'),
  })

  const form = useForm({
    defaultValues: {
      source: 'TOKOPEDIA' as 'WEBSITE' | 'TOKOPEDIA' | 'SHOPEE',
      externalOrderId: '',
      customerName: '',
      customerEmail: '',
      status: 'PAID' as
        | 'PENDING_PAYMENT'
        | 'PAID'
        | 'PROCESSING'
        | 'PRINTING'
        | 'SHIPPED'
        | 'DELIVERED'
        | 'CANCELLED'
        | 'REFUNDED',
      shippingCost: 0,
      notes: '',
      shippingAddress: {
        name: '',
        phone: '',
        street: '',
        city: '',
        province: '',
        postal: '',
      },
      items: [{ productId: '', qty: 1, unitPrice: 0 }],
    },
    validators: { onSubmit: createManualOrderSchema },
    onSubmit: ({ value }) => mutate(value),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/orders"
          search={{ page: 1 }}
          className={buttonVariants({ size: 'icon', variant: 'ghost' })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-3xl text-ink">Manual Order</h1>
          <p className="mt-1 text-sm text-fog">
            Record an order from a marketplace
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT — Order info */}
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Order Info</p>

              <form.Field
                name="source"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label>Source</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((s) => (
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
                selector={(s) => s.values.source}
                children={(source) =>
                  source !== 'WEBSITE' ? (
                    <form.Field
                      name="externalOrderId"
                      children={(field) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={field.name}>{source} Order ID</Label>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="INV/123456789/..."
                          />
                        </div>
                      )}
                    />
                  ) : null
                }
              />

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
            </div>

            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Customer</p>

              <form.Field
                name="customerName"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Budi Santoso"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-500">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="customerEmail"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Email (optional)</Label>
                    <Input
                      id={field.name}
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="budi@email.com"
                    />
                  </div>
                )}
              />
            </div>

            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Shipping Address</p>

              {(
                [
                  {
                    name: 'shippingAddress.name',
                    label: 'Recipient Name',
                    placeholder: 'Budi Santoso',
                  },
                  {
                    name: 'shippingAddress.phone',
                    label: 'Phone',
                    placeholder: '08123456789',
                  },
                  {
                    name: 'shippingAddress.street',
                    label: 'Street',
                    placeholder: 'Jl. Merdeka No. 1',
                  },
                  {
                    name: 'shippingAddress.city',
                    label: 'City',
                    placeholder: 'Jakarta',
                  },
                  {
                    name: 'shippingAddress.province',
                    label: 'Province',
                    placeholder: 'DKI Jakarta',
                  },
                  {
                    name: 'shippingAddress.postal',
                    label: 'Postal Code',
                    placeholder: '10110',
                  },
                ] as const
              ).map(({ name, label, placeholder }) => (
                <form.Field
                  key={name}
                  name={name}
                  children={(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>{label}</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={placeholder}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-red-500">
                          {field.state.meta.errors[0]?.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              ))}
            </div>
          </div>

          {/* RIGHT — Items + summary */}
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Items</p>

              <form.Field
                name="items"
                mode="array"
                children={(itemsField) => (
                  <div className="space-y-3">
                    {itemsField.state.value.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-(--paper-2) p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-fog">
                            Item {i + 1}
                          </p>
                          {itemsField.state.value.length > 1 && (
                            <button
                              type="button"
                              onClick={() => itemsField.removeValue(i)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>

                        <form.Field
                          name={`items[${i}].productId`}
                          children={(field) => (
                            <div className="space-y-1.5">
                              <Label>Product</Label>
                              <ProductCombobox
                                value={field.state.value}
                                products={products}
                                onChange={(id, price) => {
                                  field.handleChange(id)
                                  form.setFieldValue(
                                    `items[${i}].unitPrice`,
                                    price,
                                  )
                                }}
                              />
                            </div>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <form.Field
                            name={`items[${i}].qty`}
                            children={(field) => (
                              <div className="space-y-1.5">
                                <Label>Qty</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={field.state.value}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    field.handleChange(e.target.valueAsNumber)
                                  }
                                  onBlur={field.handleBlur}
                                />
                              </div>
                            )}
                          />

                          <form.Field
                            name={`items[${i}].unitPrice`}
                            children={(field) => (
                              <div className="space-y-1.5">
                                <Label>Unit Price (IDR)</Label>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  readOnly
                                  value={
                                    field.state.value === 0
                                      ? ''
                                      : field.state.value.toLocaleString(
                                          'id-ID',
                                        )
                                  }
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /\D/g,
                                      '',
                                    )
                                    field.handleChange(
                                      raw ? parseInt(raw, 10) : 0,
                                    )
                                  }}
                                  onBlur={field.handleBlur}
                                  placeholder="0"
                                />
                              </div>
                            )}
                          />
                        </div>

                        <form.Subscribe
                          selector={(s) => ({
                            qty: s.values.items[i]?.qty ?? 0,
                            price: s.values.items[i]?.unitPrice ?? 0,
                          })}
                          children={({ qty, price }) => (
                            <p className="text-right text-xs text-fog">
                              Subtotal:{' '}
                              <span className="font-mono font-semibold text-ink">
                                {formatIDR(qty * price)}
                              </span>
                            </p>
                          )}
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        itemsField.pushValue({
                          productId: '',
                          qty: 1,
                          unitPrice: 0,
                        })
                      }
                    >
                      <Plus className="size-4" />
                      Add Item
                    </Button>
                  </div>
                )}
              />
            </div>

            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Summary</p>

              <form.Field
                name="shippingCost"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Shipping Cost (IDR)</Label>
                    <Input
                      id={field.name}
                      type="text"
                      inputMode="numeric"
                      value={
                        field.state.value === 0
                          ? ''
                          : field.state.value.toLocaleString('id-ID')
                      }
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '')
                        field.handleChange(raw ? parseInt(raw, 10) : 0)
                      }}
                      onBlur={field.handleBlur}
                      placeholder="0"
                    />
                  </div>
                )}
              />

              <form.Subscribe
                selector={(s) => ({
                  items: s.values.items,
                  shipping: s.values.shippingCost,
                })}
                children={({ items, shipping }) => {
                  const subtotal = items.reduce(
                    (sum, item) => sum + item.unitPrice * item.qty,
                    0,
                  )
                  return (
                    <div className="space-y-1 border-t border-(--paper-2) pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-fog">Subtotal</span>
                        <span className="font-mono text-ink">
                          {formatIDR(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-fog">Shipping</span>
                        <span className="font-mono text-ink">
                          {formatIDR(shipping)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-(--paper-2) pt-1 font-semibold">
                        <span className="text-ink">Total</span>
                        <span className="font-mono text-ink">
                          {formatIDR(subtotal + shipping)}
                        </span>
                      </div>
                    </div>
                  )
                }}
              />
            </div>

            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Notes (optional)</p>
              <form.Field
                name="notes"
                children={(field) => (
                  <Textarea
                    rows={3}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Any notes about this order..."
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to="/admin/orders"
            search={{ page: 1 }}
            className={buttonVariants({ variant: 'outline' })}
          >
            Cancel
          </Link>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-gold hover:bg-gold/90 cursor-pointer"
          >
            {isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
