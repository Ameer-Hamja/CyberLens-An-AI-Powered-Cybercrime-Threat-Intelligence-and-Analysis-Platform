import { AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export default function IndicatorList({ indicators = [], isDangerous }) {
  if (!indicators || indicators.length === 0) return null
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Detected Signals
      </p>
      {indicators.map((indicator, i) => (
        <div
          key={i}
          className={clsx(
            'flex items-start gap-2 px-3 py-2 rounded-lg text-sm',
            isDangerous
              ? 'bg-red-500/5 border border-red-500/15'
              : 'bg-slate-800 border border-slate-700'
          )}
        >
          <AlertCircle className={clsx(
            'w-3.5 h-3.5 mt-0.5 flex-shrink-0',
            isDangerous ? 'text-red-400' : 'text-amber-400'
          )} />
          <span className="text-slate-300 text-xs leading-relaxed">
            {indicator}
          </span>
        </div>
      ))}
    </div>
  )
}
