import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "leaflet.markercluster";
import {
  Expand,
  Minimize,
  SlidersHorizontal,
  LocateFixed,
  Layers,
  MapPin,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useIntelligence } from "../context/IntelligenceContext";
import { useResource } from "../hooks/useResource";
import { fetchHeatmapData } from "../api/threats";
import { filterIncidents, geoTags, categoryLabel } from "../utils/intelligence";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import PageHeading from "../components/ui/PageHeading";
import IncidentFilters from "../components/incidents/IncidentFilters";
import IncidentDetails from "../components/incidents/IncidentDetails";
import { useToast } from "../components/ui/Toast";
function MapLayers({ points, heat, onSelect, expanded }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(timer);
  }, [map, expanded]);
  useEffect(() => {
    const clusters = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<span class="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/50 bg-slate-900/95 font-mono text-xs font-semibold text-cyan-300 shadow-lg ring-8 ring-cyan-500/10">${cluster.getChildCount()}</span>`,
          className: "",
          iconSize: [40, 40],
        }),
    });
    points.forEach(({ incident, lat, lng, state }) => {
      const color =
        incident.severity >= 4
          ? "bg-red-400"
          : incident.severity === 3
            ? "bg-amber-400"
            : "bg-emerald-400";
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<span class="block h-3 w-3 rounded-full border-2 border-white ${color} shadow-lg ring-4 ring-slate-900/40"></span>`,
          className: "",
          iconSize: [12, 12],
        }),
        title: categoryLabel(incident.threatType) + " · " + state,
      });
      const tooltip = document.createElement("span");
      tooltip.textContent = categoryLabel(incident.threatType) + " · " + state;
      marker.bindTooltip(tooltip);
      marker.on("click", () => onSelect(incident));
      clusters.addLayer(marker);
    });
    map.addLayer(clusters);
    const layer = heat
      ? L.heatLayer(
          points.map((point) => [
            point.lat,
            point.lng,
            Math.max(0.3, (point.incident.severity || 1) / 5),
          ]),
          {
            radius: 42,
            blur: 32,
            maxZoom: 8,
            minOpacity: 0.25,
            gradient: {
              0.3: "#06b6d4",
              0.5: "#10b981",
              0.7: "#f59e0b",
              1: "#ef4444",
            },
          },
        ).addTo(map)
      : null;
    return () => {
      map.removeLayer(clusters);
      if (layer) map.removeLayer(layer);
    };
  }, [map, points, heat, onSelect]);
  return null;
}
function Recenter({ trigger }) {
  const map = useMap();
  useEffect(() => {
    if (trigger) map.flyTo([22.5937, 78.9629], 5, { duration: 0.8 });
  }, [trigger, map]);
  return null;
}
export default function LiveHeatmap() {
  const { theme } = useTheme(),
    intelligence = useIntelligence(),
    coordinates = useResource(fetchHeatmapData),
    toast = useToast();
  const [filters, setFilters] = useState({}),
    [selected, setSelected] = useState(null),
    [showFilters, setShowFilters] = useState(false),
    [heat, setHeat] = useState(true),
    [expanded, setExpanded] = useState(false),
    [center, setCenter] = useState(0);
  const wrapper = useRef(null);
  const close = useCallback(() => setSelected(null), []),
    select = useCallback((incident) => setSelected(incident), []);
  const states = useMemo(
    () => [...new Set(intelligence.incidents.flatMap(geoTags))].sort(),
    [intelligence.incidents],
  );
  const filtered = useMemo(
    () => filterIncidents(intelligence.incidents, filters),
    [intelligence.incidents, filters],
  );
  const points = useMemo(() => {
    const lookup = new Map(
      (coordinates.data || []).map((state) => [state.stateName, state]),
    );
    return filtered.flatMap((incident) =>
      geoTags(incident).flatMap((state) => {
        const location = lookup.get(state);
        return location?.lat != null && location?.lng != null
          ? [{ incident, state, lat: location.lat, lng: location.lng }]
          : [];
      }),
    );
  }, [coordinates.data, filtered]);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", escape);
    };
  }, [expanded]);
  const loading = intelligence.loading || coordinates.loading,
    error = intelligence.error || coordinates.error;
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="GEOSPATIAL INTELLIGENCE"
        title="Live threat heatmap"
        description="See where signals emerge. Explore incidents across India."
        action={
          <Badge tone="emerald" dot>
            Live coverage
          </Badge>
        }
      />
      <div
        ref={wrapper}
        className={
          expanded
            ? "fixed inset-0 z-[1000] flex flex-col bg-slate-50 p-4 dark:bg-slate-950"
            : "card relative flex min-h-[600px] flex-col overflow-hidden"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-cyan-500" />
            <span className="text-xs font-medium">India / threat signals</span>
            <Badge>{points.length} mapped</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              aria-label="Toggle map filters"
              aria-expanded={showFilters}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle heat layer"
              aria-pressed={heat}
              onClick={() => {
                setHeat(!heat);
                toast(heat ? "Heat layer hidden." : "Heat layer shown.");
              }}
            >
              <Layers size={16} />
              <span className="hidden sm:inline">Heat layer</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Recenter map on India"
              onClick={() => {
                setCenter((value) => value + 1);
                toast("Map centered on India.");
              }}
            >
              <LocateFixed size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={
                expanded ? "Exit full-screen map" : "Expand map full screen"
              }
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize size={16} /> : <Expand size={16} />}
            </Button>
          </div>
        </div>
        <div
          className={
            expanded
              ? "relative min-h-0 flex-1"
              : "relative h-[calc(100dvh-280px)] min-h-[540px]"
          }
        >
          {loading ? (
            <Skeleton className="h-full w-full !rounded-none" />
          ) : error ? (
            <EmptyState
              error
              title="Map intelligence unavailable"
              description={error}
              onRetry={() => {
                intelligence.reload();
                coordinates.reload();
              }}
            />
          ) : (
            <MapContainer
              center={[22.5937, 78.9629]}
              zoom={5}
              minZoom={3}
              maxZoom={13}
              zoomControl={false}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                key={theme}
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                className={theme === "dark" ? "dark-map-tiles" : ""}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapLayers
                points={points}
                heat={heat}
                expanded={expanded}
                onSelect={select}
              />
              <Recenter trigger={center} />
            </MapContainer>
          )}
          <div
            className={
              (showFilters ? "block" : "hidden") +
              " card absolute left-4 top-4 z-[500] max-h-[calc(100%-100px)] w-64 overflow-y-auto p-5 lg:block"
            }
          >
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold">
              <SlidersHorizontal size={15} className="text-cyan-500" />
              Filter intelligence
            </p>
            <IncidentFilters
              compact
              filters={filters}
              setFilters={setFilters}
              states={states}
            />
          </div>
          <div className="card absolute bottom-8 right-4 z-[500] p-4">
            <p className="mb-3 font-mono text-[9px] tracking-wider text-slate-600 dark:text-slate-400">
              SEVERITY
            </p>
            <div className="flex gap-4 text-[10px] text-slate-600 dark:text-slate-400 dark:text-slate-300">
              {[
                ["bg-emerald-400", "Low"],
                ["bg-amber-400", "Medium"],
                ["bg-red-400", "High / critical"],
              ].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={"h-1.5 w-1.5 rounded-full " + color} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          {!loading && !error && !points.length && (
            <div className="card absolute left-1/2 top-1/2 z-[500] w-64 -translate-x-1/2 -translate-y-1/2">
              <EmptyState
                title="No mapped incidents"
                description="Clear filters or broaden the time range."
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 px-4 py-3 text-[10px] text-slate-600 dark:text-slate-400 dark:border-slate-800">
          <span>
            Locations use state centroids, not precise incident addresses.
          </span>
          <span className="font-mono">
            {filtered.length} INCIDENTS ·{" "}
            {new Set(points.map((point) => point.state)).size} REGIONS
          </span>
        </div>
      </div>
      <Modal open={!!selected} onClose={close} title="Mapped incident" drawer>
        {selected && (
          <IncidentDetails incident={selected} drawer onNavigate={close} />
        )}
      </Modal>
    </div>
  );
}
