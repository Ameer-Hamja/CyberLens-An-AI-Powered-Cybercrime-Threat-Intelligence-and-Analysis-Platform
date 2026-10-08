import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { fetchThreatById } from "../api/threats";
import { useResource } from "../hooks/useResource";
import Card from "../components/ui/Card";
import PageHeading from "../components/ui/PageHeading";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import IncidentDetails from "../components/incidents/IncidentDetails";
export default function IncidentDetail() {
  const { id } = useParams(),
    loader = useCallback(() => fetchThreatById(id), [id]),
    resource = useResource(loader);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/incidents"
        className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-cyan-500"
      >
        <ArrowLeft size={14} />
        Back to incidents
      </Link>
      <PageHeading
        eyebrow="INCIDENT INTELLIGENCE"
        title="Every signal has a story."
        description="Source context, AI analysis, and the details you need to investigate."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          {resource.loading ? (
            <div className="space-y-5">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : resource.error ? (
            <EmptyState
              error
              title="Incident not available"
              description={resource.error}
              onRetry={resource.reload}
            />
          ) : (
            resource.data && <IncidentDetails incident={resource.data} />
          )}
        </Card>
        <div className="space-y-4">
          <Card className="p-6">
            <Shield size={24} className="mb-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Act on intelligence.</h2>
            <p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-400">
              Verify suspicious messages through official channels. Never
              disclose an OTP, password, or payment PIN.
            </p>
            <Link to="/scan" className="btn-primary mt-5 w-full">
              Check a suspicious message
            </Link>
          </Card>
          <Card className="p-6">
            <p className="text-xs font-semibold">
              Affected by financial cyber fraud?
            </p>
            <a
              href="tel:1930"
              className="mt-3 block font-mono text-3xl text-cyan-700 dark:text-cyan-400"
            >
              1930
            </a>
            <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
              Contact the national helpline and report through the official
              portal.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
