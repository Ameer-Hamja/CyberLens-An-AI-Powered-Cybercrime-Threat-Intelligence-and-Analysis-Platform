import clsx from "clsx";
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse rounded-lg bg-slate-200/80 motion-reduce:animate-none dark:bg-slate-800/80",
        className,
      )}
    />
  );
}
export function CardSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="card space-y-6 p-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-3 w-44" />
    </div>
  );
}
