import { useCallback, useEffect, useState } from "react"

export type DesignDTO = {
  id: string
  title?: string
  name?: string
  width?: number
  height?: number
  thumbnail?: string | null
  createdAt: string
}

export default function useDesigns() {
  const [designs, setDesigns] = useState<DesignDTO[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDesigns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/designs')
      if (!res.ok) throw new Error('Failed to fetch designs')
      const data = await res.json()
      setDesigns(data)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDesigns() }, [fetchDesigns])

  return { designs, loading, error, fetchDesigns }
}
