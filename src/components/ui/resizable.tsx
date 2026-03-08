import * as React from 'react'
import { GripVertical } from 'lucide-react'
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
        'relative flex bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:w-px aria-[orientation=vertical]:cursor-col-resize aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize',
        className
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 flex h-5 w-5 items-center justify-center rounded-sm border bg-background">
          <GripVertical className="h-3 w-3" />
        </div>
      ) : null}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
