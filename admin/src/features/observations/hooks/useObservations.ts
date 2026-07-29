import * as React from 'react'

import i18n from '@/i18n'
import {
  fetchFieldFormDetail,
  fetchFieldFormObservations,
  fetchObservationEmailLogs,
  fetchFieldForms,
  fetchProjectObservationAdminValues,
  saveObservationAdminFields,
  sendObservationEmail,
} from '@/lib/api/observations'
import type {
  ObservationAdminFieldMeta,
  FieldFormSummary,
  ObservationAdminValuesIndex,
  ObservationCollection,
  ObservationEmailLog,
  ObservationQuestion,
  ObservationRow,
  SendObservationEmailPayload,
  ObservationSortKey,
  ObservationSortState,
} from '@/types/observation'
import type { ProjectObservationField } from '@/types/projectObservationField'
import { projectIdToString } from '@/features/projects/hooks/useProjects'

type AppToast = {
  title: string
  description?: string | null
  variant?: 'default' | 'destructive' | 'success'
}

export type ObservationEmailDraft = {
  subject: string
  includeObservationData: boolean
  allowReply: boolean
  introText: string
  body: string
}

type SendObservationEmailOptions = {
  observationId: string
  payload: SendObservationEmailPayload
  showSuccessToast?: boolean
}

function normalizeFieldForms(data: unknown): FieldFormSummary[] {
  if (Array.isArray(data)) return data as FieldFormSummary[]
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (Array.isArray(record.results)) return record.results as FieldFormSummary[]
  }
  return []
}

function fieldFormIdToString(form: { id?: unknown; field_form_id?: unknown }): string {
  if (typeof form.field_form_id === 'string' && form.field_form_id) return form.field_form_id
  if (typeof form.field_form_id === 'number') return String(form.field_form_id)
  if (typeof form.id === 'string' && form.id) return form.id
  if (typeof form.id === 'number') return String(form.id)
  return ''
}

function extractQuestions(data: unknown): ObservationQuestion[] {
  if (!data || typeof data !== 'object') return []
  const record = data as Record<string, unknown>
  const candidates = [record.questions, record.fields, record.items, record.questions_set]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue

    return candidate
      .map((question) => {
        if (!question || typeof question !== 'object') return null
        const qr = question as Record<string, unknown>
        const id = typeof qr.id === 'number' ? qr.id : typeof qr.id === 'string' ? Number(qr.id) : NaN
        const question_text = typeof qr.question_text === 'string' ? qr.question_text : ''
        const answer_type = typeof qr.answer_type === 'string' ? qr.answer_type : ''
        const mandatory = Boolean(qr.mandatory)
        if (!Number.isFinite(id) || !question_text) return null
        return { id, question_text, answer_type, mandatory }
      })
      .filter((value): value is ObservationQuestion => Boolean(value))
  }

  return []
}

function normalizeObservationRows(data: unknown): ObservationRow[] {
  if (Array.isArray(data)) return data as ObservationRow[]
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (Array.isArray(record.results)) return record.results as ObservationRow[]
  }
  return []
}

function normalizeObservationEmailLogs(data: unknown): ObservationEmailLog[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)
      ? ((data as { results?: unknown[] }).results ?? [])
      : data && typeof data === 'object' && Array.isArray((data as { logs?: unknown[] }).logs)
        ? ((data as { logs?: unknown[] }).logs ?? [])
        : []

  return list
    .map<ObservationEmailLog | null>((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const idValue = row.id ?? row.log_id
      const id = typeof idValue === 'string' || typeof idValue === 'number' ? idValue : undefined
      const observationValue = row.observation ?? row.observation_id
      const observation = typeof observationValue === 'string' || typeof observationValue === 'number' ? observationValue : undefined
      const sentByValue = row.sent_by ?? row.sentBy
      const sent_by = typeof sentByValue === 'string' || typeof sentByValue === 'number' ? sentByValue : null
      const sent_by_username = typeof row.sent_by_username === 'string'
        ? row.sent_by_username
        : typeof row.sentByUsername === 'string'
          ? row.sentByUsername
          : null
      const created_at = typeof row.created_at === 'string' ? row.created_at : typeof row.timestamp === 'string' ? row.timestamp : null
      const updated_at = typeof row.updated_at === 'string' ? row.updated_at : null
      const sent_at = typeof row.sent_at === 'string' ? row.sent_at : typeof row.sentAt === 'string' ? row.sentAt : null
      const status = typeof row.status === 'string' ? row.status : typeof row.state === 'string' ? row.state : null
      const subject = typeof row.subject === 'string' ? row.subject : typeof row.template === 'string' ? row.template : null
      const body = typeof row.body === 'string' ? row.body : null
      const recipient = typeof row.recipient === 'string'
        ? row.recipient
        : typeof row.to === 'string'
          ? row.to
          : typeof row.email === 'string'
            ? row.email
            : typeof row.user_email === 'string'
              ? row.user_email
              : null
      const message = typeof row.message === 'string'
        ? row.message
        : typeof row.body === 'string'
          ? row.body
          : typeof row.error === 'string'
            ? row.error
            : null
      const event = typeof row.event === 'string' ? row.event : typeof row.kind === 'string' ? row.kind : null
      const include_observation_data = typeof row.include_observation_data === 'boolean'
        ? row.include_observation_data
        : typeof row.includeObservationData === 'boolean'
          ? row.includeObservationData
          : null

      return {
        id,
        observation,
        sent_by,
        sent_by_username,
        created_at,
        updated_at,
        sent_at,
        status,
        subject,
        body,
        recipient,
        message,
        event,
        include_observation_data,
        payload: row,
      }
    })
    .filter((value): value is ObservationEmailLog => Boolean(value))
}

