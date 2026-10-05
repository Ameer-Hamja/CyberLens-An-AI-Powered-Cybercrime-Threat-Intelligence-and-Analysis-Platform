import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
        <Compass className="w-8 h-8 text-slate-600" />
      </div>
      <h1 className="text-2xl font-bold text-white">Page not found</h1>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to Dashboard
      </Link>
    </div>
  )
}
