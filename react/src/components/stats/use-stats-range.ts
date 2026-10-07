import { useCallback, useMemo, useRef, useState } from 'react'
import type { StatsGranularity, StatsParams } from '@/api/stats'

export type RangePreset = '3m' | '6m' | '12m' | '24m'
export const RANGE_PRESETS: RangePreset[] = ['3m', '6m', '12m', '24m']

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** First day of the month N months ago (UTC), so buckets line up with the server's month starts. */
function monthsAgo(n: number): string {
  const now = new Date()
  return isoDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1)))
}

/**
 * Range + granularity state for a stats page, plus a one-shot "refresh" that
 * bypasses the server cache only for the request triggered by the button.
 */
export function useStatsRange(initialPreset: RangePreset = '12m') {
  const [preset, setPreset] = useState<RangePreset>(initialPreset)
  const [granularity, setGranularity] = useState<StatsGranularity>('month')
  const [nonce, setNonce] = useState(0)
  const forceRefresh = useRef(false)

  const params = useMemo<StatsParams>(() => {
    const months = { '3m': 3, '6m': 6, '12m': 12, '24m': 24 }[preset]
    return { from: monthsAgo(months - 1), granularity }
  }, [preset, granularity])

  /** Call inside queryFn: returns params with refresh=1 exactly once after `refresh()`. */
  const consumeParams = useCallback((): StatsParams => {
    const refresh = forceRefresh.current
    forceRefresh.current = false
    return refresh ? { ...params, refresh: true } : params
  }, [params])

  const refresh = useCallback(() => {
    forceRefresh.current = true
    setNonce((n) => n + 1)
  }, [])

  return {
    preset, setPreset,
    granularity, setGranularity,
    params,
    /** Include in the react-query key so `refresh()` triggers a refetch. */
    queryKey: [preset, granularity, nonce] as const,
    consumeParams,
    refresh,
  }
}
