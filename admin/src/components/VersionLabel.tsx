import * as React from 'react'

import { fetchAppVersion, formatAppVersion, type AppVersion } from '@/lib/app-version'

/** The deployed version, read from /version.json. Renders nothing when there is no version file (dev). */
export function VersionLabel({ className }: { className?: string }) {
  const [version, setVersion] = React.useState<AppVersion | null>(null)

  React.useEffect(() => {
    let active = true
    void fetchAppVersion().then((v) => {
      if (active) setVersion(v)
    })
    return () => {
      active = false
    }
  }, [])

  if (!version) return null
  return (
    <span
      className={className}
      title={`Built ${version.builtAt}\ncommit ${version.commit}${version.dirty ? '\n(built with uncommitted changes)' : ''}`}
    >
      {formatAppVersion(version)}
    </span>
  )
}
