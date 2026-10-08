import { useId } from "react";
import { categoryColors, categoryLabel } from "../../utils/intelligence";
import EmptyState from "../ui/EmptyState";
export function IncidentLineChart({ rows, height = 224 }) {
  const id = useId().replace(/:/g, "");
  const max = Math.max(...rows.map((row) => row.count), 1);
  const top = 20,
    bottom = 180;
  const points = rows.map((row, index) => ({
    x: 48 + (index / Math.max(rows.length - 1, 1)) * 648,
    y: bottom - (row.count / max) * (bottom - top),
    ...row,
  }));
  const line = points
    .map((p, index) => `${index ? "L" : "M"}${p.x},${p.y}`)
    .join(" ");
  return (
    <div className="w-full" style={{ minHeight: height }}>
      <svg
        viewBox="0 0 720 224"
        role="img"
        aria-label="Incidents recorded per day"
        className="w-full"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity=".2" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio}>
            <line
              x1="48"
              x2="696"
              y1={bottom - ratio * (bottom - top)}
              y2={bottom - ratio * (bottom - top)}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeDasharray="3 6"
            />
            <text
              x="32"
              y={bottom - ratio * (bottom - top) + 4}
              textAnchor="end"
              className="fill-slate-600 dark:fill-slate-400 font-mono text-[10px]"
            >
              {Math.round(max * ratio)}
            </text>
          </g>
        ))}
        <path
          d={`${line} L696,${bottom} L48,${bottom} Z`}
          fill={`url(#${id})`}
        />
        <path
          d={line}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {points.map((p, index) => (
          <g key={p.date}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-cyan-400 stroke-white dark:stroke-slate-900"
              strokeWidth="2"
            >
              <title>
                {p.date}: {p.count} incidents
              </title>
            </circle>
            {(index === 0 ||
              index === points.length - 1 ||
              index % Math.max(1, Math.ceil(points.length / 6)) === 0) && (
              <text
                x={p.x}
                y="211"
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-400 font-mono text-[10px]"
              >
                {new Date(p.date + "T12:00:00").toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="sr-only">
        {rows.map((row) => (
          <p key={row.date}>
            {row.date}: {row.count} incidents
          </p>
        ))}
      </div>
    </div>
  );
}
export function CategoryDonut({ data }) {
  const entries = Object.entries(data || {})
    .map(([type, stats]) => ({
      type,
      count: typeof stats === "number" ? stats : stats.count || 0,
    }))
    .filter((item) => item.count)
    .sort((a, b) => b.count - a.count);
  const total = entries.reduce((sum, item) => sum + item.count, 0);
  let offset = 0;
  if (!total) return <EmptyState title="No categories yet" />;
  return (
    <div>
      <div className="relative mx-auto h-48 w-48">
        <svg
          viewBox="0 0 200 200"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label="Incidents by category"
        >
          <circle
            cx="100"
            cy="100"
            r="76"
            fill="none"
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth="20"
          />
          {entries.map((item) => {
            const length = (item.count / total) * 477.52;
            const segment = (
              <circle
                key={item.type}
                cx="100"
                cy="100"
                r="76"
                fill="none"
                stroke={categoryColors[item.type] || "#64748b"}
                strokeWidth="20"
                strokeDasharray={`${Math.max(length - 3, 0)} ${477.52 - Math.max(length - 3, 0)}`}
                strokeDashoffset={-offset}
              >
                <title>
                  {categoryLabel(item.type)}: {item.count}
                </title>
              </circle>
            );
            offset += length;
            return segment;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold">
            {total.toLocaleString("en-IN")}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
            incidents
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {entries.slice(0, 4).map((item) => (
          <div key={item.type} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: categoryColors[item.type] || "#64748b",
              }}
            />
            <span className="flex-1 text-slate-600 dark:text-slate-400">
              {categoryLabel(item.type)}
            </span>
            <span className="font-mono">
              {Math.round((item.count / total) * 100)}%
            </span>
            <span className="w-8 text-right font-mono text-slate-600 dark:text-slate-400">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function StateBars({ data }) {
  const rows = [...(data || [])].sort((a, b) => b.count - a.count).slice(0, 5),
    max = Math.max(...rows.map((row) => row.count), 1);
  return rows.length ? (
    <div className="space-y-5">
      {rows.map((row, index) => (
        <div key={row.stateName}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              <span className="mr-3 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                0{index + 1}
              </span>
              {row.stateName}
            </span>
            <span className="font-mono">{row.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-[width] duration-700"
              style={{ width: (row.count / max) * 100 + "%" }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <EmptyState title="No state data yet" />
  );
}
