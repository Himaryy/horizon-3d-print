import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { getAdminProductByIdFn, updateProductFn } from '#/data/product'
import { toast } from 'sonner'
import { Button, buttonVariants } from '#/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Switch } from '#/components/ui/switch'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { updateProductSchema } from '#/schemas/product-schemas'

const toSlug = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const Route = createFileRoute('/admin/products/$id/update-product')({
  loader: ({ params }) => getAdminProductByIdFn({ data: { id: params.id } }),
  component: UpdateProductPage,
})

function UpdateProductPage() {
  const product = Route.useLoaderData()
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      id,
      slug: product.slug,
      name: product.name,
      desc: product.desc,
      price: product.price,
      stock: product.stock,
      category: product.category as 'READY_MADE' | 'CUSTOM_BASE',
      isPublished: product.isPublished,
      isFeatured: product.isFeatured,
      modelUrl: product.modelUrl ?? '',
      videoUrl: product.videoUrl ?? '',
      tokopediaUrl: product.tokopediaUrl ?? '',
      shopeeUrl: product.shopeeUrl ?? '',
    },
    validators: {
      onSubmit: updateProductSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProductFn({ data: value })
        toast.success('Product updated')
        navigate({ to: '/admin/products', search: { page: 1 } })
      } catch {
        toast.error('Failed to update product')
      }
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          search={{ page: 1 }}
          to="/admin/products"
          className={buttonVariants({
            size: 'icon',
            variant: 'ghost',
          })}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div>
          <h1 className="text-3xl text-ink">Update Product</h1>
          <p className="mt-1 text-sm text-fog">Edit product details</p>
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
          {/* LEFT */}
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Basic Info</p>

              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        form.setFieldValue('slug', toSlug(e.target.value))
                      }}
                      onBlur={field.handleBlur}
                      placeholder="Articulated Dragon"
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
                name="slug"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Slug</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      readOnly
                      placeholder="articulated-dragon"
                    />
                  </div>
                )}
              />

              <form.Field
                name="category"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                        field.handleChange(v as 'READY_MADE' | 'CUSTOM_BASE')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READY_MADE">Ready Made</SelectItem>
                        <SelectItem value="CUSTOM_BASE">Custom Base</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>

            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Pricing & Stock</p>
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="price"
                  children={(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Price (IDR)</Label>
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
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-red-500">
                          {field.state.meta.errors[0]?.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <form.Field
                  name="stock"
                  children={(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>Stock</Label>
                      <Input
                        id={field.name}
                        type="number"
                        min={0}
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
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Settings</p>

              <form.Field
                name="isPublished"
                children={(field) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        Published
                      </p>
                      <p className="text-xs text-fog">Visible to customers</p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              />

              <form.Field
                name="isFeatured"
                children={(field) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Featured</p>
                      <p className="text-xs text-fog">Show on homepage</p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Description</p>

              <form.Field
                name="desc"
                children={(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      rows={6}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-500">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="card p-5 space-y-4">
              <p className="t-eyebrow">Links (optional)</p>

              {(
                [
                  { name: 'modelUrl', label: '3D Model URL' },
                  { name: 'videoUrl', label: 'Video URL' },
                  { name: 'tokopediaUrl', label: 'Tokopedia URL' },
                  { name: 'shopeeUrl', label: 'Shopee URL' },
                ] as const
              ).map(({ name, label }) => (
                <form.Field
                  key={name}
                  name={name}
                  children={(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name}>{label}</Label>
                      <Input
                        id={field.name}
                        type="url"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="https://"
                      />
                    </div>
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to="/admin/products"
            search={{ page: 1 }}
            className={buttonVariants({
              variant: 'outline',
              className: 'hover:bg-destructive',
            })}
          >
            Cancel
          </Link>

          <form.Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gold hover:bg-gold/90 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  )
}
