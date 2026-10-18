import { NavLink, Outlet } from 'react-router'
import { LogOut } from 'lucide-react'
import { KillSwitchControl } from '@/components/KillSwitchControl'
import { ModeBadge } from '@/components/ModeBadge'
import { Button } from '@/components/ui/button'
import { navItems } from '@/app/nav'
import { useAuth } from '@/lib/auth-context'
import { useKillSwitch } from '@/lib/queries'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { logout } = useAuth()
  const killSwitch = useKillSwitch()

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="border-b bg-sidebar text-sidebar-foreground md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-14 items-center gap-2 px-4 font-semibold">
          <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">AQTA</span>
          <span className="text-sm">Quant Desk</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible">
          {navItems.map(({ to, label, icon: Icon, ready }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                  !ready && 'opacity-70',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <ModeBadge />
          <div className="flex-1" />
          <KillSwitchControl />
          <Button variant="ghost" size="sm" onClick={logout} title="Sign out">
            <LogOut />
            <span className="sr-only md:not-sr-only">Sign out</span>
          </Button>
        </header>

        {killSwitch.data?.active && (
          <div role="alert" className="bg-destructive px-4 py-2 text-sm font-medium text-white">
            Kill switch is ON: new proposals and orders are blocked
            {killSwitch.data.reason ? ` (${killSwitch.data.reason})` : ''}.
          </div>
        )}
        {killSwitch.isError && (
          <div role="alert" className="bg-destructive px-4 py-2 text-sm font-medium text-white">
            Cannot read kill switch state. Treat trading as blocked until the backend is reachable.
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
