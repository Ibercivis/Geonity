import { api } from '@/lib/axios'
import { config } from '@/config/env'
import type { FieldForm, Observation, Project, ProjectInvitation, Topic } from '@/types'

export interface ProjectFilters {
  topic?: number
  country?: string
  search?: string
  my_projects?: boolean
  ordering?: string
}

export const projectsApi = {
  list: (filters?: ProjectFilters) =>
    api.get<Project[]>('/project/', { params: filters }).then((r) => r.data),

  myAdminProjects: () =>
    api.get<Project[]>('/project/my_admin_projects/').then((r) => r.data),

  myParticipating: () =>
    api.get<Project[]>('/project/my_participating/').then((r) => r.data),

  myLiked: () =>
    api.get<Project[]>('/project/my_liked/').then((r) => r.data),

  myObservations: () =>
    api.get<Observation[]>('/observations/my/').then((r) => r.data),

  get: (id: number, raw?: boolean) =>
    api.get<Project>(`/project/${id}/`, raw ? { params: { raw: true } } : undefined).then((r) => r.data),

  create: (data: FormData) =>
    api.post<Project>('/project/create/', data).then((r) => r.data),

  update: (id: number, data: FormData | Record<string, unknown>) =>
    api.patch<Project>(`/project/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/project/${id}/`),

  exportJson: (id: number) =>
    api.get(`/project/${id}/export/`, { responseType: 'blob' }).then((r) => r.data as Blob),

  toggleLike: (id: number) =>
    api.post(`/projects/${id}/toggle-like/`).then((r) => r.data),

  validatePassword: (id: number, password: string) =>
    api.post<{ valid: boolean }>(`/projects/${id}/validate-password/`, { password }).then((r) => r.data),

  topics: () =>
    api.get<Topic[]>('/project/topics/').then((r) => r.data),

  countries: () =>
    api.get<{ country: string; project_count: number }[]>('/project/countries/').then((r) => r.data),

  downloadObservations: (id: number, fileFormat: 'csv' | 'xlsx' | 'ods' = 'csv') =>
    api.get(`/project/${id}/download_observations/`, {
      params: { file_format: fileFormat },
      responseType: 'blob',
    }).then((r) => r.data),

  invite: (id: number, email: string) =>
    api.post<ProjectInvitation>(`/project/${id}/invite/`, { email }).then((r) => r.data),

  invitations: (id: number) =>
    api.get<ProjectInvitation[]>(`/project/${id}/invitations/`).then((r) => r.data),

  pendingInvitations: () =>
    api.get<ProjectInvitation[]>('/project/invitations/pending/').then((r) => r.data),

  acceptInvitation: (invId: number) =>
    api.post(`/project/invitations/${invId}/accept/`).then((r) => r.data),

  rejectInvitation: (invId: number) =>
    api.post(`/project/invitations/${invId}/reject/`).then((r) => r.data),

  cancelInvitation: (invId: number) =>
    api.delete(`/project/invitations/${invId}/cancel/`),

  getFieldForm: (fieldFormId: number, lang?: string) =>
    api
      .get<FieldForm>(`/field_forms/${fieldFormId}/`, {
        params: { raw: true },
        headers: lang ? { 'Accept-Language': lang } : undefined,
      })
      .then((r) => r.data),

  getObservations: (fieldFormId: number) =>
    api.get<Observation[]>(`/field_form/${fieldFormId}/observations/`).then((r) => r.data),

  getMapPoints: (fieldFormId: number) =>
    api.get<{ id: number; lat: number; lon: number }[]>(`/field_form/${fieldFormId}/observations/map/`).then((r) => r.data),

  getObservationDetail: (id: number) =>
    api.get<Observation>(`/observations/${id}/`).then((r) => r.data),

  getMyObservations: (fieldFormId: number) =>
    api.get<Observation[]>(`/field_form/${fieldFormId}/observations/mine/`).then((r) => r.data),

  getHexObservations: (fieldFormId: number, zoom: number) =>
    api.get<{ type: string; features: { geometry: { coordinates: [number, number] }; properties: { count: number; hex_polygon: [number, number][] } }[] }>(
      `/field_form/${fieldFormId}/observations/hex/?zoom=${zoom}`
    ).then((r) =>
      r.data.features.map((f) => ({
        polygon: f.properties.hex_polygon as [number, number][],
        centroid: f.geometry.coordinates as [number, number],
        count: f.properties.count,
      }))
    ),

  createObservation: (data: FormData) =>
    api.post<Observation>('/observations/', data, {
      headers: { 'X-Api-Key': config.observationsApiKey },
    }).then((r) => r.data),

  deleteObservation: (id: number) =>
    api.delete(`/observations/${id}/`),

  /** Rotates the project's anonymous-contribution token; previously printed QR codes stop working. */
  regenerateAnonymousToken: (id: number) =>
    api.post<{ anonymous_token: string }>(`/project/${id}/regenerate-anonymous-token/`).then((r) => r.data),
}