function nextObservationEmailCount(observation: ObservationRow): number {
  const count = observation?.email_count ?? observation?.emailCount
  if (typeof count === 'number' && Number.isFinite(count)) return count + 1
  if (typeof count === 'string') {
    const parsed = Number(count)
    if (Number.isFinite(parsed)) return parsed + 1
  }
  return 1
}

function extractAdminValuesMap(candidate: unknown): Record<string, unknown> | null {
  if (!candidate) return null

  if (typeof candidate === 'object' && !Array.isArray(candidate)) {
    const record = candidate as Record<string, unknown>
    if (record.values && typeof record.values === 'object' && !Array.isArray(record.values)) {
      return record.values as Record<string, unknown>
    }

    const normalizedEntries = Object.entries(record).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>
        if ('value' in nested) {
          acc[key] = nested.value
          return acc
        }
      }

      acc[key] = value
      return acc
    }, {})

    return normalizedEntries
  }

  if (Array.isArray(candidate)) {
    const entries = candidate.reduce<Record<string, unknown>>((acc, item) => {
      if (!item || typeof item !== 'object') return acc
      const row = item as Record<string, unknown>
      const key = row.key ?? row.field_key ?? row.fieldKey
      const keyString = typeof key === 'string' || typeof key === 'number' ? String(key) : ''
      if (!keyString) return acc

      if ('value' in row) {
        acc[keyString] = row.value
        return acc
      }

      if (row.values && typeof row.values === 'object' && !Array.isArray(row.values)) {
        const nestedValues = row.values as Record<string, unknown>
        if (keyString in nestedValues) acc[keyString] = nestedValues[keyString]
      }

      return acc
    }, {})

    return Object.keys(entries).length > 0 ? entries : null
  }

  return null
}

function extractAdminFieldMetaMap(candidate: unknown): Record<string, ObservationAdminFieldMeta> {
  if (!candidate) return {}

  if (typeof candidate === 'object' && !Array.isArray(candidate)) {
    const record = candidate as Record<string, unknown>
    const directMeta = record.admin_field_meta ?? record.adminFieldMeta
    if (directMeta && typeof directMeta === 'object' && !Array.isArray(directMeta)) {
      return Object.entries(directMeta as Record<string, unknown>).reduce<Record<string, ObservationAdminFieldMeta>>((acc, [key, value]) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return acc
        const normalized = value as Record<string, unknown>
        const updatedAt = typeof normalized.updated_at === 'string' ? normalized.updated_at : null
        const updatedBy = typeof normalized.updated_by === 'string' ? normalized.updated_by : null
        acc[key] = { updated_at: updatedAt, updated_by: updatedBy }
        return acc
      }, {})
    }

    const updatedKeys = Array.isArray(record.updated) ? record.updated.filter((value): value is string => typeof value === 'string') : []
    const updatedAt = typeof record.updated_at === 'string' ? record.updated_at : null
    const updatedBy = typeof record.updated_by === 'string' ? record.updated_by : null

    if (updatedKeys.length && (updatedAt || updatedBy)) {
      return updatedKeys.reduce<Record<string, ObservationAdminFieldMeta>>((acc, key) => {
        acc[key] = { updated_at: updatedAt, updated_by: updatedBy }
        return acc
      }, {})
    }

    const nestedMeta = Object.entries(record).reduce<Record<string, ObservationAdminFieldMeta>>((acc, [key, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return acc
      const nested = value as Record<string, unknown>
      const nestedUpdatedAt = typeof nested.updated_at === 'string' ? nested.updated_at : null
      const nestedUpdatedBy = typeof nested.updated_by === 'string' ? nested.updated_by : null
      if (nestedUpdatedAt || nestedUpdatedBy) {
        acc[key] = { updated_at: nestedUpdatedAt, updated_by: nestedUpdatedBy }
      }
      return acc
    }, {})

    if (Object.keys(nestedMeta).length > 0) return nestedMeta

    return {}
  }

  if (Array.isArray(candidate)) {
    return candidate.reduce<Record<string, ObservationAdminFieldMeta>>((acc, item) => {
      if (!item || typeof item !== 'object') return acc
      const row = item as Record<string, unknown>
      const key = row.key ?? row.field_key ?? row.fieldKey
      const keyString = typeof key === 'string' || typeof key === 'number' ? String(key) : ''
      if (!keyString) return acc

      const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null
      const updatedBy = typeof row.updated_by === 'string' ? row.updated_by : null
      acc[keyString] = { updated_at: updatedAt, updated_by: updatedBy }
      return acc
    }, {})
  }

  return {}
}

