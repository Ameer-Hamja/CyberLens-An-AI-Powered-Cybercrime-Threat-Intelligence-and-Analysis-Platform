import { Search, SlidersHorizontal, X } from "lucide-react";
import { THREAT_TYPES } from "../../utils/constants";
import { categoryLabel } from "../../utils/intelligence";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
export default function IncidentFilters({
  filters,
  setFilters,
  states = [],
  compact = false,
}) {
  const toast = useToast();
  const update = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    if (key !== "query") toast("Incident filters updated.");
  };
  return (
    <div className={compact ? "space-y-4" : "flex flex-wrap items-end gap-3"}>
      <div className={compact ? "" : "min-w-48 flex-1"}>
        <label
          className="field-label"
          htmlFor={compact ? "map-query" : "incident-query"}
        >
          Search incidents
        </label>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-3.5 text-slate-600 dark:text-slate-400"
          />
          <input
            id={compact ? "map-query" : "incident-query"}
            value={filters.query || ""}
            onChange={(event) => update("query", event.target.value)}
            placeholder="ID, keyword or location"
            className="input !pl-9"
          />
        </div>
      </div>
      {[
        {
          key: "category",
          label: "Category",
          options: THREAT_TYPES.map((type) => [type, categoryLabel(type)]),
        },
        {
          key: "severity",
          label: "Severity",
          options: [
            ["5", "Critical"],
            ["4", "High & critical"],
            ["3", "Medium and above"],
            ["2", "Low and above"],
          ],
        },
        {
          key: "date",
          label: "Time range",
          options: [
            ["1", "Last 24 hours"],
            ["7", "Last 7 days"],
            ["30", "Last 30 days"],
          ],
        },
        {
          key: "state",
          label: "State",
          options: states.map((state) => [state, state]),
        },
      ].map(({ key, label, options }) => (
        <div key={key} className={compact ? "" : "min-w-32 flex-1"}>
          <label
            htmlFor={`${compact ? "map" : "incident"}-${key}`}
            className="field-label"
          >
            {label}
          </label>
          <select
            id={`${compact ? "map" : "incident"}-${key}`}
            value={filters[key] || ""}
            onChange={(event) => update(key, event.target.value)}
            className="input"
          >
            <option value="">
              {
                {
                  date: "All time",
                  category: "All categories",
                  severity: "All severities",
                  state: "All states",
                }[key]
              }
            </option>
            {options.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setFilters({});
          toast("Incident filters cleared.");
        }}
        className={compact ? "w-full" : "!min-h-11"}
      >
        <X size={14} />
        Clear filters
      </Button>
      {compact && (
        <p className="flex gap-2 text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">
          <SlidersHorizontal size={14} className="shrink-0" />
          Filters apply to the incident feed and map layers.
        </p>
      )}
    </div>
  );
}
