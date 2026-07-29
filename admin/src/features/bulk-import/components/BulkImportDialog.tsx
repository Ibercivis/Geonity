import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LOCALE_MAP, type Language } from '@/i18n'
import type { BulkJoinOption, BulkJoinTarget, BulkMapping, BulkProgress } from '@/types/bulkImport'
import type { ObservationRow } from '@/types/observation'
import type { ProjectObservationField } from '@/types/projectObservationField'

type BulkImportDialogProps = {
  open: boolean
  bulkStep: 1 | 2 | 3 | 4
  setBulkStep: React.Dispatch<React.SetStateAction<1 | 2 | 3 | 4>>
  bulkHasHeader: boolean
  setBulkHasHeader: React.Dispatch<React.SetStateAction<boolean>>
  bulkJoinCsvCol: number
  setBulkJoinCsvCol: React.Dispatch<React.SetStateAction<number>>
  bulkJoinOptions: BulkJoinOption[]
  bulkJoinTarget: BulkJoinTarget
  setBulkJoinTarget: React.Dispatch<React.SetStateAction<BulkJoinTarget>>
  bulkJoinValueForObservation: (observation: ObservationRow, target: BulkJoinTarget) => string
  bulkMappings: BulkMapping[]
  setBulkMappings: React.Dispatch<React.SetStateAction<BulkMapping[]>>
  bulkRawRows: unknown[][]
  bulkProgress: BulkProgress | null
  bulkRunning: boolean
  bulkFinished: boolean
  bulkUnmatched: string[]
  bulkSendEmailUpdates: boolean
  setBulkSendEmailUpdates: React.Dispatch<React.SetStateAction<boolean>>
  bulkEmailSubject: string
  setBulkEmailSubject: React.Dispatch<React.SetStateAction<string>>
  bulkEmailIntro: string
  setBulkEmailIntro: React.Dispatch<React.SetStateAction<string>>
  projectObservationFields: ProjectObservationField[]
  observations: unknown
  normalizeObservations: (data: unknown) => ObservationRow[]
  onClose: () => void
  runBulkImport: () => Promise<void>
}

