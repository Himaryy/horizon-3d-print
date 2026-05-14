import type { OrderSourceEnum, OrderStatusEnum } from '#/schemas/order-schemas'

export const STATUS_FILTERS: Array<{
  value: OrderStatusEnum | undefined
  label: string
}> = [
  { value: undefined, label: 'All' },
  { value: 'PENDING_PAYMENT', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PRINTING', label: 'Printing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export const SOURCE_FILTERS: Array<{
  value: OrderSourceEnum | undefined
  label: string
}> = [
  { value: undefined, label: 'All Sources' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'TOKOPEDIA', label: 'Tokopedia' },
  { value: 'SHOPEE', label: 'Shopee' },
]

export const STATUS_STYLE: Record<string, string> = {
  PENDING_PAYMENT: 'chip',
  PAID: 'chip chip-sky',
  PROCESSING: 'chip chip-sky',
  PRINTING: 'chip chip-gold',
  SHIPPED: 'chip chip-gold',
  DELIVERED: 'chip chip-ink',
  CANCELLED: 'chip bg-red-100 text-red-700',
  REFUNDED: 'chip',
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  PRINTING: 'Printing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export const SOURCE_STYLE: Record<string, string> = {
  WEBSITE: 'chip chip-sky',
  TOKOPEDIA: 'chip bg-green-100 text-green-700',
  SHOPEE: 'chip bg-orange-100 text-orange-700',
}

export const SOURCE_LABEL: Record<string, string> = {
  WEBSITE: 'Website',
  TOKOPEDIA: 'Tokopedia',
  SHOPEE: 'Shopee',
}

export const SOURCE_OPTIONS = SOURCE_FILTERS.filter(
  (f): f is { value: NonNullable<typeof f.value>; label: string } =>
    f.value !== undefined,
)

export const STATUS_OPTIONS = STATUS_FILTERS.filter(
  (f): f is { value: NonNullable<typeof f.value>; label: string } =>
    f.value !== undefined,
)
