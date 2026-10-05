import { useState } from 'react'
import { Send, X } from 'lucide-react'
import clsx from 'clsx'
import LoadingSpinner from '../common/LoadingSpinner'
import TextScanResult from './TextScanResult'
import { useScanResult } from '../../hooks/useScanResult'

const EXAMPLES = [
  'Your SBI KYC has expired. Click here to update: bit.ly/sbikyc2024',
  'Congratulations! You have won ₹50,000. Share your OTP to claim.',
  'Your UPI account will be blocked. Call 9876543210 immediately.',
  'TRAI will disconnect your number in 2 hours due to illegal activity.',
]

export default function TextTab() {
  const [text, setText] = useState('')
  const { result, loading, error, scan, reset } = useScanResult()
  const maxLen = 2000
  const canScan = text.trim().length >= 5 && !loading

  const handleScan = () => {
    if (!canScan) return
    scan('text', text.trim())
  }

  const handleExample = (example) => {
    setText(example)
    reset()
  }

  if (result) {
    return <TextScanResult result={result} onReset={() => { reset(); setText('') }} />
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, maxLen))}
          placeholder="Paste the suspicious SMS, WhatsApp message, email text, or any content you want to check..."
          rows={5}
          className="input resize-none font-mono text-sm leading-relaxed"
        />
        {text && (
          <button
            onClick={() => { setText(''); reset() }}
            className="absolute top-2 right-2 text-slate-600 hover:text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="absolute bottom-2 right-3 text-[11px] text-slate-600">
          {text.length}/{maxLen}
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-600 mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleExample(ex)}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors text-left line-clamp-1 max-w-xs"
            >
              {ex.slice(0, 55)}…
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      {loading ? (
        <LoadingSpinner label="Analysing text..." />
      ) : (
        <button
          onClick={handleScan}
          disabled={!canScan}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            canScan ? 'bg-brand-500 hover:bg-brand-400 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          <Send className="w-4 h-4" />
          Scan Text
        </button>
      )}
    </div>
  )
}
