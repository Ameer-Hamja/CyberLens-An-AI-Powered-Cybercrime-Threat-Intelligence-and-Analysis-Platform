import clsx from "clsx";
export default function Card({ children, className, ...props }) {
  return (
    <section className={clsx("card", className)} {...props}>
      {children}
    </section>
  );
}
export function CardHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-6">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
