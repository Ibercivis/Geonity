import type { Feature, FeatureCollection, Point, Polygon } from 'geojson'
import type { Observation } from '@/types'
import { parseGeoposition } from '@/lib/utils'

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface HexObs {
  polygon: [number, number][]
  centroid: [number, number]
  count: number
}

export interface ObsFeatureProps {
  obsId: number
  isMine: boolean
}

export interface HexFeatureProps {
  count: number
  centroid: [number, number]
}

// ─── Colors (rgba strings for Mapbox paint properties) ────────────────────────

export const COLORS = {
  cluster: 'rgba(59, 130, 246, 0.86)',
  single: 'rgba(59, 130, 246, 0.78)',
  mine: 'rgba(34, 197, 94, 0.78)',
  selected: 'rgb(249, 115, 22)',
  selectedRing: 'rgba(249, 115, 22, 0.3)',
  picked: 'rgba(239, 68, 68, 0.86)',
  hexStroke: 'rgba(59, 130, 246, 0.47)',
  white: '#ffffff',
  whiteSoft: 'rgba(255, 255, 255, 0.7)',
} as const

// ─── Map styles ───────────────────────────────────────────────────────────────

export const MAP_STYLE_STREETS = 'mapbox://styles/mapbox/light-v11'
export const MAP_STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12'

// ─── Clustering config ────────────────────────────────────────────────────────

export const CLUSTER_RADIUS = 60
export const CLUSTER_MAX_ZOOM = 16

// ─── GeoJSON adapters ─────────────────────────────────────────────────────────

export function observationsToGeoJSON(
  observations: Observation[]
): FeatureCollection<Point, ObsFeatureProps> {
  const features: Feature<Point, ObsFeatureProps>[] = []
  for (const obs of observations) {
    const coords = parseGeoposition(obs.geoposition)
    if (!coords) continue
    features.push({
      type: 'Feature',
      id: obs.id,
      geometry: { type: 'Point', coordinates: coords },
      properties: { obsId: obs.id, isMine: obs.is_mine ?? false },
    })
  }
  return { type: 'FeatureCollection', features }
}

export function publicPointsToGeoJSON(
  points: { id: number; lon: number; lat: number }[]
): FeatureCollection<Point, ObsFeatureProps> {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      id: p.id,
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: { obsId: p.id, isMine: false },
    })),
  }
}

export function hexObsToGeoJSON(
  hexObs: HexObs[]
): FeatureCollection<Polygon, HexFeatureProps> {
  return {
    type: 'FeatureCollection',
    features: hexObs.map((h, idx) => ({
      type: 'Feature',
      id: idx,
      geometry: { type: 'Polygon', coordinates: [h.polygon] },
      properties: { count: h.count, centroid: h.centroid },
    })),
  }
}

export function hexCentroidsToGeoJSON(
  hexObs: HexObs[]
): FeatureCollection<Point, HexFeatureProps> {
  return {
    type: 'FeatureCollection',
    features: hexObs.map((h, idx) => ({
      type: 'Feature',
      id: idx,
      geometry: { type: 'Point', coordinates: h.centroid },
      properties: { count: h.count, centroid: h.centroid },
    })),
  }
}

// ─── Paint specs ──────────────────────────────────────────────────────────────
// Returned as Mapbox expressions; passed straight into <Layer paint={...}>.
// Kept here so both ProjectMap and PublicMapPage share identical visuals.

export const clusterCirclePaint = {
  'circle-color': COLORS.cluster,
  'circle-radius': [
    'interpolate',
    ['linear'],
    ['get', 'point_count'],
    2, 10,
    10, 16,
    50, 24,
    200, 32,
    1000, 40,
  ] as unknown as number,
  'circle-stroke-color': COLORS.whiteSoft,
  'circle-stroke-width': 2,
}

export const clusterCountLayout = {
  'text-field': ['get', 'point_count_abbreviated'] as unknown as string,
  'text-size': 12,
  'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
  'text-allow-overlap': true,
  'text-ignore-placement': true,
}

export const clusterCountPaint = {
  'text-color': COLORS.white,
}

/**
 * Paint for unclustered (single) points. `selectedObsId` is interpolated into
 * the case expression so the selected point renders in orange; pass null to
 * disable selection highlight.
 */
export function singleCirclePaint(selectedObsId: number | null) {
  return {
    'circle-color': [
      'case',
      ['==', ['get', 'obsId'], selectedObsId ?? -1],
      COLORS.selected,
      ['get', 'isMine'],
      COLORS.mine,
      COLORS.single,
    ] as unknown as string,
    'circle-radius': 7,
    'circle-stroke-color': COLORS.whiteSoft,
    'circle-stroke-width': 2,
  }
}

export const selectedRingPaint = {
  'circle-color': COLORS.selectedRing,
  'circle-radius': 18,
  'circle-stroke-color': COLORS.selected,
  'circle-stroke-width': 2,
}

export const pickedMarkerPaint = {
  'circle-color': COLORS.picked,
  'circle-radius': 10,
  'circle-stroke-color': COLORS.white,
  'circle-stroke-width': 2,
}

export const hexFillPaint = {
  'fill-color': [
    'interpolate',
    ['linear'],
    ['get', 'count'],
    1, 'rgba(59, 130, 246, 0.7)',
    10, 'rgba(59, 130, 246, 0.94)',
  ] as unknown as string,
  'fill-outline-color': COLORS.hexStroke,
}

export const hexLabelLayout = {
  'text-field': ['to-string', ['get', 'count']] as unknown as string,
  'text-size': 13,
  'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
  'text-allow-overlap': true,
  'text-ignore-placement': true,
}

export const hexLabelPaint = {
  'text-color': 'rgba(255, 255, 255, 0.9)',
}
