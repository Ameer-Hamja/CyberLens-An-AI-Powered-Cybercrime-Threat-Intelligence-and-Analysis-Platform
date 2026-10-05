import { useState } from 'react'
import { TrendingUp, Calendar } from 'lucide-react'
import TrendChart from '../components/charts/TrendChart'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import { useTrends } from '../hooks/useTrends'
import { formatNumber } from '../utils/formatters'
import clsx from 'clsx'

const DAY_OPTIONS = [7, 14, 30, 60, 90]

export default function Trends() {
  const [days, setDays] = useState(30)
  const { data, loading, error, reload } = useTrends(days)

  const totalThreats = data?.trends?.reduce((sum, t) => sum + t.count, 0) || 0
  const uniqueTypes = new Set(data?.trends?.map(t => t.threatType)).size || 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          <h1 className="text-lg font-semibold text-white">Threat Trends</h1>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Calendar className="w-4 h-4 text-slate-500" />
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                'btn-ghost text-xs',
                days === d && 'bg-brand-500/10 text-brand-400'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="stat-label">Total in period</span>
          <p className="stat-value mt-2">{formatNumber(totalThreats)}</p>
        </div>
        <div className="card p-4">
          <span className="stat-label">Threat types</span>
          <p className="stat-value mt-2">{uniqueTypes}</p>
        </div>
        <div className="card p-4">
          <span className="stat-label">Window</span>
          <p className="stat-value mt-2">{days} days</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <span className="text-sm font-medium text-white">Threat Trend Over Time</span>
          <button onClick={reload} className="btn-ghost text-xs">Refresh</button>
        </div>
        <div className="p-4">
          {loading && <LoadingSpinner label="Loading trends..." />}
          {error && (
            <EmptyState title="Failed to load trends" description={error} />
          )}
          {!loading && !error && data && (
            <TrendChart data={data} />
          )}
          {!loading && !error && !data?.trends?.length && (
            <EmptyState title="No trend data" description="No threats in this time window." />
          )}
        </div>
      </div>
    </div>
  )
}
