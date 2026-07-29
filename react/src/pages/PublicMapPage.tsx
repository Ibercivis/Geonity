import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Map, {
  NavigationControl,
  Source,
  Layer,
  type MapRef,
  type MapMouseEvent,
} from 'react-map-gl/mapbox'
import type { GeoJSONSource } from 'mapbox-gl'
import { MapPin, Layers, Loader2, ChevronDown } from 'lucide-react'
import { config } from '@/config/env'
import { ObservationPanel } from '@/components/map/ObservationPanel'
import {
  publicPointsToGeoJSON,
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
  hexFillPaint,
  hexLabelLayout,
  hexLabelPaint,
  type HexObs,
} from '@/components/map/mapHelpers'
import type { Observation, FieldForm, AnswerType } from '@/types'
import logo from '@/assets/logo.webp'
import 'mapbox-gl/dist/mapbox-gl.css'

// ─── Public API types ─────────────────────────────────────────────────────────

interface PublicMapPoint {
  id: number
  lat: number
  lon: number
}

interface PublicHexFeature {
  centroid: [number, number]
  hex_polygon: [number, number][]
  count: number
}

interface PublicObsDetail {
  id: number
  timestamp: string
  latitude: number
  longitude: number
  data: { key: string; value: unknown }[]
  images: { question_id: number; url: string }[]
  admin_values?: { key: string; label: string; value: unknown }[]
}

interface PublicOrg {
  id: number
  name: string
  logo: string
}

interface PublicMapData {
  map_type: string
  project: {
    id: number
    name: string
    description: string
    cover: string
    organizations: PublicOrg[]
  }
  questions?: { id: number; question_text: string; answer_type: string }[]
  observations?: PublicMapPoint[]
  features?: PublicHexFeature[]
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function pointToObs(p: PublicMapPoint): Observation {
  return {
    id: p.id,
    geoposition: `POINT (${p.lon} ${p.lat})`,
    created_at: '',
    timestamp: '',
    field_form: 0,
    data: [],
    images: [],
    admin_values: [],
    is_mine: false,
  }
}

function detailToObs(o: PublicObsDetail): Observation {
  return {
    id: o.id,
    geoposition: `POINT (${o.longitude} ${o.latitude})`,
    created_at: o.timestamp,
    timestamp: o.timestamp,
    field_form: 0,
    data: o.data,
    images: o.images.map((img) => img.url),
    admin_values: o.admin_values ?? [],
    is_mine: false,
  }
}

function toFieldForm(data: PublicMapData): FieldForm {
  return {
    id: 0,
    name: {},
    questions: (data.questions ?? []).map((q) => ({
      id: q.id,
      question_text: { default: q.question_text },
      answer_type: q.answer_type as AnswerType,
      mandatory: false,
      choices: [],
      allow_other: false,
      order: 0,
    })),
  }
}

function featuresToHex(features: PublicHexFeature[]): HexObs[] {
  return features.map((f) => ({
    polygon: f.hex_polygon,
    centroid: f.centroid,
    count: f.count,
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_VIEW = { longitude: 0, latitude: 20, zoom: 2 }

export function PublicMapPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)

  const mapRef = useRef<MapRef>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const [data, setData] = useState<PublicMapData | null>(null)
  const [error, setError] = useState(false)
  const [loadingObs, setLoadingObs] = useState(false)

  const [selectedObsId, setSelectedObsId] = useState<number | null>(null)
  const [tempSelectedObs, setTempSelectedObs] = useState<Observation | null>(null)
  const [fetchedDetail, setFetchedDetail] = useState<Observation | null>(null)
  const selectedObs = fetchedDetail ?? tempSelectedObs

  const [satellite, setSatellite] = useState(false)

  // Hex state
  const [hexObs, setHexObs] = useState<HexObs[]>([])
  const [roundedZoom, setRoundedZoom] = useState(Math.round(DEFAULT_VIEW.zoom))
  const lastEmittedZoom = useRef<number | null>(null)
  const fitDoneRef = useRef(false)

  const isHex = data?.map_type === 'hex'

  const selectObs = useCallback((obs: Observation | null) => {
    if (!obs) {
      setSelectedObsId(null)
      setTempSelectedObs(null)
      setFetchedDetail(null)
      return
    }
    setTempSelectedObs(obs)
    setSelectedObsId(obs.id)
    const match = obs.geoposition.match(/POINT\s*\(([^)]+)\)/)
    if (match) {
      const [lon, lat] = match[1].split(' ').map(Number)
      const map = mapRef.current
      if (map) {
        map.flyTo({
          center: [lon, lat],
          zoom: Math.max(map.getZoom(), 13),
          duration: 600,
        })
      }
    }
  }, [])

  // ── Fetch map data ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    setLoadingObs(true)
    fitDoneRef.current = false
    fetch(`${config.apiUrl}/project/${id}/public-map/`)
      .then(async (res) => {
        if (!res.ok) { setError(true); return }
        const json: PublicMapData = await res.json()
        setData(json)
        if (json.map_type === 'hex' && json.features) {
          setHexObs(featuresToHex(json.features))
        }
      })
      .catch((err) => { console.error('[PublicMap] fetch error', err); setError(true) })
      .finally(() => setLoadingObs(false))
  }, [id])

