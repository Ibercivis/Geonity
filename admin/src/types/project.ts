import type { EntityId } from '@/types/observation'

export type ProjectRole = '' | 'administrador' | 'creador' | string

export type ProjectParticipant = {
  id?: EntityId
  label: string
  email?: string | null
}

export type ProjectInvitation = {
  id: string
  email: string
  status?: string | null
  createdAt?: string | null
  acceptedAt?: string | null
  projectId?: string | null
  projectName?: string | null
}

export type ProjectOption = {
  id?: EntityId
  name?: string
  role?: ProjectRole
  emailSubject?: string
  emailIntro?: string
  isPrivate?: boolean
  privateData?: boolean
  creator?: ProjectParticipant | null
  administrators?: ProjectParticipant[]
}

export type ProjectApiRecord = Record<string, unknown>

export type ProjectOptionItem = {
  value: string
  label: string
  role?: ProjectRole
}
