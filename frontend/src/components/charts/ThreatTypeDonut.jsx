import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatThreatType } from '../../utils/formatters'
import { THREAT_COLORS } from '../../utils/threatColors'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="card px-3 py-2">
      <div className="flex items-center gap-2">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: p.payload.color }}
        />
        <span className="text-xs text-slate-300">{formatThreatType(p.payload.name)}</span>
      </div>
      <div className="text-xs text-white font-medium mt-1 ml-4.5">
        {p.value} threats
        <span className="text-slate-500 ml-2">
          ({((p.payload.percentage || 0)).toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

export default function ThreatTypeDonut({ data }) {
  if (!data || Object.keys(data).length === 0) return null

  const total = Object.values(data).reduce((sum, d) => sum + (d.count || 0), 0)
  const chartData = Object.entries(data).map(([type, stats]) => ({
    name: type,
    value: stats.count || 0,
    color: THREAT_COLORS[type]?.hex || '#888780',
    percentage: total > 0 ? ((stats.count || 0) / total) * 100 : 0,
  }))

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            stroke="none"
          >
            {chartData.map(entry => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-xs text-slate-500">Total</span>
      </div>
    </div>
  )
}
