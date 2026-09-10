// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password1: string
  password2: string
  terms_version: string
  privacy_version: string
}

export interface AuthResponse {
  key: string
}

export interface User {
  pk: number
  email: string
  first_name: string
  last_name: string
  terms_accepted_at: string | null
  terms_version: string | null
  privacy_accepted_at: string | null
  privacy_version: string | null
  /** Platform staff. Only present on the "who am I" endpoint, never on user lists. */
  is_staff?: boolean
}

export interface UserProfile {
  pk?: number
  email?: string
  first_name: string
  last_name: string
  biography: string
  visibility: boolean
  country: string | { code: string; name: string }
  cover: string | null
}

// ─── Multilingual ─────────────────────────────────────────────────────────────

export type MultiLang = Record<string, string>
export type LocalizedString = string | MultiLang

// ─── Topic / Category ────────────────────────────────────────────────────────

export interface Topic {
  id: number
  topic: string
  project_count?: number
  icon?: string
}

// ─── Organization ────────────────────────────────────────────────────────────

export interface Organization {
  id: number
  principalName: string
  url?: string
  description: string
  contactName?: string
  contactMail?: string
  logo: string | null
  cover: string | null
  type?: number[]
  creator?: number
  administrators?: number[]
  members?: { id: number; name: string }[]
  is_global: boolean
  countries: string[]
  is_creator: boolean
  is_admin: boolean
  is_member?: boolean
  // legacy fallbacks
  principal_name?: string
  name?: string
  /** @deprecated use is_creator / is_admin */
  user_role?: string
}

export interface OrgInvitation {
  id: number
  email: string
  role: 'administrator' | 'member'
  status: 'pending' | 'accepted' | 'rejected' | { code: string; name: string }
  organization: number
  organization_name?: string
  invited_by?: number
  invited_by_name?: string
  created_at: string
  expires_at?: string
  is_expired?: boolean
}

export interface ProjectInvitation {
  id: number
  email: string
  status: 'pending' | 'accepted' | 'rejected' | { code: string; name: string }
  project: number
  project_name?: string
  invited_by?: number
  invited_by_name?: string
  created_at: string
  expires_at?: string
  is_expired?: boolean
}

export interface OrgMember {
  id: number
  user: number
  email: string
  first_name: string
  last_name: string
  role: 'administrator' | 'member'
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: number
  name: LocalizedString
  description: LocalizedString
  cover: string | { image: string } | { image: string }[] | null
  organizations: Organization[]
  total_likes: number
  likes_count?: number
  contributions?: number
  observation_count?: number
  is_liked_by_user: boolean
  topic: number[]
  is_creator: boolean
  is_admin: boolean
  is_member?: boolean
  has_observations: boolean
  post_observation_message: LocalizedString
  show_post_message?: boolean
  fuzzy: boolean
  is_fuzzy?: boolean
  fuzzy_resolution?: number
  field_form: number | null
  is_global: boolean
  countries: string[] | string
  is_private: boolean
  private_data?: boolean
  ended?: boolean
  allowed_platforms?: 'all' | 'mobile' | 'web'
  email_on_observation?: boolean
  /** Monthly project report to creator and admins. Defaults to true on the backend. */
  email_monthly_stats?: boolean
  /** First publication date (immutable, read-only). Null if never published. */
  published_at?: string | null
  draft?: boolean
  public_map?: boolean
  /** Anonymous (QR) contributions enabled. Mutually exclusive with is_private. */
  anonymous_contribution?: boolean
  /** Unguessable token used in the public /contribute/<token> URL. Read-only; regenerate via API. */
  anonymous_token?: string | null
  last_observation?: string | null
  created_at?: string
}

// ─── Field Form / Observation Fields ─────────────────────────────────────────

export type AnswerType =
  // Current API values
  | 'STR'
  | 'NUM'
  | 'DATE'
  | 'IMG'
  | 'CHOICE'
  | 'MCHOICE'
  | 'QR'
  | 'BARCODE'
  // Legacy (existing data)
  | 'INT'
  | 'FLOAT'
  | 'BOOL'
  | 'IMAGE'
  | 'FILE'

export interface FieldChoice {
  id?: number
  value: string
  label: LocalizedString
}

export interface ObservationQuestion {
  id: number
  question_text: LocalizedString
  answer_type: AnswerType
  mandatory: boolean
  choices: FieldChoice[]
  allow_other: boolean
  order: number
  question_help?: LocalizedString
}

export interface FieldForm {
  id: number
  name: LocalizedString
  questions: ObservationQuestion[]
}

// ─── Observation ─────────────────────────────────────────────────────────────

export interface ObservationDataEntry {
  key: string
  value: unknown
}

export interface AdminValue {
  key: string
  label: string
  value: unknown
}

export interface Observation {
  id: number
  geoposition: string
  latitude?: number
  longitude?: number
  created_at: string
  timestamp: string
  user_id?: number
  user?: number
  creator?: number
  field_form: number
  field_form_id?: number
  data: ObservationDataEntry[] | Record<string, unknown>
  images: (string | { id: number; image: string; question: number })[]
  admin_values: AdminValue[]
  is_mine: boolean
  /** True when submitted without an account (creator is null). */
  is_anonymous?: boolean
  /** Short prefix of the anonymous browser id, if the backend exposes it. */
  anonymous_id?: string | null
  description?: string
  project_id?: number
  project_name?: string
}

export interface HexObservation {
  hex: string
  count: number
}

// ─── Invitation ───────────────────────────────────────────────────────────────

export type InvitationType = 'project' | 'organization'

export interface Invitation {
  id: number
  type: InvitationType
  name: string
  projectId?: number
  organizationId?: number
  role?: 'administrator' | 'member'
  invitedBy?: string
  created_at: string
  expires_at?: string
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
