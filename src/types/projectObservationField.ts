export type ProjectObservationFieldType = 'bool' | 'choice' | 'mchoice' | 'number' | 'text' | string

export type ProjectObservationField = {
  id: number
  key: string
  label: string
  field_type: ProjectObservationFieldType
  required: boolean
  choices?: string[]
  order?: number
  help_text?: string
  public?: boolean
}

export type ProjectObservationFieldFormValues = {
  label: string
  fieldType: 'bool' | 'choice' | 'mchoice' | 'number' | 'text'
  required: boolean
  public: boolean
  order: string
  choicesText: string
  helpText: string
}
