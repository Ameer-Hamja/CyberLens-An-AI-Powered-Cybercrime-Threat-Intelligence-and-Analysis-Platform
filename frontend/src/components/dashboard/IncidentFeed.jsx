import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { SeverityBadge } from "../ui/Badge";
import { shortId, categoryLabel, geoTags } from "../../utils/intelligence";
import { timeAgo } from "../../utils/formatters";
export default function IncidentFeed({ incidents }) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {incidents.map((item) => (
        <Link
          key={item.id}
          to={"/incidents/" + item.id}
          className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-cyan-500/[0.03]"
        >
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500 ring-4 ring-cyan-500/10" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold">
                {categoryLabel(item.threatType)}
              </span>
              <SeverityBadge severity={item.severity} />
              <span className="ml-auto font-mono text-[10px] text-slate-600 dark:text-slate-400">
                {timeAgo(item.createdAt)}
              </span>
            </div>
            <p className="mt-2 line-clamp-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {item.citizenExplanation || "No analyst summary available."}
            </p>
            <div className="mt-2 flex items-center gap-4 font-mono text-[9px] text-slate-600 dark:text-slate-400">
              <span>{shortId(item.id)}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={10} />
                {geoTags(item).join(", ") || "Location unavailable"}
              </span>
            </div>
          </div>
          <ArrowUpRight
            size={16}
            className="mt-1 shrink-0 text-slate-600 dark:text-slate-400 group-hover:text-cyan-400"
          />
        </Link>
      ))}
    </div>
  );
}
