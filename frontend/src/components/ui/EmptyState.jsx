import { SearchX } from "lucide-react";
import Button from "./Button";
export default function EmptyState({
  title = "No incidents found",
  description = "Try widening your filters or check back for new intelligence.",
  onRetry,
  action,
  error = false,
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className="flex min-h-56 flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-800">
        <SearchX className="h-6 w-6 text-slate-600 dark:text-slate-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
      {action}
    </div>
  );
}
