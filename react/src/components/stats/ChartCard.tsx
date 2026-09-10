import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  /** Top-right slot (legend, toggle). */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartCard({ title, description, aside, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-2 flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        {aside}
      </CardHeader>
      <CardContent className="p-4 pt-2">{children}</CardContent>
    </Card>
  )
}
