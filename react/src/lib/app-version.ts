/** Version info written by react/deploy.sh as /version.json. Absent in development and before the first scripted deploy. */
export interface AppVersion {
  short: string
  commit: string
  builtAt: string
  dirty: boolean
}

export async function fetchAppVersion(): Promise<AppVersion | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' })
    // Without the file the SPA fallback answers with index.html, which is not JSON.
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null
    const data = (await res.json()) as Partial<AppVersion>
    return typeof data.short === 'string' && typeof data.builtAt === 'string'
      ? { short: data.short, commit: data.commit ?? data.short, builtAt: data.builtAt, dirty: !!data.dirty }
      : null
  } catch {
    return null
  }
}

/** Language-neutral label: `v a1f7946 · 2026-10-07` (a trailing `*` marks a build made with uncommitted changes). */
export function formatAppVersion(v: AppVersion): string {
  return `v ${v.short}${v.dirty ? '*' : ''} · ${v.builtAt.slice(0, 10)}`
}
