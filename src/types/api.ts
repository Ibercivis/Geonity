export type PaginatedResponse<T> = {
  results: T[]
  count?: number
  next?: string | null
  previous?: string | null
  [key: string]: unknown
}
