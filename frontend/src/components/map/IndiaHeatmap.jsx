import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import { useHeatmapData } from '../../hooks/useHeatmapData'
import { formatNumber } from '../../utils/formatters'

export default function IndiaHeatmap() {
  const { data, loading, error } = useHeatmapData()
  if (loading) return <LoadingSpinner label="Loading map..." />
  if (error) return <EmptyState title="Map unavailable" description={error} />
  const points = (data || []).filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng) && point.count > 0)
  return <div className="relative h-full min-h-80">
    <MapContainer center={[22.5937, 78.9629]} zoom={4} style={{ height: '100%', width: '100%', minHeight: 320 }} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map(point => <CircleMarker key={point.stateName} center={[point.lat, point.lng]} radius={Math.min(30, 6 + Math.sqrt(point.count))} pathOptions={{ color: '#e8c547', fillColor: '#ef9f27', fillOpacity: 0.65 }}>
        <Popup><strong>{point.stateName}</strong><br />Reports mentioning this state: {formatNumber(point.count)}<br />Average severity: {Number(point.avgSeverity || 0).toFixed(1)}</Popup>
      </CircleMarker>)}
    </MapContainer>
    <p className="absolute bottom-6 left-2 right-2 z-[1000] bg-slate-900/90 p-2 text-xs text-slate-300 rounded">{points.length ? 'Locations mentioned in reports; markers represent states, not confirmed incident sites.' : 'No reports with known state mentions. Unknown locations are omitted.'}</p>
  </div>
}
