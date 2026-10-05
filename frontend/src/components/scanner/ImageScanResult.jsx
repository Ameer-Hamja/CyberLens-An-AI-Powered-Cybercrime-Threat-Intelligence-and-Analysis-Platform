import { RefreshCw, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import RiskMeter from './RiskMeter'

const VERDICT_CONFIG = {
  AI_GENERATED: { label: 'AI Generated', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', topBorder: 'border-t-red-500', icon: '🤖' },
  MORPHED: { label: 'Morphed / Manipulated', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', topBorder: 'border-t-orange-500', icon: '✂️' },
  SCAM_SCREENSHOT: { label: 'Scam Screenshot', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', topBorder: 'border-t-red-500', icon: '🚨' },
  FAKE_DOCUMENT: { label: 'Fake Document', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', topBorder: 'border-t-orange-500', icon: '📄' },
  SUSPICIOUS: { label: 'Suspicious', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', topBorder: 'border-t-amber-500', icon: '⚠️' },
  LIKELY_LEGITIMATE: { label: 'Likely Legitimate', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', topBorder: 'border-t-emerald-500', icon: '✅' },
}

function SignalRow({ signal }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', signal.detected ? 'bg-red-400' : 'bg-emerald-500')} />
          <span className="text-xs text-slate-300">{signal.name}</span>
          {signal.detected && (
            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-medium">
              FLAGGED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {Math.round(signal.score * 100)}%
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-2.5 pt-0.5 bg-slate-900/50 border-t border-slate-800">
          <p className="text-xs text-slate-400 leading-relaxed">{signal.detail}</p>
        </div>
      )}
    </div>
  )
}

export default function ImageScanResult({ result, onReset }) {
  const [showOcr, setShowOcr] = useState(false)
  if (!result) return null
  const {
    verdict, confidence, riskScore,
    signals, ocrText, scanTextAnalysis,
    explanation, processingTimeMs
  } = result

  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.SUSPICIOUS

  return (
    <div className={clsx('card border-t-2 animate-fade-in', config.topBorder)}>
      <div className={clsx('px-4 py-3 flex items-center gap-2 border-b border-slate-800', config.bg)}>
        <span className="text-lg">{config.icon}</span>
        <div>
          <p className={clsx('text-sm font-medium', config.color)}>{config.label}</p>
          <p className="text-xs text-slate-500">{Math.round(confidence * 100)}% confidence</p>
        </div>
      </div>
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-6 flex-wrap">
          <RiskMeter score={riskScore} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1.5">Analysis</p>
            <p className="text-sm text-slate-300 leading-relaxed">{explanation}</p>
          </div>
        </div>
        {signals && signals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Signal Breakdown</p>
            {signals.map((signal, i) => <SignalRow key={i} signal={signal} />)}
          </div>
        )}
        {ocrText && (
          <div>
            <button
              onClick={() => setShowOcr(!showOcr)}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {showOcr ? 'Hide' : 'Show'} extracted text
              {showOcr ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showOcr && (
              <div className="mt-2 p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
                <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {ocrText}
                </p>
              </div>
            )}
          </div>
        )}
        {scanTextAnalysis && scanTextAnalysis.confidence > 0.4 && (
          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 font-medium mb-1">Scam text detected in image</p>
            <p className="text-xs text-slate-400">
              The text inside this image contains {scanTextAnalysis.threat_type?.replace(/_/g, ' ').toLowerCase()} patterns ({Math.round(scanTextAnalysis.confidence * 100)}% confidence).
            </p>
            {scanTextAnalysis.indicators?.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {scanTextAnalysis.indicators.slice(0, 3).map((ind, i) => (
                  <li key={i} className="text-xs text-slate-500">· {ind}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-600">{processingTimeMs ? Math.round(processingTimeMs) + 'ms' : ''}</span>
          <button onClick={onReset} className="flex items-center gap-1.5 btn-ghost text-xs">
            <RefreshCw className="w-3 h-3" />
            Scan another
          </button>
        </div>
      </div>
    </div>
  )
}
