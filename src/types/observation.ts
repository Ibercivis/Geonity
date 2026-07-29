import type { PaginatedResponse } from '@/types/api'

export type EntityId = string | number

export type ObservationQuestion = {
  id: number
  question_text: string
  answer_type: string
  mandatory: boolean
}

export type ObservationDataEntry = {
  key?: EntityId | string
  value?: unknown
}

export type ObservationImage = {
  question?: EntityId
  image?: string | null
}

export type ObservationAdminValuesMap = Record<string, unknown>

export type ObservationAdminFieldMeta = {
  updated_at?: string | null
  updated_by?: string | null
}

export type ObservationAdminValueEntry = {
  key?: string
  field_key?: string
  fieldKey?: string
  value?: unknown
  values?: ObservationAdminValuesMap
  updated_at?: string | null
  updated_by?: string | null
}

export type ObservationRow = {
  id?: EntityId
  observation_id?: EntityId
  timestamp?: string | null
  geoposition?: string | null
  email_count?: number | null
  emailCount?: number | null
  creator_id?: EntityId | null
  creatorId?: EntityId | null
  data?: ObservationDataEntry[] | null
  images?: ObservationImage[] | null
  admin_values?: ObservationAdminValuesMap
  adminValues?: ObservationAdminValuesMap
  admin_fields_values?: ObservationAdminValuesMap
  adminFieldsValues?: ObservationAdminValuesMap
  admin_fields?: ObservationAdminValueEntry[] | ObservationAdminValuesMap | null
  adminFields?: ObservationAdminValueEntry[] | ObservationAdminValuesMap | null
  admin_field_meta?: Record<string, ObservationAdminFieldMeta>
  adminFieldMeta?: Record<string, ObservationAdminFieldMeta>
  [key: string]: unknown
}

export type ObservationResultsResponse = PaginatedResponse<ObservationRow>

export type ObservationCollection = ObservationRow[] | ObservationResultsResponse | null

export type FieldFormSummary = {
  id?: EntityId
  field_form_id?: EntityId
  project?: EntityId | { id?: EntityId; [key: string]: unknown } | null
  questions?: ObservationQuestion[] | unknown
  fields?: ObservationQuestion[] | unknown
  items?: ObservationQuestion[] | unknown
  questions_set?: ObservationQuestion[] | unknown
  [key: string]: unknown
}

export type FieldFormsResponse = FieldFormSummary[] | PaginatedResponse<FieldFormSummary>

export type ObservationAdminValuesIndex = {
  byId: Record<string, ObservationAdminValuesMap>
  bySignature: Record<string, ObservationAdminValuesMap>
  metaById: Record<string, Record<string, ObservationAdminFieldMeta>>
  metaBySignature: Record<string, Record<string, ObservationAdminFieldMeta>>
}

export type ObservationAdminValuesResponse =
  | Array<Record<string, unknown>>
  | PaginatedResponse<Record<string, unknown>>
  | { observations?: Array<Record<string, unknown>>; [key: string]: unknown }

export type ObservationAdminFieldsResponse =
  | { values?: ObservationAdminValuesMap; [key: string]: unknown }
  | ObservationRow

export type ObservationEmailLog = {
  id?: EntityId
  observation?: EntityId
  sent_by?: EntityId | null
  sent_by_username?: string | null
  created_at?: string | null
  updated_at?: string | null
  sent_at?: string | null
  status?: string | null
  subject?: string | null
  body?: string | null
  recipient?: string | null
  message?: string | null
  event?: string | null
  include_observation_data?: boolean | null
  payload?: Record<string, unknown>
}

export type ObservationEmailLogsResponse =
  | Array<Record<string, unknown>>
  | PaginatedResponse<Record<string, unknown>>
  | { results?: Array<Record<string, unknown>>; logs?: Array<Record<string, unknown>>; [key: string]: unknown }

export type SendObservationEmailPayload = {
  subject?: string
  include_observation_data: boolean
  intro_text?: string
  body?: string
  allow_reply?: boolean
}

export type ObservationSortKey =
  | { kind: 'builtin'; id: 'id' | 'timestamp' | 'geoposition' }
  | { kind: 'projectField'; id: number; key: string }
  | { kind: 'question'; id: number }

export type ObservationSortState = {
  key: ObservationSortKey
  dir: 'asc' | 'desc'
} | null
