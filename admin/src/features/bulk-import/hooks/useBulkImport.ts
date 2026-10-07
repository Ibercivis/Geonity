import * as React from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

import i18n from '@/i18n'
import type { BulkJoinOption, BulkJoinTarget, BulkMapping, BulkProgress } from '@/types/bulkImport'
import type { ObservationQuestion, ObservationRow } from '@/types/observation'
import type { ProjectObservationField } from '@/types/projectObservationField'

type AppToast = {
  title: string
  description?: string | null
  variant?: 'default' | 'destructive' | 'success'
}

function bulkCellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function parseBulkNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const raw = bulkCellToString(value).trim()
  if (!raw) return null

  let normalized = raw.replace(/\s+/g, '')
  const lastComma = normalized.lastIndexOf(',')
  const lastDot = normalized.lastIndexOf('.')

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = normalized.replace(/,/g, '')
    }
  } else if (lastComma >= 0) {
    normalized = normalized.replace(',', '.')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function useBulkImport({
  authKey,
  observations,
  questions,
  projectObservationFields,
  defaultEmailSubject,
  defaultEmailIntro,
  normalizeObservations,
  displayValueForQuestion,
  rawValueForProjectField,
  saveProjectFieldValue,
  sendObservationEmailForObservation,
  showToast,
}: {
  authKey: string | null
  observations: unknown
  questions: ObservationQuestion[]
  projectObservationFields: ProjectObservationField[]
  defaultEmailSubject?: string
  defaultEmailIntro?: string
  normalizeObservations: (data: unknown) => ObservationRow[]
  displayValueForQuestion: (observation: ObservationRow, questionId: number) => string | null
  rawValueForProjectField: (observation: ObservationRow, fieldKey: string) => unknown
  saveProjectFieldValue: (opts: {
    observation: ObservationRow
    field: { key: string; field_type: string; choices?: string[] }
    value: unknown
  }) => Promise<void>
  sendObservationEmailForObservation: (opts: {
    observationId: string
    payload: { subject?: string; include_observation_data: boolean; intro_text?: string; body?: string }
    showSuccessToast?: boolean
  }) => Promise<void>
  showToast: (toast: AppToast) => void
}) {
  const defaultBulkJoinTarget: BulkJoinTarget = 'builtin:id'
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [bulkStep, setBulkStep] = React.useState<1 | 2 | 3 | 4>(1)
  const [bulkRawRows, setBulkRawRows] = React.useState<unknown[][]>([])
  const [bulkHasHeader, setBulkHasHeader] = React.useState(true)
  const [bulkJoinCsvCol, setBulkJoinCsvCol] = React.useState(0)
  const [bulkJoinTarget, setBulkJoinTarget] = React.useState<BulkJoinTarget>(defaultBulkJoinTarget)
  const [bulkMappings, setBulkMappings] = React.useState<BulkMapping[]>([])
  const [bulkProgress, setBulkProgress] = React.useState<BulkProgress | null>(null)
  const [bulkRunning, setBulkRunning] = React.useState(false)
  const [bulkFinished, setBulkFinished] = React.useState(false)
  const [bulkUnmatched, setBulkUnmatched] = React.useState<string[]>([])
  const [bulkParseError, setBulkParseError] = React.useState<string | null>(null)
  const [bulkSendEmailUpdates, setBulkSendEmailUpdates] = React.useState(false)
  const [bulkEmailSubject, setBulkEmailSubject] = React.useState(defaultEmailSubject ?? '')
  const [bulkEmailIntro, setBulkEmailIntro] = React.useState(defaultEmailIntro ?? '')
  const bulkFileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (!bulkDialogOpen) {
      setBulkEmailSubject(defaultEmailSubject ?? '')
      setBulkEmailIntro(defaultEmailIntro ?? '')
    }
  }, [bulkDialogOpen, defaultEmailIntro, defaultEmailSubject])

  const clearBulkState = React.useCallback(() => {
    setBulkDialogOpen(false)
    setBulkStep(1)
    setBulkRawRows([])
    setBulkHasHeader(true)
    setBulkJoinCsvCol(0)
    setBulkJoinTarget(defaultBulkJoinTarget)
    setBulkMappings([])
    setBulkProgress(null)
    setBulkRunning(false)
    setBulkFinished(false)
    setBulkUnmatched([])
    setBulkParseError(null)
    setBulkSendEmailUpdates(false)
    setBulkEmailSubject(defaultEmailSubject ?? '')
    setBulkEmailIntro(defaultEmailIntro ?? '')
  }, [defaultEmailSubject, defaultEmailIntro])

  const parseToBulkRows = React.useCallback((raw: unknown[][]): { ok: boolean; error?: string } => {
    if (raw.length === 0) return { ok: false, error: 'El fichero está vacío' }
    const cols = raw[0]?.length ?? 0
    if (cols < 2) return { ok: false, error: 'El fichero debe tener al menos 2 columnas' }
    return { ok: true }
  }, [])

  const handleBulkFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBulkParseError(null)
    setBulkRawRows([])
    setBulkStep(1)
    setBulkHasHeader(true)
    setBulkJoinCsvCol(0)
    setBulkJoinTarget(defaultBulkJoinTarget)
    setBulkMappings([])
    setBulkProgress(null)
    setBulkRunning(false)
    setBulkFinished(false)
    setBulkUnmatched([])
    setBulkSendEmailUpdates(false)
    setBulkEmailSubject(defaultEmailSubject ?? '')
    setBulkEmailIntro(defaultEmailIntro ?? '')

    try {
      let rows: unknown[][] = []

      if (file.name.match(/\.xlsx?$/i)) {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rows = (XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as unknown[][]).map((r) =>
          (r as unknown[]).map((c) => (c === undefined ? '' : c))
        )
      } else {
        const text = await file.text()
        const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
        rows = result.data.map((row) => row.map((cell) => cell ?? ''))
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
  }, [parseToBulkRows])

  const bulkDataRows = React.useCallback((hasHeader: boolean): unknown[][] => {
    return hasHeader ? bulkRawRows.slice(1) : bulkRawRows
  }, [bulkRawRows])

  const bulkJoinOptions = React.useMemo<BulkJoinOption[]>(() => {
    const options: BulkJoinOption[] = [
      { value: 'builtin:id', label: 'ID' },
      { value: 'builtin:timestamp', label: 'Timestamp' },
      { value: 'builtin:geoposition', label: 'Geoposición' },
    ]

    questions.forEach((question) => {
      options.push({
        value: `question:${question.id}`,
        label: question.question_text,
      })
    })

    projectObservationFields.forEach((field) => {
      options.push({
        value: `projectField:${field.key}`,
        label: `${field.label} (${field.key})`,
      })
    })

    return options
  }, [projectObservationFields, questions])

  const bulkJoinValueForObservation = React.useCallback((observation: ObservationRow, target: BulkJoinTarget): string => {
    if (!target) return ''

    if (target.startsWith('builtin:')) {
      const key = target.slice('builtin:'.length)
      switch (key) {
        case 'id':
          return bulkCellToString(observation?.id ?? observation?.observation_id).trim()
        case 'timestamp':
          return bulkCellToString(observation?.timestamp).trim()
        case 'geoposition':
          return bulkCellToString(observation?.geoposition).trim()
        default:
          return ''
      }
    }

    if (target.startsWith('question:')) {
      const questionId = Number(target.slice('question:'.length))
      if (!Number.isFinite(questionId)) return ''
      return bulkCellToString(displayValueForQuestion(observation, questionId)).trim()
    }

    if (target.startsWith('projectField:')) {
      const fieldKey = target.slice('projectField:'.length)
      return bulkCellToString(rawValueForProjectField(observation, fieldKey)).trim()
    }

    return ''
  }, [displayValueForQuestion, rawValueForProjectField])

  const coerceBulkValue = React.useCallback((raw: unknown, field: { field_type: string; choices?: string[] }): unknown => {
    const v = bulkCellToString(raw).trim()
    if (v === '') return null

    switch (field.field_type) {
      case 'bool': {
        if (typeof raw === 'boolean') return raw
        if (typeof raw === 'number') return raw !== 0
        const lower = v.toLowerCase()
        if (['true', '1', 'sí', 'si', 'yes', 's', 'y'].includes(lower)) return true
        if (['false', '0', 'no', 'n'].includes(lower)) return false
        return null
      }
      case 'number':
        return parseBulkNumber(raw)
      case 'mchoice': {
        // CSV cell may be a comma-separated string — split into array
        const items = v.split(',').map((s) => s.trim()).filter(Boolean)
        return items.length > 0 ? items : null
      }
      default:
        return v
    }
  }, [])

  const runBulkImport = React.useCallback(async () => {
    const obs = normalizeObservations(observations)
    const dataRows = bulkDataRows(bulkHasHeader)

    const obsIndex = new Map<string, ObservationRow>()
    for (const o of obs) {
      const key = bulkJoinValueForObservation(o, bulkJoinTarget)
      if (key) obsIndex.set(key.trim(), o)
    }

    const matched: Array<{ obs: ObservationRow; values: Array<{ pofKey: string; value: unknown }> }> = []
    const unmatched: string[] = []

    for (const row of dataRows) {
      const joinVal = bulkCellToString(row[bulkJoinCsvCol]).trim()
      if (!joinVal) continue
      const o = obsIndex.get(joinVal)
      if (!o) {
        unmatched.push(joinVal)
        continue
      }

      const values = bulkMappings
        .filter((m) => m.csvCol !== bulkJoinCsvCol && m.pofKey)
        .map((m) => ({ pofKey: m.pofKey, value: row[m.csvCol] }))

      if (values.length > 0) matched.push({ obs: o, values })
    }

    setBulkUnmatched(unmatched)
    setBulkProgress({ total: matched.length, done: 0, errors: 0 })
    setBulkRunning(true)

    const CONCURRENCY = 5
    let idx = 0
    let done = 0
    let errors = 0

    async function sendOne(item: (typeof matched)[number]) {
      const observationId = String(item.obs?.id ?? item.obs?.observation_id ?? '')

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

      if (bulkSendEmailUpdates && authKey && observationId) {
        try {
          const payload: {
            subject?: string
            include_observation_data: boolean
            intro_text?: string
          } = {
            include_observation_data: true,
          }

          const subject = bulkEmailSubject.trim()
          const introText = bulkEmailIntro.trim()
          if (subject) payload.subject = subject
          if (introText) payload.intro_text = introText

          await sendObservationEmailForObservation({
            observationId,
            payload,
            showSuccessToast: false,
          })
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
    const t = i18n.t.bind(i18n)
    showToast({
      title: t('bulkImport.toastDoneTitle'),
      description: errors > 0
        ? t('bulkImport.toastDoneDescErrors', { done, errors })
        : t('bulkImport.toastDoneDesc', { done }),
      variant: errors > 0 ? 'destructive' : 'success',
    })
    if (bulkSendEmailUpdates && matched.length > 0) {
      const notified = matched.length - Math.min(errors, matched.length)
      showToast({
        title: t('bulkImport.toastEmailsTitle'),
        description: errors > 0
          ? t('bulkImport.toastEmailsDescErrors', { count: notified, errors })
          : t('bulkImport.toastEmailsDesc', { count: notified }),
        variant: errors > 0 ? 'destructive' : 'success',
      })
    }
  }, [
    authKey,
    bulkDataRows,
    bulkEmailIntro,
    bulkEmailSubject,
    bulkHasHeader,
    bulkJoinCsvCol,
    bulkJoinTarget,
    bulkJoinValueForObservation,
    bulkMappings,
    bulkSendEmailUpdates,
    coerceBulkValue,
    normalizeObservations,
    observations,
    projectObservationFields,
    saveProjectFieldValue,
    sendObservationEmailForObservation,
    showToast,
  ])

  return {
    bulkDialogOpen,
    setBulkDialogOpen,
    bulkStep,
    setBulkStep,
    bulkRawRows,
    bulkHasHeader,
    setBulkHasHeader,
    bulkJoinCsvCol,
    setBulkJoinCsvCol,
    bulkJoinOptions,
    bulkJoinTarget,
    setBulkJoinTarget,
    bulkJoinValueForObservation,
    bulkMappings,
    setBulkMappings,
    bulkProgress,
    bulkRunning,
    bulkFinished,
    bulkUnmatched,
    bulkParseError,
    bulkSendEmailUpdates,
    setBulkSendEmailUpdates,
    bulkEmailSubject,
    setBulkEmailSubject,
    bulkEmailIntro,
    setBulkEmailIntro,
    bulkFileInputRef,
    handleBulkFileChange,
    runBulkImport,
    clearBulkState,
  }
}
