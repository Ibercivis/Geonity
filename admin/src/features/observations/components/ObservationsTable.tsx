import * as React from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CircleHelp, Globe, History, MailPlus, Pencil, Pin, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LOCALE_MAP, type Language } from '@/i18n'
import type { ObservationAdminFieldMeta, ObservationQuestion, ObservationRow, ObservationSortKey } from '@/types/observation'
import type { ProjectObservationField } from '@/types/projectObservationField'

type ObservationsTableProps = {
  rows: ObservationRow[]
  questions: ObservationQuestion[]
  projectObservationFields: ProjectObservationField[]
  selectedObservationId: string | number | null
  onSelectObservation: (id: string | number | null) => void
  toggleSort: (key: ObservationSortKey) => void
  sortIndicatorFor: (key: ObservationSortKey) => string
  answerFor: (observation: ObservationRow, questionId: number) => React.ReactNode
  extractLatLon: (geoposition: unknown) => { a: string; b: string } | null
  rawValueForProjectField: (observation: ObservationRow, fieldKey: string) => unknown
  projectFieldMetaForObservation: (observation: ObservationRow, fieldKey: string) => ObservationAdminFieldMeta | null
  ensureAdminFieldsLoadedForObservation: (observation: ObservationRow) => Promise<void>
  onOpenEmailLogs: (observation: ObservationRow) => void
  onOpenSendEmail: (observation: ObservationRow) => void
  saveProjectFieldValue: (opts: {
    observation: ObservationRow
    field: { key: string; field_type: string; choices?: string[] }
    value: unknown
  }) => Promise<void>
  cellSaving: Record<string, boolean>
  cellSaveError: Record<string, string>
  cellDrafts: Record<string, string>
  setCellDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  canManageProjectObservationField: boolean
  onEditField: (field: ProjectObservationField) => void
  onDeleteField: (id: number) => void
  focusMode: boolean
}

const columnHelper = createColumnHelper<ObservationRow>()

function PinButton({
  columnId,
  pinnedRef,
  onToggle,
}: {
  columnId: string
  pinnedRef: React.RefObject<Set<string>>
  onToggle: React.RefObject<(id: string) => void>
}) {
  const [, rerender] = React.useReducer((x: number) => x + 1, 0)
  const pinned = pinnedRef.current.has(columnId)
  return (
    <Tooltip>
      <TooltipTrigger render={
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={pinned
            ? 'shrink-0 text-primary hover:text-primary/80'
            : 'shrink-0 text-muted-foreground/30 hover:text-muted-foreground'}
          onClick={(e) => {
            e.stopPropagation()
            onToggle.current(columnId)
            rerender()
          }}
        />
      }>
        <Pin className="h-3 w-3" />
      </TooltipTrigger>
      <TooltipContent>{pinned ? 'Desanclar columna' : 'Anclar columna'}</TooltipContent>
    </Tooltip>
  )
}

