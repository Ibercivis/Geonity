import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Code2, Download, Plus, Upload } from 'lucide-react'

type ObservationsToolbarProps = {
  observationCount: number
  hasObservations: boolean
  canImport: boolean
  canCreateColumn: boolean
  canOpenColumnCreator: boolean
  isLoadingObservations: boolean
  observationsError: string | null
  bulkParseError: string | null
  onExport: () => void
  onImportClick: () => void
  onOpenRawJson: () => void
  onOpenColumnCreator: () => void
}

export function ObservationsToolbar({
  observationCount,
  hasObservations,
  canImport,
  canCreateColumn,
  canOpenColumnCreator,
  isLoadingObservations,
  observationsError,
  bulkParseError,
  onExport,
  onImportClick,
  onOpenRawJson,
  onOpenColumnCreator,
}: ObservationsToolbarProps) {
  return (
    <div className="flex-none px-4 pt-4 pb-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{observationCount} Observaciones</p>
          <div className="flex items-center gap-2">
            {hasObservations ? (
              <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            ) : null}
            {canImport ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={onImportClick}>
                <Upload className="h-4 w-4" />
                Importar CSV/XLSX
              </Button>
            ) : null}
            {hasObservations ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={onOpenRawJson}>
                <Code2 className="h-4 w-4" />
                Ver JSON raw
              </Button>
            ) : null}
            {canCreateColumn ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={onOpenColumnCreator} disabled={!canOpenColumnCreator}>
                <Plus className="h-4 w-4" />
                Crear columna
              </Button>
            ) : null}
          </div>
        </div>

        {isLoadingObservations ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : null}
        {observationsError ? (
          <Alert variant="destructive">
            <AlertDescription>{observationsError}</AlertDescription>
          </Alert>
        ) : null}
        {bulkParseError ? (
          <Alert variant="destructive">
            <AlertDescription>{bulkParseError}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </div>
  )
}
