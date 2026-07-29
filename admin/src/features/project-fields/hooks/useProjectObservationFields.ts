import * as React from 'react'

import {
  deleteProjectObservationFieldRequest,
  fetchProjectObservationFieldsCollection,
  fetchProjectObservationFieldsList,
  saveProjectObservationFieldRequest,
} from '@/lib/api/projectObservationFields'
import type { ProjectObservationField, ProjectObservationFieldFormValues } from '@/types/projectObservationField'

type AppToast = {
  title: string
  description?: string | null
  variant?: 'default' | 'destructive' | 'success'
}

function normalizeProjectObservationFields(data: unknown): ProjectObservationField[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)
      ? ((data as { results?: unknown[] }).results ?? [])
      : []

  const normalized = list
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const raw = item as Record<string, unknown>
      const id = typeof raw.id === 'number' ? raw.id : typeof raw.id === 'string' ? Number(raw.id) : NaN
      const key = typeof raw.key === 'string' ? raw.key : ''
      const label = typeof raw.label === 'string' ? raw.label : ''
      const field_type = typeof raw.field_type === 'string' ? raw.field_type : ''
      const required = Boolean(raw.required)
      const choices = Array.isArray(raw.choices) ? raw.choices.filter((choice): choice is string => typeof choice === 'string') : undefined
      const order = typeof raw.order === 'number' ? raw.order : typeof raw.order === 'string' ? Number(raw.order) : undefined
      const help_text = typeof raw.help_text === 'string' ? raw.help_text : undefined
      const isPublic = typeof raw.public === 'boolean' ? raw.public : undefined
      if (!Number.isFinite(id) || !key || !label || !field_type) return null
      return { id, key, label, field_type, required, choices, order, help_text, public: isPublic } as ProjectObservationField
    })
    .filter(Boolean) as ProjectObservationField[]

  return normalized.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label, 'es'))
}

