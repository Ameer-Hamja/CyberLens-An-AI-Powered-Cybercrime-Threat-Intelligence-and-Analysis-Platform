import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ScanLine,
  Activity,
  Radio,
  ArrowRight,
  RefreshCw,
  Globe2,
} from "lucide-react";
import Card, { CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Skeleton, { CardSkeleton } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import PageHeading from "../components/ui/PageHeading";
import {
  IncidentLineChart,
  CategoryDonut,
  StateBars,
} from "../components/charts/IntelligenceCharts";
import IncidentFeed from "../components/dashboard/IncidentFeed";
import { useStats } from "../hooks/useStats";
import { useTrends } from "../hooks/useTrends";
import { useResource } from "../hooks/useResource";
import { fetchStatsByType } from "../api/stats";
import { fetchHeatmapData } from "../api/threats";
import { useIntelligence } from "../context/IntelligenceContext";
import { useSocket } from "../context/WebSocketContext";
import { useToast } from "../components/ui/Toast";
import { trendRows } from "../utils/intelligence";
export default function Dashboard() {
  const stats = useStats(),
    [days, setDays] = useState(14),
    trends = useTrends(days),
    types = useResource(fetchStatsByType),
    states = useResource(fetchHeatmapData),
    feed = useIntelligence(),
    { connected } = useSocket(),
    toast = useToast();
  const rows = useMemo(() => trendRows(trends.data, days), [trends.data, days]);
  const today = rows.at(-1)?.count || 0,
    yesterday = rows.at(-2)?.count || 0,
    week = rows.slice(-7).reduce((sum, row) => sum + row.count, 0),
    prior = rows.slice(-14, -7).reduce((sum, row) => sum + row.count, 0);
  const delta = prior ? Math.round(((week - prior) / prior) * 100) : null;
  const metrics = [
    {
      label: "Total incidents",
      value: stats.stats?.totalThreats,
      icon: Shield,
      tone: "cyan",
      detail:
        delta === null
          ? "Historical comparison unavailable"
          : `${Math.abs(delta)}% vs previous 7 days`,
      direction: delta,
    },
    {
      label: "Recorded today (UTC)",
      value: stats.stats?.threatsToday,
      icon: Activity,
      tone: "emerald",
      detail: `${today - yesterday >= 0 ? "+" : ""}${today - yesterday} vs yesterday`,
      direction: today - yesterday,
    },
    {
      label: "High severity",
      value: stats.stats?.highSeverityCount,
      icon: Radio,
      tone: "red",
      detail: "Severity 4–5 · requires attention",
      direction: null,
    },
    {
      label: "Scans completed",
      value: stats.stats?.totalScans,
      icon: ScanLine,
      tone: "violet",
      detail: "Text, links & image analysis",
      direction: null,
    },
  ];
  async function refresh() {
    const results = await Promise.all([
      stats.reload(),
      trends.reload(),
      types.reload(),
      states.reload(),
      feed.reload(),
    ]);
    toast(
      results.every(Boolean)
        ? "Dashboard refreshed."
        : "Some intelligence could not be refreshed.",
      results.every(Boolean) ? "success" : "error",
    );
  }
  return (
    <div className="space-y-6">
      <PageHeading
        title="Intelligence overview"
        description="A clearer picture of India’s evolving cyber threat landscape."
        action={
          <Button variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw size={14} />
            Refresh intelligence
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-700 dark:text-slate-200">
            Your intelligence workspace is {connected ? "live" : "reconnecting"}
            .
          </span>{" "}
          <span className="hidden sm:inline">
            Monitoring incidents across India.
          </span>
        </p>
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      {stats.error && (
        <Card>
          <EmptyState
            error
            title="Statistics unavailable"
            description={stats.error}
            onRetry={stats.reload}
          />
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone, detail, direction }) =>
          stats.loading && !stats.stats ? (
            <CardSkeleton key={label} />
          ) : (
            <Card key={label} className="relative overflow-hidden p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {label}
                </p>
                <span
                  className={
                    {
                      cyan: "text-cyan-500",
                      emerald: "text-emerald-500",
                      red: "text-red-400",
                      violet: "text-violet-400",
                    }[tone]
                  }
                >
                  <Icon size={17} />
                </span>
              </div>
              <p className="mt-4 font-mono text-2xl font-medium tracking-tight sm:text-3xl">
                {value == null ? "—" : value.toLocaleString("en-IN")}
              </p>
              <div className="mt-4 flex items-start gap-1.5 text-[10px] text-slate-600 dark:text-slate-400">
                {direction === null ? (
                  <Minus size={12} className="mt-0.5 shrink-0" />
                ) : direction >= 0 ? (
                  <ArrowUpRight size={13} className="shrink-0 text-cyan-500" />
                ) : (
                  <ArrowDownRight
                    size={13}
                    className="shrink-0 text-emerald-500"
                  />
                )}
                {detail}
              </div>
            </Card>
          ),
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Incident activity"
            description="Daily reports across all categories · UTC"
            action={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                {[7, 14, 30].map((value) => (
                  <button
                    key={value}
                    onClick={() => setDays(value)}
                    aria-pressed={days === value}
                    className={
                      "rounded-md px-3 py-1.5 font-mono text-[10px] transition-colors " +
                      (days === value
                        ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-300"
                        : "text-slate-600 dark:text-slate-400")
                    }
                  >
                    {value}D
                  </button>
                ))}
              </div>
            }
          />
          <div className="min-h-64 px-6 pb-4">
            {trends.loading ? (
              <Skeleton className="h-56 w-full" />
            ) : trends.error ? (
              <EmptyState
                error
                title="Activity unavailable"
                description={trends.error}
                onRetry={trends.reload}
              />
            ) : (
              <IncidentLineChart rows={rows} />
            )}
          </div>
          <div className="flex items-center gap-6 border-t border-slate-200 px-6 py-4 text-[10px] dark:border-slate-800">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="h-1.5 w-4 rounded-full bg-cyan-400" />
              Recorded incidents
            </span>
            <span className="ml-auto font-mono text-slate-600 dark:text-slate-400">
              {rows.reduce((sum, row) => sum + row.count, 0)} IN PERIOD
            </span>
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Threat distribution"
            description="Breakdown by category"
          />
          <div className="min-h-80 px-6 pb-6">
            {types.loading ? (
              <Skeleton className="mx-auto h-64 w-full" />
            ) : types.error ? (
              <EmptyState
                error
                title="Categories unavailable"
                onRetry={types.reload}
              />
            ) : (
              <CategoryDonut data={types.data} />
            )}
          </div>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Live alert feed"
            description="Latest intelligence, as it arrives"
            action={
              <Badge tone={connected ? "emerald" : "amber"} dot>
                {connected ? "Live" : "Reconnecting"}
              </Badge>
            }
          />
          <div className="min-h-80">
            {feed.loading && !feed.incidents.length ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-14 w-full" />
                ))}
              </div>
            ) : feed.error ? (
              <EmptyState
                error
                title="Feed unavailable"
                description={feed.error}
                onRetry={feed.reload}
              />
            ) : feed.incidents.length ? (
              <IncidentFeed incidents={feed.incidents.slice(0, 4)} />
            ) : (
              <EmptyState />
            )}
          </div>
          <Link
            to="/incidents"
            className="flex items-center justify-center gap-2 border-t border-slate-200 px-6 py-4 text-xs font-medium text-cyan-700 hover:bg-cyan-500/5 dark:border-slate-800 dark:text-cyan-400"
          >
            View all incidents <ArrowRight size={14} />
          </Link>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Most affected states"
              description="Incident density by region"
            />
            <div className="min-h-64 px-6 pb-6">
              {states.loading ? (
                <Skeleton className="h-56 w-full" />
              ) : states.error ? (
                <EmptyState
                  error
                  title="States unavailable"
                  onRetry={states.reload}
                />
              ) : (
                <StateBars data={states.data} />
              )}
            </div>
          </Card>
          <Link
            to="/heatmap"
            className="card group flex items-center gap-4 p-5"
          >
            <span className="rounded-xl bg-cyan-500/10 p-3 text-cyan-500">
              <Globe2 size={22} />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-semibold">
                Explore the live threat map
              </span>
              <span className="mt-1 block text-[11px] text-slate-600 dark:text-slate-400">
                Signals across India, in context
              </span>
            </span>
            <ArrowUpRight
              size={18}
              className="text-slate-600 dark:text-slate-400 group-hover:text-cyan-500"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
