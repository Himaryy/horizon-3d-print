import { Button, buttonVariants } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  adminProductQueryOptions,
  softDeleteProductFn,
  togglePublishFn,
} from '#/data/product'
import { cn } from '#/lib/utils'
import { validateSearchProductSchema } from '#/schemas/product-schemas'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import React, { useRef } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import { formatIDR } from '#/lib/format'
import { Switch } from '#/components/ui/switch'

export const Route = createFileRoute('/admin/products/')({
  validateSearch: validateSearchProductSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(adminProductQueryOptions(deps)),
  component: AdminProductPage,
})

const CATEGORY_FILTERS: Array<{
  value: 'READY_MADE' | 'CUSTOM_BASE' | undefined
  label: string
}> = [
  { value: undefined, label: 'All' },
  { value: 'READY_MADE', label: 'Ready Made' },
  { value: 'CUSTOM_BASE', label: 'Custom Base' },
]

function AdminProductPage() {
  const { page, category, search } = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/products/' })

  const queryClient = useQueryClient()
  const searchRef = useRef<HTMLInputElement>(null)

  const {
    data: { products, pages },
    isFetching,
  } = useSuspenseQuery(adminProductQueryOptions({ page, search, category }))

  const { mutate: togglePublish } = useMutation({
    mutationFn: (id: string) =>
      togglePublishFn({
        data: { id },
      }),
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({
        queryKey: ['admin', 'products'],
      })
    },
    onError: () => toast.error('Failed to updated status'),
  })

  const { mutate: deleteProduct } = useMutation({
    mutationFn: (id: string) =>
      softDeleteProductFn({
        data: { id },
      }),
    onSuccess: () => {
      toast.success('Product deleted')
      queryClient.invalidateQueries({
        queryKey: ['admin', 'products'],
      })
    },
    onError: () => toast.error('Failed to delete'),
  })

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
          <h1 className="text-3xl text-ink">Products</h1>
          <p className="mt-1 text-sm text-fog">Manage your product catalog.</p>
        </div>

        <Link
          to="/admin/products/new-product"
          className={cn(
            buttonVariants(),
            'btn btn-accent rounded-l-none rounded-r-full h-10 px-5 shrink-0',
          )}
        >
          <Plus className="size-4" />
          New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            ref={searchRef}
            defaultValue={search}
            placeholder="Search products..."
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
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, category: f.value, page: 1 }),
                  })
                }
                className={cn('chip', category === f.value && 'chip-ink')}
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
              <TableHead className="px-10">Product</TableHead>
              <TableHead className="px-10">Category</TableHead>
              <TableHead className="px-10">Price</TableHead>
              <TableHead className="px-10">Stock</TableHead>
              <TableHead className="px-10">Published</TableHead>
              <TableHead className="px-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Loader2 className="size-5 animate-spin text-fog mx-auto" />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-fog">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-10">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        <img
                          src={p.images[0].url}
                          alt={p.images[0].alt}
                          className="size-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="size-10 rounded-lg bg-paper-2" />
                      )}
                      <div>
                        <p className="font-semibold text-ink">{p.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-10">
                    <span
                      className={cn(
                        'chip',
                        p.category === 'READY_MADE' ? 'chip-sky' : 'chip-gold',
                      )}
                    >
                      {p.category === 'READY_MADE'
                        ? 'Ready Made'
                        : 'Custom Base'}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-ink px-10">
                    {formatIDR(p.price)}
                  </TableCell>
                  <TableCell className="text-fog px-10">{p.stock}</TableCell>
                  <TableCell className="px-10">
                    <Switch
                      checked={p.isPublished}
                      onCheckedChange={() => togglePublish(p.id)}
                    />
                  </TableCell>
                  <TableCell className="px-10">
                    <div className="flex items-center gap-1">
                      <Link
                        to="/admin/products/$id/update-product"
                        params={{ id: p.id }}
                        className={buttonVariants({
                          variant: 'ghost',
                          size: 'icon',
                        })}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <span className="font-semibold text-ink">
                                {p.name}
                              </span>{' '}
                              will be removed from the catalog. This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => deleteProduct(p.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
