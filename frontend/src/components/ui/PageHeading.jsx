export default function PageHeading({
  eyebrow = "CYBERLENS INTELLIGENCE",
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-3 font-mono text-[10px] font-medium tracking-[0.2em] text-cyan-700 dark:text-cyan-400">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
