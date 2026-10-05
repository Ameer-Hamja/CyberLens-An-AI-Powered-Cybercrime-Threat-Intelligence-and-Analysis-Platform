import { useState, useCallback, useRef, useEffect } from 'react'
import { scanText, scanImage } from '../api/scan'

export function useScanResult() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scanType, setScanType] = useState(null)
  const generation = useRef(0)
  useEffect(() => () => { generation.current++ }, [])
  const scan = useCallback(async (type, payload) => {
    const current = ++generation.current
    setLoading(true); setError(null); setResult(null); setScanType(type)
    try {
      const data = type === 'image' ? await scanImage(payload) : await scanText(payload)
      if (current === generation.current) setResult(data)
    } catch (e) {
      if (current === generation.current) setError(e.response?.data?.error || e.response?.data?.message || 'Scan failed. Please try again.')
    } finally {
      if (current === generation.current) setLoading(false)
    }
  }, [])
  const reset = useCallback(() => {
    generation.current++
    setResult(null); setError(null); setScanType(null); setLoading(false)
  }, [])
  return { result, loading, error, scanType, scan, reset }
}