function normalizeObservationAdminValuesResponse(body: unknown): ObservationAdminValuesIndex {
  const byId: Record<string, Record<string, unknown>> = {}
  const bySignature: Record<string, Record<string, unknown>> = {}
  const metaById: Record<string, Record<string, ObservationAdminFieldMeta>> = {}
  const metaBySignature: Record<string, Record<string, ObservationAdminFieldMeta>> = {}

  const list: unknown[] = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { admin_values?: unknown[] }).admin_values)
      ? (((body as { admin_values?: unknown[] }).admin_values as unknown[]) ?? [])
    : body && typeof body === 'object' && Array.isArray((body as { observations?: unknown[] }).observations)
      ? (((body as { observations?: unknown[] }).observations as unknown[]) ?? [])
      : body && typeof body === 'object' && Array.isArray((body as { results?: unknown[] }).results)
        ? ((body as { results?: unknown[] }).results as unknown[])
        : []

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>

    const nestedObservation = row.observation && typeof row.observation === 'object'
      ? (row.observation as Record<string, unknown>)
      : null

    const obsId = row.observation_id ?? row.observationId ?? row.observation ?? row.id ?? nestedObservation?.id
    const obsIdStr = String(obsId ?? '')

    const values = extractAdminValuesMap(
      row.values
      ?? row.admin_values
      ?? row.adminValues
      ?? row.admin_fields_values
      ?? row.adminFieldsValues
      ?? row.admin_fields
      ?? row.adminFields
      ?? row.data
    )

    if (values && obsIdStr) byId[obsIdStr] = values

    const ts = typeof row.timestamp === 'string' ? row.timestamp : ''
    const creator = row.creator_id ?? row.creatorId ?? row.creator
    const creatorStr = creator === null || creator === undefined ? '' : String(creator)
    if (values && ts && creatorStr) bySignature[`${ts}|${creatorStr}`] = values

    const meta = extractAdminFieldMetaMap(
      row.values
      ?? row.admin_field_meta
      ?? row.adminFieldMeta
      ?? row.admin_values
      ?? row.adminValues
      ?? row.admin_fields_values
      ?? row.adminFieldsValues
      ?? row.admin_fields
      ?? row.adminFields
      ?? row
    )

    if (Object.keys(meta).length > 0) {
      if (obsIdStr) metaById[obsIdStr] = meta
      if (ts && creatorStr) metaBySignature[`${ts}|${creatorStr}`] = meta
    }
  }

  return { byId, bySignature, metaById, metaBySignature }
}

function normalizeAdminValuesFromResponse(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  return extractAdminValuesMap(
    record.values
    ?? record.admin_values
    ?? record.adminValues
    ?? record.admin_fields_values
    ?? record.adminFieldsValues
    ?? record.admin_fields
    ?? record.adminFields
  )
}

function normalizeAdminFieldMetaFromResponse(body: unknown): Record<string, ObservationAdminFieldMeta> {
  if (!body || typeof body !== 'object') return {}
  const record = body as Record<string, unknown>
  return extractAdminFieldMetaMap(
    record.values
    ?? record.admin_field_meta
    ?? record.adminFieldMeta
    ?? record.admin_values
    ?? record.adminValues
    ?? record.admin_fields_values
    ?? record.adminFieldsValues
    ?? record.admin_fields
    ?? record.adminFields
    ?? record
  )
}

function extractLatLon(geoposition: unknown): { a: string; b: string } | null {
  if (typeof geoposition !== 'string') return null
  const match = geoposition.match(/POINT\s*\(\s*([+-]?[0-9.]+)\s+([+-]?[0-9.]+)\s*\)/i)
  if (!match) return null
  return { a: match[1], b: match[2] }
}

function compareForSort(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
}

