import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTrends } from '../api/threats'
export function useTrends(days = 30) {
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(null)
  const generation = useRef(0)
  const load = useCallback(async () => {
    const current = ++generation.current
    setLoading(true)
    try {
      const result = await fetchTrends(days)
      if (current === generation.current) { setData(result); setError(null) }
    } catch { if (current === generation.current) setError('Failed to load trends') }
    finally { if (current === generation.current) setLoading(false) }
  }, [days])
  useEffect(() => { const ref = generation; load(); return () => { ref.current++ } }, [load])
  return { data, loading, error, reload: load }
}
