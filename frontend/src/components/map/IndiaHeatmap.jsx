import { MapContainer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import MapLegend from './MapLegend'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import { useHeatmapData } from '../../hooks/useHeatmapData'
import { formatNumber } from '../../utils/formatters'

// India center coordinates
const INDIA_CENTER = [22.5937, 78.9629]
const INDIA_ZOOM = 5

// Color scale based on threat count
function getColor(count) {
  if (!count || count === 0) return 'transparent'
  if (count > 100)  return '#e24b4a'
  if (count > 50)   return '#ef6b4a'
  if (count > 20)   return '#ef9f27'
  if (count > 5)    return '#e8c547'
  return '#85b7eb'
}

export default function IndiaHeatmap() {
  const { data, loading, error } = useHeatmapData()
  const [geojson, setGeojson] = useState(null)

  useEffect(() => {
    fetch('/india.geojson')
      .then(res => res.json())
      .then(setGeojson)
      .catch(() => setGeojson(null))
  }, [])

  const stateMap = {}
  if (data) {
    data.forEach(d => {
      stateMap[d.stateName] = d
    })
  }

  const styleFeature = (feature) => {
    const stateName = feature.properties?.NAME_1 || feature.properties?.st_nm || ''
    const threatData = stateMap[stateName]
    const count = threatData?.count || 0
    return {
      fillColor: getColor(count),
      weight: 0.8,
      opacity: 1,
      color: '#334155',
      fillOpacity: count > 0 ? 0.65 : 0.03,
    }
  }

  const onEachFeature = (feature, layer) => {
    const stateName = feature.properties?.NAME_1 || feature.properties?.st_nm || ''
    const threatData = stateMap[stateName]
    const count = threatData?.count || 0
    const avgSev = threatData?.avgSeverity ? threatData.avgSeverity.toFixed(1) : 'N/A'
    layer.bindPopup(`
      <div style="font-family: Inter, sans-serif;">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">${stateName}</div>
        <div style="font-size:11px;color:#94a3b8">Threats: <span style="color:#f1f5f9;font-weight:500">${formatNumber(count)}</span></div>
        <div style="font-size:11px;color:#94a3b8">Avg Severity: <span style="color:#f1f5f9;font-weight:500">${avgSev}</span></div>
      </div>
    `)
  }

  if (loading) return <LoadingSpinner label="Loading heatmap..." />
  if (error) return (
    <EmptyState title="Map unavailable" description={error} />
  )

  return (
    <div className="relative h-full">
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        {geojson && (
          <GeoJSON
            data={geojson}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      <MapLegend />
    </div>
  )
}
