import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { authClient } from '#/lib/auth-client'
import { cn, getInitials } from '#/lib/utils'
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Printer,
  ShoppingCart,
  Users,
  Wand2,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/admin')({ component: AdminPage })

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: Wand2 },
  { to: '/admin/customers', label: 'Customers', icon: Users },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const user = session?.user

  async function handleLogout() {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex h-full flex-col bg-ink text-white-warm">
      <div className="flex items-center gap-2 border-b border-white-warm/10 px-6 py-5">
        <Printer className="text-gold size-5" />
        <span className="font-display text-lg">
          Horizon <span className="text-gold">Admin</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === '/admin'
              ? pathname === '/admin' || pathname === '/admin/'
              : pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-gold/15 text-gold'
                  : 'text-white-warm/60 hover:bg-white-warm/5 hover:text-white-warm',
              )}
            >
              <Icon className="size-4.5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white-warm/10 px-3 py-4 space-y-1">
        <Link
          to="/"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white-warm/40 transition-colors hover:text-white-warm/70"
        >
          <ArrowLeft className="size-4.5" />
          Back to Store
        </Link>

        {user && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-gold/20 text-gold text-xs font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white-warm">
                {user.name}
              </p>
              <p className="truncate text-xs text-white-warm/40">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="shrink-0 text-white-warm/30 transition-colors hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex items-center gap-4 border-b border-line bg-white-warm px-4 py-3 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            {/* DEPS FOR WARNING ON INSPECT */}
            <SheetTitle className="sr-only hidden" />
            <SheetDescription aria-describedby={undefined} className="hidden" />
            {/* =============== */}

            <SheetTrigger asChild>
              <Button variant={'outline'} size={'icon'} className="shrink-0">
                <Menu className="size-4.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <SidebarContent onNavClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <span className="font-display text-base">
            Horizon <span className="text-gold">Admin</span>
          </span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
