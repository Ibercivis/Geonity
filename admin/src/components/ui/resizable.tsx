import * as React from 'react'
import { GripHorizontal, GripVertical } from 'lucide-react'
import { Group, Panel, Separator } from 'react-resizable-panels'

import { cn } from '@/lib/utils'

function ResizablePanelGroup({ className, ...props }: React.ComponentPropsWithoutRef<typeof Group>) {
  return <Group className={cn('flex h-full w-full', className)} {...props} />
}

const ResizablePanel = Panel

function ResizableHandle({
  className,
  withHandle,
  ...props
}: React.ComponentPropsWithoutRef<typeof Separator> & { withHandle?: boolean }) {
  return (
    <Separator
      className={cn(
        'group relative flex items-center justify-center bg-border transition-colors hover:bg-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'aria-[orientation=vertical]:h-full aria-[orientation=vertical]:w-1 aria-[orientation=vertical]:cursor-col-resize',
        'aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize',
        className
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 hidden h-5 w-8 items-center justify-center rounded-sm border bg-background shadow-sm group-hover:border-primary/50 group-hover:bg-primary/5 group-aria-[orientation=horizontal]:flex">
          <GripHorizontal className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
        </div>
      ) : null}
      {withHandle ? (
        <div className="z-10 hidden h-8 w-5 items-center justify-center rounded-sm border bg-background shadow-sm group-hover:border-primary/50 group-hover:bg-primary/5 group-aria-[orientation=vertical]:flex">
          <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
        </div>
      ) : null}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
