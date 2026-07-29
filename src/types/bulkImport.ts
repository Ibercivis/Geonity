export type BulkJoinTarget = string

export type BulkJoinOption = {
  value: BulkJoinTarget
  label: string
}

export type BulkMapping = {
  csvCol: number
  pofKey: string
}

export type BulkProgress = {
  total: number
  done: number
  errors: number
}
