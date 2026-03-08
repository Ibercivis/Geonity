import * as React from 'react'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css'

export type MapboxMapProps = {
  accessToken: string
  observations?: Array<{
    id?: unknown
    geoposition?: unknown
  }>
  selectedObservationId?: string | number | null
  onObservationSelect?: (id: string | number) => void
}

export function MapboxMap({ accessToken, observations = [], selectedObservationId, onObservationSelect }: MapboxMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<mapboxgl.Map | null>(null)
  const markersRef = React.useRef<Map<string | number, mapboxgl.Marker>>(new Map())
  const hasInitializedBoundsRef = React.useRef(false)

  React.useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    mapboxgl.accessToken = accessToken

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.7038, 40.4168],
      zoom: 5,
    })

    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [accessToken])

  // Update markers when observations change
  React.useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const currentMarkers = markersRef.current

    // Extract lat/lon from POINT string
    function parseGeoposition(geoposition: unknown): [number, number] | null {
      if (typeof geoposition !== 'string') return null
      const match = geoposition.match(/POINT\s*\(\s*([+-]?[0-9.]+)\s+([+-]?[0-9.]+)\s*\)/i)
      if (!match) return null
      // POINT format is (lat lon), but Mapbox expects [lng, lat]
      return [parseFloat(match[2]), parseFloat(match[1])]
    }

    // Get IDs from current observations
    const observationIds = new Set<string | number>()
    const bounds = new mapboxgl.LngLatBounds()
    let hasValidCoords = false

    observations.forEach(obs => {
      const id = obs.id
      if (id == null) return

      const coords = parseGeoposition(obs.geoposition)
      if (!coords) return

      const idKey = String(id)
      observationIds.add(idKey)

      // Remove existing marker if present
      if (currentMarkers.has(idKey)) {
        currentMarkers.get(idKey)!.remove()
      }

      // Create marker with default style (blue pin)
      const marker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([coords[0], coords[1]])
        .addTo(map)

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        if (onObservationSelect) {
          onObservationSelect(id)
        }
      })

      marker.getElement().style.cursor = 'pointer'

      currentMarkers.set(idKey, marker)
      bounds.extend([coords[0], coords[1]])
      hasValidCoords = true
    })

    // Remove markers that are no longer in observations
    currentMarkers.forEach((marker, id) => {
      if (!observationIds.has(id)) {
        marker.remove()
        currentMarkers.delete(id)
      }
    })

    // Fit bounds if we have valid coordinates (only on first load)
    if (hasValidCoords && observations.length > 0 && !hasInitializedBoundsRef.current) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 })
      hasInitializedBoundsRef.current = true
    }
  }, [observations, onObservationSelect])

  // Update marker styles based on selection
  React.useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((marker, id) => {
      const isSelected = String(id) === String(selectedObservationId)
      
      // Remove old marker and create new one with different color
      const lngLat = marker.getLngLat()
      marker.remove()
      
      const newMarker = new mapboxgl.Marker({ color: isSelected ? '#ef4444' : '#3b82f6' })
        .setLngLat(lngLat)
        .addTo(mapRef.current!)
      
      // Re-add click handler
      const clickHandler = () => {
        if (onObservationSelect) {
          onObservationSelect(id)
        }
      }
      newMarker.getElement().addEventListener('click', clickHandler)
      
      newMarker.getElement().style.cursor = 'pointer'
      markersRef.current.set(id, newMarker)
    })

    // Center on selected observation with smooth zoom effect
    if (selectedObservationId && markersRef.current.has(String(selectedObservationId))) {
      const marker = markersRef.current.get(String(selectedObservationId))!
      const targetZoom = Math.max(mapRef.current.getZoom(), 13)
      const currentZoom = mapRef.current.getZoom()
      
      // Siempre hacer efecto de zoom-out y zoom-in para efecto cinematográfico
      // Primero zoom out suave
      mapRef.current?.easeTo({
        center: marker.getLngLat(),
        zoom: currentZoom - 3.5,
        duration: 700,
        easing: (t) => t * (2 - t) // easeOutQuad
      })
      
      // Luego zoom in al objetivo
      setTimeout(() => {
        mapRef.current?.easeTo({
          center: marker.getLngLat(),
          zoom: targetZoom,
          duration: 900,
          easing: (t) => t * t * t // easeInCubic
        })
      }, 700)
    }
  }, [selectedObservationId])

  // Update click handlers when onObservationSelect changes
  React.useEffect(() => {
    if (!onObservationSelect) return
    
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      const newHandler = () => onObservationSelect(id)
      el.removeEventListener('click', newHandler)
      el.addEventListener('click', newHandler)
    })
  }, [onObservationSelect])

  return <div ref={containerRef} className="h-full w-full" />
}
