import { Link, useRouterState } from '@tanstack/react-router'
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  Package,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { authClient } from '#/lib/auth-client'
import { cn, getInitials } from '#/lib/utils'

const NAV_ITEMS = [
  { to: '/' as const, label: 'Home' },
  { to: '/products' as const, label: 'Products' },
  { to: '/custom' as const, label: 'Upload & Quote' },
  { to: '/about' as const, label: 'About' },
]

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#16110A" />
      <rect x="9" y="10" width="3.2" height="20" fill="#FFC23C" />
      <rect x="27.8" y="10" width="3.2" height="20" fill="#5BB8FF" />
      <rect x="9" y="18.5" width="22" height="3" fill="#FFFDF7" />
      <circle cx="32" cy="9" r="1.5" fill="#FFC23C" />
    </svg>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const user = session?.user

  const close = () => setMobileOpen(false)

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/'
  }

  function isActive(to: string) {
    return to === '/' ? pathname === '/' : pathname.startsWith(to)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-paper/90 backdrop-blur-sm border-b border-line">
      <div className="mx-auto flex max-w-360 items-center gap-8 px-8 py-3.5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <LogoMark size={32} />
          <div className="flex flex-col leading-none gap-0.5">
            <span className="font-display font-black text-ink text-[18px] font-stretch-75% tracking-[-0.03em]">
              Horizon 3D
            </span>
            <span className="t-mono text-fog text-[9.5px] tracking-[0.18em]">
              PRINT · MAKE · SHIP
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'px-4 py-2.25 rounded-full text-sm font-medium transition-all',
                isActive(item.to)
                  ? 'bg-ink text-paper'
                  : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2">
          <Link to="/cart" className="relative btn btn-ghost btn-sm">
            <ShoppingCart size={18} className="text-ink" />
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-paper-2 transition-colors focus:outline-none">
                  <Avatar className="size-8 border-[1.5px] border-line">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-xs font-bold text-paper bg-sky">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block text-sm font-semibold text-ink">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border border-line rounded-xl shadow-md"
              >
                <DropdownMenuItem asChild>
                  <Link
                    to="/account/orders"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Package className="size-4" /> My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/account"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="size-4" /> Account
                  </Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 cursor-pointer font-semibold text-sky"
                      >
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
          )}

          <Link to="/custom" className="btn btn-accent btn-sm">
            Start Printing
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Mobile hamburger — only item visible on mobile besides logo */}
        <button
          className="lg:hidden p-2 rounded-full hover:bg-paper-2 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-line px-5 py-4 flex flex-col gap-1">
          {/* Nav links */}
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'px-4 py-3 rounded-full text-sm font-medium transition-all',
                isActive(item.to)
                  ? 'bg-ink text-paper'
                  : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
              )}
              onClick={close}
            >
              {item.label}
            </Link>
          ))}

          <div className="border-t border-line mt-3 pt-4 flex flex-col gap-1">
            {/* Cart */}
            <Link
              to="/cart"
              className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-ink-2 hover:bg-paper-2 transition-all"
              onClick={close}
            >
              <ShoppingCart size={16} />
              Cart
            </Link>

            {/* Auth */}
            {user ? (
              <>
                <Link
                  to="/account/orders"
                  className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-ink-2 hover:bg-paper-2 transition-all"
                  onClick={close}
                >
                  <Package size={16} /> My Orders
                </Link>
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-ink-2 hover:bg-paper-2 transition-all"
                  onClick={close}
                >
                  <Settings size={16} /> Account
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold text-sky hover:bg-paper-2 transition-all"
                    onClick={close}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-destructive hover:bg-paper-2 transition-all text-left w-full"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-ink-2 hover:bg-paper-2 transition-all"
                onClick={close}
              >
                Sign In
              </Link>
            )}

            <Link
              to="/custom"
              className="btn btn-accent btn-sm w-full justify-center mt-2"
              onClick={close}
            >
              Start Printing
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
