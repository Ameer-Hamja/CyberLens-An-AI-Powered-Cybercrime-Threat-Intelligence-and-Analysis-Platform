import { useLocation } from 'react-router-dom'
import { Shield, Globe } from 'lucide-react'
import PulsingDot from '../common/PulsingDot'
import { useSocket } from '../../context/WebSocketContext'

export default function Navbar() {
  const location = useLocation()
  const { connected } = useSocket()

  const pageTitle = {
    '/': 'Dashboard',
    '/scan': 'Citizen Scanner',
    '/trends': 'Trend Analysis',
    '/search': 'Search Threats',
  }[location.pathname] || 'CyberLens'

  return (
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <span className="text-sm font-semibold text-white">{pageTitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Globe className="w-3.5 h-3.5" />
          <span>India</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <PulsingDot color={connected ? 'green' : 'red'} />
          <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  )
}
