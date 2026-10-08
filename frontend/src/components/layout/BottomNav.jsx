import { NavLink } from "react-router-dom";
import { LayoutDashboard, Map, ListFilter, ScanLine, Menu } from "lucide-react";
import clsx from "clsx";
export default function BottomNav({ onMenu }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
    >
      {[
        { to: "/", label: "Overview", icon: LayoutDashboard },
        { to: "/heatmap", label: "Map", icon: Map },
        { to: "/incidents", label: "Incidents", icon: ListFilter },
        { to: "/scan", label: "Checker", icon: ScanLine },
      ].map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            clsx(
              "flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[10px]",
              isActive
                ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                : "text-slate-600 dark:text-slate-400",
            )
          }
        >
          <Icon size={19} />
          {label}
        </NavLink>
      ))}
      <button
        onClick={onMenu}
        className="flex min-h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] text-slate-600 dark:text-slate-400"
        aria-label="More navigation"
      >
        <Menu size={19} />
        More
      </button>
    </nav>
  );
}
