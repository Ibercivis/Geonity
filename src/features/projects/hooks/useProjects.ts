import * as React from 'react'

import { fetchProjects as fetchProjectsRequest } from '@/lib/api/projects'
import type { ProjectOption, ProjectParticipant } from '@/types/project'

function normalizeEntityId(value: unknown): string | number | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value
  return undefined
}

function asObjectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function preferredProjectLocales(): string[] {
  const locales = new Set<string>(['es', 'en'])

  if (typeof document !== 'undefined' && typeof document.documentElement?.lang === 'string') {
    const lang = document.documentElement.lang.trim().toLowerCase()
    if (lang) {
      locales.add(lang)
      locales.add(lang.split('-')[0])
    }
  }

  if (typeof navigator !== 'undefined') {
    const language = typeof navigator.language === 'string' ? navigator.language.trim().toLowerCase() : ''
    if (language) {
      locales.add(language)
      locales.add(language.split('-')[0])
    }
  }

  return Array.from(locales)
}

function localizedStringFromRecord(record: Record<string, unknown>): string {
  for (const locale of preferredProjectLocales()) {
    const localized = record[locale]
    if (typeof localized === 'string' && localized.trim()) return localized.trim()
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

function normalizeProjectName(value: unknown): string {
  if (!value) return ''

  if (typeof value === 'object' && !Array.isArray(value)) {
    return localizedStringFromRecord(value as Record<string, unknown>)
  }

  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) return trimmed

  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const localized = localizedStringFromRecord(parsed as Record<string, unknown>)
      if (localized) return localized
    }
  } catch {
    return trimmed
  }

  return trimmed
}

function normalizeProjectParticipant(value: unknown): ProjectParticipant | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const raw = String(value).trim()
    if (!raw) return null
    return {
      id: normalizeEntityId(value),
      label: raw.includes('@') ? raw : `Usuario ${raw}`,
      email: raw.includes('@') ? raw : null,
    }
  }

  const record = asObjectRecord(value)
  if (!record) return null

  const nestedUser = asObjectRecord(record.user) ?? asObjectRecord(record.profile)

  const id = normalizeEntityId(record.id ?? record.user_id ?? record.userId ?? nestedUser?.id ?? nestedUser?.user_id ?? nestedUser?.userId)
  const email =
    firstNonEmptyString(
      record.email,
      record.user_email,
      record.userEmail,
      record.mail,
      record.principalEmail,
      nestedUser?.email,
      nestedUser?.user_email,
      nestedUser?.userEmail,
      nestedUser?.mail,
      nestedUser?.principalEmail
    ) || null
  const label = firstNonEmptyString(
    normalizeProjectName(record.name),
    normalizeProjectName(record.full_name),
    normalizeProjectName(record.fullName),
    normalizeProjectName(record.username),
    normalizeProjectName(record.principalName),
    normalizeProjectName(record.label),
    normalizeProjectName(nestedUser?.name),
    normalizeProjectName(nestedUser?.full_name),
    normalizeProjectName(nestedUser?.fullName),
    normalizeProjectName(nestedUser?.username),
    normalizeProjectName(nestedUser?.principalName),
    email,
    id !== undefined ? `Usuario ${String(id)}` : ''
  )

  if (!label) return null
  return { id, label, email }
}

function normalizeProjectParticipants(value: unknown): ProjectParticipant[] {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizeProjectParticipant)
    .filter((participant): participant is ProjectParticipant => participant !== null)
}

function normalizeProjectRoleValue(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalized.includes('creador') || normalized.includes('creator') || normalized.includes('owner')) {
    return 'creador'
  }

  if (normalized.includes('administrador') || normalized.includes('administrator') || normalized.includes('admin')) {
    return 'administrador'
  }

  return ''
}

function projectRoleFrom(raw: Record<string, unknown>, nestedProject: Record<string, unknown> | null): string {
  const nestedMembership =
    asObjectRecord(raw.membership) ??
    asObjectRecord(raw.project_membership) ??
    asObjectRecord(raw.projectMembership)

  const explicitRole =
    normalizeProjectRoleValue(raw.role) ||
    normalizeProjectRoleValue(raw.project_role) ||
    normalizeProjectRoleValue(raw.projectRole) ||
    normalizeProjectRoleValue(raw.membership_role) ||
    normalizeProjectRoleValue(raw.membershipRole) ||
    normalizeProjectRoleValue(raw.user_role) ||
    normalizeProjectRoleValue(raw.userRole) ||
    normalizeProjectRoleValue(raw.permission) ||
    normalizeProjectRoleValue(raw.permission_level) ||
    normalizeProjectRoleValue(nestedProject?.role) ||
    normalizeProjectRoleValue(nestedMembership?.role)

  if (explicitRole) return explicitRole

  const creatorFlags = [
    raw.is_creator,
    raw.isCreator,
    raw.created_by_me,
    raw.createdByMe,
    raw.owner,
    raw.is_owner,
    raw.isOwner,
    nestedProject?.is_creator,
    nestedProject?.isCreator,
    nestedMembership?.is_creator,
    nestedMembership?.isCreator,
    nestedMembership?.owner,
  ]

  if (creatorFlags.some(Boolean)) return 'creador'

  const adminFlags = [
    raw.is_admin,
    raw.isAdmin,
    raw.admin,
    raw.is_administrator,
    raw.isAdministrator,
    nestedProject?.is_admin,
    nestedProject?.isAdmin,
    nestedMembership?.is_admin,
    nestedMembership?.isAdmin,
    nestedMembership?.admin,
  ]

  if (adminFlags.some(Boolean)) return 'administrador'

  return ''
}


