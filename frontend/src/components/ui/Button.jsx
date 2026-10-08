import { forwardRef } from "react";
import clsx from "clsx";
const Button = forwardRef(function Button(
  { variant = "primary", size = "md", className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-slate-950",
        size === "sm" ? "min-h-9 px-3 text-xs" : "min-h-11 px-4 text-sm",
        {
          primary:
            "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/10 hover:bg-cyan-400",
          secondary:
            "border border-slate-200 bg-white/60 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800",
          ghost:
            "text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
          danger:
            "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
        }[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
export default Button;
