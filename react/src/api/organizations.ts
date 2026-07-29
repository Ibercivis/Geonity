import { api } from '@/lib/axios'
import type { Organization, OrgInvitation, Project } from '@/types'

export interface OrgType {
  id: number
  type: string
}

export const orgsApi = {
  types: () =>
    api.get<OrgType[]>('/organization/type/').then((r) => r.data),

  list: () =>
    api.get<Organization[]>('/organization/').then((r) => r.data),

  mine: () =>
    api.get<Organization[]>('/organization/mine/').then((r) => r.data),

  get: (id: number, raw?: boolean) =>
    api.get<Organization>(`/organization/${id}/`, raw ? { params: { raw: true } } : undefined).then((r) => r.data),

  create: (data: FormData) =>
    api.post<Organization>('/organization/create/', data).then((r) => r.data),

  update: (id: number, data: FormData) =>
    api.patch<Organization>(`/organization/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/organization/${id}/`),

  invite: (id: number, email: string, role: 'administrator' | 'member') =>
    api.post(`/organization/${id}/invite/`, { email, role }).then((r) => r.data),

  leave: (id: number) =>
    api.post(`/organization/${id}/leave/`).then((r) => r.data),

  projects: (id: number, ordering?: string) =>
    api.get<Project[]>(`/organization/${id}/projects/`, { params: ordering ? { ordering } : undefined }).then((r) => r.data),

  invitations: (id: number) =>
    api.get<OrgInvitation[]>(`/organization/${id}/invitations/`).then((r) => r.data),

  pendingInvitations: () =>
    api.get<OrgInvitation[]>('/organization/invitations/pending/').then((r) => r.data),

  acceptInvitation: (invId: number) =>
    api.post(`/organization/invitations/${invId}/accept/`).then((r) => r.data),

  rejectInvitation: (invId: number) =>
    api.post(`/organization/invitations/${invId}/reject/`).then((r) => r.data),

  cancelInvitation: (invId: number) =>
    api.delete(`/organization/invitations/${invId}/cancel/`),
}