  // ── Fit to data once map + data are both ready ───────────────────────────────

  useEffect(() => {
    if (!mapLoaded || !data || fitDoneRef.current) return
    const map = mapRef.current
    if (!map) return

    let coords: [number, number][] = []
    if (data.map_type === 'hex' && data.features?.length) {
      coords = data.features.map((f) => f.centroid)
    } else if (data.observations?.length) {
      coords = data.observations.map((p) => [p.lon, p.lat] as [number, number])
    }

    if (coords.length === 0) { fitDoneRef.current = true; return }
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
    if (minLon === maxLon && minLat === maxLat) {
      map.jumpTo({ center: coords[0], zoom: 12 })
    } else {
      map.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 60, duration: 0, maxZoom: 16 })
    }
    fitDoneRef.current = true
  }, [mapLoaded, data])

  // ── Re-fetch hex on zoom change ──────────────────────────────────────────────

  useEffect(() => {
    if (!isHex || !id || !data) return
    if (roundedZoom === lastEmittedZoom.current) return
    lastEmittedZoom.current = roundedZoom

    fetch(`${config.apiUrl}/project/${id}/public-map/?zoom=${roundedZoom}`)
      .then(async (res) => {
        if (!res.ok) return
        const json: PublicMapData = await res.json()
        if (json.features) setHexObs(featuresToHex(json.features))
      })
      .catch(() => { /* keep current hex */ })
  }, [roundedZoom, isHex, id, data])

  // ── Fetch full detail on click (points mode) ─────────────────────────────────

  useEffect(() => {
    if (!selectedObsId || !data) return
    setFetchedDetail(null)
    fetch(`${config.apiUrl}/project/${data.project.id}/observations/${selectedObsId}/public/`)
      .then(async (res) => {
        if (!res.ok) return
        const detail: PublicObsDetail = await res.json()
        setFetchedDetail(detailToObs(detail))
      })
      .catch(() => { /* panel still shows position info */ })
  }, [selectedObsId, data])

  // ── Derived data ─────────────────────────────────────────────────────────────

  const fieldForm = useMemo<FieldForm | undefined>(
    () => (data ? toFieldForm(data) : undefined),
    [data]
  )

  const syntheticObs = useMemo<Observation[]>(
    () => (data?.observations ?? []).map(pointToObs),
    [data]
  )

  // GeoJSON sources
  const pointsGeoJSON = useMemo(
    () => publicPointsToGeoJSON(data?.observations ?? []),
    [data]
  )
  const hexGeoJSON = useMemo(() => hexObsToGeoJSON(hexObs), [hexObs])
  const hexLabelsGeoJSON = useMemo(() => hexCentroidsToGeoJSON(hexObs), [hexObs])

  const singlePaint = useMemo(() => singleCirclePaint(selectedObsId), [selectedObsId])

  // ── Map event handlers ───────────────────────────────────────────────────────

  const handleClick = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) return
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
    if (props?.obsId !== undefined) {
      const pt = data?.observations?.find((p) => p.id === props.obsId)
      if (pt) selectObs(pointToObs(pt))
    }
  }, [data, selectObs])

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    setRoundedZoom(Math.round(map.getZoom()))
  }, [])

  const interactiveLayerIds = isHex ? [] : ['clusters', 'unclustered']

  // ── Total count ──────────────────────────────────────────────────────────────

  const totalCount = isHex
    ? hexObs.reduce((s, h) => s + h.count, 0)
    : (data?.observations?.length ?? 0)

  // ── Error / disabled ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-6">
        <div className="text-center space-y-4 max-w-sm">
          <img src={logo} alt="Geonity" className="h-9 mx-auto" />
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted mx-auto">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold">{t('publicMapDisabled')}</h1>
          <p className="text-sm text-muted-foreground">{t('publicMapDisabledDesc')}</p>
          <p className="text-xs text-muted-foreground pt-2">
            {t('poweredBy')} <span className="font-semibold">Ibercivis</span>
          </p>
        </div>
      </div>
    )
  }

  // ── Map ──────────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={config.mapboxToken}
        initialViewState={DEFAULT_VIEW}
        mapStyle={satellite ? MAP_STYLE_SATELLITE : MAP_STYLE_STREETS}
        projection="mercator"
        reuseMaps
        interactiveLayerIds={interactiveLayerIds}
        onClick={handleClick}
        onMoveEnd={handleMoveEnd}
        onLoad={() => setMapLoaded(true)}
        cursor="grab"
      >
        <NavigationControl position="top-right" />

        {!isHex && (
          <Source
            id="observations"
            type="geojson"
            data={pointsGeoJSON}
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

        {isHex && (
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
      </Map>

      {/* Observations loading gauge */}
      {loadingObs && (
        <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
          <div className="h-1 w-full bg-primary/20 overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: '40%', animation: 'obs-indeterminate 1.4s ease-in-out infinite' }}
            />
          </div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-xs text-gray-600 rounded-full px-3 py-1 shadow-sm border border-gray-200">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('loadingObservations')}
          </div>
        </div>
      )}

      {/* Satellite toggle */}
      <div className="absolute top-[180px] md:top-[158px] right-[10px] z-10">
        <button
          type="button"
          onClick={() => setSatellite((s) => !s)}
          title={satellite ? t('streets') : t('satellite')}
          className={`flex items-center justify-center h-10 w-10 md:h-[29px] md:w-[29px] rounded shadow-md border bg-white/90 backdrop-blur-sm transition-colors ${satellite ? 'bg-primary text-white border-primary' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          <Layers className="h-4 w-4 md:h-3.5 md:w-3.5" />
        </button>
      </div>

      {/* Top-left: logo + project name + organizations */}
      <div className="absolute top-4 left-4 right-4 md:right-auto z-10 flex items-center gap-2 md:gap-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 md:px-4 py-2 shadow-md max-w-[calc(100%-2rem)]">
        <a href="https://geonity.ibercivis.es" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <img src={logo} alt="Geonity" className="h-6 md:h-7" />
        </a>
        {data?.project.name && (
          <>
            <div className="w-px h-5 bg-gray-200 shrink-0" />
            <span className="text-sm font-semibold text-gray-800 truncate">{data.project.name}</span>
          </>
        )}
        {data?.project.organizations?.map((org) => (
          <div key={org.id} className="hidden md:flex items-center gap-1.5 shrink-0">
            <div className="w-px h-5 bg-gray-200" />
            {org.logo && (
              <img src={org.logo} alt={org.name} className="h-6 w-6 rounded-full object-cover" />
            )}
            <span className="text-sm text-gray-700">{org.name}</span>
          </div>
        ))}
      </div>

      {/* Observation count */}
      {data && totalCount > 0 && (
        <div className="absolute top-16 left-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow text-xs text-gray-600 pointer-events-none">
          {totalCount} {totalCount === 1 ? 'observation' : 'observations'}
        </div>
      )}

      {/* Language picker */}
      <div className="absolute bottom-4 md:bottom-8 right-4 z-10">
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow text-xs text-gray-600 hover:bg-white/95 transition-colors"
          >
            <span className="font-medium uppercase">{i18n.language?.split('-')[0] ?? 'en'}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {langOpen && (
            <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[80px]">
              {(['en', 'es', 'pt', 'it', 'fr', 'de'] as const).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${i18n.language?.startsWith(lng) ? 'font-semibold text-primary' : 'text-gray-700'}`}
                  onClick={() => { i18n.changeLanguage(lng); setLangOpen(false) }}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ibercivis attribution */}
      <div className="absolute bottom-4 md:bottom-8 left-4 z-10 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow text-xs text-gray-500">
        {t('poweredBy')}{' '}
        <a
          href="https://ibercivis.es"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-gray-700 hover:underline"
        >
          Ibercivis
        </a>
      </div>

      {/* Observation detail panel (points mode only) */}
      {!isHex && (
        <ObservationPanel
          observation={selectedObs}
          open={selectedObsId !== null}
          fieldForm={fieldForm}
          projectId={data?.project.id ?? 0}
          onClose={() => { setSelectedObsId(null); setTempSelectedObs(null); setFetchedDetail(null) }}
          observations={syntheticObs}
          onNavigate={selectObs}
        />
      )}
    </div>
  )
}
