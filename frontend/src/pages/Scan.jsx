import { useState } from 'react'
import { Shield, MessageSquare, Link2, Image } from 'lucide-react'
import clsx from 'clsx'
import TextTab from '../components/scanner/TextTab'
import UrlTab from '../components/scanner/UrlTab'
import ImageTab from '../components/scanner/ImageTab'
import ScanHistory from '../components/scanner/ScanHistory'
import ErrorBoundary from '../components/common/ErrorBoundary'

const TABS = [
  { key: 'text',  label: 'SMS / Text', icon: MessageSquare, desc: 'Paste suspicious message content' },
  { key: 'url',   label: 'URL / UPI',  icon: Link2,          desc: 'Check a link or UPI ID' },
  { key: 'image', label: 'Image',      icon: Image,          desc: 'Check image heuristics and scam text' },
]

export default function Scan() {
  const [activeTab, setActiveTab] = useState('text')

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: scanner */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Citizen Scanner</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Check if something is a scam before you act on it. Free, instant, private.
              </p>
            </div>
          </div>
          <div className="card p-1 flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                aria-label={label}
                aria-pressed={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                  activeTab === key
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            {TABS.find(t => t.key === activeTab)?.desc}
          </p>
          <div className="card p-4">
            <ErrorBoundary>
              {activeTab === 'text'  && <TextTab />}
              {activeTab === 'url'   && <UrlTab />}
              {activeTab === 'image' && <ImageTab />}
            </ErrorBoundary>
          </div>
        </div>
        {/* Right: sidebar */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <p className="text-sm font-medium text-white">How it works</p>
            {[
              { step: '1', title: 'Paste or upload', desc: 'Drop in the suspicious content — text, link, UPI ID, or image.' },
              { step: '2', title: 'AI analysis', desc: 'Pattern rules assess suspicious text. Images use heuristics and optional configured models.' },
              { step: '3', title: 'Plain-language verdict', desc: 'Get a risk score and clear explanation — no jargon, no technical reports.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-medium text-brand-400">{step}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-300">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-4">
            <p className="text-sm font-medium text-white mb-2">Privacy</p>
            <ul className="space-y-1.5">
              {[
                'Your text is never stored — only an anonymous hash',
                'Images are analyzed and immediately deleted',
                'No account or login required',
                'No ads, no tracking',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <ErrorBoundary>
            <ScanHistory />
          </ErrorBoundary>
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-500 mb-2">Found something dangerous?</p>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors underline underline-offset-2"
            >
              Report to cybercrime.gov.in →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