export function ObservationsTable({
  rows,
  questions,
  projectObservationFields,
  selectedObservationId,
  onSelectObservation,
  toggleSort,
  sortIndicatorFor,
  answerFor,
  extractLatLon,
  rawValueForProjectField,
  projectFieldMetaForObservation,
  ensureAdminFieldsLoadedForObservation,
  onOpenEmailLogs,
  onOpenSendEmail,
  saveProjectFieldValue,
  cellSaving,
  cellSaveError,
  cellDrafts,
  setCellDrafts,
  canManageProjectObservationField,
  onEditField,
  onDeleteField,
  focusMode,
}: ObservationsTableProps) {
  const { t, i18n } = useTranslation()
  const locale = LOCALE_MAP[i18n.language as Language] ?? 'es-ES'

  const parentRef = React.useRef<HTMLDivElement>(null)

  const emailCountForObservation = React.useCallback((observation: ObservationRow) => {
    const count = observation?.email_count ?? observation?.emailCount
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) return count
    if (typeof count === 'string') {
      const parsed = Number(count)
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }
    return 0
  }, [])

  const formatUpdatedAt = React.useCallback((value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }, [locale])

  const formatTimestamp = React.useCallback((value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }, [locale])

  const renderAdminFieldMeta = React.useCallback((observation: ObservationRow, fieldKey: string) => {
    const meta = projectFieldMetaForObservation(observation, fieldKey)
    return (
      <div className="shrink-0 border-l border-border/60 pl-2 text-right text-[10px] leading-tight text-foreground/70">
        <div className="font-medium text-foreground/80">{meta?.updated_at ? formatUpdatedAt(meta.updated_at) : '—'}</div>
        <div className="max-w-[100px] truncate">{meta?.updated_by ?? '—'}</div>
      </div>
    )
  }, [formatUpdatedAt, projectFieldMetaForObservation])

  const renderAdminFieldCell = React.useCallback((observation: ObservationRow, field: ProjectObservationField, content: React.ReactNode) => (
    <div className="flex items-start justify-between gap-2 overflow-hidden">
      <div className="min-w-0 flex-1">{content}</div>
      {renderAdminFieldMeta(observation, field.key)}
    </div>
  ), [renderAdminFieldMeta])

  const [pinnedColumns, setPinnedColumns] = React.useState<Set<string>>(new Set())
  const togglePin = React.useCallback((id: string) => {
    setPinnedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])
  const pinnedColumnsRef = React.useRef(pinnedColumns)
  pinnedColumnsRef.current = pinnedColumns
  const togglePinRef = React.useRef(togglePin)
  togglePinRef.current = togglePin

  // Column definitions — recreated when deps change, react-table preserves sizes by column id
  const columns = React.useMemo(() => [
    columnHelper.display({
      id: 'id',
      size: 60,
      minSize: 20,
      header: () => (
        <Button type="button" variant="ghost" size="sm" className="h-auto w-full justify-start px-0 py-0 font-medium" onClick={() => toggleSort({ kind: 'builtin', id: 'id' })}>
          {t('table.id')}{sortIndicatorFor({ kind: 'builtin', id: 'id' })}
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.original?.id
        return typeof id === 'string' || typeof id === 'number' ? id : '—'
      },
    }),

    columnHelper.display({
      id: 'email_actions',
      size: 72,
      minSize: 20,
      header: () => (
        <div className="flex items-center gap-0.5">
          <span className="flex-1">{t('table.email')}</span>
          <PinButton columnId="email_actions" pinnedRef={pinnedColumnsRef} onToggle={togglePinRef} />
        </div>
      ),
      cell: ({ row }) => {
        const o = row.original
        const emailCount = emailCountForObservation(o)
        return (
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-xs" />} onClick={(e) => { e.stopPropagation(); onOpenSendEmail(o) }}>
                <MailPlus className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>{t('table.sendEmail')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-xs" className="relative overflow-visible" />} onClick={(e) => { e.stopPropagation(); onOpenEmailLogs(o) }}>
                <History className="h-3.5 w-3.5" />
                {emailCount > 0 ? (
                  <span className="absolute -top-1 -right-1 inline-flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-semibold leading-none text-primary-foreground">
                    {emailCount}
                  </span>
                ) : null}
              </TooltipTrigger>
              <TooltipContent>{t('table.emailHistory')}</TooltipContent>
            </Tooltip>
          </div>
        )
      },
    }),

    columnHelper.display({
      id: 'timestamp',
      size: 130,
      minSize: 20,
      header: () => (
        <div className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="sm" className="h-auto flex-1 justify-start px-0 py-0 font-medium" onClick={() => toggleSort({ kind: 'builtin', id: 'timestamp' })}>
            {t('table.date')}{sortIndicatorFor({ kind: 'builtin', id: 'timestamp' })}
          </Button>
          <PinButton columnId="timestamp" pinnedRef={pinnedColumnsRef} onToggle={togglePinRef} />
        </div>
      ),
      cell: ({ row }) => {
        const ts = typeof row.original?.timestamp === 'string' ? row.original.timestamp : null
        return formatTimestamp(ts) ?? '—'
      },
    }),

    columnHelper.display({
      id: 'geoposition',
      size: 150,
      minSize: 20,
      header: () => (
        <div className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="sm" className="h-auto flex-1 justify-start px-0 py-0 font-medium" onClick={() => toggleSort({ kind: 'builtin', id: 'geoposition' })}>
            {t('table.geoposition')}{sortIndicatorFor({ kind: 'builtin', id: 'geoposition' })}
          </Button>
          <PinButton columnId="geoposition" pinnedRef={pinnedColumnsRef} onToggle={togglePinRef} />
        </div>
      ),
      cell: ({ row }) => {
        const geo = row.original?.geoposition
        const ll = extractLatLon(geo)
        return ll ? `${ll.a}, ${ll.b}` : typeof geo === 'string' ? geo : '—'
      },
    }),

    ...questions.map((q) =>
      columnHelper.display({
        id: `q-${q.id}`,
        size: 180,
        minSize: 20,
        header: () => (
          <div className="flex items-center gap-0.5">
            <Button type="button" variant="ghost" size="sm" className="h-auto flex-1 justify-start px-0 py-0 text-left" onClick={() => toggleSort({ kind: 'question', id: q.id })}>
              <div className="leading-tight">
                <div className={q.mandatory ? 'font-bold text-foreground' : 'text-foreground'}>
                  {q.question_text}{sortIndicatorFor({ kind: 'question', id: q.id })}
                </div>
                <div className="text-[11px] text-muted-foreground">{q.answer_type}</div>
              </div>
            </Button>
            <PinButton columnId={`q-${q.id}`} pinnedRef={pinnedColumnsRef} onToggle={togglePinRef} />
          </div>
        ),
        cell: ({ row }) => answerFor(row.original, q.id),
      })
    ),

    ...projectObservationFields.map((f) =>
      columnHelper.display({
        id: `pof-${f.id}`,
        size: 200,
        minSize: 20,
        header: () => (
          <div className="flex items-start gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-auto flex-1 justify-start px-0 py-0 text-left" onClick={() => toggleSort({ kind: 'projectField', id: f.id, key: f.key })}>
              <div className="leading-tight">
                <div className={f.required ? 'font-bold text-foreground' : 'text-foreground'}>
                  <span className="inline-flex items-center gap-1">
                    <span>{f.label}{sortIndicatorFor({ kind: 'projectField', id: f.id, key: f.key })}</span>
                    {f.public ? (
                      <Tooltip>
                        <TooltipTrigger render={<span className="inline-flex items-center text-muted-foreground" />}>
                          <Globe className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>{t('table.publicColumn')}</TooltipContent>
                      </Tooltip>
                    ) : null}
                    {f.help_text ? (
                      <Tooltip>
                        <TooltipTrigger render={<span className="inline-flex items-center text-muted-foreground" />}>
                          <CircleHelp className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>{f.help_text}</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </span>
                </div>
                <div className="mt-1"><Badge variant="outline">{f.field_type}</Badge></div>
              </div>
            </Button>
            {canManageProjectObservationField ? (
              <div className="flex gap-0.5">
                <Tooltip>
                  <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-xs" />} onClick={() => onEditField(f)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>{t('table.editColumn')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-xs" />} onClick={() => onDeleteField(f.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>{t('table.deleteColumn')}</TooltipContent>
                </Tooltip>
              </div>
            ) : null}
          </div>
        ),
        cell: ({ row }) => {
          const o = row.original
          const obsId = o?.id
          const cellKey = `${String(obsId)}:${String(f.key)}`
          const saving = Boolean(cellSavingRef.current[cellKey])
          const err = cellSaveErrorRef.current[cellKey]

          const spinner = saving ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" /> : null
          const errEl = err ? <span className="text-[11px] text-destructive">{err}</span> : null

          if (f.field_type === 'bool') {
            return renderAdminFieldCell(o, f, (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={Boolean(rawValueRef.current(o, f.key))}
                  onFocus={() => { void ensureLoadedRef.current(o) }}
                  onCheckedChange={(checked) => { void saveFieldRef.current({ observation: o, field: f, value: Boolean(checked) }) }}
                  disabled={saving}
                />
                {spinner}{errEl}
              </div>
            ))
          }

          if (f.field_type === 'choice') {
            return renderAdminFieldCell(o, f, (
              <div className="flex items-center gap-2">
                <Select
                  value={typeof rawValueRef.current(o, f.key) === 'string' ? String(rawValueRef.current(o, f.key)) : '__empty__'}
                  onOpenChange={(open) => { if (open) void ensureLoadedRef.current(o) }}
                  onValueChange={(value) => { void saveFieldRef.current({ observation: o, field: f, value: value === '__empty__' ? '' : value }) }}
                  disabled={saving || !Array.isArray(f.choices) || f.choices.length === 0}
                >
                  <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent align="start" className="w-[var(--anchor-width)]">
                    <SelectItem value="__empty__">—</SelectItem>
                    {(Array.isArray(f.choices) ? f.choices : []).map((choice) => (
                      <SelectItem key={choice} value={choice}>{choice}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {spinner}{errEl}
              </div>
            ))
          }

          if (f.field_type === 'mchoice') {
            return renderAdminFieldCell(o, f, (
              <div className="flex flex-col gap-1" onFocus={() => { void ensureLoadedRef.current(o) }}>
                {(Array.isArray(f.choices) ? f.choices : []).map((choice) => {
                  const current = rawValueRef.current(o, f.key)
                  const selected = Array.isArray(current) ? current.filter((v): v is string => typeof v === 'string') : []
                  return (
                    <label key={choice} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={selected.includes(choice)}
                        disabled={saving}
                        onCheckedChange={(checked) => {
                          const next = checked ? [...selected, choice] : selected.filter((v) => v !== choice)
                          void saveFieldRef.current({ observation: o, field: f, value: next.length > 0 ? next : null })
                        }}
                      />
                      <span>{choice}</span>
                    </label>
                  )
                })}
                {spinner}{errEl}
              </div>
            ))
          }

          // number & text (default)
          const current = rawValueRef.current(o, f.key)
          const fallback = typeof current === 'string' || typeof current === 'number' ? String(current) : ''
          const value = cellDraftsRef.current[cellKey] !== undefined ? cellDraftsRef.current[cellKey] : fallback

          return renderAdminFieldCell(o, f, (
            <div className="flex items-center gap-2">
              <Input
                type={f.field_type === 'number' ? 'number' : 'text'}
                className="h-8 w-full text-xs"
                value={value}
                onFocus={() => { void ensureLoadedRef.current(o) }}
                onChange={(e) => setCellDraftsRef.current((prev) => ({ ...prev, [cellKey]: e.target.value }))}
                onBlur={() => {
                  const next = (cellDraftsRef.current[cellKey] ?? fallback).trim()
                  if (f.field_type === 'number') {
                    const parsed = next === '' ? null : Number(next)
                    void saveFieldRef.current({ observation: o, field: f, value: parsed !== null && Number.isFinite(parsed) ? parsed : null })
                  } else {
                    void saveFieldRef.current({ observation: o, field: f, value: next || null })
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
                disabled={saving}
              />
              {spinner}{errEl}
            </div>
          ))
        },
      })
    ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [
    t, locale,
    questions, projectObservationFields,
    toggleSort, sortIndicatorFor,
    answerFor, extractLatLon,
    renderAdminFieldCell,
    onOpenEmailLogs, onOpenSendEmail,
    emailCountForObservation, formatTimestamp,
    canManageProjectObservationField, onEditField, onDeleteField,
    // cellDrafts, setCellDrafts, cellSaving, cellSaveError, rawValueForProjectField,
    // saveProjectFieldValue, ensureAdminFieldsLoadedForObservation — accessed via refs
    // to prevent column recreation on every keystroke (which causes input focus loss)
  ])

  const columnVisibility = React.useMemo(() => {
    if (!focusMode) return {}
    const hidden: Record<string, boolean> = {}
    const hideableIds = ['email_actions', 'timestamp', 'geoposition', ...questions.map((q) => `q-${q.id}`)]
    for (const id of hideableIds) {
      if (!pinnedColumns.has(id)) hidden[id] = false
    }
    return hidden
  }, [focusMode, questions, pinnedColumns])

  const table = useReactTable({
    data: rows,
    columns,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
  })

  const { rows: tableRows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  })

  // Scroll to selected observation
  React.useEffect(() => {
    if (selectedObservationId == null) return
    const index = tableRows.findIndex((r) => String(r.original?.id) === String(selectedObservationId))
    if (index >= 0) rowVirtualizer.scrollToIndex(index, { align: 'auto', behavior: 'smooth' })
  }, [selectedObservationId, tableRows, rowVirtualizer])

  const virtualItems = rowVirtualizer.getVirtualItems()
  const paddingTop = virtualItems[0]?.start ?? 0
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
    : 0
  const totalColumns = table.getAllColumns().length

  // Refs for volatile cell state — keeps column definitions stable across keystrokes
  const cellDraftsRef = React.useRef(cellDrafts)
  cellDraftsRef.current = cellDrafts
  const setCellDraftsRef = React.useRef(setCellDrafts)
  setCellDraftsRef.current = setCellDrafts
  const cellSavingRef = React.useRef(cellSaving)
  cellSavingRef.current = cellSaving
  const cellSaveErrorRef = React.useRef(cellSaveError)
  cellSaveErrorRef.current = cellSaveError
  const rawValueRef = React.useRef(rawValueForProjectField)
  rawValueRef.current = rawValueForProjectField
  const saveFieldRef = React.useRef(saveProjectFieldValue)
  saveFieldRef.current = saveProjectFieldValue
  const ensureLoadedRef = React.useRef(ensureAdminFieldsLoadedForObservation)
  ensureLoadedRef.current = ensureAdminFieldsLoadedForObservation


  const isPofColumn = (id: string) => id.startsWith('pof-')
  const isIdColumn = (id: string) => id === 'id'

  return (
    <TooltipProvider>
      <div ref={parentRef} className="h-full overflow-auto rounded-md border bg-background">
        <table
          className="relative text-xs"
          style={{ tableLayout: 'fixed', width: table.getTotalSize(), minWidth: '100%' }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={[
                      'sticky top-0 z-20 overflow-hidden bg-muted px-2 py-1 text-left align-middle font-medium text-muted-foreground shadow-sm',
                      isIdColumn(header.id)
                        ? 'left-0 z-30 border-r border-border'
                        : isPofColumn(header.id)
                          ? 'border-l-2 border-accent'
                          : '',
                    ].join(' ')}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={[
                        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                        header.column.getIsResizing() ? 'bg-primary/60' : 'hover:bg-primary/40',
                      ].join(' ')}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 ? (
              <tr><td style={{ height: paddingTop }} colSpan={totalColumns} /></tr>
            ) : null}
            {virtualItems.map((virtualRow) => {
              const row = tableRows[virtualRow.index]
              const isSelected = String(row.original?.id) === String(selectedObservationId)
              return (
                <tr
                  key={row.id}
                  className={isSelected ? 'cursor-pointer bg-blue-100 dark:bg-blue-900/30' : 'cursor-pointer border-b transition-colors hover:bg-muted/50'}
                  onClick={() => {
                    const id = row.original?.id
                    if (id != null) onSelectObservation(id)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={[
                        'overflow-hidden whitespace-nowrap px-2 py-1 align-middle',
                        isIdColumn(cell.column.id)
                          ? `sticky left-0 z-10 border-r border-border/50 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-background'}`
                          : isPofColumn(cell.column.id)
                            ? 'border-l-2 border-accent/50 bg-accent'
                            : '',
                      ].join(' ')}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
            {paddingBottom > 0 ? (
              <tr><td style={{ height: paddingBottom }} colSpan={totalColumns} /></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  )
}
