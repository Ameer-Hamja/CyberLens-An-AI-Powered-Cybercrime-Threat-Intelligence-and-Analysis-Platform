import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import RiskMeter from './RiskMeter'
import IndicatorList from './IndicatorList'
import ThreatTypeBadge from '../dashboard/ThreatTypeBadge'

export default function TextScanResult({ result, onReset }) {
  if (!result) return null
  const { riskScore, threatType, explanation, isDangerous,
          indicators, classifierUsed, processingTimeMs } = result

  return (
    <div className={clsx(
      'card border-t-2 animate-fade-in',
      isDangerous ? 'border-t-red-500' : 'border-t-emerald-500'
    )}>
      <div className={clsx(
        'px-4 py-3 flex items-center gap-2 border-b border-slate-800',
        isDangerous ? 'bg-red-500/5' : 'bg-emerald-500/5'
      )}>
        {isDangerous
          ? <ShieldAlert className="w-4 h-4 text-red-400" />
          : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
        <span className={clsx(
          'text-sm font-medium',
          isDangerous ? 'text-red-300' : 'text-emerald-300'
        )}>
          {isDangerous
            ? 'Warning — This looks suspicious'
            : 'No strong threat patterns detected — safety is unverified'}
        </span>
      </div>
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-6 flex-wrap">
          <RiskMeter score={riskScore} />
          <div className="flex-1 space-y-3 min-w-0">
            <div>
              <p className="text-xs text-slate-500 mb-1">Threat Category</p>
              <ThreatTypeBadge type={threatType} size="md" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">What this means</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>
        <IndicatorList indicators={indicators} isDangerous={isDangerous} />
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Classifier: {classifierUsed || 'rule_based'}</span>
            <span>{processingTimeMs ? Math.round(processingTimeMs) + 'ms' : ''}</span>
          </div>
          <button onClick={onReset} className="flex items-center gap-1.5 btn-ghost text-xs">
            <RefreshCw className="w-3 h-3" />
            Scan another
          </button>
        </div>
      </div>
    </div>
  )
}
