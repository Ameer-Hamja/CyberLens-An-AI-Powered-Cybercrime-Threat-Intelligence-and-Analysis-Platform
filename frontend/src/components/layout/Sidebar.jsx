import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Search, Shield, ScanLine } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scan',      label: 'Scanner',   icon: ScanLine        },
  { to: '/trends',    label: 'Trends',    icon: TrendingUp },
  { to: '/search',    label: 'Search',    icon: Search },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-16 lg:w-56 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
      <div className="h-14 flex items-center justify-center lg:px-6 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-400" />
          <span className="hidden lg:block text-sm font-bold text-white tracking-tight">
            CrimeLens
          </span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              location.pathname === to
                ? 'bg-brand-500/10 text-brand-400 font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-2 border-t border-slate-800">
        <div className="hidden lg:block text-[10px] text-slate-600 text-center">
          v1.0.0
        </div>
      </div>
    </aside>
  )
}
