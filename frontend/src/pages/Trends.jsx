import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import PageHeading from "../components/ui/PageHeading";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import {
  IncidentLineChart,
  CategoryDonut,
} from "../components/charts/IntelligenceCharts";
import { useTrends } from "../hooks/useTrends";
import { useToast } from "../components/ui/Toast";
import { trendRows } from "../utils/intelligence";
export default function Trends() {
  const [days, setDays] = useState(30),
    resource = useTrends(days),
    toast = useToast();
  const rows = useMemo(
    () => trendRows(resource.data, days),
    [resource.data, days],
  );
  const categories = useMemo(() => {
    const result = {};
    (resource.data?.trends || []).forEach((item) => {
      result[item.threatType] = (result[item.threatType] || 0) + item.count;
    });
    return result;
  }, [resource.data]);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          "date,incidents\n" +
            rows.map((row) => row.date + "," + row.count).join("\n"),
        ],
        { type: "text/csv" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyberlens-trends.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Trend data exported.");
  }
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="PATTERN ANALYSIS"
        title="Trends & insights"
        description="Understand the patterns behind the headlines, over time."
        action={
          <Button variant="secondary" size="sm" onClick={download}>
            <Download size={14} />
            Export trends
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map((value) => (
            <Button
              key={value}
              variant={days === value ? "primary" : "secondary"}
              size="sm"
              aria-pressed={days === value}
              onClick={() => setDays(value)}
            >
              {value} days
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await resource.reload();
            toast("Trend data refreshed.");
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          ["Incidents in period", total.toLocaleString("en-IN")],
          ["Active categories", Object.keys(categories).length],
          ["Daily average", (total / days).toFixed(1)],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-[11px] text-slate-600 dark:text-slate-400">{label}</p>
            <p className="mt-4 font-mono text-2xl">
              {resource.loading ? "—" : value}
            </p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader
            title="Incident volume"
            description={`Daily activity over the last ${days} days`}
          />
          <div className="min-h-72 px-6 pb-6">
            {resource.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : resource.error ? (
              <EmptyState
                error
                title="Trend data unavailable"
                description={resource.error}
                onRetry={resource.reload}
              />
            ) : (
              <IncidentLineChart rows={rows} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Category breakdown"
            description="Selected reporting period"
          />
          <div className="min-h-80 px-6 pb-6">
            {resource.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <CategoryDonut data={categories} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
