import { NavLink, Link } from "react-router-dom";
import {
  Shield,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  LockKeyhole,
} from "lucide-react";
import clsx from "clsx";
import { navigation } from "./navigation";
export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={clsx(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-slate-200 bg-white/80 transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-950 md:flex",
        collapsed ? "w-20" : "w-60",
      )}
    >
      <Link
        to="/"
        aria-label="CyberLens overview"
        className="flex h-20 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
          <Shield size={21} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-white dark:ring-slate-950" />
        </span>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">
            Cyber<span className="text-cyan-700 dark:text-cyan-400">Lens</span>
            <span className="mt-0.5 block font-mono text-[8px] font-normal tracking-[0.22em] text-slate-600 dark:text-slate-400">
              THREAT INTELLIGENCE
            </span>
          </span>
        )}
      </Link>
      <div className="flex-1 px-3 py-8">
        {!collapsed && (
          <p className="mb-4 px-3 font-mono text-[9px] tracking-[0.16em] text-slate-600 dark:text-slate-400">
            WORKSPACE
          </p>
        )}
        <nav aria-label="Main navigation" className="space-y-2">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              title={collapsed ? label : undefined}
              aria-label={label}
              className={({ isActive }) =>
                clsx(
                  "group flex min-h-11 items-center gap-3 rounded-xl border px-3 text-xs font-medium transition-colors",
                  isActive
                    ? "border-cyan-500/15 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
      {!collapsed && (
        <div className="mx-4 mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <LockKeyhole size={18} className="mb-3 text-emerald-500" />
          <p className="text-xs font-semibold">Stay one step ahead.</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Recognize the signals. Protect your digital life.
          </p>
          <Link
            to="/awareness"
            className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          >
            Explore resources <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className="flex min-h-14 items-center justify-center gap-2 border-t border-slate-200 text-xs text-slate-600 dark:text-slate-400 hover:text-cyan-500 dark:border-slate-800"
      >
        {collapsed ? (
          <ChevronsRight size={18} />
        ) : (
          <>
            <ChevronsLeft size={18} /> Collapse sidebar
          </>
        )}
      </button>
    </aside>
  );
}
