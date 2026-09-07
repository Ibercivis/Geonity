import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Map, {
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
  type MapRef,
  type MapMouseEvent,
} from 'react-map-gl/mapbox'
import type { GeoJSONSource } from 'mapbox-gl'
import { Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { config } from '@/config/env'
import type { Observation } from '@/types'
import {
  observationsToGeoJSON,
  hexObsToGeoJSON,
  hexCentroidsToGeoJSON,
  MAP_STYLE_STREETS,
  MAP_STYLE_SATELLITE,
  CLUSTER_RADIUS,
  CLUSTER_MAX_ZOOM,
  clusterCirclePaint,
  clusterCountLayout,
  clusterCountPaint,
  singleCirclePaint,
  selectedRingPaint,
  pickedMarkerPaint,
  hexFillPaint,
  hexLabelLayout,
  hexLabelPaint,
  type HexObs,
} from './mapHelpers'

import 'mapbox-gl/dist/mapbox-gl.css'

export type { HexObs }

interface ProjectMapProps {
  observations?: Observation[]
  hexObservations?: HexObs[]
  fuzzy?: boolean
  onLocationPick?: (lon: number, lat: number) => void
  onObservationClick?: (obs: Observation) => void
  onZoomChange?: (zoom: number) => void
  pickingMode?: boolean
  /** Text of the floating hint in picking mode. Defaults to t('selectLocation'). Pass null to hide it. */
  pickingHint?: string | null
  pickedLocation?: [number, number] | null
  initialViewState?: { longitude: number; latitude: number; zoom: number }
  selectedObsId?: number | null
  flyTo?: [number, number] | null
}

interface SavedView {
  longitude: number
  latitude: number
  zoom: number
}

const DEFAULT_VIEW: SavedView = { longitude: 0, latitude: 20, zoom: 2 }
const MAP_VIEW_KEY = 'geonity_map_view'

function loadSavedView(): SavedView | null {
  try {
    const raw = sessionStorage.getItem(MAP_VIEW_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedView>
    if (
      typeof parsed.longitude !== 'number' ||
      typeof parsed.latitude !== 'number' ||
      typeof parsed.zoom !== 'number'
    ) return null
    return { longitude: parsed.longitude, latitude: parsed.latitude, zoom: parsed.zoom }
  } catch {
    return null
  }
}

function saveView(view: SavedView) {
  try {
    sessionStorage.setItem(MAP_VIEW_KEY, JSON.stringify(view))
  } catch { /* ignore */ }
}

export function ProjectMap({
  observations = [],
  hexObservations = [],
  fuzzy = false,
  onLocationPick,
  onObservationClick,
  onZoomChange,
  pickingMode = false,
  pickingHint,
  pickedLocation,
  initialViewState,
  selectedObsId,
  flyTo,
}: ProjectMapProps) {
  const { t } = useTranslation()
  const mapRef = useRef<MapRef>(null)
  const [satellite, setSatellite] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)
  const lastEmittedZoom = useRef<number | null>(null)

  const initialView = useMemo(
    () => initialViewState ?? loadSavedView() ?? DEFAULT_VIEW,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // GeoJSON data sources
  const observationsGeoJSON = useMemo(() => observationsToGeoJSON(observations), [observations])
  const hexGeoJSON = useMemo(() => hexObsToGeoJSON(hexObservations), [hexObservations])
  const hexLabelsGeoJSON = useMemo(() => hexCentroidsToGeoJSON(hexObservations), [hexObservations])

  const pickedGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: pickedLocation
        ? [{
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: pickedLocation },
            properties: {},
          }]
        : [],
    }),
    [pickedLocation]
  )

  // flyTo prop → imperative map call
  useEffect(() => {
    if (!flyTo) return
    const map = mapRef.current
    if (!map) return
    map.flyTo({
      center: flyTo,
      zoom: Math.max(map.getZoom(), 13),
      duration: 600,
    })
  }, [flyTo])

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const c = map.getCenter()
    const zoom = map.getZoom()
    saveView({ longitude: c.lng, latitude: c.lat, zoom })
    if (onZoomChange && fuzzy) {
      const rounded = Math.round(zoom)
      if (rounded !== lastEmittedZoom.current) {
        lastEmittedZoom.current = rounded
        onZoomChange(rounded)
      }
    }
  }, [fuzzy, onZoomChange])

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0]
      if (feature) {
        const props = feature.properties as {
          cluster?: boolean
          cluster_id?: number
          obsId?: number
        } | null
        if (props?.cluster && props.cluster_id !== undefined) {
          const source = mapRef.current?.getSource('observations') as GeoJSONSource | undefined
          if (!source) return
          source.getClusterExpansionZoom(props.cluster_id, (err, zoom) => {
            if (err || zoom == null) return
            const geom = feature.geometry as unknown as { coordinates: [number, number] }
            mapRef.current?.easeTo({ center: geom.coordinates, zoom, duration: 300 })
          })
          return
        }
        if (props?.obsId !== undefined && onObservationClick) {
          const obs = observations.find((o) => o.id === props.obsId)
          if (obs) onObservationClick(obs)
          return
        }
      }
      if (pickingMode && onLocationPick) {
        onLocationPick(e.lngLat.lng, e.lngLat.lat)
      }
    },
    [observations, onObservationClick, pickingMode, onLocationPick]
  )

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) {
      setTooltip(null)
      return
    }
    const props = feature.properties as {
      point_count?: number
      obsId?: number
      count?: number
    } | null
    let content: string | null = null
    if (props?.point_count) content = `${props.point_count} observations`
    else if (props?.obsId !== undefined) content = `Observation #${props.obsId}`
    else if (props?.count !== undefined) {
      content = `${props.count} observation${props.count !== 1 ? 's' : ''}`
    }
    if (!content) {
      setTooltip(null)
      return
    }
    setTooltip({ x: e.point.x, y: e.point.y, content })
  }, [])

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  const interactiveLayerIds = fuzzy ? ['hex-fill'] : ['clusters', 'unclustered']

  const singlePaint = useMemo(
    () => singleCirclePaint(selectedObsId ?? null),
    [selectedObsId]
  )

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={config.mapboxToken}
        initialViewState={initialView}
        mapStyle={satellite ? MAP_STYLE_SATELLITE : MAP_STYLE_STREETS}
        projection="mercator"
        reuseMaps
        maxTileCacheSize={50}
        interactiveLayerIds={interactiveLayerIds}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMoveEnd={handleMoveEnd}
        cursor={pickingMode ? 'crosshair' : undefined}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {!fuzzy && (
          <Source
            id="observations"
            type="geojson"
            data={observationsGeoJSON}
            cluster
            clusterRadius={CLUSTER_RADIUS}
            clusterMaxZoom={CLUSTER_MAX_ZOOM}
          >
            <Layer
              id="clusters"
              type="circle"
              filter={['has', 'point_count']}
              paint={clusterCirclePaint}
            />
            <Layer
              id="cluster-count"
              type="symbol"
              filter={['has', 'point_count']}
              layout={clusterCountLayout}
              paint={clusterCountPaint}
            />
            {selectedObsId != null && (
              <Layer
                id="selected-ring"
                type="circle"
                filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'obsId'], selectedObsId]]}
                paint={selectedRingPaint}
              />
            )}
            <Layer
              id="unclustered"
              type="circle"
              filter={['!', ['has', 'point_count']]}
              paint={singlePaint}
            />
          </Source>
        )}

        {fuzzy && (
          <>
            <Source id="hex" type="geojson" data={hexGeoJSON}>
              <Layer id="hex-fill" type="fill" paint={hexFillPaint} />
            </Source>
            <Source id="hex-labels" type="geojson" data={hexLabelsGeoJSON}>
              <Layer
                id="hex-labels-text"
                type="symbol"
                layout={hexLabelLayout}
                paint={hexLabelPaint}
              />
            </Source>
          </>
        )}

        {pickedLocation && (
          <Source id="picked-location" type="geojson" data={pickedGeoJSON}>
            <Layer id="picked-location-circle" type="circle" paint={pickedMarkerPaint} />
          </Source>
        )}
      </Map>

      {/* Satellite toggle */}
      <div className="absolute top-[180px] md:top-[158px] right-[10px] z-10">
        <Button
          size="icon"
          variant={satellite ? 'default' : 'outline'}
          className="bg-background/90 backdrop-blur-sm shadow-md h-10 w-10 md:h-[29px] md:w-[29px]"
          onClick={() => setSatellite((s) => !s)}
          title={satellite ? t('streets') : t('satellite')}
        >
          <Layers className="h-4 w-4 md:h-3.5 md:w-3.5" />
        </Button>
      </div>

      {/* Picking mode hint */}
      {pickingMode && pickingHint !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <Badge variant="secondary" className="shadow-md bg-background/90 backdrop-blur-sm text-foreground">
            {pickingHint ?? t('selectLocation')}
          </Badge>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-background border rounded px-2 py-1 text-xs shadow pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  )
}
