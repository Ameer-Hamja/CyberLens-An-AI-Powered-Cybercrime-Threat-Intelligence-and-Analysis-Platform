import { Link } from "react-router-dom";
import {
  BrainCircuit,
  ExternalLink,
  MapPin,
  Clock3,
  Copy,
  FileText,
} from "lucide-react";
import Badge, { SeverityBadge } from "../ui/Badge";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import {
  categoryLabel,
  dateLabel,
  geoTags,
  shortId,
  safeSource,
} from "../../utils/intelligence";
import { SOURCE_LABELS } from "../../utils/constants";
export default function IncidentDetails({
  incident,
  drawer = false,
  onNavigate,
}) {
  const toast = useToast();
  const source = safeSource(incident.sourceUrl);
  async function copy() {
    try {
      await navigator.clipboard.writeText(incident.id);
      toast("Incident ID copied.");
    } catch {
      toast("Could not copy. Select the ID to copy it manually.", "error");
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="cyan">{categoryLabel(incident.threatType)}</Badge>
        <SeverityBadge severity={incident.severity} />
      </div>
      <div>
        <p className="font-mono text-xs text-cyan-700 dark:text-cyan-400">
          {shortId(incident.id)}
        </p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">
          {categoryLabel(incident.threatType)} intelligence report
        </h2>
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <MapPin size={14} />
          {geoTags(incident).join(", ") || "Location not available"}
        </p>
      </div>
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
          <BrainCircuit size={16} />
          AI intelligence summary
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {incident.citizenExplanation ||
            "An AI summary is not available for this incident."}
        </p>
        <p className="mt-4 font-mono text-[10px] text-slate-600 dark:text-slate-400">
          {incident.confidence == null
            ? "Confidence unavailable"
            : `${Math.round(incident.confidence * 100)}% classification confidence`}{" "}
          · {incident.detectedLanguage?.toUpperCase() || "UNKNOWN"} LANGUAGE
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-5 text-xs">
        <div>
          <dt className="text-slate-600 dark:text-slate-400">Source</dt>
          <dd className="mt-2 font-medium">
            {SOURCE_LABELS[incident.sourceType] ||
              incident.sourceType ||
              "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-600 dark:text-slate-400">Recorded</dt>
          <dd className="mt-2 font-mono text-[11px]">
            {dateLabel(incident.createdAt)}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-600 dark:text-slate-400">Incident identifier</dt>
          <dd className="mt-2 flex items-center gap-2">
            <span className="break-all font-mono text-[10px]">
              {incident.id}
            </span>
            <button
              onClick={copy}
              aria-label="Copy incident ID"
              className="shrink-0 rounded-lg p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Copy size={14} />
            </button>
          </dd>
        </div>
      </dl>
      <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold">
          <Clock3 size={16} className="text-slate-600 dark:text-slate-400" />
          Incident timeline
        </h3>
        <ol className="ml-2 border-l border-slate-200 pl-6 dark:border-slate-700">
          <li className="relative pb-5">
            <span className="absolute -left-[29px] top-1 h-2 w-2 rounded-full bg-cyan-400 ring-4 ring-white dark:ring-slate-900" />
            <p className="text-xs font-medium">Incident recorded</p>
            <p className="mt-1 font-mono text-[10px] text-slate-600 dark:text-slate-400">
              {dateLabel(incident.createdAt)}
            </p>
          </li>
          <li className="relative">
            <span className="absolute -left-[29px] top-1 h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-white dark:ring-slate-900" />
            <p className="text-xs font-medium">Classification available</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              {categoryLabel(incident.threatType)} · severity{" "}
              {incident.severity || "unrated"}. Classification time is not
              provided by the source.
            </p>
          </li>
        </ol>
      </div>
      <div className="flex flex-wrap gap-3">
        {source ? (
          <a
            href={source}
            target="_blank"
            rel="noreferrer"
            onClick={() => toast("Opening the incident source.")}
            className="btn-primary text-xs"
          >
            <ExternalLink size={14} />
            View source
          </a>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            No public source link is available for this incident.
          </p>
        )}
        {drawer && (
          <Link
            to={"/incidents/" + incident.id}
            onClick={onNavigate}
            className="btn-ghost"
          >
            <FileText size={14} />
            Full incident details
          </Link>
        )}
        <Link to="/report" onClick={onNavigate} className="btn-ghost">
          Report a related cybercrime
        </Link>
      </div>
      {!drawer && (
        <Button variant="secondary" onClick={copy}>
          <Copy size={14} />
          Copy reference
        </Button>
      )}
    </div>
  );
}
