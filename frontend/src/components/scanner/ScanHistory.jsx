import { useEffect, useState } from 'react'
import { BarChart2, ShieldAlert, ShieldCheck, Search } from 'lucide-react'
import { fetchScanHistory } from '../../api/scan'
import { formatNumber, formatThreatType } from '../../utils/formatters'
import LoadingSpinner from '../common/LoadingSpinner'

export default function ScanHistory() {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScanHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner size="sm" label="" />
  if (!history) return null

  const dangerRate = history.totalScans > 0
    ? Math.round((history.dangerousScans / history.totalScans) * 100)
    : 0

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-slate-500" />
        <p className="text-sm font-medium text-white">Platform Scan Stats</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Search className="w-4 h-4 text-brand-400" />
          </div>
          <p className="stat-value text-lg">{formatNumber(history.totalScans)}</p>
          <p className="stat-label text-[10px]">Total scans</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <p className="stat-value text-lg text-red-400">{dangerRate}%</p>
          <p className="stat-label text-[10px]">Flagged</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="stat-value text-lg text-emerald-400">{formatNumber(history.safeScans)}</p>
          <p className="stat-label text-[10px]">Safe</p>
        </div>
      </div>
      {history.topThreatType && (
        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Most common threat in scans:
            <span className="text-slate-300 ml-1">{formatThreatType(history.topThreatType)}</span>
          </p>
        </div>
      )}
    </div>
  )
}