export function BulkImportDialog({
  open,
  bulkStep,
  setBulkStep,
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
  bulkRawRows,
  bulkProgress,
  bulkRunning,
  bulkFinished,
  bulkUnmatched,
  bulkSendEmailUpdates,
  setBulkSendEmailUpdates,
  bulkEmailSubject,
  setBulkEmailSubject,
  bulkEmailIntro,
  setBulkEmailIntro,
  projectObservationFields,
  observations,
  normalizeObservations,
  onClose,
  runBulkImport,
}: BulkImportDialogProps) {
  const { t, i18n } = useTranslation()
  const locale = LOCALE_MAP[i18n.language as Language] ?? 'es-ES'

  function bulkCellToDisplay(value: unknown): string {
    if (value === null || value === undefined) return ''
    if (value instanceof Date) return value.toLocaleString(locale)
    return String(value)
  }

  const headers = bulkRawRows.length === 0
    ? []
    : bulkHasHeader
      ? bulkRawRows[0].map((h, i) => bulkCellToDisplay(h).trim() || t('bulkImport.col', { n: i + 1 }))
      : bulkRawRows[0].map((_, i) => t('bulkImport.col', { n: i + 1 }))
  const dataRows = bulkHasHeader ? bulkRawRows.slice(1) : bulkRawRows
  const previewRows = bulkRawRows.slice(0, 6)

  const TOTAL_STEPS = 4

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !bulkRunning) onClose() }}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0 sm:max-w-2xl" showCloseButton={!bulkRunning}>

        {/* Header — dark band like topbar */}
        <div className="bg-brand-900 px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-white">
                {t('bulkImport.title')}
              </DialogTitle>
              {bulkStep <= TOTAL_STEPS && !bulkFinished ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <div
                      key={i}
                      className={[
                        'h-1.5 w-6 rounded-full transition-colors',
                        i + 1 < bulkStep ? 'bg-white/60' : i + 1 === bulkStep ? 'bg-white' : 'bg-white/25',
                      ].join(' ')}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <DialogDescription className="text-white/80">
              {t('bulkImport.description')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 space-y-4 overflow-auto px-6 py-5">
            {bulkStep === 1 ? (
              <>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={bulkHasHeader} onCheckedChange={(checked) => setBulkHasHeader(Boolean(checked))} />
                    {t('bulkImport.hasHeader')}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {t('bulkImport.rowCount', { rows: dataRows.length, cols: headers.length })}
                  </span>
                </div>

                <div className="overflow-auto rounded border text-xs">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        {headers.map((h, i) => (
                          <TableHead key={i} className="whitespace-nowrap px-2 py-1 text-left font-medium">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(bulkHasHeader ? previewRows.slice(1) : previewRows).slice(0, 5).map((row, ri) => (
                        <TableRow key={ri}>
                          {row.map((cell, ci) => (
                            <TableCell key={ci} className="max-w-[160px] truncate whitespace-nowrap px-2 py-1">{bulkCellToDisplay(cell)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}

            {bulkStep === 2 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('bulkImport.step2Instruction')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('bulkImport.csvColumn')}</Label>
                    <Select value={String(bulkJoinCsvCol)} onValueChange={(value) => setBulkJoinCsvCol(Number(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('bulkImport.selectColumn')}>
                          {headers[bulkJoinCsvCol] ?? null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start" className="w-[var(--anchor-width)]">
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('bulkImport.joinField')}</Label>
                    <Select value={bulkJoinTarget} onValueChange={(value) => setBulkJoinTarget(value as BulkJoinTarget)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('bulkImport.selectField')}>
                          {bulkJoinOptions.find((o) => o.value === bulkJoinTarget)?.label ?? null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start" className="w-[var(--anchor-width)]">
                        {bulkJoinOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {t('bulkImport.sampleValues', { col: headers[bulkJoinCsvCol] })}{' '}
                  {dataRows.slice(0, 5).map((r) => bulkCellToDisplay(r[bulkJoinCsvCol])).filter(Boolean).join(', ')}
                </div>

                <div className="text-xs text-muted-foreground">
                  {t('bulkImport.joinHelp')}
                </div>
              </div>
            ) : null}

            {bulkStep === 3 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('bulkImport.step3Instruction')}
                </p>
                <div className="space-y-2">
                  {headers.map((h, i) => {
                    if (i === bulkJoinCsvCol) return null
                    const mapping = bulkMappings.find((m) => m.csvCol === i)
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 truncate text-right text-xs text-muted-foreground">{h}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <Select
                          value={mapping?.pofKey ?? ''}
                          onValueChange={(val) => {
                            setBulkMappings((prev) => {
                              const without = prev.filter((m) => m.csvCol !== i)
                              return val ? [...without, { csvCol: i, pofKey: val }] : without
                            })
                          }}
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue placeholder={t('bulkImport.ignore')}>
                              {mapping?.pofKey
                                ? (() => { const f = projectObservationFields.find((f) => f.key === mapping.pofKey); return f ? `${f.label} (${f.key})` : mapping.pofKey })()
                                : t('bulkImport.ignore')}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent align="start" className="w-[var(--anchor-width)]">
                            <SelectItem value="">{t('bulkImport.ignore')}</SelectItem>
                            {projectObservationFields.map((f) => (
                              <SelectItem key={f.key} value={f.key}>{f.label} ({f.key})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
                {bulkMappings.filter((m) => m.pofKey).length === 0 ? (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription>{t('bulkImport.atLeastOneMapping')}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            ) : null}

            {bulkStep === 4 ? (() => {
              const obs = normalizeObservations(observations)
              const obsIndex = new Map<string, ObservationRow>()
              for (const o of obs) {
                const key = bulkJoinValueForObservation(o, bulkJoinTarget)
                if (key) obsIndex.set(key.trim(), o)
              }

              const totalRows = dataRows.length
              const matchCount = dataRows.filter((r) => {
                const v = bulkCellToDisplay(r[bulkJoinCsvCol]).trim()
                return v && obsIndex.has(v)
              }).length
              const unmatchCount = totalRows - matchCount

              return (
                <div className="space-y-4">
                  {!bulkRunning && !bulkFinished ? (
                    <Alert>
                      <AlertDescription className="space-y-3">
                        <div><span className="font-medium">{matchCount}</span> {t('bulkImport.willUpdate', { count: matchCount }).replace(`${matchCount} `, '')}</div>
                        {unmatchCount > 0 ? (
                          <div className="text-amber-600 dark:text-amber-400">
                            {t('bulkImport.willIgnore', { count: unmatchCount })}
                          </div>
                        ) : null}
                        <div className="text-xs text-muted-foreground">
                          {t('bulkImport.fieldsToUpdate')}{' '}
                          {bulkMappings
                            .filter((m) => m.pofKey)
                            .map((m) => {
                              const f = projectObservationFields.find((field) => field.key === m.pofKey)
                              return f?.label ?? m.pofKey
                            })
                            .join(', ')}
                        </div>
                        <div className="space-y-3 rounded-md border bg-background p-3">
                          <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <Checkbox
                              checked={bulkSendEmailUpdates}
                              onCheckedChange={(checked) => setBulkSendEmailUpdates(Boolean(checked))}
                            />
                            <span>
                              <span className="font-medium">{t('bulkImport.sendEmailUpdates')}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {t('bulkImport.sendEmailHelp')}
                              </span>
                            </span>
                          </label>

                          {bulkSendEmailUpdates ? (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs">{t('bulkImport.emailSubject')}</Label>
                                <Input
                                  value={bulkEmailSubject}
                                  onChange={(event) => setBulkEmailSubject(event.target.value)}
                                  placeholder={t('bulkImport.emailSubjectPlaceholder')}
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">{t('bulkImport.emailIntro')}</Label>
                                <Textarea
                                  value={bulkEmailIntro}
                                  onChange={(event) => setBulkEmailIntro(event.target.value)}
                                  placeholder={t('bulkImport.emailIntroPlaceholder')}
                                  className="min-h-24 text-xs"
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {(bulkRunning || bulkFinished) && bulkProgress ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{bulkFinished ? t('bulkImport.finished') : t('bulkImport.processing')}</span>
                        <span>{bulkProgress.done} / {bulkProgress.total}</span>
                      </div>
                      <Progress value={bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0} />
                      {bulkFinished ? (
                        <div className="space-y-1 text-sm">
                          <div className="text-green-600 dark:text-green-400">{t('bulkImport.rowsProcessed', { count: bulkProgress.done })}</div>
                          {bulkProgress.errors > 0 ? <div className="text-destructive">{t('bulkImport.errorsCount', { count: bulkProgress.errors })}</div> : null}
                          {bulkUnmatched.length > 0 ? (
                            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                              <div className="font-medium text-amber-700 dark:text-amber-300">
                                {t('bulkImport.unmatchedCount', { count: bulkUnmatched.length })}
                              </div>
                              <div className="mt-2 max-h-32 overflow-auto rounded border bg-background p-2 font-mono text-foreground">
                                {bulkUnmatched.join(', ')}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })() : null}
          </div>

        <div className="flex justify-between border-t bg-muted/20 px-6 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (bulkStep > 1 && !bulkRunning && !bulkFinished) setBulkStep((s) => (s - 1) as 1 | 2 | 3 | 4)
              else if (!bulkRunning) onClose()
            }}
          >
            {bulkStep === 1 || bulkFinished ? t('bulkImport.cancel') : t('bulkImport.back')}
          </Button>

          {bulkFinished ? (
            <Button size="sm" onClick={onClose}>{t('bulkImport.close')}</Button>
          ) : bulkStep < 3 ? (
            <Button size="sm" disabled={dataRows.length === 0} onClick={() => setBulkStep((s) => (s + 1) as 1 | 2 | 3 | 4)}>
              {t('bulkImport.next')}
            </Button>
          ) : bulkStep === 3 ? (
            <Button size="sm" disabled={bulkMappings.filter((m) => m.pofKey).length === 0} onClick={() => setBulkStep(4)}>
              {t('bulkImport.preview')}
            </Button>
          ) : (
            <Button size="sm" disabled={bulkRunning} onClick={() => void runBulkImport()}>
              {bulkRunning ? t('bulkImport.importing') : t('bulkImport.import')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