function normalizeProjectItem(value: unknown): ProjectOption | null {
  const raw = asObjectRecord(value)
  if (!raw) return null

  const nestedProject = asObjectRecord(raw.project)
  const id = normalizeEntityId(raw.id ?? raw.project_id ?? raw.projectId ?? nestedProject?.id)
  const name = firstNonEmptyString(
    normalizeProjectName(raw.name),
    normalizeProjectName(raw.project_name),
    normalizeProjectName(raw.projectName),
    normalizeProjectName(raw.title),
    normalizeProjectName(raw.label),
    normalizeProjectName(raw.nombre),
    normalizeProjectName(nestedProject?.name),
    normalizeProjectName(nestedProject?.project_name),
    normalizeProjectName(nestedProject?.projectName),
    normalizeProjectName(nestedProject?.title),
    normalizeProjectName(nestedProject?.label),
    normalizeProjectName(nestedProject?.nombre)
  )
  const emailSubject = firstNonEmptyString(
    normalizeProjectName(raw.email_subject),
    normalizeProjectName(raw.emailSubject),
    normalizeProjectName(nestedProject?.email_subject),
    normalizeProjectName(nestedProject?.emailSubject)
  )
  const emailIntro = firstNonEmptyString(
    normalizeProjectName(raw.email_intro),
    normalizeProjectName(raw.emailIntro),
    normalizeProjectName(nestedProject?.email_intro),
    normalizeProjectName(nestedProject?.emailIntro)
  )
  const creator =
    normalizeProjectParticipant(raw.creator_detail) ??
    normalizeProjectParticipant(raw.creator) ??
    normalizeProjectParticipant(nestedProject?.creator_detail) ??
    normalizeProjectParticipant(nestedProject?.creator)
  const administrators = normalizeProjectParticipants(raw.administrators ?? nestedProject?.administrators)
  const isPrivate = Boolean(raw.is_private ?? raw.isPrivate ?? nestedProject?.is_private ?? nestedProject?.isPrivate)
  const privateData = Boolean(raw.private_data ?? raw.privateData ?? nestedProject?.private_data ?? nestedProject?.privateData)

  return {
    id,
    name,
    role: projectRoleFrom(raw, nestedProject),
    emailSubject,
    emailIntro,
    isPrivate,
    privateData,
    creator,
    administrators,
  }
}

function projectRolePriority(role: string | undefined): number {
  if (role === 'creador') return 0
  if (role === 'administrador') return 1
  return 2
}

function normalizeProjects(data: unknown): ProjectOption[] {
  let list: unknown[] = []

  if (Array.isArray(data)) list = data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (Array.isArray(record.results)) list = record.results
  }

  return list.map(normalizeProjectItem).filter((project): project is ProjectOption => project !== null)
}

export function projectIdToString(id: unknown): string {
  if (typeof id === 'string') return id
  if (typeof id === 'number') return String(id)
  return ''
}

export function projectLabel(p: ProjectOption): string {
  const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : ''
  const id = projectIdToString(p.id)
  const baseLabel = name || (id ? `Proyecto ${id}` : 'Proyecto')
  return p.role ? `${baseLabel} · ${p.role}` : baseLabel
}

export function useProjects(authKey: string | null) {
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [projectsError, setProjectsError] = React.useState<string | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false)
  const [selectedProjectId, setSelectedProjectId] = React.useState('')
  const [reloadVersion, setReloadVersion] = React.useState(0)

  const reloadProjects = React.useCallback(() => {
    setReloadVersion((current) => current + 1)
  }, [])

  React.useEffect(() => {
    if (!authKey) return
    const sessionKey = authKey

    let cancelled = false

    async function loadProjects() {
      setIsLoadingProjects(true)
      setProjectsError(null)

      try {
        const data = await fetchProjectsRequest(sessionKey)
        const parsed = normalizeProjects(data)

        if (!cancelled) {
          setProjects(parsed)
          setSelectedProjectId((prev) => {
            if (!prev) return ''
            return parsed.some((project) => projectIdToString(project.id) === prev) ? prev : ''
          })
        }
      } catch (err) {
        if (!cancelled) setProjectsError(err instanceof Error ? err.message : 'Error inesperado cargando proyectos')
      } finally {
        if (!cancelled) setIsLoadingProjects(false)
      }
    }

    loadProjects()
    return () => {
      cancelled = true
    }
  }, [authKey, reloadVersion])

  const selectedProject = React.useMemo(
    () => projects.find((project) => projectIdToString(project.id) === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )
  const projectOptions = React.useMemo(
    () =>
      [...projects]
        .sort((a, b) => {
          const roleOrder = projectRolePriority(a.role) - projectRolePriority(b.role)
          if (roleOrder !== 0) return roleOrder

          const nameA = projectLabel(a).toLocaleLowerCase('es')
          const nameB = projectLabel(b).toLocaleLowerCase('es')
          return nameA.localeCompare(nameB, 'es')
        })
        .map((project) => ({
          value: projectIdToString(project.id),
          label: projectLabel(project),
          role: project.role,
        })),
    [projects]
  )

  const clearProjects = React.useCallback(() => {
    setProjects([])
    setProjectsError(null)
    setIsLoadingProjects(false)
    setSelectedProjectId('')
  }, [])

  return {
    projects,
    projectsError,
    isLoadingProjects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    projectOptions,
    reloadProjects,
    clearProjects,
  }
}
