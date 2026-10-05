import { useState, useCallback } from 'react'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import ThreatCard from '../components/dashboard/ThreatCard'
import EmptyState from '../components/common/EmptyState'
import { searchThreats } from '../api/threats'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [total, setTotal] = useState(0)

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault()
    if (!query.trim() || query.trim().length < 2) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchThreats(query.trim(), { page: 0, size: 20 })
      setResults(data?.results || [])
      setTotal(data?.total || 0)
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [query])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-white mb-1">Search Threats</h1>
        <p className="text-sm text-slate-500">
          Full-text search across all indexed threats using Elasticsearch.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for keywords, UPI IDs, URLs, phone numbers..."
          className="input pl-10 pr-20"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-4 text-xs disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : 'Search'}
        </button>
      </form>

      {searched && !loading && (
        <p className="text-xs text-slate-500">
          {total > 0
            ? `${total} result${total !== 1 ? 's' : ''} for "${query}"`
            : `No results for "${query}"`}
        </p>
      )}

      <div className="space-y-2">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        )}
        {!loading && searched && results.length === 0 && (
          <EmptyState
            title="No threats found"
            description="Try different keywords or broaden your search."
          />
        )}
        {!loading && results.map((threat) => (
          <ThreatCard key={threat.id} threat={threat} />
        ))}
      </div>
    </div>
  )
}
