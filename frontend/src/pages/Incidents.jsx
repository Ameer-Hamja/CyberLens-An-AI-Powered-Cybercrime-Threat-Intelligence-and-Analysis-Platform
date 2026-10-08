import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Download,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  RefreshCw,
} from "lucide-react";
import { useIntelligence } from "../context/IntelligenceContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge, { SeverityBadge } from "../components/ui/Badge";
import Table from "../components/ui/Table";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import PageHeading from "../components/ui/PageHeading";
import Modal from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import IncidentFilters from "../components/incidents/IncidentFilters";
import IncidentDetails from "../components/incidents/IncidentDetails";
import {
  categoryLabel,
  dateLabel,
  geoTags,
  shortId,
  filterIncidents,
} from "../utils/intelligence";
import { searchThreats } from "../api/threats";
export default function Incidents({ searchMode = false }) {
  const intelligence = useIntelligence(),
    toast = useToast();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [filters, setFilters] = useState({}),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState(null),
    [remote, setRemote] = useState(null),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState(null),
    [searchInput, setSearchInput] = useState(query),
    [searchVersion, setSearchVersion] = useState(0);
  useEffect(() => {
    setSearchInput(query);
    if (!searchMode || !query) {
      setRemote(null);
      setSearching(false);
      setSearchError(null);
      return;
    }
    let active = true;
    setSearching(true);
    setSearchError(null);
    searchThreats(query, { size: 100 })
      .then((data) => {
        if (active) setRemote(data.results || []);
      })
      .catch(() => {
        if (active) setSearchError("Search could not be completed. Try again.");
      })
      .finally(() => {
        if (active) setSearching(false);
      });
    return () => {
      active = false;
    };
  }, [query, searchMode, searchVersion]);
  const list = remote === null ? intelligence.incidents : remote,
    rows = useMemo(() => filterIncidents(list, filters), [list, filters]),
    states = useMemo(
      () => [...new Set(intelligence.incidents.flatMap(geoTags))].sort(),
      [intelligence.incidents],
    );
  const updateFilters = useCallback((updater) => {
    setFilters(updater);
    setPage(0);
  }, []);
  const close = useCallback(() => setSelected(null), []);
  const pages = Math.max(1, Math.ceil(rows.length / 10)),
    currentPage = Math.min(page, pages - 1),
    visible = rows.slice(currentPage * 10, currentPage * 10 + 10),
    loading = intelligence.loading || searching,
    error = searchError || intelligence.error;
  function exportRows() {
    if (!rows.length) {
      toast("No incidents match the current filters.", "error");
      return;
    }
    const quote = (value) =>
      '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const csv = [
      ["ID", "Category", "Severity", "State", "Recorded", "AI summary"],
      ...rows.map((item) => [
        item.id,
        categoryLabel(item.threatType),
        item.severity,
        geoTags(item).join("; "),
        item.createdAt,
        item.citizenExplanation,
      ]),
    ]
      .map((row) =>
        row
          .map((value) =>
            quote(/^[=+@-]/.test(String(value)) ? "\t" + value : value),
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cyberlens-incidents.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast(`${rows.length} incidents exported.`);
  }
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="INCIDENT OPERATIONS"
        title={searchMode ? "Search intelligence" : "Incident explorer"}
        description={
          searchMode
            ? "Find the signals that matter. Search by keyword, message, or indicator."
            : "Investigate, filter, and understand the incidents behind the signals."
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const ok = await intelligence.reload();
                toast(
                  ok ? "Incidents refreshed." : "Refresh failed.",
                  ok ? "success" : "error",
                );
              }}
              aria-label="Refresh incidents"
            >
              <RefreshCw size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={exportRows}>
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        }
      />
      {searchMode && (
        <Card className="p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setParams({ q: searchInput });
              setPage(0);
              toast("Searching incident intelligence.");
            }}
            className="flex gap-3"
          >
            <label htmlFor="full-search" className="sr-only">
              Search intelligence
            </label>
            <input
              id="full-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              required
              minLength={2}
              maxLength={200}
              className="input"
              placeholder="Search keywords, UPI IDs, URLs, or phone numbers…"
            />
            <Button type="submit">Search</Button>
          </form>
        </Card>
      )}
      <Card>
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <IncidentFilters
            filters={filters}
            setFilters={updateFilters}
            states={states}
          />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <ListFilter
              size={15}
              className="text-slate-600 dark:text-slate-400"
            />
            <span className="text-xs font-medium">Incident records</span>
            <Badge>{rows.length}</Badge>
          </div>
          <p className="font-mono text-[9px] text-slate-600 dark:text-slate-400">
            LIVE DATA · ALL SOURCES
          </p>
        </div>
        <div className="min-h-[560px]">
          {loading ? (
            <div
              className="space-y-3 px-5"
              role="status"
              aria-label="Loading incidents"
              aria-busy="true"
            >
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              error
              title="Incidents unavailable"
              description={error}
              onRetry={() => {
                if (searchMode && query) setSearchVersion((value) => value + 1);
                else intelligence.reload();
              }}
            />
          ) : !rows.length ? (
            <EmptyState />
          ) : (
            <Table caption="Cyber intelligence incident records">
              <thead className="border-y border-slate-200 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 dark:border-slate-800 dark:bg-slate-950/40">
                <tr>
                  {[
                    "Incident / summary",
                    "Category",
                    "Severity",
                    "Location",
                    "Recorded",
                    "Details",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="whitespace-nowrap px-5 py-3 font-medium"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {visible.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-cyan-500/[0.03]"
                  >
                    <td className="min-w-64 max-w-80 px-5 py-4">
                      <button
                        onClick={() => setSelected(item)}
                        className="text-left"
                      >
                        <span className="font-mono text-[10px] font-medium text-cyan-700 dark:text-cyan-400">
                          {shortId(item.id)}
                        </span>
                        <span className="mt-1.5 block line-clamp-1 text-xs text-slate-600 dark:text-slate-300">
                          {item.citizenExplanation || "No summary available"}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone="slate">
                        {categoryLabel(item.threatType)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge severity={item.severity} />
                    </td>
                    <td className="max-w-40 px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="line-clamp-1">
                        {geoTags(item).join(", ") || "Not available"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                      {dateLabel(item.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={"/incidents/" + item.id}
                        aria-label={"View incident " + shortId(item.id)}
                        className="inline-flex rounded-lg p-2 text-slate-600 dark:text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-500"
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {rows.length
              ? `${currentPage * 10 + 1}–${Math.min((currentPage + 1) * 10, rows.length)} of ${rows.length} incidents`
              : "0 incidents"}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              aria-label="Previous page"
              disabled={!currentPage}
              onClick={() => {
                setPage(currentPage - 1);
                toast("Previous incident page.");
              }}
            >
              <ChevronLeft size={15} />
            </Button>
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
              {currentPage + 1} / {pages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Next page"
              disabled={currentPage + 1 >= pages}
              onClick={() => {
                setPage(currentPage + 1);
                toast("Next incident page.");
              }}
            >
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      </Card>
      <Modal
        open={!!selected}
        onClose={close}
        title="Incident intelligence"
        drawer
      >
        {selected && (
          <IncidentDetails incident={selected} drawer onNavigate={close} />
        )}
      </Modal>
    </div>
  );
}
