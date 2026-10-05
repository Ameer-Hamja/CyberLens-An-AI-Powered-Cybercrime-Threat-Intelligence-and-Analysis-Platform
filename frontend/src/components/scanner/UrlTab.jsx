import { useState } from 'react'
import { Link2, Smartphone, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import LoadingSpinner from '../common/LoadingSpinner'
import TextScanResult from './TextScanResult'
import { useScanResult } from '../../hooks/useScanResult'

const URL_EXAMPLES = [
  'https://sbi-kyc-update.xyz/verify',
  'hdfc-bank-reward.tk/claim-now',
  'paytm-cashback2024.ml/prize',
]

const UPI_EXAMPLES = [
  'lottery-winner@ybl',
  'refund.agent@okaxis',
  'prize.claim99@paytm',
]

function InputWithIcon({ value, onChange, placeholder, icon: Icon }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input pl-9 font-mono text-sm"
      />
    </div>
  )
}

export default function UrlTab() {
  const [url,  setUrl]  = useState('')
  const [upi,  setUpi]  = useState('')
  const [mode, setMode] = useState('url')
  const { result, loading, error, scan, reset } = useScanResult()
  const input   = mode === 'url' ? url : upi
  const canScan = input.trim().length >= 3 && !loading

  const handleScan = () => {
    if (!canScan) return
    scan('text', input.trim())
  }

  if (result) {
    return <TextScanResult result={result} onReset={() => { reset(); setUrl(''); setUpi('') }} />
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-slate-800 rounded-lg w-fit">
        {[
          { key: 'url', label: 'URL / Link', icon: Link2 },
          { key: 'upi', label: 'UPI ID',    icon: Smartphone },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setMode(key); reset() }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              mode === key ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
      {mode === 'url' ? (
        <InputWithIcon
          value={url}
          onChange={e => { setUrl(e.target.value); reset() }}
          placeholder="https://suspicious-link.xyz/verify"
          icon={Link2}
        />
      ) : (
        <InputWithIcon
          value={upi}
          onChange={e => { setUpi(e.target.value); reset() }}
          placeholder="example@okaxis"
          icon={Smartphone}
        />
      )}
      <div>
        <p className="text-xs text-slate-600 mb-2">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {(mode === 'url' ? URL_EXAMPLES : UPI_EXAMPLES).map((ex, i) => (
            <button
              key={i}
              onClick={() => { mode === 'url' ? setUrl(ex) : setUpi(ex); reset() }}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors font-mono"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
      {mode === 'url' && (
        <div className="flex items-start gap-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Never open a link you want to check — paste it here instead. We analyze the URL without visiting it.
          </p>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      {loading ? (
        <LoadingSpinner label={mode === 'url' ? 'Checking URL...' : 'Checking UPI ID...'} />
      ) : (
        <button
          onClick={handleScan}
          disabled={!canScan}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            canScan ? 'bg-brand-500 hover:bg-brand-400 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          {mode === 'url' ? <Link2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          {mode === 'url' ? 'Check URL' : 'Check UPI ID'}
        </button>
      )}
    </div>
  )
}