export function useProjectObservationFields({
  authKey,
  selectedProjectId,
  canManageProjectObservationField,
  showToast,
}: {
  authKey: string | null
  selectedProjectId: string
  canManageProjectObservationField: boolean
  showToast: (toast: AppToast) => void
}) {
  const [projectObservationFields, setProjectObservationFields] = React.useState<ProjectObservationField[]>([])
  const [projectObservationFieldsCollectionPath, setProjectObservationFieldsCollectionPath] = React.useState<string | null>(null)
  const [editingProjectObservationFieldId, setEditingProjectObservationFieldId] = React.useState<number | null>(null)
  const [currentProjectObservationField, setCurrentProjectObservationField] = React.useState<ProjectObservationField | null>(null)
  const [isSavingProjectObservationField, setIsSavingProjectObservationField] = React.useState(false)
  const [saveProjectObservationFieldError, setSaveProjectObservationFieldError] = React.useState<string | null>(null)
  const [isColumnModalOpen, setIsColumnModalOpen] = React.useState(false)

  React.useEffect(() => {
    if (!authKey || !selectedProjectId) return
    const sessionKey = authKey

    let cancelled = false

    async function loadProjectObservationFields() {
      setProjectObservationFieldsCollectionPath(null)

      try {
        const { collectionPath, data } = await fetchProjectObservationFieldsCollection({
          projectId: selectedProjectId,
          sessionKey,
        })

        if (!cancelled) {
          setProjectObservationFieldsCollectionPath(collectionPath)
          setProjectObservationFields(normalizeProjectObservationFields(data))
        }
      } catch {
        if (!cancelled) {
          setProjectObservationFieldsCollectionPath(null)
          setProjectObservationFields([])
        }
      }
    }

    loadProjectObservationFields()
    return () => {
      cancelled = true
    }
  }, [authKey, selectedProjectId])

  const closeProjectObservationFieldModal = React.useCallback(() => {
    setEditingProjectObservationFieldId(null)
    setCurrentProjectObservationField(null)
    setSaveProjectObservationFieldError(null)
    setIsColumnModalOpen(false)
  }, [])

  const openProjectObservationFieldCreator = React.useCallback(() => {
    setEditingProjectObservationFieldId(null)
    setCurrentProjectObservationField(null)
    setSaveProjectObservationFieldError(null)
    setIsColumnModalOpen(true)
  }, [])

  const openProjectObservationFieldEditor = React.useCallback((field: ProjectObservationField) => {
    setEditingProjectObservationFieldId(field.id)
    setCurrentProjectObservationField(field)
    setSaveProjectObservationFieldError(null)
    setIsColumnModalOpen(true)
  }, [])

  const saveProjectObservationField = React.useCallback(async (values: ProjectObservationFieldFormValues) => {
    if (!authKey || !selectedProjectId) return
    if (!projectObservationFieldsCollectionPath) {
      setSaveProjectObservationFieldError('El endpoint de columnas no está disponible (404)')
      return
    }

    setIsSavingProjectObservationField(true)
    setSaveProjectObservationFieldError(null)

    try {
      const label = values.label.trim()
      const field_type = values.fieldType

      let key = currentProjectObservationField?.key?.trim() ?? ''
      if (!key && label) {
        key = label
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }

      if (!key) throw new Error('El campo "key" es obligatorio')
      if (!/^[a-z0-9_-]+$/.test(key)) throw new Error('"key" debe ser un slug (a-z, 0-9, _ o -)')
      if (!label) throw new Error('El campo "label" es obligatorio')

      let choices: string[] | undefined
      if (field_type === 'choice' || field_type === 'mchoice') {
        choices = values.choicesText.split(',').map((s) => s.trim()).filter(Boolean)
        if (!choices.length) throw new Error(`Para field_type="${field_type}", debes indicar choices (separadas por comas)`)
      }

      const order = values.order.trim() ? Number(values.order) : undefined
      if (values.order.trim() && !Number.isFinite(order)) throw new Error('"order" debe ser un número')

      const help_text = values.helpText.trim() ? values.helpText.trim() : undefined
      const isEdit = editingProjectObservationFieldId !== null
      if (!canManageProjectObservationField) {
        throw new Error(isEdit ? 'Solo el creador del proyecto puede editar columnas' : 'Solo el creador del proyecto puede crear columnas')
      }

      const endpointPath = isEdit
        ? `${projectObservationFieldsCollectionPath}${encodeURIComponent(String(editingProjectObservationFieldId))}/`
        : projectObservationFieldsCollectionPath

      const body: Record<string, unknown> = isEdit
        ? {
            label,
            field_type,
            required: values.required,
            order,
            help_text,
            public: values.public,
            ...(field_type === 'choice' || field_type === 'mchoice' ? { choices } : { choices: undefined }),
          }
        : {
            key,
            label,
            field_type,
            required: values.required,
            order,
            help_text,
            public: values.public,
            ...(field_type === 'choice' || field_type === 'mchoice' ? { choices } : {}),
          }

      await saveProjectObservationFieldRequest({
        endpointPath,
        method: isEdit ? 'PATCH' : 'POST',
        sessionKey: authKey,
        body,
      })

      const data = await fetchProjectObservationFieldsList({
        collectionPath: projectObservationFieldsCollectionPath,
        sessionKey: authKey,
      })
      if (data) {
        setProjectObservationFields(normalizeProjectObservationFields(data))
      }

      closeProjectObservationFieldModal()
      showToast({
        title: editingProjectObservationFieldId !== null ? 'Columna actualizada' : 'Columna creada',
        description: label,
        variant: 'success',
      })
    } catch (err) {
      setSaveProjectObservationFieldError(err instanceof Error ? err.message : 'Error inesperado guardando')
    } finally {
      setIsSavingProjectObservationField(false)
    }
  }, [
    authKey,
    canManageProjectObservationField,
    closeProjectObservationFieldModal,
    currentProjectObservationField?.key,
    editingProjectObservationFieldId,
    projectObservationFieldsCollectionPath,
    selectedProjectId,
    showToast,
  ])

  const deleteProjectObservationField = React.useCallback(async (id: number) => {
    if (!authKey || !selectedProjectId) return
    if (!canManageProjectObservationField) {
      showToast({ title: 'Acción no permitida', description: 'Solo el creador del proyecto puede eliminar columnas.', variant: 'destructive' })
      return
    }
    if (!projectObservationFieldsCollectionPath) {
      showToast({ title: 'Endpoint no disponible', description: 'El endpoint de columnas no está disponible (404).', variant: 'destructive' })
      return
    }
    if (!window.confirm('¿Eliminar esta columna?')) return

    try {
      const endpointPath = `${projectObservationFieldsCollectionPath}${encodeURIComponent(String(id))}/`
      await deleteProjectObservationFieldRequest({ endpointPath, sessionKey: authKey })

      setProjectObservationFields((prev) => prev.filter((f) => f.id !== id))
      if (editingProjectObservationFieldId === id) closeProjectObservationFieldModal()
      showToast({ title: 'Columna eliminada', description: 'La columna se ha eliminado correctamente.', variant: 'success' })
    } catch (err) {
      showToast({ title: 'Error eliminando columna', description: err instanceof Error ? err.message : 'Error inesperado eliminando', variant: 'destructive' })
    }
  }, [
    authKey,
    canManageProjectObservationField,
    closeProjectObservationFieldModal,
    editingProjectObservationFieldId,
    projectObservationFieldsCollectionPath,
    selectedProjectId,
    showToast,
  ])

  const clearProjectObservationFields = React.useCallback(() => {
    setProjectObservationFields([])
    setProjectObservationFieldsCollectionPath(null)
    closeProjectObservationFieldModal()
    setIsSavingProjectObservationField(false)
    setSaveProjectObservationFieldError(null)
  }, [closeProjectObservationFieldModal])

  return {
    projectObservationFields,
    projectObservationFieldsCollectionPath,
    editingProjectObservationFieldId,
    currentProjectObservationField,
    isSavingProjectObservationField,
    saveProjectObservationFieldError,
    isColumnModalOpen,
    closeProjectObservationFieldModal,
    openProjectObservationFieldCreator,
    openProjectObservationFieldEditor,
    saveProjectObservationField,
    deleteProjectObservationField,
    clearProjectObservationFields,
  }
}
