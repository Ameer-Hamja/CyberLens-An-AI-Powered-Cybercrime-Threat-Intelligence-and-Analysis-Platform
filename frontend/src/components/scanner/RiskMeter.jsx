import { useEffect, useState } from "react";
import clsx from "clsx";
export default function RiskMeter({
  score = 0,
  pending = false,
  empty = false,
}) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const target = Math.min(100, Math.max(0, Number(score) || 0));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(target);
      return;
    }
    let frame, start;
    function step(timestamp) {
      start ??= timestamp;
      const progress = Math.min((timestamp - start) / 900, 1);
      setDisplayed(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);
  const color =
    displayed >= 80
      ? "#f87171"
      : displayed >= 60
        ? "#fb923c"
        : displayed >= 40
          ? "#fbbf24"
          : "#34d399";
  const label =
    displayed >= 80
      ? "Critical risk"
      : displayed >= 60
        ? "High risk"
        : displayed >= 40
          ? "Moderate risk"
          : "Low risk";
  return (
    <div
      className="relative mx-auto w-full max-w-64"
      role="img"
      aria-label={
        pending
          ? "Analyzing risk"
          : empty
            ? "Awaiting analysis"
            : `Risk score ${score} out of 100, ${label}`
      }
    >
      <svg viewBox="0 0 240 160" className="w-full">
        <path
          d="M 24 120 A 96 96 0 0 1 216 120"
          fill="none"
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 24 120 A 96 96 0 0 1 216 120"
          fill="none"
          stroke={empty || pending ? "#06b6d4" : color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray="301.6"
          strokeDashoffset={
            301.6 - (pending ? 0.5 : empty ? 0 : displayed / 100) * 301.6
          }
          className={pending ? "animate-pulse" : ""}
        />
        <text
          x="120"
          y="99"
          textAnchor="middle"
          className="fill-slate-900 font-mono text-[38px] font-medium dark:fill-white"
        >
          {pending ? "…" : empty ? "—" : displayed}
        </text>
        <text
          x="120"
          y="123"
          textAnchor="middle"
          className="fill-slate-600 dark:fill-slate-400 font-mono text-[10px]"
        >
          RISK SCORE / 100
        </text>
        <text
          x="24"
          y="150"
          textAnchor="middle"
          className="fill-slate-600 dark:fill-slate-400 font-mono text-[9px]"
        >
          0
        </text>
        <text
          x="216"
          y="150"
          textAnchor="middle"
          className="fill-slate-600 dark:fill-slate-400 font-mono text-[9px]"
        >
          100
        </text>
      </svg>
      <p
        className={clsx(
          "text-center text-xs font-medium",
          empty || pending
            ? "text-slate-600 dark:text-slate-400"
            : displayed >= 60
              ? "text-red-600 dark:text-red-400"
              : displayed >= 40
                ? "text-amber-700 dark:text-amber-400"
                : "text-emerald-700 dark:text-emerald-400",
        )}
      >
        {pending
          ? "Analyzing the signals…"
          : empty
            ? "Your analysis will appear here"
            : label}
      </p>
    </div>
  );
}
