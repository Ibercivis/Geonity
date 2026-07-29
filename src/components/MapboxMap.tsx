import * as React from 'react'
import mapboxgl from 'mapbox-gl'
import { useTranslation } from 'react-i18next'

import 'mapbox-gl/dist/mapbox-gl.css'
import type { ObservationRow } from '@/types/observation'

const MAP_STYLE_IDS = [
  'light-v11',
  'dark-v11',
  'streets-v12',
  'outdoors-v12',
  'satellite-v9',
  'satellite-streets-v12',
] as const

type StyleId = typeof MAP_STYLE_IDS[number]

export type MapboxMapProps = {
  accessToken: string
  observations?: ObservationRow[]
  selectedObservationId?: string | number | null
  onObservationSelect?: (id: string | number) => void
}

export function MapboxMap({ accessToken, observations = [], selectedObservationId, onObservationSelect }: MapboxMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<mapboxgl.Map | null>(null)
  const markersRef = React.useRef<Map<string | number, mapboxgl.Marker>>(new Map())
  const hasInitializedBoundsRef = React.useRef(false)
  const { t } = useTranslation()
  const [activeStyle, setActiveStyle] = React.useState<StyleId>('light-v11')

  // Refs so callbacks always see latest values without deps
  const observationsRef = React.useRef(observations)
  observationsRef.current = observations
  const selectedIdRef = React.useRef(selectedObservationId)
  selectedIdRef.current = selectedObservationId
  const onSelectRef = React.useRef(onObservationSelect)
  onSelectRef.current = onObservationSelect

  function normalizeObservationId(id: unknown): string | number | null {
    if (typeof id === 'string' || typeof id === 'number') return id
    return null
  }

  function parseGeoposition(geoposition: unknown): [number, number] | null {
    if (typeof geoposition !== 'string') return null
    const match = geoposition.match(/POINT\s*\(\s*([+-]?[0-9.]+)\s+([+-]?[0-9.]+)\s*\)/i)
    if (!match) return null
    return [parseFloat(match[1]), parseFloat(match[2])]
  }

  const addMarkers = React.useCallback((obs: ObservationRow[], selectedId: string | number | null | undefined) => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    const bounds = new mapboxgl.LngLatBounds()
    let hasValidCoords = false

    obs.forEach((observation) => {
      const id = normalizeObservationId(observation.id)
      if (id == null) return
      const coords = parseGeoposition(observation.geoposition)
      if (!coords) return

      const isSelected = String(id) === String(selectedId)
      const marker = new mapboxgl.Marker({ color: isSelected ? '#ef4444' : '#3b82f6' })
        .setLngLat([coords[0], coords[1]])
        .addTo(map)

      marker.getElement().addEventListener('click', () => {
        onSelectRef.current?.(id)
      })
      marker.getElement().style.cursor = 'pointer'
      markersRef.current.set(String(id), marker)
      bounds.extend([coords[0], coords[1]])
      hasValidCoords = true
    })

    if (hasValidCoords && !hasInitializedBoundsRef.current) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 })
      hasInitializedBoundsRef.current = true
    }
  }, [])

  // Initialize map
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const container = containerRef.current

    mapboxgl.accessToken = accessToken

    mapRef.current = new mapboxgl.Map({
      container,
      style: `mapbox://styles/mapbox/${activeStyle}`,
      center: [-3.7038, 40.4168],
      zoom: 4,
      projection: 'mercator',
    })

    const resizeObserver = new ResizeObserver(() => mapRef.current?.resize())
    resizeObserver.observe(container)
    requestAnimationFrame(() => mapRef.current?.resize())

    return () => {
      resizeObserver.disconnect()
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      mapRef.current?.remove()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  // Update markers when observations change
  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.isStyleLoaded()) {
      map.once('style.load', () => addMarkers(observations, selectedIdRef.current))
      return
    }
    addMarkers(observations, selectedIdRef.current)
  }, [observations, addMarkers])

  // Update marker colors when selection changes
  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker, id) => {
      const isSelected = String(id) === String(selectedObservationId)
      const lngLat = marker.getLngLat()
      marker.remove()
      const newMarker = new mapboxgl.Marker({ color: isSelected ? '#ef4444' : '#3b82f6' })
        .setLngLat(lngLat)
        .addTo(map)
      newMarker.getElement().addEventListener('click', () => onSelectRef.current?.(id))
      newMarker.getElement().style.cursor = 'pointer'
      markersRef.current.set(id, newMarker)
    })

    if (selectedObservationId && markersRef.current.has(String(selectedObservationId))) {
      map.easeTo({
        center: markersRef.current.get(String(selectedObservationId))!.getLngLat(),
        duration: 250,
        easing: (t) => 1 - (1 - t) * (1 - t),
      })
    }
  }, [selectedObservationId])

  // Change map style
  const handleStyleChange = React.useCallback((styleId: StyleId) => {
    const map = mapRef.current
    if (!map || styleId === activeStyle) return
    setActiveStyle(styleId)
    map.once('style.load', () => {
      hasInitializedBoundsRef.current = true // don't re-fit bounds on style change
      addMarkers(observationsRef.current, selectedIdRef.current)
    })
    map.setStyle(`mapbox://styles/mapbox/${styleId}`)
  }, [activeStyle, addMarkers])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Layer selector */}
      <div className="absolute bottom-8 left-2 z-10 flex flex-col gap-1 rounded-lg border border-white/30 bg-white/90 p-1 shadow-md backdrop-blur-sm">
        {MAP_STYLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => handleStyleChange(id)}
            className={[
              'rounded px-2 py-1 text-left text-[11px] font-medium transition-colors',
              activeStyle === id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground',
            ].join(' ')}
          >
            {t(`map.styles.${id}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