export function useObservations({
  authKey,
  selectedProjectId,
  selectedProjectEmailSubject,
  selectedProjectEmailIntro,
  projectObservationFields,
  showToast,
}: {
  authKey: string | null
  selectedProjectId: string
  selectedProjectEmailSubject?: string
  selectedProjectEmailIntro?: string
  projectObservationFields: ProjectObservationField[]
  showToast: (toast: AppToast) => void
}) {
  const [, setFieldFormId] = React.useState<string>('')
  const [, setFieldForm] = React.useState<unknown>(null)
  const [questions, setQuestions] = React.useState<ObservationQuestion[]>([])
  const [observations, setObservations] = React.useState<ObservationCollection>(null)
  const [observationsError, setObservationsError] = React.useState<string | null>(null)
  const [isLoadingObservations, setIsLoadingObservations] = React.useState(false)
  const adminFieldsLoadedRef = React.useRef<Record<string, boolean>>({})
  const projectAdminValuesLoadedRef = React.useRef<Record<string, boolean>>({})
  const bulkAdminValuesProjectIdRef = React.useRef<string>('')
  const bulkAdminValuesByIdRef = React.useRef<Record<string, Record<string, unknown>>>({})
  const bulkAdminValuesBySignatureRef = React.useRef<Record<string, Record<string, unknown>>>({})
  const bulkAdminMetaByIdRef = React.useRef<Record<string, Record<string, ObservationAdminFieldMeta>>>({})
  const bulkAdminMetaBySignatureRef = React.useRef<Record<string, Record<string, ObservationAdminFieldMeta>>>({})
  const [bulkAdminValuesVersion, setBulkAdminValuesVersion] = React.useState(0)
  const [reloadVersion, setReloadVersion] = React.useState(0)
  const reloadObservations = React.useCallback(() => setReloadVersion((v) => v + 1), [])
  const bulkMergedKeyRef = React.useRef<string>('')
  const [cellDrafts, setCellDrafts] = React.useState<Record<string, string>>({})
  const [cellSaving, setCellSaving] = React.useState<Record<string, boolean>>({})
  const [cellSaveError, setCellSaveError] = React.useState<Record<string, string>>({})
  const [tableSort, setTableSort] = React.useState<ObservationSortState>(null)
  const emailLogsCacheRef = React.useRef<Record<string, ObservationEmailLog[]>>({})
  const [emailLogsOpen, setEmailLogsOpen] = React.useState(false)
  const [emailLogsObservationId, setEmailLogsObservationId] = React.useState<string | null>(null)
  const [emailLogs, setEmailLogs] = React.useState<ObservationEmailLog[]>([])
  const [isLoadingEmailLogs, setIsLoadingEmailLogs] = React.useState(false)
  const [emailLogsError, setEmailLogsError] = React.useState<string | null>(null)
  const [sendEmailOpen, setSendEmailOpen] = React.useState(false)
  const [sendEmailObservationId, setSendEmailObservationId] = React.useState<string | null>(null)
  const [sendEmailInitialDraft, setSendEmailInitialDraft] = React.useState<ObservationEmailDraft>({
    subject: '',
    includeObservationData: true,
    allowReply: false,
    introText: '',
    body: '',
  })
  const [isSendingObservationEmail, setIsSendingObservationEmail] = React.useState(false)
  const [sendObservationEmailError, setSendObservationEmailError] = React.useState<string | null>(null)

  const normalizeObservations = React.useCallback((data: unknown) => normalizeObservationRows(data), [])

  React.useEffect(() => {
    if (!authKey || !selectedProjectId) return
    const sessionKey = authKey

    let cancelled = false

    async function loadObservationsForProject(projectId: string) {
      setIsLoadingObservations(true)
      setObservationsError(null)
      setObservations(null)
      adminFieldsLoadedRef.current = {}
      projectAdminValuesLoadedRef.current = {}
      bulkAdminValuesProjectIdRef.current = ''
      bulkAdminValuesByIdRef.current = {}
      bulkAdminValuesBySignatureRef.current = {}
      bulkAdminMetaByIdRef.current = {}
      bulkAdminMetaBySignatureRef.current = {}
      setBulkAdminValuesVersion((value) => value + 1)
      bulkMergedKeyRef.current = ''
      setFieldFormId('')
      setFieldForm(null)
      setQuestions([])

      try {
        const formsData = await fetchFieldForms(sessionKey)
        const forms = normalizeFieldForms(formsData)
        const match = forms.find((form) => projectIdToString(form.project) === projectId)
        const fieldFormId = match ? fieldFormIdToString(match) : ''

        if (!fieldFormId) throw new Error('No se encontró field_form_id para este proyecto')

        if (cancelled) return
        setFieldFormId(fieldFormId)
        setFieldForm(match ?? null)
        setQuestions(extractQuestions(match ?? null))

        try {
          const detail = await fetchFieldFormDetail(sessionKey, fieldFormId)
          if (!cancelled) {
            const detailQuestions = extractQuestions(detail)
            if (detailQuestions.length) {
              setFieldForm(detail)
              setQuestions(detailQuestions)
            }
          }
        } catch {
          // Ignorado: seguimos con el resumen de field form.
        }

        const observationsData = await fetchFieldFormObservations(sessionKey, fieldFormId)
        if (!cancelled) setObservations(observationsData as ObservationCollection)
      } catch (error) {
        if (!cancelled) {
          setObservationsError(error instanceof Error ? error.message : 'Error inesperado cargando observaciones')
        }
      } finally {
        if (!cancelled) setIsLoadingObservations(false)
      }
    }

    void loadObservationsForProject(selectedProjectId)

    return () => {
      cancelled = true
    }
  }, [authKey, selectedProjectId, reloadVersion])

  React.useEffect(() => {
    if (!authKey || !selectedProjectId || projectObservationFields.length === 0) return

    const projectId = String(selectedProjectId)
    if (projectAdminValuesLoadedRef.current[projectId]) return

    let cancelled = false

    ;(async () => {
      try {
        const body = await fetchProjectObservationAdminValues(authKey, projectId)
        if (!body) {
          if (!cancelled) projectAdminValuesLoadedRef.current[projectId] = true
          return
        }

        const index = normalizeObservationAdminValuesResponse(body)
        if (cancelled) return

        projectAdminValuesLoadedRef.current[projectId] = true
        bulkAdminValuesProjectIdRef.current = projectId
        bulkAdminValuesByIdRef.current = index.byId
        bulkAdminValuesBySignatureRef.current = index.bySignature
        bulkAdminMetaByIdRef.current = index.metaById
        bulkAdminMetaBySignatureRef.current = index.metaBySignature
        setBulkAdminValuesVersion((value) => value + 1)
      } catch {
        if (!cancelled) projectAdminValuesLoadedRef.current[projectId] = true
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authKey, projectObservationFields, selectedProjectId, reloadVersion])

  React.useEffect(() => {
    if (!observations) return
    const projectId = String(selectedProjectId || '')
    if (!projectId || bulkAdminValuesProjectIdRef.current !== projectId) return

    const byId = bulkAdminValuesByIdRef.current
    const bySignature = bulkAdminValuesBySignatureRef.current
    const metaById = bulkAdminMetaByIdRef.current
    const metaBySignature = bulkAdminMetaBySignatureRef.current
    if (Object.keys(byId).length === 0 && Object.keys(metaById).length === 0) return

    const mergeKey = `${projectId}:${bulkAdminValuesVersion}`
    if (bulkMergedKeyRef.current === mergeKey) return
    bulkMergedKeyRef.current = mergeKey

    setObservations((previous) => {
      const rows = normalizeObservationRows(previous)
      if (!rows.length) return previous

      let changed = false
      const mergedRows = rows.map((observation) => {
        const directId = String(observation?.id ?? observation?.observation_id ?? '')
        let values = directId ? byId[directId] : undefined
        let meta = directId ? metaById[directId] : undefined

        if (!values || !meta) {
          const ts = typeof observation?.timestamp === 'string' ? observation.timestamp : ''
          const creator = observation?.creator_id ?? observation?.creatorId
          const creatorStr = creator === null || creator === undefined ? '' : String(creator)
          if (ts && creatorStr) values = bySignature[`${ts}|${creatorStr}`]
          if (ts && creatorStr) meta = metaBySignature[`${ts}|${creatorStr}`]
        }

        if (!values && !meta) return observation

        const currentAdmin = observation?.admin_values
        const currentRecord =
          currentAdmin && typeof currentAdmin === 'object' && !Array.isArray(currentAdmin)
            ? currentAdmin
            : null
        const currentMeta =
          observation?.admin_field_meta && typeof observation.admin_field_meta === 'object' && !Array.isArray(observation.admin_field_meta)
            ? observation.admin_field_meta
            : null

        let hasValueDiff = Boolean(values)
        if (values && currentRecord) {
          hasValueDiff = false
          for (const key of Object.keys(values)) {
            if (currentRecord[key] !== values[key]) {
              hasValueDiff = true
              break
            }
          }
        }

        let hasMetaDiff = Boolean(meta)
        if (meta && currentMeta) {
          hasMetaDiff = false
          for (const key of Object.keys(meta)) {
            const currentFieldMeta = currentMeta[key]
            const nextFieldMeta = meta[key]
            if (currentFieldMeta?.updated_at !== nextFieldMeta?.updated_at || currentFieldMeta?.updated_by !== nextFieldMeta?.updated_by) {
              hasMetaDiff = true
              break
            }
          }
        }

        if (!hasValueDiff && !hasMetaDiff) {
          if (directId) adminFieldsLoadedRef.current[directId] = true
          return observation
        }

        changed = true
        const next: ObservationRow = { ...observation }
        if (values) {
          next.admin_values = {
            ...(currentAdmin && typeof currentAdmin === 'object' && !Array.isArray(currentAdmin) ? currentAdmin : {}),
            ...values,
          }
        }
        if (meta) {
          next.admin_field_meta = {
            ...(currentMeta ?? {}),
            ...meta,
          }
        }
        if (directId) adminFieldsLoadedRef.current[directId] = true
        return next
      })

      if (!changed) return previous
      if (Array.isArray(previous)) return mergedRows
      if (previous && typeof previous === 'object' && Array.isArray(previous.results)) {
        return { ...previous, results: mergedRows }
      }
      return mergedRows
    })
  }, [bulkAdminValuesVersion, observations, selectedProjectId])

  const rawValueForProjectField = React.useCallback((observation: ObservationRow, fieldKey: string): unknown => {
    const keyString = String(fieldKey)
    const record = observation as Record<string, unknown>

    const candidates = [
      record.admin_values,
      record.adminValues,
      record.admin_fields_values,
      record.adminFieldsValues,
      record.admin_fields,
      record.adminFields,
    ]

    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        const maybeRecord = candidate as Record<string, unknown>
        const maybeValues = maybeRecord.values
        if (maybeValues && typeof maybeValues === 'object' && !Array.isArray(maybeValues)) {
          const valuesRecord = maybeValues as Record<string, unknown>
          if (keyString in valuesRecord) return valuesRecord[keyString]
        }
        if (keyString in maybeRecord) return maybeRecord[keyString]
      }

      if (Array.isArray(candidate)) {
        const entry = candidate.find((row) => {
          if (!row || typeof row !== 'object') return false
          const normalized = row as Record<string, unknown>
          return String(normalized.key ?? normalized.field_key ?? normalized.fieldKey ?? '') === keyString
        })

        if (entry && typeof entry === 'object') {
          const normalized = entry as Record<string, unknown>
          if ('value' in normalized) return normalized.value
          if (normalized.values && typeof normalized.values === 'object' && !Array.isArray(normalized.values)) {
            const valuesObj = normalized.values as Record<string, unknown>
            if (keyString in valuesObj) return valuesObj[keyString]
          }
        }
      }
    }

    const data = Array.isArray(observation?.data) ? (observation.data as Array<Record<string, unknown>>) : []
    const entry = data.find((item) => String(item?.key) === keyString)
    return entry?.value
  }, [])

  const displayValueForQuestion = React.useCallback((observation: ObservationRow, questionId: number): string | null => {
    const data = Array.isArray(observation?.data) ? (observation.data as Array<Record<string, unknown>>) : []
    const keyString = String(questionId)
    const entry = data.find((item) => String(item?.key) === keyString)
    const value = entry?.value

    if (value === null || value === undefined) return null

    const otherTextEntry = data.find((item) => String(item?.key) === `${keyString}_other_text`)
    const otherText = typeof otherTextEntry?.value === 'string' ? otherTextEntry.value.trim() : ''

    const stringValue = Array.isArray(value)
      ? value
          .map((item) => {
            const itemValue = String(item)
            return otherText && itemValue.trim() === otherText ? `${itemValue} (other)` : itemValue
          })
          .join(', ')
      : String(value)

    if (Array.isArray(value)) return stringValue

    return otherText && stringValue.trim() === otherText ? `${stringValue} (other)` : stringValue
  }, [])

  const projectFieldMetaForObservation = React.useCallback((observation: ObservationRow, fieldKey: string): ObservationAdminFieldMeta | null => {
    const keyString = String(fieldKey)
    const record = observation as Record<string, unknown>

    const directMetaCandidates = [record.admin_field_meta, record.adminFieldMeta]
    for (const candidate of directMetaCandidates) {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
      const metaRecord = candidate as Record<string, unknown>
      const value = metaRecord[keyString]
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const meta = value as Record<string, unknown>
      const updatedAt = typeof meta.updated_at === 'string' ? meta.updated_at : null
      const updatedBy = typeof meta.updated_by === 'string' ? meta.updated_by : null
      if (updatedAt || updatedBy) return { updated_at: updatedAt, updated_by: updatedBy }
    }

    const candidates = [
      record.admin_values,
      record.adminValues,
      record.admin_fields_values,
      record.adminFieldsValues,
      record.admin_fields,
      record.adminFields,
    ]

    for (const candidate of candidates) {
      if (!candidate) continue

      if (Array.isArray(candidate)) {
        const entry = candidate.find((row) => {
          if (!row || typeof row !== 'object') return false
          const normalized = row as Record<string, unknown>
          return String(normalized.key ?? normalized.field_key ?? normalized.fieldKey ?? '') === keyString
        })

        if (entry && typeof entry === 'object') {
          const normalized = entry as Record<string, unknown>
          const updatedAt = typeof normalized.updated_at === 'string' ? normalized.updated_at : null
          const updatedBy = typeof normalized.updated_by === 'string' ? normalized.updated_by : null
          if (updatedAt || updatedBy) return { updated_at: updatedAt, updated_by: updatedBy }
        }

        continue
      }

      if (typeof candidate === 'object') {
        const normalized = candidate as Record<string, unknown>
        const nestedField = normalized[keyString]
        if (nestedField && typeof nestedField === 'object' && !Array.isArray(nestedField)) {
          const nestedMeta = nestedField as Record<string, unknown>
          const updatedAt = typeof nestedMeta.updated_at === 'string' ? nestedMeta.updated_at : null
          const updatedBy = typeof nestedMeta.updated_by === 'string' ? nestedMeta.updated_by : null
          if (updatedAt || updatedBy) return { updated_at: updatedAt, updated_by: updatedBy }
        }

        const updatedKeys = Array.isArray(normalized.updated) ? normalized.updated.filter((value): value is string => typeof value === 'string') : []
        if (updatedKeys.includes(keyString)) {
          const updatedAt = typeof normalized.updated_at === 'string' ? normalized.updated_at : null
          const updatedBy = typeof normalized.updated_by === 'string' ? normalized.updated_by : null
          if (updatedAt || updatedBy) return { updated_at: updatedAt, updated_by: updatedBy }
        }
      }
    }

    return null
  }, [])

  const updateObservationInState = React.useCallback((
    previous: ObservationCollection,
    observationId: unknown,
    updater: (observation: ObservationRow) => ObservationRow
  ): ObservationCollection => {
    if (!observationId) return previous
    const targetId = String(observationId)

    if (Array.isArray(previous)) {
      return previous.map((observation) => {
        const rowId = String(observation?.id ?? observation?.observation_id ?? '')
        return rowId === targetId ? updater(observation) : observation
      })
    }

    if (previous && typeof previous === 'object' && Array.isArray(previous.results)) {
      return {
        ...previous,
        results: previous.results.map((observation) => {
          const rowId = String(observation?.id ?? observation?.observation_id ?? '')
          return rowId === targetId ? updater(observation) : observation
        }),
      }
    }

    return previous
  }, [])

  const ensureAdminFieldsLoadedForObservation = React.useCallback(async (observation: ObservationRow): Promise<void> => {
    const observationId = String(observation?.id ?? '')
    if (!observationId) return
    adminFieldsLoadedRef.current[observationId] = true
  }, [])

  const saveProjectFieldValue = React.useCallback(async ({
    observation,
    field,
    value,
  }: {
    observation: ObservationRow
    field: Pick<ProjectObservationField, 'key' | 'field_type' | 'choices'>
    value: unknown
  }) => {
    if (!authKey) return

    const observationId = observation?.id ?? observation?.observation_id
    const fieldKey = field.key
    const cellKey = `${String(observationId)}:${String(fieldKey)}`

    setCellSaving((previous) => ({ ...previous, [cellKey]: true }))
    setCellSaveError((previous) => {
      const next = { ...previous }
      delete next[cellKey]
      return next
    })

    try {
      const saved = await saveObservationAdminFields({
        sessionKey: authKey,
        observationId: String(observationId),
        values: { [fieldKey]: value },
      })

      const serverValues = normalizeAdminValuesFromResponse(saved)
      const meta = normalizeAdminFieldMetaFromResponse(saved)
      setObservations((previous) =>
        updateObservationInState(previous, observationId, (current) => {
          if (saved && typeof saved === 'object' && 'id' in (saved as Record<string, unknown>)) {
            return saved as ObservationRow
          }

          const nextAdmin = {
            ...(current.admin_values && typeof current.admin_values === 'object' ? current.admin_values : {}),
            ...(serverValues ?? { [fieldKey]: value }),
          }

          const next = {
            ...current,
            admin_values: nextAdmin,
            admin_field_meta: {
              ...(current.admin_field_meta && typeof current.admin_field_meta === 'object' ? current.admin_field_meta : {}),
              ...meta,
            },
          }
          const updatedId = String(next?.id ?? next?.observation_id ?? '')
          if (updatedId) adminFieldsLoadedRef.current[updatedId] = true
          return next
        })
      )

      setCellDrafts((previous) => {
        const next = { ...previous }
        delete next[cellKey]
        return next
      })
    } catch (error) {
      setCellSaveError((previous) => ({
        ...previous,
        [cellKey]: error instanceof Error ? error.message : 'Error guardando',
      }))
    } finally {
      setCellSaving((previous) => ({ ...previous, [cellKey]: false }))
    }
  }, [authKey, updateObservationInState])

  const valueForSort = React.useCallback((observation: ObservationRow, sortKey: ObservationSortKey): string | number | null => {
    if (sortKey.kind === 'builtin') {
      if (sortKey.id === 'id') {
        const id = observation?.id
        if (typeof id === 'number') return id
        if (typeof id === 'string' && id.trim()) {
          const asNumber = Number(id)
          return Number.isFinite(asNumber) ? asNumber : id
        }
        return null
      }

      if (sortKey.id === 'timestamp') {
        const timestamp = observation?.timestamp
        if (typeof timestamp === 'string' && timestamp.trim()) {
          const asDate = Date.parse(timestamp)
          return Number.isFinite(asDate) ? asDate : timestamp
        }
        return null
      }

      const geoposition = observation?.geoposition
      return typeof geoposition === 'string' && geoposition.trim() ? geoposition : null
    }

    if (sortKey.kind === 'projectField') {
      const value = rawValueForProjectField(observation, sortKey.key)
      if (value === null || value === undefined) return null
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return ''
        const asNumber = Number(trimmed)
        return Number.isFinite(asNumber) ? asNumber : trimmed
      }
      return String(value)
    }

    const images = Array.isArray(observation?.images) ? (observation.images as Array<Record<string, unknown>>) : []
    const image = images.find((item) => String(item?.question) === String(sortKey.id))
    if (image?.image && typeof image.image === 'string') return image.image

    const data = Array.isArray(observation?.data) ? (observation.data as Array<Record<string, unknown>>) : []
    const entry = data.find((item) => String(item?.key) === String(sortKey.id))
    const value = entry?.value
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return ''
      const asNumber = Number(trimmed)
      return Number.isFinite(asNumber) ? asNumber : trimmed
    }
    return String(value)
  }, [rawValueForProjectField])

  const toggleSort = React.useCallback((nextKey: ObservationSortKey) => {
    setTableSort((previous) => {
      if (!previous) return { key: nextKey, dir: 'asc' }
      const same =
        (previous.key.kind === 'builtin' && nextKey.kind === 'builtin' && previous.key.id === nextKey.id) ||
        (previous.key.kind === 'projectField' && nextKey.kind === 'projectField' && previous.key.id === nextKey.id && previous.key.key === nextKey.key) ||
        (previous.key.kind === 'question' && nextKey.kind === 'question' && previous.key.id === nextKey.id)
      if (!same) return { key: nextKey, dir: 'asc' }
      return { key: previous.key, dir: previous.dir === 'asc' ? 'desc' : 'asc' }
    })
  }, [])

  const sortIndicatorFor = React.useCallback((key: ObservationSortKey): string => {
    if (!tableSort) return ''
    const same =
      (tableSort.key.kind === 'builtin' && key.kind === 'builtin' && tableSort.key.id === key.id) ||
      (tableSort.key.kind === 'projectField' && key.kind === 'projectField' && tableSort.key.id === key.id && tableSort.key.key === key.key) ||
      (tableSort.key.kind === 'question' && key.kind === 'question' && tableSort.key.id === key.id)
    if (!same) return ''
    return tableSort.dir === 'asc' ? ' ▲' : ' ▼'
  }, [tableSort])

  const normalizedObservationRows = React.useMemo(() => normalizeObservationRows(observations), [observations])
  const sortedObservationRows = React.useMemo(() => {
    if (!tableSort) return normalizedObservationRows
    const direction = tableSort.dir === 'asc' ? 1 : -1
    return [...normalizedObservationRows].sort((left, right) => compareForSort(valueForSort(left, tableSort.key), valueForSort(right, tableSort.key)) * direction)
  }, [normalizedObservationRows, tableSort, valueForSort])

  const exportToCSV = React.useCallback(() => {
    if (normalizedObservationRows.length === 0) return

    const headers = ['ID', 'Fecha', 'Geoposición']
    questions.forEach((question) => headers.push(question.question_text))
    projectObservationFields.forEach((field) => headers.push(field.label))

    const csvRows = normalizedObservationRows.map((observation) => {
      const row: string[] = []
      row.push(String(observation.id || ''))
      row.push(typeof observation.timestamp === 'string' ? observation.timestamp : '')
      row.push(typeof observation.geoposition === 'string' ? observation.geoposition : '')

      questions.forEach((question) => {
        const images = Array.isArray(observation?.images) ? (observation.images as Array<Record<string, unknown>>) : []
        const image = images.find((item) => String(item?.question) === String(question.id))
        const value = displayValueForQuestion(observation, question.id)

        if (image?.image && typeof image.image === 'string') row.push(image.image)
        else if (value !== null && value !== undefined) row.push(value)
        else row.push('')
      })

      projectObservationFields.forEach((field) => {
        const value = rawValueForProjectField(observation, field.key)
        row.push(value !== null && value !== undefined ? String(value) : '')
      })

      return row
    })

    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...csvRows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `observaciones_${selectedProjectId}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast({ title: 'CSV exportado', description: 'La exportación se ha descargado correctamente.', variant: 'success' })
  }, [displayValueForQuestion, normalizedObservationRows, projectObservationFields, questions, rawValueForProjectField, selectedProjectId, showToast])

  const loadObservationEmailLogs = React.useCallback(async (observationId: string, forceRefresh = false) => {
    if (!authKey || !observationId) return []

    if (!forceRefresh) {
      const cached = emailLogsCacheRef.current[observationId]
      if (cached) return cached
    }

    const response = await fetchObservationEmailLogs(authKey, observationId)
    const normalized = normalizeObservationEmailLogs(response)
    emailLogsCacheRef.current[observationId] = normalized
    return normalized
  }, [authKey])

  const openObservationEmailLogs = React.useCallback(async (observation: ObservationRow) => {
    const observationId = String(observation?.id ?? observation?.observation_id ?? '')
    if (!authKey || !observationId) return

    setEmailLogsObservationId(observationId)
    setEmailLogsOpen(true)
    setEmailLogsError(null)

    setIsLoadingEmailLogs(true)
    setEmailLogs(emailLogsCacheRef.current[observationId] ?? [])

    try {
      const normalized = await loadObservationEmailLogs(observationId)
      setEmailLogs(normalized)
    } catch (error) {
      setEmailLogsError(error instanceof Error ? error.message : 'No se pudo cargar el historial de correos')
    } finally {
      setIsLoadingEmailLogs(false)
    }
  }, [authKey, loadObservationEmailLogs])

  const openObservationEmailComposer = React.useCallback((observation: ObservationRow) => {
    const observationId = String(observation?.id ?? observation?.observation_id ?? '')
    if (!observationId) return

    setSendEmailObservationId(observationId)
    setSendEmailOpen(true)
    setSendObservationEmailError(null)
    setSendEmailInitialDraft({
      subject: selectedProjectEmailSubject ?? '',
      includeObservationData: true,
      allowReply: false,
      introText: selectedProjectEmailIntro ?? '',
      body: '',
    })
  }, [selectedProjectEmailIntro, selectedProjectEmailSubject])

  const sendObservationEmailForObservation = React.useCallback(async ({
    observationId,
    payload,
    showSuccessToast = true,
  }: SendObservationEmailOptions) => {
    if (!authKey || !observationId) return

    await sendObservationEmail({
      sessionKey: authKey,
      observationId,
      payload,
    })

    setObservations((previous) =>
      updateObservationInState(previous, observationId, (current) => ({
        ...current,
        email_count: nextObservationEmailCount(current),
        has_observation_email: true,
      }))
    )

    delete emailLogsCacheRef.current[observationId]

    if (emailLogsOpen && emailLogsObservationId === observationId) {
      const refreshed = await loadObservationEmailLogs(observationId, true)
      setEmailLogs(refreshed)
    }

    if (showSuccessToast) {
      showToast({
        title: 'Correo enviado',
        description: `Observación ${observationId}`,
        variant: 'success',
      })
    }
  }, [authKey, emailLogsObservationId, emailLogsOpen, loadObservationEmailLogs, showToast, updateObservationInState])

  const closeObservationEmailComposer = React.useCallback(() => {
    setSendEmailOpen(false)
    setSendEmailObservationId(null)
    setSendObservationEmailError(null)
    setIsSendingObservationEmail(false)
    setSendEmailInitialDraft({
      subject: '',
      includeObservationData: true,
      allowReply: false,
      introText: '',
      body: '',
    })
  }, [])

  const submitObservationEmail = React.useCallback(async (draft: ObservationEmailDraft) => {
    if (!authKey || !sendEmailObservationId) return

    const payload: SendObservationEmailPayload = {
      include_observation_data: draft.includeObservationData,
      allow_reply: draft.allowReply,
    }

    const subject = draft.subject.trim()
    if (subject) payload.subject = subject

    if (draft.includeObservationData) {
      const introText = draft.introText.trim()
      if (introText) payload.intro_text = introText
    } else {
      const body = draft.body.trim()
      if (!body) {
        setSendObservationEmailError(i18n.t('emailDialog.bodyRequired'))
        return
      }
      payload.body = body
    }

    setIsSendingObservationEmail(true)
    setSendObservationEmailError(null)

    try {
      await sendObservationEmailForObservation({
        observationId: sendEmailObservationId,
        payload,
      })
      closeObservationEmailComposer()
    } catch (error) {
      setSendObservationEmailError(error instanceof Error ? error.message : 'No se pudo enviar el correo')
    } finally {
      setIsSendingObservationEmail(false)
    }
  }, [authKey, closeObservationEmailComposer, sendEmailObservationId, sendObservationEmailForObservation])

  const closeObservationEmailLogs = React.useCallback(() => {
    setEmailLogsOpen(false)
    setEmailLogsObservationId(null)
    setEmailLogsError(null)
    setEmailLogs([])
    setIsLoadingEmailLogs(false)
  }, [])

  const clearObservations = React.useCallback(() => {
    setFieldFormId('')
    setFieldForm(null)
    setQuestions([])
    setObservations(null)
    setObservationsError(null)
    setIsLoadingObservations(false)
    setCellDrafts({})
    setCellSaving({})
    setCellSaveError({})
    setTableSort(null)
    adminFieldsLoadedRef.current = {}
    projectAdminValuesLoadedRef.current = {}
    bulkAdminValuesProjectIdRef.current = ''
    bulkAdminValuesByIdRef.current = {}
    bulkAdminValuesBySignatureRef.current = {}
    bulkAdminMetaByIdRef.current = {}
    bulkAdminMetaBySignatureRef.current = {}
    bulkMergedKeyRef.current = ''
    emailLogsCacheRef.current = {}
    setEmailLogsOpen(false)
    setEmailLogsObservationId(null)
    setEmailLogs([])
    setIsLoadingEmailLogs(false)
    setEmailLogsError(null)
    setSendEmailOpen(false)
    setSendEmailObservationId(null)
    setSendEmailInitialDraft({
      subject: '',
      includeObservationData: true,
      allowReply: false,
      introText: '',
      body: '',
    })
    setIsSendingObservationEmail(false)
    setSendObservationEmailError(null)
  }, [])

  return {
    questions,
    observations,
    observationsError,
    isLoadingObservations,
    cellDrafts,
    setCellDrafts,
    cellSaving,
    cellSaveError,
    normalizedObservationRows,
    sortedObservationRows,
    normalizeObservations,
    extractLatLon,
    displayValueForQuestion,
    rawValueForProjectField,
    projectFieldMetaForObservation,
    ensureAdminFieldsLoadedForObservation,
    saveProjectFieldValue,
    emailLogsOpen,
    emailLogsObservationId,
    emailLogs,
    isLoadingEmailLogs,
    emailLogsError,
    openObservationEmailLogs,
    closeObservationEmailLogs,
    sendEmailOpen,
    sendEmailObservationId,
    sendEmailInitialDraft,
    isSendingObservationEmail,
    sendObservationEmailError,
    openObservationEmailComposer,
    closeObservationEmailComposer,
    submitObservationEmail,
    sendObservationEmailForObservation,
    toggleSort,
    sortIndicatorFor,
    exportToCSV,
    clearObservations,
    reloadObservations,
  }
}
