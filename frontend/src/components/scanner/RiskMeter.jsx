import { useEffect, useState } from 'react'
import clsx from 'clsx'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getRiskColor(score) {
  if (score >= 80) return { stroke: '#e24b4a', text: 'text-red-400', label: 'Critical Risk', bg: 'bg-red-500/10' }
  if (score >= 60) return { stroke: '#ef9f27', text: 'text-orange-400', label: 'High Risk', bg: 'bg-orange-500/10' }
  if (score >= 40) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'Medium Risk', bg: 'bg-amber-500/10' }
  return { stroke: '#10b981', text: 'text-emerald-400', label: 'Low Risk', bg: 'bg-emerald-500/10' }
}

export default function RiskMeter({ score = 0, animate = true }) {
  score = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
  const [displayed, setDisplayed] = useState(animate ? 0 : score)
  const colors = getRiskColor(displayed)

  useEffect(() => {
    if (!animate) { setDisplayed(score); return }
    let frame
    let start = null
    const duration = 900
    const from = 0
    const to = score
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(from + (to - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [score, animate])

  const dashOffset = CIRCUMFERENCE - (displayed / 100) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
          <circle cx="72" cy="72" r={RADIUS} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle
            cx="72" cy="72" r={RADIUS}
            fill="none" stroke={colors.stroke}
            strokeWidth="12" strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('text-3xl font-bold tabular-nums leading-none', colors.text)}>
            {displayed}
          </span>
          <span className="text-xs text-slate-500 mt-0.5">/100</span>
        </div>
      </div>
      <span className={clsx(
        'px-3 py-1 rounded-full text-xs font-medium border',
        colors.bg, colors.text,
        colors.stroke === '#10b981' ? 'border-emerald-500/30'
        : colors.stroke === '#e24b4a' ? 'border-red-500/30'
        : 'border-amber-500/30'
      )}>
        {colors.label}
      </span>
    </div>
  )
}
