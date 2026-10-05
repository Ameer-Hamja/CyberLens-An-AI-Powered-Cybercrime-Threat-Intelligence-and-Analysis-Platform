import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { formatThreatType } from '../../utils/formatters'
import { THREAT_COLORS } from '../../utils/threatColors'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-slate-300">{formatThreatType(p.dataKey)}</span>
          <span className="text-white font-medium ml-auto pl-3">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ data }) {
  if (!data?.trends?.length) return null

  const grouped = {}
  data.trends.forEach(t => {
    const date = t.date
    if (!grouped[date]) grouped[date] = { date }
    grouped[date][t.threatType] = t.count
  })
  const chartData = Object.values(grouped).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  )

  const threatTypes = [...new Set(data.trends.map(t => t.threatType))]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          {threatTypes.map(type => (
            <linearGradient key={type} id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THREAT_COLORS[type]?.hex || '#888'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={THREAT_COLORS[type]?.hex || '#888'} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          stroke="#475569"
          tick={{ fontSize: 10 }}
          tickFormatter={d => {
            const dt = new Date(d)
            return `${dt.getDate()}/${dt.getMonth() + 1}`
          }}
        />
        <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        {threatTypes.map(type => (
          <Area
            key={type}
            type="monotone"
            dataKey={type}
            stackId="1"
            stroke={THREAT_COLORS[type]?.hex || '#888'}
            strokeWidth={1.5}
            fill={`url(#grad-${type})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
