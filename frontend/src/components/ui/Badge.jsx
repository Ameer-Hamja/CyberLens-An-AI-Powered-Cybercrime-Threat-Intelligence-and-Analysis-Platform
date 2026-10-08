import clsx from "clsx";
const tones = {
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  emerald:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  red: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  slate:
    "border-slate-300/60 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};
export default function Badge({
  tone = "slate",
  dot = false,
  children,
  className,
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
export function SeverityBadge({ severity }) {
  return (
    <Badge
      dot
      tone={severity >= 4 ? "red" : severity === 3 ? "amber" : "emerald"}
    >
      {{ 1: "Very low", 2: "Low", 3: "Medium", 4: "High", 5: "Critical" }[
        severity
      ] || "Unrated"}
    </Badge>
  );
}
