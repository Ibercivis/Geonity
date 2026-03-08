import * as React from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Mail, FlaskConical, ClipboardList, Pencil, Trash2, Download, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapboxMap } from '@/components/MapboxMap'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

export default function App() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [authKey, setAuthKey] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('geonity.authKey')
  })
  const [projects, setProjects] = React.useState<Array<{ id?: unknown; name?: unknown; is_creator?: boolean; is_admin?: boolean; email_intro?: string; email_subject?: string }>>([])
  const [projectsError, setProjectsError] = React.useState<string | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false)
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>('')

  const [fieldFormId, setFieldFormId] = React.useState<string>('')
  const [fieldForm, setFieldForm] = React.useState<unknown>(null)
  const [questions, setQuestions] = React.useState<
    Array<{ id: number; question_text: string; answer_type: string; mandatory: boolean }>
  >([])

  const [projectObservationFields, setProjectObservationFields] = React.useState<
    Array<{
      id: number
      key: string
      label: string
      field_type: string
      required: boolean
      choices?: string[]
      order?: number
      help_text?: string
    }>
  >([])
  const [isLoadingProjectObservationFields, setIsLoadingProjectObservationFields] = React.useState(false)
  const [projectObservationFieldsError, setProjectObservationFieldsError] = React.useState<string | null>(null)
  const [projectObservationFieldsCollectionPath, setProjectObservationFieldsCollectionPath] = React.useState<string | null>(
    null
  )

  const [editingProjectObservationFieldId, setEditingProjectObservationFieldId] = React.useState<number | null>(null)
  const [pofKey, setPofKey] = React.useState('')
  const [pofLabel, setPofLabel] = React.useState('')
  const [pofFieldType, setPofFieldType] = React.useState<'bool' | 'text' | 'number' | 'date' | 'choice' | 'mchoice'>('bool')
  const [pofRequired, setPofRequired] = React.useState(false)
  const [pofIncludeInEmail, setPofIncludeInEmail] = React.useState(false)
  const [pofOrder, setPofOrder] = React.useState<string>('')
  const [pofHelpText, setPofHelpText] = React.useState('')
  const [pofChoicesText, setPofChoicesText] = React.useState('')
  const [isSavingProjectObservationField, setIsSavingProjectObservationField] = React.useState(false)
  const [saveProjectObservationFieldError, setSaveProjectObservationFieldError] = React.useState<string | null>(null)
  const [isColumnModalOpen, setIsColumnModalOpen] = React.useState(false)

  // Email intro (solo creators)
  const [emailIntro, setEmailIntro] = React.useState('')
  const [emailSubjectDefault, setEmailSubjectDefault] = React.useState('')
  const [isSavingEmailIntro, setIsSavingEmailIntro] = React.useState(false)
  const [emailIntroError, setEmailIntroError] = React.useState<string | null>(null)
  const [emailIntroSaved, setEmailIntroSaved] = React.useState(false)

  // Email dialog por observación
  const [emailDialogObs, setEmailDialogObs] = React.useState<any | null>(null)   // modal correo personalizado
  const [emailHistoryObs, setEmailHistoryObs] = React.useState<any | null>(null) // modal historial
  const [emailSubject, setEmailSubject] = React.useState('')
  const [emailBody, setEmailBody] = React.useState('')
  const [isSendingEmail, setIsSendingEmail] = React.useState(false)
  const [emailSendResult, setEmailSendResult] = React.useState<any | null>(null)
  const [emailSendError, setEmailSendError] = React.useState<string | null>(null)
  const [emailLogs, setEmailLogs] = React.useState<any[]>([])
  const [isLoadingEmailLogs, setIsLoadingEmailLogs] = React.useState(false)
  // status, count y flags por observación
  const [obsEmailStatus, setObsEmailStatus] = React.useState<Record<string, 'pending' | 'sent' | 'failed'>>({})
  const [obsEmailCount, setObsEmailCount] = React.useState<Record<string, number>>({})
  const [obsHasPlainEmail, setObsHasPlainEmail] = React.useState<Record<string, boolean>>({})
  const [obsHasObsEmail, setObsHasObsEmail] = React.useState<Record<string, boolean>>({})
  const [isSendingDataEmail, setIsSendingDataEmail] = React.useState<Record<string, boolean>>({})
  const [emailTemplateDialogOpen, setEmailTemplateDialogOpen] = React.useState(false)

  // Bulk import
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [bulkStep, setBulkStep] = React.useState<1 | 2 | 3 | 4>(1)
  const [bulkRawRows, setBulkRawRows] = React.useState<string[][]>([])
  const [bulkHasHeader, setBulkHasHeader] = React.useState(true)
  const [bulkJoinCsvCol, setBulkJoinCsvCol] = React.useState(0)
  const [bulkJoinTarget, setBulkJoinTarget] = React.useState<'id' | 'timestamp'>('id')
  const [bulkMappings, setBulkMappings] = React.useState<Array<{ csvCol: number; pofKey: string }>>([])
  const [bulkProgress, setBulkProgress] = React.useState<{ total: number; done: number; errors: number } | null>(null)
  const [bulkRunning, setBulkRunning] = React.useState(false)
  const [bulkFinished, setBulkFinished] = React.useState(false)
  const [bulkUnmatched, setBulkUnmatched] = React.useState<string[]>([])
  const [bulkParseError, setBulkParseError] = React.useState<string | null>(null)
  const bulkFileInputRef = React.useRef<HTMLInputElement | null>(null)

  const [observations, setObservations] = React.useState<unknown>(null)
  const [observationsError, setObservationsError] = React.useState<string | null>(null)
  const [isLoadingObservations, setIsLoadingObservations] = React.useState(false)
  const adminFieldsLoadedRef = React.useRef<Record<string, boolean>>({})
  const adminFieldsInFlightRef = React.useRef<Set<string>>(new Set())
  const projectAdminValuesLoadedRef = React.useRef<Record<string, boolean>>({})
  const bulkAdminValuesProjectIdRef = React.useRef<string>('')
  const bulkAdminValuesByIdRef = React.useRef<Record<string, Record<string, unknown>>>({})
  const bulkAdminValuesBySignatureRef = React.useRef<Record<string, Record<string, unknown>>>({})
  const [bulkAdminValuesVersion, setBulkAdminValuesVersion] = React.useState(0)
  const bulkMergedKeyRef = React.useRef<string>('')

  const [imagePreview, setImagePreview] = React.useState<null | { url: string; top: number; left: number }>(null)
  const [imagePreviewLoading, setImagePreviewLoading] = React.useState(false)
  const [imagePreviewError, setImagePreviewError] = React.useState<string | null>(null)

  const [cellDrafts, setCellDrafts] = React.useState<Record<string, string>>({})
  const [cellSaving, setCellSaving] = React.useState<Record<string, boolean>>({})
  const [cellSaveError, setCellSaveError] = React.useState<Record<string, string>>({})

  const [tableSort, setTableSort] = React.useState<
    | null
    | {
        key:
          | { kind: 'builtin'; id: 'id' | 'timestamp' | 'geoposition' }
          | { kind: 'projectField'; id: number; key: string }
          | { kind: 'question'; id: number }
        dir: 'asc' | 'desc'
      }
  >(null)

  const [selectedObservationId, setSelectedObservationId] = React.useState<string | number | null>(null)
  const tableBodyRef = React.useRef<HTMLTableSectionElement | null>(null)

  // Scroll to selected observation in table
  React.useEffect(() => {
    if (!selectedObservationId || !tableBodyRef.current) return

    const row = tableBodyRef.current.querySelector(`[data-observation-id="${selectedObservationId}"]`)
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedObservationId])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (authKey) {
      window.localStorage.setItem('geonity.authKey', authKey)
    } else {
      window.localStorage.removeItem('geonity.authKey')
    }
  }, [authKey])

  React.useEffect(() => {
    if (!authKey) return

    const sessionKey = authKey

    let cancelled = false

    async function loadProjects() {
      setIsLoadingProjects(true)
      setProjectsError(null)

      try {
        const endpointPath = '/api/project/my_admin_projects/'
        const base = import.meta.env.DEV
          ? ''
          : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
        const url = base ? new URL(endpointPath, base).toString() : endpointPath

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            authorization: `Token ${sessionKey}`,
            'x-auth-key': sessionKey,
          },
          credentials: 'include',
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || `No se pudieron cargar proyectos (${res.status})`)
        }

        const contentType = res.headers.get('content-type') ?? ''
        const data = contentType.includes('application/json') ? await res.json() : await res.text()

        const parsed = normalizeProjects(data)

        if (!cancelled) {
          setProjects(parsed)
          if (!selectedProjectId && parsed.length > 0) {
            const firstId = projectIdToString(parsed[0]?.id)
            if (firstId) setSelectedProjectId(firstId)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inesperado cargando proyectos'
        if (!cancelled) setProjectsError(message)
      } finally {
        if (!cancelled) setIsLoadingProjects(false)
      }
    }

    loadProjects()

    return () => {
      cancelled = true
    }
  }, [authKey])

  React.useEffect(() => {
    if (!authKey) return
    if (!selectedProjectId) return

    const sessionKey = authKey

    let cancelled = false

    async function loadObservationsForProject(projectId: string) {
      setIsLoadingObservations(true)
      setObservationsError(null)
      setObservations(null)
      adminFieldsLoadedRef.current = {}
      adminFieldsInFlightRef.current = new Set()
      projectAdminValuesLoadedRef.current = {}
      bulkAdminValuesProjectIdRef.current = ''
      bulkAdminValuesByIdRef.current = {}
      bulkAdminValuesBySignatureRef.current = {}
      setBulkAdminValuesVersion((v) => v + 1)
      bulkMergedKeyRef.current = ''
      setFieldFormId('')
      setFieldForm(null)
      setQuestions([])

      try {
        const base = import.meta.env.DEV
          ? ''
          : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')

        // 1) Obtener field_form_id (vía /api/field_forms/ y filtrado por project)
        {
          const endpointPath = '/api/field_forms/'
          const url = base ? new URL(endpointPath, base).toString() : endpointPath

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              accept: 'application/json',
              authorization: `Token ${sessionKey}`,
              'x-auth-key': sessionKey,
            },
            credentials: 'include',
          })

          if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(text || `No se pudieron cargar field_forms (${res.status})`)
          }

          const contentType = res.headers.get('content-type') ?? ''
          const data = contentType.includes('application/json') ? await res.json() : await res.text()

          const forms = normalizeFieldForms(data)
          const match = forms.find((f) => projectIdToString(f.project) === projectId)
          const ffId = match ? fieldFormIdToString(match) : ''

          if (!ffId) {
            throw new Error('No se encontró field_form_id para este proyecto')
          }

          if (cancelled) return
          setFieldFormId(ffId)
          setFieldForm(match ?? null)
          setQuestions(extractQuestions(match ?? null))

          // 1.5) (Opcional pero recomendado) Cargar detalle del field_form para obtener preguntas
          try {
            const detailPath = `/api/field_form/${encodeURIComponent(ffId)}/`
            const detailUrl = base ? new URL(detailPath, base).toString() : detailPath
            const detailRes = await fetch(detailUrl, {
              method: 'GET',
              headers: {
                accept: 'application/json',
                authorization: `Token ${sessionKey}`,
                'x-auth-key': sessionKey,
              },
              credentials: 'include',
            })

            if (detailRes.ok) {
              const ct = detailRes.headers.get('content-type') ?? ''
              const detail = ct.includes('application/json') ? await detailRes.json() : await detailRes.text()
              if (!cancelled) {
                const detailQuestions = extractQuestions(detail)
                // Solo sustituimos si realmente trae preguntas.
                if (detailQuestions.length) {
                  setFieldForm(detail)
                  setQuestions(detailQuestions)
                }
              }
            }
          } catch {
            // Ignoramos: si no existe el endpoint, seguimos con lo básico.
          }

          // 2) Con field_form_id, pedir observaciones
          {
            const obsPath = `/api/field_form/${encodeURIComponent(ffId)}/observations/`
            const obsUrl = base ? new URL(obsPath, base).toString() : obsPath

            const obsRes = await fetch(obsUrl, {
              method: 'GET',
              headers: {
                accept: 'application/json',
                authorization: `Token ${sessionKey}`,
                'x-auth-key': sessionKey,
              },
              credentials: 'include',
            })

            if (!obsRes.ok) {
              const text = await obsRes.text().catch(() => '')
              throw new Error(text || `No se pudieron cargar observaciones (${obsRes.status})`)
            }

            const obsContentType = obsRes.headers.get('content-type') ?? ''
            const obsData = obsContentType.includes('application/json') ? await obsRes.json() : await obsRes.text()

            if (cancelled) return
            setObservations(obsData)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inesperado cargando observaciones'
        if (!cancelled) setObservationsError(message)
      } finally {
        if (!cancelled) setIsLoadingObservations(false)
      }
    }

    loadObservationsForProject(selectedProjectId)

    return () => {
      cancelled = true
    }
  }, [authKey, selectedProjectId])

  function normalizeObservationAdminValuesResponse(body: unknown): {
    byId: Record<string, Record<string, unknown>>
    bySignature: Record<string, Record<string, unknown>>
  } {
    const byId: Record<string, Record<string, unknown>> = {}
    const bySignature: Record<string, Record<string, unknown>> = {}

    const list: any[] = Array.isArray(body)
      ? (body as any[])
      : body && typeof body === 'object' && Array.isArray((body as any).observations)
        ? (((body as any).observations as any[]) ?? [])
        : body && typeof body === 'object' && Array.isArray((body as any).results)
          ? ((body as any).results as any[])
          : []

    for (const row of list) {
      const obsId =
        row?.observation_id ??
        row?.observationId ??
        row?.observation ??
        row?.id ??
        (row?.observation && typeof row.observation === 'object' ? row.observation.id : undefined)
      const obsIdStr = String(obsId ?? '')

      const valuesCandidate = row?.values ?? row?.admin_values ?? row?.adminValues ?? row?.data
      let values: Record<string, unknown> | null = null
      if (valuesCandidate && typeof valuesCandidate === 'object' && !Array.isArray(valuesCandidate)) {
        values = valuesCandidate as Record<string, unknown>
      } else {
        const nested = valuesCandidate?.values
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
          values = nested as Record<string, unknown>
        }
      }
      if (!values) continue

      if (obsIdStr) byId[obsIdStr] = values

      const ts = typeof row?.timestamp === 'string' ? row.timestamp : ''
      const creator = row?.creator_id ?? row?.creatorId
      const creatorStr = creator === null || creator === undefined ? '' : String(creator)
      if (ts && creatorStr) {
        bySignature[`${ts}|${creatorStr}`] = values
      }
    }

    return { byId, bySignature }
  }

  React.useEffect(() => {
    if (!authKey) return
    if (!selectedProjectId) return
    if (!projectObservationFields.length) return

    const projectId = String(selectedProjectId)
    if (projectAdminValuesLoadedRef.current[projectId]) return

    let cancelled = false

    ;(async () => {
      try {
        const sessionKey = authKey
        const base = import.meta.env.DEV ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
        const endpointPath = `/api/projects/${encodeURIComponent(projectId)}/observation-admin-values/`
        const url = import.meta.env.DEV ? endpointPath : base ? new URL(endpointPath, base).toString() : endpointPath

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            authorization: `Token ${sessionKey}`,
            'x-auth-key': sessionKey,
          },
          credentials: 'include',
        })

        if (!res.ok) {
          if (!cancelled) projectAdminValuesLoadedRef.current[projectId] = true
          return
        }

        const { body } = await readResponseBody(res)
        const index = normalizeObservationAdminValuesResponse(body)

        if (cancelled) return

        projectAdminValuesLoadedRef.current[projectId] = true

        // Guardamos el bulk aunque las observaciones aún no estén cargadas.
        bulkAdminValuesProjectIdRef.current = projectId
        bulkAdminValuesByIdRef.current = index.byId
        bulkAdminValuesBySignatureRef.current = index.bySignature
        setBulkAdminValuesVersion((v) => v + 1)
      } catch {
        if (!cancelled) projectAdminValuesLoadedRef.current[projectId] = true
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authKey, selectedProjectId, projectObservationFields])

  // Poblar email counts y flags desde los datos de observación
  React.useEffect(() => {
    const rows = normalizeObservations(observations)
    if (!rows.length) return
    const counts: Record<string, number> = {}
    const plain: Record<string, boolean> = {}
    const obsData: Record<string, boolean> = {}
    for (const o of rows as any[]) {
      const id = String(o?.id ?? o?.observation_id ?? '')
      if (!id) continue
      if (typeof o.email_count === 'number') counts[id] = o.email_count
      if (typeof o.has_plain_email === 'boolean') plain[id] = o.has_plain_email
      if (typeof o.has_observation_email === 'boolean') obsData[id] = o.has_observation_email
    }
    setObsEmailCount((prev) => ({ ...prev, ...counts }))
    setObsHasPlainEmail((prev) => ({ ...prev, ...plain }))
    setObsHasObsEmail((prev) => ({ ...prev, ...obsData }))
  }, [observations])

  React.useEffect(() => {
    if (!observations) return
    const projectId = String(selectedProjectId || '')
    if (!projectId) return
    if (bulkAdminValuesProjectIdRef.current !== projectId) return

    const byId = bulkAdminValuesByIdRef.current
    const bySig = bulkAdminValuesBySignatureRef.current
    if (!byId || Object.keys(byId).length === 0) return

    const mergeKey = `${projectId}:${bulkAdminValuesVersion}`
    if (bulkMergedKeyRef.current === mergeKey) return
    bulkMergedKeyRef.current = mergeKey

    setObservations((prev) => {
      const rows = normalizeObservations(prev)
      if (!rows.length) return prev

      let changed = false

      const mergedRows = rows.map((o: any) => {
        const directId = String(o?.id ?? o?.observation_id ?? '')
        let values = directId ? byId[directId] : undefined

        if (!values) {
          const ts = typeof o?.timestamp === 'string' ? o.timestamp : ''
          const creator = o?.creator_id ?? o?.creatorId
          const creatorStr = creator === null || creator === undefined ? '' : String(creator)
          if (ts && creatorStr) values = bySig[`${ts}|${creatorStr}`]
        }

        if (!values) return o

        const currentAdmin = o?.admin_values
        const currentRecord =
          currentAdmin && typeof currentAdmin === 'object' && !Array.isArray(currentAdmin)
            ? (currentAdmin as Record<string, unknown>)
            : null

        // Si ya tiene exactamente estos valores, no creamos un objeto nuevo.
        if (currentRecord) {
          let anyDiff = false
          for (const k of Object.keys(values)) {
            if (currentRecord[k] !== values[k]) {
              anyDiff = true
              break
            }
          }
          if (!anyDiff) {
            if (directId) adminFieldsLoadedRef.current[directId] = true
            return o
          }
        }

        const next = { ...(o ?? {}) } as any
        const current = next.admin_values
        next.admin_values = {
          ...(current && typeof current === 'object' && !Array.isArray(current) ? current : {}),
          ...values,
        }

        if (directId) adminFieldsLoadedRef.current[directId] = true
        changed = true
        return next
      })

      if (!changed) return prev

      if (Array.isArray(prev)) return mergedRows
      if (prev && typeof prev === 'object' && Array.isArray((prev as any).results)) {
        return { ...(prev as any), results: mergedRows }
      }
      return mergedRows
    })
  }, [observations, selectedProjectId, bulkAdminValuesVersion])

  function observationAlreadyHasAdminValues(o: any): boolean {
    if (!o || typeof o !== 'object') return false
    const record = o as Record<string, unknown>
    const candidates = [
      record['admin_values'],
      record['adminValues'],
      record['admin_fields_values'],
      record['adminFieldsValues'],
      record['admin_fields'],
      record['adminFields'],
    ]

    for (const c of candidates) {
      if (!c) continue
      if (Array.isArray(c)) {
        if (c.length > 0) return true
        continue
      }
      if (typeof c === 'object') {
        const r = c as Record<string, unknown>
        const values = r['values']
        if (values && typeof values === 'object' && !Array.isArray(values) && Object.keys(values as any).length > 0) return true
        if (Object.keys(r).length > 0) return true
      }
    }

    return false
  }

  async function ensureAdminFieldsLoadedForObservation(observation: any): Promise<void> {
    if (!authKey) return
    const observationId = String(observation?.id ?? '')
    if (!observationId) return

    if (observationAlreadyHasAdminValues(observation)) {
      adminFieldsLoadedRef.current[observationId] = true
      return
    }

    if (adminFieldsLoadedRef.current[observationId]) return
    if (adminFieldsInFlightRef.current.has(observationId)) return

    adminFieldsInFlightRef.current.add(observationId)
    try {
      const sessionKey = authKey
      const endpointPath = `/api/observations/${encodeURIComponent(observationId)}/admin-fields/`
      const res = await fetch(endpointPath, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Token ${sessionKey}`,
          'x-auth-key': sessionKey,
        },
        credentials: 'include',
      })

      if (!res.ok) {
        adminFieldsLoadedRef.current[observationId] = true
        return
      }

      const { body } = await readResponseBody(res)
      const values = normalizeAdminValuesFromResponse(body)
      if (values && Object.keys(values).length > 0) {
        setObservations((prev) =>
          updateObservationInState(prev, observationId, (o) => {
            const next = { ...(o ?? {}) } as any
            const current = next.admin_values
            next.admin_values = {
              ...(current && typeof current === 'object' && !Array.isArray(current) ? current : {}),
              ...values,
            }
            return next
          })
        )
      }

      adminFieldsLoadedRef.current[observationId] = true
    } finally {
      adminFieldsInFlightRef.current.delete(observationId)
    }
  }

  React.useEffect(() => {
    if (!authKey) return
    if (!observations) return
    if (!projectObservationFields.length) return

    const rows = normalizeObservations(observations)
    const sorted = (() => {
      if (!tableSort) return rows
      const dir = tableSort.dir === 'asc' ? 1 : -1
      const key = tableSort.key
      return [...rows].sort((ra: any, rb: any) => compareForSort(valueForSort(ra, key), valueForSort(rb, key)) * dir)
    })()

    // Si el bulk del proyecto ya está cargado, evitamos prefetch por observación.
    const projectId = String(selectedProjectId || '')
    if (projectId && projectAdminValuesLoadedRef.current[projectId]) return

    const maxPrefetch = sorted.length <= 30 ? sorted.length : 30
    const slice = sorted.slice(0, maxPrefetch)

    let cancelled = false
    ;(async () => {
      for (const o of slice) {
        if (cancelled) return
        // Prefetch solo si no hay valores; el resto se carga bajo demanda.
        if (!observationAlreadyHasAdminValues(o)) {
          await ensureAdminFieldsLoadedForObservation(o)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authKey, observations, projectObservationFields, tableSort, selectedProjectId])

  React.useEffect(() => {
    if (!authKey) return
    if (!selectedProjectId) return

    const sessionKey = authKey
    const projectId = selectedProjectId
    let cancelled = false

    async function loadProjectObservationFields() {
      setIsLoadingProjectObservationFields(true)
      setProjectObservationFieldsError(null)
      setProjectObservationFieldsCollectionPath(null)

      try {
        const base = import.meta.env.DEV
          ? ''
          : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')

        const { collectionPath, data } = await fetchProjectObservationFields({
          base,
          projectId,
          sessionKey,
        })

        if (!cancelled) {
          setProjectObservationFieldsCollectionPath(collectionPath)
          setProjectObservationFields(normalizeProjectObservationFields(data))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inesperado cargando columnas'
        if (!cancelled) setProjectObservationFieldsError(message)
      } finally {
        if (!cancelled) setIsLoadingProjectObservationFields(false)
      }
    }

    loadProjectObservationFields()

    return () => {
      cancelled = true
    }
  }, [authKey, selectedProjectId])

  // Sincronizar email_intro con el proyecto seleccionado
  React.useEffect(() => {
    const project = projects.find((p) => projectIdToString(p.id) === selectedProjectId)
    setEmailIntro(project?.email_intro ?? '')
    setEmailSubjectDefault(project?.email_subject ?? '')
    setEmailIntroError(null)
    setEmailIntroSaved(false)
  }, [selectedProjectId, projects])

  // ── Bulk import ────────────────────────────────────────────────────────────

  function parseToBulkRows(raw: string[][]): { ok: boolean; error?: string } {
    if (raw.length === 0) return { ok: false, error: 'El fichero está vacío' }
    const cols = raw[0].length
    if (cols < 2) return { ok: false, error: 'El fichero debe tener al menos 2 columnas' }
    return { ok: true }
  }

  async function handleBulkFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBulkParseError(null)
    setBulkRawRows([])
    setBulkStep(1)
    setBulkHasHeader(true)
    setBulkJoinCsvCol(0)
    setBulkJoinTarget('id')
    setBulkMappings([])
    setBulkProgress(null)
    setBulkRunning(false)
    setBulkFinished(false)
    setBulkUnmatched([])

    try {
      let rows: string[][] = []

      if (file.name.match(/\.xlsx?$/i)) {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rows = (XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as unknown[][]).map((r) =>
          (r as unknown[]).map((c) => (c === null || c === undefined ? '' : String(c)))
        )
      } else {
        const text = await file.text()
        const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
        rows = result.data
      }

      const check = parseToBulkRows(rows)
      if (!check.ok) {
        setBulkParseError(check.error ?? 'Error al parsear el fichero')
        return
      }

      setBulkRawRows(rows)
      setBulkDialogOpen(true)
    } catch (err) {
      setBulkParseError(err instanceof Error ? err.message : 'Error leyendo el fichero')
    }
  }

  function bulkHeaders(hasHeader: boolean): string[] {
    if (bulkRawRows.length === 0) return []
    if (hasHeader) return bulkRawRows[0].map((h, i) => h.trim() || `Col ${i + 1}`)
    return bulkRawRows[0].map((_, i) => `Col ${i + 1}`)
  }

  function bulkDataRows(hasHeader: boolean): string[][] {
    return hasHeader ? bulkRawRows.slice(1) : bulkRawRows
  }

  async function runBulkImport() {
    const obs = normalizeObservations(observations) as any[]
    const headers = bulkHeaders(bulkHasHeader)
    const dataRows = bulkDataRows(bulkHasHeader)

    // Construir índice de observaciones por join target
    const obsIndex = new Map<string, any>()
    for (const o of obs) {
      const key = bulkJoinTarget === 'id'
        ? String(o?.id ?? '')
        : String(o?.timestamp ?? '')
      if (key) obsIndex.set(key.trim(), o)
    }

    // Calcular matches
    const matched: Array<{ obs: any; values: Array<{ pofKey: string; value: string }> }> = []
    const unmatched: string[] = []

    for (const row of dataRows) {
      const joinVal = (row[bulkJoinCsvCol] ?? '').trim()
      if (!joinVal) continue
      const o = obsIndex.get(joinVal)
      if (!o) {
        unmatched.push(joinVal)
        continue
      }
      const values = bulkMappings
        .filter((m) => m.csvCol !== bulkJoinCsvCol && m.pofKey)
        .map((m) => ({ pofKey: m.pofKey, value: (row[m.csvCol] ?? '').trim() }))
      if (values.length > 0) matched.push({ obs: o, values })
    }

    setBulkUnmatched(unmatched)
    setBulkProgress({ total: matched.length, done: 0, errors: 0 })
    setBulkRunning(true)

    // Enviar con concurrencia máx 5
    const CONCURRENCY = 5
    let idx = 0
    let done = 0
    let errors = 0

    async function sendOne(item: typeof matched[number]) {
      for (const { pofKey, value } of item.values) {
        const field = projectObservationFields.find((f) => f.key === pofKey)
        if (!field) continue
        try {
          const coerced = coerceBulkValue(value, field)
          if (coerced === null) continue
          await saveProjectFieldValue({ observation: item.obs, field, value: coerced })
        } catch {
          errors++
        }
      }
      done++
      setBulkProgress({ total: matched.length, done, errors })
    }

    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (true) {
        const i = idx++
        if (i >= matched.length) break
        await sendOne(matched[i])
      }
    })

    await Promise.all(workers)
    setBulkRunning(false)
    setBulkFinished(true)
  }

  function coerceBulkValue(raw: string, field: { field_type: string; choices?: string[] }): unknown {
    const v = raw.trim()
    if (v === '') return null

    switch (field.field_type) {
      case 'number': {
        const n = Number(v.replace(',', '.'))
        return Number.isFinite(n) ? n : null
      }
      case 'bool': {
        const lower = v.toLowerCase()
        if (['true', '1', 'sí', 'si', 'yes', 's', 'y'].includes(lower)) return true
        if (['false', '0', 'no', 'n'].includes(lower)) return false
        return null
      }
      case 'date': {
        // Ya en formato ISO
        if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
        // Formato español DD/MM/YYYY o DD-MM-YYYY
        const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
        if (m) {
          const day = m[1].padStart(2, '0')
          const month = m[2].padStart(2, '0')
          const year = m[3].length === 2 ? `20${m[3]}` : m[3]
          return `${year}-${month}-${day}`
        }
        return null
      }
      case 'mchoice':
        return v.split(',').map((s) => s.trim()).filter(Boolean)
      default:
        return v  // text, choice
    }
  }

  // ── Email ────────────────────────────────────────────────────────────────────

  async function saveEmailIntro() {
    if (!authKey || !selectedProjectId) return
    setIsSavingEmailIntro(true)
    setEmailIntroError(null)
    setEmailIntroSaved(false)
    try {
      const base = import.meta.env.DEV ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
      const path = `/api/project/${encodeURIComponent(selectedProjectId)}/email-intro/`
      const url = base ? new URL(path, base).toString() : path
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Token ${authKey}`, 'x-auth-key': authKey },
        credentials: 'include',
        body: JSON.stringify({ email_intro: emailIntro, email_subject: emailSubjectDefault }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Error ${res.status}`)
      }
      setEmailIntroSaved(true)
      setTimeout(() => setEmailIntroSaved(false), 3000)
    } catch (err) {
      setEmailIntroError(err instanceof Error ? err.message : 'Error guardando')
    } finally {
      setIsSavingEmailIntro(false)
    }
  }

  function openEmailDialog(obs: any) {
    setEmailDialogObs(obs)
    setEmailSubject('')
    setEmailBody('')
    setEmailSendResult(null)
    setEmailSendError(null)
  }

  async function sendEmail() {
    if (!authKey || !emailDialogObs) return
    setIsSendingEmail(true)
    setEmailSendError(null)
    setEmailSendResult(null)
    try {
      const base = import.meta.env.DEV ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
      const obsId = emailDialogObs?.id ?? emailDialogObs?.observation_id
      const path = `/api/observations/${encodeURIComponent(String(obsId))}/send-email/`
      const url = base ? new URL(path, base).toString() : path
      const subjectToSend = emailSubject.trim() || undefined
      const body: Record<string, unknown> = {
        ...(subjectToSend ? { subject: subjectToSend } : {}),
        body: emailBody,
        include_observation_data: false,
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Token ${authKey}`, 'x-auth-key': authKey },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? `Error ${res.status}`)
      setEmailSendResult(data)
      const obsId2 = String(obsId)
      setObsEmailStatus((prev) => ({ ...prev, [obsId2]: data?.status ?? 'pending' }))
      setObsEmailCount((prev) => ({ ...prev, [obsId2]: (prev[obsId2] ?? 0) + 1 }))
      setObsHasPlainEmail((prev) => ({ ...prev, [obsId2]: true }))
    } catch (err) {
      setEmailSendError(err instanceof Error ? err.message : 'Error enviando email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  async function sendDataEmail(obs: any) {
    if (!authKey) return
    const obsId = String(obs?.id ?? obs?.observation_id ?? '')
    if (!obsId) return
    setIsSendingDataEmail((prev) => ({ ...prev, [obsId]: true }))
    try {
      const base = import.meta.env.DEV ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
      const path = `/api/observations/${encodeURIComponent(obsId)}/send-email/`
      const url = base ? new URL(path, base).toString() : path
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Token ${authKey}`, 'x-auth-key': authKey },
        credentials: 'include',
        body: JSON.stringify({ include_observation_data: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? `Error ${res.status}`)
      setObsEmailStatus((prev) => ({ ...prev, [obsId]: data?.status ?? 'pending' }))
      setObsEmailCount((prev) => ({ ...prev, [obsId]: (prev[obsId] ?? 0) + 1 }))
      setObsHasObsEmail((prev) => ({ ...prev, [obsId]: true }))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error enviando email')
    } finally {
      setIsSendingDataEmail((prev) => ({ ...prev, [obsId]: false }))
    }
  }

  async function loadEmailLogs(obs: any) {
    if (!authKey || !obs) return
    setIsLoadingEmailLogs(true)
    setEmailLogs([])
    try {
      const base = import.meta.env.DEV ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
      const obsId = obs?.id ?? obs?.observation_id
      const path = `/api/observations/${encodeURIComponent(String(obsId))}/email-logs/`
      const url = base ? new URL(path, base).toString() : path
      const res = await fetch(url, {
        headers: { authorization: `Token ${authKey}`, 'x-auth-key': authKey },
        credentials: 'include',
      })
      const data = await res.json().catch(() => [])
      const logs = Array.isArray(data) ? data : (data?.results ?? [])
      setEmailLogs(logs)
      const obsId2 = String(obsId)
      setObsEmailCount((prev) => ({ ...prev, [obsId2]: logs.length }))
      if (logs.length > 0) {
        setObsEmailStatus((prev) => ({ ...prev, [obsId2]: logs[0].status }))
      }
    } catch {
      setEmailLogs([])
    } finally {
      setIsLoadingEmailLogs(false)
    }
  }

  // ── Fin email ─────────────────────────────────────────────────────────────

  // ── Fin bulk import ─────────────────────────────────────────────────────────

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const endpointPath = '/api/users/authentication/login/'
      const base = import.meta.env.DEV
        ? ''
        : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
      const url = base ? new URL(endpointPath, base).toString() : endpointPath

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          username: email,
          password,
        }),
      })

      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? ''
        const body = contentType.includes('application/json')
          ? await res.json().catch(() => null)
          : await res.text().catch(() => '')

        const message = extractServerError(body) || `Login falló (${res.status})`
        throw new Error(message)
      }

      // Sin suposiciones sobre el formato: intentamos JSON pero no lo exigimos.
      const contentType = res.headers.get('content-type') ?? ''
      const data = contentType.includes('application/json') ? await res.json() : await res.text()
      console.log('login response:', data)

      const key = extractAuthKey(data)
      if (key) setAuthKey(key)
      setSuccess('Login correcto')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function extractAuthKey(body: unknown): string | null {
    if (!body) return null
    if (typeof body === 'string') return null
    if (typeof body !== 'object') return null

    const record = body as Record<string, unknown>
    if (typeof record['key'] === 'string') return record['key']
    if (typeof record['token'] === 'string') return record['token']
    if (typeof record['access'] === 'string') return record['access']
    return null
  }

  function extractServerError(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null

    const record = body as Record<string, unknown>

    const nonFieldErrors = record['non_field_errors']
    if (Array.isArray(nonFieldErrors) && typeof nonFieldErrors[0] === 'string') {
      return String(nonFieldErrors[0])
    }

    // Acepta también errores por campo tipo: { email: ["..."] }
    for (const value of Object.values(record)) {
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return String(value[0])
      }
    }

    if (typeof record['detail'] === 'string') return record['detail']
    if (typeof record['message'] === 'string') return record['message']

    return null
  }

  function normalizeProjects(data: unknown): Array<{ id?: unknown; name?: unknown; is_creator?: boolean; is_admin?: boolean; email_intro?: string; email_subject?: string }> {
    const list: unknown[] = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)['results'])
        ? ((data as Record<string, unknown>)['results'] as unknown[])
        : []

    return list.map((p) => {
      const raw = p as Record<string, unknown>
      return {
        ...raw,
        is_creator: Boolean(raw['is_creator']),
        is_admin: Boolean(raw['is_admin']),
        email_intro: typeof raw['email_intro'] === 'string' ? raw['email_intro'] : '',
        email_subject: typeof raw['email_subject'] === 'string' ? raw['email_subject'] : '',
      }
    })
  }

  function normalizeFieldForms(data: unknown): Array<{ id?: unknown; field_form_id?: unknown; project?: unknown }> {
    if (Array.isArray(data)) return data as Array<{ id?: unknown; field_form_id?: unknown; project?: unknown }>
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      const results = record['results']
      if (Array.isArray(results)) return results as Array<{ id?: unknown; field_form_id?: unknown; project?: unknown }>
    }
    return []
  }

  function normalizeProjectObservationFields(data: unknown): Array<{
    id: number
    key: string
    label: string
    field_type: string
    required: boolean
    choices?: string[]
    order?: number
    help_text?: string
  }> {
    const list = Array.isArray(data)
      ? data
      : data && typeof data === 'object' && Array.isArray((data as any).results)
        ? (data as any).results
        : []

    return list
      .map((raw: any) => {
        const id = typeof raw?.id === 'number' ? raw.id : typeof raw?.id === 'string' ? Number(raw.id) : NaN
        const key = typeof raw?.key === 'string' ? raw.key : ''
        const label = typeof raw?.label === 'string' ? raw.label : ''
        const field_type = typeof raw?.field_type === 'string' ? raw.field_type : ''
        const required = Boolean(raw?.required)
        const choices = Array.isArray(raw?.choices) ? raw.choices.filter((c: any) => typeof c === 'string') : undefined
        const order = typeof raw?.order === 'number' ? raw.order : typeof raw?.order === 'string' ? Number(raw.order) : undefined
        const help_text = typeof raw?.help_text === 'string' ? raw.help_text : undefined
        if (!Number.isFinite(id) || !key || !label || !field_type) return null
        return { id, key, label, field_type, required, choices, order, help_text }
      })
      .filter((x): x is any => Boolean(x))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label, 'es'))
  }

  function isProbablyHtml(contentType: string, body: unknown): boolean {
    if (contentType.includes('text/html')) return true
    if (typeof body === 'string' && body.trim().startsWith('<!DOCTYPE html')) return true
    if (typeof body === 'string' && body.trim().startsWith('<html')) return true
    return false
  }

  async function readResponseBody(res: Response): Promise<{ contentType: string; body: unknown }>
  {
    const contentType = res.headers.get('content-type') ?? ''
    const body = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => '')
    return { contentType, body }
  }

  async function fetchProjectObservationFields({
    base,
    projectId,
    sessionKey,
  }: {
    base: string
    projectId: string
    sessionKey: string
  }): Promise<{ collectionPath: string; data: unknown }> {
    const candidates = [
      `/api/projects/${encodeURIComponent(projectId)}/observation-fields/`,
      `/api/project/${encodeURIComponent(projectId)}/observation-fields/`,
      `/api/projects/${encodeURIComponent(projectId)}/observation_fields/`,
      `/api/project/${encodeURIComponent(projectId)}/observation_fields/`,
    ]

    let lastError: string | null = null

    for (const endpointPath of candidates) {
      // En dev, forzamos ruta relativa para que funcione el proxy de Vite
      // (especialmente cuando VITE_API_BASE_URL apunta al servidor HTTPS “normal”).
      const url = import.meta.env.DEV ? endpointPath : base ? new URL(endpointPath, base).toString() : endpointPath
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Token ${sessionKey}`,
          'x-auth-key': sessionKey,
        },
        credentials: 'include',
      })

      if (res.status === 404) {
        // Probamos el siguiente candidato.
        continue
      }

      const { contentType, body } = await readResponseBody(res)

      if (!res.ok) {
        // Si no es 404, asumimos que el endpoint existe pero hay un problema de auth/permiso o similar.
        const maybeMessage = extractServerError(body)
        const message =
          maybeMessage ||
          (isProbablyHtml(contentType, body)
            ? `Error cargando columnas (${res.status})`
            : typeof body === 'string' && body.trim()
              ? body
              : `Error cargando columnas (${res.status})`)
        lastError = message
        return { collectionPath: endpointPath, data: [] }
      }

      return { collectionPath: endpointPath, data: body }
    }

    throw new Error(
      lastError ||
        `El endpoint de columnas no existe en este servidor (404). Rutas probadas: ${candidates.join(' | ')}`
    )
  }

  function fieldFormIdToString(form: { id?: unknown; field_form_id?: unknown }): string {
    if (typeof form.field_form_id === 'string' && form.field_form_id) return form.field_form_id
    if (typeof form.field_form_id === 'number') return String(form.field_form_id)
    if (typeof form.id === 'string' && form.id) return form.id
    if (typeof form.id === 'number') return String(form.id)
    return ''
  }

  function extractQuestions(data: unknown): Array<{ id: number; question_text: string; answer_type: string; mandatory: boolean }> {
    if (!data || typeof data !== 'object') return []
    const record = data as Record<string, unknown>
    const candidates = [record['questions'], record['fields'], record['items'], record['questions_set']]

    for (const c of candidates) {
      if (Array.isArray(c)) {
        return c
          .map((q) => {
            if (!q || typeof q !== 'object') return null
            const qr = q as Record<string, unknown>
            const id = typeof qr.id === 'number' ? qr.id : typeof qr.id === 'string' ? Number(qr.id) : NaN
            const question_text = typeof qr.question_text === 'string' ? qr.question_text : ''
            const answer_type = typeof qr.answer_type === 'string' ? qr.answer_type : ''
            const mandatory = Boolean(qr.mandatory)
            if (!Number.isFinite(id) || !question_text) return null
            return { id, question_text, answer_type, mandatory }
          })
          .filter((x): x is { id: number; question_text: string; answer_type: string; mandatory: boolean } => Boolean(x))
      }
    }

    return []
  }

  function normalizeObservations(data: unknown): Array<{
    id?: unknown
    timestamp?: unknown
    geoposition?: unknown
    data?: unknown
    images?: unknown
  }> {
    if (Array.isArray(data)) return data as Array<any>
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      const results = record['results']
      if (Array.isArray(results)) return results as Array<any>
    }
    return []
  }

  function extractLatLon(geoposition: unknown): { a: string; b: string } | null {
    if (typeof geoposition !== 'string') return null
    const match = geoposition.match(/POINT\s*\(\s*([+-]?[0-9.]+)\s+([+-]?[0-9.]+)\s*\)/i)
    if (!match) return null
    return { a: match[1], b: match[2] }
  }

  function answerFor(observation: any, questionId: number): React.ReactNode {
    // 1) Imágenes
    const images = Array.isArray(observation?.images) ? observation.images : []
    const img = images.find((i: any) => String(i?.question) === String(questionId))
    if (img?.image && typeof img.image === 'string') {
      return (
        <a
          className="underline"
          href={img.image}
          target="_blank"
          rel="noreferrer"
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLAnchorElement).getBoundingClientRect()
            const width = 360
            const height = 240

            const pad = 12
            const left = Math.max(pad, Math.min(rect.left, window.innerWidth - width - pad))
            const top = Math.max(pad, Math.min(rect.top - height - 10, window.innerHeight - height - pad))

            setImagePreview({ url: img.image, top, left })
            setImagePreviewLoading(true)
            setImagePreviewError(null)
          }}
          onMouseLeave={() => {
            setImagePreview(null)
            setImagePreviewLoading(false)
            setImagePreviewError(null)
          }}
        >
          Ver imagen
        </a>
      )
    }

    // 2) Datos key/value
    const data = Array.isArray(observation?.data) ? observation.data : []
    const entry = data.find((d: any) => String(d?.key) === String(questionId))
    const value = entry?.value
    if (value === null || value === undefined) return '—'
    return String(value)
  }

  function answerForProjectField(observation: any, fieldKey: string): React.ReactNode {
    const value = rawValueForProjectField(observation, fieldKey)
    if (value === null || value === undefined) return '—'
    if (typeof value === 'string' || typeof value === 'number') return String(value)
    return JSON.stringify(value)
  }

  function rawValueForProjectField(observation: any, fieldKey: string): unknown {
    const keyString = String(fieldKey)

    if (observation && typeof observation === 'object') {
      const record = observation as Record<string, unknown>

      const candidates = [
        record['admin_values'],
        record['adminValues'],
        record['admin_fields_values'],
        record['adminFieldsValues'],
        record['admin_fields'],
        record['adminFields'],
      ]

      for (const c of candidates) {
        if (c && typeof c === 'object' && !Array.isArray(c)) {
          const maybeRecord = c as Record<string, unknown>
          const maybeValues = maybeRecord['values']
          if (maybeValues && typeof maybeValues === 'object' && !Array.isArray(maybeValues)) {
            const valuesRecord = maybeValues as Record<string, unknown>
            if (keyString in valuesRecord) return valuesRecord[keyString]
          }
          if (keyString in maybeRecord) return maybeRecord[keyString]
        }

        // Algunos backends lo devuelven como lista [{key, value}, ...]
        if (Array.isArray(c)) {
          const entry = c.find((row: any) => String(row?.key ?? row?.field_key ?? row?.fieldKey ?? '') === keyString)
          if (entry && typeof entry === 'object') {
            if ('value' in entry) return (entry as any).value
            if ('values' in entry && (entry as any).values && typeof (entry as any).values === 'object') {
              const valuesObj = (entry as any).values
              if (valuesObj && typeof valuesObj === 'object' && keyString in valuesObj) return valuesObj[keyString]
            }
          }
        }
      }
    }

    // Fallback por compatibilidad: algunos backends lo mezclan en data[]
    const data = Array.isArray(observation?.data) ? observation.data : []
    const entry = data.find((d: any) => String(d?.key) === keyString)
    return entry?.value
  }

  function normalizeAdminValuesFromResponse(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object') return null
    const record = body as Record<string, unknown>
    const values = record['values']
    if (values && typeof values === 'object' && !Array.isArray(values)) {
      return values as Record<string, unknown>
    }
    return null
  }

  function updateObservationInState(prev: unknown, observationId: unknown, updater: (o: any) => any): unknown {
    if (!observationId) return prev

    const targetId = String(observationId)

    if (Array.isArray(prev)) {
      return prev.map((o) => {
        const rowId = String((o as any)?.id ?? (o as any)?.observation_id ?? '')
        return rowId === targetId ? updater(o) : o
      })
    }

    if (prev && typeof prev === 'object') {
      const record = prev as Record<string, unknown>
      if (Array.isArray(record.results)) {
        return {
          ...record,
          results: (record.results as any[]).map((o) =>
            String((o as any)?.id ?? (o as any)?.observation_id ?? '') === targetId ? updater(o) : o
          ),
        }
      }
    }

    return prev
  }

  async function saveProjectFieldValue(opts: {
    observation: any
    field: { key: string; field_type: string; choices?: string[] }
    value: unknown
  }) {
    if (!authKey) return

    const observationId = opts.observation?.id ?? opts.observation?.observation_id
    const fieldKey = opts.field.key
    const cellKey = `${String(observationId)}:${String(fieldKey)}`

    setCellSaving((prev) => ({ ...prev, [cellKey]: true }))
    setCellSaveError((prev) => {
      const next = { ...prev }
      delete next[cellKey]
      return next
    })

    try {
      const sessionKey = authKey
      const base = import.meta.env.DEV
        ? ''
        : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
      const endpointPath = `/api/observations/${encodeURIComponent(String(observationId))}/admin-fields/`
      const url = import.meta.env.DEV ? endpointPath : base ? new URL(endpointPath, base).toString() : endpointPath

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Token ${sessionKey}`,
          'x-auth-key': sessionKey,
        },
        credentials: 'include',
        body: JSON.stringify({ values: { [fieldKey]: opts.value } }),
      })

      if (!res.ok) {
        const { contentType, body } = await readResponseBody(res)
        const message =
          extractServerError(body) ||
          (isProbablyHtml(contentType, body)
            ? `Error guardando (${res.status})`
            : typeof body === 'string' && body.trim()
              ? body
              : `Error guardando (${res.status})`)
        throw new Error(message)
      }

      // Preferimos la respuesta del servidor si viene.
      const { body: saved } = await readResponseBody(res)
      const serverValues = normalizeAdminValuesFromResponse(saved)
      setObservations((prev) =>
        updateObservationInState(prev, observationId, (o) => {
          // Si el endpoint devuelve la observación completa, la usamos.
          if (saved && typeof saved === 'object' && (saved as any).id !== undefined) return saved

          const next = { ...(o ?? {}) } as any
          next.admin_values = { ...(next.admin_values as any) }
          if (serverValues) {
            next.admin_values = { ...(next.admin_values as any), ...serverValues }
          } else {
            next.admin_values = { ...(next.admin_values as any), [fieldKey]: opts.value }
          }

          const updatedId = String(next?.id ?? next?.observation_id ?? '')
          if (updatedId) adminFieldsLoadedRef.current[updatedId] = true
          return next
        })
      )

      setCellDrafts((prev) => {
        const next = { ...prev }
        delete next[cellKey]
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error guardando'
      setCellSaveError((prev) => ({ ...prev, [cellKey]: message }))
    } finally {
      setCellSaving((prev) => ({ ...prev, [cellKey]: false }))
    }
  }

  function valueForSort(observation: any, sortKey: NonNullable<typeof tableSort>['key']): string | number | null {
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
        const ts = observation?.timestamp
        if (typeof ts === 'string' && ts.trim()) {
          const ms = Date.parse(ts)
          return Number.isFinite(ms) ? ms : ts
        }
        return null
      }

      if (sortKey.id === 'geoposition') {
        const geo = observation?.geoposition
        if (typeof geo === 'string' && geo.trim()) return geo
        return null
      }
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

    // Preguntas
    const questionId = sortKey.id

    // 1) Si hay imagen, ordenamos por URL (o presencia)
    const images = Array.isArray(observation?.images) ? observation.images : []
    const img = images.find((i: any) => String(i?.question) === String(questionId))
    if (img?.image && typeof img.image === 'string') return img.image

    // 2) Datos key/value
    const data = Array.isArray(observation?.data) ? observation.data : []
    const entry = data.find((d: any) => String(d?.key) === String(questionId))
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
  }

  function compareForSort(a: string | number | null, b: string | number | null): number {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1

    if (typeof a === 'number' && typeof b === 'number') return a - b
    return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' })
  }

  function sortIndicatorFor(key: NonNullable<typeof tableSort>['key']): string {
    if (!tableSort) return ''
    const same =
      (tableSort.key.kind === 'builtin' && key.kind === 'builtin' && tableSort.key.id === key.id) ||
      (tableSort.key.kind === 'projectField' &&
        key.kind === 'projectField' &&
        tableSort.key.id === key.id &&
        tableSort.key.key === key.key) ||
      (tableSort.key.kind === 'question' && key.kind === 'question' && tableSort.key.id === key.id)
    if (!same) return ''
    return tableSort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  function toggleSort(nextKey: NonNullable<typeof tableSort>['key']) {
    setTableSort((prev) => {
      if (!prev) return { key: nextKey, dir: 'asc' }
      const same =
        (prev.key.kind === 'builtin' && nextKey.kind === 'builtin' && prev.key.id === nextKey.id) ||
        (prev.key.kind === 'projectField' &&
          nextKey.kind === 'projectField' &&
          prev.key.id === nextKey.id &&
          prev.key.key === nextKey.key) ||
        (prev.key.kind === 'question' && nextKey.kind === 'question' && prev.key.id === nextKey.id)
      if (!same) return { key: nextKey, dir: 'asc' }
      return { key: prev.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  function resetProjectObservationFieldForm() {
    setEditingProjectObservationFieldId(null)
    setPofKey('')
    setPofLabel('')
    setPofFieldType('bool')
    setPofRequired(false)
    setPofIncludeInEmail(false)
    setPofOrder('')
    setPofHelpText('')
    setPofChoicesText('')
    setSaveProjectObservationFieldError(null)
    setIsColumnModalOpen(false)
  }

  function exportToCSV() {
    if (!observations || observations.length === 0) return

    // Preparar encabezados
    const headers = ['ID', 'Fecha', 'Geoposición']
    
    // Añadir columnas de preguntas
    questions.forEach(q => {
      headers.push(q.question_text)
    })
    
    // Añadir columnas de observation fields
    projectObservationFields.forEach(f => {
      headers.push(f.label)
    })

    // Preparar filas
    const rows = observations.map(obs => {
      const row: string[] = []
      
      // Columnas básicas
      row.push(String(obs.id || ''))
      row.push(obs.timestamp || '')
      row.push(obs.geoposition || '')
      
      // Respuestas a preguntas - usar la misma lógica que la tabla
      questions.forEach(q => {
        // Buscar en data array
        const data = Array.isArray(obs?.data) ? obs.data : []
        const entry = data.find((d: any) => String(d?.key) === String(q.id))
        const value = entry?.value
        
        // Buscar en images array
        const images = Array.isArray(obs?.images) ? obs.images : []
        const img = images.find((i: any) => String(i?.question) === String(q.id))
        
        if (img?.image && typeof img.image === 'string') {
          row.push(img.image) // URL de la imagen
        } else if (value !== null && value !== undefined) {
          row.push(String(value))
        } else {
          row.push('')
        }
      })
      
      // Observation fields - usar rawValueForProjectField
      projectObservationFields.forEach(f => {
        const value = rawValueForProjectField(obs, f.key)
        if (value !== null && value !== undefined) {
          row.push(String(value))
        } else {
          row.push('')
        }
      })
      
      return row
    })

    // Convertir a CSV
    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n')

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `observaciones_${selectedProjectId}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function saveProjectObservationField(e: React.FormEvent) {
    e.preventDefault()
    if (!authKey) return
    if (!selectedProjectId) return
    if (!projectObservationFieldsCollectionPath) {
      setSaveProjectObservationFieldError('El endpoint de columnas no está disponible (404)')
      return
    }

    setIsSavingProjectObservationField(true)
    setSaveProjectObservationFieldError(null)

    try {
      const sessionKey = authKey
      const projectId = selectedProjectId
      const base = import.meta.env.DEV
        ? ''
        : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')

      const label = pofLabel.trim()
      const field_type = pofFieldType
      
      // Generar key automáticamente desde el label si está vacío
      let key = pofKey.trim()
      if (!key && label) {
        key = label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
          .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres no válidos con guiones
          .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio y final
      }

      if (!label) throw new Error('El campo "label" es obligatorio')
      if (!key) throw new Error('El campo "key" es obligatorio')
      if (!/^[a-z0-9_-]+$/.test(key)) throw new Error('"key" debe ser un slug (a-z, 0-9, _ o -)')

      let choices: string[] | undefined = undefined
      if (field_type === 'choice' || field_type === 'mchoice') {
        choices = pofChoicesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        if (!choices.length) throw new Error(`Para field_type="${field_type}", debes indicar choices (separadas por comas)`)
      }

      const order = pofOrder.trim() ? Number(pofOrder) : undefined
      if (pofOrder.trim() && !Number.isFinite(order)) throw new Error('"order" debe ser un número')

      const help_text = pofHelpText.trim() ? pofHelpText.trim() : undefined

      const isEdit = editingProjectObservationFieldId !== null

      const endpointPath = isEdit
        ? `${projectObservationFieldsCollectionPath}${encodeURIComponent(String(editingProjectObservationFieldId))}/`
        : projectObservationFieldsCollectionPath
      const url = import.meta.env.DEV ? endpointPath : base ? new URL(endpointPath, base).toString() : endpointPath

      const body: Record<string, unknown> = isEdit
        ? {
            label,
            field_type,
            required: pofRequired,
            public: pofIncludeInEmail,
            order,
            help_text,
            ...(field_type === 'choice' || field_type === 'mchoice' ? { choices } : { choices: undefined }),
          }
        : {
            key,
            label,
            field_type,
            required: pofRequired,
            public: pofIncludeInEmail,
            order,
            help_text,
            ...(field_type === 'choice' || field_type === 'mchoice' ? { choices } : {}),
          }

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Token ${sessionKey}`,
          'x-auth-key': sessionKey,
        },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { contentType, body: payload } = await readResponseBody(res)
        const message = extractServerError(payload) || (typeof payload === 'string' && payload) || `Error guardando (${res.status})`
        throw new Error(isProbablyHtml(contentType, payload) ? `Error guardando (${res.status})` : message)
      }

      // Refresh list
      {
        const listPath = projectObservationFieldsCollectionPath
        const listUrl = import.meta.env.DEV ? listPath : base ? new URL(listPath, base).toString() : listPath
        const listRes = await fetch(listUrl, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            authorization: `Token ${sessionKey}`,
            'x-auth-key': sessionKey,
          },
          credentials: 'include',
        })
        if (listRes.ok) {
          const { body: data } = await readResponseBody(listRes)
          setProjectObservationFields(normalizeProjectObservationFields(data))
        }
      }

      resetProjectObservationFieldForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado guardando'
      setSaveProjectObservationFieldError(message)
    } finally {
      setIsSavingProjectObservationField(false)
    }
  }

  async function deleteProjectObservationField(id: number) {
    if (!authKey) return
    if (!selectedProjectId) return
    if (!projectObservationFieldsCollectionPath) {
      window.alert('El endpoint de columnas no está disponible (404)')
      return
    }
    if (!window.confirm('¿Eliminar esta columna?')) return

    try {
      const sessionKey = authKey
      const base = import.meta.env.DEV
        ? ''
        : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '')
      const endpointPath = `${projectObservationFieldsCollectionPath}${encodeURIComponent(String(id))}/`
      const url = import.meta.env.DEV ? endpointPath : base ? new URL(endpointPath, base).toString() : endpointPath

      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          accept: 'application/json',
          authorization: `Token ${sessionKey}`,
          'x-auth-key': sessionKey,
        },
        credentials: 'include',
      })

      if (!res.ok) {
        const { contentType, body } = await readResponseBody(res)
        const message =
          extractServerError(body) ||
          (isProbablyHtml(contentType, body)
            ? `No se pudo eliminar (${res.status})`
            : typeof body === 'string' && body.trim()
              ? body
              : `No se pudo eliminar (${res.status})`)
        throw new Error(message)
      }

      // Refresh local state
      setProjectObservationFields((prev) => prev.filter((f) => f.id !== id))
      if (editingProjectObservationFieldId === id) resetProjectObservationFieldForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado eliminando'
      window.alert(message)
    }
  }

  function projectIdToString(id: unknown): string {
    if (typeof id === 'string') return id
    if (typeof id === 'number') return String(id)
    return ''
  }

  function projectLabel(p: { id?: unknown; name?: unknown }): string {
    if (typeof p.name === 'string' && p.name.trim()) return p.name
    const id = projectIdToString(p.id)
    return id ? `Proyecto ${id}` : 'Proyecto'
  }

  if (authKey) {
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        {imagePreview ? (
          <div
            className="pointer-events-none fixed z-50 overflow-hidden rounded-md border bg-background"
            style={{ top: imagePreview.top, left: imagePreview.left, width: 360, height: 240 }}
          >
            {imagePreviewLoading ? (
              <div className="flex h-full w-full items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                Cargando…
              </div>
            ) : null}
            {imagePreviewError ? (
              <div className="flex h-full w-full items-center justify-center p-3 text-xs text-destructive">
                {imagePreviewError}
              </div>
            ) : null}
            <img
              src={imagePreview.url}
              alt="Previsualización"
              className={imagePreviewLoading ? 'hidden' : 'block h-full w-full object-contain'}
              onLoad={() => {
                setImagePreviewLoading(false)
              }}
              onError={() => {
                setImagePreviewLoading(false)
                setImagePreviewError('No se pudo cargar la imagen')
              }}
            />
          </div>
        ) : null}
        <ResizablePanelGroup orientation="vertical" className="min-h-screen">
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="h-full flex flex-col">
              <div className="flex-none p-4 border-b">
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-xl font-bold">Geonity</h1>
                  
                  <div className="flex-1 max-w-md flex items-center gap-3">
                    <Label htmlFor="project" className="text-sm whitespace-nowrap">Proyecto</Label>
                    <div className="flex-1 space-y-1">
                      <select
                        id="project"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedProjectId}
                        onChange={(e) => {
                          setSelectedProjectId(e.target.value)
                          setSelectedObservationId(null)
                        }}
                        disabled={isLoadingProjects || projects.length === 0}
                      >
                        {isLoadingProjects ? <option value="">Cargando…</option> : null}
                        {!isLoadingProjects && projects.length === 0 ? (
                          <option value="">Sin proyectos</option>
                        ) : null}
                        {projects.map((p) => {
                          const id = projectIdToString(p.id)
                          return (
                            <option key={id || projectLabel(p)} value={id}>
                              {projectLabel(p)}
                            </option>
                          )
                        })}
                      </select>
                      {projectsError ? <p className="text-xs text-destructive">{projectsError}</p> : null}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUser(null)
                      setToken(null)
                      setProjects([])
                      setProjectsError(null)
                      setSelectedProjectId('')
                      setSelectedObservationId(null)
                      setTableColumns([])
                      setAvailableColumns([])
                      setFieldFormId('')
                      setFieldForm(null)
                      setQuestions([])
                      setObservations(null)
                      setObservationsError(null)
                    }}
                  >
                    Cerrar sesión
                  </Button>
                </div>
              </div>


              <div className="flex-none px-4 pt-4 pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Observaciones</p>
                    <div className="flex items-center gap-2">
                      {observations && observations.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportToCSV}
                          className="gap-2"
                        >
                          <Download size={13} /> Exportar CSV
                        </Button>
                      )}
                      {projectObservationFields.length > 0 && (
                        <>
                          <input
                            ref={bulkFileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={handleBulkFileChange}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => bulkFileInputRef.current?.click()}
                          >
                            <Upload size={13} /> Importar CSV/XLSX
                          </Button>
                          {bulkParseError && (
                            <span className="text-xs text-destructive">{bulkParseError}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isLoadingObservations ? (
                    <p className="text-sm text-muted-foreground">Cargando observaciones…</p>
                  ) : null}
                  {observationsError ? <p className="text-sm text-destructive">{observationsError}</p> : null}
                </div>
              </div>

              {observations ? (
                <>
                  <div className="flex-1 overflow-hidden px-4">
                    <div className="h-full rounded-md border bg-background overflow-auto">
                        <Table className="text-[11px] relative" style={{ display: 'table', width: '100%' }}>
                          <TableHeader className="sticky top-0 z-40">
                            <TableRow>
                              <TableHead className="whitespace-nowrap py-1 sticky left-0 bg-accent z-30 border-r-2 border-accent shadow-sm">
                                <button
                                  type="button"
                                  className="w-full select-none text-left font-medium"
                                  onClick={() => toggleSort({ kind: 'builtin', id: 'id' })}
                                >
                                  ID{sortIndicatorFor({ kind: 'builtin', id: 'id' })}
                                </button>
                              </TableHead>
                              <TableHead className="py-1 w-20 bg-accent border-r border-accent/50">
                                <button
                                  type="button"
                                  className="w-full select-none text-left font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                                  title="Configurar plantilla del correo de muestra"
                                  onClick={() => setEmailTemplateDialogOpen(true)}
                                >
                                  <Mail size={11} />
                                  <FlaskConical size={11} />
                                </button>
                              </TableHead>
                              <TableHead className="whitespace-nowrap py-1 sticky top-0 bg-background z-20 shadow-sm">
                                <button
                                  type="button"
                                  className="w-full select-none text-left font-medium"
                                  onClick={() => toggleSort({ kind: 'builtin', id: 'timestamp' })}
                                >
                                  Fecha{sortIndicatorFor({ kind: 'builtin', id: 'timestamp' })}
                                </button>
                              </TableHead>
                              <TableHead className="whitespace-nowrap py-1 sticky top-0 bg-background z-20 shadow-sm">
                                <button
                                  type="button"
                                  className="w-full select-none text-left font-medium"
                                  onClick={() => toggleSort({ kind: 'builtin', id: 'geoposition' })}
                                >
                                  Geoposición{sortIndicatorFor({ kind: 'builtin', id: 'geoposition' })}
                                </button>
                              </TableHead>
                              {questions.map((q) => (
                                <TableHead key={q.id} className="min-w-[180px] py-1 sticky top-0 bg-background z-20 shadow-sm">
                                  <button
                                    type="button"
                                    className="w-full select-none text-left"
                                    onClick={() => toggleSort({ kind: 'question', id: q.id })}
                                  >
                                    <div className="leading-tight">
                                      <div className={q.mandatory ? 'font-bold text-foreground' : 'text-foreground'}>
                                        {q.question_text}
                                        {sortIndicatorFor({ kind: 'question', id: q.id })}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">{q.answer_type}</div>
                                    </div>
                                  </button>
                                </TableHead>
                              ))}
                              {projectObservationFields.map((f) => {
                                return (
                                <TableHead key={`pof-${f.id}`} className="min-w-[160px] py-1 bg-accent border-l-2 border-accent shadow-sm">
                                  <div className="flex items-start gap-1">
                                    <button
                                      type="button"
                                      className="flex-1 select-none text-left"
                                      onClick={() => toggleSort({ kind: 'projectField', id: f.id, key: f.key })}
                                    >
                                      <div className="leading-tight">
                                        <div className={f.required ? 'font-bold text-foreground' : 'text-foreground'}>
                                          {f.label}
                                          {sortIndicatorFor({ kind: 'projectField', id: f.id, key: f.key })}
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">{f.field_type}</div>
                                      </div>
                                    </button>
                                    <div className="flex gap-0.5">
                                      <button
                                        type="button"
                                        className="flex h-5 w-5 items-center justify-center rounded text-xs hover:bg-accent"
                                        title="Editar columna"
                                        onClick={() => {
                                          setEditingProjectObservationFieldId(f.id)
                                          setPofKey(f.key)
                                          setPofLabel(f.label)
                                          setPofFieldType((['bool', 'text', 'number', 'date', 'choice', 'mchoice'] as const).includes(f.field_type as any) ? f.field_type as any : 'text')
                                          setPofRequired(Boolean(f.required))
                                          setPofIncludeInEmail(Boolean((f as any).public))
                                          setPofOrder(typeof f.order === 'number' ? String(f.order) : '')
                                          setPofHelpText(typeof f.help_text === 'string' ? f.help_text : '')
                                          setPofChoicesText(Array.isArray(f.choices) ? f.choices.join(', ') : '')
                                          setSaveProjectObservationFieldError(null)
                                          setIsColumnModalOpen(true)
                                        }}
                                      >
                                        <Pencil size={11} />
                                      </button>
                                      <button
                                        type="button"
                                        className="flex h-5 w-5 items-center justify-center rounded text-xs hover:bg-accent"
                                        title="Borrar columna"
                                        onClick={() => deleteProjectObservationField(f.id)}
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                </TableHead>
                                )
                              })}
                              <TableHead className="py-1 w-10 sticky right-0 bg-accent border-l-2 border-accent">
                                <button
                                  type="button"
                                  className="flex h-6 w-6 items-center justify-center rounded border border-input bg-background text-foreground hover:bg-accent"
                                  title="Añadir columna"
                                  onClick={() => {
                                    resetProjectObservationFieldForm()
                                    setIsColumnModalOpen(true)
                                  }}
                                  disabled={!projectObservationFieldsCollectionPath}
                                >
                                  +
                                </button>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody ref={tableBodyRef}>
                            {(() => {
                              const rows = normalizeObservations(observations)
                              if (!tableSort) return rows

                              const dir = tableSort.dir === 'asc' ? 1 : -1
                              const key = tableSort.key

                              return [...rows].sort((ra: any, rb: any) => {
                                const av = valueForSort(ra, key)
                                const bv = valueForSort(rb, key)
                                return compareForSort(av, bv) * dir
                              })
                            })().map((o: any) => {
                              const id = o?.id
                              const ts = typeof o?.timestamp === 'string' ? o.timestamp : ''
                              const geo = o?.geoposition
                              const ll = extractLatLon(geo)
                              const isSelected = String(id) === String(selectedObservationId)
                              return (
                                <TableRow 
                                  key={String(id ?? ts)}
                                  data-observation-id={id}
                                  className={isSelected ? 'bg-blue-100 dark:bg-blue-900/30 cursor-pointer' : 'cursor-pointer hover:bg-muted/50'}
                                  onClick={() => {
                                    if (id != null) {
                                      setSelectedObservationId(id)
                                    }
                                  }}
                                >
                                  <TableCell className="whitespace-nowrap px-2 py-1 sticky left-0 bg-accent z-10 border-r-2 border-accent/50">{id ?? '—'}</TableCell>
                                  <TableCell className="px-1 py-1 bg-accent border-r border-accent/50">
                                    {(() => {
                                      const obsId = String(o?.id ?? o?.observation_id ?? '')
                                      const status = obsEmailStatus[obsId]
                                      const count = obsEmailCount[obsId] ?? 0
                                      const hasPlain = obsHasPlainEmail[obsId] ?? false
                                      const hasObs = obsHasObsEmail[obsId] ?? false
                                      const hasAny = hasPlain || hasObs || Boolean(status)
                                      const plainColor = status === 'pending' ? 'text-yellow-500' : status === 'failed' ? 'text-destructive' : hasPlain ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/40'
                                      const obsColor = status === 'pending' ? 'text-yellow-500' : status === 'failed' ? 'text-destructive' : hasObs ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/40'
                                      const sendingData = isSendingDataEmail[obsId]
                                      return (
                                        <div className="flex items-center gap-0.5">
                                          <button type="button" title="Enviar correo personalizado" className={`flex h-5 w-5 items-center justify-center rounded hover:bg-accent-foreground/10 ${plainColor}`} onClick={() => openEmailDialog(o)}>
                                            <Mail size={11} strokeWidth={hasPlain ? 2.5 : 1.25} />
                                          </button>
                                          <button type="button" title="Enviar correo con datos de la muestra" className={`flex h-5 w-5 items-center justify-center rounded hover:bg-accent-foreground/10 ${obsColor} ${sendingData ? 'opacity-50' : ''}`} disabled={sendingData} onClick={() => void sendDataEmail(o)}>
                                            <FlaskConical size={11} strokeWidth={hasObs ? 2.5 : 1.25} />
                                          </button>
                                          <button type="button" title="Historial de emails" className="relative flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent-foreground/10" onClick={() => { setEmailHistoryObs(o); void loadEmailLogs(o) }}>
                                            <ClipboardList size={11} strokeWidth={hasAny ? 2.5 : 1.25} />
                                            {count > 0 && (
                                              <span className="absolute -top-1 -right-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-primary-foreground leading-none">
                                                {count > 99 ? '99+' : count}
                                              </span>
                                            )}
                                          </button>
                                        </div>
                                      )
                                    })()}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap px-2 py-1">{ts || '—'}</TableCell>
                                  <TableCell className="whitespace-nowrap px-2 py-1">
                                    {ll ? `${ll.a}, ${ll.b}` : typeof geo === 'string' ? geo : '—'}
                                  </TableCell>
                                  {questions.map((q) => (
                                    <TableCell key={q.id} className="px-2 py-1">
                                      {answerFor(o, q.id)}
                                    </TableCell>
                                  ))}
                                  {projectObservationFields.map((f) => {
                                    return (
                                    <TableCell key={`pof-${f.id}`} className="px-2 py-1 bg-accent border-l-2 border-accent/50">
                                      {(() => {
                                        const obsId = o?.id
                                        const cellKey = `${String(obsId)}:${String(f.key)}`
                                        const saving = Boolean(cellSaving[cellKey])
                                        const err = cellSaveError[cellKey]

                                        if (f.field_type === 'bool') {
                                          const current = rawValueForProjectField(o, f.key)
                                          const checked = Boolean(current)
                                          return (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onFocus={() => {
                                                  void ensureAdminFieldsLoadedForObservation(o)
                                                }}
                                                onChange={(e) => {
                                                  void saveProjectFieldValue({
                                                    observation: o,
                                                    field: f,
                                                    value: e.target.checked,
                                                  })
                                                }}
                                                disabled={saving}
                                              />
                                              {saving ? (
                                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                              ) : null}
                                              {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
                                            </div>
                                          )
                                        }

                                        if (f.field_type === 'choice') {
                                          const current = rawValueForProjectField(o, f.key)
                                          const value = typeof current === 'string' ? current : ''
                                          const choices = Array.isArray(f.choices) ? f.choices : []
                                          return (
                                            <div className="flex items-center gap-2">
                                              <select
                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                                value={value}
                                                onFocus={() => {
                                                  void ensureAdminFieldsLoadedForObservation(o)
                                                }}
                                                onChange={(e) => {
                                                  void saveProjectFieldValue({
                                                    observation: o,
                                                    field: f,
                                                    value: e.target.value,
                                                  })
                                                }}
                                                disabled={saving || choices.length === 0}
                                              >
                                                <option value="">—</option>
                                                {choices.map((c) => (
                                                  <option key={c} value={c}>{c}</option>
                                                ))}
                                              </select>
                                              {saving ? (
                                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                              ) : null}
                                              {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
                                            </div>
                                          )
                                        }

                                        if (f.field_type === 'mchoice') {
                                          const current = rawValueForProjectField(o, f.key)
                                          const selected: string[] = Array.isArray(current)
                                            ? current.filter((v): v is string => typeof v === 'string')
                                            : []
                                          const choices = Array.isArray(f.choices) ? f.choices : []
                                          return (
                                            <div className="flex flex-col gap-1" onFocus={() => { void ensureAdminFieldsLoadedForObservation(o) }}>
                                              {choices.map((c) => (
                                                <label key={c} className="flex items-center gap-1 text-xs cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={selected.includes(c)}
                                                    disabled={saving}
                                                    onChange={(e) => {
                                                      const next = e.target.checked
                                                        ? [...selected, c]
                                                        : selected.filter((v) => v !== c)
                                                      void saveProjectFieldValue({ observation: o, field: f, value: next })
                                                    }}
                                                  />
                                                  {c}
                                                </label>
                                              ))}
                                              {saving ? (
                                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                              ) : null}
                                              {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
                                            </div>
                                          )
                                        }

                                        if (f.field_type === 'number') {
                                          const current = rawValueForProjectField(o, f.key)
                                          const fallback = current !== null && current !== undefined ? String(current) : ''
                                          const draft = cellDrafts[cellKey]
                                          const value = draft !== undefined ? draft : fallback
                                          return (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                                value={value}
                                                onFocus={() => { void ensureAdminFieldsLoadedForObservation(o) }}
                                                onChange={(e) => {
                                                  setCellDrafts((prev) => ({ ...prev, [cellKey]: e.target.value }))
                                                }}
                                                onBlur={() => {
                                                  const v = (cellDrafts[cellKey] ?? fallback).trim()
                                                  void saveProjectFieldValue({ observation: o, field: f, value: v ? Number(v) : null })
                                                }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
                                                disabled={saving}
                                              />
                                              {saving ? (
                                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                              ) : null}
                                              {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
                                            </div>
                                          )
                                        }

                                        if (f.field_type === 'date') {
                                          const current = rawValueForProjectField(o, f.key)
                                          const value = typeof current === 'string' ? current.slice(0, 10) : ''
                                          return (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="date"
                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                                value={value}
                                                onFocus={() => { void ensureAdminFieldsLoadedForObservation(o) }}
                                                onChange={(e) => {
                                                  void saveProjectFieldValue({ observation: o, field: f, value: e.target.value || null })
                                                }}
                                                disabled={saving}
                                              />
                                              {saving ? (
                                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                              ) : null}
                                              {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
                                            </div>
                                          )
                                        }

                                        // default: text
                                        {
                                          const current = rawValueForProjectField(o, f.key)
                                          const fallback =
                                            typeof current === 'string' || typeof current === 'number' ? String(current) : ''
                                          const draft = cellDrafts[cellKey]
                                          const value = draft !== undefined ? draft : fallback

                                          return (
                                            <div className="flex items-center gap-2">
                                              <input
                                                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                                value={value}
                                                onFocus={() => {
                                                  void ensureAdminFieldsLoadedForObservation(o)
                                                }}
                                                onChange={(e) => {
                                                  const v = e.target.value
                                                  setCellDrafts((prev) => ({ ...prev, [cellKey]: v }))
                                                }}
                                                onBlur={() => {
                                                  const v = (cellDrafts[cellKey] ?? fallback).trim()
                                                  void saveProjectFieldValue({
                                                    observation: o,
                                                    field: f,
                                                    value: v ? v : null,
                                                  })
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    ;(e.currentTarget as HTMLInputElement).blur()
                                                  }
                                                }}
                                                disabled={saving}
                                              />
                                              {saving ? (
                                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                              ) : null}
                                              {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
                                            </div>
                                          )
                                        }
                                      })()}
                                    </TableCell>
                                    )
                                  })}
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                    </div>
                  </div>

                  <div className="flex-none p-2 bg-muted/30 mx-4 mb-4 rounded-b-md border border-x border-b">
                      <details className="text-xs">
                        <summary className="cursor-pointer select-none font-medium">Ver JSON raw</summary>
                        <pre className="mt-2 max-h-40 overflow-auto rounded border bg-background p-2">
                          {JSON.stringify(observations, null, 2)}
                        </pre>
                      </details>
                  </div>
                </>
              ) : null}

            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={60} minSize={20}>
            <div className="h-full bg-muted/20">
              {mapboxToken ? (
                <MapboxMap 
                  accessToken={mapboxToken} 
                  observations={normalizeObservations(observations)}
                  selectedObservationId={selectedObservationId}
                  onObservationSelect={(id) => {
                    setSelectedObservationId(id)
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-sm text-muted-foreground">
                  Falta configurar `VITE_MAPBOX_TOKEN` en `.env`
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {bulkDialogOpen ? (() => {
          const headers = bulkHeaders(bulkHasHeader)
          const dataRows = bulkDataRows(bulkHasHeader)
          const previewRows = bulkRawRows.slice(0, 6)

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold text-sm">
                    Importar datos en bloque
                    {bulkStep < 4 && !bulkFinished && (
                      <span className="ml-2 text-muted-foreground font-normal">— Paso {bulkStep} de 3</span>
                    )}
                  </h2>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground text-lg leading-none"
                    onClick={() => { if (!bulkRunning) setBulkDialogOpen(false) }}
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">

                  {/* PASO 1 — Previsualización y cabecera */}
                  {bulkStep === 1 && (
                    <>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bulkHasHeader}
                            onChange={(e) => setBulkHasHeader(e.target.checked)}
                          />
                          La primera fila es cabecera
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {dataRows.length} filas de datos · {headers.length} columnas
                        </span>
                      </div>

                      <div className="overflow-auto rounded border text-xs">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              {headers.map((h, i) => (
                                <th key={i} className="px-2 py-1 text-left whitespace-nowrap font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(bulkHasHeader ? previewRows.slice(1) : previewRows).slice(0, 5).map((row, ri) => (
                              <tr key={ri} className="border-t">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[160px] truncate">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* PASO 2 — Columna de unión */}
                  {bulkStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Selecciona qué columna del fichero se usará para identificar cada observación.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Columna del fichero</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={bulkJoinCsvCol}
                            onChange={(e) => setBulkJoinCsvCol(Number(e.target.value))}
                          >
                            {headers.map((h, i) => (
                              <option key={i} value={i}>{h}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Campo de observación a comparar</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={bulkJoinTarget}
                            onChange={(e) => setBulkJoinTarget(e.target.value as 'id' | 'timestamp')}
                          >
                            <option value="id">ID</option>
                            <option value="timestamp">Timestamp</option>
                          </select>
                        </div>
                      </div>

                      {/* Preview de valores de la columna seleccionada */}
                      <div className="text-xs text-muted-foreground">
                        Valores de muestra en «{headers[bulkJoinCsvCol]}»:{' '}
                        {dataRows.slice(0, 5).map((r) => r[bulkJoinCsvCol]).filter(Boolean).join(', ')}
                      </div>
                    </div>
                  )}

                  {/* PASO 3 — Mapeo de columnas */}
                  {bulkStep === 3 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Asigna cada columna del fichero a un campo de observación. Las columnas sin asignar se ignoran.
                      </p>
                      <div className="space-y-2">
                        {headers.map((h, i) => {
                          if (i === bulkJoinCsvCol) return null
                          const mapping = bulkMappings.find((m) => m.csvCol === i)
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs w-36 truncate text-right text-muted-foreground shrink-0">{h}</span>
                              <span className="text-xs text-muted-foreground">→</span>
                              <select
                                className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                                value={mapping?.pofKey ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setBulkMappings((prev) => {
                                    const without = prev.filter((m) => m.csvCol !== i)
                                    return val ? [...without, { csvCol: i, pofKey: val }] : without
                                  })
                                }}
                              >
                                <option value="">— Ignorar —</option>
                                {projectObservationFields.map((f) => (
                                  <option key={f.key} value={f.key}>{f.label} ({f.key})</option>
                                ))}
                              </select>
                            </div>
                          )
                        })}
                      </div>
                      {bulkMappings.filter((m) => m.pofKey).length === 0 && (
                        <p className="text-xs text-destructive">Asigna al menos una columna a un campo.</p>
                      )}
                    </div>
                  )}

                  {/* PASO 4 — Progreso y resultados */}
                  {bulkStep === 4 && (() => {
                    const obs = normalizeObservations(observations) as any[]
                    const obsIndex = new Map<string, any>()
                    for (const o of obs) {
                      const key = bulkJoinTarget === 'id' ? String(o?.id ?? '') : String(o?.timestamp ?? '')
                      if (key) obsIndex.set(key.trim(), o)
                    }
                    const totalRows = dataRows.length
                    const matchCount = dataRows.filter((r) => {
                      const v = (r[bulkJoinCsvCol] ?? '').trim()
                      return v && obsIndex.has(v)
                    }).length
                    const unmatchCount = totalRows - matchCount

                    return (
                      <div className="space-y-4">
                        {!bulkRunning && !bulkFinished && (
                          <>
                            <div className="rounded-md border p-3 text-sm space-y-1">
                              <div><span className="font-medium">{matchCount}</span> filas se actualizarán</div>
                              {unmatchCount > 0 && (
                                <div className="text-amber-600 dark:text-amber-400">
                                  ⚠ {unmatchCount} filas no coinciden con ninguna observación y serán ignoradas
                                </div>
                              )}
                              <div className="text-muted-foreground text-xs">
                                Campos a actualizar: {bulkMappings.filter((m) => m.pofKey).map((m) => {
                                  const f = projectObservationFields.find((f) => f.key === m.pofKey)
                                  return f?.label ?? m.pofKey
                                }).join(', ')}
                              </div>
                            </div>
                          </>
                        )}

                        {(bulkRunning || bulkFinished) && bulkProgress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{bulkFinished ? 'Completado' : 'Procesando…'}</span>
                              <span>{bulkProgress.done} / {bulkProgress.total}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }}
                              />
                            </div>
                            {bulkFinished && (
                              <div className="space-y-1 text-sm">
                                <div className="text-green-600 dark:text-green-400">✓ {bulkProgress.done} filas procesadas</div>
                                {bulkProgress.errors > 0 && (
                                  <div className="text-destructive">✗ {bulkProgress.errors} errores al guardar</div>
                                )}
                                {bulkUnmatched.length > 0 && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-amber-600 dark:text-amber-400">
                                      ⚠ {bulkUnmatched.length} valores sin coincidencia
                                    </summary>
                                    <div className="mt-1 max-h-32 overflow-auto rounded border p-2 font-mono">
                                      {bulkUnmatched.join(', ')}
                                    </div>
                                  </details>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })()}

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (bulkStep > 1 && !bulkRunning && !bulkFinished) setBulkStep((s) => (s - 1) as any)
                      else if (!bulkRunning) setBulkDialogOpen(false)
                    }}
                  >
                    {bulkStep === 1 || bulkFinished ? 'Cancelar' : '← Atrás'}
                  </Button>

                  {bulkFinished ? (
                    <Button size="sm" onClick={() => setBulkDialogOpen(false)}>
                      Cerrar
                    </Button>
                  ) : bulkStep < 3 ? (
                    <Button
                      size="sm"
                      onClick={() => setBulkStep((s) => (s + 1) as any)}
                    >
                      Siguiente →
                    </Button>
                  ) : bulkStep === 3 ? (
                    <Button
                      size="sm"
                      disabled={bulkMappings.filter((m) => m.pofKey).length === 0}
                      onClick={() => setBulkStep(4)}
                    >
                      Previsualizar →
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={bulkRunning}
                      onClick={() => void runBulkImport()}
                    >
                      {bulkRunning ? 'Importando…' : 'Importar'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })() : null}

        {/* Modal — plantilla email de muestra (cabecera columna) */}
        {emailTemplateDialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-sm flex items-center gap-2"><FlaskConical size={14} /> Plantilla correo de muestra</h2>
                <button type="button" className="text-muted-foreground hover:text-foreground text-lg leading-none" onClick={() => setEmailTemplateDialogOpen(false)}>✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Asunto por defecto {emailSubjectDefault && <span className="font-normal text-muted-foreground">(usado si no se especifica al enviar)</span>}</Label>
                  <Input value={emailSubjectDefault} onChange={(e) => { setEmailSubjectDefault(e.target.value); setEmailIntroSaved(false) }} placeholder="Resultados del análisis de tu muestra" disabled={isSavingEmailIntro} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Texto introductorio</Label>
                  <textarea
                    className="min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={emailIntro}
                    onChange={(e) => { setEmailIntro(e.target.value); setEmailIntroSaved(false) }}
                    placeholder="Hemos analizado tu muestra, aquí tienes los resultados:"
                    disabled={isSavingEmailIntro}
                  />
                </div>
                {emailIntroError && <p className="text-xs text-destructive">{emailIntroError}</p>}
                {emailIntroSaved && <p className="text-xs text-green-600 dark:text-green-400">✓ Guardado</p>}
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setEmailTemplateDialogOpen(false)}>Cancelar</Button>
                <Button size="sm" disabled={isSavingEmailIntro} onClick={() => void saveEmailIntro().then(() => setEmailTemplateDialogOpen(false))}>
                  {isSavingEmailIntro ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal — correo personalizado (✉) */}
        {emailDialogObs ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-sm flex items-center gap-2"><Mail size={14} /> Correo personalizado — Obs. #{emailDialogObs?.id ?? emailDialogObs?.observation_id}</h2>
                <button type="button" className="text-muted-foreground hover:text-foreground text-lg leading-none" onClick={() => setEmailDialogObs(null)}>✕</button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email-subject" className="text-xs">
                    Asunto {emailSubjectDefault && <span className="font-normal text-muted-foreground">(vacío usa el del proyecto)</span>}
                  </Label>
                  <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder={emailSubjectDefault || 'Escribe un asunto…'} disabled={isSendingEmail} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email-body" className="text-xs">Mensaje</Label>
                  <textarea
                    id="email-body"
                    className="min-h-[120px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Escribe aquí tu mensaje…"
                    disabled={isSendingEmail}
                  />
                </div>

                {emailSendResult && (
                  <div className="rounded-md border p-3 text-xs space-y-1 bg-muted/40">
                    <div className="font-medium text-green-600 dark:text-green-400">✓ Email encolado correctamente</div>
                    <div className="text-muted-foreground">Estado: <span className="font-mono">{emailSendResult.status}</span> · Por: {emailSendResult.sent_by_username}</div>
                  </div>
                )}
                {emailSendError && <p className="text-xs text-destructive">{emailSendError}</p>}
              </div>

              <div className="flex items-center justify-between p-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setEmailDialogObs(null)}>Cancelar</Button>
                <Button
                  size="sm"
                  disabled={isSendingEmail || Boolean(emailSendResult)}
                  onClick={() => void sendEmail()}
                >
                  {isSendingEmail ? 'Enviando…' : 'Enviar'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal — historial de emails (📋) */}
        {emailHistoryObs ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-sm flex items-center gap-2"><ClipboardList size={14} /> Historial de emails — Obs. #{emailHistoryObs?.id ?? emailHistoryObs?.observation_id}</h2>
                <button type="button" className="text-muted-foreground hover:text-foreground text-lg leading-none" onClick={() => setEmailHistoryObs(null)}>✕</button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {isLoadingEmailLogs ? (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : emailLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin emails enviados para esta observación.</p>
                ) : (
                  <div className="space-y-2">
                    {emailLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 text-xs rounded border p-3">
                        <span className={`font-mono font-medium shrink-0 ${log.status === 'sent' ? 'text-green-600 dark:text-green-400' : log.status === 'failed' ? 'text-destructive' : 'text-yellow-500'}`}>
                          {log.status === 'sent' ? '✓' : log.status === 'failed' ? '✗' : '⏳'} {log.status}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{log.subject}</div>
                          <div className="text-muted-foreground mt-0.5">
                            {log.sent_by_username} · {log.created_at ? new Date(log.created_at).toLocaleString('es') : ''}
                            {' · '}
                            <span className={log.include_observation_data ? 'text-foreground' : ''}>
                              {log.include_observation_data ? '🔬 con datos' : '✉ personalizado'}
                            </span>
                          </div>
                          {log.error && <div className="text-destructive mt-0.5">{log.error}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end p-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setEmailHistoryObs(null)}>Cerrar</Button>
              </div>
            </div>
          </div>
        ) : null}

        {isColumnModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => resetProjectObservationFieldForm()}
          >
            <div
              className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border bg-background p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={saveProjectObservationField} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {editingProjectObservationFieldId ? 'Editar columna' : 'Añadir columna'}
                  </h2>
                  <button
                    type="button"
                    className="text-2xl leading-none text-muted-foreground hover:text-foreground"
                    onClick={() => resetProjectObservationFieldForm()}
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="pof-label">Label</Label>
                    <Input
                      id="pof-label"
                      value={pofLabel}
                      onChange={(e) => setPofLabel(e.target.value)}
                      placeholder="Validado"
                      disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="pof-type">Tipo</Label>
                      <select
                        id="pof-type"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={pofFieldType}
                        onChange={(e) => setPofFieldType(e.target.value as any)}
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                      >
                        <option value="bool">bool — Booleano</option>
                        <option value="text">text — Texto</option>
                        <option value="number">number — Número</option>
                        <option value="date">date — Fecha</option>
                        <option value="choice">choice — Selección única</option>
                        <option value="mchoice">mchoice — Selección múltiple</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pof-order">Order</Label>
                      <Input
                        id="pof-order"
                        value={pofOrder}
                        onChange={(e) => setPofOrder(e.target.value)}
                        placeholder="10"
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={pofRequired}
                        onChange={(e) => setPofRequired(e.target.checked)}
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={pofIncludeInEmail}
                        onChange={(e) => setPofIncludeInEmail(e.target.checked)}
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                      />
                      Incluir en email
                    </label>
                  </div>

                  {pofFieldType === 'choice' || pofFieldType === 'mchoice' ? (
                    <div className="space-y-1">
                      <Label htmlFor="pof-choices">Choices (separadas por comas)</Label>
                      <Input
                        id="pof-choices"
                        value={pofChoicesText}
                        onChange={(e) => setPofChoicesText(e.target.value)}
                        placeholder="Enviado, Recibido, En proceso"
                        disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                      />
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <Label htmlFor="pof-help">Help text</Label>
                    <textarea
                      id="pof-help"
                      className="min-h-[60px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={pofHelpText}
                      onChange={(e) => setPofHelpText(e.target.value)}
                      disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                    />
                  </div>

                  {saveProjectObservationFieldError ? (
                    <p className="text-sm text-destructive">{saveProjectObservationFieldError}</p>
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!projectObservationFieldsCollectionPath || isSavingProjectObservationField}
                      className="flex-1"
                    >
                      {isSavingProjectObservationField
                        ? 'Guardando…'
                        : editingProjectObservationFieldId
                          ? 'Guardar cambios'
                          : 'Crear columna'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetProjectObservationFieldForm()}
                      disabled={isSavingProjectObservationField}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Accede con tus credenciales.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando…' : 'Entrar'}
              </Button>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {success ? <p className="text-sm text-muted-foreground">{success}</p> : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
