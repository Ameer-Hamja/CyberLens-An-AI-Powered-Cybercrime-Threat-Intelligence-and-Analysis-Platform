import { Shield, AlertTriangle, Eye, Activity } from 'lucide-react'
import StatCard from '../components/dashboard/StatCard'
import LiveFeed from '../components/dashboard/LiveFeed'
import IndiaHeatmap from '../components/map/IndiaHeatmap'
import ThreatTypeDonut from '../components/charts/ThreatTypeDonut'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useStats } from '../hooks/useStats'
import { fetchStatsByType } from '../api/stats'
import { useState, useEffect } from 'react'
import { formatNumber } from '../utils/formatters'

export default function Dashboard() {
  const { stats, loading, error } = useStats()
  const [typeStats, setTypeStats] = useState(null)

  useEffect(() => {
    fetchStatsByType()
      .then(setTypeStats)
      .catch(() => setTypeStats(null))
  }, [])

  if (loading && !stats) return <LoadingSpinner label="Loading dashboard..." />

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Threats"
          value={formatNumber(stats?.totalThreats || 0)}
          icon={Shield}
          iconColor="text-brand-400"
          loading={loading}
        />
        <StatCard
          label="Today"
          value={formatNumber(stats?.threatsToday || 0)}
          icon={AlertTriangle}
          iconColor="text-amber-400"
          loading={loading}
        />
        <StatCard
          label="High Severity"
          value={formatNumber(stats?.highSeverityCount || 0)}
          icon={Eye}
          iconColor="text-red-400"
          loading={loading}
        />
        <StatCard
          label="Total Scans"
          value={formatNumber(stats?.totalScans || 0)}
          icon={Activity}
          iconColor="text-emerald-400"
          loading={loading}
        />
      </div>

      {/* Map + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 flex flex-col">
          <div className="card-header">
            <span className="text-sm font-medium text-white">India Threat Heatmap</span>
          </div>
          <div className="flex-1 h-[420px] p-2">
            <IndiaHeatmap />
          </div>
        </div>
        <div className="card flex flex-col">
          <div className="card-header">
            <span className="text-sm font-medium text-white">Threat Distribution</span>
          </div>
          <div className="p-4 flex-1">
            {typeStats ? (
              <ThreatTypeDonut data={typeStats} />
            ) : (
              <LoadingSpinner label="Loading..." />
            )}
            <div className="mt-4 space-y-1.5">
              {typeStats && Object.entries(typeStats)
                .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
                .slice(0, 4)
                .map(([type, s]) => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: (
                          { PHISHING:'#e24b4a',UPI_FRAUD:'#ef9f27',KYC_SCAM:'#d4537e',
                            OTP_THEFT:'#7f77dd',SIM_SWAP:'#1d9e75',RANSOMWARE:'#993c1d',
                            VISHING:'#378add',OTHER:'#888780'
                          }[type] || '#888780'
                        )
                      }}
                    />
                    <span className="text-slate-400 flex-1 truncate">
                      {({ PHISHING:'Phishing',UPI_FRAUD:'UPI Fraud',KYC_SCAM:'KYC Scam',
                         OTP_THEFT:'OTP Theft',SIM_SWAP:'SIM Swap',RANSOMWARE:'Ransomware',
                         VISHING:'Vishing',OTHER:'Other' }[type] || type)}
                    </span>
                    <span className="text-slate-300 font-medium">
                      {formatNumber(s.count || 0)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live feed */}
      <div className="card">
        <LiveFeed />
      </div>
    </div>
  )
}
